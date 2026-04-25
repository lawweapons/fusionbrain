"""Shared helpers for FusionBrain ingest scripts.

Two modes, auto-selected by env var:

  1. API mode (set FB_API_URL + INGEST_TOKEN):
     Sends raw chunks to the FusionBrain /api/ingest endpoint.
     The server handles embeddings and DB insert.
     Use this when running ingest from a non-server machine (residential IP)
     — avoids YouTube bot detection which blocks most VPS/cloud IPs.

  2. DB mode (set DATABASE_URL + VOYAGE_API_KEY):
     Embeds locally via Voyage API and writes directly to Postgres.
     Use this only when running on the FusionBrain VPS itself.
"""
from __future__ import annotations

import os
import time
from typing import Iterable, List, Optional, Sequence

import requests
from dotenv import load_dotenv

load_dotenv()

EMBED_BATCH = 128
VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"
VOYAGE_MODEL = "voyage-3-large"
VOYAGE_DIM = 1024


def chunk_by_words(text: str, size: int = 500, overlap: int = 75) -> List[str]:
    """Split a long string into overlapping word windows."""
    words = text.split()
    if not words:
        return []
    out: List[str] = []
    step = max(1, size - overlap)
    i = 0
    while i < len(words):
        out.append(" ".join(words[i : i + size]))
        if i + size >= len(words):
            break
        i += step
    return out


def fmt_timestamp(seconds: float) -> str:
    s = int(seconds)
    if s >= 3600:
        return f"{s // 3600}:{(s % 3600) // 60:02d}:{s % 60:02d}"
    return f"{s // 60}:{s % 60:02d}"


# ---------- API mode (recommended for most users) ----------

HTTP_BATCH = 100  # chunks per /api/ingest call (avoid request body size limits)


def _post_one_batch(
    base_url: str,
    token: str,
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    rows: List[dict],
) -> int:
    payload = {
        "source_type": source_type,
        "source_name": source_name,
        "source_url": source_url,
        "chunks": [
            {
                "text": r["text"],
                "chunk_index": r["chunk_index"],
                "source_ref": r.get("source_ref"),
                "metadata": r.get("metadata") or {},
            }
            for r in rows
        ],
    }
    last_err: Optional[str] = None
    for attempt in range(3):
        try:
            r = requests.post(
                f"{base_url}/api/ingest",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=600,
            )
        except requests.RequestException as e:
            last_err = str(e)
            time.sleep(2**attempt)
            continue
        if r.status_code == 200:
            return int(r.json().get("inserted_chunks", 0))
        if r.status_code >= 500:
            last_err = f"{r.status_code}: {r.text[:200]}"
            time.sleep(2**attempt)
            continue
        raise RuntimeError(f"/api/ingest failed {r.status_code}: {r.text[:300]}")
    raise RuntimeError(f"/api/ingest retries exhausted: {last_err}")


def _post_via_api(
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    rows: List[dict],
) -> int:
    """POST chunks in HTTP batches to avoid hitting request body size limits on
    the server. Server-side dedupe (UNIQUE on source_type+source_name+chunk_index)
    means re-runs are safe."""
    base_url = os.environ["FB_API_URL"].rstrip("/")
    token = os.environ["INGEST_TOKEN"]
    total = 0
    for i in range(0, len(rows), HTTP_BATCH):
        slab = rows[i : i + HTTP_BATCH]
        total += _post_one_batch(base_url, token, source_type, source_name, source_url, slab)
        if len(rows) > HTTP_BATCH:
            print(f"    posted {min(i + HTTP_BATCH, len(rows))}/{len(rows)} chunks")
    return total


# ---------- DB mode (server-side only) ----------

def _embed_batch(texts: Sequence[str], max_retries: int = 5) -> List[List[float]]:
    api_key = os.environ["VOYAGE_API_KEY"]
    if not texts:
        return []
    last_err: Optional[str] = None
    for attempt in range(max_retries):
        try:
            r = requests.post(
                VOYAGE_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "input": list(texts),
                    "model": VOYAGE_MODEL,
                    "input_type": "document",
                    "output_dimension": VOYAGE_DIM,
                },
                timeout=120,
            )
        except requests.RequestException as e:
            last_err = str(e)
            time.sleep(2**attempt)
            continue
        if r.status_code == 200:
            return [d["embedding"] for d in r.json()["data"]]
        if r.status_code in (429, 500, 502, 503, 504):
            time.sleep(2**attempt)
            last_err = f"{r.status_code}: {r.text[:200]}"
            continue
        raise RuntimeError(f"voyage error {r.status_code}: {r.text[:400]}")
    raise RuntimeError(f"voyage max retries exceeded: {last_err}")


def _vec_literal(v: Iterable[float]) -> str:
    return "[" + ",".join(f"{x:.7f}" for x in v) + "]"


def _insert_via_db(
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    rows: List[dict],
) -> int:
    import psycopg  # lazy import: not needed in API mode
    from psycopg.types.json import Json

    texts = [r["text"] for r in rows]
    embs: List[List[float]] = []
    total = len(texts)
    for i in range(0, total, EMBED_BATCH):
        slab = texts[i : i + EMBED_BATCH]
        embs.extend(_embed_batch(slab))
        print(f"  embedded {min(i + EMBED_BATCH, total)}/{total}")

    inserted = 0
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor() as cur:
            for r, emb in zip(rows, embs):
                cur.execute(
                    """
                    INSERT INTO chunks
                      (source_type, source_name, source_url, source_ref,
                       chunk_index, text, embedding, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::vector, %s)
                    ON CONFLICT (source_type, source_name, chunk_index) DO NOTHING
                    """,
                    (
                        source_type,
                        source_name,
                        source_url,
                        r.get("source_ref"),
                        r["chunk_index"],
                        r["text"],
                        _vec_literal(emb),
                        Json(r.get("metadata") or {}),
                    ),
                )
                inserted += cur.rowcount
        conn.commit()
    return inserted


# ---------- Public dispatcher ----------

def insert_chunks(
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    rows: List[dict],
) -> int:
    """Upload chunks. Chooses mode based on env vars.

    rows: [{chunk_index:int, text:str, source_ref?:str, metadata?:dict}]
    """
    if not rows:
        return 0
    if os.environ.get("FB_API_URL"):
        return _post_via_api(source_type, source_name, source_url, rows)
    return _insert_via_db(source_type, source_name, source_url, rows)

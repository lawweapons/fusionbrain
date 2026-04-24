"""Shared helpers for FusionBrain ingest scripts: chunking, embedding, DB insert."""
from __future__ import annotations

import os
import time
from typing import Iterable, List, Optional, Sequence

import psycopg
import requests
from dotenv import load_dotenv
from psycopg.types.json import Json

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]
VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]
VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"
VOYAGE_MODEL = "voyage-3-large"
VOYAGE_DIM = 1024
EMBED_BATCH = 128


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


def embed_batch(texts: Sequence[str], *, input_type: str = "document", max_retries: int = 5) -> List[List[float]]:
    if not texts:
        return []
    last_err: Optional[str] = None
    for attempt in range(max_retries):
        try:
            r = requests.post(
                VOYAGE_URL,
                headers={
                    "Authorization": f"Bearer {VOYAGE_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "input": list(texts),
                    "model": VOYAGE_MODEL,
                    "input_type": input_type,
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
            wait = 2**attempt
            print(f"  voyage {r.status_code}, retry in {wait}s")
            time.sleep(wait)
            last_err = f"{r.status_code}: {r.text[:200]}"
            continue
        raise RuntimeError(f"voyage error {r.status_code}: {r.text[:400]}")
    raise RuntimeError(f"voyage max retries exceeded: {last_err}")


def embed_all(texts: Sequence[str], *, batch: int = EMBED_BATCH) -> List[List[float]]:
    out: List[List[float]] = []
    total = len(texts)
    for i in range(0, total, batch):
        slab = list(texts[i : i + batch])
        out.extend(embed_batch(slab))
        print(f"  embedded {min(i + batch, total)}/{total}")
    return out


def _vec_literal(v: Iterable[float]) -> str:
    return "[" + ",".join(f"{x:.7f}" for x in v) + "]"


def insert_chunks(
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    rows: List[dict],
) -> int:
    """rows: [{chunk_index:int, text:str, source_ref?:str, metadata?:dict}].
    Embeddings are computed inside. ON CONFLICT DO NOTHING makes re-runs idempotent."""
    if not rows:
        return 0
    embs = embed_all([r["text"] for r in rows])
    inserted = 0
    with psycopg.connect(DB_URL) as conn:
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


def fmt_timestamp(seconds: float) -> str:
    s = int(seconds)
    if s >= 3600:
        return f"{s // 3600}:{(s % 3600) // 60:02d}:{s % 60:02d}"
    return f"{s // 60}:{s % 60:02d}"

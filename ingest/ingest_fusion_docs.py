"""Ingest Autodesk Fusion 360 official help docs into FusionBrain.

The Fusion help site is a JavaScript SPA, so a plain HTTP scraper hits an
empty shell. We use Firecrawl (which renders JS in the cloud) to crawl, then
ingest its JSON output.

Two-step workflow:

  1. Crawl with firecrawl CLI (run separately):
       firecrawl crawl "https://help.autodesk.com/view/fusion360/ENU/" \\
         --limit 200 --max-depth 3 \\
         --include-paths "/view/fusion360/ENU/" \\
         --delay 1500 --wait --pretty -o fusion-crawl.json

  2. Ingest the resulting JSON:
       python ingest_fusion_docs.py fusion-crawl.json

The script extracts each rendered page's markdown, chunks it, and inserts
with source_type='fusion_docs'.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import List

from common import chunk_by_words, insert_chunks


def _load_pages(path: Path) -> List[dict]:
    """firecrawl can output {data:[...]} or [...]. Handle both."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        return raw.get("data") or raw.get("results") or raw.get("pages") or []
    return []


def _extract(page: dict) -> tuple[str, str, str]:
    """Return (url, title, markdown) — best-effort across firecrawl response shapes."""
    md = page.get("markdown") or ""
    if not md:
        # Sometimes content is nested
        if isinstance(page.get("content"), str):
            md = page["content"]
    metadata = page.get("metadata") or {}
    url = page.get("url") or metadata.get("sourceURL") or metadata.get("url") or ""
    title = (
        metadata.get("title")
        or metadata.get("ogTitle")
        or metadata.get("description", "")[:80]
        or url.split("guid=", 1)[-1][:80]
        or "Fusion docs page"
    )
    return url, title, md


def ingest_page(url: str, title: str, md: str) -> int:
    rows: List[dict] = []
    for i, c in enumerate(chunk_by_words(md)):
        rows.append({
            "chunk_index": i,
            "text": f"[Fusion docs: {title}] {c}",
            "source_ref": None,
            "metadata": {"url": url, "title": title},
        })
    if not rows:
        return 0
    return insert_chunks(
        source_type="fusion_docs",
        source_name=title[:400],
        source_url=url or None,
        rows=rows,
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest firecrawl-crawl output of Autodesk Fusion docs")
    ap.add_argument("path", help="Path to firecrawl crawl JSON file (run firecrawl crawl first)")
    ap.add_argument("--min-chars", type=int, default=300, help="Skip pages shorter than this")
    args = ap.parse_args()

    p = Path(args.path)
    if not p.is_file():
        print(f"Not found: {p}", file=sys.stderr)
        return 2

    pages = _load_pages(p)
    print(f"Loaded {len(pages)} pages from {p.name}")

    total_inserted = 0
    skipped = 0
    for page in pages:
        url, title, md = _extract(page)
        if len(md) < args.min_chars:
            skipped += 1
            continue
        try:
            n = ingest_page(url, title, md)
            print(f"  ✓ {title[:70]}: {n} chunks")
            total_inserted += n
        except Exception as e:
            print(f"  ✗ {title[:70]}: {e}")
            skipped += 1

    print(f"\nDone. Inserted {total_inserted} chunks across {len(pages) - skipped} pages ({skipped} skipped).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

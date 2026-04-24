"""Ingest a folder of markdown files into FusionBrain.

Splits each document on headings first, then falls back to 500-word windows
within long sections.

Usage:
  python ingest_markdown.py /path/to/notes/
  python ingest_markdown.py notes.md
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import List, Tuple

from common import chunk_by_words, insert_chunks

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)


def split_sections(md: str) -> List[Tuple[str, str]]:
    """Returns [(heading, body)]. Leading text before any heading gets heading=''."""
    matches = list(HEADING_RE.finditer(md))
    if not matches:
        return [("", md.strip())]
    sections: List[Tuple[str, str]] = []
    # Preamble
    if matches[0].start() > 0:
        pre = md[: matches[0].start()].strip()
        if pre:
            sections.append(("", pre))
    for i, m in enumerate(matches):
        heading = m.group(2).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        body = md[start:end].strip()
        if body:
            sections.append((heading, body))
    return sections


def ingest_md(path: Path) -> int:
    print(f"\n▶ {path.name}")
    md = path.read_text(encoding="utf-8", errors="replace")
    sections = split_sections(md)

    rows: List[dict] = []
    chunk_idx = 0
    for heading, body in sections:
        pieces = chunk_by_words(body) if len(body.split()) > 500 else [body]
        for piece in pieces:
            if not piece.strip():
                continue
            prefix = f"[MD: {path.name}" + (f" · {heading}" if heading else "") + "] "
            rows.append({
                "chunk_index": chunk_idx,
                "text": prefix + piece,
                "source_ref": heading or None,
                "metadata": {"heading": heading},
            })
            chunk_idx += 1

    inserted = insert_chunks(
        source_type="markdown",
        source_name=path.name,
        source_url=None,
        rows=rows,
    )
    print(f"  ✓ inserted {inserted} chunks")
    return inserted


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest markdown file(s) into FusionBrain")
    ap.add_argument("path")
    args = ap.parse_args()

    p = Path(args.path)
    if p.is_file():
        files = [p]
    elif p.is_dir():
        files = sorted(p.rglob("*.md"))
    else:
        print(f"not found: {p}", file=sys.stderr)
        return 2

    total = 0
    for f in files:
        try:
            total += ingest_md(f)
        except Exception as e:
            print(f"  ✗ error on {f.name}: {e}")
    print(f"\nDone. Inserted {total} chunks across {len(files)} file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

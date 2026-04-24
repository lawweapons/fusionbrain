"""Ingest a folder of PDFs into FusionBrain.

Usage:
  python ingest_pdf.py /path/to/pdfs/
  python ingest_pdf.py /path/to/single.pdf

Skips scanned PDFs (text extraction < 100 chars/page) with a warning — OCR is v2.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List

from pypdf import PdfReader

from common import chunk_by_words, insert_chunks


def extract_pages(pdf_path: Path) -> List[str]:
    reader = PdfReader(str(pdf_path))
    return [(page.extract_text() or "").strip() for page in reader.pages]


def ingest_pdf(pdf_path: Path) -> int:
    print(f"\n▶ {pdf_path.name}")
    pages = extract_pages(pdf_path)
    if not pages:
        print("  ⚠ empty PDF, skipping")
        return 0

    total_chars = sum(len(p) for p in pages)
    avg_per_page = total_chars / max(1, len(pages))
    if avg_per_page < 100:
        print(f"  ⚠ likely scanned PDF (avg {avg_per_page:.0f} chars/page); skipping (OCR is v2)")
        return 0

    rows: List[dict] = []
    chunk_idx = 0
    for page_num, text in enumerate(pages, start=1):
        if not text:
            continue
        for c in chunk_by_words(text):
            rows.append({
                "chunk_index": chunk_idx,
                "text": f"[PDF: {pdf_path.name} p.{page_num}] {c}",
                "source_ref": f"p.{page_num}",
                "metadata": {"page": page_num},
            })
            chunk_idx += 1

    if not rows:
        print("  ⚠ no chunks produced")
        return 0

    inserted = insert_chunks(
        source_type="pdf",
        source_name=pdf_path.name,
        source_url=None,
        rows=rows,
    )
    print(f"  ✓ inserted {inserted} chunks across {len(pages)} pages")
    return inserted


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest PDF(s) into FusionBrain")
    ap.add_argument("path", help="path to a .pdf or a folder containing .pdf files")
    args = ap.parse_args()

    p = Path(args.path)
    if p.is_file():
        files = [p]
    elif p.is_dir():
        files = sorted(p.glob("*.pdf"))
    else:
        print(f"not found: {p}", file=sys.stderr)
        return 2

    total = 0
    for f in files:
        try:
            total += ingest_pdf(f)
        except Exception as e:
            print(f"  ✗ error on {f.name}: {e}")
    print(f"\nDone. Inserted {total} chunks across {len(files)} PDF(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

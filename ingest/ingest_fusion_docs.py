"""Ingest Autodesk Fusion 360 official help documentation.

Strategy: crawl from a seed URL within help.autodesk.com/view/fusion360/ENU/,
follow same-domain same-product links to depth --max-depth, extract main
content, convert to text, chunk, embed.

Usage:
  python ingest_fusion_docs.py \\
      --seed "https://help.autodesk.com/view/fusion360/ENU/" \\
      --max-pages 500 --max-depth 3

Be polite: --delay defaults to 1.0 second between requests.

This is intentionally simple. If it misses sections or over-fetches, tune
--max-depth and --include-path. Run it once, review `ingested_urls.txt`,
re-run with adjustments. Duplicates are handled by the DB UNIQUE constraint.
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from collections import deque
from pathlib import Path
from typing import List, Optional, Set
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from common import chunk_by_words, insert_chunks

DEFAULT_HEADERS = {
    "User-Agent": "FusionBrain/0.1 (personal knowledge assistant; +github.com/lawweapons/fusionbrain)"
}


def clean_page(html: str) -> tuple[str, str]:
    """Return (title, body_text). Strips nav/header/footer/script/style."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "noscript", "aside"]):
        tag.decompose()
    title = (soup.title.string if soup.title else "").strip() if soup.title else ""

    main = soup.find("main") or soup.find(id="content") or soup.find(class_="content") or soup.body
    if main is None:
        return title, ""
    text = main.get_text("\n", strip=True)
    # collapse lots of blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return title, text


def same_domain_links(html: str, base: str, include_path: Optional[str]) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    base_host = urlparse(base).netloc
    out: List[str] = []
    for a in soup.find_all("a", href=True):
        href = urljoin(base, a["href"]).split("#", 1)[0]
        u = urlparse(href)
        if u.netloc != base_host:
            continue
        if include_path and include_path not in u.path:
            continue
        out.append(href)
    return out


def crawl(
    seed: str,
    max_pages: int,
    max_depth: int,
    include_path: Optional[str],
    delay: float,
) -> List[tuple[str, str, str]]:
    """BFS crawl. Returns [(url, title, text)]."""
    seen: Set[str] = set()
    queue: deque[tuple[str, int]] = deque([(seed, 0)])
    results: List[tuple[str, str, str]] = []

    while queue and len(results) < max_pages:
        url, depth = queue.popleft()
        if url in seen:
            continue
        seen.add(url)
        try:
            r = requests.get(url, headers=DEFAULT_HEADERS, timeout=30)
        except requests.RequestException as e:
            print(f"  ✗ fetch failed {url}: {e}")
            continue
        if r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
            continue

        title, text = clean_page(r.text)
        if len(text) > 300:
            results.append((url, title, text))
            print(f"  [{len(results):4d}/{max_pages}] {title[:70]}")

        if depth < max_depth:
            for link in same_domain_links(r.text, url, include_path):
                if link not in seen:
                    queue.append((link, depth + 1))

        time.sleep(delay)

    return results


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest Autodesk Fusion help docs")
    ap.add_argument("--seed", default="https://help.autodesk.com/view/fusion360/ENU/")
    ap.add_argument("--max-pages", type=int, default=500)
    ap.add_argument("--max-depth", type=int, default=3)
    ap.add_argument(
        "--include-path", default="/view/fusion360/ENU/",
        help="only follow links whose path contains this string"
    )
    ap.add_argument("--delay", type=float, default=1.0)
    ap.add_argument("--log-file", default="ingested_urls.txt")
    args = ap.parse_args()

    print(f"Seeding crawl from {args.seed}")
    pages = crawl(args.seed, args.max_pages, args.max_depth, args.include_path, args.delay)
    print(f"\nFetched {len(pages)} pages. Chunking + embedding.")

    total_inserted = 0
    Path(args.log_file).write_text("\n".join(u for u, _, _ in pages), encoding="utf-8")

    for url, title, text in pages:
        name = title or url
        rows: List[dict] = []
        for i, c in enumerate(chunk_by_words(text)):
            rows.append({
                "chunk_index": i,
                "text": f"[Fusion docs: {name}] {c}",
                "source_ref": None,
                "metadata": {"url": url},
            })
        if rows:
            inserted = insert_chunks(
                source_type="fusion_docs",
                source_name=name[:400],
                source_url=url,
                rows=rows,
            )
            total_inserted += inserted

    print(f"\nDone. Inserted {total_inserted} chunks across {len(pages)} pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Ingest YouTube content (single video, playlist, or channel) into FusionBrain.

Uses yt-dlp to fetch auto-generated English subtitles as VTT, parses word-level
timestamps, and chunks transcripts into 500-word windows with 75-word overlap.
Each chunk carries its start timestamp so citations link to the exact moment.

Usage:
  python ingest_youtube.py "https://www.youtube.com/watch?v=VIDID"
  python ingest_youtube.py "https://www.youtube.com/@bradtallis8968/videos"
  python ingest_youtube.py "https://www.youtube.com/playlist?list=PL..."

Optional flags:
  --limit N       Stop after N videos (useful for testing)
  --out DIR       Directory to cache downloaded VTTs (default: ./transcripts)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Optional, Tuple

from common import chunk_by_words, fmt_timestamp, insert_chunks  # noqa: F401


def run_ytdlp_json(args: List[str]) -> dict:
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"yt-dlp failed ({res.returncode}): {res.stderr[:400]}")
    return json.loads(res.stdout)


def list_videos(url: str) -> List[dict]:
    """Return [{id, title, url}] for a video / playlist / channel URL."""
    data = run_ytdlp_json(["yt-dlp", "--flat-playlist", "-J", "--no-warnings", url])
    entries = data.get("entries") or []
    if not entries and data.get("id"):
        # single video
        return [{"id": data["id"], "title": data.get("title") or data["id"], "url": data.get("webpage_url") or url}]
    out: List[dict] = []
    for e in entries:
        if e.get("_type") == "playlist":
            # channel page returns nested playlists (Videos, Shorts, Live)
            for v in e.get("entries") or []:
                if v.get("id"):
                    out.append({
                        "id": v["id"],
                        "title": v.get("title") or v["id"],
                        "url": f"https://www.youtube.com/watch?v={v['id']}",
                    })
        elif e.get("id"):
            out.append({
                "id": e["id"],
                "title": e.get("title") or e["id"],
                "url": f"https://www.youtube.com/watch?v={e['id']}",
            })
    # Dedupe by id
    seen = set()
    unique: List[dict] = []
    for v in out:
        if v["id"] not in seen:
            seen.add(v["id"])
            unique.append(v)
    return unique


def download_subs(video_id: str, out_dir: Path) -> Optional[Path]:
    """Download auto-generated English VTT. Returns path or None if unavailable."""
    out_dir.mkdir(parents=True, exist_ok=True)
    url = f"https://www.youtube.com/watch?v={video_id}"
    subprocess.run(
        [
            "yt-dlp",
            "--skip-download",
            "--write-auto-subs",
            "--sub-lang", "en",
            "--sub-format", "vtt",
            "--no-warnings",
            "-o", str(out_dir / "%(id)s.%(ext)s"),
            url,
        ],
        capture_output=True, text=True,
    )
    for p in out_dir.glob(f"{video_id}*.vtt"):
        return p
    return None


TS_RE = re.compile(
    r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}"
)
TAG_RE = re.compile(r"<[^>]+>")


def parse_vtt(path: Path) -> List[Tuple[float, str]]:
    """Return [(start_seconds, cue_text)] with duplicates from rolling captions removed."""
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    cues: List[Tuple[float, str]] = []
    seen_text: set = set()
    i = 0
    while i < len(lines):
        m = TS_RE.match(lines[i])
        if not m:
            i += 1
            continue
        h, mm, s, ms = map(int, m.groups())
        start = h * 3600 + mm * 60 + s + ms / 1000.0
        i += 1
        body_parts: List[str] = []
        while i < len(lines) and lines[i].strip() != "":
            body_parts.append(lines[i])
            i += 1
        raw = " ".join(body_parts)
        cleaned = TAG_RE.sub("", raw)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if cleaned and cleaned not in seen_text:
            seen_text.add(cleaned)
            cues.append((start, cleaned))
        i += 1
    return cues


def chunk_transcript(
    cues: List[Tuple[float, str]], size: int = 500, overlap: int = 75
) -> List[dict]:
    """Token-level windowed chunks preserving the start timestamp of the first token."""
    words_ts: List[Tuple[float, str]] = []
    for start, cue in cues:
        for w in cue.split():
            words_ts.append((start, w))
    if not words_ts:
        return []
    chunks: List[dict] = []
    step = max(1, size - overlap)
    i = 0
    while i < len(words_ts):
        slab = words_ts[i : i + size]
        text = " ".join(w for _, w in slab)
        start_sec = slab[0][0]
        chunks.append({
            "chunk_index": len(chunks),
            "text": text,
            "source_ref": fmt_timestamp(start_sec),
            "metadata": {"start_seconds": round(start_sec, 2)},
        })
        if i + size >= len(words_ts):
            break
        i += step
    return chunks


def ingest_video(video: dict, out_dir: Path) -> int:
    """Returns number of chunks inserted."""
    vid = video["id"]
    title = video["title"]
    url = video["url"]
    print(f"\n▶ {title}  ({vid})")

    vtt = download_subs(vid, out_dir)
    if not vtt:
        print("  ⚠ no transcript available, skipping")
        return 0
    cues = parse_vtt(vtt)
    if not cues:
        print("  ⚠ transcript empty after parsing, skipping")
        return 0

    chunks = chunk_transcript(cues)
    if not chunks:
        print("  ⚠ no chunks produced, skipping")
        return 0

    # Prepend video title to each chunk text for retrieval context
    for c in chunks:
        c["text"] = f"[Video: {title}] {c['text']}"

    inserted = insert_chunks(
        source_type="youtube",
        source_name=title,
        source_url=url,
        rows=chunks,
    )
    print(f"  ✓ inserted {inserted} chunks (produced {len(chunks)})")
    return inserted


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest YouTube content into FusionBrain")
    ap.add_argument("url", help="video, playlist, or channel URL")
    ap.add_argument("--limit", type=int, default=None, help="stop after N videos")
    ap.add_argument("--out", default="transcripts", help="cache dir for VTT files")
    args = ap.parse_args()

    out_dir = Path(args.out)
    videos = list_videos(args.url)
    if args.limit:
        videos = videos[: args.limit]

    print(f"Found {len(videos)} video(s)")
    total = 0
    skipped = 0
    for v in videos:
        try:
            n = ingest_video(v, out_dir)
            total += n
            if n == 0:
                skipped += 1
        except Exception as e:
            print(f"  ✗ error on {v['id']}: {e}")
            skipped += 1

    print(
        f"\nDone. Inserted {total} chunks across {len(videos) - skipped} videos "
        f"({skipped} skipped)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

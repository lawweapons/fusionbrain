"""Ingest YouTube content (single video, playlist, or channel) into FusionBrain.

Fetches transcripts via youtube-transcript-api (a separate endpoint that's more
tolerant of automated access than yt-dlp's VTT download). Channel/playlist
enumeration uses yt-dlp's --flat-playlist.

Each transcript is chunked into 500-word windows with 75-word overlap, preserving
the start timestamp of the first word so citations link to the exact moment.

Usage:
  python ingest_youtube.py "https://www.youtube.com/watch?v=VIDID"
  python ingest_youtube.py "https://www.youtube.com/@bradtallis8968/videos"
  python ingest_youtube.py "https://www.youtube.com/playlist?list=PL..."

Optional flags:
  --limit N       Stop after N videos (useful for testing)
  --languages EN  Comma-separated transcript language prefs (default: en,en-US,en-GB)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from typing import List, Optional, Tuple

from common import fmt_timestamp, insert_chunks

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import (
        NoTranscriptFound,
        TranscriptsDisabled,
        VideoUnavailable,
        RequestBlocked,
    )
except ImportError as e:
    print(f"Install youtube-transcript-api: pip install youtube-transcript-api\n{e}", file=sys.stderr)
    sys.exit(2)


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
        return [{
            "id": data["id"],
            "title": data.get("title") or data["id"],
            "url": data.get("webpage_url") or url,
        }]
    out: List[dict] = []
    for e in entries:
        if e.get("_type") == "playlist":
            # channel page returns nested tabs (Videos, Shorts, Live)
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
    seen: set = set()
    unique: List[dict] = []
    for v in out:
        if v["id"] not in seen:
            seen.add(v["id"])
            unique.append(v)
    return unique


def fetch_transcript(video_id: str, languages: List[str]) -> Optional[List[Tuple[float, str]]]:
    """Returns [(start_seconds, text)] or None if unavailable."""
    api = YouTubeTranscriptApi()
    try:
        fetched = api.fetch(video_id, languages=languages)
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        return None
    except RequestBlocked as e:
        print(f"  ⚠ request blocked — YouTube has flagged this IP: {e}")
        return None
    except Exception as e:
        print(f"  ⚠ transcript fetch failed: {type(e).__name__} {e}")
        return None

    cues: List[Tuple[float, str]] = []
    for snippet in fetched:
        text = getattr(snippet, "text", "") or ""
        start = float(getattr(snippet, "start", 0.0) or 0.0)
        text = text.replace("\n", " ").strip()
        if text:
            cues.append((start, text))
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


def ingest_video(video: dict, languages: List[str]) -> int:
    vid = video["id"]
    title = video["title"]
    url = video["url"]
    print(f"\n▶ {title}  ({vid})")

    cues = fetch_transcript(vid, languages)
    if not cues:
        print("  ⚠ no transcript available, skipping")
        return 0

    chunks = chunk_transcript(cues)
    if not chunks:
        print("  ⚠ no chunks produced, skipping")
        return 0

    # Prepend video title to each chunk's text for retrieval context
    for c in chunks:
        c["text"] = f"[Video: {title}] {c['text']}"

    inserted = insert_chunks(
        source_type="youtube",
        source_name=title[:400],
        source_url=url,
        rows=chunks,
    )
    print(f"  ✓ inserted {inserted} chunks (produced {len(chunks)})")
    return inserted


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest YouTube content into FusionBrain")
    ap.add_argument("url", help="video, playlist, or channel URL")
    ap.add_argument("--limit", type=int, default=None, help="stop after N videos")
    ap.add_argument("--languages", default="en,en-US,en-GB", help="transcript language prefs")
    ap.add_argument("--sleep", type=float, default=1.0, help="seconds between videos (be polite)")
    args = ap.parse_args()

    languages = [s.strip() for s in args.languages.split(",") if s.strip()]

    videos = list_videos(args.url)
    if args.limit:
        videos = videos[: args.limit]

    print(f"Found {len(videos)} video(s)")
    total = 0
    skipped = 0
    for i, v in enumerate(videos):
        try:
            n = ingest_video(v, languages)
            total += n
            if n == 0:
                skipped += 1
        except Exception as e:
            print(f"  ✗ error on {v['id']}: {e}")
            skipped += 1
        if i < len(videos) - 1 and args.sleep > 0:
            time.sleep(args.sleep)

    print(
        f"\nDone. Inserted {total} chunks across {len(videos) - skipped} videos "
        f"({skipped} skipped)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

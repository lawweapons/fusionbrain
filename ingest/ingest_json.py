"""Ingest a JSON file of CAM parameter records into FusionBrain.

Expected shapes (auto-detected):
  1. A list of records:     [{...}, {...}, ...]
  2. A dict of records:     {"key1": {...}, "key2": {...}}
  3. A wrapper dict:        {"records": [...]} or {"items": [...]}

Each record becomes one chunk. The chunk text is a human-readable flattened form
of the record (key: value lines). Provide a --name to label the source.

Usage:
  python ingest_json.py cam_params.json --name "Haas mill CAM parameter set"
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, List

from common import insert_chunks


def flatten(obj: Any, prefix: str = "") -> List[str]:
    lines: List[str] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            if isinstance(v, (dict, list)):
                lines.extend(flatten(v, key))
            else:
                lines.append(f"{key}: {v}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            key = f"{prefix}[{i}]"
            if isinstance(v, (dict, list)):
                lines.extend(flatten(v, key))
            else:
                lines.append(f"{key}: {v}")
    else:
        lines.append(f"{prefix}: {obj}")
    return lines


def normalize(data: Any) -> List[Any]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("records", "items", "data", "entries"):
            if isinstance(data.get(key), list):
                return data[key]
        return [{"key": k, "value": v} for k, v in data.items()]
    return [data]


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest JSON records into FusionBrain")
    ap.add_argument("path")
    ap.add_argument("--name", required=True, help="human-readable source name")
    ap.add_argument("--source-url", default=None)
    args = ap.parse_args()

    p = Path(args.path)
    data = json.loads(p.read_text(encoding="utf-8"))
    records = normalize(data)

    rows: List[dict] = []
    for i, rec in enumerate(records):
        body = "\n".join(flatten(rec))
        if not body.strip():
            continue
        rows.append({
            "chunk_index": i,
            "text": f"[JSON: {args.name}]\n{body}",
            "source_ref": f"record {i}",
            "metadata": {"record_index": i},
        })

    inserted = insert_chunks(
        source_type="json",
        source_name=args.name,
        source_url=args.source_url,
        rows=rows,
    )
    print(f"Inserted {inserted} chunks from {p.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

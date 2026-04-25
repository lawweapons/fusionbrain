"""Bulk uploader for a drive of NC programs.

Walks a drive recursively, sends every *.nc to /api/admin/upload with the
relative path as the filename so source_name is unique per program. All
chunks get tagged with the machine name supplied on the command line.

Usage:
  PYTHONIOENCODING=utf-8 python bulk_ingest_drive.py --drive D:/ --machine "Haas Mini Mill"
  PYTHONIOENCODING=utf-8 python bulk_ingest_drive.py --drive E:/ --machine "Haas VF-2"
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

import requests

BASE_URL = "http://187.77.19.157:3100"
AUTH = ("robert", "21a360946923b63ea48a32d8e7a20721")
SKIP = {"4444.nc", "5555.nc", "5824.nc"}


def main() -> int:
    ap = argparse.ArgumentParser(description="Bulk-ingest NC programs from a drive into FusionBrain")
    ap.add_argument("--drive", default="D:/", help="root path to walk (default: D:/)")
    ap.add_argument(
        "--machine",
        default="Haas Mini Mill",
        help='machine name to tag every uploaded chunk with (e.g. "Haas VF-2")',
    )
    ap.add_argument("--exts", default="nc,tap,ngc,gcode,min,cnc", help="comma-separated extensions to ingest")
    args = ap.parse_args()

    drive = Path(args.drive)
    if not drive.is_dir():
        print(f"Not a directory: {drive}", file=sys.stderr)
        return 2
    exts = {f".{e.lower().lstrip('.')}" for e in args.exts.split(",")}

    print(f"Scanning {drive} for {sorted(exts)} (machine tag: {args.machine!r})")
    total_files = ok = err = skip = total_chunks = 0

    files_to_process = sorted(p for p in drive.rglob("*") if p.is_file() and p.suffix.lower() in exts)
    print(f"Found {len(files_to_process)} candidate file(s)\n")

    for nc_path in files_to_process:
        if nc_path.name.lower() in SKIP:
            skip += 1
            continue
        try:
            rel = str(nc_path.relative_to(drive)).replace("\\", "/")
        except Exception:
            rel = nc_path.name

        total_files += 1
        try:
            with open(nc_path, "rb") as f:
                r = requests.post(
                    f"{BASE_URL}/api/admin/upload",
                    auth=AUTH,
                    files={"files": (rel, f, "text/plain")},
                    data={"machine": args.machine},
                    timeout=300,
                )
            if r.status_code != 200:
                err += 1
                print(f"  HTTP {r.status_code}  {rel}")
                continue
            d = r.json()
            fr = (d.get("files") or [{}])[0]
            st = fr.get("status", "?")
            if st == "ok":
                chunks = fr.get("inserted_chunks", 0)
                ok += 1
                total_chunks += chunks
                print(f"  {chunks:3d} chunks  {rel}")
            else:
                err += 1
                print(f"  {st}  {rel}  -- {fr.get('message','')}")
        except Exception as e:
            err += 1
            print(f"  EXC  {rel}  {type(e).__name__}: {e}")

    print()
    print(f"files: {total_files} | ok: {ok} | err: {err} | skipped: {skip}")
    print(f"gcode chunks inserted: {total_chunks}")
    return 0 if err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

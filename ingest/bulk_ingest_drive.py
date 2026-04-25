"""One-shot bulk uploader for a drive of NC programs.

Usage:
  PYTHONIOENCODING=utf-8 python bulk_ingest_drive.py

Walks D:/ recursively, sends every *.nc to /api/admin/upload with the relative
path as the filename so source_name is unique per program.
"""
from __future__ import annotations
import sys
from pathlib import Path

import requests

BASE_URL = "http://187.77.19.157:3100"
AUTH = ("robert", "21a360946923b63ea48a32d8e7a20721")
SKIP = {"4444.nc", "5555.nc", "5824.nc"}
DRIVE = Path("D:/")
MACHINE_TAG = "Haas Mini Mill"  # all D-drive G-code is from this machine


def main() -> int:
    total_files = ok = err = skip = total_chunks = 0
    for nc_path in sorted(DRIVE.rglob("*.nc")):
        if nc_path.name.lower() in SKIP:
            skip += 1
            continue
        try:
            rel = str(nc_path.relative_to(DRIVE)).replace("\\", "/")
        except Exception:
            rel = nc_path.name

        total_files += 1
        try:
            with open(nc_path, "rb") as f:
                r = requests.post(
                    f"{BASE_URL}/api/admin/upload",
                    auth=AUTH,
                    files={"files": (rel, f, "text/plain")},
                    data={"machine": MACHINE_TAG},
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

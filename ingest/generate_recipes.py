"""Turn every Fusion CAM export (.fb.json) into a reusable, teachable CAM recipe.

Posts each export to the server's /api/admin/generate-recipe endpoint (which
authors the recipe with Claude using the VPS-side API key and ingests it as a
`cam_recipe` source), then saves the returned markdown locally under
reference/cam-recipes/ so it lives in the repo too.

Usage:
  PYTHONIOENCODING=utf-8 python generate_recipes.py
  PYTHONIOENCODING=utf-8 python generate_recipes.py --dir "C:/path/to/exports"
  PYTHONIOENCODING=utf-8 python generate_recipes.py --only "flashlight cap"
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import requests

BASE_URL = "http://187.77.19.157:3100"
AUTH = ("robert", "21a360946923b63ea48a32d8e7a20721")
DEFAULT_DIR = Path.home() / "OneDrive" / "Documents" / "fusion-cam-exports"
OUT_DIR = Path(__file__).resolve().parent.parent / "reference" / "cam-recipes"


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate CAM recipes from Fusion exports")
    ap.add_argument("--dir", default=str(DEFAULT_DIR), help="folder of .fb.json exports")
    ap.add_argument("--only", default=None, help="only process files whose name contains this substring")
    ap.add_argument("--machine", default=None, help="optional machine tag for these recipes")
    args = ap.parse_args()

    src = Path(args.dir)
    if not src.is_dir():
        print(f"Not a directory: {src}", file=sys.stderr)
        return 2
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(src.glob("*.fb.json"))
    if args.only:
        files = [f for f in files if args.only.lower() in f.name.lower()]
    if not files:
        print("No matching .fb.json files.")
        return 1

    print(f"Generating recipes for {len(files)} file(s)\n")
    ok = skipped = errored = 0
    for f in files:
        print(f"▶ {f.name}")
        try:
            with open(f, "rb") as fh:
                form = {"file": (f.name, fh, "application/json")}
                data = {"machine": args.machine} if args.machine else {}
                r = requests.post(
                    f"{BASE_URL}/api/admin/generate-recipe",
                    auth=AUTH,
                    files=form,
                    data=data,
                    timeout=300,
                )
            if r.status_code == 422:
                print(f"  ⊘ skipped — {r.json().get('error', 'no operations')}")
                skipped += 1
                continue
            if r.status_code != 200:
                print(f"  ✗ HTTP {r.status_code}: {r.text[:200]}")
                errored += 1
                continue
            resp = r.json()
            md = resp.get("recipe_markdown", "")
            out_path = OUT_DIR / (f.name.replace(".fb.json", "").replace(".json", "") + ".md")
            out_path.write_text(md, encoding="utf-8")
            print(
                f"  ✓ {resp.get('op_count')} ops → {resp.get('inserted_chunks')} recipe chunks "
                f"(saved {out_path.name})"
            )
            ok += 1
        except Exception as e:
            print(f"  ✗ error: {e}")
            errored += 1

    print(f"\nDone. {ok} recipes generated, {skipped} skipped (no ops), {errored} errored.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

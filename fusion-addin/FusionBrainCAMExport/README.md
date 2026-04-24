# FusionBrainCAMExport

A small Fusion 360 script that exports every CAM operation from the active document to a JSON file. Pair it with `ingest/ingest_fusion_cam.py` to feed your proven feeds-and-speeds into FusionBrain.

## What it captures

For every Setup → every Operation:
- Operation name, strategy, comment, status flags
- Tool: type, parameters (description, diameter, flutes, material, coating, holder)
- All operation parameters (RPM, cutting feed, plunge feed, ramp feed, axial depth, stepover, coolant, tolerance, stock-to-leave, etc.)
- Setup parameters (stock dimensions, WCS, etc.)

Everything is captured generically — the script doesn't try to interpret parameter names, just dumps them. The ingest script renders them into searchable text.

## Install

1. In Fusion: **Tools → Scripts and Add-ins** (or Shift+S)
2. **Scripts** tab → click the **+** ("Create New Script")
3. **From Existing** → browse to `fusion-addin/FusionBrainCAMExport/FusionBrainCAMExport.py`
4. The script appears in the "My Scripts" list

## Run

1. Open the document you want to export. Switch to the **Manufacture** workspace.
2. **Tools → Scripts and Add-ins → Scripts → FusionBrainCAMExport → Run**
3. Save the `.fb.json` file when prompted

## Output

A JSON file with every setup/op/tool. See `ingest_fusion_cam.py` for how it gets ingested.

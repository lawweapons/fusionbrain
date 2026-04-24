"""Ingest FusionBrain CAM exports (.fb.json) into FusionBrain.

Each .fb.json is produced by the FusionBrainCAMExport Fusion script.
Each operation becomes one chunk — feeds/speeds/tools fully searchable.

Usage:
  python ingest_fusion_cam.py /path/to/folder/of/exports/
  python ingest_fusion_cam.py single.fb.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from common import insert_chunks


# Curated list of CAM parameter names worth surfacing prominently.
# (Fusion has hundreds of internal names; these are the high-signal ones.)
KEY_OP_PARAMS: List[tuple[str, str]] = [
    ("tool_spindleSpeed", "Spindle RPM"),
    ("tool_surfaceSpeed", "Surface speed"),
    ("tool_rampSpindleSpeed", "Ramp RPM"),
    ("tool_feedCutting", "Cutting feed"),
    ("tool_feedPerTooth", "Feed per tooth"),
    ("tool_feedEntry", "Entry feed"),
    ("tool_feedExit", "Exit feed"),
    ("tool_feedRamp", "Ramp feed"),
    ("tool_feedPlunge", "Plunge feed"),
    ("tool_feedLeadIn", "Lead-in feed"),
    ("tool_feedLeadOut", "Lead-out feed"),
    ("tool_feedTransition", "Transition feed"),
    ("tool_coolant", "Coolant"),
    ("maximumStepdown", "Max axial depth (DOC)"),
    ("stepdown", "Axial depth (DOC)"),
    ("stepover", "Radial stepover"),
    ("optimalLoad", "Optimal load (adaptive)"),
    ("tolerance", "Tolerance"),
    ("stockToLeave", "Stock to leave"),
    ("axialStockToLeave", "Axial stock to leave"),
    ("radialStockToLeave", "Radial stock to leave"),
    ("rampType", "Ramp type"),
    ("operationType", "Operation type"),
]

KEY_TOOL_PARAMS: List[tuple[str, str]] = [
    ("tool_description", "Description"),
    ("tool_type", "Type"),
    ("tool_diameter", "Diameter"),
    ("tool_cornerRadius", "Corner radius"),
    ("tool_taperAngle", "Taper angle"),
    ("tool_fluteLength", "Flute length"),
    ("tool_shoulderLength", "Shoulder length"),
    ("tool_bodyLength", "Body length"),
    ("tool_overallLength", "Overall length"),
    ("tool_numberOfFlutes", "Flutes"),
    ("tool_material", "Cutter material"),
    ("tool_coating", "Coating"),
    ("tool_vendor", "Vendor"),
    ("tool_productId", "Product ID"),
    ("tool_holderDescription", "Holder"),
    ("tool_holderProductId", "Holder product ID"),
    ("tool_unit", "Tool unit"),
]


def _fmt(entry: Optional[Dict[str, Any]]) -> Optional[str]:
    """Render a {value, expression, unit} parameter dict as 'expression unit' or 'value unit'."""
    if not entry:
        return None
    if "expression" in entry and entry["expression"]:
        return str(entry["expression"]).strip()
    val = entry.get("value")
    if val is None:
        return None
    unit = entry.get("unit")
    return f"{val} {unit}".strip() if unit else str(val)


def render_tool(tool: Optional[Dict[str, Any]]) -> str:
    if not tool:
        return "Tool: (unknown)"
    params = tool.get("parameters") or {}
    lines = ["Tool:"]
    for key, label in KEY_TOOL_PARAMS:
        v = _fmt(params.get(key))
        if v is not None and v != "":
            lines.append(f"  {label}: {v}")
    if len(lines) == 1:
        # No known params — dump first 8 raw to give the LLM something
        for k, v in list(params.items())[:8]:
            rendered = _fmt(v)
            if rendered:
                lines.append(f"  {k}: {rendered}")
    return "\n".join(lines)


def render_operation(doc: str, setup_name: str, op: Dict[str, Any]) -> str:
    name = op.get("name") or "Operation"
    strat = op.get("strategy") or ""
    comment = op.get("comment") or ""
    op_params = op.get("parameters") or {}

    head = f"[Fusion CAM] {doc} / {setup_name}\nOperation: {name}"
    if strat:
        head += f" ({strat})"
    if comment:
        head += f"\nNotes: {comment}"

    op_lines = ["Cutting parameters:"]
    for key, label in KEY_OP_PARAMS:
        v = _fmt(op_params.get(key))
        if v is not None and v != "":
            op_lines.append(f"  {label}: {v}")
    if len(op_lines) == 1:
        for k, v in list(op_params.items())[:12]:
            rendered = _fmt(v)
            if rendered:
                op_lines.append(f"  {k}: {rendered}")

    return f"{head}\n{render_tool(op.get('tool'))}\n\n{chr(10).join(op_lines)}"


def render_setup_context(setup: Dict[str, Any]) -> str:
    """Optional setup-level chunk: stock material/dims, WCS, machine."""
    name = setup.get("name") or "Setup"
    sp = setup.get("parameters") or {}
    interesting = [
        "job_stockMaterial", "stockMaterial",
        "job_stockMode", "stockMode",
        "job_stockOffsetSides", "job_stockOffsetTop", "job_stockOffsetBottom",
        "job_stockSide", "job_stockTop", "job_stockBottom",
        "wcs",
    ]
    lines = []
    for key in interesting:
        v = _fmt(sp.get(key))
        if v is not None and v != "":
            lines.append(f"  {key}: {v}")
    if not lines:
        return ""
    return f"[Fusion CAM Setup] {name}\nSetup parameters:\n" + "\n".join(lines)


def ingest_file(path: Path) -> int:
    print(f"\n▶ {path.name}")
    data = json.loads(path.read_text(encoding="utf-8"))
    doc = data.get("document") or path.stem
    setups = data.get("setups") or []

    rows: List[dict] = []
    chunk_idx = 0

    for setup in setups:
        setup_name = setup.get("name") or "Setup"
        ctx_text = render_setup_context(setup)
        if ctx_text:
            rows.append({
                "chunk_index": chunk_idx,
                "text": ctx_text,
                "source_ref": setup_name,
                "metadata": {"document": doc, "setup": setup_name, "kind": "setup_context"},
            })
            chunk_idx += 1

        for op in setup.get("operations") or []:
            if "error" in op:
                continue
            text = render_operation(doc, setup_name, op)
            tool_params = (op.get("tool") or {}).get("parameters") or {}
            metadata = {
                "document": doc,
                "setup": setup_name,
                "operation": op.get("name"),
                "strategy": op.get("strategy"),
                "kind": "operation",
                "tool_diameter": (tool_params.get("tool_diameter") or {}).get("value"),
                "tool_flutes": (tool_params.get("tool_numberOfFlutes") or {}).get("value"),
                "spindle_rpm": ((op.get("parameters") or {}).get("tool_spindleSpeed") or {}).get("value"),
            }
            rows.append({
                "chunk_index": chunk_idx,
                "text": text,
                "source_ref": f"{setup_name} / {op.get('name')}",
                "metadata": metadata,
            })
            chunk_idx += 1

    if not rows:
        print("  ⚠ no operations found in file")
        return 0

    inserted = insert_chunks(
        source_type="fusion_cam",
        source_name=doc[:400],
        source_url=None,
        rows=rows,
    )
    print(f"  ✓ inserted {inserted} chunks ({len(rows)} produced)")
    return inserted


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest Fusion CAM export(s) into FusionBrain")
    ap.add_argument("path", help="path to a .fb.json or a folder of them")
    args = ap.parse_args()

    p = Path(args.path)
    if p.is_file():
        files = [p]
    elif p.is_dir():
        files = sorted(p.rglob("*.fb.json"))
    else:
        print(f"not found: {p}", file=sys.stderr)
        return 2

    if not files:
        print("No .fb.json files found.")
        return 1

    total = 0
    for f in files:
        try:
            total += ingest_file(f)
        except Exception as e:
            print(f"  ✗ error on {f.name}: {e}")

    print(f"\nDone. Inserted {total} chunks across {len(files)} file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

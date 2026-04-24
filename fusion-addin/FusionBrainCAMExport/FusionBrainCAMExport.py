"""FusionBrainCAMExport — exports all CAM operation data from the active Fusion
document to a JSON file that FusionBrain's ingest_fusion_cam.py can consume.

Captures every setup, every operation, every tool, every parameter (RPM, feeds,
DOC, stepover, etc.). Defensive: skips parameters that error out instead of
failing the whole export.

Run in Fusion: Tools → Scripts and Add-ins → Scripts → select FusionBrainCAMExport → Run.
The Manufacture (CAM) workspace must be active.
"""
import adsk.core
import adsk.cam
import adsk.fusion
import json
import traceback
from datetime import datetime, timezone


def _safe_param_dict(parameters_collection):
    """Convert a CAMParameters collection into a {name: {value, expression, unit}} dict."""
    out = {}
    if parameters_collection is None:
        return out
    try:
        count = parameters_collection.count
    except Exception:
        return out
    for i in range(count):
        try:
            p = parameters_collection.item(i)
            entry = {}
            try:
                entry["expression"] = p.expression
            except Exception:
                pass
            try:
                v = p.value
                if v is not None:
                    entry["value"] = v
            except Exception:
                pass
            try:
                if p.unit:
                    entry["unit"] = p.unit
            except Exception:
                pass
            if entry:
                out[p.name] = entry
        except Exception:
            continue
    return out


def _safe_attr(obj, name, default=None):
    try:
        return getattr(obj, name)
    except Exception:
        return default


def serialize_tool(tool):
    if tool is None:
        return None
    out = {
        "id": _safe_attr(tool, "id"),
        "type": _safe_attr(tool, "type"),
        "unit": _safe_attr(tool, "unit"),
    }
    try:
        out["parameters"] = _safe_param_dict(tool.parameters)
    except Exception:
        out["parameters"] = {}
    # Top-level convenience fields if present
    try:
        out["preset_count"] = tool.presets.count
    except Exception:
        pass
    return out


def serialize_operation(op):
    data = {
        "name": _safe_attr(op, "name"),
        "operation_id": _safe_attr(op, "operationId"),
        "strategy": _safe_attr(op, "strategy"),
        "is_optional": _safe_attr(op, "isOptional"),
        "is_suppressed": _safe_attr(op, "isSuppressed"),
        "has_warning": _safe_attr(op, "hasWarning"),
        "is_valid": _safe_attr(op, "isValid"),
        "comment": _safe_attr(op, "notes"),
    }
    try:
        data["parameters"] = _safe_param_dict(op.parameters)
    except Exception as e:
        data["parameters_error"] = str(e)
    try:
        data["tool"] = serialize_tool(op.tool)
    except Exception as e:
        data["tool_error"] = str(e)
    return data


def serialize_setup(setup):
    data = {
        "name": _safe_attr(setup, "name"),
        "operation_type": _safe_attr(setup, "operationType"),
        "program_name": _safe_attr(setup, "programName"),
        "program_comment": _safe_attr(setup, "programComment"),
    }
    try:
        data["parameters"] = _safe_param_dict(setup.parameters)
    except Exception:
        data["parameters"] = {}

    ops = []
    try:
        for i in range(setup.operations.count):
            try:
                ops.append(serialize_operation(setup.operations.item(i)))
            except Exception as e:
                ops.append({"error": str(e), "trace": traceback.format_exc()})
    except Exception as e:
        ops.append({"error": f"could not iterate operations: {e}"})
    data["operations"] = ops
    return data


def run(_context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        product = app.activeProduct
        if not isinstance(product, adsk.cam.CAM):
            ui.messageBox(
                "Switch to the MANUFACTURE workspace first (Workspaces dropdown → Manufacture). "
                "This script reads CAM data and needs the active product to be CAM.",
                "FusionBrain CAM Export",
            )
            return

        cam = adsk.cam.CAM.cast(product)
        doc = app.activeDocument
        doc_name = doc.name

        setups = []
        for i in range(cam.setups.count):
            try:
                setups.append(serialize_setup(cam.setups.item(i)))
            except Exception as e:
                setups.append({"error": str(e)})

        result = {
            "fusionbrain_export_version": 1,
            "document": doc_name,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "setup_count": len(setups),
            "setups": setups,
        }

        # Save dialog
        dlg = ui.createFileDialog()
        dlg.title = "Save FusionBrain CAM export"
        dlg.filter = "FusionBrain JSON (*.fb.json)"
        safe = "".join(c if c.isalnum() or c in "._- " else "_" for c in doc_name)
        dlg.initialFilename = f"{safe}.fb.json"
        if dlg.showSave() != adsk.core.DialogResults.DialogOK:
            return
        out_path = dlg.filename

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, default=str)

        op_count = sum(len(s.get("operations", [])) if isinstance(s, dict) else 0 for s in setups)
        ui.messageBox(
            f"Done.\n\nDocument: {doc_name}\nSetups: {len(setups)}\nOperations: {op_count}\n\nSaved to:\n{out_path}",
            "FusionBrain CAM Export",
        )
    except Exception:
        msg = f"FusionBrain CAM Export failed:\n\n{traceback.format_exc()}"
        if ui:
            ui.messageBox(msg, "FusionBrain CAM Export — Error")
        else:
            print(msg)

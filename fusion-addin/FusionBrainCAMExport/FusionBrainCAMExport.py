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
import os
import traceback
from datetime import datetime, timezone
from pathlib import Path


def _default_export_dir() -> str:
    """Return a default folder for .fb.json files. Tries OneDrive Documents first
    (Robert's setup), falls back to Documents, then home. Creates the folder."""
    home = Path.home()
    candidates = [
        home / "OneDrive" / "Documents" / "fusion-cam-exports",
        home / "Documents" / "fusion-cam-exports",
        home / "fusion-cam-exports",
    ]
    for c in candidates:
        try:
            c.mkdir(parents=True, exist_ok=True)
            return str(c)
        except Exception:
            continue
    return str(home)


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


def _safe_filename(name: str) -> str:
    return "".join(c if c.isalnum() or c in "._- " else "_" for c in name)


def _build_export(cam, doc_name: str) -> dict:
    setups = []
    for i in range(cam.setups.count):
        try:
            setups.append(serialize_setup(cam.setups.item(i)))
        except Exception as e:
            setups.append({"error": str(e)})
    return {
        "fusionbrain_export_version": 1,
        "document": doc_name,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "setup_count": len(setups),
        "setups": setups,
    }


def _docs_with_cam(app):
    """Yield (document, cam_product) for every open document that has CAM data."""
    out = []
    for i in range(app.documents.count):
        doc = app.documents.item(i)
        cam = None
        try:
            for j in range(doc.products.count):
                p = doc.products.item(j)
                if isinstance(p, adsk.cam.CAM):
                    cam = p
                    break
        except Exception:
            pass
        if cam:
            out.append((doc, cam))
    return out


def _export_single(ui, cam, doc_name: str) -> tuple[int, str]:
    """Single-doc flow: prompt for save filename. Returns (operation_count, path)."""
    result = _build_export(cam, doc_name)
    dlg = ui.createFileDialog()
    dlg.title = "Save FusionBrain CAM export"
    dlg.filter = "FusionBrain JSON (*.fb.json)"
    default_dir = _default_export_dir()
    dlg.initialDirectory = default_dir
    dlg.initialFilename = f"{_safe_filename(doc_name)}.fb.json"
    if dlg.showSave() != adsk.core.DialogResults.DialogOK:
        return -1, ""
    out_path = dlg.filename
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, default=str)
    op_count = sum(len(s.get("operations", [])) if isinstance(s, dict) else 0 for s in result["setups"])
    return op_count, out_path


def _export_batch(ui, app, docs_with_cam) -> str:
    """Batch flow: prompt for an output folder, write one .fb.json per doc."""
    folder_dlg = ui.createFolderDialog()
    folder_dlg.title = "Pick folder to save all .fb.json files"
    folder_dlg.initialDirectory = _default_export_dir()
    if folder_dlg.showDialog() != adsk.core.DialogResults.DialogOK:
        return ""
    out_dir = folder_dlg.folder

    summary_lines = []
    total_ops = 0
    written = 0
    for doc, cam in docs_with_cam:
        try:
            doc.activate()  # ensure CAM data is loaded
        except Exception:
            pass
        try:
            result = _build_export(cam, doc.name)
            ops = sum(len(s.get("operations", [])) if isinstance(s, dict) else 0 for s in result["setups"])
            path = f"{out_dir}/{_safe_filename(doc.name)}.fb.json"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, default=str)
            summary_lines.append(f"  {doc.name}: {ops} operations")
            total_ops += ops
            written += 1
        except Exception as e:
            summary_lines.append(f"  {doc.name}: FAILED — {e}")

    return (
        f"Exported {written} document(s) to:\n{out_dir}\n\n"
        f"Total operations: {total_ops}\n\n" + "\n".join(summary_lines)
    )


def run(_context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface

        docs = _docs_with_cam(app)
        active_doc = app.activeDocument

        if not docs:
            ui.messageBox(
                "No open documents have CAM (Manufacture) data. "
                "Open one or more F3D files that contain CAM setups and try again.",
                "FusionBrain CAM Export",
            )
            return

        # Single doc → simple flow
        if len(docs) == 1:
            doc, cam = docs[0]
            ops, path = _export_single(ui, cam, doc.name)
            if ops < 0:
                return
            ui.messageBox(
                f"Done.\n\nDocument: {doc.name}\nOperations: {ops}\n\nSaved to:\n{path}",
                "FusionBrain CAM Export",
            )
            return

        # Multiple docs → ask user
        active_has_cam = any(d.name == active_doc.name for d, _ in docs) if active_doc else False
        choice = ui.messageBox(
            f"Found {len(docs)} open document(s) with CAM data.\n\n"
            "YES = Export ALL of them to one folder.\n"
            "NO = Export only the active document.\n"
            "CANCEL = Abort.",
            "FusionBrain CAM Export — Batch?",
            adsk.core.MessageBoxButtonTypes.YesNoCancelButtonType,
            adsk.core.MessageBoxIconTypes.QuestionIconType,
        )
        if choice == adsk.core.DialogResults.DialogCancel:
            return

        if choice == adsk.core.DialogResults.DialogYes:
            summary = _export_batch(ui, app, docs)
            if summary:
                ui.messageBox(summary, "FusionBrain CAM Export — Batch Done")
            return

        # NO → just the active doc
        target = next(((d, c) for d, c in docs if active_has_cam and d.name == active_doc.name), None)
        if not target:
            ui.messageBox(
                "Active document has no CAM data. Switch to a CAM document first.",
                "FusionBrain CAM Export",
            )
            return
        doc, cam = target
        ops, path = _export_single(ui, cam, doc.name)
        if ops < 0:
            return
        ui.messageBox(
            f"Done.\n\nDocument: {doc.name}\nOperations: {ops}\n\nSaved to:\n{path}",
            "FusionBrain CAM Export",
        )
    except Exception:
        msg = f"FusionBrain CAM Export failed:\n\n{traceback.format_exc()}"
        if ui:
            ui.messageBox(msg, "FusionBrain CAM Export — Error")
        else:
            print(msg)

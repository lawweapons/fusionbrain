import type { PreparedChunk } from "../chunk";

// Mirror of ingest/ingest_fusion_cam.py — keep these tables in sync.
const KEY_OP_PARAMS: Array<[string, string]> = [
  ["tool_spindleSpeed", "Spindle RPM"],
  ["tool_surfaceSpeed", "Surface speed"],
  ["tool_rampSpindleSpeed", "Ramp RPM"],
  ["tool_feedCutting", "Cutting feed"],
  ["tool_feedPerTooth", "Feed per tooth"],
  ["tool_feedEntry", "Entry feed"],
  ["tool_feedExit", "Exit feed"],
  ["tool_feedRamp", "Ramp feed"],
  ["tool_feedPlunge", "Plunge feed"],
  ["tool_feedLeadIn", "Lead-in feed"],
  ["tool_feedLeadOut", "Lead-out feed"],
  ["tool_feedTransition", "Transition feed"],
  ["tool_coolant", "Coolant"],
  ["maximumStepdown", "Max axial depth (DOC)"],
  ["stepdown", "Axial depth (DOC)"],
  ["stepover", "Radial stepover"],
  ["optimalLoad", "Optimal load (adaptive)"],
  ["tolerance", "Tolerance"],
  ["stockToLeave", "Stock to leave"],
  ["axialStockToLeave", "Axial stock to leave"],
  ["radialStockToLeave", "Radial stock to leave"],
  ["rampType", "Ramp type"],
  ["operationType", "Operation type"],
];

const KEY_TOOL_PARAMS: Array<[string, string]> = [
  ["tool_description", "Description"],
  ["tool_type", "Type"],
  ["tool_diameter", "Diameter"],
  ["tool_cornerRadius", "Corner radius"],
  ["tool_taperAngle", "Taper angle"],
  ["tool_fluteLength", "Flute length"],
  ["tool_shoulderLength", "Shoulder length"],
  ["tool_bodyLength", "Body length"],
  ["tool_overallLength", "Overall length"],
  ["tool_numberOfFlutes", "Flutes"],
  ["tool_material", "Cutter material"],
  ["tool_coating", "Coating"],
  ["tool_vendor", "Vendor"],
  ["tool_productId", "Product ID"],
  ["tool_holderDescription", "Holder"],
  ["tool_holderProductId", "Holder product ID"],
  ["tool_unit", "Tool unit"],
];

interface ParamEntry {
  expression?: string;
  value?: unknown;
  unit?: string;
}

function fmt(entry: ParamEntry | undefined): string | null {
  if (!entry) return null;
  if (entry.expression && String(entry.expression).trim()) return String(entry.expression).trim();
  if (entry.value === undefined || entry.value === null) return null;
  return entry.unit ? `${entry.value} ${entry.unit}`.trim() : String(entry.value);
}

interface FusionTool {
  parameters?: Record<string, ParamEntry>;
}
interface FusionOp {
  name?: string;
  strategy?: string;
  comment?: string;
  parameters?: Record<string, ParamEntry>;
  tool?: FusionTool;
  error?: string;
}
interface FusionSetup {
  name?: string;
  parameters?: Record<string, ParamEntry>;
  operations?: FusionOp[];
}
export interface FusionCamExport {
  document?: string;
  setups?: FusionSetup[];
}

function renderTool(tool?: FusionTool): string {
  if (!tool) return "Tool: (unknown)";
  const params = tool.parameters ?? {};
  const lines = ["Tool:"];
  for (const [key, label] of KEY_TOOL_PARAMS) {
    const v = fmt(params[key]);
    if (v) lines.push(`  ${label}: ${v}`);
  }
  if (lines.length === 1) {
    for (const [k, v] of Object.entries(params).slice(0, 8)) {
      const r = fmt(v);
      if (r) lines.push(`  ${k}: ${r}`);
    }
  }
  return lines.join("\n");
}

function renderOperation(doc: string, setupName: string, op: FusionOp): string {
  const name = op.name || "Operation";
  const strat = op.strategy || "";
  const comment = op.comment || "";
  const params = op.parameters ?? {};

  let head = `[Fusion CAM] ${doc} / ${setupName}\nOperation: ${name}`;
  if (strat) head += ` (${strat})`;
  if (comment) head += `\nNotes: ${comment}`;

  const lines = ["Cutting parameters:"];
  for (const [key, label] of KEY_OP_PARAMS) {
    const v = fmt(params[key]);
    if (v) lines.push(`  ${label}: ${v}`);
  }
  if (lines.length === 1) {
    for (const [k, v] of Object.entries(params).slice(0, 12)) {
      const r = fmt(v);
      if (r) lines.push(`  ${k}: ${r}`);
    }
  }
  return `${head}\n${renderTool(op.tool)}\n\n${lines.join("\n")}`;
}

function renderSetupContext(setup: FusionSetup): string | null {
  const sp = setup.parameters ?? {};
  const interesting = [
    "job_stockMaterial", "stockMaterial",
    "job_stockMode", "stockMode",
    "job_stockOffsetSides", "job_stockOffsetTop", "job_stockOffsetBottom",
    "job_stockSide", "job_stockTop", "job_stockBottom",
    "wcs",
  ];
  const lines: string[] = [];
  for (const k of interesting) {
    const v = fmt(sp[k]);
    if (v) lines.push(`  ${k}: ${v}`);
  }
  if (!lines.length) return null;
  return `[Fusion CAM Setup] ${setup.name ?? "Setup"}\nSetup parameters:\n${lines.join("\n")}`;
}

export interface FusionCamParseResult {
  source_name: string;
  chunks: PreparedChunk[];
  setups: number;
  operations: number;
}

export function parseFusionCamJson(data: FusionCamExport, fallbackName: string): FusionCamParseResult {
  const doc = data.document || fallbackName;
  const setups = data.setups || [];

  const chunks: PreparedChunk[] = [];
  let chunkIdx = 0;
  let opCount = 0;

  for (const setup of setups) {
    const setupName = setup.name || "Setup";
    const ctx = renderSetupContext(setup);
    if (ctx) {
      chunks.push({
        chunk_index: chunkIdx++,
        text: ctx,
        source_ref: setupName,
        metadata: { document: doc, setup: setupName, kind: "setup_context" },
      });
    }
    for (const op of setup.operations || []) {
      if (op.error) continue;
      opCount++;
      const text = renderOperation(doc, setupName, op);
      const tp = op.tool?.parameters ?? {};
      chunks.push({
        chunk_index: chunkIdx++,
        text,
        source_ref: `${setupName} / ${op.name ?? ""}`,
        metadata: {
          document: doc,
          setup: setupName,
          operation: op.name,
          strategy: op.strategy,
          kind: "operation",
          tool_diameter: tp["tool_diameter"]?.value,
          tool_flutes: tp["tool_numberOfFlutes"]?.value,
          spindle_rpm: op.parameters?.["tool_spindleSpeed"]?.value,
        },
      });
    }
  }

  return {
    source_name: doc.slice(0, 400),
    chunks,
    setups: setups.length,
    operations: opCount,
  };
}

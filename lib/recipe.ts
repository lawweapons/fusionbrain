import Anthropic from "@anthropic-ai/sdk";
import type { FusionCamExport } from "./parsers/fusion_cam";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// Recipes are authored by the strongest model — this is a one-time, high-value transform.
const RECIPE_MODEL = process.env.ANSWER_MODEL ?? "claude-sonnet-4-6";

interface ParamEntry {
  expression?: string;
  value?: unknown;
  unit?: string;
}

/** Expression-first formatter. The `value` field in exports is polluted with
 * class reprs, so we trust `expression`. */
function fmt(entry: ParamEntry | undefined): string | null {
  if (!entry) return null;
  if (entry.expression && String(entry.expression).trim()) {
    // Strip wrapping quotes Fusion puts around string params: "'carbide'" -> carbide
    return String(entry.expression).trim().replace(/^'(.*)'$/, "$1");
  }
  if (entry.value === undefined || entry.value === null) return null;
  // Skip the known-garbage class-repr values
  if (typeof entry.value === "string" && entry.value.startsWith("<class ")) return null;
  return entry.unit ? `${entry.value} ${entry.unit}`.trim() : String(entry.value);
}

// Params that are mode flags / licensing noise, not machining intent.
const SKIP_PARAMS = new Set([
  "advancedMode", "betaMode", "alphaMode", "isXpress", "licenseMultiaxis",
  "license3D", "metric", "isAssemblyDocument", "isOperationTemplate",
  "operation_description", "strategy",
]);

function dumpParams(params: Record<string, ParamEntry> | undefined, indent: string): string[] {
  if (!params) return [];
  const lines: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (SKIP_PARAMS.has(k)) continue;
    const f = fmt(v);
    if (f !== null && f !== "" && f !== "false" && f !== "true") {
      lines.push(`${indent}${k}: ${f}`);
    } else if (f === "true") {
      lines.push(`${indent}${k}: true`);
    }
  }
  return lines;
}

/** Build a complete, compact text digest of a CAM program for the recipe author. */
export function buildDigest(data: FusionCamExport): string {
  const doc = data.document || "Unknown document";
  const setups = data.setups || [];
  const lines: string[] = [`DOCUMENT: ${doc}`, `SETUPS: ${setups.length}`, ""];

  for (let si = 0; si < setups.length; si++) {
    const s = setups[si];
    lines.push(`=== SETUP ${si + 1}: ${s.name ?? "Setup"} ===`);
    const setupParams = dumpParams(s.parameters as Record<string, ParamEntry>, "  ");
    if (setupParams.length) {
      lines.push("  [setup params]");
      lines.push(...setupParams);
    }
    const ops = s.operations || [];
    lines.push(`  OPERATIONS: ${ops.length}`);
    for (let oi = 0; oi < ops.length; oi++) {
      const op = ops[oi];
      if (op.error) continue;
      lines.push("");
      lines.push(`  --- OP ${oi + 1}: ${op.name ?? "Operation"} [strategy: ${op.strategy ?? "?"}] ---`);
      if (op.comment) lines.push(`    notes: ${op.comment}`);
      const tool = op.tool?.parameters as Record<string, ParamEntry> | undefined;
      if (tool) {
        lines.push("    [tool]");
        lines.push(...dumpParams(tool, "      "));
      }
      lines.push("    [cutting params]");
      lines.push(...dumpParams(op.parameters as Record<string, ParamEntry>, "      "));
    }
    lines.push("");
  }
  return lines.join("\n");
}

const RECIPE_SYSTEM = `You are a senior CAM programmer documenting a machinist's PROVEN, validated Fusion 360 CAM program so it can be reused as a reference recipe. You will be given a structured digest of every setup, operation, tool, and parameter extracted from a real Fusion document.

Your job: produce a clean, dense Markdown "CAM recipe" that another machinist (or an AI assistant) could follow to reproduce or adapt this program. This is reference documentation of what ACTUALLY WORKED — not a tutorial, not speculation.

Rules:
- Use ONLY values present in the digest. Never invent feeds, speeds, depths, or tools. If something isn't in the digest, omit it — do not guess.
- Convert raw parameter names into plain machinist language (tool_spindleSpeed → Spindle RPM; maximumStepdown → Max axial DOC; optimalLoad → Optimal load; stockToLeave → Stock to leave).
- Identify the material and machine if derivable from the document name or tool library; otherwise say "not specified in export."
- Surface the PATTERNS: what spindle speed is used across ops, what the plunge-feed convention is, which heights/stock-offset conventions repeat. Call out deliberate overrides.
- Note the operation FLOW per setup (the order and why: rough → finish → chamfer, etc.).

Output this exact structure:

# CAM Recipe: {document name}

## Summary
2-3 sentences: what kind of part, material (if known), machine (if known), setup count, total operations, the overall strategy.

## Tools used
A markdown table: Tool # | Description | Geometry (dia, flutes, type, material) | Typical cutting feed | Used for.

## House rules (conventions held across operations)
Bullet the values that repeat across most/all ops: spindle speed, plunge feed convention, coolant, clearance/retract/feed heights, stock offsets, WCS orientation. Note deliberate exceptions.

## Setup-by-setup
For each setup: stock info, WCS, then a numbered operation flow. For each operation give: strategy, tool, and the key cutting values (RPM, cut feed, plunge, DOC, stepover/optimal load, stock-to-leave, tolerance, ramp type) — only those present in the digest.

## Patterns & gotchas
3-6 bullets: the non-obvious things — deliberate feed overrides, bulk-leave passes, tight optimal loads used as finishing, through-cut bottom offsets, anything a machinist adapting this should NOT blindly copy (e.g. "12k RPM is for aluminum only").

## How to adapt this for a new part
A short checklist for reusing this recipe on a similar part: confirm material/machine match, which tools map to which feature types, what transfers vs. what must be recomputed.

Keep it tight and factual. Bold tool names and key values. This document will be embedded and retrieved later, so be information-dense.`;

export async function authorRecipe(data: FusionCamExport): Promise<string> {
  const digest = buildDigest(data);
  const doc = data.document || "Unknown document";
  const resp = await client().messages.create({
    model: RECIPE_MODEL,
    max_tokens: 4000,
    temperature: 0.1,
    system: RECIPE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Here is the extracted CAM program digest for "${doc}". Author the reusable CAM recipe.\n\n${digest}`,
      },
    ],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

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

// Curated, high-signal parameters for the digest. Dumping ALL params bloats the
// digest past the org's 30k-input-tokens/min rate limit on large programs, so we
// send only the machining-relevant fields.
const KEY_OP: Array<[string, string]> = [
  ["tool_spindleSpeed", "RPM"], ["tool_surfaceSpeed", "SFM"], ["tool_rampSpindleSpeed", "rampRPM"],
  ["tool_feedCutting", "cutFeed"], ["tool_feedPerTooth", "feed/tooth"], ["tool_feedPlunge", "plunge"],
  ["tool_feedRamp", "rampFeed"], ["tool_feedLeadIn", "leadIn"], ["tool_feedEntry", "entry"],
  ["tool_coolant", "coolant"], ["maximumStepdown", "maxDOC"], ["stepdown", "DOC"],
  ["stepover", "stepover"], ["optimalLoad", "optimalLoad"], ["tolerance", "tol"],
  ["stockToLeave", "stockToLeave"], ["axialStockToLeave", "axialStock"], ["radialStockToLeave", "radialStock"],
  ["rampType", "ramp"], ["rampTaperAngle", "rampAngle"], ["direction", "dir"],
  ["bottomHeight_offset", "bottomZoff"], ["clearanceHeight_offset", "clearOff"],
  ["retractHeight_offset", "retractOff"], ["numberOfStepovers", "threadPasses"],
  ["threadPitch", "pitch"], ["compensationType", "comp"],
];
const KEY_TOOL: Array<[string, string]> = [
  ["tool_description", "desc"], ["tool_type", "type"], ["tool_diameter", "dia"],
  ["tool_cornerRadius", "CR"], ["tool_taperAngle", "taper"], ["tool_fluteLength", "FL"],
  ["tool_numberOfFlutes", "flutes"], ["tool_material", "mat"], ["tool_coating", "coating"],
  ["tool_vendor", "vendor"], ["tool_productId", "pid"], ["tool_number", "T#"],
  ["tool_holderDescription", "holder"],
];

function dumpKeyParams(
  params: Record<string, ParamEntry> | undefined,
  keys: Array<[string, string]>,
  indent: string
): string[] {
  if (!params) return [];
  const parts: string[] = [];
  for (const [k, label] of keys) {
    const f = fmt(params[k]);
    if (f !== null && f !== "" && f !== "false") parts.push(`${label}=${f}`);
  }
  return parts.length ? [`${indent}${parts.join(", ")}`] : [];
}

const SETUP_KEYS: Array<[string, string]> = [
  ["job_stockMaterial", "material"], ["wcs", "wcs"], ["job_stockMode", "stockMode"],
  ["job_stockFixedX", "stockX"], ["job_stockFixedY", "stockY"], ["job_stockFixedZ", "stockZ"],
  ["job_stockOffsetMode", "offsetMode"],
];

// Backstop so a single call never blows the 30k-input-token/min rate limit.
// ~50k chars ≈ 13k tokens, leaving headroom for the system prompt.
const MAX_DIGEST_CHARS = 50_000;

/** Build a compact, high-signal text digest of a CAM program for the recipe author. */
export function buildDigest(data: FusionCamExport): string {
  const doc = data.document || "Unknown document";
  const setups = data.setups || [];
  const lines: string[] = [`DOCUMENT: ${doc}`, `SETUPS: ${setups.length}`, ""];

  for (let si = 0; si < setups.length; si++) {
    const s = setups[si];
    lines.push(`=== SETUP ${si + 1}: ${s.name ?? "Setup"} ===`);
    const setupParams = dumpKeyParams(s.parameters as Record<string, ParamEntry>, SETUP_KEYS, "  ");
    if (setupParams.length) lines.push(...setupParams);
    const ops = s.operations || [];
    lines.push(`  OPERATIONS: ${ops.length}`);
    for (let oi = 0; oi < ops.length; oi++) {
      const op = ops[oi];
      if (op.error) continue;
      lines.push(`  OP ${oi + 1}: ${op.name ?? "Operation"} [${op.strategy ?? "?"}]`);
      if (op.comment) lines.push(`    notes: ${op.comment}`);
      const tool = op.tool?.parameters as Record<string, ParamEntry> | undefined;
      const toolLine = dumpKeyParams(tool, KEY_TOOL, "    tool: ");
      if (toolLine.length) lines.push(...toolLine);
      const cutLine = dumpKeyParams(op.parameters as Record<string, ParamEntry>, KEY_OP, "    cut:  ");
      if (cutLine.length) lines.push(...cutLine);
    }
    lines.push("");
  }
  let digest = lines.join("\n");
  if (digest.length > MAX_DIGEST_CHARS) {
    digest =
      digest.slice(0, MAX_DIGEST_CHARS) +
      "\n\n[... digest truncated — program is large; recipe covers the operations shown above ...]";
  }
  return digest;
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function authorRecipe(data: FusionCamExport): Promise<string> {
  const digest = buildDigest(data);
  const doc = data.document || "Unknown document";

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
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
    } catch (e) {
      const err = e as { status?: number; headers?: Record<string, string> };
      const isRateLimit = err.status === 429 || err.status === 529;
      if (!isRateLimit || attempt === maxAttempts - 1) throw e;
      // Respect retry-after if present, else exponential backoff (rate limit is per-minute)
      const retryAfter = Number(err.headers?.["retry-after"]);
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000 + 1000
        : Math.min(60_000, 15_000 * (attempt + 1));
      await sleep(waitMs);
    }
  }
  throw new Error("authorRecipe: exhausted retries");
}

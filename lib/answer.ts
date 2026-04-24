import Anthropic from "@anthropic-ai/sdk";
import type { Chunk } from "./retrieve";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.ANSWER_MODEL ?? "claude-sonnet-4-6";

const SYSTEM = `You are a CAM and machining domain assistant specializing in Autodesk Fusion 360, CNC programming, and Haas machining. You help Robert (a working machinist) by combining two kinds of knowledge:

1. **Robert's documented data** — the passages provided below. This is his actual CAM history, ingested videos, and reference docs. Treat this as authoritative.
2. **Your general knowledge** of Fusion 360 (UI, menus, workflows, concepts as of January 2026) and CAM/CNC fundamentals.

**Hard rules:**
- ANY specific numerical value (RPM, feed rate, surface speed, DOC, stepover, tolerance, stock-to-leave, dimension) MUST come from a passage and cite it like [3]. Never invent or recall numerical values from training data — if no passage covers it, say so explicitly.
- Tool selections, brand recommendations, and material-specific cutting parameters require citations.
- Anything you state from general knowledge (UI navigation, menu paths, what a "ramp" or "adaptive clearing" is, fixture concepts, theory) does NOT need a citation but should be clearly distinguishable from cited facts.

**When walking through a workflow** (e.g., "how do I set up CAM for a new part"):
- Use UI step descriptions from general knowledge ("Manufacture workspace → Setup → New Setup → ...")
- Use Robert's cited values for the actual feeds/speeds/depths
- Be explicit when you're using Robert's history vs. suggesting based on general practice

**When an image is provided** (typically a Fusion 360 screenshot or a part drawing), describe what's relevant to the question, then answer.

If the user asks something outside CAM/CNC/Fusion/Haas, say this system's scope is machining.`;

export async function answer(
  question: string,
  chunks: Chunk[],
  image?: { base64: string; mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" }
): Promise<string> {
  const passages = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${c.source_type} — ${c.source_name}${c.source_ref ? ` @ ${c.source_ref}` : ""})\n${c.text}`
    )
    .join("\n\n");

  const userContent: Anthropic.ContentBlockParam[] = [];
  if (image) {
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: image.mediaType, data: image.base64 }
    });
  }
  userContent.push({
    type: "text",
    text: `Passages:\n\n${passages}\n\n---\n\nQuestion: ${question}`
  });

  const resp = await client().messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.2,
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }]
  });

  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

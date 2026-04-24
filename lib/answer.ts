import Anthropic from "@anthropic-ai/sdk";
import type { Chunk } from "./retrieve";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.ANSWER_MODEL ?? "claude-sonnet-4-6";

const SYSTEM = `You are a CAM and machining domain assistant specializing in Autodesk Fusion, CNC programming, and Haas machining. You answer ONLY using the provided passages. If the passages do not contain the answer, say so explicitly — do not use outside knowledge. Every factual claim must reference the passage number in brackets like [2]. Be concise and technical.

If an image is provided (typically a Fusion 360 screenshot or a photo of a setup), describe only what is needed to interpret the question, then answer grounded in the passages. If the image shows something the passages don't cover, say so rather than guessing.

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

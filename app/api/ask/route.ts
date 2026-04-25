import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "@/lib/retrieve";
import { answer } from "@/lib/answer";
import { rewriteQuery } from "@/lib/rewrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_IMG_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
type AllowedImgType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface AskBody {
  question?: string;
  top_k?: number;
  filter_types?: string[];
  image?: string; // legacy single-image (data URL: data:image/png;base64,...)
  images?: string[]; // multiple data URLs
  history?: HistoryTurn[]; // prior conversation turns for context (oldest → newest)
}

function parseDataUrl(s: string): { base64: string; mediaType: AllowedImgType } | null {
  if (!s.startsWith("data:")) return null;
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  if (!ALLOWED_IMG_TYPES.has(m[1])) return null;
  return { mediaType: m[1] as AllowedImgType, base64: m[2] };
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = (await req.json()) as AskBody;
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const topK = Math.min(Math.max(body.top_k ?? 10, 1), 30);
    const filterTypes =
      Array.isArray(body.filter_types) && body.filter_types.length > 0
        ? body.filter_types
        : undefined;

    const imagePayloads: { base64: string; mediaType: AllowedImgType }[] = [];
    if (Array.isArray(body.images)) {
      for (const u of body.images) {
        if (typeof u !== "string") continue;
        const parsed = parseDataUrl(u);
        if (parsed) imagePayloads.push(parsed);
      }
    }
    if (imagePayloads.length === 0 && typeof body.image === "string") {
      const parsed = parseDataUrl(body.image);
      if (parsed) imagePayloads.push(parsed);
    }

    // Build prior-turn messages for Claude. The latest user turn (passages +
    // images + question) is appended later inside answer().
    const historyMessages: Anthropic.MessageParam[] = [];
    if (Array.isArray(body.history)) {
      for (const turn of body.history) {
        if (!turn || (turn.role !== "user" && turn.role !== "assistant")) continue;
        if (turn.role === "user") {
          const content: Anthropic.ContentBlockParam[] = [];
          if (Array.isArray(turn.images)) {
            for (let i = 0; i < turn.images.length; i++) {
              const parsed = parseDataUrl(turn.images[i]);
              if (parsed) {
                if (turn.images.length > 1) {
                  content.push({ type: "text", text: `Image ${i + 1}:` });
                }
                content.push({
                  type: "image",
                  source: { type: "base64", media_type: parsed.mediaType, data: parsed.base64 },
                });
              }
            }
          }
          if (turn.content) content.push({ type: "text", text: turn.content });
          if (content.length > 0) historyMessages.push({ role: "user", content });
        } else if (turn.content) {
          historyMessages.push({ role: "assistant", content: turn.content });
        }
      }
    }

    // For follow-up questions, augment the search query with the last user turn
    // so retrieval can find context for ambiguous references like "the other one".
    const lastUserTurn = body.history?.slice().reverse().find((t) => t.role === "user");
    const searchInput =
      historyMessages.length > 0 && lastUserTurn?.content
        ? `${lastUserTurn.content}\n\n${question}`
        : question;

    // Step 1: rewrite the query (fix typos, expand abbreviations, detect intent + jobs)
    const rewritten = await rewriteQuery(searchInput);

    // Walkthroughs benefit from more context (specific job + general theory blends well)
    const effectiveTopK = rewritten.intent === "walkthrough" ? Math.max(topK, 18) : topK;

    // Step 2: hybrid retrieval — vector search + keyword search on detected job names
    const chunks = await retrieve({
      searchQuery: rewritten.search_query,
      keywordTerms: rewritten.keyword_terms,
      topK: effectiveTopK,
      filterTypes,
    });

    if (chunks.length === 0) {
      return NextResponse.json({
        answer:
          "No passages found in the knowledge base. Either the question is outside scope, or the content hasn't been ingested yet.",
        citations: [],
        retrieved_chunk_ids: [],
        latency_ms: Date.now() - t0,
        rewritten,
      });
    }

    // Step 3: answer with intent-aware system prompt (walkthrough mode is more structured)
    const ans = await answer(question, chunks, rewritten.intent, imagePayloads, historyMessages);

    const citations = chunks.map((c, i) => ({
      n: i + 1,
      source_type: c.source_type,
      source_name: c.source_name,
      source_url: c.source_url,
      source_ref: c.source_ref,
      metadata: c.metadata ?? {},
      text_excerpt: c.text.length > 320 ? c.text.slice(0, 320) + "…" : c.text,
      similarity: Number(c.similarity.toFixed(3))
    }));

    return NextResponse.json({
      answer: ans,
      citations,
      retrieved_chunk_ids: chunks.map((c) => c.id),
      latency_ms: Date.now() - t0,
      rewritten,
    });
  } catch (e) {
    console.error("/api/ask error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

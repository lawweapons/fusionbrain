import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "@/lib/retrieve";
import { answer } from "@/lib/answer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_IMG_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

interface AskBody {
  question?: string;
  top_k?: number;
  filter_types?: string[];
  image?: string; // data URL: data:image/png;base64,...
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

    let imagePayload: { base64: string; mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" } | undefined;
    if (body.image?.startsWith("data:")) {
      const m = body.image.match(/^data:([^;]+);base64,(.+)$/);
      if (m && ALLOWED_IMG_TYPES.has(m[1])) {
        imagePayload = {
          mediaType: m[1] as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          base64: m[2]
        };
      }
    }

    const chunks = await retrieve(question, topK, filterTypes);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer:
          "No passages found in the knowledge base. Either the question is outside scope, or the content hasn't been ingested yet.",
        citations: [],
        retrieved_chunk_ids: [],
        latency_ms: Date.now() - t0
      });
    }

    const ans = await answer(question, chunks, imagePayload);

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
      latency_ms: Date.now() - t0
    });
  } catch (e) {
    console.error("/api/ask error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { embed } from "@/lib/embed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface ChunkInput {
  text: string;
  chunk_index: number;
  source_ref?: string | null;
  metadata?: Record<string, unknown>;
}

interface IngestBody {
  source_type: string;
  source_name: string;
  source_url?: string | null;
  chunks: ChunkInput[];
}

// Voyage caps batches at 120k tokens. Dense technical PDFs blow past this at 128 chunks.
// 32 keeps us well under for ~500-word chunks (~650 tokens × 32 ≈ 21k tokens).
const BATCH = 32;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.INGEST_TOKEN}`;
  if (!process.env.INGEST_TOKEN || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as IngestBody;
    const { source_type, source_name, source_url, chunks } = body;

    if (!source_type || !source_name || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: "source_type, source_name, and non-empty chunks[] are required" },
        { status: 400 }
      );
    }

    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      const embs = await embed(slice.map((c) => c.text), "document");
      embeddings.push(...embs);
    }

    let inserted = 0;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const vec = `[${embeddings[i].join(",")}]`;
      const res = await db.query(
        `INSERT INTO chunks (source_type, source_name, source_url, source_ref, chunk_index, text, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb)
         ON CONFLICT (source_type, source_name, chunk_index) DO NOTHING`,
        [
          source_type,
          source_name,
          source_url ?? null,
          c.source_ref ?? null,
          c.chunk_index,
          c.text,
          vec,
          JSON.stringify(c.metadata ?? {})
        ]
      );
      inserted += res.rowCount ?? 0;
    }

    return NextResponse.json({ inserted_chunks: inserted, source_name });
  } catch (e) {
    console.error("/api/ingest error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

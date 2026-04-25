import { db } from "./db";
import { embed } from "./embed";
import type { PreparedChunk } from "./chunk";

const EMBED_BATCH = 16; // Voyage 120k token-per-batch cap; 16 leaves room for dense content

export interface InsertResult {
  inserted_chunks: number;
}

export async function insertChunks(args: {
  source_type: string;
  source_name: string;
  source_url?: string | null;
  chunks: PreparedChunk[];
}): Promise<InsertResult> {
  const { source_type, source_name, source_url, chunks } = args;
  if (!chunks.length) return { inserted_chunks: 0 };

  // Embed in small batches to stay under Voyage's 120k token-per-batch limit
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const slab = chunks.slice(i, i + EMBED_BATCH).map((c) => c.text);
    const embs = await embed(slab, "document");
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
        JSON.stringify(c.metadata ?? {}),
      ]
    );
    inserted += res.rowCount ?? 0;
  }
  return { inserted_chunks: inserted };
}

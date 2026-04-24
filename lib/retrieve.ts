import { db } from "./db";
import { embed } from "./embed";

export interface Chunk {
  id: number;
  source_type: string;
  source_name: string;
  source_url: string | null;
  source_ref: string | null;
  chunk_index: number;
  text: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function retrieve(
  question: string,
  topK = 10,
  filterTypes?: string[]
): Promise<Chunk[]> {
  const [queryEmbedding] = await embed([question], "query");
  const vec = `[${queryEmbedding.join(",")}]`;

  const params: unknown[] = [vec];
  let sql = `
    SELECT id, source_type, source_name, source_url, source_ref, chunk_index, text, metadata,
           1 - (embedding <=> $1::vector) AS similarity
    FROM chunks
  `;
  if (filterTypes && filterTypes.length > 0) {
    params.push(filterTypes);
    sql += ` WHERE source_type = ANY($${params.length})`;
  }
  params.push(topK);
  sql += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length}`;

  const { rows } = await db.query(sql, params);
  return rows as Chunk[];
}

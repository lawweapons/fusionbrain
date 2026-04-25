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
  match_kind?: "vector" | "keyword";
}

interface RetrieveOpts {
  searchQuery: string;
  keywordTerms?: string[];
  topK?: number;
  filterTypes?: string[];
}

const KEYWORD_SIMILARITY_FLOOR = 0.85;

export async function retrieve(opts: RetrieveOpts): Promise<Chunk[]> {
  const { searchQuery, keywordTerms = [], topK = 10, filterTypes } = opts;
  const [queryEmbedding] = await embed([searchQuery], "query");
  const vec = `[${queryEmbedding.join(",")}]`;

  // ----- Vector search -----
  const vParams: unknown[] = [vec];
  let vSql = `
    SELECT id, source_type, source_name, source_url, source_ref, chunk_index, text, metadata,
           1 - (embedding <=> $1::vector) AS similarity, 'vector' AS match_kind
    FROM chunks
  `;
  if (filterTypes && filterTypes.length > 0) {
    vParams.push(filterTypes);
    vSql += ` WHERE source_type = ANY($${vParams.length})`;
  }
  vParams.push(topK * 2);
  vSql += ` ORDER BY embedding <=> $1::vector LIMIT $${vParams.length}`;
  const vRes = await db.query(vSql, vParams);
  const vectorRows = vRes.rows as Chunk[];

  // ----- Keyword search on source_name (when terms supplied) -----
  let keywordRows: Chunk[] = [];
  if (keywordTerms.length > 0) {
    const kwParams: unknown[] = [vec];
    const cleanedTerms = keywordTerms
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
      .slice(0, 8);
    if (cleanedTerms.length > 0) {
      const conditions = cleanedTerms.map((t) => {
        kwParams.push(`%${t}%`);
        return `source_name ILIKE $${kwParams.length}`;
      });
      let kwSql = `
        SELECT id, source_type, source_name, source_url, source_ref, chunk_index, text, metadata,
               1 - (embedding <=> $1::vector) AS similarity, 'keyword' AS match_kind
        FROM chunks
        WHERE (${conditions.join(" OR ")})
      `;
      if (filterTypes && filterTypes.length > 0) {
        kwParams.push(filterTypes);
        kwSql += ` AND source_type = ANY($${kwParams.length})`;
      }
      kwParams.push(topK);
      kwSql += ` ORDER BY embedding <=> $1::vector LIMIT $${kwParams.length}`;
      const kwRes = await db.query(kwSql, kwParams);
      keywordRows = (kwRes.rows as Chunk[]).map((r) => ({
        ...r,
        // Floor: a keyword-matched source_name is a strong signal of relevance
        similarity: Math.max(r.similarity, KEYWORD_SIMILARITY_FLOOR),
      }));
    }
  }

  // ----- Merge: keyword matches take precedence on collision -----
  const byId = new Map<number, Chunk>();
  for (const row of keywordRows) byId.set(row.id, row);
  for (const row of vectorRows) if (!byId.has(row.id)) byId.set(row.id, row);

  // Sort: keyword matches first (they're explicit user signals), then by similarity
  const merged = Array.from(byId.values()).sort((a, b) => {
    const aKw = a.match_kind === "keyword" ? 1 : 0;
    const bKw = b.match_kind === "keyword" ? 1 : 0;
    if (aKw !== bKw) return bKw - aKw;
    return b.similarity - a.similarity;
  });

  return merged.slice(0, topK);
}

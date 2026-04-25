/** Word-window chunking matching the Python ingest scripts. */
export function chunkByWords(text: string, size = 500, overlap = 75): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const out: string[] = [];
  const step = Math.max(1, size - overlap);
  let i = 0;
  while (i < words.length) {
    out.push(words.slice(i, i + size).join(" "));
    if (i + size >= words.length) break;
    i += step;
  }
  return out;
}

export interface PreparedChunk {
  text: string;
  chunk_index: number;
  source_ref?: string | null;
  metadata?: Record<string, unknown>;
}

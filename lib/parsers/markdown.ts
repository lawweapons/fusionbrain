import { chunkByWords, type PreparedChunk } from "../chunk";

const HEADING_RE = /^(#{1,6})\s+(.+)$/gm;

interface Section {
  heading: string;
  body: string;
}

function splitSections(md: string): Section[] {
  const matches = [...md.matchAll(HEADING_RE)];
  if (matches.length === 0) return [{ heading: "", body: md.trim() }];

  const sections: Section[] = [];
  if (matches[0].index! > 0) {
    const pre = md.slice(0, matches[0].index!).trim();
    if (pre) sections.push({ heading: "", body: pre });
  }
  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i][2].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const body = md.slice(start, end).trim();
    if (body) sections.push({ heading, body });
  }
  return sections;
}

export function parseMarkdownToChunks(md: string, filename: string): PreparedChunk[] {
  const sections = splitSections(md);
  const chunks: PreparedChunk[] = [];
  let idx = 0;
  for (const { heading, body } of sections) {
    const wordCount = body.split(/\s+/).length;
    const pieces = wordCount > 500 ? chunkByWords(body) : [body];
    for (const piece of pieces) {
      const t = piece.trim();
      if (!t) continue;
      const prefix = `[MD: ${filename}${heading ? ` · ${heading}` : ""}] `;
      chunks.push({
        chunk_index: idx++,
        text: prefix + t,
        source_ref: heading || null,
        metadata: { heading },
      });
    }
  }
  return chunks;
}

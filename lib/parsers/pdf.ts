import { chunkByWords, type PreparedChunk } from "../chunk";

// pdf-parse's package.json points at a debug index.js with a stray test fixture.
// Importing the actual module file avoids the test-fixture trap in serverless.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function parsePdfToChunks(
  buffer: Buffer,
  filename: string
): Promise<{ chunks: PreparedChunk[]; pageCount: number; totalChars: number }> {
  const result = await pdfParse(buffer);
  // pdf-parse gives us all text as one blob, with form-feed (\f) between pages.
  const allText: string = result.text ?? "";
  const pages = allText.split(/\f/);
  const totalChars = allText.length;
  const pageCount = result.numpages ?? pages.length;

  const chunks: PreparedChunk[] = [];
  let chunkIdx = 0;
  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    const pageText = (pages[pageNum] ?? "").trim();
    if (!pageText) continue;
    const pageWindows = chunkByWords(pageText);
    for (const window of pageWindows) {
      chunks.push({
        chunk_index: chunkIdx++,
        text: `[PDF: ${filename} p.${pageNum + 1}] ${window}`,
        source_ref: `p.${pageNum + 1}`,
        metadata: { page: pageNum + 1 },
      });
    }
  }
  return { chunks, pageCount, totalChars };
}

export function looksScanned(totalChars: number, pageCount: number): boolean {
  if (pageCount === 0) return true;
  return totalChars / pageCount < 100;
}

import { NextRequest, NextResponse } from "next/server";
import { insertChunks } from "@/lib/insert";
import { parsePdfToChunks, looksScanned } from "@/lib/parsers/pdf";
import { parseMarkdownToChunks } from "@/lib/parsers/markdown";
import { requireBasicAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB cap

interface IngestUrlBody {
  url?: string;
  source_name?: string;
  machine?: string;
}

function deriveFilename(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname;
    return decodeURIComponent(last);
  } catch {
    return url.slice(0, 80);
  }
}

/** Strip HTML to readable text using regex (no DOM dep). Adequate for static pages. */
function htmlToText(html: string): string {
  // Drop <script>, <style>, <noscript>, <head> blocks entirely
  let s = html.replace(/<(script|style|noscript|head)[\s\S]*?<\/\1>/gi, " ");
  // Drop nav/footer/header/aside if they're tagged semantically
  s = s.replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ");
  // Replace <br> and block-element ends with newlines so paragraphs don't run together
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n");
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, " ");
  // Decode common entities
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Collapse whitespace per line, then drop empty/duplicate lines
  s = s
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0)
    .join("\n");
  return s;
}

/** Heuristic: treat as JS-rendered shell if very little text was extracted. */
function looksLikeJsShell(text: string): boolean {
  return text.length < 500;
}

export async function POST(req: NextRequest) {
  const unauth = requireBasicAuth(req);
  if (unauth) return unauth;

  let body: IngestUrlBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid URL" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "only http/https URLs are supported" }, { status: 400 });
  }

  const machineTag =
    typeof body.machine === "string" && body.machine.trim().length > 0
      ? body.machine.trim().slice(0, 80)
      : null;

  const tagSourceName = (name: string): string =>
    machineTag ? `[${machineTag}] ${name}` : name;

  try {
    const fetchRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FusionBrain/1.0; +https://fusionbrain.local)",
        Accept: "application/pdf,text/html,*/*",
      },
      redirect: "follow",
    });

    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: `fetch failed: HTTP ${fetchRes.status} ${fetchRes.statusText}` },
        { status: 502 }
      );
    }

    const contentType = (fetchRes.headers.get("content-type") ?? "").toLowerCase();
    const filename = deriveFilename(url);
    const isPdfByCT = contentType.includes("application/pdf");
    const isPdfByExt = filename.toLowerCase().endsWith(".pdf");

    // Read up to MAX_BYTES so we don't OOM on huge files
    const reader = fetchRes.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "no response body" }, { status: 502 });
    }
    const parts: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        return NextResponse.json(
          { error: `file too large (>${MAX_BYTES / (1024 * 1024)} MB)` },
          { status: 413 }
        );
      }
      parts.push(value);
    }
    const buffer = Buffer.concat(parts.map((p) => Buffer.from(p)));

    if (isPdfByCT || isPdfByExt) {
      const { chunks, pageCount, totalChars } = await parsePdfToChunks(buffer, filename);
      if (looksScanned(totalChars, pageCount)) {
        return NextResponse.json(
          {
            error: `PDF appears scanned (avg ${Math.round(
              totalChars / Math.max(1, pageCount)
            )} chars/page); OCR not supported`,
            pageCount,
          },
          { status: 422 }
        );
      }
      if (chunks.length === 0) {
        return NextResponse.json({ error: "no extractable text from PDF" }, { status: 422 });
      }
      const sourceName = tagSourceName(body.source_name?.trim() || filename);
      const { inserted_chunks } = await insertChunks({
        source_type: "pdf",
        source_name: sourceName,
        source_url: url,
        chunks,
      });
      return NextResponse.json({
        kind: "pdf",
        source_name: sourceName,
        source_url: url,
        page_count: pageCount,
        inserted_chunks,
      });
    }

    // HTML path
    const html = buffer.toString("utf8");
    const text = htmlToText(html);
    if (looksLikeJsShell(text)) {
      return NextResponse.json(
        {
          error:
            "page appears to require JavaScript rendering — basic fetch returned a near-empty shell. Save the page locally and upload as Markdown, or scrape with Firecrawl first.",
          extracted_chars: text.length,
        },
        { status: 422 }
      );
    }
    const sourceName = tagSourceName(body.source_name?.trim() || filename);
    const chunks = parseMarkdownToChunks(text, sourceName);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "no chunks produced from page text" }, { status: 422 });
    }
    const { inserted_chunks } = await insertChunks({
      source_type: "webpage",
      source_name: sourceName,
      source_url: url,
      chunks,
    });
    return NextResponse.json({
      kind: "webpage",
      source_name: sourceName,
      source_url: url,
      extracted_chars: text.length,
      inserted_chunks,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

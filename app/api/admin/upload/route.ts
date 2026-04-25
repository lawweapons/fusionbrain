import { NextRequest, NextResponse } from "next/server";
import { insertChunks } from "@/lib/insert";
import { parsePdfToChunks, looksScanned } from "@/lib/parsers/pdf";
import { parseMarkdownToChunks } from "@/lib/parsers/markdown";
import { parseFusionCamJson, type FusionCamExport } from "@/lib/parsers/fusion_cam";
import { parseGcodeToChunks } from "@/lib/parsers/gcode";
import { requireBasicAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

interface FileResult {
  filename: string;
  status: "ok" | "skipped" | "error";
  inserted_chunks?: number;
  message?: string;
}

function detectKind(filename: string): "pdf" | "markdown" | "fusion_cam" | "gcode" | "unknown" {
  const f = filename.toLowerCase();
  if (f.endsWith(".pdf")) return "pdf";
  if (f.endsWith(".md") || f.endsWith(".markdown")) return "markdown";
  if (f.endsWith(".fb.json")) return "fusion_cam";
  if (
    f.endsWith(".nc") ||
    f.endsWith(".tap") ||
    f.endsWith(".ngc") ||
    f.endsWith(".gcode") ||
    f.endsWith(".min") ||
    f.endsWith(".cnc")
  )
    return "gcode";
  if (f.endsWith(".json")) return "fusion_cam"; // generic .json — try as Fusion CAM export
  return "unknown";
}

export async function POST(req: NextRequest) {
  const unauth = requireBasicAuth(req);
  if (unauth) return unauth;
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    if (files.length === 0) {
      return NextResponse.json({ error: "no files attached (form field 'files')" }, { status: 400 });
    }

    const results: FileResult[] = [];

    for (const f of files) {
      if (!(f instanceof File)) {
        results.push({ filename: "(non-file form value)", status: "skipped", message: "not a file" });
        continue;
      }
      const filename = f.name;
      const kind = detectKind(filename);

      try {
        if (kind === "unknown") {
          results.push({
            filename,
            status: "skipped",
            message: "unsupported extension (use .pdf, .md, .fb.json, .nc/.tap/.ngc/.gcode/.min/.cnc)",
          });
          continue;
        }

        const buffer = Buffer.from(await f.arrayBuffer());

        if (kind === "pdf") {
          const { chunks, pageCount, totalChars } = await parsePdfToChunks(buffer, filename);
          if (looksScanned(totalChars, pageCount)) {
            results.push({
              filename,
              status: "skipped",
              message: `scanned PDF (avg ${Math.round(totalChars / Math.max(1, pageCount))} chars/page); OCR not supported`,
            });
            continue;
          }
          if (chunks.length === 0) {
            results.push({ filename, status: "skipped", message: "no extractable text" });
            continue;
          }
          const { inserted_chunks } = await insertChunks({
            source_type: "pdf",
            source_name: filename,
            source_url: null,
            chunks,
          });
          results.push({ filename, status: "ok", inserted_chunks });
        } else if (kind === "markdown") {
          const md = buffer.toString("utf8");
          const chunks = parseMarkdownToChunks(md, filename);
          if (chunks.length === 0) {
            results.push({ filename, status: "skipped", message: "empty markdown" });
            continue;
          }
          const { inserted_chunks } = await insertChunks({
            source_type: "markdown",
            source_name: filename,
            source_url: null,
            chunks,
          });
          results.push({ filename, status: "ok", inserted_chunks });
        } else if (kind === "gcode") {
          const text = buffer.toString("utf8");
          const { chunks, operationCount } = parseGcodeToChunks(text, filename);
          if (chunks.length === 0) {
            results.push({
              filename,
              status: "skipped",
              message: `no operations parsed from ${operationCount === 0 ? "empty file" : "unrecognized format"}`,
            });
            continue;
          }
          const { inserted_chunks } = await insertChunks({
            source_type: "gcode",
            source_name: filename,
            source_url: null,
            chunks,
          });
          results.push({ filename, status: "ok", inserted_chunks });
        } else {
          // fusion_cam
          let parsed: FusionCamExport;
          try {
            parsed = JSON.parse(buffer.toString("utf8")) as FusionCamExport;
          } catch (e) {
            results.push({ filename, status: "error", message: `invalid JSON: ${(e as Error).message}` });
            continue;
          }
          if (!parsed.setups) {
            results.push({
              filename,
              status: "skipped",
              message: "not a Fusion CAM export (missing 'setups' field)",
            });
            continue;
          }
          const { source_name, chunks } = parseFusionCamJson(parsed, filename.replace(/\.fb\.json$/i, ""));
          if (chunks.length === 0) {
            results.push({ filename, status: "skipped", message: "no operations in export" });
            continue;
          }
          const { inserted_chunks } = await insertChunks({
            source_type: "fusion_cam",
            source_name,
            source_url: null,
            chunks,
          });
          results.push({ filename, status: "ok", inserted_chunks });
        }
      } catch (e) {
        results.push({ filename, status: "error", message: (e as Error).message });
      }
    }

    const totalInserted = results.reduce((s, r) => s + (r.inserted_chunks ?? 0), 0);
    return NextResponse.json({ total_inserted: totalInserted, files: results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

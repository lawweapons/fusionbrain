import { NextRequest, NextResponse } from "next/server";
import { requireBasicAuth } from "@/lib/auth";
import { insertChunks } from "@/lib/insert";
import { parseMarkdownToChunks } from "@/lib/parsers/markdown";
import { authorRecipe } from "@/lib/recipe";
import type { FusionCamExport } from "@/lib/parsers/fusion_cam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Turn a Fusion CAM export (.fb.json) into a reusable, teachable "CAM recipe"
 * (flashlight-template quality) authored by Claude, then ingest it as a
 * cam_recipe source. Returns the markdown so the client can also save it locally.
 *
 * Accepts either:
 *   - multipart/form-data with a `file` field (the .fb.json), optional `machine`
 *   - application/json with { export: <fb.json object>, machine?: string }
 */
export async function POST(req: NextRequest) {
  const unauth = requireBasicAuth(req);
  if (unauth) return unauth;

  try {
    let data: FusionCamExport | null = null;
    let machineTag: string | null = null;
    let fallbackName = "Unknown";

    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const f = form.get("file");
      const m = form.get("machine");
      if (typeof m === "string" && m.trim()) machineTag = m.trim().slice(0, 80);
      if (f instanceof File) {
        fallbackName = f.name.replace(/\.fb\.json$/i, "").replace(/\.json$/i, "");
        const text = await f.text();
        data = JSON.parse(text) as FusionCamExport;
      }
    } else {
      const body = await req.json();
      if (body.machine && typeof body.machine === "string") machineTag = body.machine.trim().slice(0, 80);
      data = (body.export ?? body) as FusionCamExport;
    }

    if (!data || !Array.isArray(data.setups)) {
      return NextResponse.json(
        { error: "no valid Fusion CAM export provided (missing 'setups')" },
        { status: 400 }
      );
    }

    const opCount = data.setups.reduce(
      (n, s) => n + (Array.isArray(s.operations) ? s.operations.filter((o) => !o.error).length : 0),
      0
    );
    if (opCount === 0) {
      return NextResponse.json(
        { error: "export has no operations — nothing to make a recipe from", op_count: 0 },
        { status: 422 }
      );
    }

    const docName = data.document || fallbackName;

    // Author the recipe with Claude
    const recipeMd = await authorRecipe(data);

    // Ingest it as a cam_recipe source
    const baseName = machineTag ? `[${machineTag}] Recipe: ${docName}` : `Recipe: ${docName}`;
    const taggedMd = machineTag ? `[Machine: ${machineTag}]\n\n${recipeMd}` : recipeMd;
    const chunks = parseMarkdownToChunks(taggedMd, baseName);
    const { inserted_chunks } = await insertChunks({
      source_type: "cam_recipe",
      source_name: baseName,
      source_url: null,
      chunks: chunks.map((c) => ({
        ...c,
        metadata: { ...(c.metadata ?? {}), document: docName, machine: machineTag ?? undefined },
      })),
    });

    return NextResponse.json({
      document: docName,
      machine: machineTag,
      op_count: opCount,
      source_name: baseName,
      inserted_chunks,
      recipe_markdown: recipeMd,
    });
  } catch (e) {
    console.error("/api/admin/generate-recipe error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

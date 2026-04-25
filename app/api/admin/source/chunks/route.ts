import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBasicAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const unauth = requireBasicAuth(req);
  if (unauth) return unauth;
  try {
    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("source_type");
    const sourceName = searchParams.get("source_name");
    if (!sourceType || !sourceName) {
      return NextResponse.json(
        { error: "source_type and source_name query params required" },
        { status: 400 }
      );
    }
    const { rows } = await db.query(
      `SELECT chunk_index, text, source_ref, metadata, source_url, created_at
       FROM chunks
       WHERE source_type = $1 AND source_name = $2
       ORDER BY chunk_index`,
      [sourceType, sourceName]
    );
    return NextResponse.json({
      source_type: sourceType,
      source_name: sourceName,
      chunks: rows,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

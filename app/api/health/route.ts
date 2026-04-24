import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthResult {
  db: string;
  embed_api: string;
  llm_api: string;
  chunk_count?: number;
}

export async function GET() {
  const result: HealthResult = {
    db: "unknown",
    embed_api: process.env.VOYAGE_API_KEY ? "ok" : "missing_key",
    llm_api: process.env.ANTHROPIC_API_KEY ? "ok" : "missing_key"
  };

  try {
    const { rows } = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM chunks");
    result.db = "ok";
    result.chunk_count = Number(rows[0].count);
  } catch (e) {
    result.db = `error: ${(e as Error).message}`;
  }

  const allOk = result.db === "ok" && result.embed_api === "ok" && result.llm_api === "ok";
  return NextResponse.json(result, { status: allOk ? 200 : 503 });
}

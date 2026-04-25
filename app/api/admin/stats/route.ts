import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totals = await db.query<{ source_type: string; count: string }>(
      `SELECT source_type, COUNT(*)::text AS count
       FROM chunks GROUP BY source_type ORDER BY count DESC`
    );
    const recent = await db.query<{
      source_type: string;
      source_name: string;
      chunk_count: string;
      last_added: string;
    }>(
      `SELECT source_type, source_name, COUNT(*)::text AS chunk_count,
              MAX(created_at)::text AS last_added
       FROM chunks
       GROUP BY source_type, source_name
       ORDER BY MAX(created_at) DESC
       LIMIT 15`
    );
    const total = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM chunks");
    return NextResponse.json({
      total_chunks: Number(total.rows[0]?.count ?? 0),
      by_source_type: totals.rows.map((r) => ({
        source_type: r.source_type,
        chunks: Number(r.count),
      })),
      recent_sources: recent.rows.map((r) => ({
        source_type: r.source_type,
        source_name: r.source_name,
        chunks: Number(r.chunk_count),
        last_added: r.last_added,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

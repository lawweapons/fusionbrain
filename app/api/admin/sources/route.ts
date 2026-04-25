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
    const sourceType = searchParams.get("source_type") || null;
    const machine = searchParams.get("machine") || null;
    const q = searchParams.get("q") || null;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "300", 10), 1), 1000);

    const params: unknown[] = [];
    const wheres: string[] = [];
    if (sourceType) {
      params.push(sourceType);
      wheres.push(`source_type = $${params.length}`);
    }
    if (machine) {
      params.push(machine);
      wheres.push(`metadata->>'machine' = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      wheres.push(`source_name ILIKE $${params.length}`);
    }
    const whereClause = wheres.length > 0 ? `WHERE ${wheres.join(" AND ")}` : "";
    params.push(limit);

    const sql = `
      SELECT
        source_type,
        source_name,
        COALESCE(metadata->>'machine', '') AS machine,
        COUNT(*)::int AS chunks,
        MAX(created_at)::text AS last_added
      FROM chunks
      ${whereClause}
      GROUP BY source_type, source_name, metadata->>'machine'
      ORDER BY MAX(created_at) DESC
      LIMIT $${params.length}
    `;
    const { rows } = await db.query(sql, params);

    // Also return the distinct machines / source_types for filter chips
    const machinesRes = await db.query<{ machine: string; n: string }>(
      `SELECT COALESCE(metadata->>'machine', '') AS machine, COUNT(*)::text AS n
       FROM chunks GROUP BY metadata->>'machine' ORDER BY n DESC`
    );
    const typesRes = await db.query<{ source_type: string; n: string }>(
      `SELECT source_type, COUNT(*)::text AS n FROM chunks GROUP BY source_type ORDER BY n DESC`
    );

    return NextResponse.json({
      sources: rows,
      facets: {
        machines: machinesRes.rows
          .filter((r) => r.machine)
          .map((r) => ({ machine: r.machine, count: Number(r.n) })),
        source_types: typesRes.rows.map((r) => ({ source_type: r.source_type, count: Number(r.n) })),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

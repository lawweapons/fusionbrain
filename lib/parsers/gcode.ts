import type { PreparedChunk } from "../chunk";

interface Operation {
  index: number;
  name: string | null;
  tool_num: string | null;
  tool_desc: string | null;
  rpm: string | null;
  feed: string | null;
  comments: string[];
  raw_lines: string[];
}

const COMMENT_PAREN_RE = /^\((.+)\)$/;
const COMMENT_SEMI_RE = /^;\s*(.+)$/;
// Tool change patterns: "T1 M06", "M06 T1", "T01 M6"
const TOOL_CHANGE_RE = /\bT(\d+)\b/;
const M06_RE = /\bM0?6\b/;
const RPM_RE = /\bS(\d+(?:\.\d+)?)\b/;
const FEED_RE = /\bF(\d+(?:\.\d+)?)\b/;
const N_LINE_RE = /^N\d+\s*/;

const OP_NAME_KEYWORDS =
  /\b(ADAPTIVE|CONTOUR|DRILL|THREAD|FACE|POCKET|RAMP|HELICAL|BORE|SLOT|CHAMFER|TRACE|SPIRAL|SCALLOP|MORPH|FLOW|RADIAL|ENGRAVE|2D|3D)\b/i;
const TOOL_DESC_KEYWORDS =
  /\b(MILL|DRILL|TAP|REAMER|ENDMILL|END\s*MILL|FACE\s*MILL|BULL\s*NOSE|BALL|FLAT|CHAMFER|THREAD|CARBIDE|HSS)\b/i;

function newOp(index: number): Operation {
  return {
    index,
    name: null,
    tool_num: null,
    tool_desc: null,
    rpm: null,
    feed: null,
    comments: [],
    raw_lines: [],
  };
}

interface Extents {
  x: [number, number] | null;
  y: [number, number] | null;
  z: [number, number] | null;
}

function emptyExt(): { min: number; max: number } {
  return { min: Infinity, max: -Infinity };
}

function packExt(e: { min: number; max: number }): [number, number] | null {
  return Number.isFinite(e.min) ? [e.min, e.max] : null;
}

const G_CODE_RE_GLOBAL = /\bG(\d+)\b/g;
const X_NUM_RE = /\bX(-?\d+(?:\.\d+)?)/;
const Y_NUM_RE = /\bY(-?\d+(?:\.\d+)?)/;
const Z_NUM_RE = /\bZ(-?\d+(?:\.\d+)?)/;

function computeExtents(lines: string[]): { all: Extents; cutting: Extents } {
  const all = { x: emptyExt(), y: emptyExt(), z: emptyExt() };
  const cut = { x: emptyExt(), y: emptyExt(), z: emptyExt() };
  let modal: "rapid" | "cut" | null = null;

  for (const line of lines) {
    // Update modal state from any motion G-codes on this line
    for (const m of line.matchAll(G_CODE_RE_GLOBAL)) {
      const code = parseInt(m[1], 10);
      if (code === 0) modal = "rapid";
      else if (code === 1 || code === 2 || code === 3) modal = "cut";
      // other G codes (17/40/53/54/90/94 etc.) don't change motion modal here
    }

    const xm = line.match(X_NUM_RE);
    const ym = line.match(Y_NUM_RE);
    const zm = line.match(Z_NUM_RE);
    if (xm) {
      const v = parseFloat(xm[1]);
      all.x.min = Math.min(all.x.min, v);
      all.x.max = Math.max(all.x.max, v);
      if (modal === "cut") {
        cut.x.min = Math.min(cut.x.min, v);
        cut.x.max = Math.max(cut.x.max, v);
      }
    }
    if (ym) {
      const v = parseFloat(ym[1]);
      all.y.min = Math.min(all.y.min, v);
      all.y.max = Math.max(all.y.max, v);
      if (modal === "cut") {
        cut.y.min = Math.min(cut.y.min, v);
        cut.y.max = Math.max(cut.y.max, v);
      }
    }
    if (zm) {
      const v = parseFloat(zm[1]);
      all.z.min = Math.min(all.z.min, v);
      all.z.max = Math.max(all.z.max, v);
      if (modal === "cut") {
        cut.z.min = Math.min(cut.z.min, v);
        cut.z.max = Math.max(cut.z.max, v);
      }
    }
  }

  return {
    all: { x: packExt(all.x), y: packExt(all.y), z: packExt(all.z) },
    cutting: { x: packExt(cut.x), y: packExt(cut.y), z: packExt(cut.z) },
  };
}

function commitOp(op: Operation): Operation {
  // Promote a recent comment to op name if not already set
  if (!op.name) {
    for (let i = op.comments.length - 1; i >= 0; i--) {
      const c = op.comments[i];
      if (OP_NAME_KEYWORDS.test(c)) {
        op.name = c;
        break;
      }
    }
  }
  if (!op.tool_desc) {
    for (const c of op.comments) {
      if (TOOL_DESC_KEYWORDS.test(c)) {
        op.tool_desc = c;
        break;
      }
    }
  }
  return op;
}

export function parseGcode(text: string, filename: string): {
  operations: Operation[];
  total_lines: number;
} {
  const rawLines = text.split(/\r?\n/);
  const ops: Operation[] = [];
  let current = newOp(0);
  let recentComments: string[] = [];

  for (const raw of rawLines) {
    const stripped = raw.replace(N_LINE_RE, "").trim();
    if (!stripped) continue;

    // Comment lines
    const parenMatch = stripped.match(COMMENT_PAREN_RE);
    const semiMatch = stripped.match(COMMENT_SEMI_RE);
    if (parenMatch || semiMatch) {
      const c = (parenMatch?.[1] ?? semiMatch?.[1] ?? "").trim();
      if (c) {
        current.comments.push(c);
        recentComments.push(c);
        if (recentComments.length > 4) recentComments.shift();
      }
      current.raw_lines.push(stripped);
      continue;
    }

    // Detect tool change → start new operation
    const tMatch = stripped.match(TOOL_CHANGE_RE);
    const isM06 = M06_RE.test(stripped);
    if (tMatch && isM06) {
      // Commit current if it has any actual moves/lines
      if (current.raw_lines.length > 0 || current.tool_num) {
        ops.push(commitOp(current));
        current = newOp(ops.length);
      }
      current.tool_num = tMatch[1];
      // Pull operation name from preceding comments
      for (let i = recentComments.length - 1; i >= 0; i--) {
        if (OP_NAME_KEYWORDS.test(recentComments[i])) {
          current.name = recentComments[i];
          break;
        }
      }
      for (const c of recentComments) {
        if (TOOL_DESC_KEYWORDS.test(c)) {
          current.tool_desc = c;
          break;
        }
      }
      // Carry comment context to op
      current.comments.push(...recentComments);
      recentComments = [];
    }

    // Spindle RPM (first occurrence per op)
    if (!current.rpm) {
      const s = stripped.match(RPM_RE);
      if (s) current.rpm = s[1];
    }
    // Feed rate (first occurrence per op)
    if (!current.feed) {
      const f = stripped.match(FEED_RE);
      if (f) current.feed = f[1];
    }
    current.raw_lines.push(stripped);
  }

  if (current.raw_lines.length > 0 || current.tool_num) {
    ops.push(commitOp(current));
  }

  return { operations: ops, total_lines: rawLines.length };
}

function fmtExt(e: [number, number] | null): string {
  if (!e) return "(none)";
  const span = e[1] - e[0];
  return `${e[0].toFixed(4)} to ${e[1].toFixed(4)}  (span ${span.toFixed(4)})`;
}

function renderOperation(op: Operation, filename: string, ext: { all: Extents; cutting: Extents }): string {
  const head = `[G-code: ${filename} / Operation: ${op.name ?? `Block ${op.index + 1}`}]`;
  const lines: string[] = [head, ""];

  if (op.tool_num) {
    lines.push(`Tool: T${op.tool_num}${op.tool_desc ? ` — ${op.tool_desc}` : ""}`);
  }
  if (op.rpm) lines.push(`Spindle: ${op.rpm} RPM`);
  if (op.feed) lines.push(`Cutting feed: F${op.feed}`);

  // Spatial envelope — coordinates are in the active WCS (G54/G55/etc.)
  // i.e. relative to where the operator probed work zero.
  const hasCut =
    ext.cutting.x !== null || ext.cutting.y !== null || ext.cutting.z !== null;
  const hasAll =
    ext.all.x !== null || ext.all.y !== null || ext.all.z !== null;
  if (hasCut || hasAll) {
    lines.push("");
    lines.push("Toolpath envelope (in active WCS — values are distances from probed work zero):");
    if (hasCut) {
      lines.push("  Cutting moves only (G1/G2/G3, excludes rapid traverse):");
      lines.push(`    X: ${fmtExt(ext.cutting.x)}`);
      lines.push(`    Y: ${fmtExt(ext.cutting.y)}`);
      lines.push(`    Z: ${fmtExt(ext.cutting.z)}`);
    }
    if (hasAll) {
      lines.push("  All moves (incl. rapids):");
      lines.push(`    X: ${fmtExt(ext.all.x)}`);
      lines.push(`    Y: ${fmtExt(ext.all.y)}`);
      lines.push(`    Z: ${fmtExt(ext.all.z)}`);
    }
  }

  if (op.comments.length > 0) {
    lines.push("");
    lines.push("Comments in source:");
    for (const c of op.comments.slice(0, 8)) {
      lines.push(`  (${c})`);
    }
  }

  // Include a head + tail snippet so the embedding has actual code context
  const code = op.raw_lines;
  const headCount = 20;
  const tailCount = 6;
  if (code.length > 0) {
    lines.push("");
    lines.push("G-code excerpt:");
    if (code.length <= headCount + tailCount) {
      lines.push(...code);
    } else {
      lines.push(...code.slice(0, headCount));
      lines.push(`  ... (${code.length - headCount - tailCount} lines elided) ...`);
      lines.push(...code.slice(-tailCount));
    }
  }

  return lines.join("\n");
}

export function parseGcodeToChunks(text: string, filename: string): {
  chunks: PreparedChunk[];
  operationCount: number;
  totalLines: number;
} {
  const { operations, total_lines } = parseGcode(text, filename);
  const chunks: PreparedChunk[] = [];

  for (const op of operations) {
    const opName = op.name ?? `Block ${op.index + 1}`;
    const ext = computeExtents(op.raw_lines);
    chunks.push({
      chunk_index: chunks.length,
      text: renderOperation(op, filename, ext),
      source_ref: opName,
      metadata: {
        operation_index: op.index,
        operation_name: op.name,
        tool_num: op.tool_num,
        tool_desc: op.tool_desc,
        spindle_rpm: op.rpm,
        cutting_feed: op.feed,
        line_count: op.raw_lines.length,
        x_cutting: ext.cutting.x,
        y_cutting: ext.cutting.y,
        z_cutting: ext.cutting.z,
        x_all: ext.all.x,
        y_all: ext.all.y,
        z_all: ext.all.z,
      },
    });
  }

  return { chunks, operationCount: operations.length, totalLines: total_lines };
}

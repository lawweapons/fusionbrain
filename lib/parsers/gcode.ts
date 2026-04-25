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

function renderOperation(op: Operation, filename: string): string {
  const head = `[G-code: ${filename} / Operation: ${op.name ?? `Block ${op.index + 1}`}]`;
  const lines: string[] = [head, ""];

  if (op.tool_num) {
    lines.push(`Tool: T${op.tool_num}${op.tool_desc ? ` — ${op.tool_desc}` : ""}`);
  }
  if (op.rpm) lines.push(`Spindle: ${op.rpm} RPM`);
  if (op.feed) lines.push(`Cutting feed: F${op.feed}`);

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
    chunks.push({
      chunk_index: chunks.length,
      text: renderOperation(op, filename),
      source_ref: opName,
      metadata: {
        operation_index: op.index,
        operation_name: op.name,
        tool_num: op.tool_num,
        tool_desc: op.tool_desc,
        spindle_rpm: op.rpm,
        cutting_feed: op.feed,
        line_count: op.raw_lines.length,
      },
    });
  }

  return { chunks, operationCount: operations.length, totalLines: total_lines };
}

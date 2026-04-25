import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export type Intent = "walkthrough" | "lookup" | "compare" | "general";

export interface RewrittenQuery {
  search_query: string;
  keyword_terms: string[];
  intent: Intent;
  detected_jobs: string[];
}

const REWRITE_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You preprocess CAM/CNC/Fusion 360 questions for a retrieval system. The retrieval system has access to: the user's proven Fusion CAM jobs (named like "Glock 19/17 RMR slide cut v10"), Brad Tallis YouTube tutorials, Sandvik/Kennametal vendor PDFs, and Autodesk Fusion docs.

Output a single JSON object with these fields, no other text:
{
  "search_query": "cleaned/expanded version of the user's question for semantic embedding search. Fix typos, expand abbreviations.",
  "keyword_terms": ["specific terms to keyword-match against source names — only include unambiguous identifiers like firearm models, part names, materials, tool sizes"],
  "intent": "walkthrough | lookup | compare | general",
  "detected_jobs": ["specific machine/part/firearm names the user mentions"]
}

Intent definitions:
- walkthrough: user wants step-by-step CAM setup help ("walk me through", "how do I set up", "I need to cut...")
- lookup: user wants a specific value or fact ("what feed for", "what RPM does", "how deep")
- compare: user wants comparison ("difference between", "which is better")
- general: anything else

Common typo/abbreviation fixes for this domain:
- "block" almost always means "Glock" in this user's context (firearms machinist)
- Firearms: G19/G17/G43/G43X = Glock; P365 = Sig P365; XD/XD45 = Springfield; Hellcat = Springfield Hellcat
- Materials: 6061 = 6061-T6 aluminum; 4140 = steel; SS = stainless
- Tools: EM = endmill, BN = bullnose, CR = corner radius, DOC = depth of cut, SO = stepover

Examples:

Input: "I'm gonna be cutting an optic on block 19 can you look up the specifics for it"
Output:
{"search_query": "Glock 19 optic cut RMR slide CAM operations setup feeds speeds tools", "keyword_terms": ["Glock 19", "Glock"], "intent": "walkthrough", "detected_jobs": ["Glock 19"]}

Input: "walk me through how to set up CAM for a new slide using my Glock job as reference"
Output:
{"search_query": "Glock slide CAM setup walkthrough adaptive clearing contour drill thread", "keyword_terms": ["Glock", "slide cut"], "intent": "walkthrough", "detected_jobs": ["Glock"]}

Input: "what feed for 6061 with 1/4 EM"
Output:
{"search_query": "cutting feed rate for 6061 aluminum with 1/4 inch endmill", "keyword_terms": [], "intent": "lookup", "detected_jobs": []}

Input: "compare my Glock and P365 feeds"
Output:
{"search_query": "Glock and P365 slide cut feeds speeds comparison", "keyword_terms": ["Glock", "P365"], "intent": "compare", "detected_jobs": ["Glock", "P365"]}

OUTPUT ONLY THE JSON OBJECT, no surrounding prose.`;

export async function rewriteQuery(question: string): Promise<RewrittenQuery> {
  const fallback: RewrittenQuery = {
    search_query: question,
    keyword_terms: [],
    intent: "general",
    detected_jobs: [],
  };
  try {
    const resp = await client().messages.create({
      model: REWRITE_MODEL,
      max_tokens: 400,
      temperature: 0,
      system: SYSTEM,
      messages: [{ role: "user", content: question }],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    // Extract JSON block (defensive: strip code fences if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      search_query: typeof parsed.search_query === "string" && parsed.search_query.trim()
        ? parsed.search_query.trim()
        : question,
      keyword_terms: Array.isArray(parsed.keyword_terms)
        ? parsed.keyword_terms.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
        : [],
      intent: ["walkthrough", "lookup", "compare", "general"].includes(parsed.intent)
        ? (parsed.intent as Intent)
        : "general",
      detected_jobs: Array.isArray(parsed.detected_jobs)
        ? parsed.detected_jobs.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
        : [],
    };
  } catch (e) {
    console.warn("query rewrite failed, using raw question:", (e as Error).message);
    return fallback;
  }
}

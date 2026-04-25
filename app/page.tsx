"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Citation {
  n: number;
  source_type: string;
  source_name: string;
  source_url: string | null;
  source_ref: string | null;
  metadata?: Record<string, unknown>;
  text_excerpt: string;
  similarity: number;
}

interface AssistantMessage {
  role: "assistant";
  content: string;
  citations: Citation[];
  retrieved_count: number;
  latency_ms: number;
  error?: boolean;
}
interface UserMessage {
  role: "user";
  content: string;
  images?: string[]; // data URLs (for display)
}
type Message = UserMessage | AssistantMessage;

const SOURCE_FILTERS: { id: string; label: string }[] = [
  { id: "fusion_cam", label: "My Fusion CAM" },
  { id: "gcode", label: "G-code (machine)" },
  { id: "youtube", label: "YouTube" },
  { id: "fusion_docs", label: "Autodesk Docs" },
  { id: "pdf", label: "PDF" },
  { id: "markdown", label: "Markdown" }
];

const QUICK_QUESTIONS: Array<{ category: string; questions: string[] }> = [
  {
    category: "Specific feeds & speeds",
    questions: [
      "What feeds and speeds did I use for the optic cut on my Glock 19 RMR?",
      "What RPM and feed did I run for 2D adaptive clearing on the P365 slide?",
      "Show me the 2D contour finishing parameters from my Hellcat optic cut.",
      "What spindle speed did I use for thread milling on the G43X?",
      "What's my drilling RPM and feed for steel slides?",
      "What feeds did I run for facing aluminum on the VF-4?",
      "What's my standard adaptive stepover for 1/4\" endmill jobs?",
      "What plunge feed do I use for steel optic pockets?"
    ]
  },
  {
    category: "Cross-machine comparison",
    questions: [
      "Compare Power Rail AR feeds between my VF-2 and VF-4 — which runs more aggressive?",
      "I'm moving a job from VF-4 to Mini Mill — using my Glock G19 program as a reference, what should I scale back and why?",
      "Which machine have I been running my Krebs trunnion work on?",
      "Show me feed differences for the same operation type across all three mills.",
      "What's the average DOC I run on the Mini Mill vs the VF-class machines?",
      "Across my G-code, which machine has the highest RPM jobs?"
    ]
  },
  {
    category: "Geometric / setup",
    questions: [
      "In my Glock 19 RMR program (41917.nc), how far back from the probed front face does the cut start in X?",
      "What's the X span of the optic cut on my G26 Holosun K?",
      "Compare optic cut start-X across Glock 19, G26, G43 — what offset would I apply to relocate?",
      "Show me Z depth ranges for all my optic pocket cuts.",
      "What's the Y extent of my window cuts on the G34?",
      "For the VF-2 Power Rail upper, what's the full cutting envelope?"
    ]
  },
  {
    category: "Walkthrough / setup help",
    questions: [
      "Walk me through setting up CAM for a Glock 19 RMR optic cut, step by step in Fusion.",
      "I'm cutting a new optic pocket on a Glock 43. Use my G19 program as a template — what changes?",
      "Walk me through programming a thread mill operation in Fusion using my past Thread1 settings.",
      "Help me create a 2D adaptive clearing operation — UI navigation plus my proven values.",
      "Walk me through setting up a new slide job in Fusion (work offset, stock, fixturing).",
      "Show me how to set up a drill cycle for through-holes using my G19 RMR drill values.",
      "I have a new part drawing — guide me through creating a CAM setup using my Hellcat as reference.",
      "Walk me through using the FusionBrainCAMExport script and ingesting the result."
    ]
  },
  {
    category: "Threading & lathe",
    questions: [
      "Walk me through threading a 1/2-28 muzzle on my TL-1 — show all the math.",
      "What's the thread depth and Class 2A target OD for a 5/8-24 thread?",
      "Compare my .578-28 and .625-24 threading programs — what's different in the infeed schedule?",
      "Translate the threading cycle in my ST-30 lathe programs into plain English.",
      "What single-point threading mistakes should I avoid for stainless barrels?"
    ]
  },
  {
    category: "Tool selection",
    questions: [
      "What's a good starting feed and speed for 6061 with a 1/4\" carbide endmill?",
      "Recommend a tool for optic-pocket roughing in steel.",
      "What endmill geometry should I use for finishing a Glock slide pocket?",
      "For a thread mill operation in stainless, what tool would you recommend?",
      "Compare 3-flute vs 4-flute endmills for slot milling aluminum."
    ]
  },
  {
    category: "Theory / reference",
    questions: [
      "Explain chip thinning and how it affects my feed rate calculations.",
      "What's the difference between climb milling and conventional milling — when do I use which?",
      "How do I choose between adaptive clearing and 2D contour for a pocket?",
      "Explain ramp angle for adaptive operations — what's typical for steel vs aluminum?",
      "What's the math behind chip load for face mills vs endmills?",
      "What does helix angle do to cutting performance?"
    ]
  },
  {
    category: "Troubleshooting",
    questions: [
      "My endmill is chattering on the VF-2 in 4140 — what could be wrong?",
      "I'm getting tool deflection on a long-reach pocket — how do I fix it?",
      "What causes finish marks on a 2D contour finishing pass?",
      "My drill is breaking in stainless — what should I check?",
      "Poor surface finish on aluminum — what parameters should I adjust?"
    ]
  },
  {
    category: "Materials",
    questions: [
      "What feeds and speeds have I used for 17-4 stainless?",
      "Compare my titanium machining vs aluminum across the fleet.",
      "For 7075 aluminum, what RPM range should I target?"
    ]
  }
];

function buildSourceLink(c: Citation): string | null {
  if (!c.source_url) return null;
  if (c.source_type === "youtube") {
    const startSec = (c.metadata as { start_seconds?: number } | undefined)?.start_seconds;
    if (typeof startSec === "number" && c.source_url.includes("youtube.com/watch")) {
      const sep = c.source_url.includes("?") ? "&" : "?";
      return `${c.source_url}${sep}t=${Math.floor(startSec)}s`;
    }
  }
  return c.source_url;
}

function renderAnswerWithRefs(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  const re = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <sup key={key++} className="text-accent font-semibold">
        [{m[1]}]
      </sup>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fillQuestion = (q: string) => {
    setInput(q);
    textareaRef.current?.focus();
  };

  const copyQuestion = async (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(q);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = q;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const toggleFilter = (id: string) => {
    setFilterTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addImageFromBlob = (blob: Blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImages((prev) => [...prev, url]);
    };
    reader.readAsDataURL(blob);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItems = Array.from(e.clipboardData.items).filter((i) =>
      i.type.startsWith("image/")
    );
    if (imageItems.length === 0) return;
    e.preventDefault();
    for (const item of imageItems) {
      const blob = item.getAsFile();
      if (blob) addImageFromBlob(blob);
    }
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.type.startsWith("image/")) addImageFromBlob(f);
    }
  };

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: UserMessage = {
      role: "user",
      content: q,
      images: images.length > 0 ? [...images] : undefined,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const sentImages = images;
    setImages([]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          top_k: 10,
          filter_types: filterTypes.length > 0 ? filterTypes : undefined,
          images: sentImages.length > 0 ? sentImages : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations ?? [],
          retrieved_count: (data.retrieved_chunk_ids ?? []).length,
          latency_ms: data.latency_ms ?? 0
        }
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Error: ${(e as Error).message}`,
          citations: [],
          retrieved_count: 0,
          latency_ms: 0,
          error: true
        }
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-muted hover:text-text border border-border rounded px-2 py-1 text-xs"
            title={sidebarOpen ? "Hide questions panel" : "Show questions panel"}
          >
            {sidebarOpen ? "❮" : "❯"}
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Robert&apos;s Fusion<span className="text-accent">Brain</span>
            </h1>
            <p className="text-xs text-muted">CNC / CAM / Fusion 360 knowledge assistant</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {SOURCE_FILTERS.map((f) => (
            <label
              key={f.id}
              className={`text-xs px-2.5 py-1 rounded-md cursor-pointer border transition-colors ${
                filterTypes.includes(f.id)
                  ? "border-accent bg-accent-soft/20 text-text"
                  : "border-border bg-panel text-muted hover:text-text"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={filterTypes.includes(f.id)}
                onChange={() => toggleFilter(f.id)}
              />
              {f.label}
            </label>
          ))}
          <Link
            href="/admin"
            className="text-xs px-2.5 py-1 rounded-md border border-border bg-panel text-muted hover:text-text hover:border-accent ml-2"
            title="Admin: add data to the knowledge base"
          >
            ⚙ Admin
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
      {sidebarOpen && (
        <aside className="w-72 border-r border-border bg-surface overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-border sticky top-0 bg-surface z-10">
            <div className="text-xs uppercase tracking-wide text-muted">Quick questions</div>
            <div className="text-[10px] text-muted mt-0.5">Click to fill, 📋 to copy</div>
          </div>
          <div className="p-3 space-y-4">
            {QUICK_QUESTIONS.map((cat) => (
              <details key={cat.category} open className="group">
                <summary className="text-xs font-semibold text-accent cursor-pointer mb-1.5 list-none flex items-center justify-between">
                  <span>{cat.category}</span>
                  <span className="text-muted text-[10px]">{cat.questions.length}</span>
                </summary>
                <ul className="space-y-1">
                  {cat.questions.map((q, i) => (
                    <li
                      key={i}
                      onClick={() => fillQuestion(q)}
                      className="group/q flex gap-2 items-start bg-panel hover:bg-bg border border-border rounded p-2 cursor-pointer transition-colors hover:border-accent"
                    >
                      <span className="flex-1 text-[11px] leading-snug text-muted group-hover/q:text-text">
                        {q}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copyQuestion(q, e)}
                        className="text-muted hover:text-accent text-xs shrink-0"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </aside>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted text-sm mt-16">
              <p className="mb-2">Ask a question about Fusion 360, CAM, or CNC machining.</p>
              <p className="text-xs">
                Paste a screenshot of Fusion (Ctrl+V in the box below) for context.
              </p>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] bg-panel border border-border rounded-lg px-4 py-3">
                  {m.images && m.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {m.images.map((img, ii) => (
                        <div key={ii} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`attached ${ii + 1}`}
                            className="max-h-48 rounded border border-border"
                          />
                          <span className="absolute top-1 left-1 bg-bg/85 text-accent text-[10px] font-mono px-1 rounded">
                            image {ii + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[90%] w-full">
                  <div
                    className={`rounded-lg px-4 py-3 border ${
                      m.error
                        ? "border-red-900 bg-red-950/30"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {renderAnswerWithRefs(m.content)}
                    </div>
                    {!m.error && m.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-muted mb-2">
                          {m.retrieved_count} chunks · {(m.latency_ms / 1000).toFixed(1)}s
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.citations.map((c) => {
                            const key = `${i}-${c.n}`;
                            const href = buildSourceLink(c);
                            return (
                              <div key={c.n} className="inline-block">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpanded((e) => ({ ...e, [key]: !e[key] }))
                                  }
                                  className="text-xs px-2 py-1 rounded border border-border bg-panel hover:border-accent hover:text-text text-muted"
                                  title={c.source_name}
                                >
                                  <span className="text-accent">[{c.n}]</span>{" "}
                                  {c.source_name.slice(0, 50)}
                                  {c.source_name.length > 50 ? "…" : ""}
                                  {c.source_ref ? ` · ${c.source_ref}` : ""}
                                </button>
                                {expanded[key] && (
                                  <div className="mt-1 p-2 bg-bg border border-border rounded text-xs text-muted max-w-xl">
                                    <div className="mb-1 flex justify-between items-center">
                                      <span className="font-mono text-[10px] uppercase text-accent">
                                        {c.source_type} · sim {c.similarity}
                                      </span>
                                      {href && (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-accent hover:underline"
                                        >
                                          open source ↗
                                        </a>
                                      )}
                                    </div>
                                    <div className="whitespace-pre-wrap">{c.text_excerpt}</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-lg px-4 py-3 text-sm text-muted">
                <span className="inline-block animate-pulse">Retrieving and thinking…</span>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <footer className="border-t border-border bg-surface px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {images.length > 0 && (
            <div className="mb-2 flex items-start gap-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`preview ${idx + 1}`}
                    className="h-20 rounded border border-border"
                  />
                  <span className="absolute top-1 left-1 bg-bg/85 text-accent text-[10px] font-mono px-1 rounded">
                    image {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-bg border border-border text-muted hover:text-text text-xs leading-none"
                    title="remove"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="text-[10px] text-muted self-center ml-1 max-w-[12rem]">
                In your question you can refer to these as <span className="text-accent">image 1</span>,{" "}
                <span className="text-accent">image 2</span>, etc.
              </div>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={handlePaste}
              rows={2}
              placeholder="Ask about Fusion, CAM, or CNC — paste screenshots with Ctrl+V (multiple supported)"
              className="flex-1 bg-panel border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
              disabled={loading}
            />
            <label className="cursor-pointer text-xs px-3 py-2 rounded-md border border-border bg-panel text-muted hover:text-text hover:border-accent" title="Attach image(s)">
              📎
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-md bg-accent text-bg font-medium text-sm disabled:opacity-40 hover:bg-accent-soft transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

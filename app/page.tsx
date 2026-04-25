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
  image?: string; // data URL (for display)
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
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const toggleFilter = (id: string) => {
    setFilterTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const blob = item.getAsFile();
    if (!blob) return;
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(blob);
  }, []);

  const handleFile = (f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: UserMessage = { role: "user", content: q, image: image ?? undefined };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const sentImage = image;
    setImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          top_k: 10,
          filter_types: filterTypes.length > 0 ? filterTypes : undefined,
          image: sentImage ?? undefined
        })
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
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Fusion<span className="text-accent">Brain</span>
          </h1>
          <p className="text-xs text-muted">CNC / CAM / Fusion 360 knowledge assistant</p>
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
                  {m.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image}
                      alt="attached"
                      className="max-h-48 rounded border border-border mb-2"
                    />
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

      <footer className="border-t border-border bg-surface px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {image && (
            <div className="mb-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="preview"
                className="h-16 rounded border border-border"
              />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-xs text-muted hover:text-text"
              >
                remove
              </button>
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
              placeholder="Ask about Fusion, CAM, or CNC — paste a Fusion screenshot with Ctrl+V"
              className="flex-1 bg-panel border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
              disabled={loading}
            />
            <label className="cursor-pointer text-xs px-3 py-2 rounded-md border border-border bg-panel text-muted hover:text-text hover:border-accent">
              📎
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
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

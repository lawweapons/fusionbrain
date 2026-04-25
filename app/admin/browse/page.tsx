"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Source {
  source_type: string;
  source_name: string;
  machine: string;
  chunks: number;
  last_added: string;
}
interface Chunk {
  chunk_index: number;
  text: string;
  source_ref: string | null;
  metadata: Record<string, unknown>;
  source_url: string | null;
  created_at: string;
}
interface Facets {
  machines: { machine: string; count: number }[];
  source_types: { source_type: string; count: number }[];
}

const SOURCE_LABEL: Record<string, string> = {
  fusion_cam: "Fusion CAM",
  gcode: "G-code",
  pdf: "PDF",
  markdown: "Markdown",
  youtube: "YouTube",
  fusion_docs: "Autodesk Docs",
};

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export default function BrowsePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [facets, setFacets] = useState<Facets>({ machines: [], source_types: [] });
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState<string>("");
  const [filterMachine, setFilterMachine] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [openKey, setOpenKey] = useState<string | null>(null);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [openChunks, setOpenChunks] = useState<Chunk[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("source_type", filterType);
      if (filterMachine) params.set("machine", filterMachine);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch("/api/admin/sources?" + params.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSources(data.sources ?? []);
      setFacets(data.facets ?? { machines: [], source_types: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterMachine, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openSource = async (src: Source) => {
    const key = `${src.source_type}::${src.source_name}`;
    if (openKey === key) {
      setOpenKey(null);
      setOpenChunks([]);
      return;
    }
    setOpenKey(key);
    setChunksLoading(true);
    setOpenChunks([]);
    try {
      const params = new URLSearchParams({
        source_type: src.source_type,
        source_name: src.source_name,
      });
      const res = await fetch("/api/admin/source/chunks?" + params.toString());
      const data = await res.json();
      if (res.ok) setOpenChunks(data.chunks ?? []);
    } finally {
      setChunksLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };

  const copyFullSource = () => {
    const blob = openChunks.map((c) => c.text).join("\n\n---\n\n");
    copy(blob);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Robert&apos;s Fusion<span className="text-accent">Brain</span> · Browse data
          </h1>
          <p className="text-xs text-muted">Inspect what's been ingested. Copy any chunk or full source to clipboard.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="text-sm px-3 py-1.5 rounded-md border border-border bg-panel text-muted hover:text-text hover:border-accent"
          >
            ← Admin
          </Link>
          <Link
            href="/"
            className="text-sm px-3 py-1.5 rounded-md border border-border bg-panel text-muted hover:text-text hover:border-accent"
          >
            Chat
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <section className="border border-border bg-surface rounded-lg p-4 space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted mb-1.5">Source type</div>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={filterType === ""}
                onClick={() => setFilterType("")}
                label={`All (${facets.source_types.reduce((s, t) => s + t.count, 0).toLocaleString()})`}
              />
              {facets.source_types.map((t) => (
                <Chip
                  key={t.source_type}
                  active={filterType === t.source_type}
                  onClick={() => setFilterType(t.source_type)}
                  label={`${SOURCE_LABEL[t.source_type] ?? t.source_type} (${t.count.toLocaleString()})`}
                />
              ))}
            </div>
          </div>

          {facets.machines.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted mb-1.5">Machine</div>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={filterMachine === ""}
                  onClick={() => setFilterMachine("")}
                  label="Any machine"
                />
                {facets.machines.map((m) => (
                  <Chip
                    key={m.machine}
                    active={filterMachine === m.machine}
                    onClick={() => setFilterMachine(m.machine)}
                    label={`${m.machine} (${m.count.toLocaleString()})`}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search source name (e.g. 'Glock 19', '41917', 'Power Rail')"
              className="w-full bg-panel border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </section>

        {/* Sources table */}
        <section className="border border-border bg-surface rounded-lg overflow-hidden">
          <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted border-b border-border flex justify-between">
            <span>{sources.length} sources</span>
            {loading && <span className="text-accent">loading…</span>}
          </div>
          <div className="divide-y divide-border max-h-[calc(100vh-340px)] overflow-y-auto">
            {sources.length === 0 && !loading && (
              <div className="p-6 text-center text-muted text-sm">No sources match.</div>
            )}
            {sources.map((src) => {
              const key = `${src.source_type}::${src.source_name}`;
              const isOpen = openKey === key;
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => openSource(src)}
                    className="w-full text-left px-4 py-2.5 hover:bg-panel flex items-center gap-3 text-sm"
                  >
                    <span className="text-xs px-1.5 py-0.5 rounded bg-bg text-muted border border-border whitespace-nowrap font-mono">
                      {SOURCE_LABEL[src.source_type] ?? src.source_type}
                    </span>
                    {src.machine && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent-soft/20 text-accent border border-accent-soft/30 whitespace-nowrap">
                        {src.machine}
                      </span>
                    )}
                    <span className="flex-1 truncate font-mono text-xs">{src.source_name}</span>
                    <span className="text-xs text-muted whitespace-nowrap">{src.chunks} chunks</span>
                    <span className="text-xs text-muted whitespace-nowrap">{fmtDate(src.last_added)}</span>
                    <span className="text-xs text-muted">{isOpen ? "▾" : "▸"}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 py-3 bg-bg border-t border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted">
                          {chunksLoading ? "Loading chunks…" : `${openChunks.length} chunks loaded`}
                        </span>
                        {openChunks.length > 0 && (
                          <button
                            type="button"
                            onClick={copyFullSource}
                            className="text-xs px-2 py-1 rounded border border-border bg-panel text-muted hover:text-text hover:border-accent"
                          >
                            Copy all chunks (full source)
                          </button>
                        )}
                      </div>

                      {openChunks.map((c) => (
                        <div key={c.chunk_index} className="border border-border rounded p-2 bg-surface">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] uppercase font-mono text-accent">
                              chunk {c.chunk_index}
                              {c.source_ref ? ` · ${c.source_ref}` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => copy(c.text)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted hover:text-text hover:border-accent"
                            >
                              copy
                            </button>
                          </div>
                          <pre className="text-[11px] whitespace-pre-wrap font-mono text-muted leading-relaxed max-h-80 overflow-auto">
                            {c.text}
                          </pre>
                          {c.metadata && Object.keys(c.metadata).length > 0 && (
                            <details className="mt-1">
                              <summary className="text-[10px] text-muted cursor-pointer hover:text-text">
                                metadata
                              </summary>
                              <pre className="text-[10px] text-muted mt-1 overflow-x-auto">
                                {JSON.stringify(c.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
        active
          ? "border-accent bg-accent-soft/20 text-text"
          : "border-border bg-panel text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

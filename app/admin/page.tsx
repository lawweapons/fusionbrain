"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Stats {
  total_chunks: number;
  by_source_type: { source_type: string; chunks: number }[];
  recent_sources: { source_type: string; source_name: string; chunks: number; last_added: string }[];
}

interface FileResult {
  filename: string;
  status: "ok" | "skipped" | "error";
  inserted_chunks?: number;
  message?: string;
}

const SOURCE_LABEL: Record<string, string> = {
  fusion_cam: "Fusion CAM",
  pdf: "PDF",
  markdown: "Markdown",
  youtube: "YouTube",
  fusion_docs: "Autodesk Docs",
  json: "Generic JSON",
};

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [dragKind, setDragKind] = useState<string | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const mdInput = useRef<HTMLInputElement>(null);
  const fbInput = useRef<HTMLInputElement>(null);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
      setStatsErr(null);
    } catch (e) {
      setStatsErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    setResults([]);
    const fd = new FormData();
    for (const f of Array.from(files as FileList)) fd.append("files", f);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResults(data.files ?? []);
      await refreshStats();
    } catch (e) {
      setResults([{ filename: "(upload)", status: "error", message: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragKind(null);
    handleUpload(e.dataTransfer?.files ?? null);
  };

  const onDragOver = (e: React.DragEvent, kind: string) => {
    e.preventDefault();
    setDragKind(kind);
  };

  const onDragLeave = () => setDragKind(null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Fusion<span className="text-accent">Brain</span> · Admin
          </h1>
          <p className="text-xs text-muted">Add data to the knowledge base</p>
        </div>
        <Link
          href="/"
          className="text-sm px-3 py-1.5 rounded-md border border-border bg-panel text-muted hover:text-text hover:border-accent"
        >
          ← Back to chat
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Stats panel */}
        <section className="border border-border bg-surface rounded-lg p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Knowledge base
          </h2>
          {statsErr && <div className="text-xs text-red-400">stats error: {statsErr}</div>}
          {stats ? (
            <>
              <div className="text-3xl font-bold">{stats.total_chunks.toLocaleString()}</div>
              <div className="text-xs text-muted mb-4">total chunks</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stats.by_source_type.map((s) => (
                  <div key={s.source_type} className="bg-panel border border-border rounded px-3 py-2">
                    <div className="text-xs text-muted">{SOURCE_LABEL[s.source_type] ?? s.source_type}</div>
                    <div className="text-lg font-medium">{s.chunks.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {stats.recent_sources.length > 0 && (
                <details className="mt-4">
                  <summary className="text-xs text-muted cursor-pointer hover:text-text">
                    Recently added sources ({stats.recent_sources.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {stats.recent_sources.map((s, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">
                          <span className="text-accent">[{SOURCE_LABEL[s.source_type] ?? s.source_type}]</span>{" "}
                          {s.source_name}
                        </span>
                        <span className="text-muted whitespace-nowrap">
                          {s.chunks} chunks · {fmtDate(s.last_added)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <div className="text-muted text-sm">Loading…</div>
          )}
        </section>

        {/* PDF section */}
        <UploadSection
          kind="pdf"
          title="📄 PDF"
          description="Vendor catalogs, machine manuals, technical guides. Each page becomes searchable; citations link back as 'p.42'. Scanned PDFs without embedded text are skipped."
          accept=".pdf"
          inputRef={pdfInput}
          dragKind={dragKind}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onChange={handleUpload}
          busy={busy}
          help={[
            "Drag and drop PDFs, or click to browse. Multi-select works.",
            "Recommended sources: Sandvik Coromant guides, Kennametal Master Catalog, Iscar/Harvey Tool tech PDFs, Haas user manuals.",
          ]}
        />

        {/* Markdown section */}
        <UploadSection
          kind="markdown"
          title="📝 Markdown"
          description="Notes, cheat sheets, project documentation. Splits on headings, keeps section context."
          accept=".md,.markdown"
          inputRef={mdInput}
          dragKind={dragKind}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onChange={handleUpload}
          busy={busy}
          help={[
            "Drop one or many .md files.",
            "Useful for: post-processor notes, fixture standard operating procedures, calibration logs, project recaps.",
          ]}
        />

        {/* Fusion CAM section — full step-by-step inline */}
        <UploadSection
          kind="fusion_cam"
          title="🛠️ Fusion CAM (.fb.json)"
          description="Your proven CAM operation data — feeds, speeds, tools, depths — exported from a Fusion document. One chunk per operation."
          accept=".json,.fb.json"
          inputRef={fbInput}
          dragKind={dragKind}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onChange={handleUpload}
          busy={busy}
          help={[
            "How to export from Fusion (~30 sec per project):",
            "  1. Open the .f3d project in Fusion",
            "  2. Switch to the Manufacture workspace (top-left workspace dropdown)",
            "  3. Press Shift+S (or Utilities → Add-Ins → Scripts and Add-Ins)",
            "  4. Click 'All scripts and add-ins' → find FusionBrainCAMExport → click ▶ Run",
            "  5. (Multi-tab) Pick 'Yes' to export all open documents to a folder",
            "  6. Drag the resulting .fb.json file(s) onto this drop zone",
          ]}
        />

        {/* YouTube section — Phase 2 instructions */}
        <section className="border border-border bg-surface rounded-lg p-5">
          <h2 className="text-base font-semibold mb-1">📺 YouTube</h2>
          <p className="text-sm text-muted mb-4">
            YouTube blocks the VPS IP for transcript fetching, so YouTube ingest still runs from your PC.
            Below: how to set up cookies once so you can ingest large channels reliably.
          </p>

          <details className="mt-2">
            <summary className="text-sm font-medium cursor-pointer hover:text-accent">
              How to ingest a YouTube video / channel from your PC
            </summary>
            <div className="mt-3 text-sm space-y-2 text-muted bg-panel border border-border rounded p-3 font-mono">
              <div className="text-text font-sans mb-2">
                In Git Bash (open from Start menu):
              </div>
              <pre className="whitespace-pre-wrap text-xs">{`cd "/c/Users/rober/OneDrive/Documents/CODE/fusionbrain/ingest"
source .venv/Scripts/activate
PYTHONIOENCODING=utf-8 python ingest_youtube.py "https://www.youtube.com/watch?v=VIDEO_ID"

# Or a whole channel:
PYTHONIOENCODING=utf-8 python ingest_youtube.py "https://www.youtube.com/@channel/videos"

# With cookies (rate limit workaround):
PYTHONIOENCODING=utf-8 python ingest_youtube.py "URL" --cookies "/c/Users/rober/Documents/cookies.txt"`}</pre>
            </div>
          </details>

          <details className="mt-2">
            <summary className="text-sm font-medium cursor-pointer hover:text-accent">
              How to export YouTube cookies (for big-channel ingestion without rate limits)
            </summary>
            <ol className="mt-3 text-sm space-y-2 list-decimal list-inside text-muted">
              <li>
                Open Chrome (or Edge) and install the extension{" "}
                <span className="text-accent">&quot;Get cookies.txt LOCALLY&quot;</span> from the Chrome Web Store
                (search by that exact name; the publisher should be &quot;Rahul Shaw&quot;).
              </li>
              <li>
                Go to <span className="text-accent">youtube.com</span> and make sure you&apos;re logged in.
              </li>
              <li>
                Click the extension icon in the toolbar, click <span className="text-accent">Export</span>{" "}
                (Netscape format).
              </li>
              <li>
                Save the file as <code className="text-accent">cookies.txt</code> in{" "}
                <code className="text-accent">C:\Users\rober\Documents\</code>
              </li>
              <li>
                Use it in the ingest command above with{" "}
                <code className="text-accent">--cookies &quot;/c/Users/rober/Documents/cookies.txt&quot;</code>
              </li>
              <li>Cookies expire in a few weeks — re-export when YouTube starts rate-limiting again.</li>
            </ol>
          </details>
        </section>

        {/* Results */}
        {(busy || results.length > 0) && (
          <section className="border border-border bg-surface rounded-lg p-5">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              {busy ? "Processing…" : "Last upload results"}
            </h2>
            {busy && (
              <div className="text-sm text-muted animate-pulse">
                Parsing, chunking, embedding, inserting. Large PDFs can take a few minutes.
              </div>
            )}
            <ul className="space-y-1 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex justify-between gap-3 py-1 border-b border-border/50 last:border-0">
                  <span className="truncate">
                    {r.status === "ok" && <span className="text-green-500">✓</span>}
                    {r.status === "skipped" && <span className="text-yellow-500">⊘</span>}
                    {r.status === "error" && <span className="text-red-500">✗</span>}{" "}
                    {r.filename}
                  </span>
                  <span className="text-muted whitespace-nowrap text-xs">
                    {r.status === "ok" && `${r.inserted_chunks} chunks inserted`}
                    {r.status === "skipped" && `skipped — ${r.message}`}
                    {r.status === "error" && `error — ${r.message}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

interface UploadSectionProps {
  kind: string;
  title: string;
  description: string;
  accept: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  dragKind: string | null;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, kind: string) => void;
  onDragLeave: () => void;
  onChange: (files: FileList | null) => void;
  busy: boolean;
  help: string[];
}

function UploadSection({
  kind,
  title,
  description,
  accept,
  inputRef,
  dragKind,
  onDrop,
  onDragOver,
  onDragLeave,
  onChange,
  busy,
  help,
}: UploadSectionProps) {
  const dragging = dragKind === kind;
  return (
    <section className="border border-border bg-surface rounded-lg p-5">
      <h2 className="text-base font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted mb-3">{description}</p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => onDragOver(e, kind)}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-accent bg-accent-soft/10 text-text"
            : "border-border bg-bg/50 text-muted hover:border-accent hover:text-text"
        } ${busy ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="text-sm font-medium">Drop files here, or click to browse</div>
        <div className="text-xs mt-1 text-muted">accepts {accept}</div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />

      {help.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-muted cursor-pointer hover:text-text">
            Quick instructions
          </summary>
          <ul className="mt-2 text-xs text-muted space-y-1">
            {help.map((h, i) => (
              <li key={i} className="font-mono whitespace-pre-wrap">
                {h}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

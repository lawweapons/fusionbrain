# FusionBrain

**A personal RAG (retrieval-augmented generation) system for CNC, CAM, and Autodesk Fusion 360.**

Ask a question. FusionBrain finds the most relevant passages across a curated knowledge base of YouTube transcripts, Autodesk documentation, and reference material, then has Claude synthesize an answer citing those specific passages. Zero hallucination by design — every factual claim is traceable to an exact video timestamp or doc page.

![status: v0.1 — early alpha](https://img.shields.io/badge/status-v0.1_alpha-b8621b)

---

## What problem it solves

If you're learning Fusion 360 or running production CAM work, you know the pain: the answer to your question is *probably* in one of the 201 Brad Tallis videos you watched last month, or in some forum thread from 2024, or buried in the Autodesk help. You can't find it by memory, YouTube search is bad, and generic ChatGPT doesn't know the specifics of your setup.

FusionBrain ingests the sources *you* trust, chunks them, embeds them, and makes them searchable by meaning. When you ask "what feed rate does Brad use for 6061 aluminum slotting?", it retrieves the ten most relevant 500-word excerpts across everything you've ingested, and hands them to Claude with a strict instruction: **answer using only these passages, cite which passage each claim came from, and say so if the passages don't cover the question.**

The result: precise, sourced answers, with clickable citations that jump you to the exact moment in the video.

## Features

- **Vision support**: paste a screenshot of Fusion 360 (Ctrl+V in the chat box) and ask about what you're looking at. Claude sees the screenshot AND the retrieved passages.
- **Source filtering**: toggle YouTube / Autodesk Docs / PDF / JSON / Markdown to scope retrieval
- **Citation round-trip**: every claim links back to the exact YouTube timestamp or PDF page
- **Multi-source**: same pipeline ingests YouTube channels, official docs, PDFs, JSON parameter sets, markdown notes
- **Idempotent ingestion**: re-run an ingest and duplicates are skipped
- **MCP-ready API**: the `/api/ask` endpoint is a clean JSON API, easy to wrap as an MCP tool for use inside Claude Desktop

## Architecture

```
Browser  ── HTTP Basic Auth ──>  Next.js (port 3100)
                                      │
                                      ├── /api/ask     (question → retrieve → answer)
                                      ├── /api/ingest  (bearer-token; pre-chunked payload)
                                      └── /api/health
                                      │
                                      ▼
                          Postgres + pgvector (localhost:5432)
                            table: chunks (1024-dim embeddings, HNSW index)
                                      ▲
                                      │
         Python ingest scripts ──────┘
         (yt-dlp, pypdf, requests, psycopg)
```

**Stack choices** (and why):
- **No RAG framework.** Direct code, ~400 LOC server-side. Easier to debug, no version lock-in.
- **voyage-3-large** (1024d) for embeddings — best-in-class for technical content, $0.18/M tokens
- **pgvector** + HNSW — stores embeddings inside Postgres; no separate vector DB to maintain
- **Claude Sonnet 4.6** — strong reasoning, honest about uncertainty, native vision
- **Next.js App Router** — matches the existing server pattern on the host VPS

## Ingested sources (v1 target)

- YouTube: Brad Tallis, NYC CNC, Autodesk Fusion official, Titans of CNC, Saunders Machine Works
- Autodesk Fusion 360 help docs (official)

See [issues with the `ingest-source` label](../../issues?q=label%3Aingest-source) for proposed additions.

## Local development

**You do not need the production database to work on the code** — CI builds against stub env vars. For actually running queries you need:

1. Node 20+, Python 3.12+, Postgres 16 with `pgvector`
2. `cp .env.example .env` and fill in real values
3. `npm install` → `npm run dev` (runs on port 3100)
4. In a separate shell: `cd ingest && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
5. Run DB schema: `psql -d fusionbrain_db -f lib/schema.sql`
6. Ingest a test video: `python ingest/ingest_youtube.py "https://www.youtube.com/watch?v=..."`

## Deployment

Lives at `/home/fusionbrain/` on a dedicated Linux user on the production VPS. PM2 manages the process as `fusionbrain-api` on port 3100. See internal SERVERS.md.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: fork, branch, PR. CI must pass. No secrets. No frameworks.

The single highest-value contribution is **adding a new ingest source** — a YouTube channel, a doc site, a forum archive. See the "Propose a new ingest source" issue template.

## License

MIT. See [LICENSE](LICENSE).

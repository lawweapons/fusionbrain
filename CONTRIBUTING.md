# Contributing to FusionBrain

Thanks for wanting to help. This is a personal learning tool, but contributions from folks who know Fusion, CAM, or CNC well are very welcome.

## Ground rules

1. **Every change goes through a pull request.** Even the maintainer cannot push directly to `main`.
2. **CI must pass.** Type-check, lint, and build are required checks.
3. **No secrets in the repo, ever.** `.env` is gitignored. `.env.example` shows the shape; real values live only on the production VPS.
4. **No RAG frameworks.** No LangChain, LlamaIndex, Haystack, etc. Direct code only.
5. **Keep the server-side code lean.** Target ~400 lines of TypeScript for the core RAG loop. If a PR grows the surface area a lot, explain why.

## How to propose a change

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/short-description`
3. Make your change; run `npm run typecheck` and `npm run lint` locally
4. Commit with a clear message (see "Commit style" below)
5. Open a PR against `main`. Fill in the template.
6. Wait for review. Be patient — this is a side project.

## Commit style

Conventional-ish, short:
- `feat(ingest): add support for Autodesk help sitemap`
- `fix(retrieve): clamp top_k to [1,30]`
- `docs: clarify voyage API input_type usage`

## High-value contributions

If you're looking for ways to help:

### Add a new ingest source
The most impactful contributions. See `ingest/ingest_youtube.py` as a reference. To add a new source:

1. Write a new `ingest_<source>.py` in `ingest/`
2. It should produce `chunks` matching the format in `lib/schema.sql`
3. Use the shared helpers in `ingest/common.py` (chunking, embedding, DB insert)
4. Document expected CLI usage at the top of the file
5. Open a PR with a description of what the source adds and a sample query that the new content can answer

Candidate sources that would improve coverage:
- Autodesk Fusion forums (high-quality Q&A threads)
- Haas machine user manuals (PDF — `ingest_pdf.py` exists)
- Practical Machinist forum CAM threads
- Machining Doctor / Sandvik feeds-and-speeds reference data
- Your own CAM parameter JSON exports

### Improve retrieval quality
- Hybrid search (BM25 + vector) in `lib/retrieve.ts`
- Reranker integration (Cohere rerank, Voyage rerank)
- Query rewriting / HyDE for better embedding match

### Improve the UI
- Keep the dark aesthetic (matte black, gunmetal, burnt copper accents)
- Don't add a state management library — `useState` is enough

## What NOT to PR

- Renames for aesthetic reasons
- Dependency additions without a specific reason (justify in PR description)
- Large refactors without prior discussion (open an issue first)
- Streaming responses (planned for a later version; don't add yet)
- Agentic tool use by the answering LLM (explicitly out of scope for v1)

## License

By contributing you agree your code is released under the MIT license (see [LICENSE](LICENSE)).

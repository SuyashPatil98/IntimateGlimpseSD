# SystemDesignAI — Project Context for AI Sessions

SystemDesignAI is a **personal system design learning platform** — not a SaaS product, not a course. It is a self-contained tool for one user to study, query, and grow a structured knowledge base about system design. The core philosophy: **conversations are temporary, the vault is permanent.** Everything valuable gets distilled and saved. The LLM is a compiler, not a chatbot.

Inspired by Karpathy's LLM Wiki approach.

> **This document is the merged source of truth.** It reconciles the build plan in
> `opus-master-brief.md` (the authoritative, newest plan — dated 2026-06-08) with the
> *actual* state of the code as of this writing. Where the two disagree, the brief wins
> for **intent** and the code wins for **what exists today**. Sections are explicitly
> tagged **[NOW]** (exists and runs) or **[PLANNED]** (designed, not built).

---

## ⚠️ Reality vs. Aspiration — read this first

Prior versions of this file described a system that is largely **aspirational**. The code on disk is an earlier, simpler stage. Do not trust capability claims without checking the file. The concrete gaps as of now:

| Claim in old docs / brief | Actual state |
|---|---|
| Frontend is "Vite + React" | **Vanilla JS.** One file: `course-app/src/main.js` (~688 lines) + `index.css`. No React, no Tailwind, no Router, no Cytoscape, no Recharts. Deps are `vite`, `d3`, `fuse.js`, `marked`. |
| FAISS semantic search exists/planned-on-installed-deps | **Not built. Deps not installed.** `faiss-cpu` and `sentence-transformers` are **absent** from `.venv`. Retrieval is pure keyword/token-overlap. |
| Claude backend available | **Not built.** `anthropic` SDK **not installed**. `llm_adapter.py` supports only Ollama + Gemini. |
| Ingest pipeline / watcher | **Not built.** `watchdog` and `pymupdf4llm` **not installed**. No `watcher.py`, `ingest.py`, `extractor.py`. |
| `tools/prompts/` with Opus-generated templates | **Does not exist.** All prompts are inline string literals in `api.py` and `query_engine.py`. |
| Multi-turn sessions | **Not built.** Every `/api/ask` is single-turn. No session state. |
| Automated post-write pipeline / backlink patcher | **Not built.** `confirm_promotion` only re-runs `export_json.py`. No lint, no backlink patch, no index/log update on write. |
| Vault has 295 pages | **~301 concept pages** now (grew past the 289→295 figures via edits). Per-area counts below are corrected. |
| `aliases.json`, `raw/manifest.json` | **Missing.** Aliases currently live in per-page frontmatter (`aliases:`), not a JSON map. |

**The known append bug is live:** `confirm_promotion` (and the CLI promote path in `query_engine.py`) append promoted content under a literal `## Recent Insights` heading at the bottom of the target page — exactly the "sediment" failure mode the integrity section warns against. Fixing this is part of the EXTEND work in the plan.

Everything below is tagged so you always know which world you're in.

---

## Repo facts

- **Path:** `C:\Projects\SystemDesignAI\SystemDesign` (moved here from `C:\Projects\KnowledgeBase\SystemDesign`; some in-vault docs still reference the old path).
- **Not a git repository.** There is no version history. Be careful with destructive edits — there is no `git checkout` to undo them.
- **Platform:** Windows 11, PowerShell default shell. Use PowerShell or the Bash tool (POSIX) — paths have spaces and the user's home is `C:\Users\Suyash Patil`.
- **`.env`** at repo root currently holds a single malformed line (`api key =...`) — **not** a usable named environment variable. Real keys (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) must be added properly before the API backends work.
- **`brain`** — a bash CLI entry point at repo root: `brain ask "<question>"` → `query_engine.py`; `brain reflect` → `reflection_engine.py`.

---

## Philosophy & Mental Model

- **The vault is the brain.** ~300 structured markdown pages are the ground truth. The LLM answers grounded in vault context — it does not hallucinate from general knowledge when the vault covers the topic.
- **Conversations are interfaces, not storage.** A Q&A session is useful in the moment. The Knowledge Compiler decides what is worth keeping permanently.
- **Quality over quantity.** The compiler rejects low-signal content. Only distilled, reusable knowledge enters the vault.
- **The flywheel.** More content → richer vault → better answers → better compiled artifacts → richer vault. It compounds.

---

## Project Structure (actual, with planned files marked)

```
/  (C:\Projects\SystemDesignAI\SystemDesign)
├── claude.md                  # THIS FILE — project context
├── opus-master-brief.md       # the authoritative build plan (paste into an Opus session to build)
├── brain                      # bash CLI: `brain ask` / `brain reflect`
├── .env                       # ⚠️ currently malformed (single "api key =" line)
├── .venv/                     # Python 3.12 — has fastapi, uvicorn, pyyaml ONLY
├── conversations/             # YYYY-MM-DD/NNNN.md logs (written by conversation_logger)
├── reflections/               # reflection_report.md (written by reflection_engine)
├── proposals/                 # (empty)
├── raw/                       # 9 source PDFs (also mirrored under knowledge/SystemDesign/)
├── knowledge/
│   └── SystemDesign/
│       ├── schema.md          # operating manual — "the law" (page template, lint playbook §6.3)
│       ├── source-map.md      # 50-ingest campaign plan, topic → source book
│       ├── index.md           # master catalog, "Pages created" lists per area
│       ├── log.md             # chronological record of every Ingest/Query/Lint (newest top)
│       ├── wiki.md            # wiki front page / meta
│       ├── SESSION_STATE.md   # multi-session handoff doc (campaign history, conventions)
│       ├── raw/               # source PDFs
│       ├── roadmaps/          # 15 generated learning-path pages (build_roadmaps.py)
│       ├── <14 area folders>/ # concept pages (see table below)
│       └── aliases.json       # [PLANNED] synonym → canonical slug map (does not exist yet)
├── tools/                     # backend Python engine
│   ├── api.py                 # FastAPI: /api/ask, /api/promote, /api/confirm_promotion
│   ├── vault.py               # frontmatter + wikilink parsing, collect_pages()
│   ├── query_engine.py        # keyword retrieval + CLI; also a duplicate inline promote path
│   ├── llm_adapter.py         # Ollama + Gemini backends (no Claude, no routing/fallback)
│   ├── lint.py                # vault health checks per schema.md §6.3
│   ├── export_json.py         # vault → course-app/public/course-data.json
│   ├── export_anki.py         # recall questions → tools/anki/*.apkg (per area)
│   ├── build_roadmaps.py      # prereq DAG → roadmaps/ pages
│   ├── conversation_logger.py # appends Q&A to conversations/
│   ├── reflection_engine.py   # repo-health reflection report (no vault mutation)
│   ├── sync_notion.py         # vault ↔ Notion study-state sync (vault canonical)
│   ├── find_headings.py       # one-off heading audit helper
│   ├── update_lint.py         # one-off script that edits lint.py synonyms
│   ├── anki/                  # generated .apkg outputs
│   ├── prompts/               # [PLANNED] Opus-generated prompt templates (does not exist)
│   ├── sessions.py            # [PLANNED] multi-turn session state
│   ├── ingest.py              # [PLANNED] two-pass ingest pipeline
│   ├── watcher.py             # [PLANNED] raw/ file watcher (separate process)
│   ├── analytics.py           # [PLANNED] usage-log analysis
│   └── backlink_patcher.py    # [PLANNED] auto reverse-wikilink patcher
└── course-app/                # Vite SPA (VANILLA JS, not React)
    ├── package.json           # vite + d3 + fuse.js + marked
    ├── vite.config.js
    ├── public/course-data.json# compiled vault data (from export_json.py)
    └── src/
        ├── main.js            # entire app: hash router + 5 views + SSE + promote flow
        └── index.css
```

---

## The Knowledge Vault [NOW]

### Overview
- **~301 concept pages** across **14 architectural areas** (plus 15 generated roadmap pages and the meta files). The campaign was declared "complete" at 289 pages on 2026-06-03; it has since grown via edits/promotions.
- Pages link to each other with `[[wikilinks]]`.
- Each page carries **Active Recall Questions** in Obsidian Spaced-Repetition syntax.
- This is also an **Obsidian vault** (`.obsidian/` present, with the 3d-graph, tags-routes, and BRAT community plugins).

### The 14 Areas (corrected — current `.md` file counts per folder)
| Area | Files |
|---|---|
| distributed-systems | ~44 |
| databases | ~32 |
| system-design-interview | ~29 |
| reliability | ~27 |
| architecture-patterns | ~26 |
| software-engineering | ~25 |
| case-studies | ~21 |
| design-patterns | ~20 |
| data-engineering | ~19 |
| ml-systems | ~15 |
| networking | ~15 |
| messaging | ~13 |
| storage | ~8 |
| caching | ~7 |

> Counts are raw markdown-file counts and may include a stray index/meta page or two per folder. Treat as approximate; `index.md` holds the curated per-area lists. There is also a stray empty `Health Checks.md` at the repo root (and a copy in the vault) — a known loose end.

### Page Lifecycle
`stub → draft → mature → comprehensive`. `mature` was the campaign quality bar. Promoted pages must start at `stub`/`draft` and only earn `mature`/`comprehensive` through multiple extension cycles. `lint.py` checks that status is realistic for content length.

### Actual Page Frontmatter Schema (richer than older docs claimed)
Real pages carry more fields than `[title, area, status, sources, related]`. Example (`distributed-systems/Raft.md`):

```yaml
---
title: Raft
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consensus]]", "[[Quorums]]"]
related: ["[[Consensus]]", "[[Paxos]]", "[[Leader Election]]", "[[Linearizability]]"]
sources:
  - Ongaro & Ousterhout, 2014 ("In Search of an Understandable Consensus Algorithm")
  - DDIA, Ch. 9
tags: [distributed-systems, consensus, raft]
created: 2026-06-02
last_reviewed: 2026-06-02
aliases: [<synonyms, optional>]
---
```

Notes that matter for any tooling or compiler work:
- **`sources` use prose citations** (e.g. `"DDIA, Ch. 9"`, full paper titles), **not** terse aliases like `[DDIA, SDI1]`. The brief's `sources: [DDIA]` convention is a *future* normalization, not current reality.
- **Filenames are human-readable titles**, not kebab-case slugs (e.g. `Raft.md`, `Hyrum's Law.md`, `CI-CD.md` for title `CI/CD`). The brief's `slug` model is a planned change; today the `title` == filename stem.
- `prerequisites` and `builds_toward` exist and feed `build_roadmaps.py` (a prereq DAG).
- Body sections follow `schema.md`: `# Title`, `## Executive Summary`, `## Why This Exists`, `## Core Intuition`, `## Design Tradeoffs` (table), `## Related Concepts` (wikilinks), `## Active Recall Questions`, plus optional `## Misconceptions` / `## Mathematical Foundations`.

### Active Recall Question format
Obsidian Spaced-Repetition plugin syntax — single-line `Question::Answer` **or** multi-line:
```
Question text
?
Answer text
```
`export_json.py` and `export_anki.py` both parse these.

### Source Books (`raw/`)
9 reference PDFs, ingested manually (LLM reading + human curation):

| Alias | Full Title |
|---|---|
| DDIA | Designing Data-Intensive Applications (Kleppmann) |
| SDI1 / SDI2 | System Design Interview Vol 1 & 2 (Alex Xu) |
| FoSA | Fundamentals of Software Architecture (Ford & Richards) |
| HFDP | Head First Design Patterns |
| MSE | Modern Software Engineering (Farley) |
| Refactoring | Refactoring (Fowler) |
| SWE@Google | Software Engineering at Google |
| DEC | Data Engineering Cookbook (Kretz) |

---

## The Backend Engine (`/tools`) — what each file actually does [NOW]

### `api.py` — FastAPI on port 8000
Three endpoints (note: `/api/ask` is **POST**, not GET):
- `POST /api/ask` — SSE stream. Builds keyword context via `query_engine`, emits a `meta` event (primary page/area), streams `chunk` events from the LLM, logs the conversation, ends with `[DONE]`. Runs the blocking generator in a thread executor.
- `POST /api/promote` — runs the **inline** `PROMOTION_PROMPT` (Knowledge Compiler) through the active backend in `format="json"`, strips ```` ```json ```` fences, parses with `strict=False`. Returns the analysis JSON.
- `POST /api/confirm_promotion` — writes the page. **⚠️ If "Extend Existing Page", it appends under `## Recent Insights`** (the forbidden sediment pattern). Otherwise writes a new file with a minimal frontmatter block. Then re-runs `export_json.py` via subprocess. **No lint, no backlink patch, no index/log update, no FAISS rebuild, no cache invalidation.**

Missing vs the plan: no `asyncio.Semaphore` LLM guard, no session endpoints, no Claude, no post-write pipeline.

### `llm_adapter.py` — backend abstraction
- Backends: **`OllamaBackend`** (default `qwen3:8b`, streams `/api/chat`, strips `<think>` blocks live) and **`GeminiBackend`** (default `gemini-2.5-flash`, non-streaming single response).
- Selected by `BRAIN_LLM_BACKEND` (default `ollama`); instantiated once, cached in a module global.
- The system prompt for Q&A is an **inline** `_SYSTEM_PROMPT` string. `generate_answer(context, question)` builds `(system, user)` from a `Context` dataclass and delegates to the backend.
- **No Claude backend, no role-based routing, no retry/fallback, no prompt caching.** (All of that is [PLANNED].)

### `query_engine.py` — retrieval + CLI
- **Pure keyword scoring**: `tokenize` → Jaccard-style overlap between page title tokens and question tokens, `+0.5` if the title appears verbatim in the question. Tries `index.md` titles first, falls back to the full title map. Top-6 candidates, context capped at ~8000 chars.
- `detect_knowledge_root`, `build_title_map`, `select_candidates`, `build_context` are imported by `api.py`.
- Also contains a **duplicate inline promote path** for the terminal CLI (`brain ask`), with the **same** `## Recent Insights` append bug.
- **No FAISS, no embeddings, no query rewriting.**

### `vault.py` — shared parser
- `collect_pages()` returns a **dict keyed by filename stem** → `{name, path, frontmatter, body, wikilinks, prereqs, related, builds_toward, aliases, is_meta}`. (Note: keyed dict, and the body field is `body`, not `content`.)
- YAML frontmatter via PyYAML; wikilink extraction strips code blocks first; `build_resolver` maps name/alias (case-insensitive) → canonical name.
- **No in-memory cache layer and no write/path-resolution helpers** (older docs claimed these). Writes happen ad hoc in `api.py`.

### `export_json.py` — frontend data compiler
Walks `collect_pages()`, parses the `## Active Recall Questions` block, emits `course-app/public/course-data.json` with `pages[]`, `areas[]`, and a `graph{nodes, edges}` built from resolved wikilinks. Must be re-run after any vault change (today this is the only thing `confirm_promotion` triggers).

### Other tools
- `lint.py` — schema.md §6.3 checks: broken wikilinks, orphans, frontmatter validity, DAG cycles, stale pages, status realism. This is the **one place real integrity checks exist today.**
- `export_anki.py` — per-area `.apkg` files into `tools/anki/`.
- `build_roadmaps.py` — topological reading paths from the prereq DAG → `roadmaps/`.
- `conversation_logger.py` — appends to `conversations/YYYY-MM-DD/NNNN.md`.
- `reflection_engine.py` — read-only repo-health report → `reflections/`.
- `sync_notion.py` — pushes vault → Notion, pulls study state back (vault is canonical).
- `find_headings.py`, `update_lint.py` — one-off maintenance scripts (not part of the runtime).

---

## The Frontend (`/course-app`) [NOW]

**Vanilla JS Vite SPA.** No framework. `src/main.js` is the whole app (~688 lines):
- **Hash router**: `#/home`, `#/ask`, `#/areas`, `#/graph`, `#/quiz`, `#/page/:id`. Sidebar with Fuse.js live search across `course-data.json`.
- **Home** — vault-mastery % (mature/comprehensive), total recall-question count, recently added.
- **Ask AI** — POSTs `/api/ask`, manually parses the SSE byte stream, renders streamed markdown via `marked`, then exposes an editable textarea + a Promote flow that hits `/api/promote` and `/api/confirm_promotion`. The promote UI is keyed to the current JSON schema (`Promotion: "APPROVED"`, `Confidence`, `Promotion Type`, `Target File`, `Suggested Markdown`).
- **Explore Areas** — per-area cards listing pages.
- **Knowledge Graph** — **d3** force-directed graph (not Cytoscape). ⚠️ `colorMap` hardcodes only 4 areas (`databases`, `networking`, `distributed-systems`, `caching`); everything else is gray.
- **Quiz** — flashcards from recall questions; flip on click; only "Hard (re-queue)" / "Good (next)" — **no SM-2 scheduling, no persistence.**

Dependencies present: `vite`, `d3`, `fuse.js`, `marked`. **Absent** (required by the planned cockpit): React, react-router, Tailwind, Recharts, Cytoscape.js, react-hot-toast.

---

## Setup & Running [NOW]

### Prerequisites (actual)
- Python 3.12 `.venv` — currently has **fastapi, uvicorn, pyyaml only**.
- Node.js + npm (frontend deps installed).
- Ollama running locally with `qwen3:8b` pulled, **or** a Gemini key wired into `.env` and `BRAIN_LLM_BACKEND=gemini`.

### To enable the [PLANNED] work, install:
```
pip install sentence-transformers faiss-cpu watchdog pymupdf4llm anthropic
```
(None of these are installed yet — FAISS/ingest/Claude all depend on them.)

### Start backend
```bash
cd tools
OLLAMA_MODEL=qwen3:8b ../.venv/bin/python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
On Windows/PowerShell use `..\.venv\Scripts\python.exe`.

### Start frontend
```bash
cd course-app && npm run dev      # http://localhost:3000, proxies /api → :8000
```

### Environment variables — current (what the code actually reads)
| Variable | Default | Used by |
|---|---|---|
| `BRAIN_LLM_BACKEND` | `ollama` | backend selection (`ollama` \| `gemini`) |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama URL |
| `OLLAMA_MODEL` | `qwen3:8b` | Ollama model |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | — / `gemini-2.5-flash` | Gemini backend |

### Environment variables — planned (brief's role-routing scheme; not yet read by code)
```
ANTHROPIC_API_KEY
CLAUDE_ASK_MODEL=claude-haiku-4-5-20251001
CLAUDE_PROMOTE_MODEL=claude-sonnet-4-6
QWEN_ASK_MODEL=qwen3:8b
QWEN_PROMOTE_MODEL=qwen3:8b
OLLAMA_HOST=http://localhost:11434
OLLAMA_KEEP_ALIVE=-1        # keep model warm (no 5-min unload)
OLLAMA_FLASH_ATTENTION=1
LLM_MAX_RETRIES=2
LLM_TIMEOUT_SECONDS=30
```

### Process isolation rule
When the watcher exists, run three separate OS processes (never the watcher as a FastAPI BackgroundTask — PDF extract + LLM compile takes 10–30s and would starve the event loop):
```
uvicorn api:app --port 8000     # API
python watcher.py               # ingest watcher  [PLANNED]
npm run dev                     # frontend
```

---

## The Build Plan (from `opus-master-brief.md`)

The brief is the authoritative plan. Build in dependency order:
**prompts → llm_adapter → query_engine → sessions → ingest → watcher → analytics → updated api.py → updated lint.py**, then frontend (components → pages → hooks), then integration tests, then a startup checklist. No TODOs, no stubs — one user, correctness over extensibility.

### Workstream 1 — LLM Adapter: role routing + fallback + prompt caching [PLANNED]
- **Routing:** `/api/ask` → **Qwen 8B** (primary, local, free); `/api/promote` → **Claude Sonnet** (primary, quality gate).
- **Fallback chain:** Ask: Qwen → Claude Haiku. Promote: Sonnet → Qwen (same prompt, same output format). Retry 2× with backoff, then **notify the user via an SSE banner** before switching. Silent switching is not acceptable.
- **Prompt parity:** Claude and Qwen receive **identical** prompts loaded from `tools/prompts/`. Qwen 8B is the baseline constraint — every rule imperative ("DO X"), a negative example for every failure mode.
- **Prompt caching:** mark the vault-map prefix cacheable on every Claude `/api/promote` call (~90% input-cost cut).
- Files: rebuilt `llm_adapter.py`; new `tools/prompts/__init__.py` (`load_prompt()`, fail-fast if missing).

### Workstream 2 — FAISS semantic search + query rewriting [PLANNED]
- Replace keyword scoring. `SentenceTransformer("all-MiniLM-L6-v2")` (80MB, ~5ms/query); `IndexFlatIP` over L2-normalized `title + content[:500]` embeddings; build at startup, rebuild after writes (debounced 30s).
- **Query rewriting:** before FAISS, a fast Qwen call (`tools/prompts/query_rewriter.md`, <500ms) expands the raw query into 2–3 retrieval variants; score all, union top-N, dedupe.
- Requires `faiss-cpu` + `sentence-transformers` (not installed).

### Workstream 3 — Multi-turn study sessions [PLANNED]
- Session state: `session_id → {history, vault_context, created_at, last_active}`; vault context fetched once per session (re-fetched on significant topic shift); 30-min inactivity expiry.
- Endpoints: `POST /api/session/start`, `POST /api/session/{id}/ask` (SSE), `POST /api/session/{id}/compile`, `POST /api/session/{id}/promote`, `DELETE /api/session/{id}`.
- Compile = full conversation → blog-quality artifact (full depth, tables, tradeoffs, interview angles — not a summary), reviewed/edited in the UI, then promoted as create/extend/skip per concept.
- New `tools/sessions.py`.

### Workstream 4 — Post-write pipeline (vault consistency) [PLANNED]
Every vault write triggers automatically (no restart):
```python
async def post_vault_write(page, operation):
    invalidate_page_cache(page["slug"])
    rebuild_faiss_index()        # debounced 30s
    recompile_course_json()
    run_lint(page)               # BLOCKING
    validate_wikilinks(page)     # BLOCKING
    patch_backlinks(page)        # warning
    update_index_md(page)
    append_to_log(page, operation)
```
**Blocking** (write fails): lint, wikilink validation, frontmatter checks. **Warning** (write succeeds, surfaced in UI): duplicate detection, backlink patching. Always run: FAISS rebuild, course-json recompile.

### Workstream 5 — Vault integrity guardrails [PLANNED in compiler; PARTIAL in lint]
Enforced in **both** the compiler prompt and `lint.py`. (See the full failure-mode catalog below.) Highlights:
- **Wikilinks:** vault map sent to compiler includes exact identifiers; ≥3 wikilinks per CREATE (compile failure if fewer); backlink patcher adds reverse links after write.
- **EXTEND context fix (critical):** the compiler currently sees only the vault map — blind to target page content. For any EXTEND, fetch the **full target page**, inject as `<target_page_content>`, and require an explicit `target_section` + `merge_strategy` (`ADD_ROW_TO_TABLE | ADD_BULLET | REWRITE_PARAGRAPH | ADD_RECALL_QUESTION | ADD_SUBSECTION`). **Forbid `## New Insights` / `## Session Notes` / `## Recent Insights`** — lint rejects them. *(This directly fixes the live append bug.)*
- **Duplicate detection:** FAISS-score conversation concepts vs all pages — `>0.88` force EXTEND, `0.72–0.88` flag for human, `<0.72` allow CREATE; check `tools/aliases.json` first.
- **Contradiction detection:** compiler emits `conflicts_with` when the conversation corrects existing content; never silently create parallel claims.
- **Recall quality:** ≥3 per page, specific not shallow, answers ≥10 words, no duplicates on EXTEND, cap 10/page (audit when exceeded).
- **Sources:** book-sourced `[DDIA, SDI1]`, conversation `[conversation-YYYY-MM-DD]`, mixed both; empty `sources` fails lint.
- **Status:** single-turn → `stub`/`draft`; multi-turn → `draft` max; `mature`/`comprehensive` earned only through extension cycles.

### Workstream 6 — Raw file ingest pipeline [PLANNED]
Drop a PDF/markdown into `raw/` → auto-ingest. **Two passes:** (1) FAISS dedup (no LLM) — novel `<0.72` → compile, partial `0.72–0.90` → compile-as-EXTEND, duplicate `>0.90` → skip; (2) LLM integration on novel/partial only (format + integrate, the LLM does **not** deduplicate — FAISS did). Components: `tools/watcher.py` (watchdog, separate process), `tools/ingest.py`, `tools/extractor.py` (pymupdf4llm), `raw/manifest.json` (hash/timestamp/pages-created/extended).

### Workstream 7 — Analytics & usage feedback [PLANNED]
`tools/analytics.py`, weekly over conversation logs. Track: pages retrieved per query, promotions approved vs rejected, repeatedly-failed quiz questions, areas queried most/least, promotion rate per session (flywheel health). Surface: "most-queried, never promoted" (vault answers well), "frequently retrieved, never the right answer" (needs extending), "only source is conversation" (verify against a book), promotion-rate trend.

---

## LLM / Model Strategy

### Runtime routing (target — see Workstream 1)
| Use case | Primary | Fallback |
|---|---|---|
| `/api/ask` streaming | `qwen3:8b` (Ollama, local, free) | `claude-haiku-4-5-20251001` |
| `/api/promote` compilation | `claude-sonnet-4-6` | `qwen3:8b` |
| Ingest (batch) | `qwen3:8b` or `claude-haiku-4-5-20251001` | — |

> Note: this **supersedes** the older "ask → Haiku, promote → Sonnet" table. The brief makes Qwen the local-first primary for ask to keep runtime cost at ~$0 and only reaches for Claude on fallback or for promotion quality.

### Opus for prompt generation (one-time, offline)
Opus is **not** used at runtime. Use it **once per scenario** to write the best possible prompt, saved as a static template in `tools/prompts/`. Better prompts compound across every query/promotion/ingest. Use the **current** Opus model id `claude-opus-4-8` (the older docs said `claude-opus-4-6`). The four prompt-generation scenarios:
1. **`knowledge_compiler.md`** — the create-vs-extend-vs-skip decision, promotion-type selection, valid vault-schema markdown, JSON output. Feed Opus: full `schema.md`, 3–5 good promotions (one per type), 3–5 SKIP examples, exact JSON format, failure modes.
2. **`vault_qa_system.md`** — grounds every `/api/ask` answer in vault context; how to use retrieved pages, when to say "vault doesn't cover this", formatting, surfacing wikilinks. Feed Opus: 5–10 sample pages, 5 query→ideal-answer pairs, format spec.
3. **`session_compiler.md`** — end-of-session blog-quality artifact (after multi-turn is built).
4. **`ingest_compiler.md`** — two-pass ingest integration (after ingest is built).

Load at runtime:
```python
# tools/prompts/__init__.py
from pathlib import Path
def load_prompt(name: str) -> str:
    return (Path(__file__).parent / f"{name}.md").read_text()  # fail-fast if missing
```

### Prompt files the build must write [PLANNED]
- **`vault_qa_system.md`** (Qwen primary): answer ONLY from vault; on partial coverage flag the gap (`"Vault gap: [topic] — consider promoting a page"`); on no coverage say so; surface 2–3 `[[wikilinks]]`; imperative rules; 5 worked examples (2 full / 1 partial / 1 none / 1 cross-area). Ship when ≥8/10 Qwen runs pass.
- **`knowledge_compiler.md`** (Sonnet primary, Qwen fallback): output **raw JSON only** (rule stated at start *and* end), schema with `decision/promotion_type/slug/area/content/target_slug/target_section/merge_strategy/new_content/conflicts_with`. Check alias map before CREATE; only vault-map identifiers; ≥3 wikilinks; never append "New Insights"; status stub/draft; 6 worked examples incl. a bad-append→corrected-merge negative. Qwen pass bar: valid JSON ≥8/10, no invented identifiers ≥8/10, section targeting ≥6/10.
- **`query_rewriter.md`** (Qwen): input raw query → `["original", "variant 1", "variant 2"]`, <500ms.

### Ollama tips
`OLLAMA_KEEP_ALIVE=-1` (no cold unload), `OLLAMA_FLASH_ATTENTION=1`, at most 2–3 concurrent GPU calls (queue beyond that), `qwen3:8b` is the workhorse.

---

## The Knowledge Compiler Pattern

The single most important architectural idea. **Current [NOW] vs target [PLANNED]:**

**Current flow:** Ask → user edits answer → Promote → inline `PROMOTION_PROMPT` returns JSON `{Promotion, Confidence, Promotion Type, Target File, Related Pages, Reason, Suggested Markdown}` → user confirms → file written (EXTEND appends `## Recent Insights` ⚠️) → `export_json.py` re-run. Single-turn only.

**Target flow:** multi-turn session → Compile (full session → artifact) → compiler emits the richer schema (`decision: CREATE|EXTEND|SKIP`, `target_section`, `merge_strategy`, `conflicts_with`, exact-identifier wikilinks) → review/edit in a modal → confirm → **full `post_vault_write` pipeline** (lint, backlinks, index/log, FAISS rebuild, course-json).

**Decision logic:** concept already has a page → EXTEND (merge into the correct section); novel & durable → CREATE; repeat of existing → SKIP. The compiler must read the **full** target page for EXTEND (today it only sees the map — the root cause of bad appends).

---

## UI — The Learning Cockpit [PLANNED]

The target UI is a **learning cockpit, not a chat wrapper.** Principles: zero friction between insight and vault (Promote feels like ⌘S); the vault is always visible; progress is earned not assumed (real status everywhere); the system suggests what to study next. Target stack: **Vite + React + Tailwind + React Router + Recharts + Cytoscape.js + react-hot-toast** — i.e. a rewrite of the current vanilla-JS app.

Seven pages: **Dashboard** (session state / today's focus / vault-health rings / streak), **Study** (three-column multi-turn: session context | conversation with per-answer sources + gap-flag + promote | page preview), **Vault Explorer** (area pills, status filter, FAISS search-as-you-type, page grid + detail with mini-graph), **Knowledge Graph** (Cytoscape; nodes sized by inbound links, colored by area, shaped by status; co-retrieval edge thickness; orphan mode), **Roadmap** (adaptive paths: Interview Prep / Deep Mastery / Fix My Gaps / Custom — progress from real page status), **Flashcards** (SM-2 spaced repetition, due-first queue, problem-card surfacing, auto-sync new recall Qs), **Ingest** (drag-drop, per-file processing queue, manifest view).

Global: backend status bar (Claude ✓ / Qwen ✓ / fallback / down), vault stats bar, shortcuts (⌘K search, ⌘P promote, ⌘F flashcards, ⌘G graph, ⌘/ toggle panel). New components: `BackendStatus`, `VaultStatsBar`, `PromoteModal`, `PagePreview`, `MiniGraph`, `GapFlagBanner`. Hooks: `useSession`, `useVault`, `useFlashcards`.

No dark patterns — status badges and roadmap progress must reflect **actual** vault page quality, never fake progress.

---

## Vault Integrity — Full Failure-Mode Catalog [requirements]

The vault must get **better** with every conversation, not just bigger. These are the known ways it silently degrades and how to prevent each. Today only `lint.py` enforces a subset; the compiler-side enforcement is [PLANNED].

1. **Wikilink integrity** — no links / invented filenames / one-way links create graph orphans. Fix: exact identifiers in the vault map; ≥3 wikilinks per page; `backlink_patcher.py` adds reverse links; lint flags 0-in/0-out orphans.
2. **Frontmatter drift** — wrong `area`, inflated `status`, empty `sources`, `related` ≠ body wikilinks, `title` ≠ filename. Fix: lint validates area ∈ 14, status-vs-wordcount realism, sources non-empty, related↔body parity.
3. **Contradictions (stale knowledge)** — a correction is promoted but the old framing remains. Fix: compiler emits `conflicts_with` + must read full target page; semantic check after EXTEND; flag for human review.
4. **Duplicate concept pages** — `write-ahead-log` vs existing `wal`. Fix: FAISS dedup before compile (`>0.88` force EXTEND), `aliases.json`, post-write pairwise similarity scan (`>0.85` flag).
5. **Section targeting on EXTEND (append vs merge)** — the live bug. Fix: full target page in prompt; explicit `target_section` + `merge_strategy`; ban `## New/Session/Recent Insights`.
6. **Recall question quality** — shallow/duplicate/missing. Fix: lint ≥3 questions, answer ≥10 words, reject `what is X?` openers; send existing questions on EXTEND.
7. **Source attribution decay** — inconsistent `sources` over time. Fix: strict convention (`conversation-YYYY-MM-DD` for promotions); lint rejects empty.
8. **Index & log staleness** — `index.md`/`log.md` fall behind automated writes. Fix: `update_index_md` + `append_to_log` in `post_vault_write`.
9. **Area misclassification** — wrong of the 14 areas. Fix: boundary-case rules in compiler prompt; lint sanity check; human-overridable at confirm.
10. **Recall drift after repeated EXTENDs** — 20 redundant questions accumulate. Fix: dedup on add; audit every 3rd extend or when >10; consolidate via a Haiku call.

**Blocking vs warning** (in `post_vault_write`): blocking = structural lint, wikilink validation, frontmatter; warning = duplicates, backlinks; always = FAISS rebuild, course-json recompile.

---

## Concurrency & Background Task Budget [reference]

| Task | Max concurrent | Notes |
|---|---|---|
| FAISS search | unlimited | pure RAM |
| `/api/ask` LLM streaming | 2–3 (Ollama) / 10–20 (API) | Ollama is GPU-bound |
| `/api/promote` compilation | 1–2 | shares LLM slot, queue behind ask |
| Raw ingestion (watcher) | 1 | **separate OS process** |
| FAISS rebuild | 1 (debounced 30s) | batch writes, rebuild once |
| Conversation logging | unlimited | async fire-and-forget |

Semaphore pattern to add in `api.py`:
```python
llm_sem = asyncio.Semaphore(3)   # Ollama: 2-3 | Claude/Gemini API: 10-20
async def call_llm_guarded(prompt, context):
    async with llm_sem:
        return await llm_adapter.call(prompt, context)
```

---

## Key Design Decisions & Rationale

- **Markdown files, not a database** — human-readable, Obsidian-native, git-trackable (once a repo), portable wikilinks. Cost: querying loads files — mitigated by the planned cache + FAISS index.
- **SSE, not WebSockets** — one-way server→client streaming is sufficient and simpler (`fetch` + manual stream parse, as `main.js` already does).
- **Separate compiler LLM call, not raw-conversation save** — raw chats are noisy; the compiler distills durable knowledge into schema-valid markdown to keep the vault high-signal.
- **Two-pass ingest** — LLMs are unreliable at dedup at scale; FAISS similarity is deterministic and fast. Split: FAISS compares, the LLM formats/integrates.
- **Watcher as a separate process** — PDF extract (~5s) + LLM compile (~10–30s) would block uvicorn's event loop.
- **Opus only for prompt generation** — Opus's edge is reasoning through ambiguous, open-ended problems (prompt engineering's edge cases and failure modes). At runtime the task is well-defined by the prompt, so Haiku/Sonnet/Qwen execute it reliably and cheaply.

---

## Latency Targets & Current State

| Stage | Current | Target | Fix |
|---|---|---|---|
| Vault retrieval | 50–300ms keyword scan | ~5ms | FAISS [PLANNED] |
| Context build | 20–80ms disk reads | ~5ms | in-memory cache [PLANNED] |
| LLM cold start (Ollama) | 200ms–2s | ~0ms | `OLLAMA_KEEP_ALIVE=-1` |
| Time to first token | 300ms–1s | ~200–300ms | Qwen warm / Haiku |
| Promotion flow | 3–8s (serial LLM) | ~2s | stream artifact, share context |
| Post-write pipeline | manual / restart | ~5s automated | `post_vault_write()` [PLANNED] |

---

## What Works Today vs What's Planned

### Working [NOW]
- FastAPI backend: `/api/ask` (SSE), `/api/promote`, `/api/confirm_promotion`.
- Keyword vault retrieval (`query_engine.py`).
- Single-turn Knowledge Compiler promotion flow, end-to-end (with the `## Recent Insights` append caveat).
- Vanilla-JS Vite frontend: Home, Ask AI, Explore Areas, d3 Knowledge Graph, flashcard Quiz; Fuse.js search.
- Ollama and Gemini backends.
- Conversation logging, lint, Anki export, roadmap builder, reflection engine, Notion sync.

### Planned (in rough priority order)
- [ ] `tools/prompts/` + Opus-generated `vault_qa_system.md`, `knowledge_compiler.md`, `query_rewriter.md`
- [ ] Rebuilt `llm_adapter.py`: Claude backend, role routing, retry/fallback with SSE notify, prompt caching
- [ ] FAISS semantic search + query rewriting (install `faiss-cpu`, `sentence-transformers`)
- [ ] Multi-turn sessions (`sessions.py` + session endpoints)
- [ ] `post_vault_write` pipeline + `backlink_patcher.py` (fixes the append bug, automates index/log/FAISS/json)
- [ ] Compiler-side integrity guardrails + expanded `lint.py` checks + `aliases.json`
- [ ] Ingest pipeline + watcher (`ingest.py`, `watcher.py`, `extractor.py`, `raw/manifest.json`)
- [ ] `analytics.py` usage feedback loop
- [ ] React cockpit rewrite (7 pages, components, hooks) + the missing frontend deps

### Constraints & non-negotiables (from the brief)
- The vault must never silently degrade — every guardrail is a hard requirement.
- Qwen runs the **same** prompts as Claude; parity is the goal.
- Fallback must **notify** the user — no silent backend switching.
- Post-write pipeline must be automatic — no manual restarts.
- The frontend must feel like a learning tool — the vault is always visible.
- No fake progress — badges/roadmap reflect real page quality.
- Performance: first token <300ms, FAISS <5ms, UI interactions <100ms.

---

## Startup checklist (verify before a build/run session)
1. `.env` has a **properly named** `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` (the current `api key =` line is malformed).
2. Ollama is running and `qwen3:8b` is pulled (`ollama list`); set `OLLAMA_KEEP_ALIVE=-1`.
3. `.venv` has the deps the work needs (`faiss-cpu`, `sentence-transformers`, `anthropic`, `watchdog`, `pymupdf4llm` are **not** installed yet).
4. `export_json.py` has been run so `course-app/public/course-data.json` is fresh.
5. Backend on :8000, frontend on :3000 (proxy works); when built, the watcher runs as its own process.
6. Remember: **not a git repo** — no safety net for destructive edits.
```

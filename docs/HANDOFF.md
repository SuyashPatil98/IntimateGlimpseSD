# SystemDesignAI — Build Handoff (resume here)

**Last updated:** 2026-06-09. This is the continuity doc for the *rebuild* work. A fresh
session should read, in order: **`../README.md`** → **`../CLAUDE.md`** (project context) → **this file** (what's
done / how to run / what's next) → **`opus-master-brief.md`** (same folder, the original plan). The full
implementation plan also lives at `~/.claude/plans/sleepy-brewing-haven.md`.

> Remote: `origin` → `github.com/SuyashPatil98/IntimateGlimpseSD` (whole-repo backup, "option 1"). Branch `main`.
> The task list (TaskCreate) does NOT persist across sessions — the milestone status below is
> the source of truth.

---

## Where we are (TL;DR)

The intelligent backend (M0–M3) and the React cockpit + its live wiring (M4) are **done and
committed**. The whole study loop was validated **live, end-to-end** on 2026-06-09: a real
question returned real vault sources (Raft/Paxos/Consensus…) + a grounded answer, with the
Qwen→Claude fallback firing correctly.

**All 8 cockpit screens read live data:** Dashboard, Study, Graph, Vault, Flashcards, Roadmap,
Profile, Ingest (Ingest queue is real-but-empty until the M5 pipeline exists).

---

## How to run it (Windows, from repo root `C:\Projects\SystemDesignAI\SystemDesign`)

```powershell
# Backend (FastAPI on :8000). Use .venv-win (the WSL .venv is dead on Windows).
.venv-win\Scripts\python -m uvicorn api:app --app-dir tools --port 8000 --reload

# Frontend (Vite on :3000, proxies /api -> :8000)
cd course-app ; npm run dev      # http://localhost:3000
```

Quick checks without the UI:
- `.venv-win\Scripts\python tools\dryrun_claude.py` — tests the Sonnet promote route + prints cost.
- `.venv-win\Scripts\python -m pytest tools\tests -q` — 29 unit tests (retrieval/routing/compiler/etc.).
- `.venv-win\Scripts\python tools\eval_retrieval.py` — retrieval probe gate (14/15 pass).

## Backend connection state (as of 2026-06-09)

- ✅ `.env` now has a valid **`ANTHROPIC_API_KEY`** (user added it). Claude/Sonnet works.
  ⚠️ That key was shared in chat — recommend rotating it.
- ⚠️ **Ollama is running but `qwen3:8b` is NOT pulled** → conversations currently fall back to
  Claude **Haiku** (costs a little). Run **`ollama pull qwen3:8b`** to make chat free + local.
- Gemini key in `.env` is out of credits / unused (not in routing).
- Routing (confirmed, in `tools/config.py`): **ask → Qwen→Claude(Haiku)**, **promote → Sonnet→Qwen**.
- Models: retrieval = `BAAI/bge-small-en-v1.5` + `cross-encoder/ms-marco-MiniLM-L-6-v2` (CPU),
  cached in `.cache/embeddings.npz`. First `/api/ask` after a cold start takes ~10s to load them.

---

## Milestone status

| # | Milestone | Status |
|---|---|---|
| M0 | Foundations (git, .venv-win, config, state.db, prompts loader) | ✅ done |
| M1 | Hybrid retrieval (BM25 + dense + rerank + graph) | ✅ done (14/15 probes) |
| M2 | LLM adapter (Qwen/Claude/Gemini, routing+fallback, caching) + Opus prompts | ✅ done |
| M3 | Sessions + compiler + post-write pipeline + integrity (fixes append bug) | ✅ done |
| M4 | React cockpit: ported Claude Design + wired ALL 8 screens to live backend | ✅ done |
| — | Claude usage/cost tracking + Dashboard spend card | ✅ done |
| M5 | Raw ingest pipeline + watcher (drop PDF → auto notes) | ⬜ TODO |
| M6 | Analytics / feedback loop | ⬜ TODO |
| M7 | Secure cross-device deploy (Docker + Caddy + Tailscale) | ⬜ TODO |
| M8 | On-demand flashcard & quiz enrichment (button, token-controlled) | ⬜ TODO |
| — | PWA (installable, offline flashcards) | ⬜ TODO |

---

## Architecture map

**Backend `tools/`** (run with `--app-dir tools`; modules import each other by bare name):
- `config.py` — env + paths + routing + model prices. `state.py` — SQLite (sessions, flashcards,
  TokenUsage, Promotion, etc.). `prompts/` — Opus-authored `vault_qa_system.md`,
  `knowledge_compiler.md`, `query_rewriter.md` + `load_prompt()`.
- `retrieval.py` — the hybrid engine. `llm_adapter.py` — backends + `stream()`/`complete()`/`health()`.
- `compiler.py` — CREATE/EXTEND/SKIP. `vault_write.py` — section-merge (the bug fix) + page write.
  `backlink_patcher.py`, `integrity.py`, `pipeline.py` (post_vault_write). `flashcards.py` — SM-2.
- `api.py` — all endpoints (see below). Legacy kept: `vault.py`, `export_json.py`, `lint.py`,
  `build_roadmaps.py`, `export_anki.py`, `reflection_engine.py`, `sync_notion.py`.

**API endpoints (all live):** `/api/health`, `/api/usage`, `/api/ask` (SSE), `/api/session/*`,
`/api/promote`, `/api/confirm_promotion`, `/api/search`, `/api/page/{name}`, `/api/graph`,
`/api/areas/coverage`, `/api/vault/stats`, `/api/vault/recent-promoted`, `/api/vault/notes`,
`/api/flashcards/due` + `/rate`, `/api/roadmap`, `/api/config`, `/api/ingest/queue`.

**Frontend `course-app/`** — Vite + React (vanilla, the Claude Design "cockpit"):
- It's the design's browser-global pattern preserved under Vite: `src/_react-global.js` puts
  React on `window` (loaded FIRST), `src/main.jsx` imports everything in order, `src/app.jsx`
  self-mounts. **Zero framework rewrite** — screens read `MOCK_*`/local consts.
- `src/api.js` (`window.API`) — fetch + SSE client. `src/tokens.css` — the design system.
- Screens: `dashboard/study/vault/graph/flashcards/roadmap/ingest/profile.jsx`. Each was wired
  by adding a `fetch` + state (or, for the dashboard, overwriting the `MOCK_*` globals in
  `app.jsx` and re-rendering). **The original design source is archived in `design-archive/`
  (incl. `design.md`, the UI↔backend contract).**

---

## Next steps (recommended order)

1. **`ollama pull qwen3:8b`** so conversations run free/local (currently Haiku fallback).
2. **M5 — ingest pipeline**: `tools/extractor.py` (pymupdf4llm), `tools/ingest.py` (two-pass:
   retrieval dedup → compiler), `tools/watcher.py` (watchdog, separate process), `raw/manifest.json`;
   wire the Ingest screen's drag-drop → `POST /api/ingest`.
3. **M8 — flashcard/quiz enrichment** (button, token-controlled) — design in the plan file + the
   `flashcard-quiz-enrichment-on-demand` memory. The "Improve flashcards" button + Quiz exist in UI.
4. **M7 — deploy**: Dockerfile + docker-compose (api + ollama + caddy) + Tailscale for secure
   from-anywhere access; PWA. Server-side state already in SQLite for cross-device sync.
5. **M6 — analytics** over `query_log`/`page_stats`/`TokenUsage`.

## Known loose ends
- Study left-rail/Compile and the keyboard ⌘⇧P route to Study; the per-answer **Promote** button is
  the real promote path (compiles the conversation → editable modal → `/api/confirm_promotion`).
- Roadmap currently derives lanes from *coverage*; vault is ~96% mature so it shows one "Mastered"
  lane. Better to base it on quiz gaps later (M6).
- The preview/screenshot MCP tool was flaky in the build session; the app itself renders fine
  (verified via DOM eval + live API).
- `conversations/` accrues runtime Q&A logs (untracked, on disk). `state.db`, `.cache/`, `.venv-win/`
  are gitignored.

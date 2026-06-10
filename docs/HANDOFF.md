# SystemDesignAI — Build Handoff (resume here)

**Last updated:** 2026-06-10. Continuity doc. A fresh session should read, in order:
**`../README.md`** → **`../CLAUDE.md`** (project context) → **this file** → **`opus-master-brief.md`**.

> Remote: `origin` → `github.com/SuyashPatil98/IntimateGlimpseSD` (whole-repo backup). Branch `main`, pushed.
> The milestone status below is the source of truth (TaskCreate does not persist across sessions).

---

## Where we are (TL;DR)

The app is **complete and usable locally.** The intelligent backend (M0–M3), the React cockpit (M4),
the **raw-ingest pipeline (M5)**, and the **self-maintaining review loop** are all done, committed, and
pushed. Validated live end-to-end: the `LRU` gap was filled *through the loop* (vault 293 → 294), and a
PDF ingested into 25 queued sections.

**One command starts everything:** `.\run.ps1` → Ollama + backend + frontend + raw/ watcher + opens the UI.

---

## How to run it (Windows, repo root `C:\Projects\SystemDesignAI\SystemDesign`)

```powershell
.\run.ps1            # Ollama + backend(:8000) + frontend(:3000) + watcher, opens http://localhost:3000
.\run.ps1 -Status    # UP/DOWN for all four processes
```

Manual (separate terminals):
`.venv-win\Scripts\python -m uvicorn api:app --app-dir tools --port 8000`  ·
`npm --prefix course-app run dev`  ·  `.venv-win\Scripts\python tools\watcher.py`

Checks: `python -m pytest tools\tests -q` · `python tools\eval_retrieval.py` ·
`python tools\audit.py` (prints the gaps + status-fills it would queue).

## Runtime state (2026-06-10)

- **LLM:** chat = **qwen3:4b** local (qwen3:8b removed). `OLLAMA_THINK=1` → clean answers (hidden
  reasoning is stripped) but slow first token: the GPU runs 4b at ~33% CPU, so chat is ~30s to first
  word — a **hardware ceiling**, not a bug. Promote/compile = **Claude Sonnet**. Fallbacks: ask→Haiku,
  promote→qwen. All in `.env` + `tools/config.py`.
- `.env`: valid `ANTHROPIC_API_KEY` (⚠️ shared in chat early — **rotate it**), `QWEN_ASK_MODEL=qwen3:4b`,
  `QWEN_PROMOTE_MODEL=qwen3:4b`, `OLLAMA_THINK=1`.
- Retrieval: `BAAI/bge-small-en-v1.5` + `cross-encoder/ms-marco-MiniLM-L-6-v2` (CPU); cold-loads ~10s on
  the first `/api/ask` or first review-draft.
- Vault: **294 concept pages**. `index.md` is regenerable via `tools/build_index.py`. Lint is clean
  (`tools/lint.py`, now vault-scoped) apart from 20 status-realism items (queued as review fills).

---

## Milestone status

| # | Milestone | Status |
|---|---|---|
| M0–M4 | Foundations · hybrid retrieval · LLM adapter · sessions/compiler/pipeline · React cockpit (8 live screens) | ✅ done |
| M5 | Raw ingest pipeline + watcher (drop PDF → sections → review queue) | ✅ done |
| — | **Self-maintaining loop** — audit gap-detector + review queue (draft → review → promote) | ✅ done |
| — | Session compiler (whole convo → multiple enriching notes) · Vault & Sync · vault cleanup · MarkdownView · `run.ps1` · status pill | ✅ done |
| M6 | Analytics feedback loop — `analytics.py` + usage-driven **study planner** (the Roadmap screen) | ✅ done |
| M8 | Flashcard/quiz enrichment (deep "why" per card, button-triggered) | ⬜ TODO — button exists, `deepExplanation` is `None` |
| M7 | Cross-device deploy (Docker + Caddy + Tailscale) + PWA | ⬜ TODO |
| bug | Duplicate flashcard rows (sync dedup) — `flashcards.py:sync_from_vault` re-inserts; flagged | ⬜ TODO |

---

## Architecture map

**Backend `tools/`** (run with `--app-dir tools`; bare-name imports):
- Core: `config.py` (env/paths/routing/prices + `OLLAMA_THINK`), `state.py` (SQLite: sessions,
  flashcards, TokenUsage, Promotion, **ReviewItem**), `prompts/`, `retrieval.py`,
  `llm_adapter.py` (qwen/claude/gemini + the `OLLAMA_THINK` toggle), `compiler.py`, `vault_write.py`,
  `integrity.py`, `backlink_patcher.py`, `pipeline.py`, `flashcards.py` (SM-2; `sync_from_vault()` runs
  on every `due_cards`, so promoting a page auto-adds its recall questions).
- **Self-maintaining loop:** `audit.py` (gap + status-fill detector), `ingest.py` + `extractor.py`
  (PDF/markdown → sections) + `watcher.py` (raw/ auto-ingest, separate process), `gitsync.py`
  (Vault & Sync), `build_index.py` (regenerate index.md), `lint.py` (vault-scoped).
- `api.py` — all endpoints.

**API endpoints:** health · usage · ask (SSE) · session/* · promote · confirm_promotion · search ·
page/{name} · graph · areas/coverage · vault/{stats,recent-promoted,notes} ·
**vault/{sync-status,sync,snapshot,open-folder,autosync}** · flashcards/{due,rate} · roadmap · config ·
ingest/queue · **ingest** · **ingest/upload** ·
**review/{queue, run-audit, &lt;id&gt;/draft, &lt;id&gt;/approve, &lt;id&gt;/reject}**.

**Frontend `course-app/`** (Vite + React, browser-global pattern; `main.jsx` imports in order, screens
self-publish on `window`):
- `app.jsx` — keep-alive nav (screens stay mounted so state survives tab switches) + honest
  API/QWEN/CLAUDE/GEMINI status pill (shows **API DOWN** when unreachable).
- `shared.jsx` — atoms, AREAS, **`MarkdownView`** (no-dependency markdown renderer: headings, bold/italic,
  lists, tables, fenced code/ASCII diagrams, wikilinks).
- `api.js` (`window.API`), `tokens.css`. Design archive in `docs/design-archive/`.
- Screens: dashboard/study/vault/graph/flashcards/roadmap/profile + **ingest** (rebuilt as the **review
  queue** — drag-drop upload, Run audit, per-item Draft → Review → Promote/Reject; reuses `PromoteModal`).
- Vault explorer: clicking a note opens it in a modal rendered with `MarkdownView`.

---

## The self-maintaining loop (the new core)

One **review queue** (`state.ReviewItem`), three feeders:
1. **audit** — `POST /api/review/run-audit` → 48 gaps (planned-but-missing, from `audit.TARGET`) +
   20 status-fills (mature pages missing a required section, from `lint.check_status_realism`).
2. **ingest** — drag-drop upload / `POST /api/ingest` / the watcher → PDF/markdown split into sections.
3. **You** — **Draft** (`/api/review/<id>/draft` → `compiler.compile_conversation`, Claude Sonnet writes a
   schema-valid page) → **Review** (PromoteModal, editable) → **Approve** (`/api/review/<id>/approve` →
   `compiler.apply_decision` → `pipeline.post_vault_write` → auto-sync) or **Reject**.

Detection is instant + deterministic; drafting is per-item, user-chosen, and runs on **Claude** (not the
slow local GPU). Nothing enters the vault without approval. Queue currently holds ~91 suggestions.

---

## Next steps (recommended order)
1. **Fix the flashcard dedup bug** — `flashcards.py:sync_from_vault` inserts duplicate rows
   (the analytics surfaced "What's an ADR?" 4×). Clean up dups + make sync idempotent.
2. **M8 — flashcard enrichment** (highest daily-learning value, smallest build). Wire the "Improve
   flashcards" button → a button-triggered Claude call that fills `deepExplanation` per card
   (token-controlled, never automatic — see the `flashcard-quiz-enrichment-on-demand` memory). The
   `/api/flashcards/due` payload returns `deepExplanation: None` today.
3. **M7 — deploy**: Docker + Caddy + Tailscale (state already lives in SQLite) + PWA.

`M6 — analytics`: ✅ done — `tools/analytics.py` (`compute()`) + `GET /api/analytics`, surfaced as the
usage-driven **study planner** (Roadmap screen): study-next, weak flashcards, thin-but-queried pages,
where the vault answers well, per-area mastery, flywheel health.

## Known loose ends
- **Chat is slow** (~30s first word) on this GPU — qwen3:4b runs ~33% on CPU. Levers: Claude Haiku for
  ask (fast, ~$0.004/query) or a bigger GPU. `OLLAMA_THINK=0` streams sooner but answers ramble.
- Review queue UI doesn't auto-refresh — click **Refresh** after ingesting.
- **`Knowledge Base/`** at repo root is a 312-file accidental *duplicate* of the vault (gitignored, on
  disk). Safe to delete; left in place per user request.
- The old WSL `.venv` is dead-on-Windows and still on disk (gitignored).
- `conversations/`, `state.db`, `.cache/`, `.venv-win/`, `raw/manifest.json` are gitignored.

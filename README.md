# SystemDesignAI

A **personal system-design learning platform** — not a SaaS product, not a course. A self-contained
tool for one person to study, query, and grow a structured knowledge base about system design.

> **Core philosophy:** conversations are temporary, **the vault is permanent.** Every useful insight
> gets distilled and saved. The LLM is a *compiler*, not a chatbot. More content → richer vault →
> better answers → better compiled artifacts → richer vault. It compounds.

Inspired by Karpathy's "LLM Wiki" approach.

---

## What it is

- **The vault** — ~324 structured markdown pages across **14 architectural areas** (distributed
  systems, databases, reliability, …). Pages link with `[[wikilinks]]` and carry active-recall
  questions. This is an Obsidian vault and the ground truth the LLM answers from.
- **An intelligent backend** — hybrid retrieval (BM25 + dense embeddings + cross-encoder rerank +
  graph signal) feeds a routed LLM. Ask questions, get answers grounded in *your* vault, then
  **promote** the good parts back into the vault through a knowledge compiler that decides
  create-vs-extend-vs-skip and merges into the right section (no blind appends).
- **A learning cockpit** — an 8-screen React UI: Dashboard, Study, Vault Explorer, Knowledge Graph,
  Flashcards (SM-2 spaced repetition), Roadmap, Ingest, and Profile.

**Status:** complete and usable locally. The intelligent backend (M0–M3), the React cockpit (M4),
the raw-ingest pipeline (M5), and the **self-maintaining review loop** (audit gaps / ingest PDFs →
draft via Claude → review → promote) are done and validated end-to-end. See
[`docs/HANDOFF.md`](docs/HANDOFF.md) for the live milestone status and what's next.

---

## Repository layout

```
.
├── README.md                 ← you are here
├── CLAUDE.md                 # deep philosophy / architecture context (partially pre-rebuild)
├── brain                     # bash CLI: `brain ask` / `brain reflect`
├── tools/                    # ── BACKEND ── FastAPI app + the knowledge engine (Python 3.12)
│   ├── api.py                #    all HTTP/SSE endpoints
│   ├── config.py  state.py   #    env/routing/prices · SQLite (sessions, flashcards, usage)
│   ├── retrieval.py          #    hybrid BM25 + dense + rerank + graph
│   ├── llm_adapter.py        #    Qwen / Claude / Gemini backends, routing + fallback + caching
│   ├── compiler.py           #    CREATE / EXTEND / SKIP knowledge compiler
│   ├── vault_write.py        #    section-merge page writes (fixes the old append bug)
│   ├── pipeline.py           #    post-write pipeline (lint, backlinks, index/log, reindex)
│   ├── flashcards.py         #    SM-2 scheduling
│   ├── prompts/              #    Opus-authored prompt templates + load_prompt()
│   └── tests/                #    unit tests
├── course-app/               # ── FRONTEND ── Vite + React cockpit
│   └── src/                  #    app.jsx + 8 screens + api.js (SSE client) + tokens.css
├── knowledge/SystemDesign/   # ── THE VAULT ── ~324 markdown pages (the ground truth)
├── raw/                      # source PDFs (gitignored, kept on disk)
├── conversations/            # runtime Q&A logs  ·  reflections/  ·  proposals/
└── docs/                     # HANDOFF.md (resume here) · opus-master-brief.md · design-archive/
```

---

## Running it (Windows / PowerShell)

**Easiest — one command** (starts Ollama + backend + frontend + the `raw/` watcher, opens the UI):
```powershell
.\run.ps1            # start everything
.\run.ps1 -Status    # check what's UP / DOWN
```

**Prerequisites**
- Python 3.12 virtualenv at `.venv-win` (the WSL `.venv` does not work on Windows).
- Node.js + npm.
- [Ollama](https://ollama.com) running with `qwen3:4b` pulled (`ollama pull qwen3:4b`) — for free,
  local chat. Without it, `/api/ask` falls back to Claude Haiku (small cost).
- `.env` with a valid `ANTHROPIC_API_KEY` (used for the promote/compile route). See `.env.example`.

**First-time setup on a new machine**
```powershell
git clone https://github.com/SuyashPatil98/IntimateGlimpseSD.git
cd IntimateGlimpseSD

# Python backend (3.12)
py -3.12 -m venv .venv-win
.venv-win\Scripts\python -m pip install -r tools\requirements.txt

# Secrets: copy the template, then add your key
copy .env.example .env
notepad .env                 # set ANTHROPIC_API_KEY=sk-ant-...

# Frontend deps
cd course-app ; npm install ; cd ..

# Local model for free chat (install Ollama from https://ollama.com first)
ollama pull qwen3:4b
```
> `state.db` (flashcard schedules, session + usage history) is **not** synced via git — each
> machine starts with fresh local state. The vault, code, prompts, and `.env.example` all sync.

**Start the backend** (FastAPI on `:8000`)
```powershell
.venv-win\Scripts\python -m uvicorn api:app --app-dir tools --port 8000 --reload
```

**Start the frontend** (Vite on `:3000`, proxies `/api` → `:8000`)
```powershell
cd course-app ; npm run dev
```

Then open <http://localhost:3000>.

**Sanity checks (no UI needed)**
```powershell
.venv-win\Scripts\python -m pytest tools\tests -q     # unit tests (retrieval/routing/compiler/…)
.venv-win\Scripts\python tools\eval_retrieval.py       # retrieval probe gate
.venv-win\Scripts\python tools\dryrun_claude.py        # exercises the Claude promote route + cost
```

---

## How the LLM is routed

| Use case | Primary | Fallback |
|---|---|---|
| `/api/ask` (streaming Q&A) | `qwen3:4b` (Ollama, local, free) | Claude Haiku |
| `/api/promote` (knowledge compiler) | Claude Sonnet | `qwen3:4b` |

Fallback is **never silent** — the UI is notified when a switch happens. Models and prices live in
`tools/config.py`; usage/cost is tracked in SQLite and surfaced on the Dashboard.

---

## Documentation

| Doc | What |
|---|---|
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | **Resume here** — current milestone status, how to run, next steps, loose ends |
| [`docs/opus-master-brief.md`](docs/opus-master-brief.md) | The original authoritative build plan |
| [`CLAUDE.md`](CLAUDE.md) | Deep philosophy + architecture + vault-integrity catalog (partially pre-rebuild) |
| [`docs/design-archive/`](docs/design-archive/) | The original UI design source + UI↔backend contract |

---

*Personal project — one user, one vault. Not accepting external contributions.*

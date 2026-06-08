# SystemDesignAI — Opus Planning & Coding Brief

Paste this entire document into a Claude Opus session when ready to build.
Opus should produce: architecture decisions, all code files, UI designs, and prompt templates.
This is a personal learning tool for one user — not SaaS, not multi-tenant.

---

## What This Is

A personal system design mastery platform. Not a course you consume — a system that
compounds. Every study session makes the vault smarter. Every question you get wrong
surfaces again. Every concept you promote becomes a permanent node in your knowledge graph.

The vault is the brain. 295 structured markdown pages across 14 areas of system design.
The LLM is a compiler, not a chatbot. The UI is a learning cockpit, not a chat interface.

Inspired by Karpathy's LLM Wiki approach.

---

## Current State (what already exists and works)

### Backend (`/tools`)
- `api.py` — FastAPI on port 8000
- `vault.py` — parses all 295 markdown pages, frontmatter, wikilinks
- `query_engine.py` — keyword-based vault retrieval (to be replaced with FAISS)
- `llm_adapter.py` — supports Ollama and Gemini backends
- `lint.py` — vault health checks: broken links, orphans, DAG cycles
- `export_json.py` — compiles vault → `course-data.json` for frontend
- `export_anki.py` — exports Active Recall questions as Anki cards
- `conversation_logger.py` — logs Q&A to `conversations/YYYY-MM-DD/NNNN.md`
- `reflection_engine.py` — post-session insight extraction

### Working endpoints
- `GET /api/ask` — SSE streaming, keyword retrieval, single-turn only
- `POST /api/promote` — Knowledge Compiler (single-turn conversations)
- `POST /api/confirm_promotion` — writes to vault, runs lint

### Frontend (`/course-app`) — Vite + React
- Home, Ask AI, Explore Areas, Knowledge Graph, Quiz pages
- SSE streaming works
- Promote-to-vault workflow works end-to-end

### The Vault
- 295 pages, 14 areas, all linted clean (0 broken links, 0 orphans, 0 DAG cycles)
- Each page: frontmatter (title, area, status, sources, related), Executive Summary,
  Why This Exists, Core Intuition, Design Tradeoffs table, Related Concepts (wikilinks),
  Active Recall Questions
- Status lifecycle: stub → draft → mature → comprehensive
- 9 source books: DDIA, SDI1, SDI2, FoSA, HFDP, MSE, Refactoring, SWE@Google, DEC

---

## What Opus Must Build

### 1. LLM Adapter — Role-Based Routing with Fallback

**Routing:**
- `/api/ask` → Qwen 8B via Ollama (primary, local, free, zero cost)
- `/api/promote` → Claude Sonnet (primary, quality gate)
- Fallback on any failure: retry 2x with backoff → notify user via SSE banner → switch backend

**Fallback chain:**
- Ask: Qwen → Claude Haiku
- Promote: Claude Sonnet → Qwen (same prompt, same output format)

**Prompt parity:**
Both Claude and Qwen receive identical Opus-generated prompts from `tools/prompts/`.
Qwen is the baseline constraint — prompts must be explicit enough for an 8B model.
Every rule imperative ("DO X"), not suggestive. Negative examples required for every
failure mode.

**Prompt caching:**
On every `/api/promote` call to Claude, the vault map prefix is marked cacheable.
90% cost reduction on repeated calls. ~$0.05–0.10/day at moderate usage.

**Files to produce:**
- `tools/llm_adapter.py` — full implementation
- `tools/prompts/__init__.py` — `load_prompt()` helper, fails fast if file missing
- `tools/prompts/vault_qa_system.md` — system prompt for `/api/ask`
- `tools/prompts/knowledge_compiler.md` — system prompt for `/api/promote`
- `tools/prompts/query_rewriter.md` — prompt for pre-retrieval query rewriting

**Environment variables needed:**
```
ANTHROPIC_API_KEY
CLAUDE_ASK_MODEL=claude-haiku-4-5-20251001
CLAUDE_PROMOTE_MODEL=claude-sonnet-4-6-20251001
QWEN_ASK_MODEL=qwen3:8b
QWEN_PROMOTE_MODEL=qwen3:8b
OLLAMA_HOST=http://localhost:11434
OLLAMA_KEEP_ALIVE=-1
LLM_MAX_RETRIES=2
LLM_TIMEOUT_SECONDS=30
```

---

### 2. FAISS Semantic Search (replaces keyword scoring)

**Why:** Keyword scoring misses semantic relationships. "Leader election" won't surface
the Raft page. "Eventual consistency" might miss CAP theorem.

**Implementation:**
```python
# Build at startup, rebuild after every vault write (debounced 30s)
model = SentenceTransformer("all-MiniLM-L6-v2")  # 80MB, ~5ms per query

def build_index(pages):
    texts = [f"{p['title']} {p['content'][:500]}" for p in pages]
    embeddings = model.encode(texts, batch_size=64).astype("float32")
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    return index, pages
```

**Query rewriting (new — add before FAISS):**
Before hitting FAISS, a lightweight Qwen call rewrites the raw query into 2–3
retrieval-optimised variants. Score all variants, union top-N results, deduplicate.
Prompt: `tools/prompts/query_rewriter.md`

**Files to produce:**
- Updated `tools/query_engine.py` — FAISS index, query rewriting, semantic scoring

---

### 3. Multi-Turn Study Sessions

**Why:** Single-turn Q&A wastes vault depth. Can't follow up, drill edge cases,
or compare topics across turns.

**Architecture:**
- Session state: `session_id → {history: [], vault_context: str, created_at, last_active}`
- Vault context fetched once per session (re-fetched if topic shifts significantly)
- Session expires after 30 min inactivity
- `/api/promote` compiles the full session, not just the last turn

**New endpoints:**
```
POST /api/session/start          → {session_id}
POST /api/session/{id}/ask       → SSE stream (multi-turn)
POST /api/session/{id}/compile   → compile full session → structured artifact
POST /api/session/{id}/promote   → promote compiled artifact to vault
DELETE /api/session/{id}         → end session
```

**Compile & Promote flow (multi-turn):**
1. User studies — multi-turn Q&A, vault grounds every response
2. "Compile Session" button → full conversation → LLM → blog-quality artifact
   (not a summary — full depth, tables, tradeoff comparisons, interview angles)
3. User reviews and edits artifact in the UI
4. "Promote" → artifact split into vault operations (create/extend/skip per concept)

---

### 4. Post-Write Pipeline (vault consistency)

Every vault write must trigger automatically (currently requires manual restart):

```python
async def post_vault_write(page: dict, operation: str):
    await invalidate_page_cache(page["slug"])
    await rebuild_faiss_index()        # debounced 30s — batch multiple writes
    await recompile_course_json()      # export_json.py
    await run_lint(page)               # catch issues immediately
    await validate_wikilinks(page)     # all links resolve
    await patch_backlinks(page)        # existing pages link back
    await update_index_md(page)        # master index page
    await append_to_log(page, operation)
```

Blocking: lint, wikilink validation, frontmatter checks (write fails on error)
Warning: duplicate detection, backlink patching (write succeeds, issues surfaced in UI)

---

### 5. Vault Integrity Guardrails

All of these must be enforced in the compiler prompt AND `lint.py`:

**Wikilink integrity:**
- Vault map sent to compiler includes exact slugs: `- [[raft-consensus]] — Raft Consensus (distributed-systems)`
- Minimum 3 wikilinks per CREATE page — compile failure if fewer
- After every write: backlink patcher adds reverse links to existing pages

**EXTEND context fix (critical):**
- Compiler currently sees vault map only — blind to target page content
- For any EXTEND: fetch full target page, inject as `<target_page_content>`
- Compiler must name target section and merge strategy explicitly:
  `ADD_ROW_TO_TABLE | ADD_BULLET | REWRITE_PARAGRAPH | ADD_RECALL_QUESTION | ADD_SUBSECTION`
- `## New Insights` and `## Session Notes` section names forbidden — lint rejects them

**Duplicate detection:**
- Before compiler call: FAISS score conversation concepts vs all 295 pages
- Score > 0.88 → force EXTEND not CREATE
- Score 0.72–0.88 → flag for human decision
- Alias map: `tools/aliases.json` maps synonyms to canonical slugs

**Contradiction detection:**
- Compiler output includes `conflicts_with` field when conversation corrects existing content
- Do not silently create parallel claims — flag for human review

**Recall question quality:**
- Minimum 3 per page, specific not shallow ("what guarantees does X provide under partition?"
  not "what is X?")
- Answer minimum 10 words
- No duplicates on EXTEND (send existing questions to compiler)
- Cap at 10 questions per page — trigger audit when exceeded

**Source attribution:**
- Book-sourced: `sources: [DDIA, SDI1]`
- Conversation-promoted: `sources: [conversation-2026-06-07]`
- Mixed: `sources: [DDIA, conversation-2026-06-07]`
- lint rejects empty sources field

**Status rules:**
- Single-turn promotion → always `stub` or `draft`
- Multi-turn session → `draft` at most
- `mature` and `comprehensive` earned through multiple extension cycles only

---

### 6. Raw File Ingest Pipeline

Drop a PDF or markdown into `raw/` → auto-ingested → relevant vault pages created/extended.

**Two-pass approach:**
- Pass 1: FAISS deduplication (no LLM) — score new content vs existing pages
  - Novel (< 0.72) → send to compiler
  - Partial (0.72–0.90) → send to compiler with EXTEND instruction
  - Duplicate (> 0.90) → skip
- Pass 2: LLM integration (only novel/partial content)
  - Compiler formats and integrates — does NOT deduplicate (FAISS did that)

**Components:**
- `tools/watcher.py` — monitors `raw/` with watchdog, runs as separate OS process
- `tools/ingest.py` — orchestrates two-pass pipeline
- `tools/extractor.py` — pymupdf4llm for PDFs, direct read for markdown
- `raw/manifest.json` — tracks processed files (path, hash, timestamp, pages_created, pages_extended)

---

### 7. Analytics & Usage Feedback

Run as `tools/analytics.py` — weekly pass over conversation logs.

**Track:**
- Which vault pages retrieved per query (from logs)
- Promotions approved vs rejected
- Quiz questions failed repeatedly
- Areas queried most vs least
- Promotion rate per session (queries / promotions) — tracks flywheel health

**Surface:**
- "Most-queried, never promoted" → vault answers well here
- "Frequently retrieved, never the right answer" → needs extending
- "Only source is conversation" → verify against a book eventually
- Promotion rate trend — rising means new territory, falling means mastery

---

## UI — The Learning Cockpit

This is the most important section. The UI is not a chat wrapper.
It is a learning cockpit designed to maximise retention, coverage, and depth.

### Design Principles
- Zero friction between insight and vault. Promote should feel like ⌘S.
- The vault is always visible. You should always know where you are in the knowledge graph.
- Progress is earned, not assumed. Status indicators everywhere — page lifecycle, area coverage, quiz scores.
- The system teaches you what to study next. Not random, not linear — adaptive.

### Tech Stack
- Vite + React (existing)
- Tailwind CSS
- React Router
- Recharts for analytics
- Cytoscape.js for knowledge graph (replace current implementation if needed)
- react-hot-toast for non-blocking notifications (backend warnings, promote confirmations)

---

### Page 1: Dashboard (replace current Home)

The mission control view. Opens every session.

**Left panel — Session State:**
- Active session timer (starts on first query)
- Queries this session / promotions this session
- Current topic area (inferred from recent queries)
- "Compile Session" button (active after ≥ 3 queries)
- Recent pages promoted (last 5, with status badges)

**Center — Today's Focus:**
- Suggested study path based on: weakest quiz areas + least queried areas + in-progress areas
- 3 recommended pages to study today (with status: stub/draft/mature)
- Quick-start buttons: "Resume last session" / "Start new area" / "Review flashcards"

**Right panel — Vault Health:**
- Area coverage rings: 14 areas, each showing % pages at mature/comprehensive
- Pages promoted this week
- Lint status (green/yellow/red)
- Backend status indicator (Claude ✓ / Qwen ✓) — shows which backends are live

**Bottom — Streak & Stats:**
- Study streak (days), total pages promoted, total queries, vault page count

---

### Page 2: Study (replaces Ask AI)

The primary learning interface. Multi-turn conversation grounded in the vault.

**Layout — three-column:**

Left sidebar (240px) — Session context:
- Current session history (collapsed messages, expandable)
- Pages retrieved for current query (live, updates per query)
- Wikilinks surfaced in current answer (clickable → opens page in right panel)
- "Compile Session" button
- Session timer

Center (flex) — Conversation:
- Multi-turn chat interface
- Each answer includes:
  - The answer text (streaming)
  - "Sources" chip row — vault pages used (click to preview)
  - Gap flag banner (yellow) if vault partially covers the topic:
    "Vault gap: [specific topic] — promote a page?"
  - Promote button (per-answer, not just per-session)
- Query input at bottom — full width, ⌘Enter to send
- Backend warning banner at top (dismissible) when fallback activates

Right panel (320px, collapsible) — Page Preview:
- Shows vault page content when user clicks a wikilink or source chip
- Inline "Extend this page" button → pre-fills promote flow for that page
- Page metadata: area, status, sources, last modified

**Promote flow (modal, not page navigation):**
1. User clicks "Promote" → modal opens
2. Shows compiler output: decision (CREATE/EXTEND/SKIP), target page, section, content
3. User edits directly in the modal (markdown editor)
4. Conflict warnings shown inline if `conflicts_with` is non-empty
5. "Confirm" → writes to vault → toast notification → right panel updates

---

### Page 3: Vault Explorer (replaces Explore Areas)

Browse and navigate the 295-page vault.

**Layout:**

Top — Area selector:
- 14 area pills with page count and health indicator
- Filter by status (stub / draft / mature / comprehensive)
- Search bar (queries FAISS — shows results as you type)

Main — Page grid:
- Cards showing: title, area, status badge, source badges, wikilink count
- Sort by: recently modified, status, most queried, least queried
- Click → opens page detail view

Page detail view (right panel or modal):
- Full page content (rendered markdown)
- Metadata: status, sources, area, last modified, promote count
- "Extend this page" button
- Inbound and outbound wikilinks (visual mini-graph)
- Active Recall questions (expandable)

---

### Page 4: Knowledge Graph

Visual map of the vault's wikilink structure. Built with Cytoscape.js.

**Nodes:**
- Sized by inbound link count (hub pages are visually larger)
- Coloured by area (14 colours, one per area — with legend)
- Shaped by status: circle (stub), rounded square (draft), square (mature), diamond (comprehensive)

**Edges:**
- Directed (A links to B)
- Thickness by frequency of co-retrieval (pages retrieved together get thicker edges)

**Interactions:**
- Click node → right panel shows page preview
- Double-click node → navigate to page detail
- Hover node → highlight all connected nodes, dim others
- Filter by area (hide/show subgraphs)
- Search → animates to matching node
- "Orphan mode" → highlights pages with 0 inbound links (vault health view)

**Mini-graph:**
Also used inline in Study page right panel and Vault Explorer page detail — shows
just the 2-hop neighbourhood of the current page.

---

### Page 5: Roadmap

Structured learning paths through the vault. Not fixed courses — adaptive paths
based on your current status distribution.

**Layout:**

Top — Path selector:
- "Interview Prep" path — optimised for system design interviews
- "Deep Mastery" path — covers every area to mature/comprehensive
- "Fix My Gaps" path — generated from quiz failures and least-queried areas
- "Custom" — user picks areas and target status

Main — Roadmap view:
- Visual timeline: stages with page clusters
- Each stage shows: pages to study, prerequisite pages, estimated sessions
- Progress bar per stage (based on actual page status in vault)
- Click a page → opens in Study with that page pre-loaded as context

**Page status in roadmap:**
- Not started (gray)
- In vault but stub/draft (yellow) — read and promote
- Mature/comprehensive (green) — quiz to verify retention
- Quiz passed (green + checkmark) — move on

---

### Page 6: Flashcards (replaces Quiz)

Spaced repetition on Active Recall questions from vault pages.

**Session flow:**
1. Card shown: question only
2. User thinks → clicks "Show Answer"
3. Answer revealed
4. User rates: "Again" / "Hard" / "Good" / "Easy" (SM-2 algorithm)
5. Next card

**Queue logic:**
- Due cards first (SM-2 scheduling)
- New cards from weakest areas next
- Failed cards re-queued within same session (until "Good" or "Easy")
- Session ends when queue empty or user stops

**Card view:**
- Question prominently displayed
- Source page shown (click → opens in Study)
- Area badge
- On answer reveal: full answer + link to related vault pages
- Progress bar: cards remaining in session

**Analytics panel (sidebar):**
- Retention rate by area
- Cards due today / this week
- Longest streak per area
- "Problem cards" — failed ≥ 3 times (surface for page extension)

**Sync with vault:**
New recall questions from promotions are automatically added to the flashcard queue
as "new" cards. No manual import needed.

---

### Page 7: Ingest

Drop raw content into the vault.

**Layout:**
- Drag-and-drop zone for PDFs and markdown files
- Processing queue: shows status per file (pending / extracting / deduplicating / compiling / done)
- Results per file: pages created (list with links), pages extended (list with links), pages skipped (count)
- Manifest view: full history of ingested files

---

### Global UI Elements

**Backend status bar (top right, always visible):**
- Green dot: Claude ✓ Qwen ✓
- Yellow dot: Claude ✗ → using Qwen fallback
- Red dot: both unavailable
- Click → shows health check details

**Vault stats bar (bottom, always visible):**
- Total pages / pages promoted today / lint status / current session queries

**Keyboard shortcuts:**
- ⌘K → search vault (FAISS, opens anywhere)
- ⌘P → promote current conversation
- ⌘F → open flashcard session
- ⌘G → open knowledge graph
- ⌘/ → toggle right panel

---

## Prompt Files Opus Must Write

### `vault_qa_system.md` — for `/api/ask`

Used by Qwen 8B (primary). Must be explicit enough for an 8B model.

Requirements:
- Answer ONLY from vault context. Never fill gaps with general LLM knowledge.
- When vault partially covers topic: answer what it covers, flag the gap explicitly:
  "Vault gap: [specific topic] — consider promoting a page on this."
- When vault doesn't cover topic: say so directly. Do not guess.
- Always surface 2–3 related pages using [[wikilink]] syntax.
- Format: precise, tables for tradeoffs, code blocks where useful, no padding.
- Rules imperative not suggestive. Include 5 worked examples:
  - 2 full coverage, 1 partial (gap flag), 1 no coverage, 1 cross-area synthesis

Pass criteria before shipping: 8/10 queries through Qwen pass all rules.

### `knowledge_compiler.md` — for `/api/promote`

Used by Claude Sonnet (primary), Qwen 8B (fallback). Must produce valid JSON both ways.

Output schema:
```json
{
  "decision": "CREATE | EXTEND | SKIP",
  "reason": "one sentence",
  "promotion_type": "concept_page | comparison_page | interview_framework | design_pattern_page | learning_note",
  "slug": "kebab-case",
  "area": "one of 14 valid areas",
  "content": "full markdown following vault schema",
  "target_slug": "exact slug from vault map",
  "target_section": "exact section heading",
  "merge_strategy": "ADD_ROW_TO_TABLE | ADD_BULLET | REWRITE_PARAGRAPH | ADD_RECALL_QUESTION | ADD_SUBSECTION",
  "new_content": "content to merge",
  "conflicts_with": ["slug#section"],
  "conflict_description": "describe conflict or null"
}
```

Rules (all imperative):
- Check alias map before CREATE. Match = force EXTEND.
- Use ONLY slugs from vault map. Minimum 3 wikilinks per CREATE.
- EXTEND: use target_page_content to find exact section. Never append "New Insights".
- Status: stub (single-turn), draft (multi-turn). Never mature/comprehensive on first write.
- Sources: conversation-YYYY-MM-DD for promoted pages.
- Recall: minimum 3, specific, non-overlapping, answers ≥ 10 words.
- Output raw JSON only — no fences, no preamble, no prose after.

Include 6 worked examples. Include explicit negative example (bad append → corrected merge).
"Output raw JSON only" rule at both start and end of prompt.

Qwen pass criteria: valid JSON ≥ 8/10, no invented slugs ≥ 8/10, section targeting ≥ 6/10.

### `query_rewriter.md` — for pre-retrieval query rewriting

Used by Qwen 8B before every FAISS call.
Input: raw user query.
Output: JSON array of 2–3 retrieval-optimised variants (plus original).
```json
["original query", "variant 1", "variant 2"]
```
Fast, cheap call. Must complete in < 500ms on Qwen 8B.

---

## File Structure After Build

```
/
├── knowledge/
│   └── SystemDesign/
│       ├── schema.md
│       ├── source-map.md
│       ├── index.md
│       ├── log.md
│       ├── aliases.json          ← NEW: synonym → canonical slug map
│       ├── raw/
│       │   └── manifest.json     ← NEW: ingest history
│       └── <area>/
├── tools/
│   ├── api.py                    ← updated: new endpoints, post_vault_write
│   ├── llm_adapter.py            ← rebuilt: role routing, fallback, prompt caching
│   ├── vault.py                  ← updated: cache invalidation
│   ├── query_engine.py           ← rebuilt: FAISS + query rewriting
│   ├── sessions.py               ← NEW: multi-turn session state
│   ├── ingest.py                 ← NEW: two-pass ingest pipeline
│   ├── watcher.py                ← NEW: file system watcher (separate process)
│   ├── analytics.py              ← NEW: weekly usage analysis
│   ├── backlink_patcher.py       ← NEW: auto-patches reverse wikilinks
│   ├── lint.py                   ← updated: new integrity checks
│   ├── export_json.py
│   ├── export_anki.py
│   ├── conversation_logger.py
│   ├── reflection_engine.py
│   └── prompts/
│       ├── __init__.py           ← NEW: load_prompt() helper
│       ├── vault_qa_system.md    ← NEW: Opus-generated
│       ├── knowledge_compiler.md ← NEW: Opus-generated
│       └── query_rewriter.md     ← NEW: Opus-generated
└── course-app/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx     ← NEW: replaces Home
        │   ├── Study.jsx         ← rebuilt: multi-turn, three-column
        │   ├── VaultExplorer.jsx ← rebuilt: replaces Explore Areas
        │   ├── KnowledgeGraph.jsx← rebuilt: Cytoscape.js
        │   ├── Roadmap.jsx       ← NEW
        │   ├── Flashcards.jsx    ← rebuilt: SM-2 spaced repetition
        │   └── Ingest.jsx        ← NEW
        ├── components/
        │   ├── BackendStatus.jsx  ← NEW: always-visible status bar
        │   ├── VaultStatsBar.jsx  ← NEW: bottom bar
        │   ├── PromoteModal.jsx   ← NEW: promote flow modal
        │   ├── PagePreview.jsx    ← NEW: right panel page viewer
        │   ├── MiniGraph.jsx      ← NEW: 2-hop neighbourhood view
        │   └── GapFlagBanner.jsx  ← NEW: vault gap notification
        └── hooks/
            ├── useSession.js      ← NEW: session state management
            ├── useVault.js        ← NEW: vault data + search
            └── useFlashcards.js   ← NEW: SM-2 scheduling
```

---

## What Opus Should Produce in the Session

Work through this in order. Do not skip steps.

1. **Review and confirm architecture** — flag anything that conflicts or needs clarification
2. **Write all backend files** — in dependency order: prompts → llm_adapter → query_engine → sessions → ingest → watcher → analytics → updated api.py → updated lint.py
3. **Write all prompt files** — vault_qa_system.md, knowledge_compiler.md, query_rewriter.md
4. **Write all frontend files** — components first, then pages, then hooks
5. **Write integration tests** — for compiler output validation and fallback behaviour
6. **Write a startup checklist** — what to verify before first session after deployment

For each file: write the complete implementation, no TODOs, no stubs. This is a personal
tool with one user — correctness over extensibility.

---

## Constraints and Non-Negotiables

- The vault must never silently degrade. Every guardrail is a hard requirement.
- Qwen runs the same prompts as Claude. Quality parity is the goal, not an aspiration.
- Fallback must notify the user. Silent backend switching is not acceptable.
- Post-vault-write pipeline must be automatic. Manual restarts are not acceptable.
- The frontend must feel like a learning tool, not a chat UI. The vault is always visible.
- No dark patterns — no fake progress, no gamification that doesn't reflect real mastery.
  Status badges and roadmap progress must reflect actual vault page quality.
- Performance: first token in < 300ms, FAISS retrieval < 5ms, UI interactions < 100ms.

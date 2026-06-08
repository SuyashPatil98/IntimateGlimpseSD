# SystemDesignAI — UI ↔ Backend Handoff

This document describes what the front-end is, the data shapes it expects, the
endpoints it implies, the streaming protocol, and exactly where each mock
constant lives so you can replace them with real API calls one at a time.

The UI is **read-only against mock data right now**. Nothing persists, nothing
network-fetches. Every place that *should* hit the backend is a clearly-labeled
`MOCK_*` constant or a local-state hook with a TODO note in this doc.

---

## 1. The product, in one paragraph

A single-user desktop web app for studying system design grounded in a ~300-page
personal vault of interlinked markdown notes. The LLM is a **compiler**, not a
chatbot: each Q&A produces a `PromoteProposal` that becomes a permanent note,
not throwaway chat. The UI surfaces *which* notes were retrieved, *how
confidently*, *how* concepts connect, and treats the vault itself as first-class
state (coverage rings, graph, lint, ingest pipeline).

---

## 2. Repo layout

```
SystemDesignAI Cockpit.html   # entry shell — loads scripts in order
tokens.css                    # all design tokens, controls, layout primitives
shared.jsx                    # icons, AREAS, primitives, ALL mock data
app.jsx                       # top bar, command palette, router, shortcuts
dashboard.jsx                 # /dashboard
study.jsx                     # /study + Promote modal
vault.jsx                     # /vault (explorer)
graph.jsx                     # /graph (force-laid network)
flashcards.jsx                # /flashcards (SRS review)
roadmap.jsx                   # /roadmap (milestones)
ingest.jsx                    # /ingest (drop + queue)
profile.jsx                   # /profile (settings + ops)
```

Each `*.jsx` is a `<script type="text/babel">` that publishes its exports on
`window` (no ESM in the browser-Babel setup). When you replace mocks with real
data, just substitute the constants — no import surgery needed.

---

## 3. Canonical type shapes

These are the exact shapes the UI is coded against. **Backend MUST match.**

```ts
// ---- enums --------------------------------------------------------------
type Area =
  | "distributed-systems" | "databases" | "networking" | "storage"
  | "messaging" | "caching" | "reliability" | "architecture-patterns"
  | "design-patterns" | "software-engineering" | "data-engineering"
  | "ml-systems" | "system-design-interview" | "case-studies";

type Status = "stub" | "draft" | "mature" | "comprehensive";

// ---- source returned with each retrieval --------------------------------
type SourceChip = {
  page: string;            // vault-relative path, e.g. "messaging/kafka.md"
  title: string;
  area: Area;
  status: Status;
  score: number;           // 0..1 retrieval confidence
  matched_sections: string[];
  snippet: string;
  via: "retrieval" | "graph";  // "graph" = added via backlink expansion
};

// ---- backend health (top-bar pill) --------------------------------------
type Health = {
  backends: { qwen: boolean; claude: boolean; gemini: boolean };
  vault:    { pages: number };
};

// ---- promote modal payload ----------------------------------------------
type PromoteProposal = {
  decision: "CREATE" | "EXTEND" | "SKIP";
  reason: string;
  promotion_type: string;          // free-text taxonomy, e.g. "ROW_TO_EXISTING"
  title?: string;                  // when CREATE
  area?: Area;                     // when CREATE
  content?: string;                // when CREATE
  target_title?: string;           // when EXTEND
  target_section?: string;         // markdown heading path
  merge_strategy?:
    | "ADD_ROW_TO_TABLE" | "ADD_BULLET" | "REWRITE_PARAGRAPH"
    | "ADD_RECALL_QUESTION" | "ADD_SUBSECTION";
  new_content?: string;            // markdown body
  wikilinks: string[];             // [["X"], ["Y"]]
  conflicts_with: string[];        // page paths
  conflict_description?: string | null;
};

// ---- flashcard ----------------------------------------------------------
type Flashcard = {
  page: string;             // source note
  area: Area;
  question: string;
  answer: string;
  deepExplanation?: string;
  due: string;              // ISO or relative "now"/"4d"
  ease: number;             // SM-2 style ease factor
};

// ---- vault note (explorer/grid/list) ------------------------------------
type VaultNote = {
  page: string;
  title: string;
  area: Area;
  status: Status;
  inbound: number;          // # of incoming wikilinks
  words: number;
  modified: string;         // "2d", "1mo", etc. (UI formats, but accepts ISO)
  snippet: string;          // first ~140 chars of body
};

// ---- graph --------------------------------------------------------------
type GraphNode = {
  id: string;
  title: string;
  area: Area;
  status: Status;
  inbound: number;          // drives node radius
};
type GraphEdge = [string, string];   // [fromId, toId]

// ---- area coverage (dashboard rings) ------------------------------------
type AreaCoverage = {
  area: Area;
  pct: number;              // 0..100, %notes mature+comprehensive
  total: number;
  mature: number;
};

// ---- session ------------------------------------------------------------
type Session = {
  id: string;
  startedAt: string;        // "09:42" or ISO
  elapsedMin: number;
  queries: number;
  promotions: number;
  retrievals: number;
  history: { id: string; q: string; when: string }[];
  retrieved: SourceChip[];  // dedup'd union of all retrieved pages this session
};

// ---- ingest -------------------------------------------------------------
type IngestItem = {
  id: string;
  filename: string;
  kind: "PDF" | "MD" | "TXT" | "DOCX" | "EPUB" | "ZIP" | string;
  size: string;
  area: Area | "—";
  state: "queued" | "extracting" | "chunking" | "compiling" | "embedding" | "done" | "failed";
  progress: number;         // 0..100
  chunks?: number;
  eta?: string;
  promoted?: number;        // # of suggestions created from this file
  error?: string;
};

// ---- profile / config ---------------------------------------------------
type BackendConfig = {
  id: string;               // "qwen" | "claude" | "gemini" | "gpt" | "local" | ...
  name: string;
  provider: string;
  model: string;
  endpoint: string;
  keyMasked: string;        // server returns masked; PUT accepts raw
  enabled: boolean;
  role: "primary" | "fallback" | "standby" | "embed-only";
  state: "ok" | "checking" | "idle" | "missing" | "down";
  latencyMs: number | null;
  lastCheck: string;
  contextWindow: number;
  costIn: number;           // $ per million tokens
  costOut: number;
};

type RoutingPolicy =
  | "quality-first" | "cost-first" | "latency-first" | "manual";

type CompilerDefaults = {
  temperature: number;        // 0..1
  maxTokens: number;          // 256..8192
  minPromoteConfidence: number; // 0.5..0.99
  sessionTokenBudgetK: number;  // 20..500
  autoPromoteAt: number | null; // null = off, else 0..1 threshold
  showVaultGaps: boolean;
  includeReasoningTrace: boolean;
  strictCitation: boolean;
};

type Milestone = {
  id: string;
  lane: "shipped" | "current" | "next" | "later";
  title: string;
  target: string;             // human "Q2 2026 · 8 weeks"
  progress: number;           // 0..100
  areas: Area[];
  notesPlanned: number;
  notesDone: number;
  cards: { kind: "note" | "skill" | "drill"; title: string; status?: Status; todo?: boolean }[];
};
```

---

## 4. The 14 area ids (canonical)

Order matters — UI sorts and color-keys by this list. Defined in
`shared.jsx → AREA_ORDER`.

```
distributed-systems, databases, networking, storage, messaging, caching,
reliability, architecture-patterns, design-patterns, software-engineering,
data-engineering, ml-systems, system-design-interview, case-studies
```

Each has a fixed color exposed as CSS var `--area-<id>` in `tokens.css`. If the
backend ever invents a new area, the UI **must** be updated in both files.

---

## 5. Streaming protocol (SSE)

The Study screen consumes a Server-Sent-Events stream from the answer endpoint.
Events arrive in this order (some optional):

```
1) {type:"sources",  sources: SourceChip[]}           // ONCE, before any text
2) {type:"backend",  backend: "qwen"|"claude"|...,
                     model: string,
                     primary: boolean}                // ONCE, when route picked
3) {type:"chunk",    text: string} ...                // N times, the answer body
4) {type:"notice",   text: string}                    // ZERO+ — e.g. "fallback used"
5) {type:"vault_gap", area: Area, desc: string,
                      suggested_page: string}         // ZERO or ONE
6) {type:"done"}                                      // ALWAYS last
```

If the primary backend fails mid-stream, emit a `notice` event then start
streaming from the fallback. The UI renders a dismissible **amber banner** at
the top of Study when it sees a fallback `notice`.

Recommended SSE framing: `data: <json>\n\n` per event, `event:` field optional.

---

## 6. Endpoints implied by the UI

Each one has a **caller** (which screen needs it) and the **mock constant** it
should replace. Paths are suggestions; match your conventions.

### Core / health
| Method | Path                            | Purpose                                                 | Replaces                                   |
|--------|---------------------------------|---------------------------------------------------------|--------------------------------------------|
| GET    | `/api/health`                   | Top-bar backend status pill, polled every ~12s          | `MOCK_HEALTH` (shared.jsx)                 |
| GET    | `/api/vault/stats`              | Top-bar notes count, promoted-today                     | `MOCK_VAULT_STATS` (shared.jsx)            |
| GET    | `/api/areas/coverage`           | Dashboard 14 area rings                                 | `MOCK_AREA_COVERAGE` (shared.jsx)          |

### Session
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| GET    | `/api/session/current`               | Dashboard + Study left rail (queries/promos/etc.)  | `MOCK_SESSION` (shared.jsx)       |
| POST   | `/api/session/compile`               | Distill session → 1 master note (mock button)      | new                               |

### Study (streaming Q&A)
| Method | Path                                 | Purpose                                            | Notes                             |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| POST   | `/api/study/query`                   | **SSE.** Body `{ q, scope?: Area[] }`              | Stream contract above             |
| GET    | `/api/study/thread/:id`              | Re-load a past thread                              | history items                     |
| POST   | `/api/study/promote-proposal`        | Generate `PromoteProposal` from last answer        | `MOCK_PROMOTE_PROPOSAL`           |
| POST   | `/api/study/promote`                 | Apply a `PromoteProposal` (after user edits md)    | Returns new/updated `VaultNote`   |

### Vault
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| GET    | `/api/vault/notes?q=&area=&status=&sort=` | Vault Explorer grid/list                      | `VAULT_NOTES` (vault.jsx)         |
| GET    | `/api/vault/note/:path`              | Page preview pane (study right col)                | inline mock in study.jsx          |
| POST   | `/api/vault/note`                    | Create new note (manual)                           | new                               |
| PUT    | `/api/vault/note/:path`              | Edit / extend / rewrite                            | new                               |
| GET    | `/api/vault/lint`                    | Dashboard lint counters + Vault lint button        | `MOCK_VAULT_STATS.lint*`          |
| GET    | `/api/vault/recent-promoted?n=5`     | Dashboard sidebar                                  | `MOCK_RECENT_PROMOTED`            |
| GET    | `/api/vault/today-focus?n=3`         | Dashboard center column                            | `MOCK_TODAY_FOCUS`                |

### Graph
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| GET    | `/api/graph`                         | `{ nodes: GraphNode[], edges: GraphEdge[] }`       | `GRAPH_NODES`, `GRAPH_EDGES`      |
| POST   | `/api/graph/rebuild`                 | Profile → compiler ops                             | mocked job in profile.jsx         |

### Flashcards
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| GET    | `/api/flashcards/due`                | Today's review queue                               | `FLASHCARD_DECK` (flashcards.jsx) |
| POST   | `/api/flashcards/rate`               | `{ cardId, rating: "Again"\|"Hard"\|"Good"\|"Easy" }` → next due | new            |
| POST   | `/api/flashcards/improve`            | "Improve flashcards" button — LLM rewrites weak cards | new                           |

Intervals shown in UI (`+10m`, `+1d`, `+4d`, `+9d`) are placeholders — backend
owns real scheduling.

### Roadmap
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| GET    | `/api/roadmap`                       | All milestones in all lanes                        | `ROADMAP_MILESTONES` (roadmap.jsx)|
| POST   | `/api/roadmap/milestone`             | Create/edit/delete (UI affordance present)         | new                               |

### Ingest
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| POST   | `/api/ingest`                        | Multipart upload, returns `IngestItem[]`           | `INITIAL_QUEUE` (ingest.jsx)      |
| GET    | `/api/ingest/queue`                  | Poll or SSE; emits state transitions               | mocked tick in ingest.jsx         |
| POST   | `/api/ingest/scan-vault`             | "Re-scan vault folder" button                      | new                               |
| POST   | `/api/ingest/from-url`               | URL ingest                                         | new                               |
| DELETE | `/api/ingest/:id`                    | Cancel / clear                                     | new                               |

### Profile (config + ops)
| Method | Path                                 | Purpose                                            | Replaces                          |
|--------|--------------------------------------|----------------------------------------------------|-----------------------------------|
| GET    | `/api/config`                        | Full settings object                               | `DEFAULT_BACKENDS` + locals       |
| PUT    | `/api/config/backend/:id`            | Save key / endpoint / role / enabled               | local state                       |
| POST   | `/api/config/backend/:id/probe`      | Synchronous probe, returns `{ state, latencyMs }`  | simulated probe in profile.jsx    |
| POST   | `/api/config/backend`                | Add a new backend (the "Add backend" button)       | new                               |
| PUT    | `/api/config/routing`                | `{ policy: RoutingPolicy, autoRetry, cache, ... }` | local                             |
| PUT    | `/api/config/defaults`               | `CompilerDefaults`                                 | local                             |
| POST   | `/api/config/export` / `/import`     | The "Export / Import config" buttons               | new                               |

### Compiler operations (long-running)
All four return a job id and stream progress via SSE on `/api/jobs/:id`.

| Method | Path                                 | Purpose                                            |
|--------|--------------------------------------|----------------------------------------------------|
| POST   | `/api/compiler/recompile-all`        | Re-pass every note through the compiler           |
| POST   | `/api/compiler/reembed-all`          | Rebuild retrieval index                            |
| POST   | `/api/compiler/lint`                 | Full vault lint                                    |
| POST   | `/api/compiler/build-graph`          | Recompute backlinks/centrality                     |

Progress event shape (matches UI in `CompilerOpsCard`):
```
{ type:"progress", current:int, total:int, percent:float,
  log:{page:string, result:"ok"|"warn"|"fail"} }
{ type:"done", summary: {...} }
```

### Sync / backup
| Method | Path                                 | Purpose                                            |
|--------|--------------------------------------|----------------------------------------------------|
| GET    | `/api/sync/status`                   | Last sync, incoming changes                        |
| POST   | `/api/sync/now`                      | Git push/pull (UI shows shimmer progress)          |
| POST   | `/api/sync/snapshot`                 | Snapshot backup button                             |

### Danger zone
| Method | Path                                 | Purpose                                            |
|--------|--------------------------------------|----------------------------------------------------|
| POST   | `/api/admin/clear-cache`             | Retrieval cache flush                              |
| POST   | `/api/admin/reset-sessions`          | Wipe session history + streak                      |
| POST   | `/api/admin/wipe-index`              | Delete embed/search index (files kept)             |

All danger-zone calls **must** require a confirm modal in the UI (currently
just buttons — add the confirm step when wiring).

### Command palette
| Method | Path                                 | Purpose                                            |
|--------|--------------------------------------|----------------------------------------------------|
| GET    | `/api/search?q=&kinds=` | Unified search for notes + commands + areas | currently static list in app.jsx (`CommandPalette`) |

---

## 7. Where each mock constant lives

When you wire a screen, search-replace these constants with `useQuery(...)` /
your store equivalent. Each one's shape matches the types in §3.

| Constant                  | File              | Shape                       | Endpoint                            |
|---------------------------|-------------------|-----------------------------|-------------------------------------|
| `MOCK_HEALTH`             | `shared.jsx`      | `Health`                    | `GET /api/health`                   |
| `MOCK_VAULT_STATS`        | `shared.jsx`      | `{total, promotedToday, promotedWeek, lintWarnings, lintBroken, streakDays}` | `GET /api/vault/stats` |
| `MOCK_AREA_COVERAGE`      | `shared.jsx`      | `AreaCoverage[]`            | `GET /api/areas/coverage`           |
| `MOCK_RECENT_PROMOTED`    | `shared.jsx`      | promoted-note rows          | `GET /api/vault/recent-promoted`    |
| `MOCK_TODAY_FOCUS`        | `shared.jsx`      | focus rows                  | `GET /api/vault/today-focus`        |
| `MOCK_SESSION`            | `shared.jsx`      | `Session`                   | `GET /api/session/current`          |
| `MOCK_STUDY_THREAD`       | `shared.jsx`      | one-thread fixture          | derived from SSE                    |
| `MOCK_PROMOTE_PROPOSAL`   | `shared.jsx`      | `PromoteProposal`           | `POST /api/study/promote-proposal`  |
| `VAULT_NOTES`             | `vault.jsx`       | `VaultNote[]`               | `GET /api/vault/notes`              |
| `GRAPH_NODES`, `GRAPH_EDGES` | `graph.jsx`    | nodes + edges               | `GET /api/graph`                    |
| `FLASHCARD_DECK`          | `flashcards.jsx`  | `Flashcard[]`               | `GET /api/flashcards/due`           |
| `ROADMAP_MILESTONES`      | `roadmap.jsx`     | `Milestone[]`               | `GET /api/roadmap`                  |
| `INITIAL_QUEUE`           | `ingest.jsx`      | `IngestItem[]`              | `GET /api/ingest/queue`             |
| `DEFAULT_BACKENDS`        | `profile.jsx`     | `BackendConfig[]`           | `GET /api/config`                   |

---

## 8. Streaming UI behavior (what the front end does)

### Study answer streaming
1. User submits in input box → POST `/api/study/query`.
2. UI shows skeleton with a small avatar + "RETRIEVED · …" label.
3. Source chips animate in one at a time as `{type:"sources"}` lands.
4. As `chunk` events arrive, the answer text grows; a blinking cursor sits at
   the tail until `done`.
5. On `vault_gap`, a yellow banner mounts under the chip row with a "Create
   stub" button.
6. On `notice` (fallback), a dismissible amber banner mounts at the top of the
   center pane.
7. After `done`, the per-answer **Promote** button appears (top-right of the
   answer block).

### Ingest pipeline
- Polled or SSE. The UI ticks each `IngestItem.progress` and transitions
  `extracting → chunking → compiling → embedding → done`. Match these state
  ids exactly.
- Backend should emit at ≥ 1 Hz so the bars look alive.

### Compiler ops
- POST kicks off a job, returns `{ jobId }`.
- UI opens SSE on `/api/jobs/:jobId` and displays a progress bar + last 5 log
  lines (rolling).

---

## 9. Persistence the UI does NOT do (yet)

These all live in React state only — clear on refresh. When wiring backend,
decide which should be server-owned vs. localStorage:

- Tweaks like collapse/expand of Study side panels
- Reveal state in Flashcards (server should hold the queue, UI holds reveal)
- The promote-modal markdown edits before Confirm
- API key reveal-eye state (don't persist)
- Last viewed tab (consider `localStorage` for nice-to-have)

---

## 10. Keyboard shortcuts (front-end-owned, listed for parity)

| Shortcut | Action                          |
|----------|---------------------------------|
| ⌘K       | Open command palette            |
| ⌘1–⌘8    | Jump to tab N                   |
| ⌘G       | Knowledge graph                 |
| ⌘R       | Flashcards                      |
| ⌘↑       | Open promote modal              |
| ⌘⇧P      | Open promote modal              |
| ⌘⇧C      | Compile session                 |
| Space/⏎  | Reveal flashcard answer         |
| 1/2/3/4  | Rate (Again/Hard/Good/Easy)     |
| Esc      | Close any modal                 |

---

## 11. Wiring guide (recommended order)

1. **Health + stats** — `MOCK_HEALTH`, `MOCK_VAULT_STATS`. Trivial GETs, drive
   top bar.
2. **Vault list** — `VAULT_NOTES`. Single endpoint, query-string filters.
   Unlocks Vault tab + page preview.
3. **Study SSE** — biggest piece. Wire `/api/study/query`. Front-end already
   has the consumer logic; just emit the 5 event types.
4. **Promote** — `/api/study/promote-proposal` + `/api/study/promote`. Use the
   `PromoteProposal` shape verbatim.
5. **Graph** — replace mock nodes/edges. The force-layout is client-side and
   deterministic; just give it real data.
6. **Flashcards** — `due` + `rate`. SM-2 or FSRS, doesn't matter — UI just
   shows ease and the four buttons.
7. **Ingest** — multipart upload + queue stream.
8. **Profile** — config + probe + compiler ops. Probe is the spiciest because
   it must actually hit each provider's `/models` or similar.
9. **Roadmap** — fully read-only for now; write endpoints can come later.

---

## 12. Conventions to follow

- **All paths in `page` fields are vault-relative POSIX**, no leading slash.
  e.g. `messaging/kafka-exactly-once.md`.
- **Area ids are lowercase-kebab**, exactly the 14 in §4.
- **Status values are lowercase**: `stub | draft | mature | comprehensive`.
- **Confidence/scores are 0..1 floats**, not 0..100. UI multiplies for display.
- **Timestamps**: ISO 8601 from backend, UI formats. The mock currently uses
  human strings (`"4m ago"`, `"2d"`); when you go ISO, swap the formatter in
  `vault.jsx`/`shared.jsx`.
- **API key handling**: backend returns masked (`sk-ant-…f2a`), accepts raw on
  PUT, never returns the raw key after save. The UI's reveal toggle is local
  only and toggles the input `type` between `password`/`text`.
- **No emoji** in any backend strings — design system avoids them.

---

## 13. Things the UI mocks but should be real before launch

- **Probe-all results**: currently random latencies. Real implementation should
  hit each provider's lightweight endpoint (Anthropic `/v1/messages` with a
  1-token completion is the cheapest probe; OpenAI `/v1/models`; etc.)
- **Vault gap detection**: the yellow banner under Study answers. Logic
  required: enumerate retrieved sources, find concepts mentioned in ≥ N sources
  but never as the primary topic of any note → flag.
- **Promote proposal generation**: a separate LLM call with a structured-output
  prompt that produces `PromoteProposal`. The reasoning shown in the modal is
  literally the `reason` field.
- **Conflict detection**: when generating a proposal, run a secondary
  retrieval pass for contradictions and populate `conflicts_with[]` + a human
  `conflict_description`.
- **Session compile**: distill all queries + answers in the session into one
  master note; suggested behavior is a CREATE proposal with `wikilinks` to
  every page retrieved this session.

---

## 14. Open questions for backend session

1. **Auth.** Single user = no auth, or local API key for the daemon? UI
   assumes "trusted localhost"; if you add auth, surface it in `/api/health`
   so the UI can route to a setup screen on 401.
2. **Vault file watcher.** If the user edits a `.md` outside the app, the UI
   currently won't know. Should backend emit a `vault.changed` SSE on
   `/api/events`?
3. **Embedding model choice.** Profile has a "Re-embed everything" button but
   no picker. Add a `defaults.embeddingModel` field once you pick a default.
4. **Cost tracking.** Costs displayed in Profile are static. A
   `GET /api/cost/today` returning `{ inputTok, outputTok, dollars }` per
   backend would let the dashboard surface real spend.
5. **Multi-vault.** Out of scope for now but the path everywhere is
   `vault-relative`; nothing prevents introducing a vault id later.

---

**Last note for the backend agent:** if you find yourself wanting to change
the shape of `SourceChip`, `PromoteProposal`, `Health`, or the 14 area ids —
**come back here first**. Those are the spine. Everything else is negotiable.

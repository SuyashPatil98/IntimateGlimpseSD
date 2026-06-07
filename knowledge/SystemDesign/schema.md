---
type: operating-manual
status: canonical
version: 0.1
last_reviewed: 2026-06-02
---

# Schema — System Design Knowledge Base

This document is the **operating manual** for the wiki. It defines structure, conventions, and the three operations (Ingest / Query / Lint). When in doubt, this is the rule. Edit it deliberately — every page inherits from these conventions.

## 1. Three Layers

1. **`raw/`** — Source documents (PDFs, extracted text, paper notes). Immutable. Ground truth for facts.
2. **The wiki** — Every other markdown file in this vault. Actively maintained. The canonical knowledge store. **The wiki *is* the knowledge base; it is not a rendering of something else.**
3. **`schema.md`** (this file) — Configuration.

## 2. Folder Structure

The wiki is organized by **concept area**, never by source, book, or author. Fourteen areas:

| Folder | Scope |
|---|---|
| `distributed-systems/` | consensus, replication, partitioning, CAP, consistency models, failure detection, clocks |
| `databases/` | SQL/NoSQL fundamentals, transactions, indexes, storage engines (B-tree, LSM), MVCC, query execution |
| `networking/` | TCP, HTTP, DNS, TLS, load balancing, CDNs, protocols |
| `storage/` | file systems, object/block storage, durability, encoding formats |
| `messaging/` | queues, pub/sub, streams, event-driven architectures, delivery guarantees |
| `caching/` | strategies, eviction policies, coherence, CDN caching |
| `reliability/` | SLO/SLI/SLA, incident response, chaos engineering, observability, on-call |
| `architecture-patterns/` | microservices, SOA, monolith, event-driven, hexagonal, CQRS, saga |
| `design-patterns/` | GoF patterns, SOLID, dependency injection |
| `software-engineering/` | testing, CI/CD, refactoring, code review, team practices |
| `data-engineering/` | ETL/ELT, warehouses, lakes, batch vs stream, schema evolution |
| `ml-systems/` | feature stores, training pipelines, model serving, ML observability |
| `system-design-interview/` | interview methodology, common design problems, reference material (latency numbers, powers of 2) |
| `case-studies/` | end-to-end analyses of real-world systems (Kafka, Cassandra, Spanner, GFS, etc.) |

If a concept doesn't obviously belong to one area, pick the **primary** one and use `[[wikilinks]]` to connect from related areas. **Don't add new top-level areas without updating this file first.**

## 3. Page Template

Every concept page follows this template. Sections marked **(required)** must exist from day one. Other sections grow over multiple ingests — pages evolve `stub → draft → mature → comprehensive`.

````markdown
---
title: <Concept Name>
area: <one of the 12 areas>
status: stub | draft | mature | comprehensive
difficulty: beginner | intermediate | advanced | staff
prerequisites: ["[[Concept A]]", "[[Concept B]]"]
related: ["[[Concept C]]", "[[Concept D]]"]
builds_toward: ["[[Concept E]]"]
sources:
  - DDIA, Ch. 5, pp. 151–197
  - SDI vol 1, Ch. 6
tags: [distributed-systems, replication]
created: YYYY-MM-DD
last_reviewed: YYYY-MM-DD
---

# <Concept Name>

## Executive Summary (required)
2–4 sentences. The whole concept compressed.

## Why This Exists (required)
The engineering problem this solves.

## Core Intuition (required)
Plain-language explanation. Analogies welcome.

## Formal Definition
Precise technical definition.

## Mental Models
Frames for thinking about it.

## Internal Mechanics
Step-by-step how it works.

## Architecture Diagrams
ASCII diagrams in fenced code blocks.

## Mathematical Foundations
Equations in `$$...$$`. Every variable explained. Omit if N/A.

## Design Tradeoffs (required for draft+)
Benefits. Costs. Failure modes. Hidden complexity.

## Real Production Examples
Specific systems at Google / Amazon / Netflix / Uber / Meta / LinkedIn / Airbnb / Stripe / Databricks.

## Interview Perspective
Common questions, model answers, common mistakes, senior-level discussion points.

## Related Concepts (required)
For each link, one sentence on why it matters. Always `[[wikilinks]]`.

## Misconceptions
Most common mistakes.

## Failure Scenarios
How systems break. Why. Mitigations.

## Practical Engineering Heuristics
Industry rules of thumb.

## Advanced Topics
Pointers to deeper concepts.

## Active Recall Questions (required)
10–20 questions in Spaced Repetition plugin syntax (see §5).

## Feynman Test
Open-ended prompts that verify true understanding.

## Mastery Checklist
The reader should be able to: explain / compare / derive / critique / design.
````

### Status definitions (machine-checkable)

| Status | Required sections |
|---|---|
| **stub** | Executive Summary, Core Intuition, Related Concepts, ≥5 Active Recall Questions, valid frontmatter |
| **draft** | + Why This Exists, Internal Mechanics, Design Tradeoffs |
| **mature** | + Real Production Examples, Misconceptions, Failure Scenarios, Interview Perspective |
| **comprehensive** | All applicable sections complete. Mathematical Foundations included iff math applies. |

Lint enforces status realism — a page marked `mature` that's missing required sections gets downgraded.

## 4. Frontmatter Schema (machine-readable layer)

Consumed by the course web app and by the lint operation. **All fields required** unless marked optional.

| Field | Type | Notes |
|---|---|---|
| `title` | string | Display name (matches `# <H1>`) |
| `area` | enum | One of the 12 areas |
| `status` | enum | `stub` / `draft` / `mature` / `comprehensive` |
| `difficulty` | enum | `beginner` / `intermediate` / `advanced` / `staff` |
| `prerequisites` | list[wikilink] | Concepts that must be understood first |
| `related` | list[wikilink] | Sibling concepts |
| `builds_toward` | list[wikilink] | Concepts this unlocks |
| `sources` | list[string] | Free text but consistent format: `<Source Short Name>, Ch. N, pp. X–Y` |
| `tags` | list[string] | Hashtag-style classifiers |
| `created` | date | YYYY-MM-DD |
| `last_reviewed` | date | YYYY-MM-DD |
| `deprecated` | bool (optional) | If `true`, render a banner |
| `supersedes` | list[wikilink] (optional) | Used when merging |

`prerequisites` + `builds_toward` together form a DAG. Cycles are illegal — lint detects them.

## 5. Linking & Citation Conventions

- **Between wiki pages: always `[[wikilinks]]`.** Never markdown links. Non-negotiable — the graph view, lint, and the course app all depend on it.
- **Citations to sources:** inline footnote-style — `[^DDIA-p187]` with the footnote at the bottom of the page:
  `[^DDIA-p187]: Designing Data-Intensive Applications, Kleppmann, p. 187.`
  Reuse the same footnote id when citing the same source multiple times in one page.
- **External web references:** standard markdown `[text](url)`, collected in a `## References` section at the page bottom.

### Active Recall Question format

Use the **Obsidian Spaced Repetition plugin** syntax. Two acceptable forms:

Single-line:
```
What does CAP stand for?::Consistency, Availability, Partition tolerance.
```

Multi-line (for longer answers):
```
What guarantee does linearizability provide?
?
Every operation appears to take effect atomically at some point between its invocation and its completion, and once a read returns a value, all subsequent reads return that value or a newer one.
```

The course app parses these for quiz mode. **Strict adherence required.**

## 6. Operations

### 6.1 Ingest

**Trigger:** New source material to absorb (chapter, paper, transcript, your own notes).

**Steps:**
1. **Identify concepts.** From the source, enumerate every distinct concept worth a page. Aim for atomicity: "Quorum Reads" is a page; "Quorum reads on Tuesdays in Cassandra 3.7" is not.
2. **For each concept:**
   - **Page exists** → open it, integrate new info (don't replace what's there unless wrong), add a source citation, refine sections. If the new info crosses a status threshold, update `status`. Update `last_reviewed`.
   - **Page doesn't exist** → create as a `stub` using the template. Required sections only — pages mature over multiple ingests.
3. **Update `index.md`** — add new pages under the right area.
4. **Wire cross-references.** Every `[[wikilink]]` added should target either an existing page or a planned page. Unresolved links are seeds for future ingests (Obsidian renders them distinctly).
5. **Update `log.md`** — single entry: timestamp, source, pages created, pages updated, notes.
6. **Status pass.** Any page that crossed a threshold gets its status updated.

**Heuristics:**
- One ingest should touch ~10–15 pages. >25 pages means you're conflating concepts.
- Don't aim for `comprehensive` in one ingest. Pages mature over multiple passes.
- If two concepts feel like duplicates, merge them and log it.

### 6.2 Query

**Trigger:** A question is asked.

**Steps:**
1. Locate relevant pages via `[[wikilinks]]` and search.
2. Synthesize an answer drawing from the wiki first. If the wiki doesn't cover something, **say so explicitly** rather than inventing.
3. Cite — every non-trivial claim points to a wiki page or a source footnote.
4. **Promotion check:** Is this answer broadly useful (future-you or another engineer would ask this)? If yes:
   - If it warrants a new page → propose creating one
   - More commonly → propose adding to an existing page
5. Log the query and promotion outcome in `log.md`.

### 6.3 Lint

**Trigger:** Weekly, or after every 5 ingests, whichever comes first.

**Checks:**
1. **Broken wikilinks** — `[[Foo]]` where `Foo.md` doesn't exist. Actions: create stub, fix typo, or remove link.
2. **Orphans** — pages with no inbound links. Action: link from a parent or deprecate.
3. **Duplicates** — pages covering the same concept under different names. Action: merge, set `supersedes`.
4. **Contradictions** — claims that conflict across pages. Action: resolve to canonical version, update both.
5. **Stale pages** — `last_reviewed` > 180 days. Action: refresh.
6. **Frontmatter validity** — all required fields present and valid enum values.
7. **DAG check** — `prerequisites` chains form a DAG (no cycles).
8. **Status realism** — page status matches actual section coverage.

**Output:** report appended to `log.md` + actionable list.

## 7. Update Rules

- **Conflicting sources.** If two canonical sources describe the same concept differently (e.g., DDIA vs SE@Google), present both framings explicitly. Don't pretend one is canonical when the field has real variance. Note the disagreement in **Misconceptions**.
- **Human edits.** If you edit a page directly in Obsidian, the next ingest treats your edits as authoritative. The LLM should not overwrite human edits without strong reason; if necessary, log the override.
- **Deletion.** Pages are rarely deleted. Prefer merging or marking `deprecated: true` with a banner at the top of the body.

## 8. Course Web App Contract

The course app consumes this vault as **read-only data**. Its expectations:

- Every published page has valid frontmatter (§4).
- `prerequisites` + `builds_toward` form a DAG.
- Active Recall Questions follow §5 syntax — the app parses these for quiz mode.
- Pages with `status: mature` or `comprehensive` are course-ready. `stub` and `draft` are preview-only.
- The 12 areas map to course tracks.
- Learning paths (in `learning-path.md`, planned) override the default topological sort when present.

Breaking this contract requires updating both this schema *and* the app.

## 9. Versioning

This schema is versioned implicitly via git history. Major changes (new area, template change, frontmatter change) require a `log.md` entry justifying them and may require a wiki-wide lint pass to migrate existing pages.

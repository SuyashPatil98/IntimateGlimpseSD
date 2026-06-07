---
type: meta
status: canonical
last_reviewed: 2026-06-04
---

# Wiki — Start Here

> **You are reading the front door of a system-design knowledge base.** The vault itself **is** the knowledge — not a rendering of it, not a snapshot of a chat. Every page is canonical and meant to be read, edited, and linked to.

This vault follows the **Karpathy LLM Wiki pattern**: a human-curated markdown vault where an LLM performs three explicit operations (Ingest, Query, Lint) directly against the files. There is no hidden database. What you see in `*.md` is the system.

## What's in here

- **289 mature concept pages** across **14 areas** — distributed systems, databases, networking, storage, messaging, caching, reliability, architecture patterns, design patterns, software engineering, data engineering, ML systems, system-design interview, and case studies.
- Built across **50 ingests** from 9 canonical books (DDIA, SDI 1/2, SWE@Google, FoSA, Modern SE, Refactoring, Head First Design Patterns, Data Engineering Cookbook) plus foundational papers (Dynamo, Bigtable, Spanner, GFS, MapReduce, Raft, Paxos, Dapper, Kafka, RDD, Flink, Gorilla, RAG, and others).
- Every concept link is an Obsidian `[[wikilink]]`; the graph view shows the topology. Active recall questions are formatted for the **Obsidian Spaced Repetition** plugin.

## The four operational files

These are the meta-pages that drive the wiki. They are **excluded from the graph view** so the conceptual topology is legible.

| File | Role |
|---|---|
| [[schema]] | Operating manual: page template, frontmatter spec, linking conventions, the three operations. **Read this first if you'll edit or extend.** |
| [[index]] | Catalog of every concept page by area. Use this as a table of contents. |
| [[log]] | Chronological journal of every Ingest / Query / Lint operation. Append-only history. |
| [[source-map]] | Topic-to-source index — which book/paper covers which concept; also the ingestion campaign plan. |

(Plus `SESSION_STATE.md` for cross-session handoff and this `wiki.md`.)

## How to read the vault

### As a learner
1. Open [[index]] and pick an area that matches your goal.
2. Skim the page list; click any concept that's a `[[wikilink]]`.
3. Each page follows the same shape: **Executive Summary → Why This Exists → Core Intuition → Internal Mechanics → Design Tradeoffs → Real Production Examples → Misconceptions → Failure Scenarios → Interview Perspective → Related Concepts → Active Recall Questions**.
4. Hit related concepts via the wikilinks; the graph view shows neighborhoods.
5. Use Spaced Repetition: every page has 7–15 recall questions in plugin syntax — install the plugin and quiz yourself daily.

### As a builder (course-app or downstream tooling)
1. Read [[schema]] §4 (frontmatter spec) and §5 (linking conventions).
2. Parse the vault: every concept page has YAML frontmatter (`title`, `area`, `status`, `difficulty`, `prerequisites`, `related`, `sources`, `tags`, `created`, `last_reviewed`).
3. `prerequisites` + `builds_toward` form a DAG — topological sort gives a learning path.
4. `status` values: `stub` / `draft` / `mature` / `comprehensive`. `mature` + `comprehensive` are course-ready.
5. Active recall blocks (`Question::Answer` or `Question\n?\nAnswer`) are parseable for quiz mode.

### As an LLM operator (Ingest / Query / Lint)
1. Read [[schema]] §6 — the three operations are precisely specified there.
2. **Ingest**: new source → enumerate concepts → for each, create-or-extend a page → wire wikilinks → update [[index]] and [[log]].
3. **Query**: answer from the wiki first; cite pages/footnotes; propose new pages or page extensions when the answer reveals a gap; log the promotion.
4. **Lint**: every 5 ingests or weekly — broken wikilinks, orphans, duplicates, contradictions, stale `last_reviewed`, frontmatter validity, DAG cycles, status realism.

## Suggested reading paths

These are intentional sequences through the vault. Each is a directed walk that builds dependencies before payoffs.

### Distributed systems foundations
[[CAP Theorem]] → [[PACELC]] → [[Consistency Models]] → [[Linearizability]] → [[Eventual Consistency]] → [[Replication]] → [[Leader-Based Replication]] → [[Leaderless Replication]] → [[Quorums]] → [[Consensus]] → [[Paxos]] → [[Raft]]

### Database internals
[[Relational Databases]] → [[ACID]] → [[B-Trees]] → [[LSM-Trees]] → [[SSTables]] → [[WAL]] → [[Indexes]] → [[Transactions]] → [[Isolation Levels]] → [[MVCC]] → [[Snapshot Isolation]] → [[Serializable Snapshot Isolation]]

### Messaging and streaming
[[Message Queues]] → [[Pub-Sub]] → [[Delivery Guarantees]] → [[Kafka Architecture]] → [[Topics and Partitions]] → [[Consumer Groups]] → [[Event Sourcing]] → [[CDC]] → [[Stream Processing]] → [[Stream Windowing]] → [[Kappa Architecture]]

### Architecture & reliability
[[Monolith]] → [[Microservices]] → [[Hexagonal Architecture]] → [[Domain-Driven Design]] → [[Bounded Contexts]] → [[CQRS]] → [[Saga Pattern]] → [[SLO]] → [[Error Budgets]] → [[Observability]] → [[Circuit Breakers]] → [[Chaos Engineering]]

### Engineering excellence
[[First Principles of SE]] → [[Modularity]] → [[Information Hiding]] → [[Testing Pyramid]] → [[Test Doubles]] → [[CI-CD]] → [[Trunk-Based Development]] → [[Refactoring]] → [[Code Smells]] → [[Technical Debt]] → [[SOLID]]

### Data + ML systems
[[Batch Processing]] → [[MapReduce]] → [[Apache Spark]] → [[Stream Processing]] → [[Apache Flink]] → [[Data Warehouse]] → [[Data Lake]] → [[Lakehouse]] → [[Orchestration]] → [[Apache Airflow]] → [[Feature Stores]] → [[Training Pipelines]] → [[Model Serving]] → [[Model Monitoring]] → [[MLOps]]

### Interview track
[[4-Step Framework]] → [[Back-of-Envelope]] → [[Latency Numbers]] → [[Powers of 2]] → [[Design URL Shortener]] → [[Design Rate Limiter]] → [[Design Key-Value Store]] → [[Design News Feed]] → [[Design Chat System]] → [[Design YouTube]] → [[Design Payment System]] → [[Design Stock Exchange]]

### Case studies (real systems)
[[GFS]] → [[Bigtable]] → [[MapReduce (Google)]] → [[HDFS]] → [[Apache Kafka]] → [[Apache Spark]] → [[Apache Flink]] → [[Cassandra]] → [[DynamoDB]] → [[Spanner]] → [[Zookeeper]] → [[Chubby]] → [[Dapper]]

## Conventions in 30 seconds

- **One concept = one page.** "Quorum reads" is a page; "Quorum reads in Cassandra 3.7 on Tuesdays" is not.
- **Always `[[wikilink]]` between pages** — never markdown links. The graph, lint, and course app depend on it.
- **Citations** as inline footnotes `[^DDIA-p187]` with the footnote at the page bottom.
- **No new top-level folder** without updating [[schema]] §2.
- **Don't pretend a sole canonical view exists** when sources disagree — present both, note the disagreement in `Misconceptions`.
- **Human edits in Obsidian are authoritative.** The next LLM ingest won't overwrite them without strong reason.

## Status of the campaign

The 50-ingest build campaign is **complete** as of 2026-06-04. See [[log]] for the campaign-complete entry. Open work:

1. **Lint pass** — schema §6.3 across the whole vault (broken wikilinks, orphans, duplicates, stale pages, DAG cycles).
2. **Course-app data layer** — Python markdown-parser (≈50 lines, no LLM) emitting JSON: frontmatter, body, wikilinks, recall blocks per page.
3. **Optional Graphify pass** — index the vault for AI-assistant queries.

After that, the wiki shifts from build mode to **steady state**: ad-hoc Queries (with promotion to new pages when broadly useful), periodic Lints, and occasional targeted Ingests for new sources or domains.

## Pattern credits

This vault follows the **LLM Wiki pattern** popularized by Andrej Karpathy — the markdown vault is the knowledge base, and the LLM is a librarian that performs explicit operations against it (not a chat-context substitute for it). The framing of three operations (Ingest / Query / Lint) and the page-template discipline are this vault's specialization of that pattern for a multi-source technical domain.

— Last reviewed: 2026-06-04. 289 pages, 14 areas, 50 ingests.

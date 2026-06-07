---
title: MVCC
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]", "[[Isolation Levels]]"]
related: ["[[Snapshot Isolation]]", "[[Two-Phase Locking]]", "[[Isolation Levels]]"]
sources:
  - DDIA, Ch. 7
  - PostgreSQL docs
tags: [databases, transactions, concurrency]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# MVCC

## Executive Summary

**Multi-Version Concurrency Control (MVCC)** is the concurrency mechanism where the database keeps **multiple versions of each row**, allowing readers to see consistent snapshots without blocking writers, and vice versa. Implemented by **PostgreSQL, MySQL InnoDB, Oracle, SQL Server (snapshot mode), CockroachDB, FaunaDB**. The dominant alternative to [[Two-Phase Locking]]. Underlies [[Snapshot Isolation]] in most modern systems. Brings concurrency wins: readers never block writers and vice versa. Cost: garbage collection of old versions (Postgres's famous VACUUM).

## Why This Exists

In lock-based systems (2PL), readers block writers and writers block readers. High-concurrency workloads suffer. MVCC's insight: keep old versions of rows; readers use old versions; writers create new versions. Readers and writers don't block each other — only writers writing to the same row contend.

## Core Intuition

Like Git for database rows. Every write creates a new version. Readers ask for "the version that existed at time T." Old versions persist until no one needs them. Concurrent readers and writers don't block — they work on different versions.

## Internal Mechanics

**Row versioning:**
- Each row has multiple versions, tagged with transaction IDs (xmin, xmax in Postgres).
- xmin: which transaction created this version.
- xmax: which transaction deleted (or updated, creating a newer version) this row.

**Visibility check:**
- For each row version, compare its xmin/xmax against the reader's snapshot.
- Show only versions that were committed by the reader's snapshot start time and not yet deleted.

**Writes:**
- INSERT: create new row version with xmin = current_xid.
- UPDATE: mark old version with xmax; insert new version with xmin.
- DELETE: mark version with xmax.

**Garbage collection:**
- Postgres: VACUUM removes old versions no longer visible to any transaction.
- MySQL InnoDB: purge thread.
- Without GC, table size grows monotonically.

## Architecture Diagrams

```
Row history:
  version A: xmin=10, xmax=20, "Alice"
  version B: xmin=20, xmax=null, "Alicia"

Transaction T (snapshot time = 15):
  Sees version A ("Alice") — xmin ≤ 15 < xmax.

Transaction U (snapshot time = 25):
  Sees version B ("Alicia") — xmin ≤ 25 and xmax = null (alive).

T and U see different versions. Neither blocks the other.
```

## Design Tradeoffs

**Benefits:**
- **Readers don't block writers, writers don't block readers.**
- High concurrency.
- Foundation for [[Snapshot Isolation]].
- Time-travel queries (some systems).

**Costs:**
- **Bloat** — old versions consume space.
- GC overhead (VACUUM).
- Long transactions delay GC.
- Index bloat — old row versions still indexed.
- Tuple visibility check on every read.

## Real Production Examples

- **PostgreSQL** — heap-based MVCC; VACUUM essential.
- **MySQL InnoDB** — undo log + history; rollback segments.
- **Oracle** — undo log; classic MVCC.
- **SQL Server** — version store in tempdb (snapshot isolation mode).
- **CockroachDB, Spanner** — MVCC with HLC/TrueTime timestamps.

## Interview Perspective

**Common questions:**
- "What is MVCC?" → Concurrency control via multiple row versions; readers and writers don't block each other.
- "Why VACUUM in Postgres?" → Garbage-collect old MVCC versions.
- "MVCC vs locking?" → MVCC: better concurrency, bloat, GC overhead. Locking: lower memory, blocking.

**Senior-level:**
- MVCC + snapshot isolation = excellent concurrency for most workloads.
- Long transactions are MVCC's enemy — they prevent GC, leading to bloat.
- Postgres's VACUUM is a famously thorny operational topic — autovacuum tuning, transaction wraparound.

**Common mistakes:**
- Long-running transactions causing bloat.
- Not running VACUUM (or autovacuum) → table bloat.
- Ignoring xid wraparound in long-uptime Postgres.

## Related Concepts

- [[Snapshot Isolation]] — built on MVCC.
- [[Two-Phase Locking]] — alternative.
- [[Isolation Levels]] — implemented via MVCC in most modern DBs.

## Misconceptions

- **"MVCC eliminates contention."** Concurrent writes to same row still contend.
- **"MVCC = no locks."** Writes still take row-level locks; MVCC frees readers.
- **"VACUUM is optional."** Without it, Postgres dies (transaction wraparound, bloat).

## Failure Scenarios

- **Long transaction blocks VACUUM** → bloat grows.
- **Autovacuum tuned wrong** → bloat or write storms.
- **Transaction ID wraparound** in Postgres after 2 billion xids without VACUUM → catastrophic.

## Practical Engineering Heuristics

- **Tune autovacuum** for your workload.
- **Avoid long transactions** — they delay GC.
- **Monitor bloat** as an operational metric.
- **Use pg_repack** or similar to reclaim bloat without full table lock.

## Active Recall Questions

What is MVCC?::Multi-Version Concurrency Control. Database keeps multiple versions of each row; readers and writers don't block each other.

How does MVCC enable Snapshot Isolation?::Each transaction sees row versions committed before its snapshot start time. Different transactions see different snapshots without blocking.

Why does Postgres need VACUUM?::To garbage-collect old row versions left by MVCC. Without VACUUM, tables bloat and transaction IDs wrap around.

What's xmin and xmax?::Transaction IDs marking when a row version was created (xmin) and deleted (xmax) in Postgres.

MVCC vs 2PL?::MVCC: high concurrency via row versions, bloat overhead. 2PL: locks block readers/writers, lower memory, less concurrency.

Why are long transactions bad in MVCC?::They hold a snapshot; old row versions visible to them can't be garbage-collected. Bloat accumulates.

## Feynman Test

Walk through a concurrent UPDATE under MVCC. Why doesn't a concurrent SELECT block?

Why is Postgres transaction wraparound a real production concern, and how does VACUUM prevent it?

## Mastery Checklist

- **Explain** MVCC and row versioning.
- **Compare** with 2PL.
- **Derive** which transactions see which row versions.
- **Critique** systems running without proper VACUUM tuning.
- **Design** a high-concurrency app accounting for MVCC behavior.

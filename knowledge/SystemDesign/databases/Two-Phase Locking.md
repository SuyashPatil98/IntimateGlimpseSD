---
title: Two-Phase Locking
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]", "[[Isolation Levels]]"]
related: ["[[MVCC]]", "[[Serializability]]", "[[Isolation Levels]]"]
sources:
  - DDIA, Ch. 7 (pp. 257–261)
  - Gray & Reuter, 1992
tags: [databases, transactions, concurrency]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Two-Phase Locking

## Executive Summary

**Two-Phase Locking (2PL)** is a concurrency control protocol that guarantees [[Serializability]] by enforcing rules on lock acquisition: a transaction has a **growing phase** where it acquires locks and a **shrinking phase** where it releases them. Once any lock is released, no new lock may be acquired. Used in MySQL InnoDB (with MVCC) and many traditional databases. Provides strong correctness but at the cost of contention, deadlocks, and reduced concurrency vs MVCC. Different from [[Two-Phase Commit]] (similar name, different problem).

## Why This Exists

To prevent serializability anomalies, transactions must coordinate access to shared data. Locks are the classical mechanism. But naive locking doesn't guarantee serializability — you can construct schedules with locks released too early that produce non-serializable history. 2PL's discipline (acquire-then-release-once-only) is the simplest rule that ensures serializable schedules.

## Core Intuition

You're a chef in a shared kitchen. You can pick up any tool you need (growing phase). Once you put any tool back, you can't pick up another (shrinking phase). This prevents you from grabbing a tool, releasing it, doing something, then grabbing another — which could let another chef interleave in a way that violates correctness.

## Internal Mechanics

**Shared (S) locks:** for reads. Multiple transactions can hold S locks on the same item simultaneously.

**Exclusive (X) locks:** for writes. Only one transaction can hold an X lock; blocks readers and writers.

**Protocol:**
1. Transaction acquires locks as needed (growing phase).
2. At some point, releases its first lock.
3. From that point, only releases — no new acquisitions (shrinking phase).

**Strict 2PL (SS2PL):** holds all locks until commit/abort. Simpler; standard in production. Prevents cascading aborts.

**Lock granularity:** can be at row, page, or table level. Trade-off: finer = more concurrency but more lock memory; coarser = less concurrency but cheaper.

## Design Tradeoffs

**Benefits:**
- Guarantees serializability.
- Conceptually simple.
- Well-understood.

**Costs:**
- **Deadlocks** — two transactions wait for each other's locks; DB must detect and abort one.
- **Reduced concurrency** — readers block writers; writers block readers.
- **Contention bottlenecks** on hot rows.
- **Lock manager overhead.**

## Real Production Examples

- **MySQL InnoDB** — 2PL for writes; MVCC for reads (hybrid).
- **SQL Server (default mode)** — 2PL.
- **DB2** — 2PL classical.
- **Many embedded DBs** — 2PL because simpler than MVCC.

## Interview Perspective

**Common questions:**
- "What's 2PL?" → Acquire locks in growing phase, release in shrinking phase. Once you release, no new acquisitions.
- "Why does 2PL guarantee serializability?" → The two-phase rule prevents schedules where a transaction can interleave between releases.
- "2PL vs MVCC?" → 2PL: blocking, deadlocks, simpler. MVCC: non-blocking reads, bloat, more complex.

**Senior-level:**
- Strict 2PL is the production form — holding locks until commit prevents cascading aborts.
- Lock escalation (row → page → table) is a real concern; can amplify contention.
- Deadlock detection requires a wait-for graph and cycle detection. Cost is non-trivial.

**Common mistakes:**
- Forgetting deadlock retry logic.
- Lock starvation under write-heavy load.
- Choosing 2PL when MVCC would give better concurrency.

## Related Concepts

- [[Transactions]] · [[Isolation Levels]]
- [[Serializability]] — what 2PL provides.
- [[MVCC]] — the modern alternative.
- [[Two-Phase Commit]] — different protocol; similar name.

## Misconceptions

- **"2PL = 2PC."** Different. 2PL is concurrency control; 2PC is atomic commit.
- **"2PL is dead."** Used in MySQL, SQL Server. Still relevant.
- **"2PL gives full serializability."** Yes — the protocol's whole point.

## Failure Scenarios

- **Deadlock** — transactions wait in cycle; DB aborts one. Mitigation: retry logic.
- **Lock starvation** — long-held locks block many others.
- **Lock escalation** — row locks promoted to page/table; surprising contention.

## Practical Engineering Heuristics

- **Use short transactions** — locks held for less time.
- **Order lock acquisitions consistently** — avoids cyclic deadlocks.
- **Handle deadlock-abort exceptions** — retry the transaction.
- **For high-concurrency reads, use MVCC** — readers don't block.

## Active Recall Questions

What is Two-Phase Locking?::Concurrency control protocol with growing phase (acquire locks) and shrinking phase (release locks). Once any lock is released, no new acquisitions.

What does 2PL guarantee?::Serializability. The two-phase rule prevents schedules that would produce non-serializable history.

S vs X locks?::Shared (S): for reads; multiple holders OK. Exclusive (X): for writes; one holder; blocks all others.

What's strict 2PL?::Holds all locks until commit/abort. Prevents cascading aborts. Standard in production.

What's the main 2PL failure mode?::Deadlock — two transactions wait for each other's locks. DB detects via wait-for graph cycle, aborts one.

2PL vs MVCC trade-off?::2PL: blocking, deadlocks, full serializability with locks. MVCC: non-blocking reads, bloat overhead, snapshot isolation by default.

## Feynman Test

Construct a deadlock scenario in 2PL. How does the DB detect and resolve it?

Why does releasing a lock early in 2PL (violating the two-phase rule) lose serializability?

## Mastery Checklist

- **Explain** 2PL and its phases.
- **Compare** with MVCC.
- **Derive** why 2PL guarantees serializability.
- **Critique** systems with naive locking (not 2PL).
- **Design** transactions with consistent lock ordering to avoid deadlocks.

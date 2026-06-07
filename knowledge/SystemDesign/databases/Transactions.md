---
title: Transactions
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[ACID]]"]
related: ["[[ACID]]", "[[Isolation Levels]]", "[[MVCC]]", "[[Two-Phase Locking]]", "[[Distributed Transactions]]"]
builds_toward: ["[[Isolation Levels]]", "[[MVCC]]"]
sources:
  - DDIA, Ch. 7 (pp. 221–266)
  - Gray & Reuter, 1992
tags: [databases, transactions, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Transactions

## Executive Summary

A **transaction** is a sequence of database operations treated as a **single logical unit**: either all succeed (commit) or none take effect (abort). Provides [[ACID]] guarantees. Originated in 1970s database research (Gray, Reuter); now expected behavior of any serious database. The abstraction lets applications reason locally — "this multi-step update either happens or doesn't" — without worrying about partial failures, concurrent interference, or crashes. The implementation depends on isolation level, concurrency control mechanism ([[MVCC]] or locking), and durability strategy ([[WAL]]).

## Why This Exists

Without transactions, multi-step database operations produce inconsistent intermediate states under crashes or concurrent access. A bank transfer might debit one account without crediting the other. A user signup might write to user table but fail before adding role. Transactions package related operations into atomic units, letting applications ignore the messy details of failure handling and concurrency.

## Core Intuition

A transaction is a sealed envelope around operations. While inside, others can't see your work. At commit, everything inside becomes visible simultaneously. At abort, nothing inside happens. The complexity is hidden behind BEGIN, COMMIT, ROLLBACK.

## Internal Mechanics

**Transaction lifecycle:**
1. `BEGIN` — start transaction. Snapshot taken (in MVCC) or lock acquisition starts (in 2PL).
2. Application issues SQL statements.
3. `COMMIT` — make changes durable and visible.
4. `ROLLBACK` — undo all changes.

**Implementation:**
- **WAL** records intent for atomicity + durability.
- **Concurrency control** (locking or MVCC) enforces isolation.
- **Constraint checking** enforces application-defined consistency.

**Concurrent execution:**
- Many transactions may execute simultaneously.
- The DB must ensure their effects appear as if some serial ordering happened (the strength of which depends on [[Isolation Levels]]).

## Common Patterns

**Read-modify-write race:**
- T1 reads X=100.
- T2 reads X=100.
- T1 writes X=110.
- T2 writes X=105 (based on stale read).
- T1's update lost.

Solutions: SELECT FOR UPDATE (lock), atomic operations (UPDATE X = X + ...), serializable isolation, optimistic concurrency.

**Write skew:**
- T1 reads Y, writes X based on Y.
- T2 reads Y, writes X based on Y.
- Both saw consistent Y; both wrote X violating some invariant.

Solutions: serializable isolation, materialize conflicts.

## Real Production Examples

- **PostgreSQL** — MVCC; default isolation is read committed.
- **MySQL InnoDB** — 2PL + MVCC; default isolation is repeatable read.
- **Oracle, SQL Server** — both supported.
- **MongoDB** — single-doc ACID; multi-doc since 4.0.
- **Distributed (Spanner, CockroachDB)** — distributed serializable transactions.

## Interview Perspective

**Common questions:**
- "What's a transaction?" → Atomic unit of work satisfying ACID.
- "What's the default isolation in Postgres?" → Read committed.
- "What's the strongest isolation?" → Serializable.

**Senior-level:**
- Default isolation levels are often weaker than serializable. Many applications quietly have race conditions.
- "Read your writes" within a transaction is always guaranteed — that's the easy part.
- The hard part is correct behavior across concurrent transactions. Isolation level choice matters.

**Common mistakes:**
- Assuming default isolation is serializable (usually isn't).
- Long-running transactions hold locks/snapshots → contention.
- Catching and ignoring rollback exceptions.

## Related Concepts

- [[ACID]] — what transactions provide.
- [[Isolation Levels]] — strength of concurrency control.
- [[MVCC]] · [[Two-Phase Locking]] — implementation mechanisms.
- [[Serializability]] — strongest correctness.
- [[Distributed Transactions]] — transactions across nodes.

## Misconceptions

- **"Transactions are slow."** Modern DBs handle huge volumes; only become slow on contention or long transactions.
- **"Default isolation prevents all races."** Often it doesn't (read committed allows many anomalies).
- **"ROLLBACK is free."** Costs work and time; some changes have side effects (sequences, etc.).

## Failure Scenarios

- **Long-running transaction** holds snapshot → bloat in MVCC.
- **Deadlock** under 2PL.
- **Phantom reads, write skew, lost updates** under weak isolation.
- **Transaction aborted under pressure** — application must retry.

## Practical Engineering Heuristics

- **Keep transactions short.** Long ones cause contention and bloat.
- **Know your isolation level.** Don't trust defaults.
- **Use serializable** when correctness across transactions matters.
- **Always handle the abort path.** Retry logic is essential under serializable.

## Active Recall Questions

What's a transaction?::Atomic unit of database operations. Either all commit or all roll back.

What does a transaction guarantee?::ACID — Atomicity, Consistency (application-defined invariants), Isolation, Durability.

What's the default isolation in Postgres?::Read committed.

What's the read-modify-write race?::Two transactions read the same value, modify it, both write — one update is silently lost.

What's write skew?::Both transactions see consistent state, both write, but the combined writes violate an invariant.

Why keep transactions short?::Long transactions hold locks (2PL) or snapshots (MVCC), causing contention and bloat.

## Feynman Test

Walk through a bank transfer transaction. Where does each ACID property matter?

Why is "read committed" insufficient for some correctness requirements?

## Mastery Checklist

- **Explain** transactions and ACID.
- **Compare** isolation levels.
- **Derive** which anomalies a given isolation prevents.
- **Critique** systems trusting default isolation without analysis.
- **Design** a workflow with proper transaction boundaries and retry logic.

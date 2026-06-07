---
title: ACID
area: databases
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Transactions]]", "[[BASE]]", "[[Isolation Levels]]", "[[MVCC]]"]
builds_toward: ["[[Transactions]]", "[[Isolation Levels]]"]
sources:
  - DDIA, Ch. 7 (pp. 222–232)
  - SDI vol 1, Ch. 3
  - Gray & Reuter, 1992
tags: [databases, transactions, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# ACID

## Executive Summary

ACID is the **four properties classical database transactions provide**: **Atomicity** (all-or-nothing), **Consistency** (invariants preserved), **Isolation** (concurrent transactions don't interfere), **Durability** (committed data survives crashes). Coined by Gray & Reuter in the late 1970s. It's the gold standard for transactional databases — but each letter has subtle definitions and real systems implement weaker versions for performance. ACID's main rival framing is [[BASE]] (Basically Available, Soft state, Eventual consistency), used to characterize many NoSQL systems.

## Why This Exists

Without transactions, multi-step database operations produce inconsistent intermediate states under crashes or concurrent access. A bank transfer might debit one account without crediting the other. ACID formalizes what a transaction guarantees, giving applications a reliable abstraction. Every modern RDBMS provides ACID; many NoSQL systems provide a subset.

## Core Intuition

A transaction is a sealed envelope. Either all the operations inside complete and become visible together (commit), or none of them do (abort). While inside the envelope, other observers can't see the half-finished work. Once the envelope is "delivered" (committed), the changes are permanent.

## The Four Properties

**Atomicity:**
- Transaction is all-or-nothing.
- Either every operation succeeds, or none take effect.
- On abort/crash, partial work is rolled back.
- Implementation: WAL (write-ahead log) records intent; on recovery, redo committed transactions or undo aborted ones.

**Consistency:**
- The application's invariants are preserved.
- Foreign keys, uniqueness, NOT NULL constraints upheld.
- Note: this is *application-defined* consistency. The DB enforces invariants you've declared; it can't know what you mean by "consistent" in business terms.
- (Not the same as CAP's C — different concept entirely.)

**Isolation:**
- Concurrent transactions don't interfere.
- Strongest form: serializability — result is as if transactions ran one at a time.
- Real DBs offer weaker levels for performance: read uncommitted, read committed, repeatable read, snapshot isolation, serializable.
- See [[Isolation Levels]].

**Durability:**
- Committed data survives crashes (and ideally hardware failures).
- Implementation: writes are flushed to disk (or replicated to durable storage) before commit acknowledges.
- Strict durability requires fsync. Sync replication adds another durability layer.

## Internal Mechanics

**WAL (Write-Ahead Log):**
- Before applying changes to data files, log the intent.
- On crash recovery, replay log to redo committed, undo uncommitted.
- Provides atomicity + durability.

**Lock manager or MVCC:**
- Locking: 2PL ensures isolation.
- MVCC: multiple versions; readers see snapshot; writers don't block readers.

**Constraint checker:**
- Foreign keys, unique, check constraints enforced on each write.

## Design Tradeoffs

**Benefits:**
- Application reasoning becomes local — transactions hide concurrency.
- Strong correctness guarantees.
- Recovery is well-defined.

**Costs:**
- Coordination cost (locks, MVCC overhead).
- Latency (synchronous WAL flush for durability).
- Distributed ACID is *much* harder (see [[Distributed Transactions]]).
- Some workloads don't need it; pay the cost anyway in RDBMS.

## Real Production Examples

- **All major RDBMS** — PostgreSQL, MySQL InnoDB, Oracle, SQL Server. ACID by default.
- **MongoDB** — added multi-document ACID transactions in 4.0.
- **Spanner, CockroachDB, FaunaDB** — distributed ACID.
- **Many NoSQL** — provide ACID at single-document/single-row level but not across.

## Interview Perspective

**Common questions:**
- "Explain ACID." → Atomicity (all-or-nothing), Consistency (invariants), Isolation (no interference), Durability (survives crashes).
- "ACID vs BASE?" → ACID: strong, transactional, traditional RDBMS. BASE: eventually consistent, available, NoSQL. Two different design philosophies.
- "Is CAP's C the same as ACID's C?" → No. CAP's C is linearizability (replica agreement). ACID's C is invariant preservation.

**Senior-level:**
- ACID's C is a "freebie" — it's whatever your constraints say. The DB doesn't define consistency; you do.
- Many "ACID" systems offer weaker default isolation than serializable. Postgres defaults to read committed; you must opt into serializable.
- ACID at distributed scale is expensive — Spanner's TrueTime exists to make it tractable.

**Common mistakes:**
- Conflating CAP's C with ACID's C.
- Assuming default isolation is serializable (usually it isn't).
- Forgetting that durability requires fsync — async writes can lose data on crash.

## Related Concepts

- [[Transactions]] — the construct ACID describes.
- [[Isolation Levels]] — practical I in ACID.
- [[MVCC]] · [[Two-Phase Locking]] — mechanisms.
- [[BASE]] — the contrasting framing.
- [[Distributed Transactions]] — ACID across nodes.

## Misconceptions

- **"All four letters are equal."** No — they have different costs and trade-offs. Many systems weaken Isolation specifically.
- **"ACID and CAP's C are the same."** They're not.
- **"ACID prevents all bugs."** It prevents specific classes (concurrency, partial-write). Application logic bugs still apply.

## Failure Scenarios

- **Durability without fsync** — crash loses recent commits.
- **Weak isolation surprises** — read-committed allows non-repeatable reads.
- **Distributed ACID under partition** — slow or unavailable.

## Practical Engineering Heuristics

- **Use transactions for multi-step writes.**
- **Know your isolation level** — defaults vary.
- **Test durability** — yank power; verify no data loss.
- **For distributed: use a distributed SQL DB** rather than rolling your own ACID.

## Active Recall Questions

What does ACID stand for?::Atomicity, Consistency, Isolation, Durability.

Explain Atomicity.::All operations in a transaction succeed together, or none take effect. Implementation: WAL with rollback on abort.

Explain Consistency in ACID.::Application-defined invariants are preserved (constraints, foreign keys, uniqueness). Not the same as CAP's C.

What's the strongest isolation level?::Serializable — result equivalent to some serial execution. Weaker levels (read committed, repeatable read, snapshot) trade isolation for performance.

How is Durability achieved?::Writes flushed to durable storage before commit acknowledges. WAL + fsync. Replication adds another layer.

Difference between ACID's C and CAP's C?::ACID's C: invariant preservation within a transaction. CAP's C: linearizability (replica agreement on operation order). Different concepts.

## Feynman Test

Walk through a money transfer using ACID. Where does each letter help?

Why is ACID at distributed scale fundamentally hard? What does Spanner do about it?

## Mastery Checklist

- **Explain** each of the four ACID properties.
- **Compare** ACID and BASE.
- **Derive** isolation level for a given workload.
- **Critique** systems claiming ACID without specifying isolation level.
- **Design** a transactional flow that depends on each ACID property.

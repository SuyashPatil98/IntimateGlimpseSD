---
title: Isolation Levels
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]"]
related: ["[[Transactions]]", "[[Snapshot Isolation]]", "[[Serializability]]", "[[MVCC]]"]
builds_toward: ["[[Snapshot Isolation]]", "[[Serializability]]"]
sources:
  - DDIA, Ch. 7 (pp. 233–266)
  - SQL standard, Berenson et al. 1995
tags: [databases, transactions, isolation]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Isolation Levels

## Executive Summary

**Isolation levels** define how strictly the database prevents concurrent transactions from interfering with each other. The SQL standard defines four: **Read Uncommitted, Read Committed, Repeatable Read, Serializable** — progressively stronger, progressively more expensive. Real databases offer additional levels like **Snapshot Isolation** (MVCC-based). Default isolation varies: Postgres uses Read Committed; MySQL InnoDB uses Repeatable Read. Choosing the wrong level → silent data corruption under contention. Choosing too strong → contention bottleneck. The art is matching isolation to actual correctness needs.

## Why This Exists

Strict serializability is expensive — every transaction effectively runs alone. Most workloads tolerate weaker guarantees for higher throughput. The SQL standard codified four levels so applications could opt into the right strength. Modern databases implement these (sometimes with their own names) plus extensions like snapshot isolation.

## Core Intuition

Imagine many cooks in a kitchen. Read Uncommitted: anyone can see anyone's half-finished dish. Read Committed: only see finished dishes. Repeatable Read: once you see a dish, it stays the same color in your view. Serializable: each cook works alone in their own kitchen.

Higher isolation = less interference = more coordination cost.

## The Four Standard Levels

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| Read Uncommitted | Allowed | Allowed | Allowed |
| Read Committed | **No** | Allowed | Allowed |
| Repeatable Read | **No** | **No** | Allowed |
| Serializable | **No** | **No** | **No** |

**Read phenomena:**

- **Dirty read:** see another transaction's uncommitted writes.
- **Non-repeatable read:** read same row twice, see different values (because of another transaction's commit between).
- **Phantom read:** read a query (range) twice, see different rows (because of another transaction's insert).

## Extended Levels

**Snapshot Isolation (SI):**
- Each transaction sees a consistent snapshot of the database from when it started.
- No dirty reads, no non-repeatable reads, no phantoms.
- Allows **write skew** (transactions independently update based on shared read; together violate invariant).
- Most "Repeatable Read" implementations are actually SI.

**Serializable Snapshot Isolation (SSI):**
- SI + detection of write-skew-style anomalies via tracking read/write conflicts.
- Used by Postgres serializable mode.

## Anomalies by Level

**Read Committed:** prevents dirty reads but allows:
- Non-repeatable read.
- Lost update (read-modify-write race).
- Phantom reads.
- Write skew.

**Repeatable Read / Snapshot Isolation:** also prevents:
- Non-repeatable reads.
- Some phantom anomalies.
- Lost update (in some implementations).
Allows:
- Write skew.

**Serializable:** prevents all anomalies. Behaves as if transactions ran one at a time.

## Real Production Examples

- **PostgreSQL:** Read Committed (default), Repeatable Read (= SI), Serializable (= SSI).
- **MySQL InnoDB:** Repeatable Read default; Read Committed and Serializable supported.
- **Oracle:** Read Committed default; supports Serializable.
- **SQL Server:** Read Committed default; supports Snapshot Isolation, Serializable.
- **CockroachDB:** Serializable by default.

## Interview Perspective

**Common questions:**
- "Explain isolation levels." → Four standard levels preventing increasing sets of anomalies.
- "Why isn't Serializable default?" → Performance. Most workloads tolerate weaker.
- "What's snapshot isolation?" → Non-standard but widely implemented; each transaction sees consistent snapshot; prevents most anomalies except write skew.

**Senior-level:**
- The SQL standard's definitions are interpreted differently across vendors. "Repeatable Read" in Postgres is SI; in MySQL it's something else; in Oracle it's not directly available.
- Write skew under SI is the canonical anomaly. Many real production bugs trace here.
- Postgres's SSI (serializable mode) is one of the cleanest implementations — adds anomaly detection on top of SI.

**Common mistakes:**
- Assuming Repeatable Read means the SQL standard says it does (vendor-specific).
- Default isolation feels fine until contention reveals write skew.
- Choosing Serializable for everything → contention bottleneck.

## Related Concepts

- [[Transactions]] — what isolation applies to.
- [[Snapshot Isolation]] · [[MVCC]] — common implementations.
- [[Serializability]] — strongest guarantee.
- [[Two-Phase Locking]] · [[Serializable Snapshot Isolation]] — mechanisms.

## Misconceptions

- **"Repeatable Read means SQL standard."** Vendors interpret differently.
- **"Serializable is too slow."** Postgres's SSI is often fast enough.
- **"Default isolation is fine."** Often allows anomalies users don't expect.

## Failure Scenarios

- **Write skew under SI** → silent invariant violation.
- **Lost update under Read Committed** → updates silently dropped.
- **Phantom under RR** (depending on vendor) → range queries miss new rows.

## Practical Engineering Heuristics

- **Know your vendor's isolation semantics** — they differ.
- **Default to SI for most apps.** Better than Read Committed; cheaper than Serializable.
- **Use Serializable** when correctness depends on cross-transaction invariants.
- **Test concurrency** explicitly — race conditions hide in dev.

## Active Recall Questions

Name the four SQL standard isolation levels.::Read Uncommitted, Read Committed, Repeatable Read, Serializable.

Name three read phenomena.::Dirty read, non-repeatable read, phantom read.

What's snapshot isolation?::Each transaction sees a consistent snapshot from its start. Prevents dirty/non-repeatable/phantom reads. Allows write skew.

What's write skew?::Two transactions read the same data, each makes an independent decision that's consistent given what they saw, but the combined writes violate an invariant.

Postgres default isolation?::Read Committed.

What's SSI?::Serializable Snapshot Isolation. SI plus runtime detection of conflicts that would produce non-serializable history. Postgres's serializable mode.

## Feynman Test

A doctor on-call system: only one doctor can be off at a time. Two doctors try to take leave simultaneously. Walk through what happens under different isolation levels.

Why is Postgres's "Repeatable Read" actually Snapshot Isolation rather than the SQL standard's definition?

## Mastery Checklist

- **Explain** the four standard isolation levels and read phenomena.
- **Compare** SI and Serializable.
- **Derive** which anomalies a level prevents.
- **Critique** systems trusting default Read Committed without analysis.
- **Design** an application with deliberate isolation level per workflow.

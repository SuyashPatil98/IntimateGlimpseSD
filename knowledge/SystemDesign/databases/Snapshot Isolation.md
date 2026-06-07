---
title: Snapshot Isolation
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]", "[[Isolation Levels]]"]
related: ["[[Isolation Levels]]", "[[MVCC]]", "[[Serializability]]", "[[Serializable Snapshot Isolation]]"]
sources:
  - DDIA, Ch. 7 (pp. 237–243)
  - Berenson et al., 1995
tags: [databases, transactions, isolation]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Snapshot Isolation

## Executive Summary

**Snapshot Isolation (SI)** is an isolation level where **each transaction sees a consistent snapshot of the database as of its start time**. Reads never see another transaction's in-flight or later-committed writes. Implemented via [[MVCC]] in PostgreSQL, MySQL InnoDB, Oracle, SQL Server. Provides most of what users expect from "Repeatable Read" without strict serializability cost. Famously allows **write skew** — its main known anomaly. Default isolation in many production databases (in name or substance).

## Why This Exists

Read Committed allows non-repeatable reads — a transaction can see different values across reads if another commits between. Serializable prevents everything but is expensive. SI strikes a balance: cheap snapshot read view + writes coordinated via MVCC or locking. Most applications get the consistency they need.

## Core Intuition

You start reading the database. A photo is taken. For the rest of your transaction, you see exactly what's in that photo — no matter what changes happen elsewhere. Your writes are applied at commit time, checked for conflicts. Other transactions take their own photos at their own start times.

## Internal Mechanics

**At transaction start:** record a snapshot timestamp.

**On read:** return the version of each row visible as of the snapshot timestamp.

**On write:** create a new version of the row tagged with this transaction.

**At commit:**
- **First-committer-wins** — if another transaction with a later snapshot has committed a write to the same row, abort.
- Or: detect via SSI extensions.

**Behind the scenes:** MVCC maintains multiple versions of each row. Old versions garbage-collected when no transaction needs them.

## Anomalies

**Prevented:**
- Dirty reads.
- Non-repeatable reads.
- Phantom reads (in most implementations).

**Allowed:**
- **Write skew.** Two transactions independently read a state, decide to write based on it, and commit — the combined effect violates an invariant.

**Example:** doctor on-call system. Invariant: at least one doctor always on call. T1 reads "2 doctors on call" and takes Alice off. T2 reads "2 doctors on call" and takes Bob off. Both commit; now nobody is on call. SI allows this.

## Real Production Examples

- **PostgreSQL Repeatable Read** = Snapshot Isolation.
- **MySQL InnoDB Repeatable Read** = SI-like (with gap locks).
- **Oracle Serializable** = SI (Oracle calls it Serializable but it's actually SI).
- **SQL Server Snapshot Isolation** = SI.
- **Most distributed SQL (Spanner, CockroachDB)** — variant of SI underneath.

## Design Tradeoffs

**Benefits:**
- Predictable reads — consistent view throughout transaction.
- Readers don't block writers; writers don't block readers.
- Cheaper than full serializable.
- Default in many systems.

**Costs:**
- **Write skew anomaly.**
- MVCC bloat — old versions consume space.
- Long transactions hold snapshots → prevent GC.

## Interview Perspective

**Common questions:**
- "What's snapshot isolation?" → Each transaction sees consistent snapshot from its start. MVCC implementation.
- "Is SI serializable?" → No — allows write skew.
- "Repeatable Read = SI?" → In Postgres yes; vendor-dependent.

**Senior-level:**
- SI is the right default for most apps. Write skew is rare and often acceptable.
- When write skew matters: upgrade to Serializable (SSI in Postgres).
- Oracle famously calls SI "Serializable" — confusing but historically entrenched.

**Common mistakes:**
- Assuming SI prevents all anomalies.
- Long transactions causing MVCC bloat.
- Treating Oracle's "Serializable" as truly serializable.

## Related Concepts

- [[Isolation Levels]] — SI sits between RC and Serializable.
- [[MVCC]] — the implementation mechanism.
- [[Serializable Snapshot Isolation]] — SI + write-skew detection.
- [[Serializability]] — strict alternative.

## Misconceptions

- **"SI is serializable."** No — allows write skew.
- **"Repeatable Read in standard SQL = SI."** No — standard RR allows non-repeatable reads' converse; SI is stronger.
- **"Oracle's Serializable = SQL Serializable."** No — Oracle implements SI.

## Failure Scenarios

- **Write skew** → invariant violated silently.
- **MVCC bloat** under long transactions.
- **Read versus current state confusion** — reading old snapshot may surprise.

## Practical Engineering Heuristics

- **Default to SI** in Postgres (Repeatable Read mode).
- **Use Serializable (SSI)** when invariants depend on cross-transaction read+write.
- **Avoid long-running transactions** under MVCC.
- **Test concurrent scenarios** explicitly.

## Active Recall Questions

What is Snapshot Isolation?::Each transaction sees a consistent snapshot of the database from its start time. Implemented via MVCC.

What anomaly does SI allow?::Write skew. Two transactions read consistent state, write independently, combined effect violates invariant.

What does SI prevent?::Dirty reads, non-repeatable reads, phantom reads (in most implementations).

Postgres Repeatable Read = ?::Snapshot Isolation.

Oracle Serializable = ?::Snapshot Isolation (Oracle's naming is confusing).

Why might SI bloat MVCC?::Long-running transactions hold a snapshot; old versions of rows can't be garbage-collected until that snapshot is released.

## Feynman Test

Construct a write-skew scenario with concrete invariant. Walk through what happens under SI.

Why is Oracle's "Serializable" not actually serializable?

## Mastery Checklist

- **Explain** snapshot isolation and write skew.
- **Compare** SI with Serializable and Read Committed.
- **Derive** appropriate isolation for given invariants.
- **Critique** Oracle's naming convention.
- **Design** applications that explicitly choose SI vs Serializable.

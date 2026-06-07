---
title: Serializability
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]", "[[Isolation Levels]]"]
related: ["[[Isolation Levels]]", "[[Snapshot Isolation]]", "[[Two-Phase Locking]]", "[[Serializable Snapshot Isolation]]", "[[Linearizability]]"]
sources:
  - DDIA, Ch. 7
  - Gray & Reuter, 1992
tags: [databases, transactions, serializability]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Serializability

## Executive Summary

**Serializability** is the strongest isolation property for transactions: the result of executing concurrent transactions is **equivalent to some serial (one-at-a-time) execution**. Eliminates all anomalies (dirty reads, non-repeatable reads, phantoms, write skew, lost updates). Implemented via [[Two-Phase Locking]] (classical) or [[Serializable Snapshot Isolation]] (modern). Often confused with [[Linearizability]] — serializability is a transaction property; linearizability is a single-object property. Both can be required; one doesn't imply the other.

## Why This Exists

Weaker isolation levels allow anomalies that can corrupt application invariants. Serializability removes all such anomalies by *definition*: if the result equals some serial execution, no concurrency-related anomaly can exist. The application can reason as if it were the only user of the database. The cost: contention and overhead. The value: correctness.

## Core Intuition

Many cooks in a kitchen, but with the guarantee that the final dishes are the same as if one cook had worked alone in some order. The cooks may overlap in time, but the *result* looks like a serial execution. That's serializability.

## Formal Definition

A schedule (interleaving of concurrent transactions' operations) is **serializable** if its result is equivalent to some serial schedule of the same transactions.

**Strict serializability** = serializability + real-time order. If T1 finishes before T2 begins, T1 must precede T2 in the equivalent serial order. (Combines serializability with [[Linearizability]]'s real-time property.)

## Implementation Approaches

**Strict 2PL (Two-Phase Locking):**
- Acquire locks; hold until commit.
- Blocks readers and writers.
- Deadlocks possible.

**SSI (Serializable Snapshot Isolation):**
- Detect dangerous patterns at runtime.
- Abort conflicting transactions.
- Optimistic; non-blocking reads.

**Actual serial execution:**
- Run one transaction at a time. Some systems (Redis, VoltDB) use this approach for in-memory workloads.

## Real Production Examples

- **PostgreSQL Serializable mode** = SSI.
- **MySQL InnoDB Serializable** = 2PL (gap locks).
- **CockroachDB, Spanner** — distributed serializable.
- **FaunaDB** — strict serializability.
- **Redis MULTI/EXEC** — trivially serializable (single-threaded).
- **VoltDB** — serial execution per partition.

## Design Tradeoffs

**Benefits:**
- Strongest correctness guarantee.
- Application can reason locally.
- Eliminates all isolation anomalies.

**Costs:**
- Contention (2PL) or abort rate (SSI).
- Higher latency vs weaker levels.
- Implementation complexity.

## Interview Perspective

**Common questions:**
- "What's serializability?" → Result of concurrent transactions equals some serial execution. Strongest isolation.
- "Serializability vs linearizability?" → Serializability is transaction-level. Linearizability is single-object real-time. Independent.
- "Why isn't serializable default?" → Performance cost. Many workloads tolerate weaker.

**Senior-level:**
- The modern serializable mode (SSI in Postgres) is much more usable than classical 2PL — non-blocking reads make it viable for read-heavy workloads.
- "Strict serializability" combines serializability + linearizability; what Spanner and CockroachDB provide.
- Many applications running "Read Committed" silently have correctness bugs that serializable would catch.

**Common mistakes:**
- Conflating serializability and linearizability.
- Treating serializable as too slow without measuring.
- Not implementing retry logic for SSI.

## Related Concepts

- [[Isolation Levels]] — serializable is the top.
- [[Two-Phase Locking]] · [[Serializable Snapshot Isolation]] — implementations.
- [[Snapshot Isolation]] — the weaker, common alternative.
- [[Linearizability]] — orthogonal single-object property.

## Misconceptions

- **"Serializable = linearizable."** Different. Serializable: transaction order. Linearizable: single-object real-time.
- **"Serializable is unusable."** Modern SSI implementations are fast.
- **"Serializable is unique to RDBMS."** Distributed DBs (Spanner, CockroachDB) provide it too.

## Failure Scenarios

- **2PL contention** under hot rows.
- **SSI abort rate** under conflicts.
- **Distributed serializable** under WAN — latency.

## Practical Engineering Heuristics

- **Use serializable for correctness-critical flows** (money, leader election).
- **Use weaker levels for read-heavy paths** with no invariant requirements.
- **Implement retry logic** under SSI.
- **Measure** before assuming serializable is too slow.

## Active Recall Questions

What is serializability?::Strongest isolation. Result of concurrent transactions equals some serial execution. Eliminates all anomalies.

Serializability vs linearizability?::Serializability is transaction-level (cross-row, cross-transaction). Linearizability is single-object real-time. Independent properties.

Two main implementations of serializable?::Two-Phase Locking (pessimistic, blocking, deadlock-based) and Serializable Snapshot Isolation (optimistic, abort-based).

What's strict serializability?::Serializability + real-time order. Combines serializability with linearizability.

Why isn't serializable the default isolation?::Performance cost. Most workloads tolerate weaker; opting in is explicit.

Name three systems providing serializable transactions.::PostgreSQL Serializable, MySQL InnoDB Serializable, CockroachDB, Spanner, FaunaDB.

## Feynman Test

Construct a non-serializable execution under Read Committed. How would serializable handle it?

Why are serializability and linearizability often confused, and what's the precise distinction?

## Mastery Checklist

- **Explain** serializability and its strict variant.
- **Compare** with weaker levels and with linearizability.
- **Derive** when serializable is necessary.
- **Critique** systems running Read Committed for invariant-critical workflows.
- **Design** a payment service using serializable transactions with proper retries.

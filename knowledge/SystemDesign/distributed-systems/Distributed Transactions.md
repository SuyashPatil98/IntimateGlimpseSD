---
title: Distributed Transactions
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]", "[[Consensus]]", "[[Two-Phase Commit]]"]
related: ["[[Two-Phase Commit]]", "[[Saga Pattern]]", "[[Linearizability]]", "[[Consensus]]", "[[CAP Theorem]]"]
sources:
  - DDIA, Ch. 7, Ch. 9
  - Gray & Lamport (Consensus on Transaction Commit, 2006)
tags: [distributed-systems, transactions, consensus]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Distributed Transactions

## Executive Summary

A distributed transaction is a **transaction whose operations span multiple nodes** (different databases, services, or partitions) and must satisfy ACID properties atomically. The classical implementation is [[Two-Phase Commit]] (2PC); modern alternatives include consensus-backed commit (Spanner, CockroachDB), [[Saga Pattern]] for long-running flows, and outright avoidance via eventual-consistency designs. Distributed transactions are **expensive** (cross-node coordination latency, lock contention), **fragile** (failure modes are numerous), and **often unnecessary** — but when you genuinely need them, no shortcut substitutes.

## Why This Exists

Many real workloads cross node boundaries: transferring money between accounts on different shards; updating inventory and creating an order in different services; atomic operations across multi-tenant databases. Without distributed transactions, you risk inconsistent intermediate states visible to clients. With them, you pay coordination cost. The discipline is choosing *when* the cost is justified.

## Core Intuition

A transaction normally is "all-or-nothing on one database." A distributed transaction extends this to "all-or-nothing across many databases." The difficulty: the database can roll back uncommitted changes locally; coordinating rollback across machines requires explicit protocol — and that protocol can itself fail in interesting ways.

## Internal Mechanics — Three Main Approaches

**1. Two-Phase Commit (2PC):**
- Coordinator orchestrates prepare → commit/abort.
- Blocks on coordinator failure.
- See [[Two-Phase Commit]] for details.

**2. Consensus-backed distributed commit (modern distributed DBs):**
- Each participant is itself a [[Raft]] or [[Paxos]] group.
- Coordinator's decision is logged via consensus → no blocking.
- Used by Google Spanner, CockroachDB, FaunaDB.
- Adds full WAN round-trip per cross-region transaction.

**3. Sagas (eventual consistency):**
- Transaction is a sequence of local steps, each with a **compensating action**.
- If step N fails, undo steps N-1, N-2, ... via compensations.
- Not ACID; provides eventual consistency.
- See [[Saga Pattern]].

## Architecture Diagrams

```
2PC (classical):
  Coordinator ──→ prepare ──→ [DB1] [DB2] [DB3]
       ←──── vote yes/no ───
  Coordinator ──→ commit/abort ──→ [DB1] [DB2] [DB3]

Consensus-backed (Spanner):
  Each participant is a Paxos group.
  Coordinator's decision is itself committed via Paxos.
  No blocking — coordinator failure is recovered via consensus.

Saga (workflow):
  Step 1 → success → Step 2 → success → Step 3 → fail
                                         ↓
                       compensate Step 2 → compensate Step 1
```

## Design Tradeoffs

| Approach | Atomicity | Latency | Availability | Complexity |
|---|---|---|---|---|
| 2PC | Strong | High (2 RTTs) | Low (blocks on coord. failure) | Medium |
| Consensus-backed | Strong | Higher (consensus RTTs) | High (no blocking) | High |
| Saga | Eventual | Per-step; total flow long | High | High (compensation logic) |

## Real Production Examples

- **Google Spanner** — true distributed serializable transactions globally, via Paxos + TrueTime + 2PC on top. Best-in-class but operationally complex.
- **CockroachDB** — Raft per range + 2PC across ranges; serializable isolation.
- **FaunaDB** — strict serializability via Calvin-like protocol.
- **Distributed sagas** — Uber, Airbnb, Stripe use saga-based workflows for cross-service transactions.
- **Stripe Payments** — heavily uses sagas with idempotency and compensation.

## Interview Perspective

**Common questions:**
- "How do you do distributed transactions?" → 2PC, consensus-backed commit, or sagas. Each with trade-offs.
- "When would you use a saga over 2PC?" → Cross-service workflows where you can tolerate eventual consistency; avoid the locks and coordinator complexity of 2PC.
- "How does Spanner do distributed transactions?" → Each shard is Paxos. 2PC on top of Paxos coordinates the commit. TrueTime ensures global serializability via commit-wait.

**Senior-level:**
- The decision tree:
  1. Same-DB shard? → Local transaction.
  2. Different shards same DB system? → Use the DB's distributed transactions (Spanner, CockroachDB).
  3. Different services / databases? → Use sagas with idempotency + compensation, OR redesign to avoid cross-boundary atomicity.
- 2PC has its place — inside a distributed DB. Outside (across services), it's almost always wrong.
- Idempotency keys are essential for any distributed-commit alternative — without them, retries become silent duplicates.

**Common mistakes:**
- Using 2PC across microservices (couples deployments, propagates failures).
- Sagas without proper compensation logic — partial failures leave broken state.
- Believing eventual consistency is "good enough" without analyzing what users actually see.

## Related Concepts

- [[Two-Phase Commit]] · [[Three-Phase Commit]] — atomic commit protocols.
- [[Saga Pattern]] — eventual-consistency alternative.
- [[Consensus]] · [[Paxos]] · [[Raft]] — substrate for modern distributed transactions.
- [[Transactions]] — local single-DB version.
- [[Linearizability]] — what global distributed transactions provide.
- [[CAP Theorem]] — distributed transactions are CP.
- [[Idempotency]] — essential for any retry-safe protocol.

## Misconceptions

- **"Distributed transactions are always too expensive."** Modern distributed DBs (Spanner, CockroachDB) make them feasible. Just not free.
- **"Sagas are easier than 2PC."** Different difficulty. Sagas push complexity into application-level compensation logic, which has its own pitfalls.
- **"Eventual consistency means no atomicity."** Sagas provide eventual atomicity via compensation. Not the same as strict ACID, but not nothing.

## Failure Scenarios

- **Coordinator crash in 2PC** → participants block.
- **Saga compensation failure** → manually recoverable inconsistent state.
- **Partial commit visible** → reads see intermediate state. Mitigation: snapshot isolation, deferred visibility.
- **Idempotency violation on retry** → duplicate effects (double charges). Mitigation: idempotency keys per operation.

## Practical Engineering Heuristics

- **Default: avoid distributed transactions.** Redesign for eventual consistency where possible.
- **If you need cross-shard atomicity: use a distributed DB** (Spanner, CockroachDB) rather than building your own 2PC.
- **For cross-service workflows: use sagas + idempotency.**
- **Test failure modes explicitly.** Distributed transactions fail in many subtle ways.

## Active Recall Questions

What is a distributed transaction?::A transaction whose operations span multiple nodes (databases, services, or shards) and must satisfy ACID atomically.

Name three approaches to distributed transactions.::Two-Phase Commit (2PC), consensus-backed commit (Spanner, CockroachDB), Sagas (eventual consistency with compensation).

Why is 2PC across microservices a bad idea?::Couples deployments, holds locks across services, blocks on coordinator failure, propagates failures across systems. Hard to operate, hard to evolve.

How does Spanner achieve distributed transactions?::Paxos per shard (each shard is its own consensus group) + 2PC across shards (the 2PC decision is itself committed via Paxos, so no blocking) + TrueTime for global serializability via commit-wait.

What's the trade-off in choosing sagas over 2PC?::Sagas: non-blocking, eventually consistent, requires compensation logic. 2PC: blocking, strongly consistent, simpler logic but operationally fragile.

What's the modern default for cross-service workflows?::Sagas with idempotency keys and explicit compensation actions.

## Feynman Test

A bank wants to transfer money between accounts on different databases. Walk through all three approaches (2PC, consensus-backed, saga) and their trade-offs.

Explain why "we'll just use 2PC across our microservices" is usually wrong.

## Mastery Checklist

- **Explain** distributed transactions and the three main approaches.
- **Compare** 2PC, consensus-backed commit, and sagas.
- **Derive** which approach fits a given workload.
- **Critique** designs using 2PC across service boundaries.
- **Design** a payment system using sagas with idempotency.

[^DDIA-Ch9]: Designing Data-Intensive Applications, Kleppmann, Ch. 7 and Ch. 9.

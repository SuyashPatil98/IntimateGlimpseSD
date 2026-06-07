---
title: Three-Phase Commit
aliases: ["3PC"]
area: distributed-systems
status: stub
difficulty: advanced
prerequisites: ["[[Two-Phase Commit]]"]
related: ["[[Two-Phase Commit]]", "[[Distributed Transactions]]", "[[Consensus]]"]
builds_toward: []
sources:
  - 'Skeen — A Quorum-Based Commit Protocol (1982)'
  - DDIA Ch.9
tags: [distributed-systems, consensus, transactions]
created: 2026-06-04
last_reviewed: 2026-06-04
---

# Three-Phase Commit

## Executive Summary

**Three-Phase Commit (3PC)** is a variant of [[Two-Phase Commit|2PC]] adding an intermediate "prepared-to-commit" phase that lets participants reach a safe state without waiting indefinitely on a failed coordinator. Theoretically non-blocking under fail-stop; **practically never used in production** because the assumption (no network partitions, reliable failure detection) doesn't hold in real systems.

## Why It Exists (in theory)

2PC's blocking problem: if the coordinator crashes after sending some commits but before all, participants can't safely decide. 3PC adds a `prepareCommit` phase: once all participants ack, every participant knows commit is safe even if the coordinator dies.

## The Three Phases

1. **canCommit?** — coordinator asks; participants reply yes/no (uncommitted).
2. **prepareCommit** — if all said yes, coordinator broadcasts; participants ack (still uncommitted but pledged).
3. **doCommit** — coordinator broadcasts; participants commit and ack.

If coordinator dies after phase 2, a recovery protocol elects a new coordinator who can ask participants their state and safely complete.

## Why It Isn't Used

- Assumes **fail-stop** (no participants partition or lie) — real networks partition.
- Assumes **synchronous network with bounded delay** — real internet doesn't.
- More messages than 2PC, more latency.
- In practice, **consensus protocols** ([[Raft]], [[Paxos]]) provide stronger guarantees with similar message complexity.

## Real Production

Essentially none. Production distributed commits use:
- **2PC** (XA transactions) — accepting the blocking risk.
- **[[Saga Pattern]]** — compensating transactions, no atomic commit.
- **Consensus** — Raft/Paxos replicate commit decisions.

## Related Concepts

- [[Two-Phase Commit]] — the simpler, more common variant.
- [[Distributed Transactions]] — the parent problem.
- [[Consensus]] — what's used in practice.

## Active Recall Questions

What does 3PC's intermediate "prepareCommit" phase accomplish?::Lets all participants reach a state where they know commit is safe even if the coordinator dies, eliminating 2PC's blocking problem under fail-stop.

Why isn't 3PC used in production?::Its safety guarantees assume fail-stop (no network partitions, bounded delay); real networks partition; consensus protocols (Raft, Paxos) give better guarantees with similar cost.

What's the message complexity difference vs 2PC?::3PC requires an extra round (prepareCommit ack); more messages and latency for a guarantee that doesn't hold under realistic failures.

## Feynman Test

If 3PC theoretically solves 2PC's blocking problem, why does every production system pick 2PC, Saga, or Raft instead?

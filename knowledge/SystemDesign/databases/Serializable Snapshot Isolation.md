---
title: Serializable Snapshot Isolation
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Snapshot Isolation]]", "[[Serializability]]"]
related: ["[[Snapshot Isolation]]", "[[Serializability]]", "[[MVCC]]"]
sources:
  - DDIA, Ch. 7 (pp. 261–266)
  - Cahill et al., 2008 (original SSI paper)
tags: [databases, transactions, isolation]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Serializable Snapshot Isolation

## Executive Summary

**Serializable Snapshot Isolation (SSI)**, introduced by Cahill et al. (2008), is **[[Snapshot Isolation]] enhanced with runtime detection of anomalies that would produce non-serializable history**. Provides true serializability with most of SI's concurrency advantages. Used in **PostgreSQL's Serializable mode** (since 9.1), CockroachDB, FaunaDB. Compared to [[Two-Phase Locking]]: similar correctness, much better read concurrency. Compared to plain SI: catches write skew. The modern best-of-both-worlds concurrency control for many workloads.

## Why This Exists

[[Snapshot Isolation]] is fast but allows write skew. [[Two-Phase Locking]] is correct but blocks readers/writers. Cahill's insight (2008): you can stack serializability checks on top of SI by tracking read/write dependencies and aborting transactions that form a "dangerous structure." Most transactions commit normally; the small number that would cause anomalies are aborted and retry.

## Core Intuition

Run everyone as if it's snapshot isolation. While they run, watch for *patterns of read/write dependencies* that indicate a write-skew-like anomaly. If you detect one, abort the conflicting transaction at commit time. Most workloads have no such patterns; SSI is nearly free. Bad workloads see more aborts → retry → eventually succeed.

## Internal Mechanics

**Track:**
- For each transaction, which rows it read (read-set).
- For each transaction, which rows it wrote (write-set).
- For each row, which transactions read it (SIREAD locks).

**Detect dangerous structures:**
- Cahill's theory: non-serializable history under SI requires a specific "rw-antidependency" pattern — T1 reads what T2 writes; T2 reads what T3 writes; if such a cycle forms, abort.

**On commit:**
- Check for dangerous structures involving this transaction.
- If found, abort.

**False positives:** SSI may abort transactions that would have been serializable. Trade-off: tolerable abort rate for correctness.

## Design Tradeoffs

**Benefits:**
- **True serializability.**
- Non-blocking reads (like SI).
- Better concurrency than 2PL for read-heavy workloads.

**Costs:**
- Bookkeeping overhead (read-set tracking).
- Abort rate increases under conflicting workloads.
- Application must handle retries.

## Real Production Examples

- **PostgreSQL** — Serializable mode is SSI (since 9.1).
- **CockroachDB** — SSI-like with serializable distributed transactions.
- **FaunaDB** — strict serializability via Calvin-like; also conceptually related.

## Interview Perspective

**Common questions:**
- "What's SSI?" → Snapshot Isolation + detection of serializability-violating patterns. Aborts conflicting transactions.
- "Why use SSI?" → Get serializability with SI's read concurrency. Better than 2PL for read-heavy workloads.
- "Trade-off?" → Some transactions abort that wouldn't under 2PL. Need retry logic.

**Senior-level:**
- The Cahill paper is one of the most consequential database papers of the last 20 years. Made true serializability practical.
- Abort rate is workload-dependent. For most apps it's very low; for high-contention adversarial workloads it can be a bottleneck.
- Postgres SSI's documentation honestly admits abort rates; tune apps to retry.

**Common mistakes:**
- Not implementing retry logic — transactions die.
- Using SSI on high-conflict workloads without monitoring abort rate.
- Assuming SSI eliminates all contention.

## Related Concepts

- [[Snapshot Isolation]] — what SSI extends.
- [[Serializability]] — what SSI provides.
- [[Two-Phase Locking]] — the heavier alternative.
- [[MVCC]] — underlying mechanism.

## Misconceptions

- **"SSI is slow."** Generally fast; only conflict-heavy workloads see issues.
- **"SSI prevents all aborts."** Adds aborts that SI wouldn't have — for correctness.
- **"SSI eliminates need for retry."** Application still must handle abort exceptions.

## Failure Scenarios

- **High abort rate** under contention.
- **Livelock** in pathological cases (rare).
- **Retry storms** without backoff.

## Practical Engineering Heuristics

- **Use Postgres Serializable mode** for correctness-critical workflows.
- **Always implement retry logic** with exponential backoff.
- **Monitor abort rate** as an operational SLI.
- **Reduce transaction scope** to reduce conflict surface.

## Active Recall Questions

What is Serializable Snapshot Isolation (SSI)?::Snapshot Isolation + runtime detection of read/write patterns that would produce non-serializable history. Aborts conflicting transactions.

Who introduced SSI?::Cahill, Röhm, Fekete, 2008.

What problem does SSI solve over SI?::Write skew. SI allows write-skew anomalies; SSI detects and prevents them.

What's Postgres Serializable mode?::SSI since 9.1. True serializability with SI's read concurrency.

Trade-off vs Two-Phase Locking?::SSI: non-blocking reads, abort-based, optimistic. 2PL: blocking, deadlock-based, pessimistic.

What does the application need to do under SSI?::Implement retry logic. Aborts due to detected serializability conflicts will increase under contention.

## Feynman Test

Construct a write-skew scenario. Walk through what SI does, then what SSI does.

Why is SSI's abort rate generally low for typical workloads?

## Mastery Checklist

- **Explain** SSI and how it detects anomalies.
- **Compare** with SI, 2PL, classical Serializable.
- **Derive** when SSI's overhead is acceptable.
- **Critique** systems using Serializable without retry logic.
- **Design** a high-concurrency app using SSI with proper retry handling.

[^Cahill-2008]: Cahill, Röhm, Fekete, "Serializable Isolation for Snapshot Databases," SIGMOD 2008.

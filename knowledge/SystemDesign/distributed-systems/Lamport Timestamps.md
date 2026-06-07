---
title: Lamport Timestamps
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Logical Clocks]]"]
related: ["[[Logical Clocks]]", "[[Vector Clocks]]", "[[Hybrid Logical Clocks]]", "[[Causal Consistency]]"]
sources:
  - Lamport, 1978 (original)
  - DDIA, Ch. 9 (pp. 343–347)
tags: [distributed-systems, clocks, ordering]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Lamport Timestamps

## Executive Summary

A Lamport timestamp is a **scalar logical clock** introduced by Leslie Lamport (1978) that gives every event in a distributed system an integer such that **if A happened before B, A's timestamp is less than B's**. The simplest logical clock: a single counter per node, updated on each event and on every message receive. Provides a **total order** of events but **cannot detect concurrency** — if two events have unrelated timestamps, you cannot tell whether they're causally related. Used in Cassandra (LWW timestamps), distributed locks, and as a building block for higher-level protocols.

## Why This Exists

Distributed systems frequently need a "this happened before that" answer — for last-write-wins conflict resolution, for ordering operations in a log, for tagging events. Wall-clock timestamps fail (clock drift, skew). The simplest reliable logical-time mechanism is the Lamport timestamp: cheap (one integer per node), simple (a few lines of code), and provides exactly the consistency-with-happens-before property.

## Core Intuition

Each node has a counter. Every time anything happens, the counter ticks. When you send a message, you attach your current count. When you receive a message, you set your counter to max(yours, theirs) + 1 — you "catch up" to whoever was ahead. This guarantees that if A caused B, A's count is less than B's, regardless of which nodes they ran on.

## Internal Mechanics

**Algorithm (per node):**

1. Maintain a local counter $C$, initialized to 0.
2. On any local event, increment: $C \mathrel{{+}{=}} 1$.
3. On sending message $m$: increment $C$, attach $C$ to $m$.
4. On receiving message $m$ with timestamp $t_m$:
   - Set $C \leftarrow \max(C, t_m)$.
   - Increment $C \mathrel{{+}{=}} 1$.
5. The timestamp of event $e$ is $C$ at the moment $e$ occurred.

**Property:** If event $a \rightarrow b$ (happens-before), then $C(a) < C(b)$.

**Total order:** for tiebreaking when two events have equal timestamps, append node ID: $(C, \text{nodeId})$ lexicographic. Now every pair of events has a definite order.

## Architecture Diagrams

```
Node A: A1(1) ─── send m1, ts=2 ───→
                                        Node B: receives m1; C ← max(0, 2)+1 = 3
                                        B1(4)
Node A: A2(3)  ←─── send m2, ts=5 ───  Node B: send m2, ts=5
Node A: receives m2; C ← max(3, 5)+1 = 6

Happens-before order maintained:
  A1(1) → m1 → B1(4) → m2 → A2(6)
  All timestamps respect causality.
```

## Design Tradeoffs

**Benefits:**
- Constant size (O(1) per timestamp).
- Trivial implementation.
- Gives a total order across all events (with tiebreaking).
- Sufficient for many use cases (LWW conflict resolution).

**Costs:**
- **Cannot detect concurrency.** If $C(a) < C(b)$, you cannot conclude $a \rightarrow b$ — they might be concurrent.
- LWW based on Lamport timestamps silently drops concurrent writes.
- No way to surface conflicts.

## Real Production Examples

- **Apache Cassandra** — Lamport-style timestamps for last-write-wins. Each write tagged with a timestamp; later timestamp wins.
- **DynamoDB** — uses timestamp-based conflict resolution; conceptually Lamport-like.
- **Riak (some modes)** — LWW mode uses scalar timestamps.
- **Distributed mutexes / locks** — Lamport timestamps used for fair queueing.

## Interview Perspective

**Common questions:**
- "How does a Lamport timestamp work?" → Counter per node; increment on local event; on receive, set to max(local, received) + 1.
- "What does it guarantee?" → If A → B causally, C(A) < C(B). Total order is achievable via (timestamp, nodeId) tuple.
- "What's its limitation?" → Cannot detect concurrency. Two events with C(a) < C(b) may still be concurrent — Lamport order can't tell.

**Senior-level:**
- Lamport timestamps are the foundational example in distributed-systems theory. Most subsequent work (vector clocks, HLC, version vectors) is a refinement.
- LWW with Lamport timestamps in production: simple, broadly used, *silently lossy*. Cassandra's "last write wins" works because the cost of conflict resolution is acceptable for the use case.
- For applications where conflict detection matters (e.g., shopping carts that should merge concurrent updates), Lamport is insufficient — use vector clocks or CRDTs.

**Common mistakes:**
- Using Lamport timestamps for conflict surfacing — they can't detect concurrency.
- Forgetting tiebreaking — two events with same timestamp on different nodes have ambiguous order without tuple-with-nodeId.
- Mixing Lamport timestamps with wall-clock — defeats the purpose.

## Related Concepts

- [[Logical Clocks]] — Lamport is the simplest instance.
- [[Vector Clocks]] — extends Lamport to detect concurrency.
- [[Hybrid Logical Clocks]] — combines Lamport's structure with wall-clock for readability.
- [[Causal Consistency]] — Lamport timestamps don't implement causal consistency (need vector or version vectors).

## Misconceptions

- **"Lamport timestamps measure time."** No — they measure order, not time.
- **"If C(a) < C(b), then a happened before b."** Only the converse is guaranteed (a → b → C(a) < C(b)). The forward direction does not hold.
- **"Lamport timestamps detect conflicts."** They don't. They give an arbitrary order to concurrent events.

## Failure Scenarios

- **Silent data loss in LWW** — concurrent writes with timestamps t1 < t2 → t1 silently overwritten, no conflict surfaced.
- **Tiebreak ambiguity** — two events with identical timestamps from different nodes; order resolved arbitrarily by nodeId, but order is meaningless.
- **Lamport counter overflow** in long-lived systems — bound at 2⁶⁴ but worth noting.

## Practical Engineering Heuristics

- **Use Lamport when you need a cheap total order** and don't need to detect concurrency.
- **Always include nodeId in the timestamp tuple** for unambiguous tiebreaking.
- **Don't use Lamport for shopping carts, account balances, or anywhere concurrent updates must merge** — use vector clocks or CRDTs instead.
- **Combine with wall-clock for human readability** (this is what HLC does).

## Active Recall Questions

What is a Lamport timestamp?::A scalar counter per node, incremented on local events and updated to max(local, received) + 1 on message receive. Provides happens-before consistency with a total order.

What does Lamport guarantee?::If event A happens-before event B (a → b), then C(A) < C(B). The converse does not hold.

How do you get a total order from Lamport timestamps?::Append nodeId for tiebreaking: (C, nodeId) lexicographic order. Every pair of events now has a definite, unambiguous order.

What's Lamport's main limitation?::Cannot detect concurrency. If C(a) < C(b), you don't know whether a → b or a ‖ b.

When is Lamport sufficient?::When you only need a total order with arbitrary tiebreaks (e.g., last-write-wins where concurrent updates can be silently dropped) — Cassandra, distributed locks, fair-queue ordering.

When is Lamport insufficient?::When concurrent operations should be surfaced (shopping carts, multi-writer counters, anywhere data loss from silent LWW is unacceptable).

## Feynman Test

Walk through two nodes exchanging three messages with Lamport timestamps. Verify the happens-before property holds.

Why can't you tell from Lamport timestamps alone whether two events were concurrent?

## Mastery Checklist

- **Explain** Lamport timestamps and the update rules.
- **Compare** Lamport with vector clocks.
- **Derive** the happens-before property from the update algorithm.
- **Critique** systems that use Lamport for conflict detection.
- **Design** a fair distributed mutex using Lamport timestamps.

[^Lamport-1978]: Lamport, "Time, Clocks, and the Ordering of Events in a Distributed System," CACM 1978.
[^DDIA-343]: Designing Data-Intensive Applications, Kleppmann, Ch. 9, pp. 343–347.

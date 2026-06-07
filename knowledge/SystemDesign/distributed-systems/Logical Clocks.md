---
title: Logical Clocks
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: []
related: ["[[Lamport Timestamps]]", "[[Vector Clocks]]", "[[Hybrid Logical Clocks]]", "[[Causal Consistency]]", "[[CRDTs]]"]
builds_toward: ["[[Lamport Timestamps]]", "[[Vector Clocks]]"]
sources:
  - DDIA, Ch. 8, Ch. 9
  - Lamport, 1978
tags: [distributed-systems, clocks, ordering]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Logical Clocks

## Executive Summary

Logical clocks are **abstract counters used to order events in a distributed system without relying on physical (wall-clock) time**. Physical clocks across machines drift, jump, and disagree — making them unreliable for ordering operations. Logical clocks instead derive order from **causality**: if event A could have influenced event B, the clock guarantees A's timestamp precedes B's. The two foundational schemes — [[Lamport Timestamps]] (scalar) and [[Vector Clocks]] (per-node vector) — enable consistency models like [[Causal Consistency]] and conflict detection in [[Eventual Consistency]] systems.

## Why This Exists

In a distributed system, you cannot trust wall-clock time:
- Clock drift between machines (microseconds per second).
- NTP corrections jump time backward or forward.
- Leap seconds.
- Clock skew across data centers (milliseconds).

Yet many algorithms need to ask "did A happen before B?" Logical clocks provide a *clock-independent* answer: they encode the causal structure of events.

## Core Intuition

Imagine a relay race team without watches. They can't measure absolute times, but they can say "I started running *after* receiving the baton." That ordering — without absolute time — is what logical clocks formalize.

If you tell me something, you "influenced" me; my next action causally follows yours. Logical clocks capture this chain of influence as a numeric ordering, *without* needing synchronized clocks.

## Formal Definition

The **happens-before relation** $\rightarrow$ (Lamport, 1978):
1. If $a, b$ are events on the same node and $a$ occurred before $b$, then $a \rightarrow b$.
2. If $a$ is a send event and $b$ is the corresponding receive, then $a \rightarrow b$.
3. Transitive: $a \rightarrow b \land b \rightarrow c \Rightarrow a \rightarrow c$.

Two events $a, b$ are **concurrent** ($a \parallel b$) if neither $a \rightarrow b$ nor $b \rightarrow a$.

A logical clock $C$ is **consistent with happens-before** if $a \rightarrow b \Rightarrow C(a) < C(b)$. Different schemes provide different strengths.

## Internal Mechanics — Two Schemes

**[[Lamport Timestamps]] (scalar):**
- Each node has a counter.
- On every local event, increment counter.
- When sending a message, attach the counter.
- On receive, set counter = max(local, received) + 1.
- Property: $a \rightarrow b \Rightarrow C(a) < C(b)$. But the reverse doesn't hold — equal or greater timestamps don't imply causality.

**[[Vector Clocks]] (per-node vector):**
- Each node has a vector with one entry per node.
- On local event, increment own slot.
- Send: attach the full vector.
- Receive: pointwise max with received vector, then increment own slot.
- Property: $a \rightarrow b \iff V(a) < V(b)$ — full causality detection, including concurrency.

**[[Hybrid Logical Clocks]] (HLC):** combine logical with physical time for readability + causality.

## Design Tradeoffs

| Scheme | Size | Detects concurrency? | Use case |
|---|---|---|---|
| Lamport | O(1) | No | Total order with arbitrary tiebreak; simpler systems |
| Vector | O(N) | Yes | Causal consistency, conflict detection |
| HLC | O(1) + timestamp | Partial | Distributed DBs with debuggable timestamps |

## Real Production Examples

- **Riak** — vector clocks (version vectors) for concurrent-write detection.
- **DynamoDB** — original Dynamo used vector clocks; modern DynamoDB uses other schemes internally.
- **Cassandra** — Lamport-style timestamps for last-write-wins.
- **CockroachDB** — Hybrid Logical Clocks for cross-node transaction ordering.
- **MongoDB** — Hybrid Logical Clocks for causal sessions.
- **Google Spanner** — TrueTime (physical, bounded uncertainty) rather than logical, but addresses same problem.

## Interview Perspective

**Common questions:**
- "Why not use physical time?" → Clocks drift, jump, are unreliable across machines. Logical clocks are clock-independent.
- "Lamport vs Vector?" → Lamport: O(1), total order, no concurrency detection. Vector: O(N), partial order, full concurrency detection.
- "What's a hybrid logical clock?" → Combines physical timestamp with a logical counter; gives both human readability and causal correctness.

**Senior-level:**
- The happens-before relation is the *fundamental abstraction* of distributed-systems theory. Most algorithms can be analyzed in its terms.
- Vector clocks have a hidden cost: vector size grows with the number of writers. Garbage collection of dormant entries is nontrivial.
- HLC is the modern compromise — used in CockroachDB, MongoDB, YugabyteDB. Bounded size; closely tracks wall-clock; provides causal ordering.

**Common mistakes:**
- Using wall-clock timestamps for causality decisions — works most of the time, fails in production at the worst time.
- Implementing vector clocks without bounded size — vector grows unboundedly with churn.
- Confusing logical clocks with synchronized clocks.

## Related Concepts

- [[Lamport Timestamps]] — the simplest logical clock.
- [[Vector Clocks]] — full causality detection.
- [[Hybrid Logical Clocks]] — modern compromise.
- [[Causal Consistency]] — consistency model implementable via vector/HLC clocks.
- [[CRDTs]] — sometimes use vector clocks internally.

## Misconceptions

- **"Logical clocks measure time."** No — they measure *order*. The numeric value has no relation to seconds, milliseconds, or anything time-like.
- **"Greater Lamport timestamp = happened later."** Only true if there's a causal chain. Concurrent events can have any relative order.
- **"Vector clocks scale."** They scale with the number of *writers*, not the data. In long-lived systems with churn, vectors grow.

## Failure Scenarios

- **Vector clock pruning loses causality** — too-aggressive GC removes entries needed for ordering decisions.
- **Lamport tiebreak ambiguity** — concurrent events have equal timestamps; tiebreak by node ID is arbitrary.
- **HLC clock skew exceeds tolerance** — physical clock jumps cause HLC to spike or stall.

## Practical Engineering Heuristics

- **Use vector clocks when you need to detect concurrency** (e.g., conflict surfacing in Dynamo-style systems).
- **Use Lamport when you only need a total order** with arbitrary tiebreaks.
- **Use HLC for distributed DBs** — modern, debuggable, causal.
- **Never use wall-clock alone** for distributed ordering.

## Active Recall Questions

What is a logical clock?::An abstract counter used to order events in a distributed system without relying on physical time. Encodes causal structure, not absolute time.

State Lamport's happens-before relation.::a → b if (a, b on same node, a before b) OR (a sends, b receives) OR (transitivity).

Difference between Lamport timestamps and vector clocks?::Lamport: scalar, O(1), total order but doesn't detect concurrency. Vector: per-node vector, O(N), detects concurrency precisely.

What's a Hybrid Logical Clock (HLC)?::Combines physical timestamp + logical counter. Bounded size like Lamport, but closely tracks wall-clock for debuggability. Used in CockroachDB, MongoDB.

Why can't you use wall-clock time for distributed ordering?::Clocks drift, jump (NTP corrections), differ across machines (clock skew). Wall-clock comparisons are unreliable for causality.

When is detecting concurrency important?::In eventually-consistent systems with concurrent writes — vector clocks let you surface conflicts to the application instead of silently overwriting (LWW).

## Feynman Test

Walk through Lamport timestamp updates as two nodes exchange messages. Then do the same with vector clocks. Where do they differ?

Why does HLC exist if Lamport and Vector already solve the problem?

## Mastery Checklist

- **Explain** happens-before and consistency-with-causality.
- **Compare** Lamport, Vector, and HLC.
- **Derive** which scheme suits a given application.
- **Critique** wall-clock-based distributed ordering.
- **Design** a system that uses HLC for cross-node transactions.

[^Lamport-1978]: Lamport, "Time, Clocks, and the Ordering of Events in a Distributed System," CACM 1978.
[^DDIA-Ch8]: Designing Data-Intensive Applications, Kleppmann, Ch. 8.

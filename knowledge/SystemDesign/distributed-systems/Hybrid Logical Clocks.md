---
title: Hybrid Logical Clocks
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Logical Clocks]]", "[[Lamport Timestamps]]"]
related: ["[[Lamport Timestamps]]", "[[Vector Clocks]]", "[[Causal Consistency]]", "[[Linearizability]]"]
sources:
  - Kulkarni et al., 2014 (original HLC paper)
  - DDIA, Ch. 8–9 (referenced)
  - CockroachDB and MongoDB docs
tags: [distributed-systems, clocks, ordering]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Hybrid Logical Clocks

## Executive Summary

Hybrid Logical Clocks (HLC), introduced by Kulkarni et al. (2014), combine **physical wall-clock time** with a **logical counter** into a single timestamp that's both **causally consistent** (like Lamport) and **closely tracks real time** (unlike pure logical clocks). HLCs are **bounded in size** (unlike vector clocks) yet **detect causality more robustly than Lamport alone**. Used by **CockroachDB, MongoDB causal sessions, YugabyteDB, ScyllaDB**, and many modern distributed databases. The modern compromise that often replaces classical Lamport/vector clocks in production.

## Why This Exists

Lamport timestamps are causally correct but bear no relation to wall-clock time — making them awful for debugging, analytics, or cross-system correlation. Vector clocks capture full causality but grow with writers. HLCs solve both: a single 64-bit (or similar) timestamp that's always within bounded skew of wall-clock time AND respects happens-before order across nodes. Best of three worlds: bounded size, causal correctness, debuggability.

## Core Intuition

A Lamport counter that's anchored to wall-clock time. Each node's HLC is "my best understanding of wall-clock time, advanced to respect causality." When you receive a message with a higher HLC, your HLC jumps forward. But your HLC also moves forward with wall time naturally. Mostly it tracks wall time; occasionally it jumps ahead to respect causality.

## Formal Definition

An HLC at node $i$ is a pair $(l_i, c_i)$ where:
- $l_i$ — the "logical" part (tracks max-seen wall-clock).
- $c_i$ — a counter (breaks ties when $l$ doesn't advance).

**Update rules:**

Let $\text{pt}_i$ = current physical time on node $i$.

1. On local event:
   - $l_i' \leftarrow \max(l_i, \text{pt}_i)$
   - If $l_i' = l_i$: $c_i' \leftarrow c_i + 1$, else $c_i' \leftarrow 0$.

2. On send: timestamp message with $(l_i, c_i)$.

3. On receive of message with $(l_m, c_m)$:
   - $l_i' \leftarrow \max(l_i, l_m, \text{pt}_i)$
   - If $l_i' = l_i = l_m$: $c_i' \leftarrow \max(c_i, c_m) + 1$.
   - Else if $l_i' = l_i$: $c_i' \leftarrow c_i + 1$.
   - Else if $l_i' = l_m$: $c_i' \leftarrow c_m + 1$.
   - Else: $c_i' \leftarrow 0$.

**Comparison:** $(l_1, c_1) < (l_2, c_2)$ iff $l_1 < l_2$ or ($l_1 = l_2$ and $c_1 < c_2$).

**Property:** $a \rightarrow b \Rightarrow \text{HLC}(a) < \text{HLC}(b)$ (causal consistency).
**Bonus:** $|\text{HLC}(a) - \text{pt}(a)|$ is bounded under normal clock conditions.

## Architecture Diagrams

```
Three nodes; HLC = (logical-part, counter).

Node A at pt=100: event → HLC_A = (100, 0)
Node A sends to B (pt_B = 95, clock skew).
Node B receives at pt=95: l = max(100, 95) = 100; c = 1 (since l = l_m)
                          → HLC_B = (100, 1)

Node B has advanced HLC beyond its wall-clock because of causality.
But it's only off by 5ms — bounded skew.
```

## Design Tradeoffs

**Benefits:**
- Bounded size — single timestamp.
- Causally consistent like Lamport, with sharper "approximately wall-clock" meaning.
- Debuggable — timestamps roughly match actual time.
- No vector growth problem.

**Costs:**
- Slightly more complex than Lamport (two-component timestamp).
- Doesn't detect concurrency like vector clocks (can't distinguish concurrent from causally ordered if HLCs are close).
- Relies on bounded clock skew (NTP) — fails under unbounded clock drift.

## Real Production Examples

- **CockroachDB** — HLC for cross-node transaction ordering. Foundation of its serializable isolation.
- **MongoDB** — HLC underpins causal sessions (clients can request "read your writes" via HLC ordering).
- **YugabyteDB** — HLC for cross-node consistency.
- **ScyllaDB** — HLC for some operations.
- **AntidoteDB** — research/production CRDT system using HLC + vector for full causal+ consistency.

## Interview Perspective

**Common questions:**
- "What is HLC?" → Hybrid of wall-clock and logical counter; causally consistent, bounded-size, debuggable.
- "Why HLC over Lamport?" → Lamport timestamps don't relate to wall-clock; HLC does. Easier to debug, correlate, and reason about.
- "Why HLC over vector clocks?" → Bounded size. Vector clocks grow with writers; HLC stays a single timestamp.

**Senior-level:**
- HLC is the modern *default* logical clock for distributed databases. It's what you reach for when you need causality and bounded size and don't need full concurrency detection.
- CockroachDB's choice of HLC + careful protocol gives serializable transactions across geographically distributed nodes — without TrueTime-style atomic clocks (Spanner's approach).
- HLC's correctness depends on clock skew being bounded. If NTP fails catastrophically (clock jumps hours), HLC misbehaves.

**Common mistakes:**
- Treating HLC as equivalent to wall-clock — they're close but not identical. Treating HLC values as exact times causes subtle bugs.
- Using HLC for concurrency detection — it's not vector clocks. Concurrent events may have arbitrary HLC order.
- Forgetting the clock-skew assumption — HLC's bounded property requires bounded NTP skew.

## Related Concepts

- [[Logical Clocks]] — HLC is one of the family.
- [[Lamport Timestamps]] — ancestor; HLC anchors Lamport to wall-clock.
- [[Vector Clocks]] — complementary; HLC has bounded size, vectors have full concurrency detection.
- [[Causal Consistency]] — implementable via HLC for systems where vector overhead is too high.
- [[Linearizability]] — HLC enables linearizable transactions in CockroachDB.

## Misconceptions

- **"HLC = wall-clock time."** Close, but HLC may be ahead of wall-clock to preserve causality (after receiving from a node with later HLC).
- **"HLC detects concurrency like vector clocks."** No — HLC is total-order with bounded skew. Concurrent events get arbitrary order.
- **"HLC eliminates the need for clock synchronization."** No — HLC's bounded property relies on bounded clock skew (typically NTP).

## Failure Scenarios

- **NTP catastrophic failure** — clock jumps by hours. HLC must catch up; transactions may stall.
- **Adversarial latency** — bad actor sends future timestamps to force HLC forward. Most systems cap HLC's distance from wall-clock.
- **Stale node returning** — node's HLC is far behind cluster's. Must rapidly catch up to current.

## Practical Engineering Heuristics

- **Use HLC for ordered timestamps in distributed DBs.** Default choice.
- **Cap HLC's distance from wall-clock** — prevents adversarial forward jumps.
- **Monitor clock skew** — HLC depends on bounded NTP skew.
- **Combine with vector clocks** if you also need full concurrency detection (causal+ systems).

## Active Recall Questions

What is a Hybrid Logical Clock?::A timestamp combining wall-clock physical time with a logical counter. Causally consistent, bounded-size, closely tracks real time.

What problem does HLC solve over Lamport?::Lamport timestamps have no relation to wall-clock — bad for debugging and cross-system correlation. HLC stays close to real time while preserving causality.

What problem does HLC solve over vector clocks?::Bounded size. Vector clocks grow with the number of writers; HLC is always a single timestamp.

Who introduced HLC and when?::Kulkarni, Demirbas, Madappa, Avva, Leone, 2014.

Does HLC detect concurrency like vector clocks?::No. HLC gives total order with bounded clock-skew. Concurrent events get arbitrary HLC order. For concurrency detection, use vector clocks.

Name three production systems using HLC.::CockroachDB, MongoDB (causal sessions), YugabyteDB, ScyllaDB, AntidoteDB.

What's HLC's correctness assumption?::Bounded clock skew (typically maintained by NTP). If clocks drift unboundedly, HLC misbehaves.

## Feynman Test

Walk through HLC updates as two nodes with slight clock skew exchange messages. How does HLC stay close to wall-clock while respecting causality?

Why did CockroachDB choose HLC over Spanner-style TrueTime?

## Mastery Checklist

- **Explain** HLC and the (l, c) update rules.
- **Compare** HLC with Lamport, vector clocks, and TrueTime.
- **Derive** HLC behavior under clock skew scenarios.
- **Critique** "we'll just use wall-clock timestamps" for distributed ordering.
- **Design** a distributed DB using HLC for cross-node transactions.

[^HLC-2014]: Kulkarni, Demirbas, Madappa, Avva, Leone, "Logical Physical Clocks and Consistent Snapshots in Globally Distributed Databases," 2014.

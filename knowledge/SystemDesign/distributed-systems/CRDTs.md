---
title: CRDTs
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Eventual Consistency]]", "[[Leaderless Replication]]"]
related: ["[[Multi-Leader Replication]]", "[[Eventual Consistency]]", "[[Vector Clocks]]", "[[Causal Consistency]]"]
sources:
  - DDIA, Ch. 5 (pp. 174–175)
  - Shapiro et al., 2011 (foundational CRDT paper)
tags: [distributed-systems, crdts, eventual-consistency]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# CRDTs

## Executive Summary

CRDTs (Conflict-Free Replicated Data Types) are **data structures whose merge operation is associative, commutative, and idempotent (ACI), guaranteeing replicas converge to the same value regardless of update order**. They eliminate the conflict-resolution problem in eventually-consistent systems by designing data structures that *can't* have conflicts — concurrent updates always merge to a deterministic result without coordination. Used in collaborative editors (Google Docs research, Figma, Notion, Linear), distributed databases (Redis CRDTs, AntidoteDB, SoundCloud Roshi), and anywhere multi-leader systems need automatic reconciliation.

## Why This Exists

In multi-leader and leaderless systems, concurrent writes happen. Reconciliation requires logic: last-write-wins (lossy), version vectors + app merge (complex), or domain rules (brittle). CRDTs sidestep this by mathematical construction: design data structures where concurrent operations *commute*. Then any merge order produces the same result. No coordination needed.

## Core Intuition

A counter that two people increment from different rooms with no internet. Person A does +5; Person B does +3. When they reconnect, neither needs to know the other's history — they merge: "I'm at +5, you're at +3, sum = +8." Both replicas now read 8. No conflict; no logic needed.

A CRDT counter generalizes this. So does a CRDT set, list, map, register — all designed so "merge" always produces a meaningful result.

## Formal Definition

A **CRDT** is a data structure with a merge operation $\sqcup$ satisfying:

1. **Associativity:** $a \sqcup (b \sqcup c) = (a \sqcup b) \sqcup c$
2. **Commutativity:** $a \sqcup b = b \sqcup a$
3. **Idempotence:** $a \sqcup a = a$

These ("ACI") guarantee replicas eventually converge to the same state regardless of:
- The order updates arrive in.
- How many times an update is delivered.
- Whether the same update is applied multiple times.

**Two flavors:**
- **State-based (CvRDT, convergent)** — replicas exchange full state; merge is a join in a semilattice.
- **Operation-based (CmRDT, commutative)** — replicas exchange operations; operations commute; delivery must be reliable and causally ordered.

## Common CRDT Types

| CRDT | What it does | Example use |
|---|---|---|
| **G-Counter** | Increment-only counter | Page views, likes |
| **PN-Counter** | Increment + decrement | Inventory, balance |
| **G-Set** | Grow-only set | Append-only log |
| **2P-Set** | Add then remove (tombstones) | Sets with deletion |
| **OR-Set** | Observed-remove set (tag-based) | General-purpose sets |
| **LWW-Register** | Last-write-wins by timestamp | Simple values |
| **MV-Register** | Multi-value (surfaces concurrent writes) | Shopping carts (Dynamo) |
| **RGA / Logoot / WOOT** | Convergent text sequences | Collaborative editing |
| **OR-Map** | Key-value map of CRDTs | JSON-like documents |

## Internal Mechanics — G-Counter Example

Each replica maintains a vector of per-replica counters. Increment: increment own slot. Read: sum all slots. Merge: pointwise maximum.

```
Replica A: [3, 0, 0]    (A's count = 3)
Replica B: [0, 2, 0]    (B's count = 2)
Replica C: [0, 0, 5]    (C's count = 5)

After gossip merge (pointwise max):
  All replicas: [3, 2, 5] → sum = 10. Consistent.
```

The trick: each replica only writes its own slot, so no conflict. Merge by max guarantees we never lose an increment.

## Design Tradeoffs

**Benefits:**
- No coordination for concurrent updates.
- Automatic conflict resolution.
- Composes — CRDTs of CRDTs are CRDTs.
- **Strong eventual consistency:** same updates → same state, regardless of order.

**Costs:**
- Limited to data structures where ACI merge can be defined.
- Some CRDTs grow without bound (tombstones in 2P-Set, OR-Set metadata).
- More memory and bandwidth than naive structures.
- Some intuitive operations (e.g., "set to value 5") don't map cleanly.

## Real Production Examples

- **Figma** — CRDTs for real-time multi-user editing.
- **Riak** — built-in CRDT types (counters, sets, maps, registers).
- **Redis Enterprise CRDTs** — geo-distributed Redis using CRDTs.
- **Apple's CloudKit** — CRDTs for iCloud sync.
- **AntidoteDB** — research/production DB built entirely on CRDTs.
- **Automerge / Yjs** — popular libraries for collaborative apps.
- **Linear, Replicache** — CRDT-based offline-first sync layers.

## Interview Perspective

**Common questions:**
- "What's a CRDT?" → Data structure whose merge is ACI — replicas converge automatically.
- "Give an example." → G-Counter: vector of per-replica counters; merge by pointwise max; sum to read.
- "What's the cost?" → Limited to ACI-mergeable shapes; some grow unboundedly (tombstones); not every operation maps cleanly.

**Senior-level:**
- CRDTs trade *expressiveness* for *coordination-free convergence*. The data structures you can build are constrained.
- Operational transformation (OT) is an alternative; CRDTs and OT solve similar problems with different math. Modern systems mostly prefer CRDTs.
- CRDTs give *strong eventual consistency* (SEC): not just "eventually same" but *guaranteed* same after seeing the same updates.

**Common mistakes:**
- Believing CRDTs solve all concurrency. They constrain operations.
- Implementing custom CRDTs without proving merge is ACI — easy to get subtly wrong.
- Ignoring metadata growth (tombstones).

## Related Concepts

- [[Eventual Consistency]] — CRDTs achieve "strong eventual consistency."
- [[Multi-Leader Replication]] — primary use case for CRDTs.
- [[Vector Clocks]] — alternative for conflict *detection* (CRDTs are conflict *avoidance*).
- [[Causal Consistency]] — op-based CRDTs require causal delivery.

## Misconceptions

- **"CRDTs eliminate all conflicts."** They eliminate conflicts in operations that *fit* the CRDT model.
- **"CRDTs are slow."** Modern libraries (Yjs, Automerge 2) are highly optimized.
- **"CRDTs require fancy infrastructure."** Many work in plain async replication; libraries do the heavy lifting.

## Failure Scenarios

- **Unbounded growth** — sets with tombstones grow forever. Mitigation: GC requires consensus on safe-to-prune watermark.
- **Op-based delivery failure** — non-commutative ops applied out of order corrupt state. Mitigation: reliable causal broadcast.
- **Type mismatch** — replicas disagree on which CRDT type a value is. Mitigation: schema enforcement.

## Practical Engineering Heuristics

- **Use a library; don't roll your own.** Yjs, Automerge, Riak's built-ins.
- **Pick the right CRDT for the data shape.** Counter? Set? Sequence? Map?
- **Plan for GC** if using CRDTs with tombstones.
- **CRDTs shine in offline-first / multi-leader apps.** Overkill for single-leader.

## Active Recall Questions

What's a CRDT?::Conflict-Free Replicated Data Type — merge is ACI (associative, commutative, idempotent), so replicas converge regardless of update order.

What are the three ACI properties?::Associativity (grouping doesn't matter), commutativity (order doesn't matter), idempotence (duplicates don't matter).

Two flavors of CRDT?::State-based (CvRDT): exchange full state, merge is semilattice join. Op-based (CmRDT): exchange commuting operations; requires causal delivery.

How does a G-Counter work?::Vector of per-replica counters. Increment own slot. Read = sum. Merge = pointwise max.

When are CRDTs the wrong choice?::Single-leader systems (overkill); operations that don't fit ACI; correctness-critical operations needing linearizability.

Name a real production system using CRDTs.::Figma, Redis Enterprise, Riak, Automerge-based apps (Linear), Apple CloudKit, AntidoteDB.

What's "strong eventual consistency"?::Replicas that have received the same set of updates are in the same state. Stronger than vanilla eventual (just "converge eventually").

## Feynman Test

Walk through how a G-Counter handles two replicas each incrementing concurrently. Why is the merge correct?

Compare CRDTs and operational transformation for collaborative editing. What are their trade-offs?

## Mastery Checklist

- **Explain** CRDTs and the ACI merge property.
- **Compare** state-based and op-based CRDTs.
- **Derive** which CRDT fits a given data shape.
- **Critique** custom CRDT implementations without ACI proofs.
- **Design** a collaborative app using CRDTs end-to-end.

[^DDIA-174]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 174–175.
[^Shapiro-2011]: Shapiro, Preguiça, Baquero, Zawirski, "Conflict-Free Replicated Data Types," 2011.

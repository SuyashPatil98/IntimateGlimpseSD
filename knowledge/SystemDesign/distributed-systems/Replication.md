---
title: Replication
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[CAP Theorem]]", "[[Consistency Models]]"]
related: ["[[Leader-Based Replication]]", "[[Multi-Leader Replication]]", "[[Leaderless Replication]]", "[[Synchronous vs Asynchronous Replication]]", "[[Replication Lag]]", "[[Quorums]]", "[[Eventual Consistency]]"]
builds_toward: ["[[Quorums]]", "[[Consensus]]", "[[Partitioning]]"]
sources:
  - DDIA, Ch. 5, pp. 151–197
  - SDI vol 1, Ch. 6
  - system-design-primer (Donne Martin)
tags: [distributed-systems, replication, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Replication

## Executive Summary

Replication is **keeping a copy of the same data on multiple machines connected via a network**. It serves three goals: reduce **latency** (data near users), increase **availability** (survive node failure), and scale **read throughput** (multiple replicas serving reads). The complexity is entirely about **writes**: how to propagate them, handle conflicts, and what consistency to guarantee. Three architectural patterns dominate — [[Leader-Based Replication]], [[Multi-Leader Replication]], [[Leaderless Replication]] — distinguished by where writes are accepted and how conflicts are resolved.

## Why This Exists

A single-machine database has hard limits: capacity, throughput, failure tolerance — all bounded by one box. Replication is the foundational technique that lets distributed systems exceed those limits. But it introduces every distributed-systems problem: consistency, ordering, failure detection, conflict resolution. Most other distributed-systems concepts exist to manage some replication-induced complication.

## Core Intuition

Three copies of your customer database. If one machine dies, you survive. But now the three copies must agree on what the data IS. A customer updates their address on copy A while a billing job reads from copy B — what's the truth? Replication adds resilience but creates the *agreement problem*. Every replication choice is an answer to: "when copies disagree, what do we do?"

## Formal Definition

A **replicated system** maintains $N$ copies (replicas) of a logical dataset. A **replication strategy** specifies:
1. Where writes are accepted (one, some, or any node).
2. How writes propagate.
3. Where reads are served.
4. How conflicts are reconciled.
5. What consistency guarantees clients see.

## Internal Mechanics

**Replication log** — universal mechanism. The accepting node sequences writes; followers/peers apply the log in order. Variants:
- **Statement-based** — send the SQL command. Fragile with `NOW()`, `RANDOM()`.
- **WAL shipping** — raw byte-level WAL. Tightly couples replica versions.
- **Logical (row-based)** — semantic change records (MySQL row-based, Postgres logical decoding). Most robust.
- **Trigger-based** — flexible, slow.

**Propagation modes:** [[Synchronous vs Asynchronous Replication]] — the core durability/latency trade-off.

**Conflict resolution:** last-write-wins (timestamps), version vectors, [[CRDTs]], or application logic.

## Architecture Diagrams

```
LEADER-BASED:
   Client → [LEADER] ─── replicates ──→ [Follower 1]
                                    ──→ [Follower 2]
   Writes: leader only.  Reads: leader (linearizable) or followers (stale).

MULTI-LEADER:
   Client → [Leader A] ←──── replicates ────→ [Leader B] ← Client
   Writes: any leader.  Conflicts: must resolve.

LEADERLESS:
   Client → writes to W of [N1, N2, N3]
   Client ← reads from R of [N1, N2, N3]
   With W + R > N: quorum overlap.
```

## Design Tradeoffs

| Axis | Trade-off |
|---|---|
| Sync vs Async | Durability ↔ Latency |
| Number of replicas | Availability ↔ Cost + coordination |
| Leader vs Leaderless | Simplicity ↔ Availability under partition |
| Same-DC vs Geo | Latency ↔ Disaster tolerance |
| Eager vs Lazy conflict resolution | Consistency ↔ Throughput |

No single choice is universally right. Production systems blend per workload.

## Real Production Examples

- **PostgreSQL** — leader-based, sync/async configurable per replica.
- **MySQL** — leader-based default; multi-leader via Galera.
- **MongoDB replica sets** — leader-based with Raft-derived election.
- **Cassandra** — leaderless; tunable W, R, N per query.
- **DynamoDB** — leaderless; eventually consistent default, strong opt-in.
- **Google Spanner** — leader-based per shard via Paxos; global via TrueTime.
- **CockroachDB** — Raft per range; multi-region tunable.
- **DynamoDB Global Tables / Cosmos DB multi-write** — multi-leader.

## Interview Perspective

**Common questions:**
- "Walk me through how a write propagates." → Always positive to sketch the replication log + propagation path.
- "What happens if the leader dies?" → [[Leader Election]] + failover; expect an anti-write window.
- "How would you scale reads?" → Add followers; accept staleness or add session guarantees.

**Senior-level:**
- Replication is the foundation of [[CAP Theorem]], [[Quorums]], [[Consensus]] — most interesting distributed-systems concepts manage replication.
- Replication for *availability* (geo) is fundamentally different from for *durability* (intra-DC).
- The hardest replication problem isn't propagation — it's safe failover without split-brain or data loss.

**Common mistakes:**
- Treating replication and [[Partitioning]] as the same. Orthogonal — most systems do both.
- Assuming async is "always faster" without accounting for user-visible replication lag impact.
- Forgetting that partitions split replicas mid-write.

## Related Concepts

- [[Leader-Based Replication]] · [[Multi-Leader Replication]] · [[Leaderless Replication]]
- [[Synchronous vs Asynchronous Replication]] — propagation choice.
- [[Replication Lag]] — consequence of async.
- [[Quorums]] — coordination for leaderless.
- [[Consensus]] — safe leader election.
- [[Partitioning]] — orthogonal scaling axis.

## Misconceptions

- **"Replication = backup."** No. Backup is a point-in-time snapshot; replication is live. Both useful, not interchangeable.
- **"More replicas = more available."** Up to a point. Coordination overhead can dominate.
- **"Sync = zero data loss."** Only if storage is power-fail-safe and the round-trip completed durably.
- **"Async is dangerous."** Used with session guarantees, async is the right default for most user-facing workloads.

## Failure Scenarios

- **Leader fails mid-write:** the write may or may not have replicated. New leader needs to know what's committed.
- **Split brain:** partition leaves two leaders; both accept writes; reconciliation may lose data. Mitigation: fencing tokens, leases.
- **Cascading replication lag:** slow follower delays its downstream replicas. Mitigation: per-link lag monitoring, auto-eject.
- **Schema migration breaks followers:** mitigation — backward-compatible multi-step migrations.

## Practical Engineering Heuristics

- **Default to single-leader** unless you need geo-distribution or extreme write throughput.
- **3 replicas minimum** for tolerating 1 failure; 5 for tolerating 2.
- **Monitor lag as an SLI**, not an afterthought.
- **Test failover routinely.** Chaos-test leader failure; manual drills.
- **Async by default; sync only where durability >> latency** (financial commits, etc.).

## Advanced Topics

- **Chain replication** — replicas arranged in chain; specific failure-handling.
- **Geo topologies** — star (one primary), mesh (active-active), tree (hierarchical).
- **Physical vs logical replication** — bytes vs semantics.

## Active Recall Questions

What are the three goals of replication?::Reduce latency (data near users), increase availability (survive node failure), scale read throughput.

Name the three canonical replication architectures.::Leader-based, multi-leader, leaderless.

What's a replication log?::Sequenced record of writes that the accepting node produces; followers apply it in order. Types: statement-based, WAL-shipping, logical/row-based, trigger-based.

Difference between replication and partitioning?::Replication = same data on multiple nodes. Partitioning = different data on different nodes. Orthogonal — most systems do both.

Difference between replication and backup?::Replication is live, continuous. Backup is point-in-time for disaster recovery. Not interchangeable.

Why is async the default for most user-facing workloads?::Lower latency; doesn't make writes wait for slow followers; follower failures don't block writes.

What goes wrong if your leader fails during an async write?
?
The write may not have propagated. New leader has no knowledge of it. Client thinks it succeeded; data is silently lost.

## Feynman Test

Explain why replication is "the central problem of distributed systems."

Walk through, second by second, what happens when a leader fails in a 3-replica leader-based system. What does the client see at each step?

## Mastery Checklist

- **Explain** the goals and types of replication.
- **Compare** leader-based, multi-leader, leaderless.
- **Derive** which strategy suits a workload (read-heavy, write-heavy, geo, financial, social).
- **Critique** "we'll just add replicas" suggestions.
- **Design** a replicated service with explicit choices on leader, sync/async, conflicts, quorum.

[^DDIA-Ch5]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 151–197.
[^SDI-Ch6]: System Design Interview vol 1, Alex Xu, Ch. 6.

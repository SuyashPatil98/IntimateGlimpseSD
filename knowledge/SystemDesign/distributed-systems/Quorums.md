---
title: Quorums
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]"]
related: ["[[Leaderless Replication]]", "[[Consistency Models]]", "[[Linearizability]]", "[[Anti-Entropy]]", "[[CAP Theorem]]"]
builds_toward: ["[[Consensus]]"]
sources:
  - DDIA, Ch. 5 (pp. 179–184), Ch. 9
  - SDI vol 1, Ch. 6
tags: [distributed-systems, replication, consistency]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Quorums

## Executive Summary

A quorum is the **minimum number of nodes that must agree** for an operation (read or write) to succeed in a distributed system. The classic formulation: with N replicas, write to W of them and read from R; if **W + R > N**, every read sees at least one replica with the latest write. Quorums are how Dynamo-style leaderless systems achieve tunable consistency, and they're the mathematical backbone of [[Consensus]] protocols like Paxos and Raft. The key insight: you don't need *all* replicas to agree — just enough to guarantee overlap.

## Why This Exists

In a leaderless system: how many replicas must accept a write for it to be "committed"? Require all N → any single failure blocks writes. Require just 1 → reads may not see the write. Quorums give you a tunable middle ground: pick W and R such that W + R > N to guarantee read-write overlap, while tolerating up to N − max(W, R) failures.

## Core Intuition

Three friends collectively own a shared notebook. To write, you tell at least 2. To read, you ask at least 2. Since 2 + 2 > 3, any "tell" and any "ask" share at least one friend — so the asker hears the latest news. The overlap is what makes the system work.

## Formal Definition

For N replicas:
- **W (write quorum)** — replicas a write must reach to be acknowledged.
- **R (read quorum)** — replicas a read must consult.
- **N (replication factor)** — total replicas holding the data.

**Quorum overlap condition:** $W + R > N$

This guarantees that any read quorum and any write quorum share at least one replica. That shared replica has seen the latest committed write.

**Strict quorum** = the math above (Dynamo, Cassandra).
**Majority quorum** = $W = R = \lceil (N+1)/2 \rceil$ — used in consensus.

## Internal Mechanics

**Write path:**
1. Client sends write to all N replicas in parallel.
2. Waits for W acknowledgments.
3. Reports success.

**Read path:**
1. Client sends read to all N replicas (or until R respond).
2. Compares versions from R replicas.
3. Returns the latest value.
4. Optionally repairs stale replicas inline (read repair).

**Common configurations:**
- N=3, W=R=2 → tolerates 1 failure, balanced.
- N=5, W=R=3 → tolerates 2 failures.
- N=3, W=3, R=1 → fast reads, slow writes, no write fault tolerance.
- N=3, W=1, R=3 → fast writes, slow reads, no read fault tolerance.

## Mathematical Foundations

Given N replicas with W write quorum and R read quorum:

- **Write availability:** ≥ W replicas alive — tolerates $N - W$ failures.
- **Read availability:** ≥ R replicas alive — tolerates $N - R$ failures.
- **Overlap guaranteed iff $W + R > N$.**

For balanced fault tolerance: $W = R = \lceil (N+1)/2 \rceil$.

With N=2F+1: tolerates F failures.

## Architecture Diagrams

```
N=5 replicas, W=3, R=3:

Write quorum (any 3):       Read quorum (any 3):
  [N1] [N2] [N3]              [N3] [N4] [N5]
   ✓    ✓    ✓                 ?    ?    ?

                  ↓ overlap on N3
            (the read sees the write)
```

## Design Tradeoffs

**Higher W:** more durable writes, slower writes, less write availability.
**Higher R:** stronger consistency, slower reads, less read availability.
**W=R=N:** maximally consistent; any failure stops the system.
**W=R=1:** maximally available; no consistency guarantee.

## Real Production Examples

- **Apache Cassandra** — tunable per query: `ONE`, `QUORUM`, `LOCAL_QUORUM`, `ALL`.
- **DynamoDB** — eventually consistent (R=1) by default; strongly consistent reads use higher R.
- **Riak** — `r` and `w` parameters per request.
- **Raft / Paxos** — use majority quorums for consensus operations.
- **etcd** — Raft-based; majority quorum required for writes.

## Interview Perspective

**Common questions:**
- "Explain W + R > N." → Quorum overlap guarantees any read meets at least one replica with the latest write.
- "Is W=3 + R=3 in N=5 linearizable?" → Not strictly. Concurrent writes during read-repair can violate linearizability. True linearizability requires LWT (lightweight transactions via Paxos).
- "What's a sloppy quorum?" → Under partition, W writes include substitutes not in the home replica set. Surrogates hold data temporarily; delivered via [[Hinted Handoff]].

**Senior-level:**
- Quorums give last-write-wins consistency with overlap, not linearizability. The gap matters for correctness-critical operations (locks, uniqueness).
- The right W and R depend on workload. LOCAL_QUORUM confines quorum to one DC — avoids WAN latency.
- Quorum ≠ consensus. Quorum is a primitive (overlap math). Consensus is a protocol (Paxos/Raft) built on quorums plus safety properties.

**Common mistakes:**
- Believing W+R>N gives linearizability.
- Setting W=N "for safety" — kills write availability.
- Confusing quorum with consensus.

## Related Concepts

- [[Leaderless Replication]] — uses quorums.
- [[Consistency Models]] · [[Linearizability]] — quorums implement weaker points.
- [[Anti-Entropy]] · [[Read Repair]] · [[Hinted Handoff]] — convergence mechanisms paired with quorums.
- [[Consensus]] — uses majority quorums for safety.
- [[CAP Theorem]] — quorum systems are CP or AP depending on tuning.

## Misconceptions

- **"W+R>N gives strong consistency."** Gives LWW consistency with overlap, not linearizability.
- **"Higher W is always safer."** Trades durability for availability. W=N means any one failure blocks writes.
- **"Quorum and consensus are the same."** Quorum is a primitive; consensus is a protocol that uses quorums + additional safety.

## Failure Scenarios

- **Sloppy quorum** under partition — temporarily violates strict overlap; recovered via hinted handoff.
- **Concurrent writes during read repair** — race condition violating linearizability.
- **Slow tail replica** — waiting for the slowest of W dominates latency. Mitigation: hedged requests.

## Practical Engineering Heuristics

- **Default to N=3, W=R=2** for balanced fault tolerance + consistency.
- **For globally distributed reads:** use LOCAL_QUORUM to avoid WAN latency.
- **For uniqueness / locks:** use LWT/CAS, not bare quorums.
- **Monitor quorum failures** — high rate signals replica health problems.

## Active Recall Questions

What is a quorum?::The minimum number of nodes that must agree for an operation to succeed. Provides tunable consistency without requiring all replicas.

State the quorum overlap condition.::W + R > N. Guarantees any read quorum and any write quorum share at least one replica.

Why does W+R>N matter?::That shared replica has seen the latest committed write, so the read sees fresh data.

For N=5 with balanced fault tolerance, what's the typical configuration?::W=R=3 (majority quorum). Tolerates 2 failures.

Does W+R>N give linearizability?::No. Gives LWW consistency with overlap. True linearizability requires LWT (Paxos).

What's a sloppy quorum?::Under partition, writes go to W nodes including substitutes not in the home set. Surrogates hold data via [[Hinted Handoff]] until home replicas return.

Difference between quorum and consensus?::Quorum is a primitive (overlap math). Consensus is a protocol (Paxos, Raft) using quorums plus safety properties (no two leaders, no committed-write loss).

## Feynman Test

Given N=5, W=2, R=3, walk through a write and a read. Is consistency guaranteed?

Explain why a quorum read of 2 out of 3 replicas can see stale data if W was 1.

## Mastery Checklist

- **Explain** the quorum overlap condition and consequences.
- **Compare** quorums and consensus.
- **Derive** appropriate N, W, R for a given fault tolerance + consistency need.
- **Critique** "quorum = strong consistency" claims.
- **Design** a Dynamo-style system with explicit quorum choices.

[^DDIA-179]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 179–184.

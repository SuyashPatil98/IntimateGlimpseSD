---
title: Consistency Models
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[CAP Theorem]]"]
related: ["[[Linearizability]]", "[[Eventual Consistency]]", "[[CAP Theorem]]", "[[PACELC]]", "[[Quorums]]"]
builds_toward: ["[[Distributed Transactions]]", "[[CRDTs]]"]
sources:
  - DDIA, Ch. 5 (pp. 161–171), Ch. 9 (pp. 321–354)
  - SDI vol 1, Ch. 6
  - Herlihy & Wing, 1990 (linearizability)
  - Lamport, 1979 (sequential consistency)
tags: [distributed-systems, consistency, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Consistency Models

## Executive Summary

A **consistency model** is the contract between a distributed storage system and its clients about which values reads may return given concurrent writes. Models form a hierarchy from **strongest** (linearizability — looks like a single machine) to **weakest** (eventual — replicas eventually agree, with no time bound). Stronger models cost latency and availability; weaker models shift complexity to the application. Most production systems are **tunable per operation** — picking one model for the entire system is usually a mistake.

## Why This Exists

On a single machine, "what should this read return?" is obvious: the latest write. In a distributed system with replicas, the answer is ambiguous — different replicas may have different states; writes may be in flight; the network may be slow. Without a stated model, every read becomes a gamble. Consistency models give applications a precise contract: which anomalies are forbidden, and which the app must handle.

## Core Intuition

Treat consistency models as a **menu**, not a ladder you must climb:

- **Linearizability:** "Pretend it's a single machine. Every read sees every write that completed before it started, instantly, everywhere." Most intuitive, most expensive.
- **Sequential:** "All clients agree on the order of operations, but the order doesn't have to match real time."
- **Causal:** "If A caused B, everyone sees A before B. Independent ops can be reordered."
- **Eventual:** "If you stop writing, eventually everyone agrees. No timeline."

Pick is a trade-off: pay in latency and availability for stronger guarantees, or pay in application complexity for weaker ones.

## Formal Definition

Classic hierarchy (strongest → weakest):

| Model | Guarantee |
|---|---|
| **Strict consistency** | Reads return the very latest write; requires synchronized clocks and zero latency. **Unattainable in practice.** |
| **Linearizability** | Operations appear to take effect atomically at some moment between invocation and completion, in a single global order consistent with real time. |
| **Sequential consistency** | All clients see operations in the same total order; order need not match real time. |
| **Causal consistency** | Operations related by happens-before are seen in that order by all clients. Concurrent operations may be reordered. |
| **PRAM / FIFO consistency** | Each client's writes are seen in order by every other client. No cross-client ordering. |
| **Eventual consistency** | If writes stop, all replicas converge to the same value. No bounds on convergence time. |

Within these, **session guarantees** are weaker, cheap properties often added as guard rails:

- **Read-your-writes:** a client always sees its own writes.
- **Monotonic reads:** successive reads from a client never see older data than previous reads.
- **Monotonic writes:** a client's writes are applied in the order issued.
- **Writes-follow-reads:** if write w2 follows read r1, w2 is ordered after the write r1 observed.

## Internal Mechanics

How systems implement each model:

- **Linearizability** → consensus (Raft/Paxos), or strict quorums (W + R > N with read repair), or synchronized clocks (Spanner's TrueTime).
- **Sequential** → total order but not real-time. Single-leader systems give it free when reads go through the leader.
- **Causal** → track causal dependencies (vector clocks, version vectors) and defer applying operations until their causes have arrived.
- **Eventual** → convergent merge logic (last-write-wins, CRDTs, vector clocks for conflict detection). No coordination required.

## Architecture Diagrams

```
Cost ↑                    Linearizability  ◀── consensus / strict quorum
                              │
                          Sequential       ◀── single-leader through leader
                              │
                          Causal           ◀── vector clocks
                              │
                  Session guarantees       ◀── client-side tracking
                              │
                          Eventual         ◀── async replication
Cost ↓
```

## Design Tradeoffs

- **Stronger consistency → higher latency.** Every tier above causal typically involves a coordination round-trip.
- **Stronger consistency → lower availability under partition** (see [[CAP Theorem]]).
- **Weaker consistency → application complexity.** App must handle stale reads, conflicting writes, possibly reorder operations.
- **Session guarantees are nearly free.** Read-your-writes adds only client-side bookkeeping (write timestamps), not consensus.

## Real Production Examples

| Model | Systems |
|---|---|
| Linearizable | Spanner, etcd, ZooKeeper, FaunaDB, CockroachDB |
| Sequential | Single-leader DBs (PostgreSQL, MySQL) for reads through leader |
| Causal | COPS, MongoDB causal sessions, Azure Cosmos DB causal level |
| Session | DynamoDB (session tokens), MongoDB |
| Eventual | Cassandra (default), Riak, S3 (historically), CDNs |

## Interview Perspective

**Common questions:**
- "What consistency does X provide?" → Answer at the *operation* level. "Cassandra with QUORUM reads + QUORUM writes is *approximately* linearizable but not strict; for true linearizable use LWT."
- "Why is eventual 'too weak'?" → Reads can go backward: write x=5, read x=5, then read x=3. Session guarantees fix this for single clients.
- "Is read-your-writes a consistency model?" → It's a *session guarantee*. Doesn't constrain what other clients see.

**Senior-level discussion:**
- The naive "strong vs eventual" framing is too coarse. Real systems mix models per operation.
- **Causal consistency** is the sweet spot many systems should target — captures most app invariants without consensus cost.
- "Strong consistency" is ambiguous marketing — always ask: linearizability or sequential? Per-operation or session?

**Common mistakes:**
- Confusing linearizability with [[Serializability]] (transaction property, not single-object).
- Believing "eventual" means "consistent within seconds." It means "consistent eventually if writes stop." No real-time bound.
- Assuming higher consistency is always better. For shopping carts or feeds, the latency cost isn't worth it.

## Related Concepts

- [[Linearizability]] — strongest practical model; CAP's C.
- [[Eventual Consistency]] — weakest practical model; AP systems' default.
- [[CAP Theorem]] — trade-off enforcing this hierarchy *under partitions*.
- [[PACELC]] — extends to latency trade-offs *without* partitions.
- [[Replication]] — the mechanism; consistency is the contract.
- [[Quorums]] — common technique for tunable consistency.
- [[CRDTs]] — eliminate conflict resolution in eventual systems.

## Misconceptions

- **"Eventual = inconsistent."** No — eventual *is* a consistency guarantee, just a weak one.
- **"Linearizability = Serializability."** Different. Linearizability is single-object real-time ordering; serializability is transaction-level.
- **"Strong consistency makes systems correct."** No — multi-object correctness needs transactions, even on a linearizable store.
- **"You pick one consistency level for the system."** Modern systems offer per-operation tunability. Treat consistency as an operation-level knob.

## Failure Scenarios

- **Stale read** in eventual consistency. Mitigation: read-your-writes session guarantee.
- **Reads going backward** in eventual. Mitigation: monotonic reads.
- **Concurrent writes producing conflict** in eventual. Mitigation: LWW with synchronized timestamps, CRDTs, or app merge.
- **Latency spike under linearizable reads** during leader failover (consensus must reach majority). Mitigation: graceful degradation to bounded staleness.

## Practical Engineering Heuristics

- **Financial state, counters that must not double-count, leader election:** linearizability.
- **User-facing reads where stale-by-seconds is fine:** eventual + session guarantees.
- **Multi-step user flows where user must see their own changes:** read-your-writes is usually enough.
- **Social feed, timeline, news:** eventual is fine; users can't tell whether the 7th post arrived 200ms or 2s ago.
- **Default to causal consistency** if your data store offers it — it captures most application invariants at much lower cost than linearizable.

## Advanced Topics

- **PBS (Probabilistically Bounded Staleness):** quantify *how stale* an eventually consistent system actually is in practice.
- **Snapshot isolation** vs **serializability**: separate dimension; orthogonal to single-object consistency.
- **Convergent replication via CRDTs:** how to get eventual + automatic conflict resolution.

## Active Recall Questions

What is the strongest practical consistency model and the weakest?::Strongest: linearizability. Weakest: eventual consistency.

What does causal consistency guarantee?::Operations related by happens-before are seen in that order by all clients. Concurrent operations may be reordered.

Name three session guarantees.::Read-your-writes, monotonic reads, monotonic writes, writes-follow-reads.

Why is "strict consistency" not achievable?::It requires zero-latency communication and globally synchronized clocks — impossible in real distributed systems.

What's the difference between linearizability and serializability?
?
Linearizability: single-object real-time ordering across replicas. Serializability: transaction-level — the result is equivalent to *some* serial execution of transactions. Orthogonal; a system can have one, the other, both, or neither.

How does eventual consistency handle conflicts?
?
Last-write-wins with synchronized timestamps; vector clocks for conflict detection (then app-level merge); CRDTs (data structures with mergeable semantics).

If your application needs the user to see their own writes but doesn't care about other users, what's the cheapest sufficient guarantee?::Read-your-writes (a session guarantee). Doesn't require system-wide consistency; client-side write tracking is enough.

Why is causal consistency often "the sweet spot"?::It captures most real-world invariants (causality is what humans actually care about) but doesn't require consensus or total order — implementable with vector clocks. Much cheaper than linearizable, much more useful than eventual.

## Feynman Test

Explain why eventual consistency is a *guarantee*, not the absence of one.

Compare linearizability and causal consistency. When is the latency saving of causal worth the loss of total order?

You're designing a leaderboard for a game. What's the lowest acceptable consistency model? Defend.

## Mastery Checklist

You should be able to:

- **Explain** the consistency hierarchy and what each level guarantees vs forbids.
- **Compare** session guarantees with full consistency models.
- **Derive** which model is sufficient for a given correctness requirement.
- **Critique** "we have strong consistency" claims for ambiguity.
- **Design** an application that selects per-operation consistency consciously.

[^DDIA-Ch5]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 161–171.
[^DDIA-Ch9]: Designing Data-Intensive Applications, Kleppmann, Ch. 9, pp. 321–354.
[^Herlihy-Wing]: Herlihy & Wing, "Linearizability: A Correctness Condition for Concurrent Objects," 1990.

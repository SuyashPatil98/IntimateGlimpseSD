---
title: Causal Consistency
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consistency Models]]", "[[Vector Clocks]]"]
related: ["[[Linearizability]]", "[[Eventual Consistency]]", "[[Sequential Consistency]]", "[[Vector Clocks]]"]
builds_toward: ["[[CRDTs]]"]
sources:
  - DDIA, Ch. 5 (pp. 186–191), Ch. 9 (pp. 339–344)
  - Lamport, 1978 (happens-before relation)
  - Lloyd et al., 2011 (COPS)
  - Mahajan, Alvisi, Dahlin, 2011 (CAC theorem)
tags: [distributed-systems, consistency, advanced]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Causal Consistency

## Executive Summary

Causal consistency guarantees that operations related by **happens-before** are seen in that order by all clients, while concurrent (independent) operations may be reordered. It captures most application invariants (cause must precede effect) at far lower cost than [[Linearizability]] — implementable via [[Vector Clocks]] without consensus. It's often the **sweet spot** of distributed consistency: stronger than eventual, cheaper than linearizable, and matches human intuition about causality. Mahajan et al. (2011) proved it's the strongest model achievable in an always-available, low-latency system.

## Why This Exists

Eventual consistency allows obviously wrong orderings — a reply appears before the message it's replying to. Linearizability forbids that, but at high cost (round-trip latency per op, CAP-CP). Causal consistency forbids *causality violations specifically* — what humans actually care about — while still allowing concurrent operations to propagate freely without coordination.

## Core Intuition

A chat room with replicated state. If Alice posts "Did you watch the game?" and Bob replies "Yes, amazing!" — those are causally related (Bob's message could only exist because Alice's existed first). Any observer should see Alice's message before Bob's. If Carol posts an unrelated "What's for lunch?" at the same time as Bob's reply, observers may see Bob's and Carol's in either order. Causal consistency forbids the impossible ordering (reply before original) but allows the orderings that *could* have happened.

## Formal Definition

Lamport's **happens-before relation** $\rightarrow$ on operations:
1. If $a$ and $b$ are operations by the same client and $a$ occurred before $b$ in program order, then $a \rightarrow b$.
2. If $a$ is a write and $b$ is a read that sees $a$'s value, then $a \rightarrow b$.
3. Transitive: if $a \rightarrow b$ and $b \rightarrow c$, then $a \rightarrow c$.

Two operations $a$ and $b$ are **concurrent** if neither $a \rightarrow b$ nor $b \rightarrow a$.

A system is **causally consistent** iff: for any two operations $a$ and $b$ where $a \rightarrow b$, every client sees $a$ before $b$. Concurrent operations may be observed in any order, possibly different across clients.

## Internal Mechanics

Implementation typically via **vector clocks** or **version vectors**:

1. Each replica maintains a vector clock `[clock_per_replica]`.
2. On write, the originating replica increments its own counter and tags the write.
3. On replication, the receiving replica buffers writes until all causally prior writes (per the vector clock) have been applied.
4. On read, the client reads from a replica that has applied all writes the client has previously witnessed (tracked via the client's own observed vector clock).

This avoids consensus — replicas apply writes asynchronously, just in the right *causal* order.

## Architecture Diagrams

```
  Client A             Replica 1                 Replica 2
     │                     │                          │
     │── write("X=1") ────→│                          │
     │← ack ──────────────│                          │
     │                     │── async propagate ──────→│
     │                                                │
  Client B reads X ───────────────────────────────────→│
                                                       │
              returns X=1 (causal prereq met)
                                                       │
  Client B writes Y=2 (causally after seeing X=1)      │
              ──────────────────────────────────────→ │
                                                       │
  All replicas must apply X=1 before Y=2.
```

## Design Tradeoffs

**Benefits:**
- Captures invariants humans care about (cause-effect).
- No consensus required → low latency, partition-tolerant (AP under CAP, EL under PACELC).
- Scales horizontally.
- Provably strongest model in an always-available, low-latency system (Mahajan et al. 2011).

**Costs:**
- Vector clocks grow with the number of replicas; can become large in long-lived systems.
- Implementation complexity higher than eventual.
- Concurrent operations still produce conflicts — application or data structure must handle them.

## Real Production Examples

- **COPS** (Lloyd et al., 2011) — research system implementing causal+ consistency at scale.
- **Eiger** — extends COPS for transactions.
- **MongoDB** — *causal sessions* offer causal guarantees within a client session.
- **Azure Cosmos DB** — *causal consistency* is one of five tunable levels.
- **Riak** — uses version vectors; supports causal semantics for conflict detection.
- **AntidoteDB** — research/production system focused on causal+ guarantees.

## Interview Perspective

**Common questions:**
- "Why is causal consistency 'good enough' for most apps?" → It rules out orderings that violate causality (the orderings users notice); concurrent reorderings are usually invisible.
- "Why don't more systems use causal as default?" → Implementation complexity, vector clock growth, and the cultural pull of "strong consistency" marketing.
- "Practical difference between causal and eventual for a social feed?" → Causal guarantees a reply never appears before its parent. Eventual makes no such promise.

**Senior-level:**
- Causal is the **weakest model that captures most app invariants without coordination**. Mahajan et al. proved it's the strongest model achievable in an always-available, low-latency system (the CAC theorem).
- Vector clocks can be replaced with hybrid logical clocks (HLC) for systems with many replicas.
- Session-causal (within-client causality) is much cheaper than full causal across all clients.

**Common mistakes:**
- Conflating causal with sequential consistency. Sequential requires *total* order seen by everyone; causal only requires causally-related ops to be ordered.
- Assuming causal eliminates conflicts. It only constrains *ordering*; concurrent writes still need resolution.

## Related Concepts

- [[Consistency Models]] — places causal between sequential and eventual.
- [[Linearizability]] — strictly stronger; adds real-time order.
- [[Sequential Consistency]] — strictly stronger in different way; adds total order across all clients.
- [[Eventual Consistency]] — strictly weaker; no ordering guarantees.
- [[Vector Clocks]] — canonical implementation primitive.
- [[CRDTs]] — orthogonal but related (conflict resolution, not ordering).

## Misconceptions

- **"Causal = total order."** No — concurrent operations may be reordered across clients. Only causally-related ops have order.
- **"Causal requires consensus."** No — implementable with vector clocks, fully asynchronous.
- **"Causal eliminates conflicts."** No — concurrent writes still produce conflicts; causal just constrains ordering of *related* operations.

## Failure Scenarios

- **Vector clock explosion:** in a system with many short-lived clients, vector clocks grow unboundedly. Mitigation: dotted version vectors, HLC, prune dormant entries.
- **Cross-DC causal lag:** if WAN replication is slow, dependent reads must wait. Mitigation: causal+ models that allow stale reads with explicit causality boundaries.
- **Session loss:** without server-side session tracking, client loses its observed-vector-clock state. Mitigation: persist client tokens.

## Practical Engineering Heuristics

- For social, collaborative, messaging apps: **causal is usually sufficient** if your store supports it.
- For most apps: **causal + read-your-writes** captures 95% of user expectations.
- Where the data structure is naturally causal (comments, replies, timelines): causal aligns with the domain.
- When in doubt between causal and linearizable: try causal first. You'll feel the limit when you hit it (need for unique counter, lock, leader election).

## Active Recall Questions

What does causal consistency guarantee?::Operations related by happens-before are seen in that order by all clients. Concurrent operations may be reordered, possibly differently across clients.

Difference between causal and sequential consistency?::Sequential: a single total order seen identically by all clients. Causal: only causally-related operations are ordered; concurrent ops may be reordered (possibly differently across clients).

How is causal consistency typically implemented?::Vector clocks (or version vectors) per replica. Replicas buffer writes until causal prerequisites have been applied. No consensus required.

Why is causal "the sweet spot"?::It captures most application invariants (cause must precede effect) without consensus, preserving availability and low latency. Mahajan et al. proved it's the strongest always-available, low-latency model.

Can a causally consistent system have conflicting concurrent writes?::Yes. Causal constrains *ordering* of related operations; it does not resolve conflicts between concurrent operations. CRDTs or app-level merge are still needed.

Name a production system supporting causal consistency.::MongoDB (causal sessions), Azure Cosmos DB (causal level), Riak, COPS/Eiger (research), AntidoteDB.

## Feynman Test

Construct a chat-room scenario where eventual consistency produces an obviously-wrong observation, but causal consistency forbids it.

Argue: "Causal consistency is what most engineers actually want when they ask for 'strong consistency.'"

Why is sequential consistency more expensive to implement than causal, given both forbid causality violations?

## Mastery Checklist

- **Explain** the happens-before relation and how it defines causal order.
- **Compare** causal with sequential, linearizable, and eventual.
- **Derive** whether a given execution history is causally consistent.
- **Critique** systems that claim "strong consistency" without specifying which model.
- **Design** an application that uses causal consistency by default and upgrades selectively.

[^Lamport-1978]: Lamport, "Time, Clocks, and the Ordering of Events in a Distributed System," CACM 1978.
[^Lloyd-COPS]: Lloyd et al., "Don't Settle for Eventual: Scalable Causal Consistency for Wide-Area Storage with COPS," SOSP 2011.
[^Mahajan]: Mahajan, Alvisi, Dahlin, "Consistency, Availability, Convergence," 2011.

---
title: Sequential Consistency
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consistency Models]]"]
related: ["[[Linearizability]]", "[[Causal Consistency]]", "[[Consistency Models]]", "[[Replication]]"]
sources:
  - DDIA, Ch. 9 (pp. 322–324)
  - Lamport, 1979 (original definition)
tags: [distributed-systems, consistency, advanced]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Sequential Consistency

## Executive Summary

Sequential consistency, defined by Lamport (1979), requires that **all clients see the same total order of operations**, but the order doesn't have to match real time. It's weaker than [[Linearizability]] (which adds real-time order) and stronger than [[Causal Consistency]] (which doesn't require total order). In modern distributed systems, sequential consistency is largely a *theoretical landmark* — most systems either pay for linearizability or settle for causal/eventual. Understanding it helps interpret older systems, theoretical results, and the precise meaning of "consistency."

## Why This Exists

In the multiprocessor era (1970s–80s), sequential consistency was the gold standard: a cache-coherent shared-memory machine should appear as if all memory operations happened in some single global order. Lamport's 1979 paper formalized this. Modern distributed systems generally need *more* (real-time order = linearizability for correctness-critical paths) or are willing to accept *less* (causal or eventual for scale and availability). Sequential remains useful as a precise term to distinguish "total order without real-time" from stronger or weaker alternatives.

## Core Intuition

Imagine a single queue of operations being applied to a system. Every client agrees on the order operations were applied — they all see the same queue. But the queue's order need not match the real-world order in which clients issued requests: a write issued at noon might be applied after a write issued at 12:01, as long as everyone agrees that's what happened.

## Formal Definition

A history is **sequentially consistent** iff there exists a sequential history $S$ such that:

1. $S$ is equivalent to the observed history (same client-observed results).
2. $S$ respects **program order** — operations issued by the same client appear in $S$ in the order that client issued them.
3. $S$ is a valid sequential execution.

Note: linearizability adds a fourth condition (real-time order across clients). Sequential drops it.

## Internal Mechanics

Sequential consistency is most naturally provided by **single-leader systems**:

- All writes go through a leader, which orders them.
- Reads through the leader see writes in leader-assigned order.
- Reads from followers see writes in the same order (after replication), though possibly stale.

In a single-leader DB like PostgreSQL, reading from the primary gives linearizability; reading from a follower gives sequential (same order as the leader, but not real-time consistent).

## Architecture Diagrams

```
Client A: writes x=1 at real time t=10
Client B: writes y=2 at real time t=5

In Linearizable history:     [y=2, x=1]    (must respect real time)
In Sequentially consistent:  [x=1, y=2] OR [y=2, x=1]
                                  — both legal, as long as
                                  all clients see the SAME one.
```

## Design Tradeoffs

**Benefits:**
- Cheaper than linearizable (no real-time clock or wait).
- Simpler than causal for app reasoning (everyone sees the same order).
- Achievable via single-leader replication without explicit consensus.

**Costs:**
- Still requires a designated ordering authority (leader).
- Doesn't scale as well as causal or eventual.
- Loss of real-time order can confuse external observers ("I wrote at noon; why does the read at 12:30 show no write?").

## Real Production Examples

- **PostgreSQL follower reads** — sequentially consistent (each follower applies the WAL in leader order, but may be behind real time).
- **MySQL replicas** — same pattern.
- **Cosmos DB "consistent prefix" level** — closely related; guarantees writes are seen in some sequential order.

Rarely advertised explicitly; usually called "read replicas with eventual freshness" or similar.

## Interview Perspective

**Common questions:**
- "What's the difference between sequential and linearizable?" → Sequential requires total order; linearizable requires total order AND real-time precedence. Linearizable is strictly stronger.
- "Where do you see sequential consistency in practice?" → Follower reads from single-leader DBs.

**Senior-level:**
- Sequential is rarely a design *target*. It's usually an emergent property of single-leader replication when reads don't go through the leader.
- The distinction matters for theoretical reasoning — Attiya–Welch latency lower bounds differ between sequential and linearizable.
- Marketing-wise, "strong consistency" almost always means linearizable, not sequential. If precise, ask which.

**Common mistakes:**
- Treating sequential as synonymous with linearizable. They differ on the real-time clause.
- Treating sequential as synonymous with [[Serializability]] (transaction-level vs single-object).

## Related Concepts

- [[Linearizability]] — strictly stronger; adds real-time.
- [[Causal Consistency]] — strictly weaker; drops total order.
- [[Consistency Models]] — places sequential in the hierarchy.
- [[Replication]] — single-leader replication produces sequential follower reads.

## Misconceptions

- **"Sequential = linearizable."** No — sequential lacks the real-time clause.
- **"Sequential = serializable."** Different. Serializable is a transaction-level property.
- **"Sequential is what 'consistent' usually means in product docs."** Usually it means linearizable (when used precisely) or "we hope it converges fast" (when used loosely).

## Failure Scenarios

- **Sequential reads appearing 'old':** a client writes at noon, then reads from a sequentially consistent follower at 12:30 and sees no write because the follower is lagging. Counter-intuitive but legal under sequential semantics. Mitigation: read-your-writes session guarantee, or read from leader.

## Practical Engineering Heuristics

- Treat follower reads as sequentially consistent by default; document this explicitly so consumers know.
- If you need real-time order, route through the leader (linearizable) or use synchronized clocks.
- "Sequential" is the precise word for what most single-leader systems offer; use it when discussing replica reads.

## Active Recall Questions

What does sequential consistency guarantee?::All clients see the same total order of operations, but the order doesn't have to match real time. Each client's own operations appear in program order (the order it issued them).

What does sequential consistency lack compared to linearizability?::The real-time precedence clause: under linearizability, if op A completes before op B begins (in real time), A must precede B in the order. Sequential drops this.

How is sequential consistency typically achieved in production?::Single-leader replication. All writes go through a leader that orders them; followers apply the log in leader order, producing sequential semantics for follower reads.

Why is sequential consistency rarely a design target today?::Most systems either need linearizability (for correctness-critical ops) or accept causal/eventual (for scale/availability). Sequential is more an emergent property of single-leader systems than a chosen target.

Compare sequential and causal consistency.::Sequential: total order, seen identically by all clients. Causal: only causally-related operations are ordered; concurrent ops may be reordered, possibly differently across clients.

Compare sequential consistency and serializability.::Sequential is a single-object property about operation ordering across replicas. Serializability is a transaction-level property: the result is equivalent to *some* serial execution of transactions. They're independent.

## Feynman Test

Construct an execution history that is sequentially consistent but NOT linearizable. Explain what makes it pass sequential and fail linearizable.

In a single-leader DB, why are follower reads sequentially consistent but not linearizable?

## Mastery Checklist

- **Explain** sequential consistency and contrast with linearizability and causal.
- **Compare** the implementation costs of each.
- **Derive** which model a given execution history exhibits.
- **Critique** systems claiming "strong consistency" — which model do they actually implement?
- **Design** a read-replica architecture and characterize its consistency precisely.

[^Lamport-1979]: Lamport, "How to Make a Multiprocessor Computer That Correctly Executes Multiprocess Programs," IEEE Trans. Computers, 1979.

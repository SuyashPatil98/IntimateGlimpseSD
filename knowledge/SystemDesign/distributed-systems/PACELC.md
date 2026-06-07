---
title: PACELC
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[CAP Theorem]]", "[[Consistency Models]]"]
related: ["[[CAP Theorem]]", "[[Linearizability]]", "[[Eventual Consistency]]", "[[Latency vs Throughput]]"]
builds_toward: ["[[Distributed Transactions]]"]
sources:
  - DDIA, Ch. 9 (referenced)
  - Abadi, 2012 (original paper)
  - system-design-primer (Donne Martin)
tags: [distributed-systems, consistency, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# PACELC

## Executive Summary

PACELC extends the [[CAP Theorem]] to address its critical blind spot: CAP says nothing about what happens *when there's no partition*. PACELC (Abadi, 2012) states: **if a Partition occurs, choose Availability or Consistency (PA/PC); Else, choose Latency or Consistency (EL/EC)**. The second clause matters more day-to-day, because real networks are partitioned only rarely; the latency-vs-consistency trade-off is paid on *every* operation.

## Why This Exists

CAP is correct but narrow. It applies only during partitions. In healthy operation — which is most of the time — a distributed system still faces a trade-off: synchronously coordinate for consistency (paying latency) or asynchronously propagate for speed (paying staleness). CAP is silent on this trade-off, which obscures the choice systems are actually making. PACELC names it explicitly.

## Core Intuition

Two regimes. **Partition mode:** the CAP trade-off — pick A or C. **Normal mode:** the latency trade-off — pick L (fast, eventually consistent) or C (slow, strongly consistent). A system's PACELC class is a tuple: how it behaves in each regime.

The key insight: a system designed PA/EL is **not** the same as PA/EC, even though both are PA. The "else" half is where the system spends 99% of its life.

## Formal Definition

A system's PACELC classification has four canonical points:

| Class | Under partition | Else (normal op) | Example |
|---|---|---|---|
| **PA/EL** | Available (stale OK) | Latency-optimized | Cassandra (default), DynamoDB, Riak |
| **PC/EC** | Consistent (minority unavailable) | Consistency-optimized | Spanner, etcd, HBase, FaunaDB |
| **PA/EC** | Available | Consistency-optimized | MongoDB with majority concerns |
| **PC/EL** | Consistent | Latency-optimized | Rare; design tension |

## Internal Mechanics

The "else" trade-off (EL vs EC) is fundamentally about **synchronous vs asynchronous replication**:

- **EL systems** allow writes to commit before all replicas acknowledge. Reads can return slightly stale data. Latency = one local replica round-trip.
- **EC systems** require a quorum or full sync before commit. Reads are linearizable but pay a coordination round-trip. Latency = quorum/consensus round-trip.

This is the Attiya–Welch lower bound from [[Linearizability]] — once you've chosen EC, the latency floor is fundamental, not implementation-dependent.

## Architecture Diagrams

```
                 ┌────── Partition? ──────┐
                 │                        │
              YES│                        │NO (~99% of the time)
                 ▼                        ▼
          ┌──────────┐              ┌──────────┐
          │  PA  PC  │              │  EL  EC  │
          └──────────┘              └──────────┘
           "CAP half"               "PACELC's addition"

       Cassandra:    PA / EL    (available + low-latency)
       Spanner:      PC / EC    (consistent in both regimes)
       MongoDB:      PA / EC*   (* depends on read/write concern)
       DynamoDB:     PA / EL    (default; EC opt-in per op)
```

## Design Tradeoffs

**EL benefits:** lower latency on every operation; higher throughput; lower cost (no coordination infrastructure).
**EL costs:** stale reads; conflict handling complexity in the application.

**EC benefits:** simplest mental model; strongest correctness; no app-level conflict logic.
**EC costs:** round-trip latency on every operation; harder to scale; lower availability under any disruption.

**The hidden truth:** most "we have strong consistency" claims are PC/EC choices made implicitly. Most "we are highly available" claims are PA/EL. Knowing this lets you cost the choice in latency-millisecond terms, not abstract guarantees.

## Real Production Examples

- **Cassandra:** PA/EL by default. Tunable to PA/EC for QUORUM ops, or PC/EC via LWT (lightweight transactions).
- **DynamoDB:** PA/EL default. Strongly consistent reads (PA/EC for that op) cost ~2× per RCU.
- **Google Spanner:** PC/EC globally. TrueTime makes partitions rare enough that PC's availability cost is negligible.
- **HBase:** PC/EC. Region servers fail over; minority side becomes unavailable.
- **etcd:** PC/EC. Used precisely *because* of strict consistency in all modes.
- **MongoDB:** PA/EC by default (v4+ with majority read/write concern). Tunable down to PA/EL.

## Interview Perspective

**Common questions:**
- "What's the difference between CAP and PACELC?" → CAP covers only the partition case. PACELC adds the more common (non-partition) latency trade-off. Day-to-day, EL/EC is what you're paying for.
- "Classify system X in PACELC." → Cassandra: PA/EL. Spanner: PC/EC. DynamoDB: PA/EL with per-op overrides. MongoDB: PA/EC.
- "Why isn't PACELC more famous than CAP?" → CAP came first (2000), shorter, easier to teach. PACELC (2012) is more accurate but harder to remember. Use PACELC for design decisions, cite CAP for broad communication.

**Senior-level discussion:**
- The EL/EC choice often dominates user-perceived latency. A 100ms cross-region quorum round-trip vs <5ms local replica read is the difference between "snappy" and "laggy."
- PACELC is per-operation, not per-system. Modern systems offer tunable points. Treat your design as a portfolio of operation-level PACELC choices.
- Spanner's "global linearizability with high availability" is consistent with PC/EC — Spanner engineered partitions out of frequency, not out of theory.

**Common mistakes:**
- Calling Cassandra "AP" without the L/C qualifier. PA/EL is the full classification.
- Assuming PA/EL and PA/EC are similar. They are very different in practice.
- Conflating "strong consistency" with linearizability vs serializability. PACELC's C is linearizability (same as CAP's C).

## Related Concepts

- [[CAP Theorem]] — the partition half of PACELC.
- [[Linearizability]] — the formal definition of C in PACELC.
- [[Eventual Consistency]] — what choosing EL gets you.
- [[Latency vs Throughput]] — what EL is buying.
- [[Consistency Models]] — places PACELC's C in the broader hierarchy.

## Misconceptions

- **"PACELC replaces CAP."** It extends. CAP is still correct; PACELC adds the missing else-clause.
- **"PA always implies EL."** No — PA/EC exists.
- **"PC always means slow."** Not necessarily. Spanner is PC/EC but keeps latency under tens of ms globally via TrueTime.
- **"PACELC is one choice per system."** Modern systems are tunable per operation.

## Failure Scenarios

- **Misclassifying your system:** team thinks they're PA/EL, but a sync replication option silently makes them PA/EC, doubling latency. Mitigation: explicit per-operation classification in design docs.
- **Cross-region EC under WAN failure:** an EC system across continents pays WAN round-trip latency even when no partition occurs. Mitigation: use local quorums when global consistency isn't needed.
- **Hidden EC paths:** a system advertised as EL has a counter/sequence operation requiring consensus. That one path is EC and may bottleneck the whole system.

## Practical Engineering Heuristics

- For user-facing reads: **PA/EL** default. Pay EC only if correctness demands it.
- For money, locks, leader election: **PC/EC**.
- Reason about systems per operation, not as monoliths.
- Quantify the EL/EC choice in milliseconds, then in dollars (cross-region traffic), then in user impact (p99 latency). Most decisions become obvious.

## Active Recall Questions

What does PACELC stand for?::If Partition: Availability or Consistency. Else: Latency or Consistency.

Who proposed PACELC and when?::Daniel Abadi, 2012, in response to perceived gaps in CAP.

What's the key blind spot in CAP that PACELC addresses?::CAP only covers behavior under partition. It says nothing about the latency-vs-consistency trade-off when the network is healthy — which is most of the time.

Classify Cassandra in PACELC notation.::PA/EL by default. Available under partition; low-latency in normal operation. Tunable per operation.

Classify Spanner in PACELC notation.::PC/EC. Consistent in both regimes. Spanner engineers partitions to be rare; doesn't violate the theorem.

Why is the EL/EC choice often more impactful than the PA/PC choice?
?
Partitions are rare (minutes per year in a healthy datacenter), but every operation pays the EL/EC trade-off. A 100ms EC overhead vs 2ms EL is paid millions of times per day; partition behavior is paid once per quarter.

Name a system that's PA/EC.::MongoDB with majority read/write concerns is approximately PA/EC. Some Cosmos DB configurations also approximate this.

## Feynman Test

Explain PACELC to someone who knows CAP. What does PACELC add? What does it preserve?

Argue why most production "we have strong consistency" claims are PC/EC choices made implicitly, and propose how to make the choice explicit.

## Mastery Checklist

- **Explain** the four PACELC points with concrete examples.
- **Compare** CAP and PACELC, identifying CAP's blind spot.
- **Derive** a system's PACELC classification by observing its read/write behavior.
- **Critique** "we are highly available" claims that don't specify EL or EC.
- **Design** a service that selects PACELC points per operation, costed in milliseconds.

[^Abadi-PACELC]: Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design," IEEE Computer, 2012.

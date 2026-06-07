---
title: Linearizability
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consistency Models]]", "[[Replication]]"]
related: ["[[CAP Theorem]]", "[[Consensus]]", "[[Quorums]]", "[[Serializability]]", "[[Eventual Consistency]]"]
builds_toward: ["[[Distributed Transactions]]"]
sources:
  - DDIA, Ch. 9, pp. 321–334
  - Herlihy & Wing, 1990 (original paper)
  - Attiya & Welch, 1994 (latency lower bound)
tags: [distributed-systems, consistency, advanced]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Linearizability

## Executive Summary

Linearizability is the strongest single-object consistency model: operations appear to take effect **atomically at some instant between invocation and completion**, in a global order consistent with real time. To a client, a linearizable system is **indistinguishable from a single machine**. This guarantee requires synchronous coordination (consensus or strict quorums) — it has a latency floor of one network round-trip — but is necessary anywhere correctness depends on "what is the latest value": locks, leader election, uniqueness, monotonic counters, money.

## Why This Exists

Without linearizability, distributed systems exhibit anomalies that break naive intuition: values appear to move backwards; two clients both believe they hold a lock; a "successful" write becomes invisible to subsequent reads. Linearizability eliminates these anomalies so the application can reason about distributed state as if it were local memory. The cost is latency and availability, but for correctness-critical operations it's the only safe choice.

## Core Intuition

Each linearizable operation has an *effective instant* somewhere between its invocation and completion. **All clients agree on the order of these instants**, and the order matches real time wherever real time is observable.

The clearest behavioral test: in a linearizable system, you can never observe a value *moving backwards*. Once a newer value has been read by anyone, no client may subsequently see an older value.

## Formal Definition

Given a concurrent execution history H, the history is **linearizable** iff there exists a sequential history S such that:

1. S is equivalent to H (same operations, same client-observed results).
2. S respects the real-time partial order of H: if op1 *completes* before op2 *invokes*, op1 precedes op2 in S.
3. S is a valid sequential execution (each operation reads what the previous one wrote).

Equivalently: every operation has an *effective instant* within its invocation–completion interval, and the global order of these instants is consistent with all observed outcomes.

## Internal Mechanics

Real systems realize linearizability via:

1. **Single-leader with synchronous replication** — all writes go through the leader; reads also go through the leader (or wait for leader confirmation). Simple but the leader is a bottleneck and SPOF.
2. **Consensus protocols (Raft, Paxos, ZAB)** — operations are committed by majority quorum; the consensus log is the global order.
3. **Strict quorums (W + R > N)** with read repair — write to W replicas, read from R replicas, ensure overlap. Used by Dynamo-style systems for *approximate* linearizability (edge cases under concurrent writes).
4. **Synchronized clocks (Spanner's TrueTime)** — assign globally meaningful timestamps; commits wait out clock uncertainty.

## Architecture Diagrams

```
Real time →

Client A:    [---write x=1---]
Client B:                            [-read x-]   must return ≥1
Client C:                  [---write x=2---]
Client D:                                       [-read x-]   must return 2
                                                 (can never return 1 again)
```

Any total order respecting the real-time precedence constraints (A→B, C→D, A→C since A completes before C invokes) is a valid linearization.

## Mathematical Foundations

**Attiya–Welch lower bound (1994):** for any linearizable distributed register with $n$ replicas and message-passing delay bound $d$:

$$\text{read latency} + \text{write latency} \geq d$$

This means **linearizability has a latency floor of one network round-trip**, independent of implementation. You cannot engineer your way past it; you can only choose how to spend the budget (e.g., fast reads + slow writes, or balanced).

## Design Tradeoffs

**Benefits:** simplest mental model for app developers; eliminates anomalies; enables distributed locks and leader election; correctness invariants become local reasoning.

**Costs:**
- **Latency:** unavoidable round-trip per operation (Attiya–Welch).
- **Availability:** [[CAP Theorem]] — linearizable systems are CP. Quorum loss → unavailability.
- **Throughput:** coordination serializes; harder to scale horizontally.

**Hidden complexity:** linearizability is *per object*. A linearizable key-value store doesn't give transactional safety across multiple keys. For that, you need [[Serializability]].

## Real Production Examples

- **etcd, ZooKeeper, Consul** — linearizable KV stores for coordination (leader election, config, locks).
- **Google Spanner, CockroachDB, FaunaDB** — linearizable distributed SQL via consensus + tight clocks.
- **PostgreSQL with sync replication** — linearizable reads from primary.
- **Cassandra LWT (lightweight transactions)** — Paxos-based linearizable CAS for select operations; everything else is eventual or quorum.
- **Dynamo-style QUORUM+QUORUM** — *almost* linearizable but edge cases (concurrent writes during read-repair) break it.

## Interview Perspective

**Common questions:**
- "When do you actually need linearizability?" → Locks, leader election, uniqueness (usernames), counters that must not double-count, money.
- "Is QUORUM read + QUORUM write in Cassandra linearizable?" → No, not strictly. Read-repair races and concurrent writes can produce non-linearizable histories. Use LWT for true linearizability.
- "How does Spanner achieve global linearizability?" → TrueTime gives bounded clock uncertainty. Transactions wait out the uncertainty window (commit-wait) before acknowledging, ensuring real-time order globally.

**Senior-level discussion:**
- Cost is *fundamental* (Attiya–Welch), not implementation-dependent. Don't pay it if you don't need it.
- Common trap: assuming "strong consistency" means linearizable across multiple keys. It usually doesn't — it's per-object only.
- Linearizable across regions costs WAN round-trips. For global apps, this is often the highest-impact latency line item.

**Common mistakes:**
- Confusing with [[Serializability]] (transaction-level, not single-object).
- Thinking quorum reads/writes always give linearizability (they don't, without proper coordination).
- Designing application to rely on linearizability when sequential or causal would suffice.

## Related Concepts

- [[CAP Theorem]] — defines linearizability as its C.
- [[Consistency Models]] — places linearizability at the top of the hierarchy.
- [[Consensus]] — most common implementation mechanism.
- [[Quorums]] — alternative implementation strategy.
- [[Serializability]] — orthogonal transaction-level property; often confused.
- [[Eventual Consistency]] — opposite end of the spectrum.

## Misconceptions

- **"Linearizability = Serializability."** Different. Linearizability is single-object real-time ordering. Serializability is transaction-level. A linearizable system without transactions can still produce inconsistent multi-object states.
- **"Atomic = linearizable."** Atomic typically means "all-or-nothing" (ACID atomicity). Linearizable is about real-time ordering across replicas.
- **"Quorum reads/writes always give linearizability."** No — Dynamo-style W+R>N has edge cases (concurrent writes, read repair) that break linearizability.
- **"Linearizable systems are always slow."** They have a latency floor (round-trip), but well-engineered systems can be fast for many workloads — just not as fast as eventually consistent ones.

## Failure Scenarios

- **Network partition** → minority side becomes unavailable (CP).
- **Slow leader** → reads stall waiting for confirmation.
- **Clock skew** (Spanner-style) → if TrueTime uncertainty grows, commit latency increases (commit-wait gets longer).
- **Stale leader serving reads** — partitioned leader doesn't know it's been deposed, serves stale data. Mitigation: leader leases shorter than partition detection time.

## Practical Engineering Heuristics

- Linearizability for: **locks, leader election, uniqueness, monotonic counters, money, anything correctness-critical.**
- Not linearizability for: **user-facing reads where stale-by-seconds is fine** (profiles, feeds, search results, recommendations).
- If you think you need linearizability across multiple keys, you actually need **[[Distributed Transactions]]** — different problem, different tools.
- Cost it. A linearizable read in a typical cloud setup is 10–100ms vs <1ms for eventually consistent. Multiply by your request rate.

## Active Recall Questions

What's the informal definition of linearizability?::A linearizable system is indistinguishable from a single machine: each operation appears to take effect instantly at some moment between invocation and completion, and all clients agree on the order.

If a read returns a value, what does linearizability promise about subsequent reads?::No subsequent read may return an older value. Once a value has been observed, that value (or a newer one) must be returned by every later read.

Name three workloads that require linearizability.::Distributed locks, leader election, uniqueness constraints (e.g., unique usernames), monotonic counters, financial state.

Is QUORUM read + QUORUM write in Cassandra linearizable?::Not strictly. Concurrent writes and read-repair create edge cases that violate linearizability. Cassandra offers LWT (Paxos-based) for true linearizability when needed.

How does Spanner achieve global linearizability without unbounded latency?::TrueTime API exposes bounded clock uncertainty ε. Transactions wait out the uncertainty window (commit-wait of 2ε in expectation) before acknowledging, ensuring real-time order across globally distributed replicas.

What's the difference between linearizability and serializability?
?
Linearizability is a single-object real-time ordering property. Serializability is a transaction-level property requiring the result to equal *some* serial execution. They are independent: a system can have one without the other.

What's the latency lower bound for linearizable operations, and who proved it?::Attiya & Welch (1994): read latency + write latency ≥ network round-trip time. Fundamental; cannot be engineered past.

## Feynman Test

Construct a non-linearizable history with three clients and one register. Explain what makes it non-linearizable.

Why does the latency floor exist for linearizability? What does Attiya & Welch's result say in plain English?

You have a globally distributed user service. Product wants "strong consistency" for username uniqueness. Walk through the implementation choices — what does "strong" actually mean here, and what's the cost?

## Mastery Checklist

You should be able to:

- **Explain** linearizability without formal notation, using a real-time order example.
- **Compare** it to sequential consistency, causal consistency, and [[Serializability]].
- **Derive** whether a given execution history is linearizable by checking real-time precedence.
- **Critique** systems that claim "strong consistency" without specifying which model.
- **Design** a service that uses linearizability for the minimal critical path and weaker models elsewhere.

[^DDIA-321]: Designing Data-Intensive Applications, Kleppmann, Ch. 9, pp. 321–334.
[^Herlihy-Wing]: Herlihy & Wing, "Linearizability: A Correctness Condition for Concurrent Objects," 1990.
[^Attiya-Welch]: Attiya & Welch, "Sequential consistency versus linearizability," 1994.

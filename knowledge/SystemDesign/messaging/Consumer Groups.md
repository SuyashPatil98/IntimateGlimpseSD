---
title: Consumer Groups
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Kafka Architecture]]", "[[Topics and Partitions]]"]
related: ["[[Kafka Architecture]]", "[[Topics and Partitions]]", "[[Backpressure]]"]
sources:
  - DDIA, Ch. 11
  - Kafka docs
tags: [messaging, kafka, consumers]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Consumer Groups

## Executive Summary

A **consumer group** in Kafka is a **set of consumers that cooperatively read from a topic** — each partition assigned to exactly one consumer in the group. Enables **horizontal scaling of consumption** (more consumers = more parallelism, up to partition count) and **multi-consumer fan-out** (different groups receive the same data independently). The combination of topic partitioning + consumer groups is what makes Kafka's "queue vs pub/sub" choice configurable per use case.

## Why This Exists

Single-consumer designs don't scale. Multi-consumer designs require coordinated partition assignment to avoid duplicate processing. Consumer groups encapsulate this: developers declare a group ID; Kafka handles assignment, rebalancing, and offset tracking.

## Core Intuition

A team of librarians sorting incoming books by alphabetical bins. Each librarian assigned 2 bins. New librarian joins → reassign bins. Librarian leaves → reassign their bins. The team coordinates so no two librarians process the same bin (duplicate work) and no bin is unassigned.

## Internal Mechanics

**Group coordination:**
- Each group has a coordinator broker (one of the brokers).
- Coordinator tracks group membership and partition assignments.

**Joining:**
1. Consumer sends JoinGroup to coordinator.
2. Coordinator picks a leader (one of the consumers).
3. Leader computes partition assignment.
4. Coordinator distributes assignment.

**Heartbeat:**
- Each consumer sends heartbeat to coordinator.
- Missed heartbeats → consumer kicked from group → rebalance.

**Offset tracking:**
- Group commits offsets per partition per topic.
- Stored in internal `__consumer_offsets` topic.
- On restart: pick up where left off.

**Rebalance:**
- Triggered by membership change.
- During rebalance: brief pause in consumption.
- Modern Kafka: incremental cooperative rebalancing reduces disruption.

## Architecture Diagrams

```
Topic: orders (6 partitions)

Group A (3 consumers):
  Consumer A1 ← P0, P1
  Consumer A2 ← P2, P3
  Consumer A3 ← P4, P5

Group B (6 consumers):
  Consumer B1 ← P0
  Consumer B2 ← P1
  ...
  Consumer B6 ← P5

Both groups receive all messages independently.
Within a group, each partition consumed by one consumer.
```

## Design Tradeoffs

**Benefits:**
- Horizontal scaling.
- Multi-tenant via groups.
- Coordinated assignment.
- Automatic failover (consumer death → reassign).

**Costs:**
- Rebalance overhead.
- Offset management subtlety.
- Per-group state in `__consumer_offsets`.

## Real Production Examples

- **One group per microservice** — each service is a consumer group.
- **Analytics + operational + audit** — three independent groups on the same topic.
- **Worker pool** — group with N consumers processing in parallel.

## Interview Perspective

**Common questions:**
- "Consumer groups?" → Set of consumers cooperatively reading from a topic. Each partition assigned to one consumer in the group.
- "Multiple groups same topic?" → Each group reads independently. Pub/sub for groups; queue within groups.
- "Rebalance?" → When membership changes, partitions reassigned. Brief consumption pause.

**Senior-level:**
- Rebalance storms are a real pain point — frequent membership changes cripple throughput.
- Static membership (Kafka 2.3+) reduces unnecessary rebalances.
- Cooperative rebalancing (Kafka 2.4+) only reassigns affected partitions.

**Common mistakes:**
- Too many consumers for too few partitions → idle consumers.
- Aggressive heartbeat / session timeout → spurious rebalances.
- Slow rebalance handler → consumer kicked, more rebalance.

## Related Concepts

- [[Kafka Architecture]] · [[Topics and Partitions]] · [[Backpressure]]

## Misconceptions

- **"More consumers always faster."** Capped at partition count.
- **"Consumer groups are global."** Per topic; same group ID across services is confusing.
- **"Rebalance is instant."** Brief pause; storms compound.

## Failure Scenarios

- **Rebalance storm** under flapping consumers.
- **Stuck consumer** holds partition; can't rebalance.
- **Offset commit failure** → reprocessing on restart.

## Practical Engineering Heuristics

- **One group ID per microservice / use case.**
- **Use static membership** to reduce rebalance.
- **Cooperative rebalancing** in modern Kafka.
- **Monitor consumer lag** per partition per group.
- **Set session.timeout > expected GC pause.**

## Active Recall Questions

What's a consumer group?::Set of consumers that cooperatively read a topic. Each partition assigned to exactly one consumer in the group.

What happens when a consumer joins a group?::Triggers rebalance. Coordinator reassigns partitions across members.

How does multi-consumer fan-out work in Kafka?::Use different consumer groups on the same topic. Each group reads independently.

Why does adding consumers beyond partition count not increase throughput?::Each partition consumed by at most one consumer in a group. Extra consumers idle.

What's a rebalance storm?::Frequent membership changes triggering repeated rebalances. Cripples throughput. Mitigations: static membership, cooperative rebalancing.

What's static membership?::Consumer rejoining with same ID skips full rebalance. Reduces churn during deploys.

## Feynman Test

Walk through what happens when a consumer in a group of 4 crashes. How do partitions get reassigned?

Why does running 6 consumers in a group on a 3-partition topic waste 3 consumers?

## Mastery Checklist

- **Explain** consumer groups and partition assignment.
- **Compare** queue and pub/sub semantics via groups.
- **Derive** consumer count for given partition count.
- **Critique** designs causing rebalance storms.
- **Design** consumer groups for a microservice architecture.

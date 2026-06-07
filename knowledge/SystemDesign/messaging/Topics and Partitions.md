---
title: Topics and Partitions
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Kafka Architecture]]"]
related: ["[[Kafka Architecture]]", "[[Consumer Groups]]", "[[Partitioning]]"]
sources:
  - DDIA, Ch. 11
  - Kafka docs
tags: [messaging, kafka, partitioning]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Topics and Partitions

## Executive Summary

In Kafka, a **topic** is a logical category of events; a **partition** is the ordered sub-stream that gives a topic horizontal scalability. **Producers route messages to partitions by key (consistent hash) or round-robin**. **Consumers in a group share partitions** — one consumer per partition per group at most. **Ordering is guaranteed within a partition, not across partitions**. Partition design — count, key choice — is the single most consequential architectural decision in Kafka.

## Why This Exists

A single ordered log can't scale beyond one machine. Kafka splits topics into partitions; each partition is independently ordered, replicated, and consumed. Parallelism comes from partition count. But partitioning sacrifices global ordering — within a partition is ordered; across partitions is not.

## Core Intuition

A bookstore organizing receipts. One huge log would be unwieldy. Splitting by customer ID (key) — receipts for customer X go to bin X. Each bin is ordered (X's receipts in order). But comparing across customers requires merging. Trade global order for per-customer parallelism.

## Internal Mechanics

**Producer partition selection:**
- If message key present → `hash(key) % num_partitions`. Same key → same partition → ordering.
- If no key → round-robin (or sticky batching).

**Partition assignment to consumers:**
- Within a consumer group, each partition is consumed by exactly one consumer.
- If consumers < partitions → some consumers handle multiple partitions.
- If consumers > partitions → extra consumers idle.

**Rebalance:** when a consumer joins/leaves group, partitions are reassigned. Disruption window.

**Partition count:**
- Too few → can't parallelize.
- Too many → metadata bloat, more rebalance overhead.
- Typical: 12-100 per topic.

## Design Tradeoffs

**More partitions:**
- Higher parallelism.
- Higher metadata cost.
- Slower rebalance.

**Fewer partitions:**
- Less parallelism.
- Simpler.

**Key choice determines ordering granularity:**
- Customer ID → orders preserved per customer.
- Random → no useful ordering.
- Constant → all to one partition (defeats purpose).

## Real Production Examples

- **LinkedIn topics:** typically 100s of partitions for high-volume.
- **Per-tenant key:** orders.{tenant_id} → per-tenant ordering.
- **Time-series:** key by sensor_id → per-sensor ordering.

## Interview Perspective

**Common questions:**
- "Why partition a topic?" → Parallelism; horizontal scaling.
- "What's ordering guarantee?" → Within partition only. Across partitions, unordered.
- "How to choose partition key?" → Determines ordering scope; avoid skewed keys.

**Senior-level:**
- Repartitioning is expensive — partition count changes break ordering for keys.
- Adding partitions in production: must be planned; data in existing partitions doesn't redistribute.
- Bad key choice (constant, low-cardinality, skewed) is the most common Kafka mistake at scale.

**Common mistakes:**
- Constant key → all messages on one partition → no parallelism.
- Too few partitions → throughput ceiling.
- Too many partitions → operational pain.
- Changing partition count breaks key→partition mapping.

## Related Concepts

- [[Kafka Architecture]] · [[Consumer Groups]] · [[Partitioning]] · [[Hot Partitions]]

## Misconceptions

- **"Kafka guarantees ordering."** Only within a partition.
- **"More partitions = always better."** Diminishing returns + costs.
- **"Can repartition easily."** Existing data stays in old partitions.

## Failure Scenarios

- **Hot partition** — skewed key; one broker overwhelmed.
- **Partition leader failure** → leader election; brief unavailability.
- **Consumer count > partitions** → idle consumers.

## Practical Engineering Heuristics

- **Choose key for desired ordering scope.**
- **Provision partitions for 2-3× peak throughput / consumer throughput.**
- **Key cardinality should be much higher than partition count.**
- **Monitor partition skew.**
- **Plan for future scale** when setting partition count.

## Active Recall Questions

What's a Kafka topic?::Logical category of events. Split into partitions for scale.

What's a partition?::Ordered sub-stream of a topic. Unit of parallelism and ordering.

How are messages routed to partitions?::By key: `hash(key) % num_partitions`. Without key: round-robin or sticky.

What's the ordering guarantee?::Within a partition only. Across partitions, no guarantee.

Why limit partition count?::Metadata cost, rebalance time, broker memory. Too many partitions degrade operations.

What happens when consumer count exceeds partition count in a group?::Extra consumers sit idle. Parallelism capped by partition count.

## Feynman Test

Walk through what happens if you change a topic's partition count from 10 to 20. What breaks?

Why does choosing a constant partition key defeat the purpose of partitioning?

## Mastery Checklist

- **Explain** topic/partition model and routing.
- **Compare** key strategies.
- **Derive** appropriate partition count.
- **Critique** systems with skewed keys or constant keys.
- **Design** a Kafka topic for given ordering/throughput needs.

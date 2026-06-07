---
title: Partitioning
aliases: [Sharding]
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]"]
related: ["[[Consistent Hashing]]", "[[Hot Partitions]]", "[[Rebalancing]]", "[[Replication]]", "[[Federation]]"]
builds_toward: ["[[Consistent Hashing]]", "[[Distributed Transactions]]"]
sources:
  - DDIA, Ch. 6, pp. 199–237
  - SDI vol 1, Ch. 5
  - system-design-primer (Donne Martin)
tags: [distributed-systems, partitioning, scalability, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Partitioning

## Executive Summary

Partitioning (also called **sharding**) splits a large dataset across multiple nodes so each node holds a *subset*. It's the canonical horizontal scaling technique — used wherever data exceeds what one machine can hold or where read/write load exceeds one machine's throughput. Two fundamental strategies: **key-range partitioning** (each partition holds a contiguous range of keys) and **hash partitioning** (keys are hashed; the hash determines the partition). Partitioning is *orthogonal* to [[Replication]] — most production systems combine both (each partition is itself replicated).

## Why This Exists

[[Replication]] gives availability, read scaling, and durability — but not write scaling or capacity scaling. Every replica holds the full dataset; the entire system's data fits on one machine. To exceed that, you split data across machines. Partitioning is how you scale writes, total storage, and per-machine load past single-machine limits.

## Core Intuition

A library too big for one room. You sort books across rooms. Two approaches:

- **Range partitioning** — Room 1: A–F, Room 2: G–L, etc. Easy to find any book; easy to scan ranges. But "popular letter" rooms get overloaded.
- **Hash partitioning** — Hash each title; assign to a room by hash. Distribution is even, but you can no longer scan "all books starting with A" without visiting every room.

The trade is the same in databases: range gives efficient range scans but risks hot partitions; hash gives even distribution but loses range locality.

## Internal Mechanics

**Key-range partitioning:**
- Partitions hold contiguous key ranges (e.g., partition 1: A–F).
- Boundaries may be auto-adjusted (BigTable, HBase) or manual.
- Supports efficient range scans within a partition.
- Risk: skew. If "M" is hot, the M-range partition is overloaded.

**Hash partitioning:**
- Hash function maps key → partition.
- Distribution is statistically even.
- Range scans require fan-out across all partitions.
- Variants: modulo hashing (`hash(key) % N`), [[Consistent Hashing]], rendezvous hashing.

**Secondary indexes in partitioned systems** — two strategies:
- **Local (document-partitioned):** each partition holds its own index over local data. Reads must fan out. Writes are local.
- **Global (term-partitioned):** index is itself partitioned by term. Reads are targeted. Writes touch multiple partitions.

**Routing:** clients must know which partition holds a given key. Strategies:
- Client-side routing (clients aware of partition map).
- Coordinator/router node (clients send to a router that forwards).
- Gossip-based discovery (any node can route).

## Architecture Diagrams

```
RANGE PARTITIONING:
  ┌────────────┬────────────┬────────────┐
  │  A – F     │   G – L    │   M – Z    │
  │ Partition 1│ Partition 2│ Partition 3│
  └────────────┴────────────┴────────────┘

HASH PARTITIONING:
  hash("Alice")  = 0x7A → Partition 2
  hash("Bob")    = 0x12 → Partition 0
  hash("Carol")  = 0xC4 → Partition 3
  
  ┌────────────┬────────────┬────────────┬────────────┐
  │ Partition 0│ Partition 1│ Partition 2│ Partition 3│
  └────────────┴────────────┴────────────┴────────────┘
```

## Design Tradeoffs

| Strategy | Pros | Cons |
|---|---|---|
| Range | Efficient range scans; intuitive | Hot partitions on skewed access |
| Hash | Even distribution | No range scans without fan-out |
| Consistent hashing | Even + minimal rebalance on node changes | More complex routing |
| Composite (key prefix range + suffix hash) | Locality + balance | Schema-level complexity |

**Hidden trade:** partitioning makes **transactions across partitions** much harder (distributed commit, 2PC). Single-partition transactions are cheap; cross-partition are expensive or unavailable.

## Real Production Examples

- **MongoDB sharded cluster** — both range and hash partitioning configurable per collection.
- **Cassandra** — partition by hash of the partition key; ranges within a partition are sorted (composite design).
- **DynamoDB** — partition by hash of the partition key; supports composite keys.
- **HBase / BigTable** — range partitioning (rows are sorted lexicographically); auto-splits as ranges grow.
- **Vitess (MySQL sharding)** — usually hash by tenant ID.
- **Citus (PostgreSQL extension)** — distribute by hash of a designated column.
- **Kafka** — topics partitioned by hash of message key (or round-robin if no key).

## Interview Perspective

**Common questions:**
- "Range or hash partitioning?" → Depends on access pattern. Range for time-series, hash for KV.
- "How would you shard X?" → Pick a partition key with high cardinality and even access; design routing; plan for rebalancing and cross-partition queries.
- "What's a bad partition key?" → Low cardinality (most data lands on few partitions) or skewed access (one key gets all the load).

**Senior-level:**
- The partition-key choice is the most important schema decision in a scaled system. Bad keys = hot partitions = system-wide pain.
- Most "scaling problems" at large companies are actually partition-key problems. Twitter's celeb-user problem, Discord's giant-server problem, etc.
- Repartitioning is one of the most expensive operations. Design as if you can never change the key.

**Common mistakes:**
- Picking a partition key that creates hot partitions (timestamp, status flag, low-cardinality column).
- Ignoring cross-partition transactions until you discover you need them.
- Sharding too early — operational complexity often exceeds the scaling benefit until ~100GB+ scale.

## Related Concepts

- [[Consistent Hashing]] — preferred hash-partitioning scheme for dynamic node sets.
- [[Hot Partitions]] — the most common skew problem.
- [[Rebalancing]] — moving partitions when capacity changes.
- [[Federation]] — partitioning by *function* rather than data.
- [[Replication]] — orthogonal axis; combined in production.
- [[Distributed Transactions]] — what cross-partition writes need.

## Misconceptions

- **"Sharding = scaling."** Only for the dimensions partitioning addresses (writes, storage). It often hurts query latency for cross-partition operations.
- **"Hash is always better than range."** Range wins for time-series, scans, and ordered iteration. Pick based on access pattern.
- **"Modulo hashing is fine."** Painful when N changes — `hash(k) % N` repartitions everything. Use [[Consistent Hashing]].

## Failure Scenarios

- **Hot partition** — one shard takes all the load while others sit idle. See [[Hot Partitions]].
- **Rebalancing thrash** — operations cluster moves are constantly chasing load shifts. Mitigation: hysteresis, manual triggers.
- **Cross-partition transaction failure** — a 2PC abort cascades, leaving inconsistent state. Mitigation: saga pattern, idempotency.
- **Partition key change required mid-flight** — usually means full data migration. Plan to avoid; if unavoidable, dual-write window.

## Practical Engineering Heuristics

- **Pick the partition key first.** It dictates the system's scale ceiling.
- **High cardinality + even access pattern** = good partition key.
- **Use composite keys** (`tenant_id` + `row_id`) for multi-tenant: locality + balance.
- **Avoid timestamps as partition keys** — concentrates writes on one partition.
- **Test repartitioning** before you need it.

## Active Recall Questions

What is partitioning?::Splitting a dataset across multiple nodes so each holds a subset. Canonical horizontal-scaling technique.

Two fundamental partitioning strategies?::Range partitioning (each partition holds a contiguous key range) and hash partitioning (hash determines partition).

What's a bad partition key?::Low cardinality (most data lands on few partitions) or skewed access (one key gets all the load) — e.g., timestamp, status flag, user-role.

Why is `hash(key) % N` problematic?::When N changes (node added/removed), most keys remap to different partitions — massive data movement. Solved by [[Consistent Hashing]].

How does partitioning interact with replication?::Orthogonal. Each partition is typically replicated across N nodes. Combined: scale (partition) + survive failure (replicate).

What's the hardest operational problem in partitioned systems?::Cross-partition transactions. Single-partition ops are cheap; cross-partition requires distributed commit (2PC) or sagas.

## Feynman Test

Walk through a poorly-chosen partition key scenario where 90% of traffic hits 10% of partitions. How would you fix it?

Explain why repartitioning is the most expensive operation in a distributed database.

## Mastery Checklist

- **Explain** partitioning, range vs hash, and the role of partition keys.
- **Compare** partitioning strategies on scan behavior, balance, and rebalancing cost.
- **Derive** a good partition key for a given workload.
- **Critique** schemas with bad partition keys.
- **Design** a partitioned system including routing, rebalancing strategy, and cross-partition query plan.

[^DDIA-Ch6]: Designing Data-Intensive Applications, Kleppmann, Ch. 6, pp. 199–237.
[^SDI-Ch5]: System Design Interview vol 1, Alex Xu, Ch. 5.

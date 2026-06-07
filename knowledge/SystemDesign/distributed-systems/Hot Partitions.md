---
title: Hot Partitions
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Partitioning]]"]
related: ["[[Partitioning]]", "[[Consistent Hashing]]", "[[Rebalancing]]", "[[Caching]]", "[[Rate Limiting]]"]
sources:
  - DDIA, Ch. 6, pp. 205–207
  - SDI vol 1, Ch. 5
tags: [distributed-systems, partitioning, scalability]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Hot Partitions

## Executive Summary

A **hot partition** (or **hot spot**) is a partition that receives disproportionately more traffic than its peers — load is unbalanced even though data may be balanced. Caused by skewed access patterns (one user, one key, one time range generating the bulk of requests). Hot partitions defeat the whole point of partitioning: the hot node is overloaded while others sit idle. Symptoms: high p99 latency localized to certain partitions, throughput plateaus despite adding nodes. Mitigation requires architecture-level changes — partition keys, request distribution, replication of hot data.

## Why This Exists

Partitioning distributes *data*. It does not distribute *load* if access is skewed. Real-world access patterns are almost always Zipfian — a small number of items get most of the traffic (celeb users, viral posts, current-day data, hot products). Without explicit hot-partition mitigation, the partitioning scheme that worked great at uniform load collapses under realistic skew.

## Core Intuition

You sort customers across 10 service desks by last name. Most customers' names are common; some letters are rare. Desk 7 (M-N) is swamped while Desk 10 (W-Z) sits idle. The work was distributed by *cardinality*, not by *demand*.

In databases: timestamp as partition key → today's partition is hot while last year's is idle. User ID as partition key → if Justin Bieber is a user, his partition is on fire.

## Internal Mechanics

**Causes of hot partitions:**

1. **Low-cardinality partition key** — e.g., status flag, country, year. Few partitions hold most data.
2. **Skewed access** — one key in a high-cardinality partition gets disproportionate traffic. The partition's data distribution is fine; its access pattern isn't.
3. **Time-based partition key** — current time range is always hottest.
4. **Append-only patterns** — writes concentrate at the "end" of a sorted partition.

**Detection:**
- Per-partition request rate metrics.
- Per-partition latency p99.
- CPU/disk utilization variance across nodes.
- Tail latency localized to specific keys.

**Mitigation strategies:**

1. **Better partition key** — high cardinality + uniform access. Often requires schema redesign.
2. **Salt the key** — prepend a random prefix (`{shard}_{user_id}`). Spreads writes across partitions. Reads must scan all salts. Useful for write-heavy hot keys.
3. **Replicate hot data** — duplicate the celeb's records across N partitions; reads spread across replicas; writes fan out.
4. **Cache the hot key** in an in-memory layer. Most read traffic never reaches the storage tier.
5. **Hierarchical partitioning** — split a hot partition further at runtime (BigTable-style auto-split).
6. **Application-level routing** — detect hot keys; route them to a dedicated handler.

## Architecture Diagrams

```
Without mitigation:                With salting:
  Partition 0: ▓▓▓▓▓▓▓▓▓ (hot)      key = "user-123":
  Partition 1: ░                      writes go to "0_user-123", "1_user-123", ...
  Partition 2: ░                      spread across all partitions
  Partition 3: ░                    reads must aggregate across salts
  
  ↑ user-123 lives here              ↑ load now even; reads slightly costlier
```

## Design Tradeoffs

**Mitigation trade-offs:**

| Technique | Cost | When to use |
|---|---|---|
| Better partition key | Schema redesign; sometimes impossible after launch | Greenfield design |
| Salting | Read fan-out cost | Heavy-write hot keys |
| Hot-key replication | Storage cost; write fan-out | Heavy-read hot keys |
| Caching | Cache invalidation complexity | Read-heavy, tolerant of staleness |
| Auto-split | Runtime overhead | Range-partitioned systems |

## Real Production Examples

- **Twitter / X — celeb timeline problem.** A celeb's tweets fanned out to millions of followers; serving fans pegged the partition holding the celeb's data. Solved with hybrid fan-out: pull for celebs, push for normal users.
- **DynamoDB adaptive capacity** — automatically lifts throughput for hot partitions, then re-partitions if persistent.
- **Cassandra wide-row anti-pattern** — too many records under one partition key creates a hot partition.
- **Discord giant-server problem** — single Discord channels with millions of members; required denormalization and caching.
- **E-commerce flash sales** — one product key gets all the traffic; pre-cache + rate-limit.

## Interview Perspective

**Common questions:**
- "What's a hot partition?" → One partition handles disproportionately more traffic than peers due to access skew.
- "How would you mitigate one?" → Better partition key, salting, hot-data replication, caching, or hierarchical splitting.
- "How would you scale a celebrity-user system?" → Acknowledge the hot-key problem first. Then propose hybrid fan-out, caching, or replication.

**Senior-level:**
- The hot-partition problem is **the** scaling bottleneck most systems hit. Twitter's hot-celeb problem and Discord's giant-server problem are canonical examples.
- The cure depends on workload. Read-hot keys → cache + replicate. Write-hot keys → salt + shard internally. Read+write hot → app-level redesign.
- Adaptive systems (DynamoDB adaptive capacity, BigTable auto-split) trade complexity for self-healing.

**Common mistakes:**
- Assuming partitioning solves all scaling. It only helps if access is uniform.
- Picking partition keys that look high-cardinality but have skewed access (timestamps).
- Salting without realizing the read cost.

## Related Concepts

- [[Partitioning]] — the parent concept.
- [[Consistent Hashing]] — doesn't solve hot keys.
- [[Rebalancing]] — auto-split is a runtime rebalancing operation.
- [[Caching]] — the most common hot-key mitigation.
- [[Rate Limiting]] — protect hot partitions from abusive clients.

## Misconceptions

- **"Consistent hashing fixes hot partitions."** No — a hot key still maps to one node.
- **"More partitions = less skew."** Only if skew is over keys, not over key-ranges. Doubling partitions doesn't help if the hottest single key is the problem.
- **"Hot partitions are a temporary problem."** Often structural. Designed into the system unless explicitly mitigated.

## Failure Scenarios

- **Cascading failure** — hot partition's node falls behind, latency spikes, retries amplify, the whole system degrades. Mitigation: bulkheads, circuit breakers.
- **Adaptive-capacity oscillation** — system keeps moving partitions; never stabilizes. Mitigation: hysteresis, manual override.
- **Hot-key stampede** after cache miss — millions of requests hit the storage tier at once. Mitigation: request coalescing, probabilistic early refresh.

## Practical Engineering Heuristics

- **Profile partition load early.** Long before scale, simulate realistic skewed traffic.
- **Pick partition keys assuming Zipfian access.** High cardinality + low correlation with access frequency.
- **Cache hot reads.** A small Redis cluster in front of the DB absorbs 90%+ of celeb-style traffic.
- **Plan for celebrities.** If users can have varying "fame," design the hot-user case in from day one.
- **Salt writes; replicate reads.** Two different mitigations for two different patterns.

## Active Recall Questions

What is a hot partition?::A partition receiving disproportionately more traffic than peers due to access skew. Defeats the load-balancing purpose of partitioning.

Three causes of hot partitions?::Low-cardinality partition key; skewed access to one key in a high-cardinality partition; time-based partition key (current is always hottest); append-only writes concentrating at the end.

How does salting mitigate write-hot keys?::Prepend a random shard prefix to the key. Writes spread across many partitions. Reads must aggregate across all salt values (read cost).

What did Twitter do for the celebrity-timeline problem?::Hybrid fan-out — pull (read-time) for celebrities' fans, push (write-time) for normal users. Avoids fanning out one celebrity's tweet to millions.

Does consistent hashing solve hot partitions?::No. A hot key hashes to one node. Consistent hashing is about node-count changes, not access skew.

Name a self-healing hot-partition mitigation in a real system.::DynamoDB adaptive capacity — lifts throughput for hot partitions, re-partitions if persistent. BigTable / HBase auto-split.

## Feynman Test

You're designing a social network. Walk through how Justin Bieber-as-a-user breaks naive partitioning and what you'd do.

A flash sale: one product gets 10,000 reads/sec. The DB partition is overloaded. Propose three mitigations and compare.

## Mastery Checklist

- **Explain** hot partitions and their causes.
- **Compare** mitigation strategies (key choice, salting, replication, caching, auto-split).
- **Derive** which mitigation suits which workload.
- **Critique** designs that ignore Zipfian access.
- **Design** a system that handles celebrity-users without a single hot partition.

[^DDIA-205]: Designing Data-Intensive Applications, Kleppmann, Ch. 6, pp. 205–207.

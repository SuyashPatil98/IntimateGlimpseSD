---
title: Distributed Caching
area: caching
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]", "[[Consistent Hashing]]"]
related: ["[[Caching]]", "[[Cache Strategies]]", "[[Consistent Hashing]]", "[[Key-Value Store]]", "[[LRU]]"]
sources:
  - SDI vol 1, Ch. 4
  - Redis / Memcached docs
tags: [caching, distributed, redis]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Distributed Caching

## Executive Summary

A **distributed cache** is a cache that **spans multiple servers**, partitioning data across nodes so total cache size scales horizontally. Two dominant implementations: **Memcached** (simple, in-memory, pure cache) and **Redis** (rich data structures, persistence options, replication, cluster mode). Used everywhere — session stores, API caches, leaderboards, rate limit counters, real-time data. **Consistent hashing** partitions keys across nodes; **replication** provides availability; **eviction** keeps memory bounded.

## Why This Exists

A single in-process cache is bounded by one machine's memory and shared with no other process. As scale grows: more services need the same cache; the cache exceeds one box. Distributed caching solves both — a shared service all services hit, sized by adding nodes.

## Core Intuition

Many kitchens (services) shouldn't each maintain their own pantry. One shared warehouse, partitioned by item type. Each kitchen knows which shelf holds what (consistent hashing). All kitchens see the same state. Adding shelves expands capacity.

## Internal Mechanics

**Partitioning:**
- Consistent hashing maps keys to nodes.
- Adding/removing nodes minimally disrupts existing mappings.

**Replication:**
- Each shard typically replicated (Redis Sentinel, Redis Cluster).
- Memcached traditionally no replication (data loss on failure).

**Operations:**
- `GET(key)`, `SET(key, value, ttl)`, `DEL(key)`.
- Atomic operations (INCR, CAS).
- Redis adds: lists, sets, sorted sets, hashes, pub/sub, streams.

**Eviction:** see [[Eviction Policies]].

**Consistency:** eventual within replicas; reads can be stale; many designs read replicas accept lag.

## Memcached vs Redis

| Feature | Memcached | Redis |
|---|---|---|
| Data structures | KV (string values) | Strings, lists, sets, sorted sets, hashes, streams, etc. |
| Persistence | None | RDB snapshots + AOF log |
| Replication | None (classic) | Sentinel + Cluster |
| Pub/sub | No | Yes |
| Modules | No | Yes (RedisJSON, RediSearch, etc.) |
| Use | Pure cache | Cache + data store |

## Real Production Examples

- **Redis** — dominant; cache, sessions, queues, pubsub, leaderboards.
- **Memcached** — simpler, faster for pure cache use.
- **AWS ElastiCache** — managed Redis or Memcached.
- **Google Cloud Memorystore** — managed Redis.
- **Hazelcast, Apache Ignite** — JVM-centric distributed caches.

## Design Tradeoffs

**Benefits:**
- Horizontal scale.
- Shared across services.
- High throughput.
- Rich operations (Redis).

**Costs:**
- Network hop for every access (vs in-process).
- Operational overhead.
- Memory cost.
- Failure handling complexity.

## Interview Perspective

**Common questions:**
- "Redis vs Memcached?" → Redis: rich data structures, persistence. Memcached: simpler, sometimes faster for pure cache.
- "How does Redis cluster work?" → Hash slots (16384) divided across nodes. Client-side or proxy routing.
- "When use distributed vs in-process cache?" → Distributed: shared state, large capacity. In-process: lowest latency.

**Senior-level:**
- Redis is the swiss army knife — cache + KV + pub/sub + queue + rate limiter. Often replaces multiple components.
- The "Redis is single-threaded" property is sometimes a feature (no lock issues) and sometimes a bottleneck (single core).
- Persistence (RDB + AOF) makes Redis durable enough for some primary-store use cases.

**Common mistakes:**
- Using distributed cache when in-process would suffice (network latency).
- No eviction policy → memory bloat.
- Treating Redis as a database without considering durability.
- Cache-miss storms during Redis restart.

## Related Concepts


- [[Caching]] · [[Cache Strategies]] · [[Eviction Policies]] · [[Consistent Hashing]] · [[Key-Value Store]]
- [[LRU]] — related concept.

## Misconceptions

- **"Redis is just a cache."** Many use as primary store.
- **"Distributed cache is always faster."** Network adds latency vs in-process.
- **"Redis is durable."** Default config can lose recent writes.

## Failure Scenarios

- **Hot key** → single node overwhelmed.
- **Cache-miss storm** during restart or failover.
- **Network partition** → split cache state.
- **Memory exhaustion** → eviction or OOM.

## Practical Engineering Heuristics

- **Use Redis** unless you have specific reasons for Memcached.
- **Plan eviction policy** explicitly.
- **Monitor cache hit ratio.**
- **Replicate critical cache state.**
- **Test cache failure scenarios.**

## Active Recall Questions

What's a distributed cache?::Cache spanning multiple servers, partitioned via consistent hashing. Shared across services; scales horizontally.

Redis vs Memcached?::Redis: rich data structures (lists, sets, hashes), persistence, replication. Memcached: simpler, pure cache.

How does Redis cluster partition data?::16384 hash slots distributed across nodes. Client-side routing or proxy.

When use in-process cache instead?::When lowest latency matters and data doesn't need sharing across services.

Why is Redis single-threaded?::No lock contention; deterministic; very fast for in-memory ops. Single-core bottleneck for CPU-intensive use.

Name three production uses of Redis beyond caching.::Sessions, rate limiting, leaderboards (sorted sets), pub/sub, queues (lists, streams).

## Feynman Test

Walk through a request hitting a Redis cluster with 6 nodes. How does it find the right node?

When does distributed cache become slower than going directly to the database?

## Mastery Checklist

- **Explain** distributed cache architecture.
- **Compare** Redis and Memcached.
- **Derive** when distributed cache is appropriate.
- **Critique** designs treating distributed cache as zero-cost.
- **Design** caching tier for a microservices architecture.

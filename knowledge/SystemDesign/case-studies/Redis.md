---
title: Redis
area: case-studies
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]", "[[Distributed Caching]]"]
related: ["[[Memcached]]"]
builds_toward: []
sources:
  - Redis docs (redis.io)
  - antirez (Salvatore Sanfilippo) blog posts
  - Twitter / Stack Overflow / GitHub eng — Redis at scale
tags: [case-study, caching, redis, datastore]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Redis

## Executive Summary

**Redis** (Salvatore Sanfilippo, 2009) is a "data structures server": single-process in-memory store offering not just KV but rich types — strings, lists, sets, hashes, sorted sets, streams, HyperLogLog, geo. Optional persistence (RDB + AOF), replication, clustering. Used as cache, queue, leaderboard, rate limiter, pub/sub bus, and primary store for ephemeral state.

## Why It Mattered

Mid-2000s, Memcached dominated caching but offered only strings. Redis's pitch: "all the data structures you'd put in a process, but on a server" — letting apps use Redis ZADD/LPUSH/INCR instead of inventing schemes on top of `set/get`.

## Architecture

- **Single-threaded** event loop per process (since version 6: I/O threads for network; commands still single-threaded).
- **RESP** protocol (Redis Serialization Protocol).
- **Persistence**: RDB (point-in-time snapshot) + AOF (append-only log).
- **Replication**: primary → replicas via async stream.
- **Sentinel**: HA monitoring + failover.
- **Cluster**: sharding across N nodes via hash slots (16384 slots).

## Data Types

| Type | Use case |
|---|---|
| String | Caching, counters (INCR) |
| List | Queues, recent items (LPUSH/RPOP) |
| Set | Tags, uniqueness, intersection |
| Hash | Object-as-fields |
| Sorted Set (ZSET) | Leaderboards, time-series indexes |
| Stream | Kafka-lite event log |
| Bitmaps | Bit-level analytics |
| HyperLogLog | Approximate cardinality |
| Geo | Lat/lng search |
| JSON / Search (modules) | Document store, search |

## Strengths

- **Rich data structures** — many architecture problems reduce to a Redis primitive.
- **Sub-ms latency** in-memory.
- **Lua scripting** — atomic compound operations.
- **Pub/Sub + Streams**.
- **Persistence options** — usable as primary store for ephemeral data.

## Weaknesses

- **Single-threaded per process** — scale by clustering, not by adding cores to one node.
- **Cluster mode quirks** — multi-key operations must hash to same slot.
- **Persistence cost** — AOF rewrites pause GC; RDB snapshots fork (huge memory pressure).
- **Memory** — RAM is the dataset cap; eviction policies must be tuned.

## Common Use Cases

- **Cache** (cache-aside, with TTL).
- **Session store** (per-user state).
- **Leaderboard** (ZSET; see [[Design Real-Time Gaming Leaderboard]]).
- **Rate limiter** (token bucket via Lua).
- **Queue** (Lists + BRPOP for simple; Streams for richer).
- **Pub/Sub** (light real-time fanout).
- **Distributed lock** (SETNX + TTL; Redlock for stricter).
- **Feature store online tier**.

## Real Production

- **Twitter** — timelines, ad delivery.
- **GitHub** — Sidekiq queue + caching.
- **Stack Overflow** — heavy cache + counters.
- **Instagram** — feeds, sessions.
- **Slack** — sessions, channel metadata.
- **Pinterest** — extensive Redis use.

## Notable Drama

- **Redis license change (2024)** — moved off BSD to SSPL/RSAL; Valkey forked under permissive license, gaining traction.

## Lessons

- "Data structure server" is a different abstraction from "KV cache" — and a powerful one.
- Single-threaded simplicity beats multi-threaded complexity for many workloads.
- Atomic Lua scripts replace many bespoke coordination protocols.
- Open-source licenses matter — Valkey fork shows community willingness to leave.

## Related Concepts

- [[Caching]] — primary use.
- [[Memcached]] — alternative.
- [[Distributed Caching]] — pattern.
- [[Design Real-Time Gaming Leaderboard]] — canonical ZSET use case.
- [[Design Rate Limiter]] — Lua + Redis.

## Active Recall Questions

What is Redis's positioning vs Memcached?::"Data structures server" — strings, lists, sets, hashes, sorted sets, streams, geo, HyperLogLog, etc.; vs Memcached's strings only. Plus persistence, replication, clustering.

Why is single-threaded design a feature, not a bug?::Eliminates locking complexity; atomic operations; predictable latency; commodity machines can do hundreds of thousands of ops/s on one core.

What's the difference between RDB and AOF persistence?::RDB: point-in-time snapshot via fork; small files, fast restart, some data loss possible. AOF: append-only command log; more durable, larger files, periodic rewrites.

How does Redis Cluster shard data?::Hashes key (CRC16) to one of 16384 hash slots; each slot owned by a node; multi-key commands require keys hashed to the same slot (hash tags `{user1}.foo`, `{user1}.bar`).

What is Redlock?::A distributed lock algorithm using multiple independent Redis instances and quorum reads; intended to provide stronger guarantees than single-instance locks, though correctness is debated (Kleppmann critique).

What did the 2024 license change cause?::Redis moved off BSD to SSPL/RSAL; the Valkey project forked under permissive license and gained Linux Foundation backing and major cloud-provider support.

When should you use Redis Streams over Kafka?::Lower-scale streaming with strong primitives, single-process consumers, sub-ms latency, when you already have Redis; Kafka for high-volume cross-team event spine.

## Feynman Test

A junior engineer says "Redis is just a faster Memcached" — explain what they're missing in the data-structure model, and give an example architectural problem that's a one-liner in Redis but multiple files in Memcached.

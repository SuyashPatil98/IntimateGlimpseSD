---
title: Key-Value Store
area: databases
status: mature
difficulty: beginner
prerequisites: ["[[NoSQL]]"]
related: ["[[NoSQL]]", "[[Document Database]]", "[[Caching]]", "[[Consistent Hashing]]"]
sources:
  - DDIA, Ch. 2
  - SDI vol 1, Ch. 6
tags: [databases, nosql, kv]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Key-Value Store

## Executive Summary

A key-value store maps **opaque keys to opaque values** — the simplest database model. Reads/writes are by key only; no queries, no joins, no schema. In exchange for that simplicity: **extreme scalability, low latency, simple horizontal partitioning** via [[Consistent Hashing]]. Two main camps: **in-memory** (Redis, Memcached) for cache/session/coordination, and **persistent distributed** (DynamoDB, Riak, etcd) for primary storage at scale. The fundamental building block — many higher-level databases are KV stores with semantic layers on top.

## Why This Exists

For workloads that only access data by key (caches, session stores, simple lookups), a relational database is overkill. A KV store strips away everything but the essential — get(key), put(key, value), delete(key) — gaining massive throughput and partition-friendliness. The simplest interface that's still useful.

## Core Intuition

A giant hash table distributed across many machines. Want to read? Hash the key; ask the right machine. Want to write? Same. No joins, no transactions, no schema. Just key → value.

## Internal Mechanics

**Operations:**
- `GET(key)` → value or null.
- `PUT(key, value)` → ack.
- `DELETE(key)` → ack.

**Partitioning:**
- Consistent hashing distributes keys across nodes.
- Each node owns a range of the hash space.

**Replication:**
- Each key replicated N times.
- Reads from R replicas, writes to W replicas (quorum).

**Common features beyond bare KV:**
- TTL (auto-expiry).
- Atomic operations (INCR, CAS).
- Data structures (Redis: lists, sets, sorted sets, hashes).
- Secondary indexes (DynamoDB).

## Real Production Examples

- **Redis** — in-memory, rich data structures, replication, persistence options. Cache, sessions, pubsub, leaderboards.
- **Memcached** — pure in-memory cache; simpler than Redis.
- **DynamoDB** — managed, persistent, multi-region; KV with optional secondary indexes.
- **Riak** — distributed KV; vector clocks.
- **etcd** — Raft-backed KV for coordination (Kubernetes).
- **RocksDB / LevelDB** — embedded KV (LSM-tree); often used as a primitive in other databases.

## Design Tradeoffs

**Benefits:**
- **Extreme scalability** — partitioning trivial.
- **Low latency** — in-memory variants under 1ms.
- **Simple model** — easy to reason about.
- **Foundational** — many other DBs are KV with extras.

**Costs:**
- No query language; only by key.
- No joins.
- No schema enforcement.
- Application must encode all access patterns.

## Interview Perspective

**Common questions:**
- "When use a KV store?" → Cache, sessions, simple by-key lookups at scale.
- "Redis vs Memcached?" → Redis: richer data structures, persistence, replication. Memcached: simpler, faster, ephemeral.
- "When does KV fall short?" → When you need joins, queries by non-key fields, or schema enforcement.

**Senior-level:**
- KV is the "data plane" primitive most other databases build on. RocksDB underlies Cassandra, CockroachDB, TiKV, etc.
- "Caching" is the canonical KV use, but persistent KV (DynamoDB) handles primary storage for entire businesses.
- Secondary indexes on KV are bolt-on — they're consistency hazards.

**Common mistakes:**
- Using KV when you need queries — leads to "scan everything in app code" anti-pattern.
- Treating Redis as durable storage without persistence configured.
- Forgetting TTLs — keys accumulate forever.

## Related Concepts

- [[NoSQL]] · [[Document Database]]
- [[Caching]] — primary KV use.
- [[Consistent Hashing]] — partitioning scheme.
- [[Replication]] — KV stores are usually replicated.

## Misconceptions

- **"KV = cache."** Persistent KV stores (DynamoDB) are primary storage.
- **"Redis is just a cache."** Persistence options exist; many use as primary store.
- **"KV is too simple to be useful."** Many massive systems run on it (DynamoDB powers Amazon retail).

## Failure Scenarios

- **Hot key** — one key gets all traffic; node overloaded. Mitigation: replicate hot keys, cache locally.
- **No TTL** — keys accumulate. Mitigation: enforce TTLs.
- **Eviction surprises** — memory pressure evicts unexpected keys. Mitigation: tune eviction policy.

## Practical Engineering Heuristics

- **Use Redis** for cache, session, rate limit, leaderboard.
- **Use DynamoDB** for persistent KV at scale (when on AWS).
- **Set TTLs** on everything except canonical state.
- **Plan for hot keys** — they will happen.

## Active Recall Questions

What is a key-value store?::Database mapping opaque keys to opaque values. Only by-key access; no queries, joins, schema.

Difference between Redis and Memcached?::Redis: richer data structures (lists, sets, hashes), persistence options, replication. Memcached: pure cache, ephemeral, simpler/faster.

How does a KV store scale?::Partitioning (consistent hashing) + replication. Trivially horizontal.

When is KV insufficient?::When you need queries by non-key fields, joins, complex relations, or strong schema enforcement.

Name three persistent KV stores.::DynamoDB, Riak, etcd, RocksDB.

What's the "hot key" problem in KV?::One key gets disproportionate traffic; the node owning it is overloaded. Mitigation: replicate hot keys, cache, salting.

## Feynman Test

A new web app needs sessions, a cache, and primary storage of user profiles. Which KV store(s) for each?

Why are KV stores so foundational that many other databases use them as building blocks?

## Mastery Checklist

- **Explain** KV semantics and when to use.
- **Compare** Redis, Memcached, DynamoDB.
- **Derive** when KV is sufficient.
- **Critique** queries-on-KV anti-patterns.
- **Design** a scaling layer using KV for cache + primary.

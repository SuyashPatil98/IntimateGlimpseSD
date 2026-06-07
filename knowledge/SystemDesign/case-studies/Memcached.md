---
title: Memcached
area: case-studies
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]", "[[Distributed Caching]]"]
related: ["[[Redis]]", "[[Consistent Hashing]]"]
builds_toward: []
sources:
  - Brad Fitzpatrick (LiveJournal) original
  - Nishtala et al. "Scaling Memcache at Facebook" (NSDI 2013)
  - memcached.org docs
tags: [case-study, caching, memcached]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Memcached

## Executive Summary

**Memcached** (Brad Fitzpatrick, LiveJournal 2003) is the canonical distributed in-memory KV cache. A simple in-process LRU cache speaking a tiny ASCII protocol; clients use consistent hashing across many memcached nodes. Powered Facebook's massive read-side scale (Nishtala 2013 paper documents the architectural lessons). Still in heavy use; Redis dominates new deployments but Memcached remains a sound choice for pure caching.

## Why It Mattered

Mid-2000s web apps were bottlenecked on databases. Memcached put RAM-speed caching between app servers and DB. Simple, fast, language-agnostic — adopted by virtually every large web company.

## Architecture

- **Server**: pure in-memory hash table with LRU eviction; ~100k+ QPS per node.
- **Client**: hashes key (consistent hashing or Ketama) to pick the server.
- **No replication, no persistence** — cache only; loss is OK.
- **No clustering** — clients shard; servers don't know about each other.

## Protocol

- Text protocol: `SET key flags exptime bytes\r\n<data>\r\n`; `GET key\r\n`.
- Binary protocol later for efficiency.
- Operations: get/set/add/delete/incr/decr/cas.

## Strengths

- **Simple** — minimal moving parts.
- **Fast** — pure in-memory, no persistence overhead.
- **Predictable** — single data structure, well-understood eviction.
- **Multi-threaded** — scales on multi-core hosts (unlike single-threaded Redis).

## Weaknesses

- **No persistence** — restart loses everything.
- **No replication** — node failure loses that node's keys.
- **No data structures** — only strings.
- **No clustering** — client-side shard map; rebalance is painful.
- **No pub/sub, no scripting, no Lua.**

## Facebook Case Study (Nishtala 2013)

The paper documents production lessons:
- **Lease tokens** — coordinate concurrent fillers to prevent thundering herd.
- **Stale set protection** — handle racing concurrent updates.
- **Regional pools** — split frequently-vs-rarely-accessed data.
- **Cold cluster warmup** — fill from peer cluster.
- **mcrouter** — Facebook's routing layer; published as open-source.

This is the canonical reference for cache architecture at scale.

## Real Production

- **Facebook** — billions of QPS; influential paper.
- **YouTube, Twitter, Wikipedia** — historical.
- **Pinterest** — published architecture.
- **Most major web companies** — at least historically.

## Memcached vs Redis

| Feature | Memcached | Redis |
|---|---|---|
| Threading | Multi-threaded | Single-threaded (cluster for scale) |
| Data structures | Strings only | Strings, lists, sets, hashes, sorted sets, streams |
| Persistence | None | RDB + AOF |
| Replication | None | Yes |
| Pub/Sub | No | Yes |
| Eviction | LRU | Configurable (LRU, LFU, TTL) |
| Use case | Pure cache | Cache + datastore + queue + leaderboard |

Pick Memcached when you want pure cache and multi-threaded per-node throughput; pick Redis when you need richness.

## Lessons

- A small focused design (KV + LRU) survives 20 years.
- Simple protocols enable language-agnostic adoption.
- Scaling caching at extreme QPS requires non-trivial protocols (leases, stale-set protection); Facebook's paper is the bible.
- Client-side sharding works at scale with disciplined consistent hashing.

## Related Concepts

- [[Caching]] — overarching concept.
- [[Distributed Caching]] — architecture pattern.
- [[Consistent Hashing]] — client sharding.
- [[Cache Stampede]] — what leases solve.
- [[Redis]] — alternative.

## Active Recall Questions

What's the design philosophy of Memcached in one phrase?::Simple in-memory key-value LRU cache — multi-threaded, language-agnostic protocol, client-side sharding, no persistence or replication.

How do Memcached clients shard across many servers?::Consistent hashing (typically Ketama variant); each client computes the key→server mapping; servers don't coordinate.

What is a lease token in Facebook's Memcache architecture?::A token granted on cache miss; coordinates concurrent fillers so only one actually queries the DB; others wait for the result, preventing thundering herd.

Why does Memcached scale better than single-threaded Redis on a single node?::Multi-threaded design uses all CPU cores on a single instance; Redis scales by clustering instead.

What is mcrouter?::Facebook's open-source memcached routing layer providing connection pooling, failover, replication, regional routing, and protocol translation.

What did the Nishtala 2013 NSDI paper contribute?::Documented Facebook's production memcached architecture — lease tokens, stale-set protection, regional pools, cold-cluster warmup; canonical reference for at-scale caching.

When should you choose Memcached over Redis?::Pure caching workloads where you want maximum per-node throughput, multi-threading, and minimal complexity; no need for data structures, persistence, or pub/sub.

## Feynman Test

A team uses Memcached and observes that every cache miss on a popular key causes 1000 simultaneous DB queries. Explain the mechanism Facebook added to prevent this, and why naive memcached suffers from it.

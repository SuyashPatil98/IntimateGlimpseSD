---
title: Caching
area: caching
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Cache Strategies]]", "[[Eviction Policies]]", "[[CDN Caching]]", "[[Distributed Caching]]", "[[Cache Stampede]]", "[[Cache Invalidation]]", "[[LRU]]"]
builds_toward: ["[[Cache Strategies]]", "[[Distributed Caching]]"]
sources:
  - SDI vol 1, Ch. 1
  - DDIA
  - system-design-primer
tags: [caching, performance, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Caching

## Executive Summary

A **cache** is a **faster-but-smaller storage layer in front of a slower-but-larger one**, holding recently or frequently used data. The single most common performance optimization in distributed systems. Caches live everywhere: **CPU caches, OS page cache, application memory, distributed caches (Redis), CDNs, browser caches, database query caches**. The benefits — reduced latency, reduced load on origin, higher throughput — come with the costs of consistency complexity, invalidation challenges, and added moving parts. "There are only two hard things in Computer Science: cache invalidation and naming things." (Phil Karlton, half-jokingly.)

## Why This Exists

Origin stores (databases, APIs, file systems) are limited by their I/O, CPU, and bandwidth. For workloads with locality (a small subset of data accessed repeatedly), serving requests from a faster nearby store avoids the origin's cost. Most real workloads are Zipfian: a tiny fraction of items get most of the traffic. Caching exploits this brutally.

## Core Intuition

A chef's countertop. Fetching ingredients from the pantry is slow; reaching to the countertop is fast. Keep frequently-used items on the countertop. When space runs out, put the least-recently-used item back in the pantry. Refill when needed.

## Layers of Caching

- **CPU cache** — L1/L2/L3 inside the processor.
- **OS page cache** — RAM caching disk reads.
- **Application memory** — in-process caches (Caffeine, LRU map).
- **Distributed cache** — Redis, Memcached.
- **Database query cache** — DB's internal.
- **CDN** — edge caches close to users.
- **Browser cache** — client-side.

Each layer is faster + smaller than the next.

## Internal Mechanics

**Cache hit:** requested item present → return from cache.

**Cache miss:** not present → fetch from origin → optionally populate cache → return.

**Hit ratio:** the key performance metric. 90%+ for hot data; 50% for cold; 0% for unique-per-request.

**Caching dimensions:**
- **Where:** client / edge / app / distributed / DB.
- **What:** request results / objects / pages / fragments.
- **Strategy:** see [[Cache Strategies]].
- **Eviction:** see [[Eviction Policies]].
- **Invalidation:** see [[Cache Invalidation]].

## Design Tradeoffs

**Benefits:**
- Lower latency.
- Reduced origin load.
- Higher throughput.

**Costs:**
- **Consistency** — cache may be stale.
- **Invalidation** — hard.
- **Cold start** — first hit is slow.
- **Memory cost.**
- **Operational complexity.**

## Real Production Examples

- **Redis / Memcached** — distributed cache.
- **Cloudflare, Akamai, Fastly** — CDN.
- **Caffeine** — JVM in-process cache.
- **HTTP caching** — `Cache-Control`, `ETag`.

## Interview Perspective

**Common questions:**
- "Why cache?" → Lower latency + reduced origin load + higher throughput.
- "Cost of caching?" → Consistency complexity, invalidation, memory cost.
- "Cache hierarchy?" → CPU → OS → app → distributed → CDN → browser.

**Senior-level:**
- "Cache invalidation is hard" isn't a joke. Most subtle production bugs trace to stale cache vs DB.
- The hot-key problem from [[Hot Partitions]] applies to caches too.
- Cache misses can produce thundering herd / cache stampede; mitigate explicitly.

**Common mistakes:**
- Caching everything without measuring hit ratio.
- No TTL → stale data accumulates.
- No invalidation strategy → users see stale.
- Single shared cache without partitioning → hot keys.

## Related Concepts


- [[Cache Strategies]] · [[Eviction Policies]] · [[CDN Caching]] · [[Distributed Caching]] · [[Cache Stampede]] · [[Cache Invalidation]]
- [[LRU]] — related concept.

## Misconceptions

- **"Caching makes things faster automatically."** Only if hit ratio is high.
- **"Caches eliminate origin load."** Misses still hit origin; misses during traffic spikes can take it down.
- **"Bigger cache = better."** Diminishing returns; bigger working set helps less.

## Failure Scenarios

- **Cache stampede** after eviction or invalidation → origin overwhelmed.
- **Cache poisoning** → bad data persists.
- **Stale reads** → users confused.
- **Hot key** → cache node overloaded.

## Practical Engineering Heuristics

- **Cache hot reads** by TTL or invalidation.
- **Measure hit ratio** as an SLI.
- **Plan for cache-miss storms.**
- **Avoid premature distributed caching** — local app cache may suffice.
- **TTL is your friend** — bounded staleness.

## Active Recall Questions

What is a cache?::Faster, smaller store in front of a slower, larger one. Holds frequently/recently used items for fast access.

Where do caches live in a system?::CPU, OS page cache, application memory, distributed cache, DB query cache, CDN, browser. Hierarchical layers.

What's hit ratio?::Fraction of requests served from cache vs falling through to origin. Key SLI.

What's the famous quote about caching?::"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton.

Name three costs of caching.::Consistency complexity, invalidation difficulty, memory cost, cold start, operational overhead.

What's a cache stampede?::Many requests miss cache simultaneously → all hit origin → origin overwhelmed.

## Feynman Test

Walk through a request hitting a cache miss. What happens in each layer?

Why is caching "the single most common performance optimization" — and why does it create bugs more than any other?

## Mastery Checklist

- **Explain** caching layers and benefits.
- **Compare** caches across the hierarchy.
- **Derive** appropriate caching for a given workload.
- **Critique** "just add caching" approaches without measurement.
- **Design** a multi-layer caching architecture.

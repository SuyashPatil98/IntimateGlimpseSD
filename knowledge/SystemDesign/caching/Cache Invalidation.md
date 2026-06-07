---
title: Cache Invalidation
area: caching
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]"]
related: ["[[Caching]]", "[[Cache Strategies]]", "[[CDN Caching]]", "[[CDC]]"]
sources:
  - DDIA
  - SDI vol 1
  - Phil Karlton (apocryphal quote)
tags: [caching, invalidation, consistency]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Cache Invalidation

## Executive Summary

**Cache invalidation** is the process of **removing or refreshing cached data when its underlying source changes**. The "second hard thing in computer science" (Karlton). No general solution exists — every approach trades **consistency**, **complexity**, **load**, and **timing**. Three families: **TTL-based** (time bounds staleness, simple), **event-based** (explicit invalidate on writes, low latency but error-prone), **version-based** (cache key includes version, lazy invalidation by mismatch). Most production systems blend these.

## Why This Exists

Caches duplicate data; sources change. Without invalidation, caches serve stale forever. With over-aggressive invalidation, cache loses its value. Real systems must answer: how do we know when cached data is stale? How urgently do users need fresh data? What if invalidation fails?

## Core Intuition

A library has a catalog (cache) and shelves (origin). When a book moves, the catalog must update. Options: re-print the catalog daily (TTL), update on every move (event-based), or stamp each catalog entry with a version that the shelf also tracks (version-based). Each has costs and failure modes.

## Strategies

### 1. TTL-Based (Time-To-Live)

Every cached item has an expiry. After TTL, refetch.

**Pros:** simple; bounded staleness; no coordination needed.
**Cons:** stale for up to TTL; wasted refresh of unchanged items.

**Best for:** when bounded staleness is acceptable.

### 2. Event-Based (Explicit Invalidation)

On write to origin, invalidate (or update) cache entry.

**Pros:** can be instantaneous.
**Cons:** **the canonical bug source** — write succeeds, invalidate fails, stale persists. Race conditions (write, read-old-value into cache, invalidate before populate, then populate stale).

**Best for:** when low staleness is essential.

### 3. Version-Based

Cache key includes a version. Bump version on update.

**Pros:** lazy invalidation; no coordination of multiple cache nodes.
**Cons:** old versions linger in cache until eviction.

**Best for:** distributed caches where coordination is expensive.

### 4. Write-Through

See [[Cache Strategies]]. Writes go through cache to origin synchronously. Cache stays consistent.

### 5. Subscribe to CDC

[[CDC]] streams DB changes. Cache subscribes and invalidates affected keys.

**Pros:** near-real-time; reliable; decouples app from cache management.
**Cons:** operational complexity.

## Common Bugs

**Race: cached stale data after invalidation.**
- T1 writes to origin.
- T1 invalidates cache.
- T2 reads cache (miss).
- T2 reads origin (gets new value).
- T2 populates cache.
- *But...* what if T2's origin-read happened before T1's write? Then T2 caches the old value.

Mitigation: use locks, double-check, or accept TTL bound.

**Race: invalidation fails.**
- T1 writes to origin.
- T1 tries to invalidate.
- Network error.
- Cache stays stale until TTL.

Mitigation: use TTL as a backstop; retry queue for invalidations.

## Real Production Examples

- **Most apps with Redis** — TTL + event-based hybrid.
- **CDN invalidation** — purge API + TTL.
- **Facebook TAO** — version-based at scale.
- **CDC-driven cache** — Debezium → invalidation messages.

## Design Tradeoffs

| Strategy | Consistency | Latency | Complexity |
|---|---|---|---|
| TTL | Bounded staleness | None until expiry | Low |
| Event-based | Near-real-time | None | Medium (failure modes) |
| Version-based | Lazy | None | Medium |
| Write-through | Strong | Synchronous | Medium |
| CDC-driven | Near-real-time | Sub-second | High |

## Interview Perspective

**Common questions:**
- "Cache invalidation strategies?" → TTL, event-based, version-based, write-through, CDC.
- "Why is it hard?" → Races between writes and invalidations; failure modes; consistency vs performance.
- "Best practice?" → TTL as backstop + event-based for low staleness + idempotent invalidate.

**Senior-level:**
- "Race conditions between origin write and cache populate" are the most subtle. Use locks or version stamps.
- CDC-driven invalidation is the modern best practice for medium-large systems — reliable, decoupled, near-real-time.
- For shared distributed caches, version-based often beats event-based at scale.

**Common mistakes:**
- Event-based without TTL backstop.
- No retry on invalidation failure.
- Forgetting to handle "key doesn't exist" responses (cache penetration).

## Related Concepts

- [[Caching]] · [[Cache Strategies]] · [[CDN Caching]] · [[CDC]]

## Misconceptions

- **"Cache invalidation is solved."** It isn't. It's a "live with it" problem.
- **"Higher TTL = staler."** True but also: lower hit ratio for short TTL.
- **"Event-based is always best."** Failure modes can be worse than TTL.

## Failure Scenarios

- **Invalidation lost** → stale until TTL.
- **Race causing stale repopulation.**
- **Mass invalidation** → cache stampede.
- **Negative cache no TTL** → blocks future valid keys.

## Practical Engineering Heuristics

- **Always set a TTL** as backstop.
- **Combine TTL + event-based** for layered protection.
- **Use CDC** for medium+ systems.
- **Make invalidation idempotent.**
- **Monitor staleness** of cache vs origin.

## Active Recall Questions

What is cache invalidation?::Removing or refreshing cached data when underlying source changes. Notoriously hard.

Three main invalidation strategies?::TTL-based, event-based, version-based. (Plus write-through and CDC-driven.)

What's the canonical event-based bug?::Race condition: T2 reads origin, T1 writes + invalidates, T2 populates cache with stale value.

Why is TTL a useful backstop?::Bounds staleness even if other invalidation fails. Safety net.

What's CDC-driven invalidation?::Cache subscribes to DB change log (CDC); invalidates affected keys in near-real-time.

Why is "cache invalidation is hard"?::Race conditions, failure modes, consistency-vs-performance trade-offs. No general solution.

## Feynman Test

Walk through the race condition between a write and a cache populate. How does versioning fix it?

Why is CDC-driven invalidation considered the modern best practice?

## Mastery Checklist

- **Explain** invalidation strategies.
- **Compare** their failure modes.
- **Derive** appropriate strategy for given workload.
- **Critique** event-based-only invalidation without TTL.
- **Design** a hybrid invalidation strategy.

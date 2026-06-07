---
title: Cache Strategies
area: caching
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]"]
related: ["[[Caching]]", "[[Cache Invalidation]]", "[[Cache Stampede]]"]
sources:
  - SDI vol 1
  - system-design-primer
tags: [caching, strategies, patterns]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Cache Strategies

## Executive Summary

Six canonical caching strategies define **how reads and writes flow through the cache**: **cache-aside (lazy)**, **read-through**, **write-through**, **write-back (write-behind)**, **write-around**, and **refresh-ahead**. Each makes different trade-offs around consistency, latency, complexity, and miss behavior. The strategy choice is workload-dependent: read-heavy with stale-OK data favors cache-aside; write-heavy with durability needs favors write-through; latency-critical writes might use write-back. No single best.

## Why This Exists

The cache sits between the application and origin store. *How* data moves between them shapes everything: when is the cache populated? Updated? Consistent? The six strategies are the standard vocabulary for these flows. Most production systems use cache-aside; the others fit specific patterns.

## The Six Strategies

### 1. Cache-Aside (Lazy Loading)

**Read:**
1. App checks cache.
2. Miss → app reads origin → app writes to cache → returns.

**Write:**
1. App writes to origin.
2. App invalidates (or updates) cache.

**Pros:** simple; cache misses are app's problem (controlled). Cache only holds requested data.
**Cons:** miss penalty (origin round-trip + cache populate). Stale data possible if cache update fails.

**Usage:** the **default strategy** for most apps using Redis/Memcached.

### 2. Read-Through

**Read:**
1. App reads cache.
2. Cache (not app) fetches from origin on miss.
3. Cache returns.

**Write:** typically write-through or cache-aside.

**Pros:** simpler app code; cache encapsulates origin fetch.
**Cons:** cache must support read-through (in-process libraries, NCache, EHCache).

**Usage:** when caching library supports it natively.

### 3. Write-Through

**Write:**
1. App writes to cache.
2. Cache synchronously writes to origin.
3. Returns after both succeed.

**Pros:** cache and origin always consistent.
**Cons:** every write pays cache + origin latency.

**Usage:** write-heavy with strict consistency needs.

### 4. Write-Back (Write-Behind)

**Write:**
1. App writes to cache.
2. Cache acks immediately.
3. Cache asynchronously writes to origin later.

**Pros:** very fast writes.
**Cons:** data loss risk if cache fails before flush. Complexity in batching/ordering.

**Usage:** ultra-low-latency writes where loss is tolerable.

### 5. Write-Around

**Write:** app writes directly to origin, **bypassing cache**.

**Read:** typical cache-aside.

**Pros:** avoids cache pollution by writes that won't be read soon.
**Cons:** writes are slower to be cached; first read pays miss.

**Usage:** write-heavy where written data is rarely re-read.

### 6. Refresh-Ahead

**Read:** cache predicts items likely to expire soon and refreshes proactively.

**Pros:** no cache misses for hot items.
**Cons:** wasted refreshes; complex.

**Usage:** very hot items where miss latency is unacceptable.

## Comparison Table

| Strategy | Read | Write | Consistency | Latency | Complexity |
|---|---|---|---|---|---|
| Cache-aside | App fetches on miss | App invalidates | Eventual | Read miss slow | Low |
| Read-through | Cache fetches on miss | Often write-through | Eventual | Read miss slow | Medium |
| Write-through | Normal | Sync cache + origin | Strong | Write slow | Medium |
| Write-back | Normal | Async to origin | Eventual | Write fast | High |
| Write-around | Normal | Origin only | Eventual | Read miss after write | Low |
| Refresh-ahead | Pre-emptive refresh | Various | Eventual | No misses on hot | High |

## Real Production Examples

- **Most web apps** — cache-aside with Redis.
- **Hibernate L2 cache** — read-through + write-through.
- **CDN edge** — write-around (origin writes pushed via invalidation).
- **High-frequency trading** — write-back for ultra-fast writes.

## Interview Perspective

**Common questions:**
- "Which strategy?" → Cache-aside is default. Specific patterns suit specific needs.
- "Write-through vs write-back?" → Write-through: consistent, slower. Write-back: fast, durability risk.
- "Cache invalidation in cache-aside?" → App must invalidate on write; subtle bugs.

**Senior-level:**
- Cache-aside is the lingua franca because it's simple and the app retains control.
- Mixed strategies are common — read-through reads + cache-aside writes.
- The hardest cache bug is "write succeeded, invalidate failed" — leaving stale data.

**Common mistakes:**
- Write-back without durability planning → data loss.
- Cache-aside without invalidation → silent staleness.
- Premature optimization with refresh-ahead.

## Related Concepts

- [[Caching]] · [[Cache Invalidation]] · [[Cache Stampede]]

## Misconceptions

- **"One strategy is best."** Workload-dependent.
- **"Write-back is dangerous."** Used responsibly, it's fine.
- **"Cache-aside is consistent."** Eventually consistent; bugs hide here.

## Failure Scenarios

- **Cache-aside invalidation race** → stale reads.
- **Write-back loss** during cache failure.
- **Write-through latency** dragging app down.

## Practical Engineering Heuristics

- **Default to cache-aside.**
- **Use write-through** when consistency requires.
- **Use TTL** to bound staleness when invalidation is best-effort.
- **Test cache failure modes.**

## Active Recall Questions

Name the six cache strategies.::Cache-aside, read-through, write-through, write-back (write-behind), write-around, refresh-ahead.

Default strategy for most production systems?::Cache-aside (lazy loading).

Write-through vs write-back?::Write-through: sync cache + origin (consistent, slow). Write-back: cache acks, async to origin (fast, durability risk).

Write-around?::App writes directly to origin, bypassing cache. Avoids cache pollution by write-once data.

Refresh-ahead?::Cache proactively refreshes items predicted to expire. No misses on hot items.

What's the canonical cache-aside bug?::Write succeeds but invalidation fails → stale data persists in cache.

## Feynman Test

Compare cache-aside and write-through for a user profile service. Trade-offs?

When would refresh-ahead be worth its complexity?

## Mastery Checklist

- **Explain** all six strategies.
- **Compare** their consistency and latency trade-offs.
- **Derive** which strategy fits a given workload.
- **Critique** strategy choices without considering invalidation.
- **Design** caching for a mixed-read-write service.

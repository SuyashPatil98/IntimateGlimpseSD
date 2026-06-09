---
title: Cache Stampede
area: caching
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]"]
related: ["[[Caching]]", "[[Cache Strategies]]", "[[Rate Limiting]]", "[[LRU]]"]
sources:
  - SDI vol 1
  - Industry blog posts
tags: [caching, reliability, failure-mode]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Cache Stampede

## Executive Summary

A **cache stampede** (also: **thundering herd**, **dog-piling**) is the failure mode where **many concurrent requests miss the cache simultaneously and all hit the origin**, overwhelming it. Triggered by cache expiry, eviction, restart, or cold start. Especially severe for **hot keys** — the more popular an item, the bigger the stampede when its cache entry vanishes. Mitigations: **request coalescing, probabilistic early refresh, locks, stale-while-revalidate**. Related anti-patterns: **cache penetration** (queries for non-existent keys) and **cache avalanche** (mass simultaneous expiration).

## Why This Exists

Caches are designed for high hit ratios. When all requests hit cache, origin sees little load. When one item's cache vanishes (TTL, eviction, restart), suddenly every concurrent request for it misses. If thousands of requests hit simultaneously, they all stampede to origin — which was sized for cached-load levels, not full traffic.

## Core Intuition

A coffee shop with a popular drink. Normally the barista has it pre-made (cached). The pre-made batch runs out. Suddenly every customer in line wants it — the barista must make 50 individually. The system stalls. With coalescing: the barista makes one large batch for everyone in line; or a single "fetch token" prevents duplicate requests.

## Related Failure Modes

### Cache Stampede (Thundering Herd)
- Cache miss on a hot key → many concurrent requests fetch from origin.

### Cache Avalanche
- Many cache entries expire simultaneously → mass cache misses → origin overwhelmed.
- Caused by: shared TTL, restart, scheduled invalidation.

### Cache Penetration
- Requests for keys that don't exist anywhere (e.g., malicious random IDs).
- Cache can't help — every miss hits origin.
- Mitigation: cache null/sentinel responses with short TTL.

## Mitigation Strategies

### 1. Request Coalescing (Single-flight)
- First miss starts the origin fetch.
- Concurrent misses wait for that fetch.
- One origin call serves all waiters.
- Implementation: lock per key + waiters list.

### 2. Probabilistic Early Refresh (PER)
- Each request has a small probability of refreshing the cache before expiry.
- Probability increases as TTL approaches.
- Result: cache refreshed by one or few requests, others continue to hit cache.

Formula: refresh if `now − last_fetch > TTL × (1 − beta × ln(rand))` where beta tunes aggressiveness.

### 3. Locks
- Acquire a lock before fetching from origin.
- Other concurrent requests wait or return stale.
- Distributed lock (Redis SETNX).

### 4. Stale-While-Revalidate
- Return stale cache instantly.
- Refresh in background.
- HTTP cache headers, modern CDN feature.

### 5. Jitter in TTLs
- Add random jitter to expiration times.
- Avalanche: prevents mass simultaneous expiry.

### 6. Bloom Filters for Penetration
- Filter for "key definitely doesn't exist" before hitting origin.

## Real Production Examples

- **Reddit's classic outage** (2010s) — cache stampede on hot threads.
- **High-traffic e-commerce** — flash sales trigger stampedes on hot products.
- **Memcached "lease" feature** — coordinates re-fetch.
- **Cloudflare's "stale-while-revalidate"** — CDN-level mitigation.
- **Redis SETNX-based locks** — common single-flight pattern.

## Design Tradeoffs

**Coalescing:**
- Simple; very effective.
- One miss → one fetch; rest wait.

**PER:**
- Eliminates synchronized refresh.
- Some early refreshes wasted.

**Stale-while-revalidate:**
- Best UX; users never wait for refresh.
- Returns slightly stale data.

## Interview Perspective

**Common questions:**
- "Cache stampede?" → Cache miss on hot key → all concurrent requests hit origin.
- "How to prevent?" → Request coalescing, PER, locks, stale-while-revalidate, TTL jitter.
- "Difference from cache penetration?" → Stampede: hot key, brief outage. Penetration: keys that don't exist.

**Senior-level:**
- The hot-key problem from [[Hot Partitions]] interacts with stampede — hot keys are exactly the ones whose cache loss is catastrophic.
- Stale-while-revalidate is the modern best practice; eliminates the user-facing impact.
- Bloom filters for penetration are clever — block obvious not-present queries before hitting origin.

**Common mistakes:**
- No protection → first stampede crashes origin.
- Synchronized TTLs → avalanche.
- Caching null responses without TTL → permanent block on valid future writes.

## Related Concepts


- [[Caching]] · [[Cache Strategies]] · [[Hot Partitions]] · [[Rate Limiting]] · [[Circuit Breakers]]
- [[LRU]] — related concept.

## Misconceptions

- **"Bigger cache = no stampede."** Stampede happens on miss; size doesn't prevent misses.
- **"Stale-while-revalidate is risky."** Bounded staleness is usually acceptable.
- **"Stampede only matters for hot keys."** Avalanche affects everything simultaneously.

## Failure Scenarios

- **Synchronized TTLs** → avalanche.
- **Hot-key cache eviction** → stampede.
- **Cache restart** → cold-start stampede.
- **Penetration via random IDs.**

## Practical Engineering Heuristics

- **Add jitter to TTLs** (±10%).
- **Use single-flight** (request coalescing) for hot keys.
- **Stale-while-revalidate** in your cache layer.
- **Negative cache** (small TTL) for penetration.
- **Pre-warm cache** after restarts.

## Active Recall Questions

What's a cache stampede?::Cache miss on a hot key → many concurrent requests all hit origin → overwhelm origin.

What's cache avalanche?::Many cache entries expire simultaneously → mass cache misses → origin overwhelmed.

What's cache penetration?::Requests for keys that don't exist in cache or origin — every request hits origin.

What's request coalescing?::First miss fetches from origin; concurrent misses wait for that fetch. One origin call serves many.

What's stale-while-revalidate?::Return stale cache immediately; refresh in background. No user-facing wait on miss.

How does TTL jitter prevent avalanche?::Random variation prevents synchronized expiration. Misses spread over time rather than all at once.

What's negative caching?::Caching "doesn't exist" responses with short TTL. Prevents cache penetration attacks.

## Feynman Test

A flash sale starts. A hot product's cache entry expires. Walk through what happens with and without coalescing.

Why does adding TTL jitter prevent cache avalanche?

## Mastery Checklist

- **Explain** stampede, avalanche, penetration.
- **Compare** mitigation strategies.
- **Derive** appropriate mitigation for a workload.
- **Critique** caches without stampede protection.
- **Design** a high-traffic caching layer with all relevant mitigations.

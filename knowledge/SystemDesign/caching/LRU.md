---
title: LRU
area: caching
status: stub
difficulty: intermediate
prerequisites: ["[[Caching]]"]
related: ["[[Eviction Policies]]", "[[Caching]]", "[[Distributed Caching]]"]
builds_toward: ["[[Cache Strategies]]", "[[Memcached]]"]
sources: [conversation-2026-06-10]
tags: [caching, eviction, lru]
created: 2026-06-10
last_reviewed: 2026-06-10
---

# LRU

## Executive Summary

**Least Recently Used (LRU)** is a cache eviction policy that discards the entry that has not been accessed for the longest time when the cache is full and a new item must be admitted. It approximates the optimal offline eviction algorithm (Bélády's) by using recency of access as a proxy for future demand. LRU is the default eviction strategy in Memcached and a common choice in Redis; it is also the basis for TLB and OS page replacement algorithms.

## Why This Exists

Caches have bounded capacity. When a new item must be stored and the cache is full, the eviction policy decides which existing item to remove. The ideal choice is the item that will be accessed furthest in the future (Bélády's optimal algorithm) — but that requires knowing the future. LRU approximates this by assuming **recently used items are likely to be used again soon** (temporal locality). This holds well for most web workloads, database buffer pools, and CDN edge caches.

## Core Intuition

Imagine a rack of folders on your desk. Every time you use a folder you move it to the front. When the rack is full and you need space, you discard the folder at the back — the one you haven't touched in the longest time. That's LRU.

Formally: maintain an ordered list of cached items sorted by last-access time. On access, move the item to the head (most-recently-used end). On eviction, remove the item at the tail (least-recently-used end).

### Canonical O(1) Implementation

The classic interview implementation uses a **doubly-linked list + hash map**:

- **Hash map** `key → node`: O(1) lookup.
- **Doubly-linked list**: nodes ordered by recency; head = MRU, tail = LRU.
- **Access (get/put)**: look up via hash map, splice node to head — O(1).
- **Eviction**: remove tail node and its hash map entry — O(1).

```
Head (MRU) <-> [D] <-> [B] <-> [A] <-> [C] <-> Tail (LRU)
                                                    ^ evict next
```

All operations — get, put, evict — are O(1) time and O(capacity) space.

### Key Variants

| Variant | Mechanism | When to prefer |
|---|---|---|
| **LRU** (standard) | Doubly-linked list + hash map | General-purpose; most workloads |
| **LRU-K** | Track K-th most recent access; evict item with oldest K-th access | Scans don't pollute cache; database buffer pools |
| **2Q** | Admission queue (FIFO) + main LRU queue; only promote to main after second access | Scan-resistant; less metadata than LRU-K |
| **Clock / CLOCK-Pro** | Circular buffer with reference bit; cheap approximation of LRU | OS page replacement; avoids list manipulation overhead |
| **Segmented LRU (SLRU)** | Protected + probationary segments; demote from protected on eviction pressure | Used in Caffeine (Java), Guava; better hit rate on bursty workloads |
| **TinyLFU + LRU (W-TinyLFU)** | Frequency sketch guards LRU window; best overall hit rate | Caffeine default; near-optimal for mixed workloads |

## Design Tradeoffs

| Dimension | LRU | Notes |
|---|---|---|
| Hit rate | High for temporal-locality workloads | Degrades on sequential scans (cache pollution) |
| Implementation complexity | Low — doubly-linked list + hash map | O(1) all operations |
| Scan resistance | Poor | LRU-K / 2Q / SLRU address this |
| Frequency awareness | None | Items accessed once recently beat items accessed 1000× yesterday |
| Memory overhead | Low — two pointers per node | Hash map load factor tuning matters at scale |
| Thread safety | Requires locking or lock-free list | Bottleneck at very high concurrency; use sharded or approximation strategies |
| Distributed LRU | No native cross-node ordering | Must approximate (e.g., TTL-based expiry as proxy) |

### When LRU Fails

1. **Sequential scans**: iterating a large table loads the cache with items accessed exactly once, evicting hot items ("cache pollution"). LRU-K and 2Q mitigate this.
2. **Cyclic access patterns larger than cache**: a workload cycling through N items where N > cache size produces 0% hit rate under LRU (the "thrashing" scenario).
3. **Hot-cold skew ignored**: a key accessed 10,000 times yesterday but not in the last second will be evicted before a key accessed once a second ago. LFU or TinyLFU are better here.

## Production Usage

| System | LRU role |
|---|---|
| **Memcached** | Default and only eviction policy; slab-class LRU |
| **Redis** | One of several policies (`allkeys-lru`, `volatile-lru`); approximated via random sampling |
| **Linux page cache** | Clock approximation of LRU for OS page replacement |
| **CPU TLB / hardware caches** | Hardware LRU or pseudo-LRU for small associativity |
| **Database buffer pools** (InnoDB, Postgres) | LRU-K variant; "young" and "old" sub-lists in InnoDB |
| **CDN edge caches** | LRU with TTL; Varnish uses a variant |
| **Caffeine (Java)** | W-TinyLFU: LRU window + TinyLFU admission filter |

### Redis LRU Approximation

Redis does **not** maintain a true doubly-linked list across all keys (too much memory overhead at millions of keys). Instead:
- Each key stores a 24-bit LRU clock timestamp on last access.
- On eviction, Redis samples a configurable number of random keys (`maxmemory-samples`, default 5) and evicts the one with the oldest timestamp.
- Increasing the sample size improves approximation quality at the cost of CPU.
- This is O(1) memory overhead per key and avoids list manipulation but is not exact LRU.

### Memcached Slab LRU

Memcached groups items into slab classes by size. Each slab class maintains its own LRU list. This avoids fragmentation but means eviction is per-size-class: a large-item class can evict frequently-used items while a small-item class has free space.

## Distributed LRU

True LRU across a distributed cache cluster is impractical: there is no global ordering of access times without coordination. In practice:
- Each node runs its own LRU independently.
- Cross-node "LRU" is approximated with TTL-based expiry.
- Consistent hashing assigns keys to nodes deterministically, so a key's LRU state lives on exactly one node.
- **Local LRU + global TTL** is the canonical production pattern.

## Interview Angle

LRU cache design is one of the most common coding interview questions. The answer is always the doubly-linked list + hash map, but interviewers also probe:
- Thread-safe LRU (segment the hash map, one lock per segment; or use `ConcurrentHashMap` + atomic moves).
- LRU at scale (distributed: consistent hashing + per-node LRU; approximate: Redis sampling).
- When LRU is the wrong choice (scans, frequency-heavy workloads).
- Capacity planning: what cache size achieves a target hit rate? (Requires knowledge of the working set.)

## Related Concepts

- [[Eviction Policies]] — full taxonomy of eviction strategies (LFU, FIFO, TTL, Random) alongside LRU.
- [[Caching]] — the broader concept LRU serves; hit rate, miss rate, warm-up.
- [[Distributed Caching]] — how LRU operates (or approximates) across a cluster.
- [[Cache Stampede]] — what happens on a cold cache or mass eviction; LRU settings affect stampede risk.
- [[Memcached]] — canonical system using LRU as its sole eviction policy.
- [[Cache Strategies]] — write-through, write-behind, read-through; orthogonal to but interacting with eviction.

## Active Recall Questions

What data structures implement O(1) LRU get and put, and why are both needed?::A doubly-linked list (ordered by recency, O(1) splice to head) combined with a hash map (O(1) key-to-node lookup); neither alone provides both constant-time lookup and constant-time reordering.

Why does a sequential scan degrade LRU hit rate, and which variant fixes it?::A scan loads the cache with single-access items that immediately occupy the MRU end, evicting hot items; LRU-K (track K-th most recent access) or 2Q (require two accesses before promotion) fix this by making one-time items ineligible for the main cache.

How does Redis approximate LRU without maintaining a full doubly-linked list?::Each key stores a 24-bit last-access timestamp; on eviction Redis randomly samples N keys (default 5) and removes the one with the oldest timestamp, trading exactness for O(1) memory overhead and no list manipulation.

Under what access pattern does LRU produce a 0% hit rate (thrashing)?::When a workload cyclically accesses N distinct items and N is larger than the cache capacity, every access is a miss because the next needed item was always just evicted.

What is the difference between LRU and W-TinyLFU, and when does W-TinyLFU win?::W-TinyLFU uses a frequency sketch (TinyLFU) as an admission filter in front of an LRU window; it wins when workloads have heavy-hitter keys (high frequency) that pure LRU would evict in favor of recently-accessed-but-cold items.

How does Memcached's slab-based LRU differ from a single global LRU, and what problem can this cause?::Each slab class (size bucket) has its own independent LRU list; a large-object slab can evict hot items while a small-object slab has free slots, leading to suboptimal overall eviction decisions that a single global LRU would avoid.

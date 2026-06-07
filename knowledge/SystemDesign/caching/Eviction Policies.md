---
title: Eviction Policies
area: caching
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]"]
related: ["[[Caching]]", "[[Cache Strategies]]"]
sources:
  - SDI vol 1
  - Redis docs
tags: [caching, eviction, algorithms]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Eviction Policies

## Executive Summary

When a cache fills, the **eviction policy** decides which items to remove to make room. The five canonical policies: **LRU (Least Recently Used)** — evict the longest-untouched; **LFU (Least Frequently Used)** — evict the least-accessed; **FIFO (First In, First Out)** — evict the oldest insert; **TTL** — evict by age; **Random** — evict arbitrary. LRU is the default in most caches; LFU wins for stable access patterns; FIFO is simple but blind to access. Choosing the right policy matters at scale — wrong eviction = lower hit ratio = poor performance.

## Why This Exists

Caches are size-bounded by definition. Once full, every new item displaces an old one. Which old one? The choice profoundly affects hit ratio. A naïve choice (random) wastes the cache's predictive value; a smart choice (LRU/LFU) preserves locality.

## Core Intuition

Your kitchen counter holds 10 ingredients. The 11th arrives. Which do you put back in the pantry? The one you used longest ago (LRU)? The one used least often (LFU)? The first one you put on the counter (FIFO)? Each rule produces different hit/miss patterns.

## The Canonical Policies

### LRU (Least Recently Used)

Evict the item not accessed for the longest time. Exploits temporal locality: recently used → likely used again.

**Implementation:** doubly-linked list + hash map. O(1) operations.

**Pros:** simple; works well for most workloads; default in Redis, Memcached.
**Cons:** scan resistance — a one-time sweep evicts hot items.

### LFU (Least Frequently Used)

Evict the item accessed least often historically.

**Implementation:** count-based with min-heap or hash + freq buckets.

**Pros:** stable for long-term hot items.
**Cons:** stale-frequency problem — old items with high historical count stay. Mitigation: aging (decay counts).

**LFU-DA (LFU with Dynamic Aging):** balances frequency with recency.

### FIFO (First In, First Out)

Evict the oldest inserted, regardless of access.

**Pros:** trivial.
**Cons:** ignores access patterns. Often worse than LRU.

### TTL (Time-To-Live)

Items expire after a fixed lifetime.

**Pros:** bounded staleness guaranteed.
**Cons:** not a true eviction policy — combined with others.

### Random

Evict a randomly chosen item.

**Pros:** trivial; works surprisingly well at scale (matches LRU in some studies).
**Cons:** no signal from access pattern.

### Advanced: ARC (Adaptive Replacement Cache)

Balances LRU and LFU dynamically. Used in ZFS. Patent issues prevent wider adoption.

### Advanced: LRU-K

Tracks last K accesses; evicts based on Kth-most-recent.

## Real Production Examples

- **Redis** — LRU and LFU configurable; `volatile-lru`, `allkeys-lfu`, etc.
- **Memcached** — LRU.
- **Linux page cache** — variation of LRU (2-list).
- **CDN edges** — usually LRU with TTLs.
- **CPU caches** — pseudo-LRU (PLRU); cheaper than true LRU.

## Design Tradeoffs

**LRU:** simple, broadly good. Vulnerable to scans.
**LFU:** stable patterns. Stale frequency issue.
**FIFO:** simple. Ignores access. Often suboptimal.
**Random:** trivially scalable. Surprisingly competitive at very large scales.

## Interview Perspective

**Common questions:**
- "Explain LRU." → Evict the item not accessed for the longest. O(1) via linked list + hash map.
- "When LFU > LRU?" → Workloads with stable hot items. LFU resists scans.
- "Implementation?" → Linked list + hash map for LRU; counters + heap for LFU.

**Senior-level:**
- Scan resistance matters at scale. A single full-table scan can evict every hot item under LRU. Mitigations: 2-list LRU, segmented LRU.
- LFU's aging problem: an item hot in 2010 holds high count forever. Use LFU-DA or LFU with windows.
- Random's "good enough" reputation comes from large-scale studies (Belady et al. and modern CDN papers).

**Common mistakes:**
- Default LRU under scan-heavy workload → poor hit ratio.
- LFU without aging → calcified frequency counts.
- Optimizing eviction in the wrong cache.

## Related Concepts

- [[Caching]] · [[Cache Strategies]]

## Misconceptions

- **"LRU is always best."** Scans destroy it.
- **"More clever = better."** Often LRU + good TTL beats complex policies.
- **"Eviction is what slows caches."** Eviction is fast; miss handling is slow.

## Failure Scenarios

- **Scan evicts hot items** under LRU.
- **Stale-frequency lock-in** under LFU.
- **Pathological access pattern** that defeats any policy.

## Practical Engineering Heuristics

- **Default to LRU.**
- **Use LFU for stable hot-item workloads** with aging.
- **Combine with TTL** for bounded staleness.
- **Measure hit ratio** — tune if low.
- **2-list LRU** if scans are common.

## Active Recall Questions

What's LRU?::Least Recently Used. Evict item not accessed for longest. Implementation: linked list + hash map. O(1).

What's LFU?::Least Frequently Used. Evict item accessed least often historically.

LRU vs LFU trade-off?::LRU: simple, broadly good, vulnerable to scans. LFU: stable hot items, aging problem.

What's the scan-resistance problem?::A one-time scan of cold data evicts hot items from LRU cache. Mitigation: 2-list LRU.

Why does random eviction sometimes work?::At very large scales, random eviction approximates LRU statistically. Cheap; no metadata.

What's LFU-DA?::LFU with Dynamic Aging. Decays old frequency counts so recent activity weighs more.

## Feynman Test

A workload alternates between scanning all data and accessing hot items. Which eviction policy?

Why does LRU implementation use both a linked list and a hash map?

## Mastery Checklist

- **Explain** LRU, LFU, FIFO, Random.
- **Compare** their hit-ratio behavior.
- **Derive** which policy fits a given workload.
- **Critique** default-LRU under scan-heavy load.
- **Design** an eviction policy combining LRU + TTL.

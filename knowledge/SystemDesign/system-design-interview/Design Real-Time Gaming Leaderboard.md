---
title: Design Real-Time Gaming Leaderboard
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[Distributed Caching]]"]
related: ["[[Design Metric Monitoring]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.10 ("Real-Time Gaming Leaderboard")
  - Redis Sorted Set docs
tags: [system-design-interview, advanced-design, leaderboard]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Real-Time Gaming Leaderboard

## Executive Summary

Top-K player ranking with rapid updates and queries: "current top 100", "what's my rank?", "players near me". The standard answer is **Redis Sorted Sets (ZSET)** — `O(log N)` insert/update, `O(log N + K)` top-K, `O(log N)` rank lookup.

## Requirements

**Functional:** Submit score; get top K; get my rank; get players near me.

**Non-functional:**
- 10 M DAU; ~10 k score updates/s.
- Top-K queried millions of times/s.
- Latency <50 ms.

## High-Level Design

```
score submit ──► API ──► Redis ZSET (leaderboard key)
                              │
                              ▼
              top-K / rank queries served from same ZSET
              (sharded by tournament / time period)
```

## Design Deep Dive

### Redis Sorted Set

- ZADD: insert/update score in O(log N).
- ZREVRANGE 0 99 → top 100 in O(log N + 100).
- ZREVRANK userid → my rank in O(log N).

### Sharding

- Single ZSET fits ~10 M players in <1 GB RAM.
- For billions: shard by region / tournament / time bucket; aggregate via approximate top-K.

### Persistence

- Redis RDB snapshots + AOF.
- Source of truth: RDBMS for canonical scores; Redis for hot leaderboard.

### Time-bucketed leaderboards

- Daily / weekly / monthly leaderboards: distinct ZSET per window.
- Expire old ZSETs.

### Tied scores

- Use score + timestamp encoded as single floating value (score × 10^10 - timestamp_ms), ensuring strict order.

### Read amplification

- Top-K is cached at edge; refresh every N seconds.

## Failure Modes

- **Redis crash** — fall back to DB; rebuild ZSET on recovery.
- **Hot key (single global leaderboard)** — replicas for reads; shard.
- **Score manipulation / cheating** — server-side validation + anti-cheat.
- **Long-tail sharded "near me"** — requires global rank; approximate.

## Real Production

- **Mobile games** — Redis-based leaderboards ubiquitous.
- **Riot, Blizzard, Epic** — variants with anti-cheat layered.
- **Twitch, Twitter trending** — analogous data structures.

## Interview Talking Points

- ZSET algorithm + complexity.
- Sharding for billions.
- Time-bucketed leaderboards.
- Source-of-truth split (DB + cache).
- Tied-score ordering trick.

## Related Concepts

- [[Distributed Caching]] — Redis backbone.
- [[Design Metric Monitoring]] — adjacent (time-series).

## Active Recall Questions

What Redis data structure is canonical for leaderboards?::Sorted Set (ZSET) — provides O(log N) insert/update, O(log N + K) top-K, O(log N) rank lookup.

What's the time complexity of ZREVRANK userid?::O(log N) where N is the number of players in the sorted set.

How do you handle a billion-player global leaderboard?::Shard by region / tournament / time bucket; for global top-K combine sharded results with approximate merge.

How do you break ties consistently?::Encode (score, timestamp) into a single float (score × 10^10 - timestamp_ms); ensures strict ordering and consistent rank.

How are time-windowed leaderboards (daily/weekly) implemented?::Distinct ZSETs per window keyed by date; expire old ones; aggregate scores via separate keys.

What's the durability story when only Redis holds rankings?::Use RDB + AOF for in-memory durability; for canonical scores, write to RDBMS; rebuild ZSET from DB on recovery.

Why is Redis a single point of failure here and how do you mitigate?::Replicas for reads, sentinel/cluster for failover, periodic snapshots; DB as source of truth means leaderboard is rebuildable.

## Feynman Test

How does Redis compute "my rank" in microseconds over 10M players — what's the underlying data structure that makes it fast?

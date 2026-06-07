---
title: Design URL Shortener
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[4-Step Framework]]", "[[Back-of-Envelope]]"]
related: ["[[Design Unique ID Generator]]", "[[Caching]]", "[[Consistent Hashing]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.8 ("Design a URL Shortener")
  - system-design-primer — "Design Pastebin/Bit.ly"
  - bit.ly engineering blog
tags: [system-design-interview, classic-design]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design URL Shortener

## Executive Summary

A URL shortener (TinyURL/bit.ly) maps long URLs to short tokens (`bit.ly/3xY7q9`) and redirects. The problem is mostly **read-heavy KV lookup at scale** + **collision-free ID generation** + **analytics**. The classic interview answer: base62 encoding of a globally unique counter (or hash-based), KV store backed by Redis cache + sharded RDBMS / DynamoDB.

## Requirements

**Functional:**
- Shorten a long URL → return short URL.
- Redirect short URL → long URL.
- (Optional) custom alias, expiration, analytics.

**Non-functional:**
- 100M new URLs/day; ~1 B reads/day (10:1 read:write).
- 100 ms p99 redirect latency.
- 99.99% availability.
- URLs unguessable (security) but not encrypted (perf).

## Back-of-Envelope

- **Write QPS:** 100M / 86,400 ≈ 1,200/s; peak ~3,600/s.
- **Read QPS:** 1 B / 86,400 ≈ 12k/s; peak ~36k/s.
- **Storage (10 years):** 100M × 365 × 10 × ~500 B/record ≈ 180 TB.
- **Cache (hot 20%):** ~36 TB; obviously partial, e.g., last-7-days hot = single-digit TB.

## High-Level Design

```
        ┌──────────┐   POST /shorten     ┌──────────┐
client──►│  LB / API├─────────────────────►│  Write   ├──► ID gen
        └──────────┘                      │  Service │
                                          └────┬─────┘
                                               ▼
                                         ┌──────────┐
                                         │   KV DB  │ (short → long)
                                         └──────────┘
                                               ▲
client──►LB──► Redirect Service ──cache─Redis──┘
                          │
                          └─► analytics queue (Kafka)
```

## Design Deep Dive

### URL → short ID

**Two approaches:**
1. **Counter + base62**: maintain a global counter; encode to 7-char base62 (~3.5T values). Pros: short, predictable. Cons: requires globally-unique sequence — Snowflake, Zookeeper, or DB sequence.
2. **Hash-based**: SHA-256(long_url + salt), take first 7 chars base62. Pros: stateless. Cons: collisions → must retry-with-suffix.

**Choice:** counter + base62 via [[Design Unique ID Generator|Snowflake]]-style IDs, encoded base62 for short representation. 7 chars handles $62^7 ≈ 3.5 \times 10^{12}$ URLs.

### Storage

- **Schema:** `short_id (PK), long_url, created_at, expires_at, owner_id, click_count`.
- **Engine:** sharded RDBMS (Postgres) or DynamoDB; partition by `short_id` (hashed, even spread).
- 180 TB doesn't fit one node — shard.

### Read path

- Redirect is the hot path. Cache aggressively in Redis (LRU on hot URLs).
- Cache hit ratio target >95%. Cold lookup: DB ~5 ms; hot: Redis ~1 ms.
- Use HTTP 301 (cacheable; CDN/browser caches) or 302 (not cached; preserves analytics). 302 is more common in practice.

### Custom aliases

- Accept user-chosen short_id; check uniqueness; reject if taken.

### Analytics

- Don't write-amplify the redirect path. Emit event to Kafka → batch into warehouse.

### Availability & scale

- Multiple regions; replicate cache + DB; geo-DNS routing.
- API gateway + autoscaling for write path.
- DB shards keep capacity linear in data.

## Failure Modes

- **ID collision** in hash approach — handle via retry with salt.
- **Hot URL** (viral link) — cache + edge CDN; possibly serve from CDN entirely.
- **DB shard hot key** — pre-warm cache; shard by hashed ID.
- **Cache stampede** when popular URL expires — use [[Cache Stampede]] mitigations (probabilistic refresh, locks).
- **Custom alias squatting** — rate-limit registrations.

## Real Production

- **Bit.ly** — open-sourced parts; uses Riak historically.
- **TinyURL** — pioneer.
- **goo.gl** (Google) — used Bigtable, deprecated 2018.
- **t.co** (Twitter) — internal redirector.

## Interview Talking Points

- Read:write ratio justifies cache-heavy architecture.
- ID gen choice (counter vs hash) is the central tradeoff to discuss.
- 301 vs 302 (caching vs analytics) is a high-signal detail.
- Discuss preventing abuse (malicious URLs, spam).

## Related Concepts

- [[Design Unique ID Generator]] — ID gen subsystem.
- [[Caching]] — read-path cache strategy.
- [[Consistent Hashing]] — DB sharding.
- [[Rate Limiting]] — abuse mitigation.

## Active Recall Questions

What's the typical read-to-write ratio for URL shorteners?::~10:1 (e.g., 100M writes/day, 1 B reads/day) — drives a cache-heavy architecture.

Why is base62 a natural encoding for short IDs?::URL-safe chars (a-z, A-Z, 0-9); 62^7 ≈ 3.5T addresses fit in 7 characters.

What are the two main ID-generation approaches and their trade-offs?::Counter + base62 (short, requires global sequence) vs hash of URL (stateless, requires collision handling).

What's the difference between 301 and 302 in URL shortener redirects?::301 (permanent) is cacheable by browsers/CDNs (fewer hits, but no per-redirect analytics); 302 (temporary) is uncached (every click hits your server, preserving analytics). Most use 302.

How would you handle a viral (hot) short URL receiving millions of QPS?::Aggressive caching (Redis + CDN/edge), possibly serve entirely from CDN; pre-warm cache; rate-limit analytics flush.

What storage scale should you estimate over 10 years for 100M writes/day at 500 B/record?::~180 TB — drives sharding requirement.

How do you handle custom alias collisions?::Check uniqueness on insertion (DB unique constraint); return error to client; rate-limit alias registrations to prevent squatting.

## Feynman Test

Walk through what the system does end-to-end when a user clicks `bit.ly/abc123` — name every component touched and the latency budget for each.

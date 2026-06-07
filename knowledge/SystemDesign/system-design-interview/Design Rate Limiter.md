---
title: Design Rate Limiter
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[Rate Limiting]]", "[[Token Bucket]]"]
related: ["[[Caching]]", "[[Distributed Caching]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.4 ("Design a Rate Limiter")
  - Stripe engineering — "Scaling rate limiters"
  - Cloudflare blog
tags: [system-design-interview, classic-design, rate-limiting]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Rate Limiter

## Executive Summary

A rate limiter caps the number of requests a client can make in a window, protecting upstream services from abuse and overload. Interview-grade design: choose an algorithm ([[Token Bucket]] most common), pick where the limiter sits (gateway / middleware / sidecar), and design the **distributed counter** (Redis with Lua atomicity is the standard answer).

## Requirements

**Functional:**
- Allow N requests / time window per key (user, IP, API key).
- Reject excess with HTTP 429 + `Retry-After` header.
- Support multiple rules (per-endpoint, per-tier).

**Non-functional:**
- Sub-ms latency overhead.
- High accuracy across distributed servers.
- Fault-tolerant (limiter failure shouldn't take down service).

## Back-of-Envelope

- Per request, limiter adds <2 ms (target).
- For 1 M QPS service, limiter must scale to 1 M lookups/s.
- Per-key state: ~32 B; for 100 M keys → 3.2 GB in Redis (fits in single node, easily shardable).

## Algorithm Choices (compare in interview)

| Algorithm | Pros | Cons |
|---|---|---|
| **Token Bucket** | Allows bursts; smooth average | Two parameters (rate, capacity) |
| **Leaky Bucket** | Enforces uniform rate | No bursts |
| **Fixed Window** | Simple, single counter | Spike at window edges |
| **Sliding Window Log** | Exact | Memory: 1 entry per request |
| **Sliding Window Counter** | Approx of log, fixed memory | Slight inaccuracy |

**Pick:** Token bucket for most APIs (burst-friendly); sliding window counter when accuracy matters.

## High-Level Design

```
client ──► API gateway / sidecar ──► Rate Limiter ──► upstream service
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │  Redis       │ (counter + script)
                                  └──────────────┘
```

## Design Deep Dive

### Where to place the limiter

- **Edge (CDN/Cloudflare):** stops attack traffic before origin; coarse, often IP-only.
- **API Gateway:** per-account/key; good for "global" SaaS limits.
- **Service middleware:** per-endpoint, per-tier; finest granularity.
- **Sidecar (Envoy ratelimit):** decouples from app; standard at scale.

Usually layered: edge → gateway → service.

### Distributed counter — the hard part

Counters must be consistent across N service instances. Standard approach:

**Redis + Lua atomic script** implementing the algorithm:
```lua
-- token bucket pseudocode
local now = redis.call("TIME")
local key = KEYS[1]
local tokens = redis.call("HGET", key, "tokens") or capacity
local last_refill = redis.call("HGET", key, "last_refill") or now
-- refill: tokens = min(capacity, tokens + elapsed * rate)
-- if tokens >= cost: deduct & allow; else reject
```

Lua ensures atomicity (Redis is single-threaded per shard).

**Sharding:** hash key → shard. Per-key concentration on a single shard is fine; cross-key fan-out is parallel.

### Failure modes

- **Redis unavailable** → fail-open (allow), fail-closed (deny), or fall back to local approximate counter. Most prefer **fail-open** to avoid taking down the service.
- **Clock skew** between Redis and app — use Redis-side `TIME`.
- **Hot key (one user attacked)** — shard not enough; use local in-process counter with periodic Redis sync for top-N attackers.
- **Cache stampede on counter expiry** — atomic refresh.

### Headers (good UX)
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After`

## Real Production

- **Stripe**: token bucket on per-API-key + per-endpoint; Redis backend.
- **GitHub**: 5,000 req/hr/auth user; sliding window counter.
- **Cloudflare**: edge + WAF + leaky bucket variants.
- **Envoy `ratelimit` service**: standard sidecar.
- **AWS API Gateway, Kong, Apigee**: managed.

## Interview Talking Points

- Explicitly compare 5 algorithms; pick one with reasoning.
- Discuss centralized (Redis) vs local + sync.
- Discuss fail-open vs fail-closed policy.
- Mention headers, error code (429), retry semantics.
- Address hot-key + DDoS scenarios.

## Related Concepts

- [[Rate Limiting]] — algorithmic overview.
- [[Token Bucket]] — preferred algorithm.
- [[Distributed Caching]] — Redis-backed counter.
- [[Circuit Breakers]] — sibling protection pattern.

## Active Recall Questions

What are the five common rate-limiting algorithms?::Token bucket, leaky bucket, fixed window, sliding window log, sliding window counter.

Why is the token bucket algorithm the typical default?::Allows bursts (good UX) while maintaining average rate; only two parameters (rate, capacity).

Why use a Lua script in Redis for rate limiting?::Atomic execution — read counter, check, decrement in one operation; avoids race conditions across multiple service instances.

What HTTP status code and header convey rate-limit rejection?::HTTP 429 ("Too Many Requests") + Retry-After header (and ideally X-RateLimit-* headers).

What is fail-open vs fail-closed for the limiter?::Fail-open: if Redis is down, allow traffic (preserves availability, weakens protection). Fail-closed: deny (preserves protection, kills availability). Most pick fail-open for availability.

How do you handle a hot key (single attacker hammering one endpoint)?::Local in-process counter with periodic Redis sync; shard-level isolation; possibly drop at the edge.

Where in the stack should rate limiting sit?::Layered — edge (CDN) for DDoS, gateway for per-account global limits, service middleware/sidecar for fine-grained per-endpoint limits.

## Feynman Test

Walk through how a token-bucket limiter for 100 req/min handles a client that suddenly sends 50 requests in 1 second — what's the user experience and what state changes?

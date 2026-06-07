---
title: Rate Limiting
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Token Bucket]]", "[[Circuit Breakers]]", "[[Backpressure]]"]
builds_toward: ["[[Token Bucket]]"]
sources:
  - SDI vol 1, Ch. 4 (dedicated chapter)
  - system-design-primer
tags: [reliability, resilience, rate-limiting]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Rate Limiting

## Executive Summary

**Rate limiting** caps the **number of requests a client (or API) can make in a given time window**. Protects services from abuse, prevents cascading failures, enforces fairness, monetization, and quotas. Common algorithms: **token bucket**, **leaky bucket**, **fixed window**, **sliding window**. Implementation locations: **at edge (CDN, API gateway), in app, in load balancer**. Without rate limiting, one bad client (or runaway script) can take down the system.

## Why This Exists

Without limits, abusive clients (malicious or bug) consume disproportionate resources. Even friendly clients can flood by mistake. Rate limiting enforces fairness, protects backends, enables tiered service (free vs paid), and is the first defense against DDoS at the application layer.

## Core Intuition

A water fountain in a busy office. If anyone could drink as much as they want, one heavy user blocks others. Limit: 1 cup per minute per person. Now everyone gets fair access. Same for APIs.

## Common Algorithms

### Token Bucket
- Bucket holds N tokens; refills at rate R.
- Each request consumes a token.
- Empty bucket → reject.
- Allows bursts up to bucket size.

### Leaky Bucket
- Requests enter a fixed-size queue.
- Processed at fixed rate.
- Full queue → reject.
- Smooths bursts.

### Fixed Window
- Counter resets every interval (e.g., minute).
- Within window: allow up to N requests.
- Simple but allows 2N at window boundary.

### Sliding Window
- Counter for rolling time period.
- More accurate than fixed window.
- Slightly more computation.

See [[Token Bucket]] for detailed algorithm.

## Implementation Locations

- **CDN edge** — first line of defense.
- **API Gateway** — centralized policy.
- **Reverse proxy** — Nginx, HAProxy modules.
- **Application** — per-endpoint limits.
- **Distributed** — shared state (Redis) across instances.

## Design Tradeoffs

**Benefits:**
- Protects backends.
- Enforces fairness.
- Enables tiered service.
- DDoS mitigation.

**Costs:**
- State management (distributed limits).
- False positives.
- Implementation complexity.

## Real Production Examples

- **AWS API Gateway** — per-API rate limits.
- **Cloudflare** — edge rate limiting.
- **Stripe** — graduated limits per customer.
- **Twitter, GitHub APIs** — published rate limits.
- **Redis-based distributed limiters.**

## Interview Perspective

**Common questions:**
- "Why rate limit?" → Protect backends, enforce fairness, prevent abuse.
- "Algorithms?" → Token bucket, leaky bucket, fixed window, sliding window.
- "Where implement?" → Edge / gateway / app / proxy. Combine for defense in depth.

**Senior-level:**
- Distributed rate limiting needs shared state (Redis) and atomic operations.
- Limits should be per-API-key, per-IP, per-user — not just global.
- Communicate limits via HTTP headers (X-RateLimit-Remaining, Retry-After).

**Common mistakes:**
- No rate limiting → first DDoS attempt succeeds.
- Limits too strict → legitimate users blocked.
- No retry hints → clients hammer harder.

## Related Concepts

- [[Token Bucket]] · [[Circuit Breakers]] · [[Backpressure]] · [[API Gateway]]

## Misconceptions

- **"Rate limit = DDoS protection."** Helps; specialized DDoS mitigation needed for serious attacks.
- **"One limit fits all."** Tier by customer, endpoint, sensitivity.
- **"Edge limit enough."** Defense in depth.

## Failure Scenarios

- **Distributed counter inconsistent** under partition.
- **Legitimate users blocked** by overly strict limits.
- **DDoS bypasses** edge limit via varied IPs.

## Practical Engineering Heuristics

- **Limit at edge AND in app.**
- **Per-key (not just global).**
- **Token bucket common default.**
- **Communicate via 429 + Retry-After.**
- **Redis for distributed limits.**

## Active Recall Questions

What's rate limiting?::Cap on requests per client per time window. Protects backends, enforces fairness.

Four common algorithms?::Token bucket, leaky bucket, fixed window, sliding window.

Token bucket vs leaky bucket?::Token: bucket holds tokens, refills at rate. Allows bursts. Leaky: fixed-rate processing of queued requests. Smooths bursts.

How communicate rate limit to client?::HTTP 429 (Too Many Requests) + Retry-After header. Optional: X-RateLimit-Limit/-Remaining headers.

How distribute rate limiting across instances?::Shared state in Redis with atomic INCR operations.

Where to limit?::CDN edge, API gateway, app, proxy. Defense in depth.

## Feynman Test

Design rate limiting for a public API with 3 tiers (free, paid, enterprise).

Why is distributed rate limiting harder than single-instance?

## Mastery Checklist

- **Explain** rate limiting and algorithms.
- **Compare** algorithms' burst behavior.
- **Derive** appropriate limits per tier.
- **Critique** services without rate limiting.
- **Design** multi-tier rate limit layer.

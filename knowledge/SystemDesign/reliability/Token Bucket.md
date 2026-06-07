---
title: Token Bucket
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[Rate Limiting]]"]
related: ["[[Rate Limiting]]"]
sources:
  - SDI vol 1 Ch.4
tags: [reliability, rate-limiting, algorithm]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Token Bucket (and Leaky Bucket)

## Executive Summary

The **Token Bucket** and **Leaky Bucket** are the two canonical algorithms for [[Rate Limiting]]. **Token Bucket**: a bucket holds tokens, refills at rate R, requests consume tokens; allows bursts. **Leaky Bucket**: requests fill a queue, drained at fixed rate; smooths bursts. Token bucket is **more permissive** (allows bursts up to bucket size); Leaky bucket **smooths output** at a steady rate. Choice depends on whether bursts are acceptable.

## Why This Exists

Different rate-limit semantics suit different needs. APIs often want "burst tolerance" — a client can briefly exceed average rate, as long as they recover. Streaming systems want "smoothed output" — strict rate regardless of input. The two algorithms encode these trade-offs.

## Core Intuition

**Token bucket:** a fountain refilling a bucket. As long as tokens exist, requests proceed. Saved tokens enable bursts — get all your work done at once if you have the budget.

**Leaky bucket:** a tank with a small drain. Requests pour in; processed at the drain rate. Excess overflows. No bursts — output is steady.

## Token Bucket Algorithm

**State:** current token count, last refill timestamp.

**Configuration:** capacity C (max tokens), refill rate R (tokens/sec).

**On request:**
1. Refill: add `(now - last_refill) × R` tokens (capped at C).
2. If tokens >= 1: consume one, allow request.
3. Else: reject (or queue with backoff).
4. Update last_refill.

**Pros:** allows bursts (up to C tokens at once); average rate R.
**Cons:** burst behavior may overwhelm dependencies briefly.

## Leaky Bucket Algorithm

**State:** queue of pending requests.

**Configuration:** capacity C (queue size), leak rate R.

**On request:**
1. If queue < C: enqueue.
2. Else: reject.
3. Separately: dequeue and process at rate R.

**Pros:** smooth output; steady downstream load.
**Cons:** no bursts; latency proportional to queue depth.

## Choosing Between Them

| Property | Token Bucket | Leaky Bucket |
|---|---|---|
| Bursts | Yes | No |
| Output rate | Variable (up to capacity) | Constant |
| User-facing rate limit | Better | OK |
| Smoothing downstream load | Worse | Better |
| Implementation | Simpler | Slightly more complex |

For most public APIs: **Token Bucket** (allows reasonable bursts).
For traffic shaping to a steady downstream: **Leaky Bucket**.

## Distributed Implementation

For multi-instance services, state must be shared:
- Redis with atomic INCR + EXPIRE.
- Atomic Lua script for token bucket math.
- Approximate algorithms tolerate brief inconsistency.

## Real Production Examples

- **AWS API Gateway** — token bucket.
- **Stripe** — token bucket with per-customer config.
- **Network traffic shaping** — leaky bucket.
- **Kafka producer client** — token-bucket-like.

## Interview Perspective

**Common questions:**
- "Token vs leaky?" → Token allows bursts; leaky smooths.
- "Algorithm walkthrough?" → State + refill + consume.
- "Distributed?" → Redis atomic operations.

**Senior-level:**
- The algorithm matters less than the limit values and the placement.
- For multi-region, "rate limit per region" vs "global limit" has trade-offs.
- Approximation is usually OK — strict consistency is expensive.

**Common mistakes:**
- Race conditions in distributed implementation.
- No EXPIRE on Redis keys → memory grows.
- Choosing wrong algorithm for use case.

## Related Concepts

- [[Rate Limiting]] · [[Backpressure]]

## Misconceptions

- **"Token bucket = leaky bucket."** Different burst behaviors.
- **"Stricter = better."** Depends on use case.

## Failure Scenarios

- **Race condition** under high concurrency without atomic ops.
- **Global limit failure** during Redis outage.

## Practical Engineering Heuristics

- **Token bucket** for APIs.
- **Leaky bucket** for smoothing downstream.
- **Redis Lua script** for distributed atomicity.
- **EXPIRE keys** to prevent memory growth.

## Active Recall Questions

Token bucket vs leaky bucket?::Token bucket allows bursts (saved tokens). Leaky bucket smooths output (constant drain rate).

Token bucket algorithm?::Bucket holds up to C tokens, refills at rate R. Request consumes token if available; otherwise rejects.

Leaky bucket algorithm?::Requests queue (up to C); dequeued at constant rate R. Excess rejected.

When choose token bucket?::APIs where bursts are acceptable. Most public APIs.

When choose leaky bucket?::Traffic shaping where downstream needs constant rate (streaming, batched processing).

How implement distributed token bucket?::Redis with atomic Lua script computing refill + consume in one operation.

## Feynman Test

Design rate limiting for a public API where users can burst briefly. Walk through token bucket.

Why does leaky bucket smooth output while token bucket doesn't?

## Mastery Checklist

- **Explain** both algorithms.
- **Compare** their burst behavior.
- **Derive** when each fits.
- **Critique** rate limit designs choosing wrong algorithm.
- **Design** distributed token bucket using Redis.


## Recent Q&A

**Q: Explain where we can use leaky bucket and where we can use token bucket, and if there are any other algorithms mention their use cases and definitions as well**

Token Bucket and Leaky Bucket are fundamental algorithms used for managing data flow, differing in how they handle bursts of traffic. Token Bucket allows bursts within a defined limit by refilling at a fixed rate, ideal for applications like API rate limiting where occasional overages are acceptable; it's also used for network traffic shaping to ensure consistent throughput. Leaky Bucket, on the other hand, provides steady output without allowing bursts, suitable for scenarios requiring smooth data streaming or consistent load balancing, such as batch processing systems and HTTP servers managing bursty requests. Other algorithms like Capped Token Bucket (CTB) restrict excess tokens while Leaky Bucket with a zero-capacity limit prevents full buffers in CTB offer additional control mechanisms tailored to specific use cases.

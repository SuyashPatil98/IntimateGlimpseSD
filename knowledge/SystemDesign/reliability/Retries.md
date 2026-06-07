---
title: Retries
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Circuit Breakers]]", "[[Idempotency]]", "[[Rate Limiting]]"]
sources:
  - SRE book
  - AWS Architecture blog
tags: [reliability, resilience, retry]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Retries with Exponential Backoff + Jitter

## Executive Summary

**Retries** are the resilience pattern of **automatically re-attempting failed operations**. Done naively (immediate retry), they amplify failures: a downed dependency gets pummeled with retries. Done well (**exponential backoff + jitter**), retries gracefully handle transient failures without contributing to cascading collapse. **Idempotency** is a precondition — retried calls must produce the same effect. Combined with [[Circuit Breakers]] for full resilience.

## Why This Exists

Most failures are transient: a packet lost, a momentary overload, a brief partition. Retry usually succeeds. But retry must be measured: retry too eagerly and you DOS your dependency; retry too lazily and users see failures.

## Core Intuition

Calling a busy friend who didn't answer. Calling again immediately is rude. Waiting an hour is too long. Retry in 1 minute; then 2; then 4. Add some randomness so you don't all try the same minute (jitter).

## Internal Mechanics

**Exponential backoff:** wait $2^n$ × base after attempt n.

```
Attempt 1: fail
Wait 1 sec
Attempt 2: fail
Wait 2 sec
Attempt 3: fail
Wait 4 sec
...
```

**Jitter:** add randomness to the wait. Prevents thundering herd of retries.

**Full jitter:** wait = random(0, base × 2^n).

**Cap:** maximum wait (e.g., 30 sec).

**Max attempts:** typically 3-5. Past that, give up.

## Why Jitter Matters

Without jitter, retry storms synchronize: 100 clients all retry at exactly 1 sec, then 2 sec — your dependency sees 100 simultaneous bursts. With jitter, retries spread out across the window. Smooths the load.

## Idempotency Precondition

If a retried operation isn't idempotent, retry can double-effect: charge twice, send two emails. See [[Idempotency]] — operations must be retry-safe.

## Real Production Examples

- **AWS SDKs** — retry with backoff + jitter built in.
- **Kafka producers** — idempotent retries.
- **HTTP clients** — most have retry policies.
- **gRPC** — built-in retry config.

## Design Tradeoffs

**Benefits:**
- Handles transient failures.
- Improves user experience.
- Composable with other patterns.

**Costs:**
- Amplifies failures if misconfigured.
- Requires idempotency.
- Latency increase.

## Interview Perspective

**Common questions:**
- "Why exponential backoff?" → Avoid hammering a struggling dependency; give it time to recover.
- "Why jitter?" → Prevent retry storms; spread load.
- "Max retries?" → 3-5 typical. Past that, just fail.

**Senior-level:**
- Retries on non-idempotent operations cause real production incidents.
- "Retry budget" — bound total retry attempts to limit amplification.
- Combine with circuit breakers: breaker open → no retries.

**Common mistakes:**
- Immediate retries → DOS the dependency.
- No jitter → synchronized storms.
- Retry on non-idempotent operations.
- Infinite retries.

## Related Concepts

- [[Circuit Breakers]] · [[Idempotency]] · [[Rate Limiting]] · [[Backpressure]]

## Misconceptions

- **"Retries fix everything."** Only transient failures.
- **"More retries = more reliable."** Past a point, amplifies failure.
- **"No need for jitter."** Synchronized storms are real.

## Failure Scenarios

- **Retry storm** without backoff/jitter.
- **Doubled charges** without idempotency.
- **Cascade** from many clients retrying.

## Practical Engineering Heuristics

- **Exponential backoff + jitter, always.**
- **Cap max attempts (3-5).**
- **Idempotency keys for safety.**
- **Circuit breaker as global stop.**
- **Use library** (AWS SDK retry policies).

## Active Recall Questions

What's exponential backoff?::Wait time doubles after each retry attempt. Prevents hammering dependency.

What's jitter?::Randomness in retry timing. Prevents synchronized retry storms across clients.

Why is idempotency required for retries?::Retried operations may execute multiple times. Without idempotency, double effects (charges, sends).

Typical max retries?::3-5. Past that, just fail.

What's a retry storm?::Many clients retrying simultaneously, overwhelming dependency. Prevented by jitter.

What's "full jitter"?::wait = random(0, base × 2^n). Maximum smoothing.

## Feynman Test

A flaky API needs retries. Design backoff + jitter policy. What library?

Why does immediate retry cause more cascading failures than slow retry?

## Mastery Checklist

- **Explain** retries with backoff and jitter.
- **Compare** strategies (immediate, exponential, with jitter).
- **Derive** appropriate retry policy.
- **Critique** retries on non-idempotent operations.
- **Design** resilient retry layer.

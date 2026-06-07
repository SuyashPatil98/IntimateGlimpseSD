---
title: Idempotency
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Retries]]", "[[Delivery Guarantees]]", "[[Outbox Pattern]]"]
sources:
  - Stripe engineering blog
  - DDIA Ch.11
tags: [reliability, idempotency, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Idempotency

## Executive Summary

An **idempotent operation produces the same result whether called once or many times**. The foundational property enabling **safe retries** in distributed systems. Without idempotency, retries cause **double charges**, **duplicate sends**, **inconsistent state**. Implementations: **idempotency keys** (Stripe pattern), **natural idempotence** (DELETE/PUT in REST), **dedup tables**. The practical answer to **exactly-once semantics** at the application level.

## Why This Exists

Networks lose acks. Clients retry. Without idempotency, the second call appears to be a new request — duplicate charges, duplicate orders, duplicate notifications. Idempotency means: same key, same operation; second attempt returns the original result without re-executing.

## Core Intuition

A light switch. Flipping the switch off when it's off doesn't break anything. Flipping it off five times leaves the light off. That's idempotent. Compare to "fire the cannon" — non-idempotent; each call fires another shot.

## Formal Definition

An operation $f$ is **idempotent** if $f(f(x)) = f(x)$.

Applied to APIs: same input → same effect, regardless of how many times called.

## Implementations

### Idempotency Keys (Stripe Pattern)

Client generates a unique key (UUID) per logical operation. Server:
1. Sees key.
2. If first time: execute operation; record key + result.
3. If seen: return cached result; don't re-execute.

```
POST /charges
Idempotency-Key: 7a4f...
Body: { amount: 99.99, customer: ... }
```

**Storage:** typically Redis with TTL (e.g., 24 hours), or a dedup table in the DB.

### Natural Idempotence

Some operations are naturally idempotent:
- HTTP **GET** (read-only).
- HTTP **PUT** (replace whole resource).
- HTTP **DELETE** (after first call, gone).
- **SET x = 5** (vs INCR x).

Use these by design when possible.

### Application-Level

- **Conditional writes** — UPDATE ... WHERE current_state = X.
- **Versioning** — only apply if version matches expected.
- **Hashing** — dedup by content hash.

## Real Production Examples

- **Stripe** — every endpoint accepts idempotency keys.
- **AWS** — many APIs idempotent or accept request IDs.
- **Payment processors** generally.
- **Kafka idempotent producer.**

## Design Tradeoffs

**Benefits:**
- Safe retries.
- Exactly-once-like semantics.
- Crash recovery.

**Costs:**
- Storage for idempotency state (TTL bounded).
- Client must generate keys.
- Application logic complexity.

## Interview Perspective

**Common questions:**
- "What's idempotency?" → Same operation, same result, regardless of repetition.
- "Why important?" → Safe retries in face of unreliable networks.
- "Implementation?" → Idempotency keys + storage with TTL.

**Senior-level:**
- Idempotency is the **practical answer** to exactly-once messaging.
- Stripe's idempotency-key pattern is the industry standard.
- Storage TTL bounds state but allows long-window deduplication.

**Common mistakes:**
- Retries without idempotency.
- Idempotency key per request (not per logical operation).
- No TTL → memory growth.

## Related Concepts

- [[Retries]] · [[Delivery Guarantees]] · [[Outbox Pattern]]

## Misconceptions

- **"Idempotency = retry-safe."** Specifically: same result regardless of count.
- **"GET is always idempotent."** Yes for reads; not always for side effects.
- **"Idempotency adds cost."** Saves cost from bugs.

## Failure Scenarios

- **Lost ack + non-idempotent op** → duplicate effect.
- **Idempotency key reuse for different op** → wrong result.
- **No TTL** → memory growth.

## Practical Engineering Heuristics

- **Make all mutating endpoints accept idempotency keys.**
- **TTL keys (24h typical).**
- **Client generates UUIDv4 per logical operation.**
- **Document semantics.**

## Active Recall Questions

What's an idempotent operation?::Produces same result whether called once or many times. Same operation, same effect.

Why required for safe retries?::Without it, retries cause duplicates (charges, sends).

What's an idempotency key?::Unique ID client generates per logical operation. Server dedupes by key.

Naturally idempotent HTTP methods?::GET (read), PUT (replace), DELETE (gone). POST is not naturally idempotent.

What's Stripe's pattern?::Client-generated `Idempotency-Key` header per logical operation. Server returns cached result on repeat.

How does this relate to exactly-once messaging?::Practical answer: at-least-once delivery + idempotent consumer ≈ exactly-once effect.

## Feynman Test

Walk through a payment retry without and with idempotency keys.

Why is "at-least-once + idempotency" the canonical answer to "exactly-once delivery"?

## Mastery Checklist

- **Explain** idempotency.
- **Compare** with non-idempotent operations.
- **Derive** appropriate idempotency for given operation.
- **Critique** retry logic without idempotency.
- **Design** idempotency layer using keys + Redis.

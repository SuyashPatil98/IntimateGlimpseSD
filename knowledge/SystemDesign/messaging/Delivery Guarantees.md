---
title: Delivery Guarantees
aliases: ["Exactly-Once Semantics"]
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Message Queues]]"]
related: ["[[Message Queues]]", "[[Idempotency]]", "[[Exactly-Once Semantics]]"]
sources:
  - DDIA, Ch. 11
  - SDI vol 1
tags: [messaging, semantics, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Delivery Guarantees

## Executive Summary

**Delivery guarantees** describe what a messaging system promises about message arrival in the presence of failures. Three canonical levels: **at-most-once** (deliver 0 or 1 times; possible loss), **at-least-once** (deliver 1 or more times; possible duplicates), **exactly-once** (deliver exactly 1 time; expensive and subtle). Most production systems offer **at-least-once + consumer idempotency** — the practical approximation of exactly-once. Understanding these semantics is essential to designing correct asynchronous systems.

## Why This Exists

Networks lose packets; consumers crash mid-processing; brokers fail. Without delivery semantics, applications can't reason about correctness. The three levels formalize the trade-off between simplicity, reliability, and overhead.

## Core Intuition

Imagine mailing a critical letter:
- At-most-once: send and don't track. May arrive once or be lost.
- At-least-once: keep resending until receiver acknowledges. May arrive multiple times.
- Exactly-once: somehow ensure exactly one arrival. Hard.

## The Three Levels

**At-most-once:**
- Fire and forget.
- Message may be lost.
- Never duplicated.
- Simplest.
- Use: non-critical telemetry, gauge metrics where loss is OK.

**At-least-once:**
- Retry until acked.
- Message may be duplicated.
- Never lost (if broker is durable).
- Standard.
- Use: anything that matters — combined with idempotent consumers.

**Exactly-once:**
- Delivery + processing exactly once.
- Requires distributed coordination.
- Expensive; subtle.
- Use: payments, financial state where duplicates are unacceptable.
- Most "exactly-once" systems are actually at-least-once + idempotency.

## Internal Mechanics

**Achieving at-most-once:** send without retries; broker doesn't track acks.

**Achieving at-least-once:**
- Broker retains message until consumer acks.
- Consumer crash before ack → broker redelivers.
- Need consumer-side dedup if duplicates matter.

**Achieving exactly-once (true):**
- Producer side: idempotent producer (Kafka has this).
- Consumer side: atomic commit of consumer offset + side effects.
- Requires consensus or transactions across systems.
- Kafka transactions enable this within Kafka.

**Pragmatic exactly-once:** at-least-once delivery + idempotent consumer using:
- Unique message IDs and dedup table.
- Idempotent operations (UPSERT, CAS).
- Outbox pattern with transactional dedup.

## Real Production Examples

- **Kafka:** at-least-once default; exactly-once mode (transactions + idempotent producer).
- **SQS:** at-least-once (Standard); FIFO queue offers exactly-once delivery (caveats).
- **RabbitMQ:** at-most-once or at-least-once depending on config.
- **Stripe, Square payments:** at-least-once + idempotency keys.

## Design Tradeoffs

| Level | Loss | Duplicates | Cost |
|---|---|---|---|
| At-most-once | Possible | No | Lowest |
| At-least-once | No | Possible | Medium |
| Exactly-once | No | No | Highest |

## Interview Perspective

**Common questions:**
- "Three delivery guarantees?" → At-most-once, at-least-once, exactly-once.
- "Why is exactly-once hard?" → Requires atomic commit across delivery + processing across systems. Distributed transactions.
- "How do you achieve practical exactly-once?" → At-least-once + idempotent consumer with dedup keys.

**Senior-level:**
- Kafka's "exactly-once semantics" (EOS) work *within Kafka* (read-process-write). End-to-end exactly-once across systems still requires coordination.
- Idempotency keys (Stripe pattern) are the standard for HTTP-level exactly-once.
- The outbox pattern bridges DB transaction + message broker for atomic effect + send.

**Common mistakes:**
- Treating at-least-once consumer as exactly-once.
- Not implementing idempotency in consumers.
- Believing broker "exactly-once" extends to consumer-side processing.

## Related Concepts

- [[Idempotency]] — the practical foundation.
- [[Outbox Pattern]] — DB tx + reliable send.
- [[Exactly-Once Semantics]] — Kafka's specific implementation.

## Misconceptions

- **"Exactly-once works out of the box."** Rarely; even Kafka's EOS has scope limits.
- **"At-most-once is dangerous."** Fine for non-critical metrics.
- **"Duplicates ≠ correctness issue."** Only if consumer is idempotent.

## Failure Scenarios

- **Duplicate processing without idempotency** → double charges, double sends.
- **At-most-once loss of critical message.**
- **Exactly-once misconfigured** — falls back to at-least-once silently.

## Practical Engineering Heuristics

- **Default: at-least-once + idempotent consumer.**
- **Use idempotency keys** for cross-system operations.
- **Use outbox pattern** for DB + message coordination.
- **Reserve true exactly-once** for narrow workflows where it's worth the cost.

## Active Recall Questions

Three delivery guarantees?::At-most-once (possible loss, no duplicates), at-least-once (possible duplicates, no loss), exactly-once (neither).

Why is exactly-once hard?::Requires atomic commit across delivery + processing + side effects. Distributed transactions or carefully coordinated state.

What's the practical pattern for exactly-once?::At-least-once delivery + idempotent consumer. Use idempotency keys or dedup tables.

What does Kafka EOS guarantee?::Exactly-once within Kafka (read-from-topic → process → write-to-topic). End-to-end across systems requires more.

When is at-most-once acceptable?::Non-critical telemetry; gauge metrics; data that can be lost without correctness impact.

Name a common idempotency mechanism for messaging.::Idempotency keys (per-message unique ID checked at consumer). Outbox pattern with dedup table.

## Feynman Test

Walk through a payment system using at-least-once + idempotency. Where does duplicate detection happen?

Why does "exactly-once messaging" in Kafka not give you exactly-once side effects in your database?

## Mastery Checklist

- **Explain** the three delivery levels.
- **Compare** their cost/complexity.
- **Derive** which level fits a workload.
- **Critique** "exactly-once" claims without examining scope.
- **Design** at-least-once + idempotent system for payments.

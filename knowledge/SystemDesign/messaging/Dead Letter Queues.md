---
title: Dead Letter Queues
area: messaging
status: mature
difficulty: beginner
prerequisites: ["[[Message Queues]]"]
related: ["[[Message Queues]]", "[[Task Queues]]", "[[Delivery Guarantees]]"]
sources:
  - SDI vol 1
  - AWS SQS docs
tags: [messaging, failure-handling, reliability]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Dead Letter Queues

## Executive Summary

A **Dead Letter Queue (DLQ)** is a separate queue where **messages that repeatedly fail processing are sent for inspection** rather than being retried forever or silently discarded. Standard pattern in production messaging: after N retries, the message moves to the DLQ. Lets operators diagnose failures (bug? bad data? downstream issue?) without blocking the main queue with poison messages. Supported natively by SQS, RabbitMQ, Kafka, most queue systems.

## Why This Exists

When a message fails processing, retry is sensible — transient issues (network, brief downstream outage) resolve. But some messages fail every time (poison messages: bad data, schema violation, bug). Retrying them forever wastes resources and blocks the queue. Silently discarding them loses important signal. DLQ is the middle: retry a bounded number; then set aside for investigation.

## Core Intuition

A factory's quality-control reject bin. Items that fail repeatedly go aside for engineers to examine. The main line keeps moving. Engineers diagnose, fix, decide whether to re-process or discard.

## Internal Mechanics

**Standard flow:**
1. Consumer pulls message.
2. Processing fails (exception, timeout).
3. Message returned to main queue (often with backoff).
4. After N retries, message moves to DLQ.
5. Operator inspects DLQ; debugs root cause; replay or discard.

**Configuration:**
- **Max retries** before DLQ (typical: 3-5).
- **DLQ retention period** — keep messages long enough to inspect.
- **DLQ alerts** — operators notified when items appear.

**Replay:**
- After fixing the bug, can move messages from DLQ back to main queue.

## Real Production Examples

- **AWS SQS** — `RedrivePolicy` specifies DLQ + max receive count.
- **RabbitMQ** — dead-letter exchanges; route failed messages.
- **Kafka** — typically app-level (consumer writes to DLQ topic).
- **Celery, Sidekiq** — failed-job storage and inspection.

## Design Tradeoffs

**Benefits:**
- Isolates poison messages.
- Keeps main queue healthy.
- Provides diagnosis material.
- Standard, well-understood.

**Costs:**
- DLQ growth signals problems.
- Operator burden — DLQ must be checked.
- Lost messages if DLQ retention expires.

## Interview Perspective

**Common questions:**
- "What's a DLQ?" → Separate queue for messages that repeatedly fail processing. Prevents poison messages from blocking the main queue.
- "When use one?" → Any production async system. It's a standard pattern.
- "How many retries before DLQ?" → 3-5 typical. More: wastes effort. Less: legitimate transient failures look like poison.

**Senior-level:**
- DLQ monitoring is critical — if no one watches it, problems hide.
- Replay logic is its own concern — may need to handle ordering, dedup.
- Pattern works against systems where failures are persistent (DB outage) — DLQ fills with retryable messages.

**Common mistakes:**
- No DLQ → poison messages stuck.
- DLQ with no monitoring → silent accumulation.
- Too low max-retries → transient failures become DLQ entries.

## Related Concepts

- [[Message Queues]] · [[Task Queues]]
- [[Delivery Guarantees]] — DLQ is what happens when at-least-once retries exhaust.

## Misconceptions

- **"DLQ = trash."** It's an inspection bin, not trash.
- **"DLQ fixes problems."** It surfaces them; humans (or recovery code) fix.
- **"Set max-retries high to avoid DLQ."** Defeats purpose; just wastes effort on poison messages.

## Failure Scenarios

- **DLQ growing** — signals systemic issue (downstream broken, schema mismatch).
- **DLQ retention expires** before inspection → message lost.
- **Replay storm** when fixing — burst of messages to processor.

## Practical Engineering Heuristics

- **Always configure a DLQ** on production queues.
- **Set max-retries to 3-5.**
- **Alert on non-zero DLQ depth.**
- **Long DLQ retention** (days to weeks).
- **Document recovery / replay procedures.**

## Active Recall Questions

What's a Dead Letter Queue (DLQ)?::Separate queue receiving messages that fail processing repeatedly. Allows inspection without blocking main queue.

When is a message sent to DLQ?::After N retries fail. Typical N: 3-5.

Why not just drop failed messages?::Loses diagnostic signal. May lose important data. DLQ provides forensic record.

Why not retry forever?::Poison messages would block the main queue and waste resources. DLQ separates persistent failures.

What's the operator's responsibility around DLQs?::Monitor depth; alert on non-zero; investigate failed messages; replay or discard after fix.

Name three queue systems supporting DLQs.::AWS SQS, RabbitMQ, Kafka (app-level), Celery, Sidekiq.

## Feynman Test

A bug causes 1% of messages to fail. Walk through what happens to those messages with and without a DLQ.

Why is "alert on DLQ depth > 0" a fundamental SLI of any messaging system?

## Mastery Checklist

- **Explain** DLQ pattern and lifecycle.
- **Compare** DLQ to retry-forever and silent-drop.
- **Derive** appropriate max-retries and retention for a workload.
- **Critique** systems without DLQs or without monitoring them.
- **Design** an async pipeline with DLQ, alerts, and replay procedure.

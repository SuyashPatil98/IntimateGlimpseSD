---
title: Message Queues
aliases: ["Messaging Fundamentals"]
area: messaging
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Pub-Sub]]", "[[Task Queues]]", "[[Delivery Guarantees]]", "[[Backpressure]]", "[[Dead Letter Queues]]", "[[Design Distributed Message Queue]]"]
builds_toward: ["[[Pub-Sub]]", "[[Event Streams]]"]
sources:
  - DDIA, Ch. 11
  - SDI vol 1
  - system-design-primer
tags: [messaging, queues, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Message Queues

## Executive Summary

A **message queue** is an asynchronous communication primitive: producers append messages; consumers process them. Decouples producer rate from consumer rate via buffering. Provides **load leveling, retry support, durability, fan-out** (in pub/sub variants), and **producer-consumer rate independence**. Canonical implementations: **RabbitMQ, SQS, ActiveMQ, Kafka (as a queue)**. Used wherever producers and consumers operate at different rates, where work must survive crashes, or where async processing improves user-facing latency.

## Why This Exists

Synchronous calls force producer and consumer to be available simultaneously and operate at the same rate. If the consumer is slow or down, producers must wait, retry, or drop work. Message queues decouple this: producers always succeed (push to queue); consumers work at their own pace. Spikes get absorbed; downtime is tolerable; retries are built in.

## Core Intuition

A restaurant kitchen pass-through. Servers (producers) drop tickets in any order. Cooks (consumers) work through them at their own pace. The pile (queue) absorbs lunch rushes. If a cook is slow, tickets accumulate but servers don't wait. If a ticket fails, it can be retried or set aside (dead letter).

## Internal Mechanics

**Basic operations:**
- `enqueue(msg)` — producer appends.
- `dequeue()` — consumer takes next message.
- `ack(msg)` — consumer signals successful processing.
- `nack(msg)` — consumer signals failure; message redelivered.

**Delivery semantics:**
- At-most-once: send and forget; possible loss.
- At-least-once: redeliver until ack; possible duplicates (most common).
- Exactly-once: complex; see [[Delivery Guarantees]].

**Visibility timeout:** consumer pulls a message; queue hides it for N seconds while consumer processes. Ack within timeout → delete. Else → redelivered.

**Durability:** messages persisted to disk (RabbitMQ in durable mode, SQS, Kafka).

## Architecture Diagrams

```
Producers              Queue               Consumers
   │                                          │
   │── msg 1 ──→ [m1, m2, m3, m4] ──→ msg 1 ──│
   │── msg 2 ──→                      msg 2  │
   │── msg 3 ──→                      msg 3  │
                                       msg 4  │
                                              
   Decoupled rates; buffered.
```

## Design Tradeoffs

**Benefits:**
- Decouples producer/consumer rates.
- Absorbs spikes.
- Durable work (survives crashes).
- Retry-friendly.

**Costs:**
- Latency added (queueing).
- Operational complexity (running the broker).
- Potential duplicates (at-least-once).
- Out-of-order delivery in many systems.

## Real Production Examples

- **AWS SQS** — managed simple queue; at-least-once; visibility timeout.
- **RabbitMQ** — feature-rich; complex routing; AMQP protocol.
- **ActiveMQ** — Java-centric; JMS standard.
- **Redis lists / Streams** — lightweight queue; in-memory.
- **Google Cloud Pub/Sub** — managed; pub/sub semantics.
- **Kafka** — distributed log; supports queue patterns via consumer groups.

## Interview Perspective

**Common questions:**
- "Why message queues?" → Decouple producer/consumer rates; buffer spikes; durable retry.
- "At-least-once vs exactly-once?" → At-least-once: simpler, may duplicate. Exactly-once: requires coordination; expensive.
- "RabbitMQ vs Kafka?" → RabbitMQ: traditional queue, ack-based, message lifecycle. Kafka: log-based, replayable, higher throughput.

**Senior-level:**
- Queue choice shapes architecture: RabbitMQ for traditional workflow; Kafka for stream processing + retention.
- Consumer must be idempotent under at-least-once — duplicates are normal.
- Visibility timeout tuning matters — too short causes spurious retries; too long causes stuck messages.

**Common mistakes:**
- Assuming exactly-once is easy.
- Not handling duplicate messages in consumer logic.
- Forgetting to monitor queue depth — silent backups.

## Related Concepts

- [[Pub-Sub]] — fan-out variant.
- [[Task Queues]] — specialization for background work.
- [[Delivery Guarantees]] — semantic depth.
- [[Backpressure]] — flow control.
- [[Dead Letter Queues]] — failure handling.

## Misconceptions

- **"Queues guarantee order."** Many don't (SQS standard); use FIFO variants explicitly.
- **"Exactly-once works out of the box."** Hard; usually approximated via idempotency.
- **"Queues are always fast."** Adding broker adds latency; often acceptable but real.

## Failure Scenarios

- **Queue depth grows unbounded** — slow consumer; needs backpressure or autoscale.
- **Poison message** — keeps failing; needs DLQ.
- **Lost messages** under at-most-once.
- **Duplicate processing** under at-least-once without idempotency.

## Practical Engineering Heuristics

- **Use SQS or managed queue** unless you have specific reasons.
- **Always implement idempotency** in consumers.
- **Monitor queue depth as SLI.**
- **Configure DLQ** for failed messages.
- **Match visibility timeout to processing time.**

## Active Recall Questions

What's a message queue?::Async communication primitive. Producers append; consumers process. Decouples rates and provides durability/retry.

What's visibility timeout?::Consumer pulls a message; queue hides it for N seconds. Ack within timeout → delete. Else → redelivered.

At-most-once vs at-least-once?::At-most-once: possible message loss; no redelivery. At-least-once: redelivered until ack; possible duplicates.

Why must consumers be idempotent under at-least-once?::Same message may be delivered multiple times. Processing must produce same effect on retry.

Name three production message queues.::AWS SQS, RabbitMQ, ActiveMQ, Redis Streams, Google Pub/Sub, Kafka.

What's a Dead Letter Queue?::Separate queue for messages that repeatedly fail processing. Lets you inspect/diagnose without blocking the main queue.

## Feynman Test

Walk through a message lifecycle in SQS from enqueue to processing to ack.

Why is "consumer idempotency" the practical answer to exactly-once delivery?

## Mastery Checklist

- **Explain** message queue model and operations.
- **Compare** queue systems (SQS, RabbitMQ, Kafka-as-queue).
- **Derive** appropriate delivery semantics for a workload.
- **Critique** systems without idempotent consumers.
- **Design** a workflow with queue + DLQ + monitoring.

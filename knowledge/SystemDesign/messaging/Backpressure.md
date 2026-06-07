---
title: Backpressure
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Message Queues]]"]
related: ["[[Message Queues]]", "[[Rate Limiting]]", "[[Circuit Breakers]]", "[[Latency vs Throughput]]"]
sources:
  - DDIA, Ch. 11
  - SDI vol 1
  - Reactive Streams spec
tags: [messaging, flow-control, reliability]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Backpressure

## Executive Summary

**Backpressure** is the mechanism by which a slow consumer **signals upstream to slow down production**, preventing unbounded queue growth and eventual collapse. Without it, fast producers + slow consumers = exhausted memory, cascading failures. Implementations: **bounded queues with blocking enqueue, reactive streams with explicit request signals, TCP windowing, HTTP/2 stream control, Kafka consumer lag-driven autoscale**. A fundamental discipline of any production async system.

## Why This Exists

Default queueing behavior is "accept all writes, buffer indefinitely." Under sustained mismatch (producer > consumer), buffers grow until: memory exhausted, disk full, OOM kill. Backpressure breaks this by propagating the slowdown upstream — producers wait or drop work, system stays stable.

## Core Intuition

A water pipeline. The downstream tank fills slower than the upstream supplies. Without a valve, water overflows. Backpressure is the valve: when tank is full, signal the upstream to throttle. The system finds equilibrium at the slower rate.

## Strategies

**1. Bounded queues + blocking:**
- Queue has max size.
- Enqueue blocks when full.
- Producer naturally slows.

**2. Bounded queues + dropping:**
- Queue has max size.
- Enqueue returns failure when full.
- Producer handles (retry, drop, fail).

**3. Explicit demand (reactive streams):**
- Consumer signals "I can handle N more."
- Producer respects demand.
- Used in Reactive Streams, RxJava, Akka.

**4. Rate-based:**
- Producer self-limits to a known rate.
- Token bucket, leaky bucket.
- See [[Rate Limiting]].

**5. Pull-based:**
- Consumer pulls when ready, rather than producer pushing.
- Kafka consumer pulls.

## Real Production Examples

- **Kafka** — pull-based; consumer lag is the backpressure signal.
- **TCP windowing** — receiver advertises window size; sender respects.
- **HTTP/2 flow control** — per-stream credit.
- **Reactive Streams (Java 9 Flow)** — explicit demand signal.
- **Akka Streams** — backpressure throughout pipeline.
- **AWS SQS** — visibility timeout + autoscale consumers based on queue depth.

## Design Tradeoffs

**Benefits:**
- System stays stable under load mismatch.
- Predictable resource usage.
- Avoids cascading failure.

**Costs:**
- Producer must handle slowdown (block or fail).
- More complex than fire-and-forget.
- Possible upstream cascading slowdown.

## Interview Perspective

**Common questions:**
- "What's backpressure?" → Slow consumer signals upstream to slow down. Prevents unbounded queue growth.
- "Without backpressure?" → Queues fill; memory exhausted; cascading failure.
- "How does Kafka handle backpressure?" → Pull-based; consumer lag is the signal; autoscale or rate-limit producers.

**Senior-level:**
- Push-based systems (RabbitMQ, traditional MQs) need explicit backpressure; pull-based (Kafka) get it naturally.
- Backpressure propagation is system-level — must work across all components or fails at weakest link.
- "Drop" backpressure is sometimes correct — better than letting the system die.

**Common mistakes:**
- Unbounded queues (memory bombs).
- No upstream propagation — backpressure stops at one stage.
- Confusing rate limiting with backpressure.

## Related Concepts

- [[Message Queues]] · [[Rate Limiting]]
- [[Circuit Breakers]] — failure mode; complementary.
- [[Latency vs Throughput]] — backpressure manages queue depth.

## Misconceptions

- **"Backpressure = slowdown."** It's the signal mechanism; what producer does (block, drop, fail) varies.
- **"Pull-based eliminates backpressure concerns."** Reduces but doesn't eliminate — upstream can still overload broker.
- **"Just increase the buffer."** Postpones the problem; doesn't solve it.

## Failure Scenarios

- **OOM** under unbounded queue growth.
- **Cascading slowdown** propagating to upstream services.
- **Producer thread starvation** under blocking enqueue.
- **Silent drops** where users expect retention.

## Practical Engineering Heuristics

- **Always bound queues.**
- **Choose backpressure strategy explicitly** (block, drop, fail).
- **Monitor queue depth as SLI.**
- **Use pull-based (Kafka) when possible.**
- **Test under sustained load mismatch.**

## Active Recall Questions

What's backpressure?::Mechanism by which slow consumers signal upstream producers to slow down. Prevents unbounded queue growth.

Without backpressure?::Queues grow indefinitely; memory exhausted; cascading failure.

How does Kafka achieve backpressure naturally?::Pull-based consumption. Consumers fetch when ready; broker doesn't push. Consumer lag signals to operators (often via autoscale).

Three backpressure strategies?::Bounded queue + block, bounded queue + drop, explicit demand signal (Reactive Streams), rate-based throttling.

Why is pull-based better for backpressure than push-based?::Consumer naturally controls pace. Push systems need explicit flow control to avoid overwhelming consumer.

What's Reactive Streams?::Specification for backpressured async streams. Subscriber signals demand (`request(n)`); publisher respects. Java 9 Flow API.

## Feynman Test

A Kafka consumer is slower than producers. Walk through what happens. Where does the backpressure signal arise?

Why is "just increase the buffer" only a postponed solution?

## Mastery Checklist

- **Explain** backpressure and why it's necessary.
- **Compare** push vs pull architectures for backpressure.
- **Derive** appropriate backpressure strategy for a workload.
- **Critique** systems with unbounded queues.
- **Design** a streaming pipeline with explicit backpressure.

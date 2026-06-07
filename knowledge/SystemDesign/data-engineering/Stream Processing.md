---
title: Stream Processing
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Event Streams]]"]
related: ["[[Batch Processing]]", "[[Kappa Architecture]]", "[[Stream Windowing]]", "[[Apache Flink]]", "[[Event Streams]]"]
builds_toward: ["[[Kappa Architecture]]", "[[Stream Windowing]]"]
sources:
  - DDIA Ch.11
  - Data Engineering Cookbook
tags: [data-engineering, streaming, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Stream Processing

## Executive Summary

**Stream processing** processes **unbounded data continuously** — events arrive; transformations apply in (near) real time; output flows immediately. Contrasts with [[Batch Processing]] (bounded, scheduled). Used for **real-time analytics, monitoring, fraud detection, IoT, recommendations, alerts**. Frameworks: **Apache Flink, Kafka Streams, Apache Beam, Spark Structured Streaming**. Core challenges: **windowing** (how to bound unbounded streams for aggregation), **event time vs processing time**, **exactly-once semantics**, **late-arriving data**.

## Why This Exists

Many workloads need real-time response: detect fraud as it happens; recommend products immediately; alert on anomalies. Batch (minutes-to-hours latency) is too slow. Stream processing: events flow continuously through computation; outputs available within milliseconds to seconds.

## Core Intuition

A river flowing past a series of filters and aggregators. Each piece of water (event) is processed as it passes. No need to "wait for the river to end" — work happens continuously.

## Internal Mechanics

**Event:** discrete record with timestamp.

**Stream:** unbounded sequence of events.

**Operations:**
- **Stateless:** filter, map, transform per-event.
- **Stateful:** aggregate, join, count over [[Stream Windowing|windows]].

**Sources:** Kafka, Kinesis, Pulsar.

**Sinks:** databases, dashboards, downstream streams.

**State:** processors maintain in-memory + checkpointed state.

## Key Challenges

**Event time vs processing time:**
- Event time: when it happened.
- Processing time: when consumer sees it.
- Late arrivals: event time well before processing time.

**Windowing:** to compute aggregates on unbounded streams, bound them — tumbling, sliding, session windows. See [[Stream Windowing]].

**Watermarks:** estimates of "all events for this time have arrived."

**Exactly-once semantics:** with state + retries, must avoid double-processing on failure.

**State management:** large state (windows) needs efficient checkpointing.

## Real Production Examples

- **Apache Flink** — sophisticated stream processor.
- **Kafka Streams** — embedded in apps; for Kafka users.
- **Apache Beam** — unified batch/stream API; runs on multiple engines.
- **Spark Structured Streaming** — Spark's streaming API.

## Design Tradeoffs

**Benefits:**
- Real-time results.
- Continuous processing.
- Aligns with event-driven architecture.

**Costs:**
- Complex semantics (event time, watermarks, late data).
- State management.
- Operational maturity needed.

## Interview Perspective

**Common questions:**
- "Stream vs batch?" → Stream: unbounded, continuous, real-time. Batch: bounded, scheduled, throughput.
- "Event vs processing time?" → Event: when happened. Processing: when consumed. Bridge: watermarks.
- "Frameworks?" → Flink (most powerful), Kafka Streams (lightweight), Beam (portable), Spark Structured Streaming.

**Senior-level:**
- Modern stream processors handle backfills via Kafka replay → enables [[Kappa Architecture]].
- Exactly-once requires careful state + commit coordination.
- "Streaming is harder than batch" — semantic subtleties multiply.

**Common mistakes:**
- Stream when batch suffices.
- Ignoring event-time vs processing-time.
- Underestimating state complexity.

## Related Concepts

- [[Batch Processing]] · [[Kappa Architecture]] · [[Apache Flink]] · [[Stream Windowing]] · [[Event Streams]] · [[Kafka Architecture]] · [[CDC]]

## Misconceptions

- **"Streaming = simple."** Semantics genuinely harder than batch.
- **"All real-time needs streaming."** Sometimes mini-batches (1-5 min) suffice.

## Failure Scenarios

- **Late events** missed by window.
- **State growth** unbounded.
- **Backpressure** on slow downstream.

## Practical Engineering Heuristics

- **Default to batch for non-realtime work.**
- **Stream for genuine real-time needs.**
- **Flink for sophisticated state.**
- **Kafka Streams for lightweight.**
- **Tune watermarks carefully.**

## Active Recall Questions

What's stream processing?::Continuous processing of unbounded data. Events flow in; transformations apply in real-time.

Event time vs processing time?::Event time: when event happened. Processing time: when consumer sees it. Late arrivals: event time ≪ processing time.

What's a watermark?::Estimate of "all events for this time have arrived." Triggers window emission.

Four common frameworks?::Apache Flink, Kafka Streams, Apache Beam, Spark Structured Streaming.

Why is exactly-once hard?::State + retries + delivery semantics must coordinate. Failures shouldn't cause double-processing.

When NOT use streaming?::When batch (minutes-to-hours latency) suffices. Simpler.

## Feynman Test

A fraud detection system needs real-time. Walk through streaming pipeline.

Why are event-time semantics fundamentally harder than batch?

## Mastery Checklist

- **Explain** stream processing.
- **Compare** with batch.
- **Derive** event-time challenges.
- **Critique** stream for non-realtime.
- **Design** streaming fraud pipeline.

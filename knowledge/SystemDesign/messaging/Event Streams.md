---
title: Event Streams
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Pub-Sub]]", "[[Message Queues]]"]
related: ["[[Kafka Architecture]]", "[[Event-Driven Architecture]]", "[[Event Sourcing]]", "[[CDC]]"]
sources:
  - DDIA, Ch. 11
tags: [messaging, streaming, events]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Event Streams

## Executive Summary

An **event stream** is an **ordered, durable, replayable sequence of events** retained for a configurable period — a hybrid of [[Message Queues]] and a log. Unlike queues (consume-and-delete), streams retain events; unlike databases, they're append-only and partition-ordered. Foundation of modern data integration, real-time analytics, event sourcing, and reactive architectures. Canonical implementation: **Apache Kafka**. Other examples: AWS Kinesis, Pulsar, Redpanda, Google Pub/Sub (with retention).

## Why This Exists

Traditional queues delete messages once consumed. Event streams retain them — enabling replay (debugging, reprocessing), multiple independent consumers (each at its own offset), and time-travel (rebuild state from history). The "log" abstraction (append-only, ordered, retained) turns out to be foundational: data integration, event sourcing, real-time analytics, audit logs — all map to streams.

## Core Intuition

A river of events that flows past observers. Each observer reads from their own position (offset). Multiple observers don't interfere. Events stay in the river for a while, then flow out (retention expires). New observers can start from beginning, end, or any point.

## Internal Mechanics

**Properties:**
- **Append-only** — events written never modified.
- **Ordered** — within a partition, events have monotonic offsets.
- **Durable** — persisted to disk; replicated.
- **Replayable** — consumers can rewind.
- **Multi-consumer** — independent consumer groups.
- **Retention** — events expire after time/size limit.

**Partitioning:** stream split into partitions for scale. Each partition is ordered; cross-partition order is not guaranteed.

**Offsets:** each consumer tracks its position per partition.

**Time semantics:**
- Event time (when produced).
- Processing time (when consumed).
- Watermarks (estimated event-time progress for stream processing).

## Architecture Diagrams

```
Partition 0:  [e1][e2][e3][e4][e5][e6][e7]...
                              ↑           ↑
                              consumer A   consumer B
                              (offset 4)   (offset 7)

Consumers read independently from their own offsets.
Events persist regardless of consumption.
```

## Design Tradeoffs

**Benefits:**
- Replay — rebuild state, reprocess after bugs.
- Multi-consumer.
- Foundation for event sourcing, CDC.
- High throughput (append-only).

**Costs:**
- Storage cost for retention.
- Ordering only within partition.
- Stream processing complexity.

## Real Production Examples

- **Apache Kafka** — the canonical stream.
- **AWS Kinesis** — managed stream.
- **Apache Pulsar** — segmented streams.
- **Redpanda** — Kafka-compatible, C++.
- **Google Pub/Sub** — with retention enabled.

## Interview Perspective

**Common questions:**
- "Stream vs queue?" → Queue: consume-and-delete, one consumer. Stream: retain, replay, multi-consumer.
- "Why use streams?" → Replay, multi-consumer, event sourcing, real-time integration.
- "What's an offset?" → Position of a consumer in a partition. Stored per consumer; enables replay/resume.

**Senior-level:**
- Streams reframe data integration: instead of point-to-point ETL, all data flows through streams; consumers project as needed (the "log-centric" architecture).
- Event time vs processing time is the source of many stream-processing bugs.
- Retention is a cost lever — longer retention = more replay capability, more storage.

**Common mistakes:**
- Assuming global ordering across partitions.
- Forgetting consumer offset management (especially on rebalance).
- Retention misconfigured — lost replay window.

## Related Concepts

- [[Kafka Architecture]] · [[Topics and Partitions]] · [[Consumer Groups]]
- [[Event Sourcing]] · [[CDC]] · [[Event-Driven Architecture]]

## Misconceptions

- **"Streams are real-time."** Latency varies; "near real-time."
- **"Streams are infinite."** Retention bounds them.
- **"Streams replace databases."** Complement, not replace.

## Failure Scenarios

- **Retention expires before replay needed.**
- **Consumer lag** under slow processing.
- **Partition imbalance** — hot partition.
- **Offset reset** loses processed state.

## Practical Engineering Heuristics

- **Use Kafka or Kinesis** for production streams.
- **Plan retention** for your replay needs.
- **Monitor consumer lag.**
- **Partition by domain key** for ordering within entity.

## Active Recall Questions

What's an event stream?::Ordered, durable, replayable sequence of events retained for a configurable period. Append-only log.

Stream vs queue?::Queue: consume-and-delete, often one consumer. Stream: retain, replay, multi-consumer with offsets.

What's an offset?::Consumer's position in a partition. Tracked per consumer; enables replay and resume.

Why partition a stream?::Horizontal scaling. Each partition ordered; cross-partition order is not.

Event time vs processing time?::Event time: when the event occurred. Processing time: when consumer sees it. Stream processing must handle late arrivals.

Name three event stream systems.::Kafka, Kinesis, Pulsar, Redpanda, Cloud Pub/Sub.

## Feynman Test

Walk through replay scenario: bug introduced last week, fixed today. How does event stream help?

Why does partitioning sacrifice global ordering for scale?

## Mastery Checklist

- **Explain** event stream model and offsets.
- **Compare** streams and queues.
- **Derive** retention requirements for given replay scenarios.
- **Critique** systems treating streams as queues.
- **Design** an integration architecture using event streams.

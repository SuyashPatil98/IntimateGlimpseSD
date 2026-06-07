---
title: Apache Kafka
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Kafka Architecture]]", "[[Topics and Partitions]]"]
related: ["[[Apache Flink]]", "[[Apache Spark]]"]
builds_toward: []
sources:
  - Kreps, Narkhede, Rao "Kafka: A distributed messaging system for log processing" (NetDB 2011)
  - Apache Kafka docs
  - Jay Kreps "The Log" blog
  - Confluent engineering
tags: [case-study, messaging, kafka]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Apache Kafka

## Executive Summary

**Apache Kafka** is the dominant distributed log/streaming platform. Created at LinkedIn (2010) by Jay Kreps et al., open-sourced 2011, Confluent founded 2014. It defined the "log as the central abstraction" pattern — append-only partitioned logs as the durable event spine of an organization. Used by 80%+ of Fortune 100.

## Why It Mattered

Pre-Kafka, "messaging" meant RabbitMQ-style queues (delete on consume, complex routing). Kreps's insight: **the log is the abstraction** — keep messages durable, let consumers track offsets, allow replay. This unlocked event sourcing, CDC pipelines, stream processing, and data integration patterns.

## Architecture (essentials)

See [[Kafka Architecture]] for depth. Summary:
- **Brokers** form a cluster; topics split into **partitions**; each partition is an append-only log.
- **Producer** appends; **consumer groups** read with per-partition offset.
- Replication: leader + ISR followers; `acks=all` waits for full ISR.
- Metadata coordination: Zookeeper (legacy), KRaft (modern).

## Why Adoption Exploded

- **Throughput**: sequential disk + page cache + zero-copy = network-line-rate throughput.
- **Durability**: append-only + replicated.
- **Replay**: consumers reset offset; reprocess freely.
- **Decoupling**: producers don't know consumers.
- **Ordering** within partition is preserved.

## Evolution

- 2010 — internal at LinkedIn.
- 2011 — Apache incubation.
- 2014 — Confluent founded.
- 2017 — Streams API (Kafka Streams library).
- 2019 — Confluent IPO (~$5B).
- 2021 — KRaft (Zookeeper removal).
- 2024+ — tiered storage (offload old segments to S3).

## Key Production Stories

- **LinkedIn** — origin, runs trillions of msg/day across pipelines.
- **Netflix** — Keystone pipeline.
- **Uber** — uReplicator for cross-DC; trillions of events.
- **Pinterest** — singer agent ingestion.
- **NYT** — log of all published articles since 1851.

## Where Kafka Hurts

- **Operational complexity** (until KRaft + managed cloud).
- **Smaller-scale workloads** suffer overhead; Redis Streams / NATS simpler.
- **Exactly-once is doable but intricate** (idempotent producer + transactions + idempotent consumer).
- **Cross-DC replication** has its own gotchas (uReplicator, MirrorMaker2).

## Lessons

- **"The Log" abstraction** is profound — Kreps's blog post is canonical reading.
- A simple primitive (append-only partitioned log) replaces a zoo of integration patterns.
- Hardware reality (sequential I/O, page cache, zero-copy) drives performance more than algorithms.
- Decoupling producers from consumers via persistent logs is the integration-architecture win.

## Related Concepts

- [[Kafka Architecture]] — implementation depth.
- [[Apache Flink]] — Kafka-native stream processor.
- [[Topics and Partitions]] / [[Consumer Groups]] / [[Delivery Guarantees]] — concepts.
- [[Event Sourcing]] — Kafka-friendly pattern.
- [[CDC]] — Kafka Connect.

## Active Recall Questions

What was Kafka's central conceptual innovation?::Treating the append-only log as the central abstraction (vs queue with delete-on-consume); messages durable, consumers track offsets, replay is first-class.

Why does Kafka achieve such high throughput on commodity hardware?::Sequential disk writes (no random I/O), OS page cache for reads, zero-copy via sendfile, no per-message ack overhead due to batching.

What was KRaft and why was it introduced?::Kafka's Raft-based metadata layer replacing Zookeeper; removes external dependency, lowers operational footprint, faster metadata operations.

What is tiered storage in Kafka?::Recent segments stay on broker disks; older segments offloaded to cheaper object storage (S3); reduces broker storage cost dramatically for long-retention topics.

Why is Kafka considered an "integration architecture" tool?::Producers and consumers can be decoupled across teams; one durable log feeds many independent consumers (real-time + batch + ML), eliminating bespoke integrations.

What's the trade-off when using Kafka for small workloads?::Operational overhead and minimum cluster cost; lighter alternatives (Redis Streams, NATS) often better below ~10k msg/s.

What are the components of end-to-end exactly-once in Kafka?::Idempotent producer (sequence numbers), transactional commits across partitions + offsets, idempotent consumer downstream.

## Feynman Test

Explain to a backend engineer used to RabbitMQ why Kafka is "fundamentally different" — what's the consequence of keeping messages after they're consumed?

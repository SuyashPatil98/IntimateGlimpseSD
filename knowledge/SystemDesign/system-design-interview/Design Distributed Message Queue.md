---
title: Design Distributed Message Queue
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Message Queues]]", "[[Kafka Architecture]]"]
related: ["[[Design Key-Value Store]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.4 ("Distributed Message Queue")
  - DDIA Ch.11
  - Kafka design docs
tags: [system-design-interview, advanced-design, messaging]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Distributed Message Queue

## Executive Summary

A Kafka-like distributed log: high-throughput, durable, partitioned, replicated message broker supporting publish-subscribe and queue semantics. The interview answer is essentially [[Kafka Architecture]]: brokers + topics + partitions + replication + offset tracking.

## Requirements

**Functional:** Publish messages to topic; subscribe; replay from offset; multiple consumer groups.

**Non-functional:**
- Millions of msg/s; durable; replicated cross-zone.
- End-to-end latency single-digit ms (typical).
- At-least-once + exactly-once options.

## High-Level Design

```
producer ──► Broker (leader of partition)
                │           │
                ▼           ▼
            local log    replicate to ISR followers
                │
                ▼
            consumer pulls from offset
```

## Design Deep Dive

### Topics & partitions

- Topic = logical stream.
- Each topic split into N partitions.
- Each partition is an append-only log (segments on disk).
- Order is guaranteed within a partition, not across.

### Storage

- Sequential write to file (fast; SSD-friendly).
- Pages cached by OS (zero-copy `sendfile` for consumers).
- Retention by time or size; old segments deleted or compacted.

### Replication

- Each partition has a leader and N-1 followers.
- ISR (In-Sync Replicas): followers caught up.
- Producer's `acks=all` waits until all ISR have appended.
- Leader election: if leader fails, controller picks new leader from ISR.

### Producer

- Batch messages (latency vs throughput).
- Partitioner: key-based hash (preserves ordering for a key) or round-robin.

### Consumer

- Consumer groups: each partition assigned to one consumer in the group.
- Offset stored in special topic.
- Rebalance on member join/leave.

### Exactly-once semantics

- Producer idempotency (sequence numbers per producer per partition).
- Transactions: atomic multi-partition writes + consumer-offset commits.
- True end-to-end exactly-once requires consumer also idempotent.

### Metadata / coordination

- Originally Zookeeper; modern Kafka uses KRaft (Raft-based).

## Failure Modes

- **Leader failure** — election; brief unavailability per partition.
- **Slow follower** — drops out of ISR; doesn't block writes.
- **Hot partition** — one key receives all traffic; repartition or add salting.
- **Consumer lag** — alerts; scale consumer group; check downstream.
- **Disk full** — broker hard-fails; capacity planning.

## Real Production

- **Apache Kafka** — reference.
- **AWS Kinesis, GCP Pub/Sub, Azure Event Hubs** — managed.
- **Apache Pulsar** — segment storage separated from brokers.
- **Redpanda** — Kafka-API drop-in, written in C++ for lower latency.
- **NATS, RabbitMQ** — different semantics (mostly queue-style).

## Interview Talking Points

- Partition = unit of parallelism + ordering.
- ISR + acks=all balance latency, durability.
- Consumer group = horizontal consumer scaling.
- Offset stored by broker on behalf of consumer.
- Exactly-once requires producer idempotency + transactions + idempotent consumer.

## Related Concepts

- [[Message Queues]] — abstract concept.
- [[Kafka Architecture]] — concrete instance.
- [[Apache Kafka]] — same.
- [[Topics and Partitions]], [[Consumer Groups]] — concept pages.
- [[Delivery Guarantees]] — at-most/at-least/exactly-once.

## Active Recall Questions

What's the unit of parallelism and ordering in a Kafka-style queue?::The partition — order guaranteed within, parallelism across.

What does ISR mean?::In-Sync Replicas — followers caught up to the leader; producer with acks=all waits for all of them.

How do consumer groups achieve horizontal scaling?::Each partition is assigned to exactly one consumer in a group; group size up to partition count gives linear consumer throughput.

What three things must be true for end-to-end exactly-once?::Producer idempotency (sequence numbers), transactional commits across partitions + offsets, idempotent consumer.

Why does Kafka use sequential disk writes?::Pages cached by OS; sequential write throughput matches network; zero-copy via sendfile for consumer reads.

What's the role of KRaft in modern Kafka?::Replaces Zookeeper as the metadata coordination layer using Raft; simpler, lower-latency, fewer moving parts.

What goes wrong with a hot partition?::All traffic concentrates on one broker (the leader for that partition); consumers can't keep up; mitigate by repartitioning or key salting.

## Feynman Test

A producer publishes 100 messages with the same key. Walk through how the broker handles them, including partition assignment and replication, and what guarantees a consumer sees.

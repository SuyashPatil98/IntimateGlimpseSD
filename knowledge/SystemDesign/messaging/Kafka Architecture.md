---
title: Kafka Architecture
area: messaging
status: mature
difficulty: advanced
prerequisites: ["[[Event Streams]]", "[[Replication]]", "[[Consensus]]"]
related: ["[[Event Streams]]", "[[Topics and Partitions]]", "[[Consumer Groups]]", "[[Consensus]]"]
sources:
  - DDIA, Ch. 11
  - Kafka documentation
tags: [messaging, kafka, streaming]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Kafka Architecture

## Executive Summary

**Apache Kafka** is a **distributed, partitioned, replicated event streaming platform** — the dominant production stream broker. Originated at LinkedIn (2011); now powers data infrastructure at most of the Fortune 500. Architecture: **brokers form a cluster; topics split into partitions; partitions replicated across brokers; producers write; consumer groups read; retention configurable per topic**. Recent versions replaced **ZooKeeper coordination with built-in Raft (KRaft)**. Handles millions of messages per second per node.

## Why This Exists

LinkedIn needed a unified pipeline for user activity, system metrics, and database changes — at huge scale, with replay capability. Existing messaging systems were too slow or too limited. Kafka was built around the "log" abstraction with sequential disk I/O, page cache, and a simple wire protocol. The result: throughput orders of magnitude higher than traditional MQs.

## Core Components

**Broker:** a Kafka server. Brokers form a cluster.

**Topic:** named stream. Logical category.

**Partition:** ordered sub-stream. Topics are split into N partitions for scale.

**Replica:** copy of a partition on another broker. Leader + followers per partition.

**Producer:** writes messages to topics. Routes to partitions by key (consistent hash) or round-robin.

**Consumer:** reads from topics. Belongs to a consumer group.

**Consumer group:** set of consumers that share partition assignments. One consumer per partition per group.

**Controller:** broker responsible for cluster metadata. With KRaft, controllers form a Raft quorum.

## Internal Mechanics

**Write path:**
1. Producer hashes message key → picks partition.
2. Sends to that partition's leader broker.
3. Leader appends to local log.
4. Followers replicate.
5. Once min-in-sync replicas ack → commit.
6. Returns to producer.

**Read path:**
1. Consumer fetches from leader of partition.
2. Reads from current offset.
3. Commits offset periodically (or on demand).

**Replication:**
- Each partition has 1 leader + N-1 followers.
- ISR (in-sync replicas) — followers that are caught up.
- Configurable: `acks=0/1/all` — write durability.
- `min.insync.replicas` — bound the minimum ISR.

**Coordination:**
- Originally ZooKeeper (separate cluster).
- KRaft mode (since 2.8+): brokers themselves form Raft quorum.

## Architecture Diagrams

```
Topic: orders (3 partitions, replication factor 3)

         Broker 1            Broker 2           Broker 3
       ┌─────────┐         ┌─────────┐        ┌─────────┐
       │ P0 (L)  │         │ P0 (F)  │        │ P0 (F)  │
       │ P1 (F)  │         │ P1 (L)  │        │ P1 (F)  │
       │ P2 (F)  │         │ P2 (F)  │        │ P2 (L)  │
       └─────────┘         └─────────┘        └─────────┘
       
L = Leader (writes go here), F = Follower (replicates)

Producer:
  hash(key) % 3 → partition → leader → append.
  
Consumer group of 3 consumers:
  Each consumer assigned 1 partition.
```

## Design Tradeoffs

**Benefits:**
- Massive throughput (millions msg/sec).
- Durability + replication.
- Replay via offset reset.
- Multiple independent consumers via consumer groups.
- Mature ecosystem (Kafka Streams, Connect, ksqlDB).

**Costs:**
- Operational complexity (broker management, partition reassignment).
- Schema management (use Schema Registry).
- Cross-partition ordering not guaranteed.
- ZooKeeper / KRaft operational concerns.

## Real Production Examples

- **LinkedIn** — origin; powers all data infrastructure.
- **Netflix** — data pipeline backbone.
- **Uber** — trip data, financial events.
- **Most large tech companies** — Kafka is the de facto standard.

## Interview Perspective

**Common questions:**
- "How does Kafka achieve high throughput?" → Sequential disk I/O, page cache, batching, zero-copy.
- "What's a partition?" → Ordered sub-stream of a topic. Unit of parallelism.
- "Consumer group?" → Set of consumers sharing partition assignments. Each partition consumed by one consumer in the group.

**Senior-level:**
- Kafka's choice of dumb broker / smart consumer is part of its scale story. Brokers don't track per-consumer state.
- Partition rebalancing is operationally critical and somewhat fraught.
- Kafka exactly-once semantics work read→process→write within Kafka; end-to-end across systems still needs care.

**Common mistakes:**
- Over-partitioning (too many partitions hurts metadata).
- Under-partitioning (limits parallelism).
- Misconfigured retention.
- Treating Kafka as a database (it isn't).

## Related Concepts

- [[Event Streams]] · [[Topics and Partitions]] · [[Consumer Groups]]
- [[Replication]] · [[Consensus]] (KRaft)

## Misconceptions

- **"Kafka is just a queue."** It's a distributed log; richer semantics.
- **"Kafka guarantees global ordering."** Only within a partition.
- **"Kafka is real-time."** Low latency but not microseconds.

## Failure Scenarios

- **Partition leader fails** → followers elect new leader.
- **ISR shrinks below min** → writes block.
- **Consumer lag** → reprocess after fix.
- **Partition reassignment storm** → cluster instability.

## Practical Engineering Heuristics

- **Default partition count by throughput needs** — not too high, not too low.
- **Replication factor 3, min.insync.replicas 2.**
- **acks=all** for durability.
- **Monitor consumer lag.**
- **Use Schema Registry.**

## Active Recall Questions

What's Kafka?::Distributed, partitioned, replicated event streaming platform. Originated at LinkedIn; dominant in production streaming.

Three main concepts in Kafka topology?::Brokers (servers), topics (named streams), partitions (ordered sub-streams).

What's a consumer group?::Set of consumers that share partition assignments. Each partition consumed by one consumer in the group.

What's ISR?::In-Sync Replicas — followers caught up with the leader. `min.insync.replicas` enforces a minimum.

How does Kafka achieve high throughput?::Sequential disk I/O, page cache use, batching, zero-copy transfer.

What replaced ZooKeeper in modern Kafka?::KRaft — brokers themselves form a Raft consensus quorum for cluster metadata.

## Feynman Test

Walk through a message from producer to consumer: routing, replication, consumption.

Why does Kafka choose "dumb broker, smart consumer" — and what does this design enable?

## Mastery Checklist

- **Explain** Kafka architecture and components.
- **Compare** with traditional message queues.
- **Derive** partition count for given throughput.
- **Critique** systems treating Kafka as a queue or database.
- **Design** a Kafka deployment with appropriate replication and retention.

---
type: roadmap
area: messaging
generated: 2026-06-04
status: active
---

# Messaging & Streaming — Learning Roadmap

> Auto-generated from the prereq DAG. 13 core concepts + 10 foundations + 10 downstream applications. Estimated **27.2 hours** total (9.5h core).

## How to use this roadmap

1. Walk Phase 0 first if any of those concepts feel shaky.
2. In Phase 1, study one concept per session: read → write a Feynman summary → drill the recall cards.
3. After Phase 1, drill the area's Anki deck end-to-end before moving to Phase 2.
4. Track progress in Notion (Roadmaps DB) — this file is just the spec.

## Phase 0 — Foundation (cross-area prerequisites)

These come from other areas but are required for the messaging & streaming path. If you've internalized them already, skip ahead.

- [ ] [[ACID]] — *beginner*
- [ ] [[CAP Theorem]] — *intermediate*
- [ ] [[Consistency Models]] — *intermediate*
- [ ] [[Replication]] — *intermediate*
- [ ] [[Failure Detection]] — *intermediate*
- [ ] [[Leader-Based Replication]] — *intermediate*
- [ ] [[Quorums]] — *intermediate*
- [ ] [[Transactions]] — *intermediate*
- [ ] [[WAL]] — *intermediate*
- [ ] [[Consensus]] — *advanced*

## Phase 1 — Core Messaging & Streaming (in dependency order)

Topologically sorted: prereqs always before dependents. Ties broken by difficulty.

- [ ] [[Message Queues]] — *intermediate*
- [ ] [[Dead Letter Queues]] — *beginner*
- [ ] [[Task Queues]] — *beginner*
- [ ] [[Backpressure]] — *intermediate*
- [ ] [[Delivery Guarantees]] — *intermediate*
- [ ] [[Outbox Pattern]] — *intermediate*
- [ ] [[Pub-Sub]] — *intermediate*
- [ ] [[Event Streams]] — *intermediate*
- [ ] [[CDC]] — *intermediate*
- [ ] [[Event Sourcing]] — *advanced*
- [ ] [[Kafka Architecture]] — *advanced*
- [ ] [[Topics and Partitions]] — *intermediate*
- [ ] [[Consumer Groups]] — *intermediate*

## Phase 2 — Applications & case studies

Pages from other areas that build directly on messaging & streaming concepts. Tackle these to see the concepts applied at scale.

- [ ] [[Design Notification System]] — *intermediate*
- [ ] [[Event-Driven Architecture]] — *intermediate*
- [ ] [[Stream Processing]] — *intermediate*
- [ ] [[Apache Kafka]] — *advanced*
- [ ] [[CQRS]] — *advanced*
- [ ] [[Design Chat System]] — *advanced*
- [ ] [[Design Distributed Email]] — *advanced*
- [ ] [[Design Distributed Message Queue]] — *advanced*
- [ ] [[Design Nearby Friends]] — *advanced*
- [ ] [[Design Web Crawler]] — *advanced*

## Recall practice

After each phase, drill the Anki deck for **`messaging`** (filter `deck:SystemDesign::messaging`). Cards are tagged by concept name; you can scope to specific concepts via `tag:concept::Cache_Strategies` etc.

## Track progress

Open the **Roadmaps** database in Notion → this roadmap's row → check off concepts as you reach Mastered status. Time-spent and confidence rollups compute automatically.

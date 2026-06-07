---
title: Event Sourcing
area: messaging
status: mature
difficulty: advanced
prerequisites: ["[[Event Streams]]"]
related: ["[[Event Streams]]", "[[CQRS]]", "[[CDC]]", "[[Outbox Pattern]]"]
sources:
  - DDIA, Ch. 11
  - Vaughn Vernon, "Implementing Domain-Driven Design"
tags: [messaging, event-sourcing, architecture]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Event Sourcing

## Executive Summary

**Event Sourcing** is the architectural pattern where **application state is stored as a sequence of immutable events**, not as the current state of mutable rows. The current state is derived by replaying events. Provides **complete audit log, time travel, easy debugging, natural integration with event streams**. Pairs well with [[CQRS]] (separate read models). Costs: complexity, schema evolution challenges, snapshotting for performance. Used in finance (audit), domain-driven systems, complex business workflows.

## Why This Exists

Traditional CRUD stores only current state — history is lost (unless you build it). Event sourcing flips this: events are primary, state is derived. You get audit log for free, can rebuild state at any past moment, can fork new read models from history. The trade-off is genuine complexity.

## Core Intuition

A bank account modeled as a list of transactions (events: "deposit $100", "withdraw $30") rather than a single balance. Balance is computed by summing transactions. You can replay to any point in time. Disputes are auditable. Adding a new analytics view = replay events into a new projection.

## Internal Mechanics

**Storage:**
- Events appended to an event store (Kafka, EventStore, or a database).
- Each event has: type, payload, aggregate ID, timestamp.
- Aggregate state = fold(events) for that aggregate.

**Write path:**
1. Command arrives.
2. Load events for aggregate.
3. Replay events → current state.
4. Apply command → emit new event(s).
5. Append events.

**Read path (with CQRS):**
1. Projections consume events.
2. Maintain optimized read models (DB views).
3. Queries hit projections, not the event store.

**Snapshots:**
- For long-lived aggregates, periodically save current state.
- Future replays start from latest snapshot.
- Bounds replay cost.

## Real Production Examples

- **Financial systems** — audit log naturally event-sourced.
- **EventStore, Axon** — dedicated event-sourcing platforms.
- **Kafka + Kafka Streams** — event store + projections.
- **Many DDD-influenced systems** — domain events as primary record.

## Design Tradeoffs

**Benefits:**
- Complete audit log.
- Time travel and replay.
- Easy to add new read models.
- Domain-aligned (events = business operations).
- Integration friendly.

**Costs:**
- Conceptual complexity.
- Schema evolution of events.
- Snapshot management.
- Eventual consistency for read models.
- Storage growth.

## Interview Perspective

**Common questions:**
- "What's event sourcing?" → Store state as sequence of immutable events; current state derived by replay.
- "Event sourcing + CQRS?" → ES provides write side; CQRS separates read models. Combined: rich projections.
- "Trade-offs?" → Complexity, schema evolution, snapshotting. Audit and replay are wins.

**Senior-level:**
- Event schema evolution is the biggest practical challenge. Old events must remain readable forever (or be migrated explicitly).
- Snapshotting is essential for performance at scale.
- Distinguish "events as primary store" (ES) from "events as integration" (event-driven architecture).

**Common mistakes:**
- Using ES for everything — most CRUD apps don't need it.
- No snapshots → replay cost grows.
- Event schema changes without migration plan.

## Related Concepts

- [[Event Streams]] · [[CQRS]] · [[CDC]] · [[Outbox Pattern]]
- [[Bounded Contexts]] — DDD pairing.

## Misconceptions

- **"Event sourcing = audit log."** Audit is a benefit; the primary point is events as state.
- **"ES means Kafka."** Kafka is one option; many event stores exist.
- **"ES eliminates databases."** Read models often live in databases.

## Failure Scenarios

- **Event schema break** → old events unreadable.
- **No snapshots** → replay takes minutes.
- **Projection lag** → users see stale read.
- **Storage explosion** → no compaction strategy.

## Practical Engineering Heuristics

- **Use ES selectively** — for domains where audit/replay matters.
- **Snapshot frequently** for hot aggregates.
- **Plan event schema evolution** from day one.
- **Test replay** explicitly.

## Active Recall Questions

What's event sourcing?::Store application state as immutable sequence of events. Current state derived by replaying events.

What's the role of snapshots?::Periodically save aggregate state to bound replay cost. Future replays start from snapshot.

Event sourcing + CQRS?::ES handles write side; CQRS separates read models. Projections consume events to build queryable views.

What's the biggest practical challenge of event sourcing?::Event schema evolution. Old events must remain readable; changes need careful migration.

When is event sourcing overkill?::Simple CRUD apps where audit and replay aren't required.

What's a projection?::Read model built by consuming events. Optimized for specific queries.

## Feynman Test

Model a bank account using event sourcing. Show events, state derivation, snapshots.

Why does event sourcing pair naturally with CQRS but not require it?

## Mastery Checklist

- **Explain** event sourcing and state derivation.
- **Compare** with CRUD storage.
- **Derive** when ES is appropriate.
- **Critique** ES for trivial CRUD apps.
- **Design** an event-sourced domain with snapshots and projections.

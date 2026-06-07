---
title: Outbox Pattern
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Message Queues]]", "[[Transactions]]"]
related: ["[[CDC]]", "[[Idempotency]]", "[[Delivery Guarantees]]"]
sources:
  - DDIA, Ch. 11
  - Microservices community patterns
tags: [messaging, transactions, integration]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Outbox Pattern

## Executive Summary

The **Outbox Pattern** solves the "dual write" problem: how do you reliably **update a database AND publish a message atomically**? Direct attempt fails: DB succeeds, broker fails (or vice versa) → lost messages or inconsistent state. Solution: **write the message to an "outbox" table within the same DB transaction; a separate process polls (or uses [[CDC]]) the outbox and publishes to the broker**. Provides exactly-once-ish semantics across DB and messaging without distributed transactions.

## Why This Exists

Microservices commonly need to update state and notify others. Naïvely: "update DB, then publish event." Race condition: if the service crashes between, you have a state change with no event — invisible inconsistency. Or "publish first, then update DB" — event without state. The Outbox eliminates this by making event publication part of the local DB transaction.

## Core Intuition

A factory ships orders. Each order has both an update to inventory AND a shipment notification. If they're separate steps, a crash leaves inconsistency. The Outbox: write "decrement inventory" and "send shipment email" both into one ledger transaction. A separate clerk reads the ledger and actually sends emails. The ledger is the source of truth; emails follow.

## Internal Mechanics

**Transactional write:**
1. App begins DB transaction.
2. Updates business tables.
3. Inserts row into `outbox` table (event payload + metadata).
4. Commits transaction.

If this transaction succeeds, both state and event-intent are atomic.

**Publisher process:**
1. Polls `outbox` table for unpublished rows (or uses [[CDC]] on the table).
2. Publishes to broker.
3. Marks row as published (or deletes).

**Delivery semantics:** at-least-once. Publisher may publish a row before marking it published, then crash → duplicate. Consumers must be idempotent.

## Architecture Diagrams

```
App service:
  BEGIN TX
    UPDATE inventory SET count = count - 1 WHERE id = ...
    INSERT INTO outbox (event_type, payload, ...) VALUES (...)
  COMMIT
  
  (Both succeed or both fail — atomic.)

Outbox publisher (separate process or CDC):
  SELECT * FROM outbox WHERE published = false
  → publish to Kafka
  → mark published = true
```

## Design Tradeoffs

**Benefits:**
- Atomic state change + event publication.
- No distributed transaction.
- Works with any DB + any broker.
- Publisher restartable safely.

**Costs:**
- Latency added (poll interval).
- Outbox table growth (need cleanup).
- Publisher complexity.
- Consumers still need idempotency.

## Variants

**Polling outbox:** publisher periodically scans table.

**CDC-based:** [[CDC]] (e.g., Debezium) reads DB log and publishes outbox rows in real-time.

**Transactional outbox + cleanup:** delete published rows; or move to history table.

## Real Production Examples

- **Microservices integration** — standard pattern.
- **Stripe, Square** — variants for payments + events.
- **Debezium** — CDC tool commonly used to drain outbox tables.
- **Kafka Connect with JDBC** — alternative drain mechanism.

## Interview Perspective

**Common questions:**
- "What problem does Outbox solve?" → Dual write problem: atomic DB + broker publication without distributed transactions.
- "How does it work?" → Write event to outbox table in same DB transaction. Separate publisher drains outbox to broker.
- "Delivery semantics?" → At-least-once. Consumers must be idempotent.

**Senior-level:**
- The Outbox is canonical for microservices needing both local state changes and downstream events.
- CDC-based outbox (Debezium) is much faster than polling — single-digit ms latency.
- The outbox table is a source of unwanted load if not cleaned — TTL or archive.

**Common mistakes:**
- Polling too frequently (DB load) or too slowly (latency).
- Forgetting to clean up outbox table.
- Consumers not handling duplicates.

## Related Concepts

- [[CDC]] — modern way to drain outbox.
- [[Delivery Guarantees]] · [[Idempotency]]
- [[Transactions]] — outbox relies on DB tx.

## Misconceptions

- **"Outbox gives exactly-once."** At-least-once delivery + idempotent consumers approximate exactly-once.
- **"Outbox replaces distributed transactions."** It's specifically for DB-tx + broker, not arbitrary cross-system.
- **"Outbox is overhead."** Compared to dual-write bugs, the overhead is cheap.

## Failure Scenarios

- **Publisher down** → outbox grows; backlog of events.
- **Outbox table unbounded** → DB bloat.
- **Duplicate publish** without consumer idempotency.

## Practical Engineering Heuristics

- **Use CDC (Debezium)** for low-latency outbox draining.
- **TTL or archive** outbox rows.
- **Index outbox table** for efficient polling.
- **Ensure consumer idempotency.**
- **Monitor outbox table size.**

## Active Recall Questions

What's the Outbox Pattern?::Write event to "outbox" table within same DB transaction as state change. Separate publisher drains outbox to broker. Solves dual-write problem.

What problem does it solve?::Atomic DB update + broker publication without distributed transactions.

How does CDC fit?::CDC reads DB log and publishes outbox rows in real-time. Faster than polling.

Delivery semantics of Outbox?::At-least-once. Publisher may publish then crash before marking published → duplicates. Consumers must be idempotent.

Why not just write to DB then to broker?::Race condition: crash between leaves inconsistency. Outbox makes event publication part of the DB tx.

What's the maintenance concern with Outbox?::Table growth. Need TTL, archive, or delete-after-publish.

## Feynman Test

A service updates an order and must send a "shipped" event. Walk through Outbox vs naive dual write — where does each fail?

Why does Debezium make CDC-based outbox so much more efficient than polling?

## Mastery Checklist

- **Explain** Outbox pattern and dual-write problem.
- **Compare** Outbox with distributed transactions.
- **Derive** appropriate publisher strategy.
- **Critique** naive dual-write designs.
- **Design** Outbox + CDC architecture for microservices.

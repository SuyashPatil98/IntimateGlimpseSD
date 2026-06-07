---
title: CDC
aliases: [Change Data Capture]
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[WAL]]", "[[Event Streams]]"]
related: ["[[WAL]]", "[[Event Streams]]", "[[Outbox Pattern]]", "[[Event Sourcing]]"]
sources:
  - DDIA, Ch. 11
  - Debezium docs
tags: [messaging, cdc, integration]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# CDC (Change Data Capture)

## Executive Summary

**Change Data Capture (CDC)** is the technique of **identifying and capturing changes made to a database, then delivering those changes to downstream systems** as a stream of events. Reads from the database's [[WAL]] (write-ahead log) — the most authoritative, low-latency source. Used for **data warehousing, search index updates, cache invalidation, microservice integration, real-time analytics**. Canonical implementation: **Debezium** (open-source CDC connectors for Postgres, MySQL, MongoDB, others). Pairs naturally with [[Kafka Architecture]] and the [[Outbox Pattern]].

## Why This Exists

Many systems need to react to DB changes: update search index, invalidate cache, populate data warehouse, notify other services. Naïve approaches (poll DB, dual write) are slow or unreliable. CDC reads the DB's authoritative change log — capturing every change with low latency and no application-level burden.

## Core Intuition

A database journals every change in its [[WAL]] for recovery. CDC reads that journal as a stream — turning the DB's internal mechanism into an external event source. Every INSERT/UPDATE/DELETE becomes an event.

## Internal Mechanics

**WAL-based CDC:**
1. CDC tool connects to DB as a replication consumer.
2. Reads WAL entries as they're generated.
3. Decodes them into logical events (row changes with before/after images).
4. Publishes to a stream (Kafka, Kinesis, etc.).

**Alternatives (less ideal):**
- **Trigger-based:** DB triggers write to audit table; CDC reads audit.
- **Polling-based:** periodically scan for changes (slow, high latency).
- **Application dual-write:** error-prone.

**Postgres logical replication** + Debezium connector → standard production setup.

## Real Production Examples

- **Debezium** — open-source CDC for many DBs.
- **AWS DMS** — managed CDC for replication.
- **Kafka Connect** — Debezium runs as connectors.
- **Stripe, Shopify** — heavy CDC users for data integration.

## Design Tradeoffs

**Benefits:**
- Low latency (single-digit ms).
- No application changes.
- Authoritative source (WAL).
- All changes captured.
- Foundation for many integration patterns.

**Costs:**
- DB load (replication consumer).
- Schema evolution coupling.
- Snapshot of initial state required.
- Operational complexity.

## Real Production Examples

- **Search index sync:** DB → CDC → Kafka → Elasticsearch.
- **Cache invalidation:** DB → CDC → Redis evict.
- **Data warehouse:** OLTP → CDC → Snowflake.
- **Microservice integration:** service DB → CDC → events.
- **Outbox draining:** outbox table → CDC → Kafka.

## Interview Perspective

**Common questions:**
- "What's CDC?" → Capture DB changes as a stream of events. Read from WAL for low latency.
- "Why use it?" → Real-time integration without polling or app changes.
- "Debezium?" → Open-source CDC for major DBs. Standard production tool.

**Senior-level:**
- CDC + Kafka has become the modern data integration backbone, displacing batch ETL for many workloads.
- Initial snapshot is operationally important — establishes baseline before WAL streaming.
- Schema changes (DDL) need explicit handling in CDC pipelines.

**Common mistakes:**
- Treating CDC as a magic solution; it has operational overhead.
- Forgetting initial snapshot.
- Schema changes breaking downstream.

## Related Concepts

- [[WAL]] — CDC's data source.
- [[Event Streams]] · [[Kafka Architecture]]
- [[Outbox Pattern]] · [[Event Sourcing]]

## Misconceptions

- **"CDC = Replication."** Related but different. Replication is for failover; CDC is for integration.
- **"CDC is real-time."** Low-latency, but not zero-latency.
- **"CDC is free."** Has operational cost.

## Failure Scenarios

- **Replication slot growth** in Postgres if consumer lags.
- **Schema change** breaks downstream.
- **CDC consumer lag** → integration delayed.
- **Initial snapshot too slow** for large tables.

## Practical Engineering Heuristics

- **Use Debezium** for most CDC needs.
- **Monitor replication lag.**
- **Handle DDL events** explicitly in pipeline.
- **Plan initial snapshot** for large tables.
- **Cleanup orphaned replication slots.**

## Active Recall Questions

What's CDC?::Change Data Capture. Capture DB changes as a stream of events, typically by reading the WAL.

Why is WAL-based CDC superior to polling?::Lower latency (ms vs minutes), no application changes, captures all changes including deletes, authoritative source.

What's Debezium?::Open-source CDC platform. Connectors for Postgres, MySQL, MongoDB, etc. Runs as Kafka Connect.

Name three CDC use cases.::Search index sync, cache invalidation, data warehouse loading, microservice integration, outbox draining.

What's the Postgres mechanism CDC uses?::Logical replication. Consumer reads WAL as a replication client.

What's a replication slot?::Postgres construct tracking a replication consumer's progress. Holds WAL until consumer acks. Can grow if consumer lags.

## Feynman Test

Walk through CDC for "user updates profile; search index must reflect immediately." How does the change flow?

Why has CDC + Kafka displaced traditional ETL for many real-time integrations?

## Mastery Checklist

- **Explain** CDC and its WAL-based source.
- **Compare** CDC with polling and dual-write.
- **Derive** appropriate CDC architecture for given integration.
- **Critique** polling-based integrations vs CDC.
- **Design** a CDC pipeline using Debezium + Kafka.

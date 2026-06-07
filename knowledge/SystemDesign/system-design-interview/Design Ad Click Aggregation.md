---
title: Design Ad Click Aggregation
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Stream Processing]]", "[[Apache Kafka]]"]
related: ["[[Design Metric Monitoring]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.6 ("Ad Click Event Aggregation")
  - Google Borg / Mesa whitepaper
  - Apache Flink / Kafka Streams docs
tags: [system-design-interview, advanced-design, streaming, ads]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Ad Click Aggregation

## Executive Summary

Aggregate billions of ad-click events per day into per-minute / per-hour / per-day counts per (ad_id, country, etc.), with **exactly-once semantics for billing**, **near-real-time freshness** for reporting, and **late-event handling**. Architecture: Kafka ingestion + Flink/Spark streaming aggregation + OLAP store for queries.

## Requirements

**Functional:** Ingest click events, aggregate by (ad_id, time bucket, dimensions), serve reports.

**Non-functional:**
- 10 B clicks/day → 100 k events/s avg, peak 500 k.
- Reports fresh within 1 min.
- No double-counting (billing).
- Tolerance for late events (up to N hours).

## High-Level Design

```
client click ──► Ingest API ──► Kafka (raw clicks)
                                    │
                                    ▼
                        Stream processor (Flink/Spark)
                            └──► windowed aggregation
                                    │
                                    ▼
                            OLAP store (Druid/Pinot/Clickhouse)
                                    │
                                    ▼
                              Reporting API
                                    │
                                    ▼
                      (parallel) Batch reconciliation
                      (Spark on raw → catches up nightly)
```

## Design Deep Dive

### Ingestion

- Lightweight HTTP endpoint writes raw event to Kafka.
- Dedup keys on event_id (client-generated) to prevent double-counting.

### Stream aggregation

- Flink (preferred for event-time semantics) or Spark Structured Streaming.
- Tumbling/sliding windows by (ad_id, dim, minute).
- **Event-time + watermarks**: handle out-of-order events.
- **Exactly-once**: Flink checkpointing + transactional sinks.

### Late events

- Configurable allowed lateness (e.g., 1 hour).
- Late updates emitted as corrections.
- Or accept staleness in real-time path + reconciliation from raw at batch.

### Storage

- OLAP: Druid / Pinot / ClickHouse — column-oriented, ingests streams, fast aggregations.
- Partition by time; replicate for read scale.

### Reconciliation (lambda-ish)

- Streaming gives real-time but may have errors (late events, bugs).
- Batch reads raw → recomputes nightly → corrects OLAP table.
- For billing, batch numbers are authoritative.

### Anti-fraud

- Bot click detection — separate pipeline; fraudulent clicks deducted.

## Failure Modes

- **Stream operator restart** — checkpointed state replays correctly.
- **Watermark slow** — late event holds output. Mitigation: bounded lateness.
- **OLAP write hot partition** — partition by ad_id hash + time bucket.
- **Duplicate ingest** — event_id dedup.
- **Clock skew at client** — server-side timestamp on ingest.

## Real Production

- **Google Mesa** (paper) — petabyte-scale ad metrics warehouse.
- **Facebook Scribe + Hive** — historical.
- **LinkedIn Pinot, Apache Druid** — common OLAP backends.
- **YouTube/Display ads** — combined real-time + batch reconcile.

## Interview Talking Points

- Streaming + batch reconciliation (the lambda pattern, even if Kappa-leaning).
- Event-time windows + watermarks.
- Exactly-once via Flink + transactional sinks.
- Late events handling.
- OLAP store choice.
- Reconciliation = authoritative for billing.

## Related Concepts

- [[Stream Processing]] — substrate.
- [[Apache Flink]] — preferred engine.
- [[Apache Kafka]] — ingestion.
- [[Stream Windowing]] — windowing semantics.
- [[Lambda Architecture]] / [[Kappa Architecture]] — relevant patterns.

## Active Recall Questions

Why is exactly-once important in ad click aggregation?::Clicks correspond to billing; double-counting overcharges advertisers; missing clicks undercharges publishers.

What's the role of watermarks in stream aggregation?::Track event-time progress; allow windows to close when no more events from before time t are expected; bound the wait for late data.

How are late events handled?::Allowed-lateness window updates the closed window with corrections; or accept real-time staleness and rely on batch reconciliation.

Why have batch reconciliation alongside streaming?::Streaming is real-time but error-prone (late events, operator bugs, restarts); batch recomputation over raw events is authoritative for billing.

Why use Flink over Spark for this workload?::Flink's native event-time + watermarks + exactly-once with transactional sinks; Spark Structured Streaming has improved but Flink is the choice when event-time correctness is paramount.

What OLAP databases are commonly used for click reports?::Apache Druid, Apache Pinot, ClickHouse — all column-oriented with streaming ingestion and fast time-bucketed aggregations.

How do you dedupe duplicate click events at ingestion?::Client-generated event_id; ingestion deduplicates within a window (e.g., 24h) via KV store or Kafka idempotent producer.

## Feynman Test

An ad's per-minute click count appears in the dashboard 30 seconds after the click. Trace the event from browser to dashboard — and explain at which point billing trusts the number vs the dashboard's.

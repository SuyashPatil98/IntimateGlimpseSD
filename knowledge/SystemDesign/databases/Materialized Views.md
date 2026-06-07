---
title: Materialized Views
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[Relational Databases]]", "[[Denormalization]]"]
related: ["[[Denormalization]]", "[[Query Optimization]]", "[[OLTP vs OLAP]]"]
sources:
  - DDIA, Ch. 11
  - PostgreSQL docs
tags: [databases, performance, views]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Materialized Views

## Executive Summary

A **materialized view** is a **pre-computed query result stored as a table**, automatically (or manually) refreshed when the underlying data changes. Where a regular view is just a stored query (recomputed on every access), a materialized view is the stored *answer*. Trades **disk space + refresh cost** for **read speed**. Used for **expensive joins, aggregations, and reporting queries** that run repeatedly. Modern systems support **incremental refresh** — only the changed rows update — making materialized views practical for near-real-time analytics.

## Why This Exists

Some queries are expensive but their results don't change every second: "total sales per region per day," "top 100 products by revenue this month," "user activity stats." Computing these on demand is wasteful. Storing them as tables wastes write effort if not used. Materialized views automate the cache: the database knows the dependency; you query the view; the system refreshes it.

## Core Intuition

A spreadsheet with a "Summary" tab that's automatically updated when the underlying data changes. You don't recompute every time you look at the summary — it's been pre-computed. The cost was paid when the data changed.

## Internal Mechanics

**Definition:**
```sql
CREATE MATERIALIZED VIEW daily_sales AS
SELECT date_trunc('day', created_at) AS day, sum(amount) AS total
FROM orders
GROUP BY day;
```

**Refresh modes:**
- **Full refresh** — recompute from scratch. Simple; expensive.
- **Incremental refresh** — only update rows affected by base table changes. Complex; efficient.
- **On-demand** — refresh when you explicitly trigger.
- **Scheduled** — refresh every N minutes.
- **On-commit** — refresh whenever underlying data commits.

**Trade-off:** more frequent refresh = fresher data + more work.

## Real Production Examples

- **PostgreSQL** — MATERIALIZED VIEW with manual REFRESH. CONCURRENTLY option avoids blocking reads.
- **Oracle** — extensive materialized view support including incremental refresh.
- **Snowflake / BigQuery** — materialized views with automatic refresh.
- **Streaming systems** (Kafka Streams, Flink) — materialized views as state.
- **CQRS pattern** — materialized views for query side, separated from command side.

## Design Tradeoffs

**Benefits:**
- Fast queries against pre-computed results.
- Reduces compute on hot reports.
- Foundation for read-optimized layers (CQRS).

**Costs:**
- Refresh overhead.
- Storage (the view is a real table).
- Staleness — view lags the source unless near-real-time refresh.
- Complexity — must track when refresh is needed.

## Interview Perspective

**Common questions:**
- "Materialized view vs regular view?" → Regular: stored query, recomputed each access. Materialized: stored result, refreshed on schedule/trigger.
- "When use materialized views?" → Expensive queries hit repeatedly; staleness acceptable.
- "Incremental vs full refresh?" → Incremental: efficient but complex (requires change tracking). Full: simple but expensive on large views.

**Senior-level:**
- Materialized views are essential in OLAP and reporting systems where source data is huge and aggregates dominate query load.
- Streaming systems essentially produce continuous materialized views — stream → state → query.
- Materialized views can become stale; design refresh cadence matching freshness SLA.

**Common mistakes:**
- Materializing tiny queries — not worth the maintenance.
- Forgetting to refresh — stale results.
- Full refresh on huge views during peak — locks/spikes.

## Related Concepts

- [[Denormalization]] — materialized views are DB-managed denormalization.
- [[Query Optimization]] — planner can sometimes route queries to materialized views.
- [[OLTP vs OLAP]] — OLAP-heavy use.

## Misconceptions

- **"Materialized = always fresh."** Refresh cadence determines freshness.
- **"Materialized views are free."** Refresh cost is real, especially for full refreshes.
- **"Streaming = materialized views."** Streaming systems share the spirit but operate on different time scales.

## Failure Scenarios

- **Refresh lock contention** — full refresh blocks reads. Mitigation: REFRESH CONCURRENTLY (Postgres).
- **Refresh fails** — view goes stale silently. Mitigation: monitoring.
- **Underlying schema change** — view must be rebuilt.

## Practical Engineering Heuristics

- **Materialize expensive, frequently-read aggregates.**
- **Use REFRESH CONCURRENTLY** in Postgres for non-blocking refreshes.
- **Match refresh cadence to staleness SLA.**
- **Monitor refresh duration and success.**
- **For streaming-fresh views, use Materialize / RisingWave / Flink Table.**

## Active Recall Questions

What's a materialized view?::Pre-computed query result stored as a table. Refreshed automatically or manually when underlying data changes.

Materialized view vs regular view?::Regular: stored query, recomputed each access. Materialized: stored result; refresh manages staleness.

Full vs incremental refresh?::Full: recompute from scratch (simple, expensive). Incremental: update only affected rows (complex, efficient).

When use materialized views?::Expensive queries run repeatedly; staleness is acceptable.

Cost of materialized views?::Refresh overhead, storage, staleness window, complexity of refresh strategy.

What's REFRESH CONCURRENTLY in Postgres?::Refreshes the materialized view without blocking reads. Requires a UNIQUE index on the view.

## Feynman Test

Walk through using a materialized view for a daily-sales dashboard. What's the refresh strategy? Trade-offs?

Why are materialized views foundational to OLAP / reporting systems?

## Mastery Checklist

- **Explain** materialized views and refresh modes.
- **Compare** materialized views and regular views.
- **Derive** appropriate refresh cadence for given workload.
- **Critique** "always materialize" approaches.
- **Design** a reporting layer using materialized views.

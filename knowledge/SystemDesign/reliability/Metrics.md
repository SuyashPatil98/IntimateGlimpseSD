---
title: Metrics
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[Observability]]"]
related: ["[[Observability]]", "[[Logs]]", "[[Distributed Tracing]]", "[[USE Method]]", "[[RED Method]]"]
sources:
  - SRE book
  - Prometheus docs
tags: [reliability, observability, metrics]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Metrics

## Executive Summary

**Metrics** are **aggregated numeric measurements over time** — counters of events, gauges of current state, histograms of distributions. The cheapest observability pillar to store and query. Foundation of dashboards, alerts, [[SLO|SLOs]], and capacity planning. Limitations: pre-aggregated (low cardinality), no per-event detail. **Prometheus** is the open-source standard; **StatsD, InfluxDB, Datadog, CloudWatch** also common.

## Why This Exists

You need to track "how many requests per second?" "What's p99 latency?" "How much CPU?" These trends matter more than individual events. Metrics aggregate at write time — cheap to store, fast to query. Foundation of monitoring and SLO tracking.

## Core Intuition

A car's dashboard: speed, fuel, RPM, temperature. Aggregated continuous signals; not "every wheel rotation logged." You glance at the dashboard and understand the car's state. Metrics are software's dashboard.

## Internal Mechanics

**Metric types:**

**Counter:** monotonically increasing. Rate of increase often more useful than value.
- `http_requests_total{status="200", method="GET"}`

**Gauge:** current value; up or down.
- `memory_used_bytes`
- `queue_depth`

**Histogram:** distribution.
- `http_request_duration_seconds_bucket{le="0.5"}` — number of requests faster than 500ms.

**Summary:** quantile-based distribution.

**Labels (dimensions):**
- `http_requests_total{service="api", endpoint="/users", status="200"}`
- Each label combination is a unique time series.

**Cardinality** — number of unique label combinations. High cardinality (e.g., per-user-ID labels) breaks metrics systems.

## Design Tradeoffs

**Benefits:**
- Cheap to store.
- Fast to query.
- Great for trends.
- Foundation of alerts.

**Costs:**
- Pre-aggregated (lose detail).
- Cardinality limits.
- Per-event impossible.

## Real Production Examples

- **Prometheus** — pull-based; open source; de facto standard.
- **StatsD** — push-based; older.
- **InfluxDB, OpenTSDB** — time-series DBs.
- **CloudWatch, Datadog, New Relic.**
- **OpenTelemetry Metrics** — standard.

## Interview Perspective

**Common questions:**
- "Metric types?" → Counter, gauge, histogram, summary.
- "Cardinality?" → Number of unique label combinations. High cardinality breaks systems.
- "Pull vs push?" → Pull (Prometheus): broker scrapes targets. Push (StatsD): apps send.

**Senior-level:**
- Cardinality is *the* problem in metrics. Label by user_id and you'll bust your system.
- Histograms vs summaries: histograms aggregatable across instances; summaries not.
- Prometheus's PromQL is unusual; learning it is worth the investment.

**Common mistakes:**
- High-cardinality labels (user_id, request_id).
- No SLO-aligned metrics.
- Averaging instead of percentiles.

## Related Concepts

- [[Observability]] · [[Logs]] · [[Distributed Tracing]] · [[USE Method]] · [[RED Method]] · [[SLO]]

## Misconceptions

- **"Metrics = monitoring."** Foundation, not replacement.
- **"Higher cardinality = better."** Breaks the system.
- **"Average latency is meaningful."** Use percentiles.

## Failure Scenarios

- **Cardinality explosion** crashes the metric store.
- **Average instead of percentile** hides p99.
- **Pre-aggregated** loses needed detail.

## Practical Engineering Heuristics

- **Bounded label cardinality** (no user_id, no full URL).
- **Histograms for latency** (not averages).
- **Counters with rate()** for traffic.
- **SLO-aligned metrics first.**
- **Prometheus + Grafana** is the modern default.

## Active Recall Questions

What are the four metric types?::Counter (monotonic), Gauge (current value), Histogram (distribution), Summary (quantiles).

What's cardinality?::Number of unique label combinations. High cardinality breaks metrics systems.

Why averages bad for latency?::Tail-skewed; doesn't show user pain. Use p50/p95/p99.

Pull vs push metrics?::Pull (Prometheus): broker scrapes. Push (StatsD): apps send.

Why are metrics cheap?::Pre-aggregated at write time. Store one number per series per scrape, not per event.

Why is "label by user_id" bad?::Each user creates a unique time series. Cardinality explodes.

## Feynman Test

Design metrics for an HTTP API: requests, latency, errors. What types? What labels?

Why is "p99 latency" more useful than "average latency"?

## Mastery Checklist

- **Explain** metrics and types.
- **Compare** metrics with logs and traces.
- **Derive** appropriate metrics for given service.
- **Critique** high-cardinality designs.
- **Design** metric suite aligned with SLOs.

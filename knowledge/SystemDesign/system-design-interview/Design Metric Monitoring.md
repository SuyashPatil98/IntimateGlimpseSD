---
title: Design Metric Monitoring
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Metrics]]", "[[Observability]]"]
related: ["[[Design Ad Click Aggregation]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.5 ("Metric Monitoring System")
  - Prometheus, InfluxDB, M3 docs
  - Facebook Gorilla paper (2015)
tags: [system-design-interview, advanced-design, observability]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Metric Monitoring

## Executive Summary

Build a Prometheus / Datadog-style metric system: ingest billions of time-series points per minute, support ad-hoc queries (PromQL), trigger alerts, retain history. Core: **time-series database** with **gorilla-style compression**, **pull (scrape)** or **push** ingestion, **downsampling/rollups** for long retention.

## Requirements

**Functional:** Ingest metrics (counter, gauge, histogram, summary); query; alert on rules; dashboards.

**Non-functional:**
- 10 M active series, billions of points/min.
- p99 query <1 s for common queries.
- Retention: 30 days high-res, 1 year downsampled.

## High-Level Design

```
agents/exporters ──► Collector ──► Ingestion ──► TSDB (in-memory + disk)
                                       │              │
                                       ▼              ▼
                                  Alert manager   Query API
                                       │              │
                                       ▼              ▼
                                  notifications   dashboards
```

## Design Deep Dive

### Ingestion: pull vs push

- **Pull (Prometheus)**: server scrapes targets at interval. Pros: easy service-discovery; can detect down targets. Cons: networking constraints (must reach every target).
- **Push (Graphite, StatsD)**: clients send. Pros: works behind NAT. Cons: extra infra; congestion handling.

Most modern stacks: pull within DC + push relays from external.

### Time-series storage

- Series = (name + label set) → ordered list of (timestamp, value).
- Hot writes go to in-memory buffer; periodic flush to disk segments.
- **Gorilla compression** (Facebook 2015): delta-of-delta timestamps + XOR'd values; ~1.4 B per point.
- Disk segments per time window (e.g., 2-hour); old segments compacted/downsampled.

### Indexing

- Per series: name + labels → series id.
- Inverted index: label name+value → set of series ids.
- Queries like `up{job="api"}` resolve via index intersection.

### Query

- PromQL / InfluxQL / Flux.
- Range query: fetch series, apply functions (rate, avg_over_time, histogram_quantile).
- Sharded by time + series.

### Cardinality control

- Each unique label combination = new series.
- High cardinality (e.g., `user_id` label with millions of values) explodes memory.
- Cap labels; reject high-cardinality dimensions.

### Downsampling / rollups

- Past N days: 10 s resolution.
- N to M days: 1 min resolution.
- M+ days: 1 hour resolution.
- Storage shrinks 10–100×.

### Alerting

- Rules evaluate PromQL expressions periodically.
- Firing alerts to Alertmanager → dedup, group, route to PagerDuty/Slack.

## Failure Modes

- **Cardinality explosion** — sudden new label values blow up memory. Mitigation: limits, label removal.
- **Hot tenant** in multi-tenant systems — isolate via quotas / dedicated shards.
- **Query OOM** on heavy range query — query time/memory limits.
- **Alert flap** — hysteresis, "for" clauses.
- **Clock skew** between targets — server-side timestamps optional.

## Real Production

- **Prometheus** — open-source standard.
- **VictoriaMetrics, Cortex, Mimir, Thanos** — Prometheus-compatible at scale.
- **InfluxDB** — alternative TSDB.
- **Datadog, New Relic, Grafana Cloud** — managed.
- **Facebook Gorilla** — original in-memory TSDB paper.
- **Uber M3** — large-scale.

## Interview Talking Points

- Pull vs push trade-off.
- Gorilla compression as the storage win.
- Cardinality as the primary failure mode.
- Downsampling tiers for retention economics.
- Alerting as separate pipeline with "for" hysteresis.

## Related Concepts

- [[Metrics]] — fundamentals.
- [[Observability]] — broader frame.
- [[Time-Series Databases]] — substrate.

## Active Recall Questions

What is the difference between pull and push ingestion?::Pull: server scrapes targets at intervals (Prometheus); easier service discovery, detects down targets. Push: clients send to a relay (StatsD, Graphite); works behind NAT, needs congestion control.

What is Gorilla compression?::Facebook's TSDB compression (2015) using delta-of-delta on timestamps and XOR'd doubles for values; achieves ~1.4 bytes per data point.

What's the cardinality explosion problem?::Each unique (metric, label-value-set) is a series; high-cardinality labels (e.g., user_id) multiply series count, blowing up memory and index size.

What is downsampling and why do you do it?::Reduce resolution for older data (10s → 1min → 1hr); shrinks storage 10–100×; aligned with how often anyone queries old data.

How does PromQL resolve a query like `rate(http_requests_total{job="api"}[5m])`?::Index lookup for series matching the label set → fetch raw counter samples over the 5-min window → compute rate per series → return time series.

What's the role of Alertmanager?::Receives firing alerts from Prometheus, deduplicates, groups, applies silences and inhibition rules, routes to receivers (PagerDuty, Slack, email).

Why do production alert rules use a "for" clause (e.g., "for: 5m")?::Hysteresis — only fire if the condition holds for 5 min; prevents alert flapping on transient spikes.

## Feynman Test

A developer adds a label `request_id` to a metric. Walk through what happens to the monitoring system within 30 minutes.

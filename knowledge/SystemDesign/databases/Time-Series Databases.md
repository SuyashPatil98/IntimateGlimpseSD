---
title: Time-Series Databases
area: databases
status: stub
difficulty: intermediate
prerequisites: ["[[Columnar Storage]]"]
related: ["[[Design Metric Monitoring]]", "[[Wide-Column Store]]", "[[Apache Spark]]"]
builds_toward: []
sources:
  - Facebook Gorilla paper (2015)
  - InfluxDB / Prometheus / TimescaleDB / VictoriaMetrics docs
  - Data Engineering Cookbook (Kretz)
tags: [databases, time-series, monitoring]
created: 2026-06-04
last_reviewed: 2026-06-04
---

# Time-Series Databases

## Executive Summary

**Time-series databases (TSDB)** are specialized stores optimized for the access pattern of time-stamped points keyed by (metric, labels): high write rate, append-mostly, range scans by time, aggregations over windows, downsampling for retention. Examples: Prometheus, InfluxDB, TimescaleDB, VictoriaMetrics, M3, Druid, ClickHouse for OLAP-time.

## Core Intuition

A general-purpose RDBMS or wide-column store *can* handle time-series, but the workload's shape (billions of points/min, time-range queries, label cardinality) rewards purpose-built indexing + compression + downsampling.

## Key Techniques

- **Gorilla-style compression** (Facebook, 2015): delta-of-delta timestamps + XOR'd float values; ~1.4 B/point.
- **Per-series storage**: each unique label-set is its own logical series; series indexed for label-set queries.
- **Time-bucketed segments**: write to memory, flush to disk per time window (e.g., 2-hour blocks).
- **Downsampling tiers**: hot data at full resolution, older data downsampled (10s → 1m → 1h).
- **Inverted label index**: query like `{job="api", region="us-east"}` resolves via index intersection.

## Cardinality

The defining gotcha: each unique label combination is a new series. High-cardinality labels (e.g., `user_id`) explode memory and index size. **Cap label cardinality, especially on hot paths.**

## Design Tradeoffs

- **TSDB vs general RDBMS:** TSDB wins for monitoring/metrics workloads; RDBMS wins when joins or transactional updates matter.
- **Push (StatsD) vs pull (Prometheus):** push works behind NAT; pull eases service discovery and detects down targets.

## Real Production

- **Prometheus** — open-source standard for monitoring.
- **InfluxDB, TimescaleDB, VictoriaMetrics, M3** — alternatives.
- **Datadog, Honeycomb, Grafana Cloud** — managed.
- **ClickHouse** — column store often used for time-series at warehouse scale.

## Related Concepts

- [[Design Metric Monitoring]] — canonical TSDB application.
- [[Columnar Storage]] — adjacent compression idea.
- [[Wide-Column Store]] — bigtable-style time-bucketed schemas.
- [[Metrics]] — the data this stores.

## Active Recall Questions

What's the defining workload of a TSDB?::High-rate append-only writes of (timestamp, value) points keyed by metric + labels, with time-range scans and aggregation over windows.

What is Gorilla compression?::Facebook's TSDB compression: delta-of-delta timestamps + XOR'd float values; ~1.4 bytes per point.

What is the cardinality explosion problem?::Each unique label combination = a new series; high-cardinality labels (e.g., user_id with millions of values) blow up memory and index size.

What does downsampling do?::Reduces resolution for older data (10s → 1m → 1h); shrinks storage 10–100× while matching how often anyone queries old data.

Why are TSDBs faster than RDBMSs for monitoring workloads?::Specialized compression, time-bucketed indexing, no need for general transactional or relational machinery; orders-of-magnitude smaller storage and faster range scans.

## Feynman Test

Explain why putting Prometheus metrics into Postgres "would technically work" but no production team does it.

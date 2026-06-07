---
title: Batch Processing
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Stream Processing]]", "[[MapReduce]]", "[[Apache Spark]]", "[[ETL vs ELT]]", "[[Lambda Architecture]]"]
builds_toward: ["[[MapReduce]]", "[[Apache Spark]]", "[[Lambda Architecture]]"]
sources:
  - DDIA Ch.10 (pp. 389–447)
  - Data Engineering Cookbook (Kretz)
tags: [data-engineering, batch, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Batch Processing

## Executive Summary

**Batch processing** processes **bounded datasets in scheduled jobs** — read a large input, compute, write output. Contrasts with [[Stream Processing]] (unbounded, low-latency). High throughput at the cost of latency (minutes to hours). Underlies **analytics, reports, ETL, ML training, search index builds**. Foundational: **MapReduce** (Google 2004), then **Spark, Flink batch, Hadoop** ecosystem. Modern: cloud-native via Snowflake, BigQuery, Databricks.

## Why This Exists

Some workloads naturally fit batch: train a model on yesterday's data; generate daily reports; rebuild search index nightly. Latency doesn't matter; throughput does. Batch systems optimize for processing enormous datasets efficiently.

## Core Intuition

A bakery making 1000 loaves at 4 AM for the day. Batch: large input, scheduled, high throughput. Compare to making one loaf per customer order (streaming). Different optimization.

## Internal Mechanics

**Properties:**
- Bounded input (fixed dataset).
- High throughput (TBs/hour).
- Higher latency (minutes to hours).
- Scheduled (cron-like).
- Idempotent (re-run safely).

**Architecture:**
- **Input** — usually distributed storage (HDFS, S3).
- **Compute** — distributed (Spark, MapReduce).
- **Output** — distributed storage or DB.
- **Orchestration** — Airflow, Dagster, Prefect.

**Typical operations:**
- Filter, map, aggregate, join, group, sort.
- ML training.
- ETL transformations.

## Real Production Examples

- **MapReduce** — original.
- **Apache Spark** — modern dominant.
- **Apache Hive, Presto** — SQL-on-batch.
- **dbt** — modern SQL-based batch transformations.
- **Snowflake, BigQuery, Redshift** — cloud batch warehouses.

## Design Tradeoffs

**Benefits:**
- High throughput.
- Resource efficient at scale.
- Simpler semantics than streaming.

**Costs:**
- High latency (results stale).
- Bursty resource usage.
- Lambda architecture complexity if combined with streaming.

## Interview Perspective

**Common questions:**
- "Batch vs stream?" → Batch: bounded, scheduled, high throughput. Stream: unbounded, real-time, low latency.
- "When use batch?" → Large datasets, latency-tolerant work (reports, training).
- "Frameworks?" → Spark, MapReduce, Hive, BigQuery.

**Senior-level:**
- Modern lakehouse + Spark is the dominant batch model.
- dbt + cloud warehouse covers most analytical batch needs.
- Pure-streaming alternatives (Flink) increasingly close the latency gap.

**Common mistakes:**
- Batch when streaming required (real-time needs).
- Streaming when batch suffices (over-complication).

## Related Concepts

- [[Stream Processing]] · [[MapReduce]] · [[Apache Spark]] · [[ETL vs ELT]] · [[Lambda Architecture]] · [[Kappa Architecture]]

## Misconceptions

- **"Batch is outdated."** Still dominant for many workloads.
- **"Streaming replaces batch."** Different sweet spots.

## Failure Scenarios

- **Late data** missed by daily window.
- **Long runtime** misses SLA.
- **Schema drift** breaks pipeline.

## Practical Engineering Heuristics

- **Use batch for non-realtime, large-data work.**
- **Spark or cloud warehouse for compute.**
- **Airflow for orchestration.**
- **Idempotent operations.**

## Active Recall Questions

What's batch processing?::Processing bounded datasets in scheduled jobs. High throughput, higher latency.

Batch vs stream?::Batch: bounded input, scheduled, throughput-optimized. Stream: unbounded, real-time, latency-optimized.

When use batch?::Large datasets, latency-tolerant work — daily reports, ML training, ETL.

Modern dominant framework?::Apache Spark for compute; cloud warehouses (Snowflake, BigQuery) for SQL.

What's idempotent?::Same input → same output on re-run. Crucial for batch reliability (retries safe).

## Feynman Test

Design a daily analytics pipeline. Why batch?

When does streaming make more sense than batch?

## Mastery Checklist

- **Explain** batch processing.
- **Compare** with streaming.
- **Derive** when batch fits.
- **Critique** unnecessary streaming complexity.
- **Design** batch pipeline with orchestration.

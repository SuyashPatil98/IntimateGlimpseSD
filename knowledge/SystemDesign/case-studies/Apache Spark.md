---
title: Apache Spark
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Batch Processing]]"]
related: ["[[Apache Flink]]", "[[MapReduce]]"]
builds_toward: []
sources:
  - Zaharia et al. "Resilient Distributed Datasets" (NSDI 2012)
  - Zaharia et al. "Spark: Cluster Computing with Working Sets" (HotCloud 2010)
  - Apache Spark docs; Databricks engineering
tags: [case-study, data-engineering, spark]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Apache Spark

## Executive Summary

**Apache Spark** is the dominant general-purpose distributed compute engine for big data. Created at UC Berkeley AMPLab (2009) by Matei Zaharia, open-sourced 2010, Databricks founded 2013. Replaced [[MapReduce]] for most batch workloads with **in-memory caching, lazy evaluation, and a unified API** spanning batch, streaming, SQL, and ML.

## Why It Mattered

MapReduce's biggest pain: every job round-trips through HDFS. Iterative algorithms (ML, graph) re-read the same data many times. Spark's RDD (Resilient Distributed Dataset) keeps data **in memory** between operations, cutting iterative-job runtime 10–100×.

## Architecture (essentials)

- **Driver** — runs main, schedules tasks.
- **Cluster manager** (YARN, K8s, Mesos, standalone) — provides executors.
- **Executors** — JVM processes running tasks; cache RDDs in memory.
- **DAG scheduler** — Catalyst optimizer produces a stage DAG; tasks within a stage run in parallel.
- **Shuffle** — data exchange between stages (hash-partition by key).

## APIs

| API | Year | Note |
|---|---|---|
| RDD | 2010 | Low-level, functional |
| DataFrame | 2015 | SQL-like; Catalyst optimizer |
| Dataset (typed) | 2016 | Type-safe DataFrames in Scala/Java |
| Structured Streaming | 2016 | Streaming-as-incremental-batch |
| MLlib | 2014 | Distributed ML |
| GraphX | 2014 | Graph analytics |
| Spark SQL | 2014 | SQL on Spark |

## Why Adoption Exploded

- **10–100× faster than MapReduce** on iterative workloads.
- **Unified API** for batch + streaming + ML + SQL.
- **Easy to write** (Scala / Python / SQL) vs Java MapReduce.
- **Catalyst** query optimizer + Tungsten code generation = near-hand-tuned performance.

## Streaming

- **DStreams** (legacy): micro-batches every N seconds.
- **Structured Streaming** (modern): continuous query over an unbounded DataFrame; output to sinks (Kafka, Delta).
- Lower latency-per-record than Flink but easier programming model for SQL teams.

## Lakehouse / Delta

- Databricks built **Delta Lake** atop Spark — ACID tables on object storage.
- Drove the [[Lakehouse]] architecture (Databricks paper 2021).

## Where Spark Hurts

- **Latency**: micro-batch (Structured Streaming) is seconds, not sub-second; [[Apache Flink]] preferred for low-latency.
- **Memory tuning** is intricate (executor memory fractions, shuffle).
- **Cost**: in-memory cluster more expensive than disk-heavy MapReduce per byte processed.
- **Small jobs** overhead — Spark startup alone is seconds.

## Real Production

- **Databricks** — managed Spark + Delta.
- **Netflix, Uber, Airbnb, Apple** — Spark at exabyte scale.
- **Snowflake** added Spark-compatible APIs.
- Largest known: Apple, Facebook.

## Lessons

- In-memory caching + lazy evaluation + DAG optimization yields orders-of-magnitude wins over MapReduce.
- Unified APIs (batch + stream + SQL) reduce pipeline complexity dramatically.
- A great optimizer (Catalyst) lets users write naive code with great performance.
- Spark's success spawned an ecosystem ([[Lakehouse]], Delta, dbt-on-Spark).

## Related Concepts

- [[Batch Processing]] — primary use.
- [[MapReduce]] — predecessor.
- [[Apache Flink]] — streaming competitor.
- [[Stream Processing]] / [[Stream Windowing]] — streaming concepts.
- [[Lakehouse]] — architecture Spark enabled.

## Active Recall Questions

What is an RDD?::Resilient Distributed Dataset — the original Spark abstraction; an immutable, partitioned dataset with lineage information allowing automatic recomputation on failure.

Why is Spark ~100× faster than MapReduce on iterative workloads?::Spark caches intermediate RDDs in executor memory; MapReduce writes every intermediate to HDFS, forcing disk round-trips per iteration.

What is Catalyst?::Spark SQL's query optimizer — applies rule-based + cost-based optimizations to DataFrame/Dataset operations before execution, producing efficient physical plans.

What is Structured Streaming?::Modern Spark streaming API treating an unbounded stream as an incrementally updated DataFrame; query semantics identical to batch; sinks include Kafka, files, Delta tables.

Why is Spark less suited than Flink for low-latency streaming?::Spark uses micro-batches (smallest viable ~100 ms); Flink processes records individually with sub-100µs latency potential.

What did Databricks build on top of Spark?::Delta Lake (ACID tables on object storage) and the Lakehouse architecture combining warehouse and lake.

What's the cluster manager's role?::Provides executors (compute resources) to the Spark driver; can be YARN (Hadoop), Kubernetes, Mesos, or Spark's standalone manager.

## Feynman Test

Explain to a MapReduce engineer why Spark's word count is ~50 lines of clean code vs MapReduce's verbose Java — what concretely changed in the abstraction?

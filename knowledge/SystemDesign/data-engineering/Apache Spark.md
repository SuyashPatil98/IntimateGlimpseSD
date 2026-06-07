---
title: Apache Spark
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Batch Processing]]", "[[MapReduce]]"]
related: ["[[Batch Processing]]", "[[MapReduce]]", "[[Stream Processing]]"]
sources:
  - Zaharia et al. (Spark papers)
  - Data Engineering Cookbook
tags: [data-engineering, spark, batch]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Apache Spark

## Executive Summary

**Apache Spark** (originated UC Berkeley AMPLab, 2009; open-source 2010) is the **dominant unified analytics engine for large-scale data processing**. Built on the **RDD (Resilient Distributed Dataset)** abstraction — distributed collections with lineage-based fault tolerance. Provides **batch (Spark SQL, DataFrames), streaming (Structured Streaming), ML (MLlib), graph (GraphX)** in one engine. Replaces direct [[MapReduce]] use for nearly all modern workloads. **In-memory** computation is 10–100× faster than MapReduce for iterative algorithms.

## Why This Exists

MapReduce was rigid (only Map+Reduce), disk-heavy (slow between stages), verbose. Spark generalized: arbitrary DAGs of operations, in-memory caching, richer operators (joins, filters, aggregations). Result: a unified engine for batch + stream + ML.

## Core Intuition

MapReduce: assembly line with two stations (Map, Reduce), each writing to disk between. Spark: an assembly line with arbitrary stations, work-in-progress held in RAM, automatically parallelized.

## Internal Mechanics

**RDDs (foundational):**
- Distributed, immutable collections.
- Operations: transformations (map, filter, join) and actions (count, collect).
- Lazy — execution deferred until action.
- Lineage tracks how RDD was computed → fault tolerance by re-computation.

**DataFrames / Datasets:**
- Higher-level APIs (SQL-like).
- Catalyst optimizer optimizes queries.
- Tungsten — efficient memory + CPU usage.

**Execution:**
- Driver — coordinator.
- Executors — workers across cluster.
- DAG scheduler — splits job into stages.
- Stages run in parallel; shuffle between.

**Storage:**
- Read from HDFS, S3, JDBC, Kafka, Parquet, etc.

## Modules

- **Spark Core / RDD** — base.
- **Spark SQL** — DataFrames, SQL.
- **Spark Streaming / Structured Streaming** — stream processing.
- **MLlib** — machine learning.
- **GraphX** — graph processing.

## Real Production Examples

- **Most big-data workloads** today use Spark.
- **Databricks** — Spark commercialization, deeply integrated.
- **Major companies** — Netflix, Uber, Pinterest, Airbnb.
- **Cloud platforms** — EMR (AWS), Dataproc (GCP), HDInsight (Azure).

## Design Tradeoffs

**Benefits:**
- Fast (in-memory).
- Unified (batch + stream + ML).
- Rich operators.
- Mature ecosystem.

**Costs:**
- Resource-hungry.
- Operational complexity.
- JVM-based (some overhead).
- Streaming model evolving (Structured Streaming improvements).

## Interview Perspective

**Common questions:**
- "What's Spark?" → Distributed analytics engine. Unified batch + stream + ML.
- "RDD?" → Resilient Distributed Dataset. Immutable, distributed, lineage-tracked.
- "Spark vs MapReduce?" → Spark in-memory, richer ops, faster, easier.

**Senior-level:**
- DataFrames preferred over RDDs — Catalyst optimizer is huge win.
- Structured Streaming unifies batch and streaming semantically.
- Spark + Delta Lake / Iceberg = modern lakehouse.

**Common mistakes:**
- Using RDDs when DataFrames suffice.
- Forgetting laziness — confusing debug.
- Excessive shuffles (bad joins).

## Related Concepts

- [[Batch Processing]] · [[MapReduce]] · [[Stream Processing]] · [[Data Lake]] · [[Lakehouse]]

## Misconceptions

- **"Spark = MapReduce++."** Different model; richer DAG.
- **"Spark eliminates Hadoop."** Often runs on HDFS / YARN.

## Failure Scenarios

- **OOM** from collect on huge dataset.
- **Excessive shuffle** kills performance.
- **Skewed key** in groupBy.

## Practical Engineering Heuristics

- **DataFrames over RDDs.**
- **Avoid collect() on large data.**
- **Partition carefully.**
- **Cache hot data in memory.**

## Active Recall Questions

What's Spark?::Distributed analytics engine. Unified batch, stream, ML, graph. Successor to MapReduce.

What's an RDD?::Resilient Distributed Dataset. Immutable, distributed collection with lineage-based fault tolerance.

Spark vs MapReduce?::Spark in-memory, richer DAG of operations, much faster for iterative work, easier APIs.

Catalyst optimizer?::Spark SQL's query optimizer. Why DataFrames preferred over raw RDDs.

Common shuffle cost mistake?::Operations like groupBy on a skewed key cause uneven partitions; one task drags whole job.

What's the modern lakehouse story?::Spark + Delta Lake / Iceberg / Hudi over object storage = transactional analytics on cheap storage.

## Feynman Test

Word count with Spark DataFrames. Compare to MapReduce.

Why does Spark's in-memory model dramatically speed up ML training?

## Mastery Checklist

- **Explain** Spark architecture.
- **Compare** with MapReduce.
- **Derive** when to use Spark.
- **Critique** RDDs where DataFrames fit.
- **Design** Spark job with proper partitioning.

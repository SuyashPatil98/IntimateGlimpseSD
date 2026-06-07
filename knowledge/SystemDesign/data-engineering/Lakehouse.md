---
title: Lakehouse
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Data Lake]]", "[[Data Warehouse]]"]
related: ["[[Data Lake]]", "[[Data Warehouse]]", "[[Apache Spark]]"]
sources:
  - Databricks (origin of term)
  - 'Lakehouse: A New Generation of Open Platforms paper (2021)'
tags: [data-engineering, lakehouse, modern]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Lakehouse

## Executive Summary

A **lakehouse** combines **data lake flexibility (cheap storage, any data, open formats)** with **data warehouse reliability (ACID transactions, schema enforcement, performance)**. Originated as Databricks' positioning (~2020); now widespread. Implemented via **open table formats**: **Delta Lake** (Databricks), **Apache Iceberg** (Netflix, AWS), **Apache Hudi** (Uber). Stores Parquet files on object storage + a transaction log providing ACID semantics. The convergence of the lake/warehouse divide.

## Why This Exists

Lakes had flexibility but no ACID, no concurrent updates, no schema enforcement. Warehouses had reliability but expensive, rigid, vendor-locked. Lakehouse: get both. Files are open (Parquet); transactions managed by a log layer; engines like Spark, Trino, Snowflake, BigQuery can read.

## Core Intuition

The lake gave you a cheap warehouse with bad organization. The warehouse gave you organization with expensive storage. Lakehouse: cheap storage + organization layer on top. Best of both.

## Internal Mechanics

**Storage:** Parquet files on S3 / ADLS / GCS.

**Transaction log:** records all changes (Delta Lake `_delta_log`, Iceberg manifest, Hudi timeline). Provides:
- **ACID transactions** — atomic commits.
- **Schema evolution** — add/drop columns safely.
- **Time travel** — query past snapshots.
- **Concurrent writes** — coordinated via log.

**Engines:** Spark, Trino, Presto, Snowflake (with external tables), BigQuery — all can read the open format.

## The Three Table Formats

**Delta Lake (Databricks):**
- First mover.
- Best Databricks integration.
- Open-sourced 2019.

**Apache Iceberg (Netflix, now widely adopted):**
- Most open ecosystem.
- AWS, Snowflake, Cloudera, others integrate.
- Hidden partitioning, schema evolution.

**Apache Hudi (Uber):**
- Strong upsert/CDC support.
- Streaming-friendly.

Convergence: all three add similar features over time.

## Real Production Examples

- **Databricks** — Delta-centric.
- **Netflix** — Iceberg-centric.
- **Snowflake** — supports Iceberg.
- **AWS Glue, EMR** — all three supported.

## Design Tradeoffs

**Benefits:**
- ACID over object storage.
- Open formats — multi-engine.
- Cost (object storage) + reliability (warehouse-like).
- Time travel.

**Costs:**
- Compaction needs.
- Format choice / migration.
- Operational learning curve.

## Interview Perspective

**Common questions:**
- "What's a lakehouse?" → ACID + schema + performance on cheap object storage. Combines lake + warehouse benefits.
- "Three formats?" → Delta Lake, Iceberg, Hudi.
- "Why this matters?" → Eliminates lake-vs-warehouse divide.

**Senior-level:**
- Iceberg is winning the format wars due to openness; Delta is closing.
- Hudi has the best streaming/upsert story but smaller ecosystem.
- Modern data architecture converges on lakehouse + Spark/Trino + dbt.

**Common mistakes:**
- Treating lakehouse as marketing.
- Choosing format without considering ecosystem.
- Ignoring compaction operations.

## Related Concepts

- [[Data Lake]] · [[Data Warehouse]] · [[Apache Spark]]

## Misconceptions

- **"Lakehouse = lake."** Lake + transaction log + schema = different.
- **"Lakehouse replaces warehouse."** Convergence — warehouses adopt lakehouse features too.

## Failure Scenarios

- **No compaction** → many small files → slow.
- **Schema drift** despite format.

## Practical Engineering Heuristics

- **Lakehouse default for new analytics.**
- **Iceberg if multi-engine.**
- **Delta if Databricks-centric.**
- **Schedule compaction.**

## Active Recall Questions

What's a lakehouse?::Architecture combining lake (cheap object storage, open formats) with warehouse (ACID, schema, performance).

Three table formats?::Delta Lake (Databricks), Apache Iceberg (Netflix), Apache Hudi (Uber).

What's the transaction log for?::ACID transactions, schema evolution, time travel, concurrent writes coordinated.

Time travel?::Query past snapshots of the table. Built-in for all three formats.

Why is Iceberg gaining ground?::Most open ecosystem; widely supported by AWS, Snowflake, Cloudera.

Modern lakehouse stack?::Object storage + Parquet + Iceberg/Delta/Hudi + Spark/Trino + dbt.

## Feynman Test

Migrate a swamp-like lake to a lakehouse. What changes?

Why does the "open table format" matter strategically?

## Mastery Checklist

- **Explain** lakehouse.
- **Compare** with lake and warehouse.
- **Derive** which format fits.
- **Critique** ungoverned lakes.
- **Design** lakehouse architecture for new analytics.

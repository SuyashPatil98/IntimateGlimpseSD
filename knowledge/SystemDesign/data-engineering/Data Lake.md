---
title: Data Lake
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Data Warehouse]]", "[[Lakehouse]]", "[[Object Storage]]"]
sources:
  - Data Engineering Cookbook
  - DDIA
tags: [data-engineering, lake, storage]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Data Lake

## Executive Summary

A **data lake** is a **repository of raw data in its native format**, typically in object storage (S3, ADLS, GCS), with schema applied at read time. Originated as the alternative to rigid data warehouses: store everything; figure out structure later. Sweet spot for **ML training data, raw logs, unstructured data (images, video), data exploration**. Risks: **swamp** without governance. Modern evolution: **[[Lakehouse]]** combines lake's flexibility with warehouse's reliability.

## Why This Exists

Data warehouses require schema-on-write — define structure before loading. Many sources (logs, JSON, images, videos) don't fit cleanly. Lakes: dump raw data; query later. Storage cost (cheap object storage) is negligible; flexibility wins.

## Core Intuition

A warehouse-store difference. Warehouse: pre-sorted, labeled aisles. Lake: huge open warehouse where things are dumped in original packaging. Searching is harder but you can keep more.

## Internal Mechanics

**Architecture:**
- **Storage:** object storage (S3, GCS, ADLS).
- **Files:** Parquet, ORC (columnar), Avro, JSON, CSV.
- **Schema:** applied at read time (schema-on-read).
- **Query:** Presto, Athena, Spark, Hive.
- **Catalog:** metadata registry (Hive Metastore, Glue, Unity Catalog).

**Storage tiers:**
- Hot (frequently accessed).
- Warm.
- Cold (cheaper, slower).

## Lake vs Warehouse

| Aspect | Lake | Warehouse |
|---|---|---|
| Schema | At read | At write |
| Data types | Anything | Structured |
| Cost | Low (object storage) | Higher (managed compute) |
| Query speed | Slower | Fast |
| Use | ML, exploration, raw retention | BI, dashboards |
| Governance | Hard | Easier |

## The Swamp Problem

Without governance, lakes become **swamps** — undocumented files, unknown owners, no quality. Modern solutions:
- **Catalogs** (Unity Catalog, Glue) tracking datasets.
- **Quality tooling** (Great Expectations).
- **Lakehouse** patterns enforce structure on top.

## Real Production Examples

- **AWS S3 + Glue + Athena.**
- **Azure Data Lake Storage + Synapse.**
- **GCS + BigLake.**
- **On-prem HDFS** (legacy).

## Design Tradeoffs

**Benefits:**
- Cheap storage.
- Flexible (any data type).
- Retain raw for re-derivation.
- ML training friendly.

**Costs:**
- Without governance → swamp.
- Query speed inferior to warehouse.
- Schema discipline harder.

## Interview Perspective

**Common questions:**
- "Lake vs Warehouse?" → Lake: raw, schema-on-read. Warehouse: structured, schema-on-write.
- "Swamp?" → Ungoverned lake; no documentation, ownership, quality.
- "Modern alternative?" → Lakehouse — lake's flexibility with warehouse's reliability (Delta Lake, Iceberg, Hudi).

**Senior-level:**
- Lakes were oversold in 2010s. Most became swamps.
- Lakehouse pattern (Delta + Spark) is converging answer.
- Object storage + Parquet is the modern foundation.

**Common mistakes:**
- Lake without catalog.
- Lake for traditional BI (warehouse better).
- No data quality enforcement.

## Related Concepts

- [[Data Warehouse]] · [[Lakehouse]] · [[Object Storage]]

## Misconceptions

- **"Lake replaces warehouse."** Coexist; different sweet spots.
- **"Lake = S3."** S3 is storage; lake is the architectural pattern.

## Failure Scenarios

- **Data swamp** — uncatalogued, unknown data.
- **Quality issues** — bad data accumulates.
- **Slow queries** without partitioning.

## Practical Engineering Heuristics

- **Catalog from day 1.**
- **Parquet + partitioning** for query performance.
- **Modern: use Lakehouse (Delta Lake / Iceberg).**
- **Lifecycle policies** for cold data.

## Active Recall Questions

What's a data lake?::Repository of raw data in native format. Object storage; schema-on-read.

Lake vs Warehouse?::Lake: raw, schema-on-read, cheap, flexible. Warehouse: structured, schema-on-write, fast queries, more cost.

What's a data swamp?::Ungoverned lake — undocumented, unowned, unknown quality. Common failure mode.

Modern lake foundation?::Object storage (S3, GCS, ADLS) + Parquet/ORC columnar format + catalog.

What's the lakehouse?::Modern evolution combining lake's flexibility with warehouse's reliability. Delta Lake, Iceberg, Hudi.

Common query engines?::Presto/Trino, Athena, Spark, Hive.

## Feynman Test

Design a data lake for ML training data on raw images + logs. What's the architecture?

Why did so many 2010s data lake initiatives become swamps?

## Mastery Checklist

- **Explain** data lake.
- **Compare** with warehouse.
- **Derive** when lake fits.
- **Critique** ungoverned lakes.
- **Design** lake with proper catalog and governance.

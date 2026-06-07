---
title: Data Warehouse
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[OLTP vs OLAP]]"]
related: ["[[Data Lake]]", "[[Lakehouse]]", "[[Dimensional Modeling]]", "[[Star Schema]]", "[[Columnar Storage]]"]
sources:
  - Bill Inmon (DW pioneer)
  - Ralph Kimball
  - Data Engineering Cookbook
tags: [data-engineering, warehouse, olap]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Data Warehouse

## Executive Summary

A **data warehouse** is a **purpose-built analytical database storing structured, integrated data from multiple sources for reporting and analysis**. Schema-on-write (structured up front), columnar storage, optimized for complex SQL queries on historical data. Modern cloud warehouses — **Snowflake, BigQuery, Redshift** — separate compute from storage, scale elastically. Traditionally contrasted with **operational databases** (OLTP) and **data lakes** (schema-on-read). Foundation of BI, analytics, executive dashboards.

## Why This Exists

Operational DBs are optimized for transactions: many small reads/writes, row-oriented, normalized. Analytics need: scan huge tables, aggregate across rows, denormalized for query speed. Warehouses purpose-built for this. Modern cloud warehouses additionally separate compute from storage, charging only for what's used.

## Core Intuition

A library's archives. Live books circulate (operational DB); old books in archives are indexed for research (warehouse). Different organization; different access patterns.

## Internal Mechanics

**Architecture:**
- **Columnar storage** — see [[Columnar Storage]].
- **Schema** — typically [[Star Schema]] or snowflake.
- **Compute** — distributed, query-parallel.
- **Loaded via** ETL or ELT from operational sources.

**Modern cloud warehouses:**
- Separate compute and storage.
- Auto-scaling.
- Pay-per-query or pay-per-second.
- SQL native.
- Often integrate with object storage (S3, GCS).

**Workloads:**
- BI dashboards.
- Ad-hoc analytics.
- ML feature engineering.
- Regulatory reporting.

## The Two Schools

**Inmon (top-down):**
- Enterprise data warehouse (EDW) first, integrated and normalized (3NF).
- Departmental data marts derived from EDW.

**Kimball (bottom-up):**
- Build data marts directly using dimensional modeling.
- Conformed dimensions across marts.

Most modern: Kimball-flavored star schemas.

## Real Production Examples

- **Snowflake** — leading cloud warehouse.
- **Google BigQuery** — managed, serverless.
- **AWS Redshift** — Amazon's.
- **Databricks SQL** — lakehouse-flavored.
- **Teradata, Oracle Exadata** — legacy enterprise.

## Design Tradeoffs

**Benefits:**
- Optimized analytics.
- Familiar SQL.
- Integrated history.
- Strong tooling ecosystem (BI tools).

**Costs:**
- Schema-on-write (rigid for new data).
- ETL/ELT pipelines required.
- Cost (especially compute on hot queries).

## Real Production Examples

- **Every Fortune 500** has a warehouse.
- **dbt** — modern SQL-based transformation tool, warehouse-native.
- **Most BI stacks** terminate at warehouse.

## Interview Perspective

**Common questions:**
- "What's a data warehouse?" → Analytical DB for reporting; columnar; star schema; SQL.
- "Warehouse vs lake?" → Warehouse: structured, schema-on-write. Lake: raw, schema-on-read.
- "Modern cloud warehouses?" → Snowflake, BigQuery, Redshift. Separate compute + storage; elastic.

**Senior-level:**
- Snowflake's separation of compute and storage transformed the market.
- dbt + cloud warehouse + Fivetran/Airbyte = modern data stack.
- Kimball's dimensional modeling still dominant despite predictions.

**Common mistakes:**
- Warehouse for operational workloads.
- No dimensional modeling → confused star schemas.

## Related Concepts

- [[Data Lake]] · [[Lakehouse]] · [[Dimensional Modeling]] · [[Star Schema]] · [[Columnar Storage]] · [[OLTP vs OLAP]] · [[ETL vs ELT]]

## Misconceptions

- **"Warehouse = SQL database."** Optimized differently; columnar; massive parallel.
- **"Warehouse is dying."** Lakehouse coexists; warehouse still dominant.

## Failure Scenarios

- **Slow queries** without proper indexing/partitioning.
- **Cost explosion** without query optimization.
- **Schema chaos** without modeling discipline.

## Practical Engineering Heuristics

- **Default to Snowflake / BigQuery / Redshift for cloud analytics.**
- **dbt for transformations.**
- **Star schema for marts.**
- **Monitor query costs.**

## Active Recall Questions

What's a data warehouse?::Analytical DB for reporting and analysis. Structured, columnar, SQL-native, optimized for OLAP.

Warehouse vs operational DB?::Warehouse: analytical (columnar, denormalized, OLAP). Operational: transactional (row-oriented, normalized, OLTP).

Modern cloud warehouses?::Snowflake, BigQuery, Redshift, Databricks SQL.

What transformed the market?::Separation of compute and storage (Snowflake pioneered). Elastic scaling; pay-per-use.

Inmon vs Kimball?::Inmon: top-down, integrated EDW first. Kimball: bottom-up, dimensional data marts. Most modern shops: Kimball-flavored.

Modern data stack?::Ingestion (Fivetran/Airbyte) → warehouse (Snowflake/BigQuery) → transformation (dbt) → BI (Looker/Tableau).

## Feynman Test

Design a warehouse for an e-commerce company. Schema? Tools?

Why did Snowflake's "separate compute and storage" reshape the market?

## Mastery Checklist

- **Explain** data warehouse.
- **Compare** with operational DB and data lake.
- **Derive** when warehouse is appropriate.
- **Critique** OLTP/OLAP mixing.
- **Design** warehouse architecture with modern stack.

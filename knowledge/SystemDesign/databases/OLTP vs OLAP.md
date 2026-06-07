---
title: OLTP vs OLAP
area: databases
status: mature
difficulty: beginner
prerequisites: ["[[Relational Databases]]"]
related: ["[[Columnar Storage]]", "[[Data Warehouse]]", "[[Materialized Views]]"]
sources:
  - DDIA, Ch. 3 (pp. 90–95)
tags: [databases, oltp, olap, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# OLTP vs OLAP

## Executive Summary

**OLTP (Online Transaction Processing)** and **OLAP (Online Analytical Processing)** describe two fundamentally different database workload types. **OLTP**: many small, low-latency operations — reads/writes affecting a few rows; powers user-facing apps. **OLAP**: few large, complex queries — scanning millions of rows for aggregates and reports. They favor different storage layouts (row vs columnar), indexes, and even hardware. Modern stacks separate them: OLTP in PostgreSQL/MySQL, OLAP in data warehouses (Snowflake, BigQuery, Redshift, ClickHouse). Mixing them in one system rarely works at scale.

## Why This Exists

A bank's transaction system needs sub-millisecond writes for ATM withdrawals (OLTP). The same bank's BI team needs queries like "total withdrawals per branch per month" scanning years of data (OLAP). These workloads have opposite requirements: OLTP optimizes for many small row-level operations; OLAP optimizes for scanning huge columnar ranges. Pretending one system handles both well leads to either OLTP slowness or OLAP impracticality.

## Core Intuition

OLTP is point work — many cashiers ringing up small transactions. OLAP is aggregate work — one accountant tallying monthly totals. Different staffing, different tools, different optimization. A grocery store with one machine for both falls behind on both.

## The Two Workloads

| Property | OLTP | OLAP |
|---|---|---|
| Query pattern | Small, by key | Large, aggregate |
| Latency | Milliseconds | Seconds to minutes |
| Concurrency | High (many users) | Lower (analysts) |
| Reads per query | Few rows | Millions of rows |
| Writes | Frequent, small | Bulk loads, infrequent |
| Storage | Row-oriented | Columnar |
| Index | B-tree on keys | Bitmap, columnar |
| Workload | Live application | BI, reporting |
| Example systems | PostgreSQL, MySQL | Snowflake, BigQuery, ClickHouse |
| Data freshness | Real-time | Often hours-stale |

## Storage Implications

**OLTP (row-oriented):**
- Rows stored contiguously.
- Reading a row touches one page.
- Writing/updating efficient.
- Bad for scanning few columns of many rows.

**OLAP ([[Columnar Storage|columnar]]):**
- Columns stored contiguously.
- Scanning a column touches few pages.
- Compression dramatic (similar values together).
- Bad for fetching whole rows.

## Real Production Examples

- **OLTP:** PostgreSQL, MySQL, SQL Server, MongoDB, DynamoDB.
- **OLAP:** Snowflake, BigQuery, AWS Redshift, ClickHouse, Apache Druid, Vertica.
- **Hybrid (HTAP):** SingleStore, TiDB, Hyper, SAP HANA — try to do both. Niche.
- **Lakehouse:** Databricks, Iceberg, Delta Lake — OLAP on cheap storage.

## Interview Perspective

**Common questions:**
- "OLTP vs OLAP?" → OLTP: small fast transactions on live data. OLAP: large analytical queries on historical data.
- "Why columnar for OLAP?" → Analytical queries scan few columns of many rows; columnar layout reads only needed columns + compresses well.
- "How do you serve both?" → Two systems: OLTP for live, replicate to OLAP for analytics. CDC or ETL pipeline.

**Senior-level:**
- The OLTP/OLAP split drives modern data architectures. Live data in Postgres; replicated to Snowflake via CDC; BI tools query Snowflake.
- HTAP systems try to unify but rarely match specialized systems at extreme scale.
- Lakehouse (open columnar formats on object storage) is the modern open-source OLAP direction.

**Common mistakes:**
- Running analytics queries on OLTP database — slow + degrades production.
- Replicating OLTP-style schema directly to OLAP — usually want dimensional modeling.
- Treating "real-time analytics" as easy — usually requires careful pipeline design.

## Related Concepts

- [[Columnar Storage]] — OLAP storage layout.
- [[Data Warehouse]] · [[Data Lake]] · [[Lakehouse]] — OLAP architectures.
- [[Materialized Views]] — bridge between live + analytical.

## Misconceptions

- **"One database for both."** Possible at small scale; impractical past significant data volume.
- **"OLAP is for executives."** Modern OLAP serves user-facing analytics dashboards too.
- **"OLAP is slower."** Per-query yes; throughput on aggregate scans much higher than OLTP could match.

## Failure Scenarios

- **Analytics on OLTP** → production slows during reports.
- **Stale data warehouse** — analytics SLA missed.
- **Pipeline failures** silently — analytics show wrong numbers.

## Practical Engineering Heuristics

- **Separate OLTP from OLAP** at any meaningful scale.
- **Replicate via CDC or ETL** to keep OLAP fresh.
- **Use dimensional modeling** in OLAP (star schema).
- **For real-time OLAP, look at ClickHouse, Apache Druid, Pinot.**

## Active Recall Questions

What's OLTP?::Online Transaction Processing. Small fast operations; user-facing apps. Row-oriented; B-tree indexes; row-touching reads/writes.

What's OLAP?::Online Analytical Processing. Large analytical queries; aggregates over millions of rows; reporting and BI.

Why columnar for OLAP?::Analytical queries scan few columns of many rows. Columnar reads only needed columns; compresses dramatically.

Why separate OLTP and OLAP?::Different workload requirements; one system can't optimize for both at scale. Mixing degrades both.

Name three OLAP systems.::Snowflake, BigQuery, Redshift, ClickHouse, Apache Druid, Vertica.

What's HTAP?::Hybrid Transactional/Analytical Processing — one system trying to serve both. Niche but useful at small/medium scale.

How is data moved from OLTP to OLAP?::CDC (Change Data Capture) streams or ETL/ELT pipelines.

## Feynman Test

Why does running analytics on your OLTP database eventually become untenable?

Explain why columnar storage is so much better for OLAP than row-oriented.

## Mastery Checklist

- **Explain** OLTP and OLAP workloads.
- **Compare** their storage and indexing implications.
- **Derive** which system fits a given query pattern.
- **Critique** designs running analytics on production OLTP.
- **Design** a data pipeline replicating OLTP to OLAP.

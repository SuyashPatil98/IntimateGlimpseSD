---
title: Columnar Storage
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[OLTP vs OLAP]]"]
related: ["[[OLTP vs OLAP]]", "[[Data Warehouse]]"]
sources:
  - DDIA, Ch. 3 (pp. 95–101)
tags: [databases, columnar, olap]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Columnar Storage

## Executive Summary

Columnar storage stores **table data column-by-column rather than row-by-row** — making analytical queries that touch few columns over many rows dramatically faster. Combined with **aggressive compression** (similar values cluster), **vectorized execution**, and **column-level statistics**, columnar engines achieve 10-100× speedup over row-oriented for OLAP workloads. Used by every modern data warehouse: **Snowflake, BigQuery, Redshift, ClickHouse, Vertica, DuckDB, Parquet files**. The price: row-by-row access (typical OLTP) is much slower than row-oriented storage.

## Why This Exists

Analytical queries typically scan many rows but few columns: `SELECT region, SUM(sales) FROM transactions WHERE year=2024 GROUP BY region`. In a row store, every row is read end-to-end — even unused columns. In a column store, only `region`, `sales`, `year` columns are read. For wide tables (100+ columns) this is a 100× I/O reduction.

## Core Intuition

A spreadsheet with 100 columns. You want to sum one column. Row-oriented: read every row (all 100 columns) and pull out the one. Column-oriented: read just the column you need; skip the other 99.

## Internal Mechanics

**Layout:**
- Each column is a separate file (or contiguous region).
- Rows are reconstructed by position: row N of each column.

**Compression:**
- Adjacent values in a column are similar → high compression.
- Techniques: run-length encoding (RLE), dictionary encoding, bit-packing, delta encoding.
- Compression ratios of 5-30× common.

**Vectorized execution:**
- Operations applied to batches of values (e.g., 1024 at a time) rather than row-at-a-time.
- Exploits SIMD, CPU cache, branch prediction.
- 10-100× speedup over row-at-a-time.

**Late materialization:**
- Operations on encoded/compressed columns.
- Decompress only when necessary.

**Column-level statistics:**
- Min/max per chunk → skip entire chunks if filter doesn't match.
- Bloom filters per chunk.

## Real Production Examples

- **Snowflake, BigQuery, Redshift** — columnar warehouses.
- **ClickHouse** — open-source, very fast, columnar.
- **Apache Parquet** — open columnar file format; underlies Spark, Iceberg, Delta Lake.
- **Apache ORC** — Hadoop-ecosystem columnar format.
- **Vertica, DuckDB** — embedded and analytical columnar.
- **Cassandra (per-column families)** — wide-column ≠ columnar but related.

## Design Tradeoffs

**Benefits:**
- Massive read speedup for analytical queries.
- Dramatic compression.
- Vectorized execution.
- Predicate pushdown via chunk-level stats.

**Costs:**
- Single-row reads are slow.
- Single-row writes are expensive (must update many column files).
- Updates expensive — typically batched.
- Less suitable for transactional workloads.

## Interview Perspective

**Common questions:**
- "Columnar vs row-oriented?" → Columnar wins for analytics scanning few columns of many rows. Row-oriented wins for OLTP touching whole rows.
- "Why does columnar compress better?" → Adjacent values in a column are similar (same type, often similar values). RLE, dictionary, bit-packing all exploit this.
- "What's vectorized execution?" → Process batches of values at once instead of row-at-a-time. Exploits CPU SIMD and cache.

**Senior-level:**
- The combination of columnar + vectorization + compression is what makes modern data warehouses orders of magnitude faster than 2000s-era systems.
- Parquet has become the de facto open columnar format — basis of lakehouse architectures.
- Hybrid systems try both layouts (row + column); operationally complex.

**Common mistakes:**
- Using columnar for transactional workloads → terrible write/read latency.
- Underestimating compression — sizing storage assuming row-equivalent.
- Forgetting that updates are batch-friendly, not row-by-row.

## Related Concepts

- [[OLTP vs OLAP]] — columnar is OLAP territory.
- [[Data Warehouse]] · [[Data Lake]] · [[Lakehouse]] — built on columnar.

## Misconceptions

- **"Columnar = wide-column."** Different. Wide-column (Cassandra) is row-oriented at heart. Columnar (Parquet, Snowflake) stores columns separately.
- **"Columnar is always faster."** Faster for analytics; slower for transactional point operations.
- **"Compression slows queries."** Modern engines run queries on compressed data; decompression is on-demand.

## Failure Scenarios

- **Row-by-row writes** to a columnar store → catastrophic. Batch.
- **Single-row reads** are slow — wrong tool.
- **Schema evolution** in columnar files is restricted.

## Practical Engineering Heuristics

- **Use columnar (Parquet, Snowflake) for analytics.**
- **Use row-oriented (Postgres, MySQL) for OLTP.**
- **Replicate from OLTP to columnar via CDC** for analytics.
- **Batch loads** into columnar systems.

## Active Recall Questions

What is columnar storage?::Table data stored column-by-column rather than row-by-row. Optimized for analytical queries scanning few columns of many rows.

Why does columnar compress better?::Adjacent values in a column are similar. RLE, dictionary encoding, bit-packing all exploit this similarity.

What's vectorized execution?::Processing batches of values at once (e.g., 1024 at a time) instead of row-at-a-time. Exploits SIMD and CPU cache.

When is columnar the wrong choice?::Transactional workloads with row-by-row reads/writes. Use row-oriented for OLTP.

Name three columnar systems.::Snowflake, BigQuery, Redshift, ClickHouse, Parquet, Vertica, DuckDB.

What's Apache Parquet?::Open columnar file format. Basis of Spark, Iceberg, Delta Lake, modern lakehouses.

## Feynman Test

Walk through `SELECT SUM(sales) FROM transactions` for a table with 100 columns and a billion rows. Where do row-oriented and columnar diverge?

Why is columnar storage the heart of modern data warehouses?

## Mastery Checklist

- **Explain** columnar storage and its advantages.
- **Compare** with row-oriented.
- **Derive** speedup for typical OLAP queries.
- **Critique** using columnar for OLTP workloads.
- **Design** a stack with OLTP + columnar OLAP.

---
title: ETL vs ELT
area: data-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Data Warehouse]]", "[[Data Lake]]", "[[Batch Processing]]"]
sources:
  - Data Engineering Cookbook
  - Kimball, "The Data Warehouse Toolkit"
tags: [data-engineering, etl, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# ETL vs ELT

## Executive Summary

**ETL (Extract-Transform-Load)** transforms data **before loading into target**; **ELT (Extract-Load-Transform)** loads raw data first, transforms **inside the target system**. ETL was the historical pattern (data warehouses with expensive storage); ELT dominates modern cloud data warehouses (Snowflake, BigQuery, Redshift) where storage is cheap and the warehouse has powerful compute. Same data movement; different placement of transformation.

## Why This Exists

Traditional warehouses couldn't handle raw, dirty data — required cleaning before load. Modern warehouses (cloud-native, compute on demand) prefer raw loads: keep original; transform in SQL inside the warehouse. Flexibility, replay-ability, less upfront work.

## Core Intuition

ETL: chef preps ingredients in the kitchen before plating. ELT: ingredients dumped on the table; cooking happens at the table. Modern dining (warehouses): on-table cooking is faster and lets you re-cook for different audiences.

## The Two Approaches

**ETL:**
1. **Extract** from source.
2. **Transform** outside target (separate processing).
3. **Load** transformed data into target.

**ELT:**
1. **Extract** from source.
2. **Load** raw data into target.
3. **Transform** inside the target system (SQL).

## Comparison Table

| Aspect | ETL | ELT |
|---|---|---|
| Transformation location | Outside target | Inside target |
| Target type | Traditional DW (expensive storage) | Cloud DW (cheap storage, scalable compute) |
| Raw data retained | No | Yes |
| Re-transformation | Hard | Easy (just re-run SQL) |
| Tools | Informatica, Talend, SSIS | dbt, Snowflake SQL, BigQuery SQL |
| Best for | Legacy / small target | Cloud-native, exploratory analytics |

## Modern Practice

**ELT dominates** because:
- Cloud warehouses have massive compute on demand.
- Storage is cheap (S3 etc.).
- Raw data preserved → can re-derive answers later.
- SQL transformations easier to maintain than ETL pipelines.
- **dbt** has made ELT mainstream.

## Real Production Examples

- **Modern data stacks** — Fivetran → Snowflake → dbt → BI tools.
- **Legacy enterprise** — still on ETL (Informatica, SSIS).
- **AWS Glue, Azure Data Factory** — both ETL and ELT support.

## Design Tradeoffs

**ETL:**
- ✓ Lighter target storage.
- ✓ Clean data in target.
- ✗ Hard to re-transform.
- ✗ Loss of raw data.

**ELT:**
- ✓ Raw data preserved.
- ✓ Easy re-transformation.
- ✓ Better for exploratory work.
- ✗ More storage cost (minor with cloud).
- ✗ Compute in target (cost there).

## Interview Perspective

**Common questions:**
- "ETL vs ELT?" → ETL: transform before load. ELT: load raw, transform in target.
- "Why ELT now?" → Cloud warehouses changed economics — cheap storage, scalable compute.
- "Tools?" → ETL: Informatica, SSIS. ELT: dbt, BigQuery, Snowflake SQL.

**Senior-level:**
- dbt's rise = ELT's rise. Most modern shops use it.
- ELT requires careful access control on raw data (PII).

**Common mistakes:**
- ETL when ELT would simplify.
- ELT without governance → raw PII leakage.

## Related Concepts

- [[Data Warehouse]] · [[Data Lake]] · [[Batch Processing]]

## Misconceptions

- **"ETL vs ELT just letter order."** Substantively different processes.
- **"ELT is always better."** Depends on target capabilities.

## Failure Scenarios

- **ELT without governance** → PII in warehouse accessible to many.
- **ETL with frequent changes** → pipeline rebuilds painful.

## Practical Engineering Heuristics

- **Modern: default to ELT.**
- **Use dbt for transformations.**
- **Govern raw data access.**
- **Versioned transformations.**

## Active Recall Questions

ETL vs ELT?::ETL: extract → transform (outside) → load. ELT: extract → load (raw) → transform (inside target).

Why ELT dominates today?::Cloud warehouses have cheap storage + on-demand compute. Raw data preserved; re-transformation easy.

Modern ELT tool?::dbt — SQL-based transformations versioned and tested.

Legacy ETL tool?::Informatica, SSIS, Talend.

What's the governance concern with ELT?::Raw data (possibly PII) in warehouse — access control critical.

Why was ETL historical?::Data warehouses had expensive storage and limited compute. Transform first to minimize what's stored.

## Feynman Test

Design ELT pipeline: Postgres → Snowflake → dbt. Walk through stages.

Why has dbt's rise been so rapid?

## Mastery Checklist

- **Explain** ETL and ELT.
- **Compare** their economics.
- **Derive** when each fits.
- **Critique** ETL in cloud-warehouse era.
- **Design** ELT stack with proper governance.

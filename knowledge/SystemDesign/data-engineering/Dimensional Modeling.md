---
title: Dimensional Modeling
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Star Schema]]", "[[Data Warehouse]]"]
builds_toward: ["[[Star Schema]]"]
sources:
  - Ralph Kimball, "The Data Warehouse Toolkit"
tags: [data-engineering, modeling, warehouse]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Dimensional Modeling

## Executive Summary

**Dimensional Modeling** (Ralph Kimball, "The Data Warehouse Toolkit," 1996) is a **data modeling technique for analytical databases**: organize data into **facts** (measurable events: sales, clicks) and **dimensions** (context: customer, product, time, location). Optimized for **OLAP queries** ("sales by region by month"). The canonical implementation is the **[[Star Schema]]** — a central fact table surrounded by dimension tables. Despite predictions of its demise, dimensional modeling remains the dominant approach in modern data warehouses.

## Why This Exists

Operational schemas (normalized 3NF) are great for transactions but terrible for analytics — too many joins, poor performance. Dimensional models trade normalization for query speed and analyst comprehensibility. Designed from the user's question backward: "what do you want to analyze?" → identify facts and dimensions.

## Core Intuition

A business question: "Total sales by product, by region, by month." The answer has:
- A **measurement** (sales amount) — the **fact**.
- Multiple **lenses** (product, region, time) — the **dimensions**.

Dimensional model captures exactly this structure.

## Internal Mechanics

**Fact tables:**
- Contains measurements (numbers you sum, count, average).
- Has foreign keys to dimensions.
- Typically very long (billions of rows).

**Dimension tables:**
- Context for facts (who, what, when, where, why).
- Has descriptive attributes.
- Relatively short and wide.

**Star schema:** central fact + dimensions in a star shape.

**Snowflake schema:** dimensions further normalized into sub-dimensions.

## Kimball's Four-Step Design

1. **Choose the business process** (e.g., "orders").
2. **Declare the grain** — what one fact row represents (e.g., "one order line item").
3. **Identify dimensions** (customer, product, date, store).
4. **Identify facts** (quantity, price, discount).

## Slowly Changing Dimensions (SCD)

How to handle dimension changes (customer moves; product reclassified):

- **Type 0:** never change.
- **Type 1:** overwrite (lose history).
- **Type 2:** add new row (preserve history with effective dates).
- **Type 3:** add column for previous value.

Most common: **Type 2**.

## Real Production Examples

- **Most data warehouses** use dimensional modeling.
- **dbt** projects often structured around fact and dimension models.

## Design Tradeoffs

**Benefits:**
- Query performance.
- Intuitive for analysts.
- Conformed across data marts.

**Costs:**
- Denormalized (more storage).
- ETL complexity to maintain.
- Schema changes need care.

## Interview Perspective

**Common questions:**
- "What's dimensional modeling?" → Organize data into facts and dimensions for analytics.
- "Star schema?" → Central fact table surrounded by dimension tables.
- "Slowly Changing Dimensions?" → How to track dimension changes over time.

**Senior-level:**
- Kimball's books are foundational; still relevant.
- Cloud warehouses sometimes blur dimensional discipline; analysts pay later in confused queries.
- dbt encourages dimensional modeling at scale.

**Common mistakes:**
- Skipping the grain declaration.
- Type 1 SCD when history matters.
- Junk dimensions confusing the model.

## Related Concepts

- [[Star Schema]] · [[Data Warehouse]]

## Misconceptions

- **"Dimensional = denormalized."** Specifically: facts + dimensions structure.
- **"Dimensional is outdated."** Predictions ongoing for decades; still dominant.

## Failure Scenarios

- **Wrong grain** → confused aggregations.
- **No SCD** → analytics drift as dimensions change.
- **Too many dimensions** → unwieldy.

## Practical Engineering Heuristics

- **Follow Kimball's 4 steps.**
- **Type 2 SCD by default** for important dims.
- **Conform dimensions** across marts.
- **dbt for transformations.**

## Active Recall Questions

What's dimensional modeling?::Organize data into facts (measurements) and dimensions (context) for analytical queries.

Who coined?::Ralph Kimball, "The Data Warehouse Toolkit" (1996).

Kimball's four steps?::1) Choose business process. 2) Declare grain. 3) Identify dimensions. 4) Identify facts.

What's the grain?::What one fact row represents (e.g., "one order line item"). Critical to nail.

Type 2 SCD?::Slowly Changing Dimension type 2: add new row when dimension changes; preserve history with effective dates.

Star vs Snowflake schema?::Star: dimensions denormalized (flat). Snowflake: dimensions normalized into sub-dimensions.

## Feynman Test

Model an e-commerce sales fact table. Identify dimensions; declare grain.

Why does "declare the grain" come second, not last, in Kimball's process?

## Mastery Checklist

- **Explain** dimensional modeling.
- **Compare** with normalized modeling.
- **Derive** facts and dimensions for given workflow.
- **Critique** poorly-modeled warehouses.
- **Design** dimensional model with proper SCD.

---
title: Joins
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[Relational Databases]]", "[[Query Optimization]]"]
related: ["[[Query Optimization]]", "[[Indexes]]", "[[Denormalization]]"]
sources:
  - DDIA, Ch. 3, Ch. 10
  - SDI vol 1
tags: [databases, queries, joins]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Joins

## Executive Summary

A **JOIN** combines rows from two or more tables based on a related column. The defining feature of relational databases. Three classical join algorithms: **nested loop, hash join, merge join** — chosen by the planner based on table sizes, indexes, and data distribution. Joins enable normalization (data stored once, joined as needed) but cost scales with data — at large scale, denormalization or specialized stores often replace JOIN-heavy queries.

## Why This Exists

Normalized schemas split data across tables to eliminate duplication and update anomalies. To answer questions ("which orders did Alice place?"), you must recombine: JOIN orders ON customer_id. JOINs are the inverse of normalization. Their cost is the price of structured storage; their absence is the price of duplication.

## Core Intuition

You have two lists: people (with their IDs) and their phone numbers (with person IDs). To get "people with phone numbers," walk through one list, look up the other by ID, combine. Different algorithms differ in *how* they walk and look up.

## Join Algorithms

**1. Nested Loop Join:**
- For each row in outer table, scan inner table for matches.
- Cost: O(M × N) without index; O(M × log N) with index on inner.
- Best when: outer is small AND inner has good index on join key.

**2. Hash Join:**
- Build a hash table on the smaller table's join column.
- For each row in larger table, probe hash table.
- Cost: O(M + N).
- Best when: tables fit in memory; equality join.
- Cannot do range joins.

**3. Sort-Merge Join:**
- Sort both tables by join column.
- Walk through both in tandem (like merge in mergesort).
- Cost: O(M log M + N log N).
- Best when: data already sorted (e.g., indexed); huge tables; range joins.

## Join Types (SQL)

- **INNER JOIN** — only matching rows.
- **LEFT OUTER** — all rows from left, nulls for non-matching right.
- **RIGHT OUTER** — symmetric.
- **FULL OUTER** — all rows from both, nulls where unmatched.
- **CROSS JOIN** — Cartesian product.
- **SELF JOIN** — table joined to itself.

## Design Tradeoffs

**Joins are powerful but expensive at scale:**
- Many-table joins explode quickly.
- Cross-shard joins in distributed systems are impractical.
- Denormalization or materialized views eliminate join cost at write expense.

## Real Production Examples

- **OLTP queries** typically join 2-5 tables; planners handle well.
- **OLAP queries** join fact + many dimensions (star schema); columnar engines optimize.
- **Distributed SQL** (CockroachDB, Spanner) — must consider shard locality.
- **Big data joins** (Spark, Flink) — broadcast join (small table to all nodes) vs shuffle join.

## Interview Perspective

**Common questions:**
- "Three join algorithms?" → Nested loop, hash, merge. Each suits different workloads.
- "When does the planner use which?" → Small outer + indexed inner → nested loop. Medium tables in memory → hash. Large sorted tables → merge.
- "Why are cross-shard joins hard?" → Data lives on different nodes; must shuffle or broadcast. Expensive at scale.

**Senior-level:**
- The choice of join algorithm depends on statistics; bad stats → wrong algorithm → 100× slowdown.
- Hash join is the modern workhorse for OLTP and OLAP.
- Streaming joins (Flink, Kafka Streams) require windowing — can't wait for all data.

**Common mistakes:**
- N+1 queries — fetch parent, then loop fetching children. Use JOIN.
- Joining huge tables without indexes — falls back to nested loop disaster.
- Cross-shard JOIN expectations in NoSQL/distributed systems.

## Related Concepts

- [[Query Optimization]] — planner picks join algorithm.
- [[Indexes]] — enable efficient joins.
- [[Denormalization]] — alternative to joining.
- [[Materialized Views]] — pre-computed joins.

## Misconceptions

- **"JOINs are slow."** Right indexes and algorithms make joins fast.
- **"Hash join is always best."** Bad when one table doesn't fit; range joins; non-equality.
- **"You can't JOIN in NoSQL."** Document DBs sometimes support; usually you denormalize.

## Failure Scenarios

- **N+1 query problem** — application loops, issues query per row.
- **Cartesian product** — forgot ON clause; M × N rows.
- **Spilling to disk** — hash join too big for memory.

## Practical Engineering Heuristics

- **Index your join columns.**
- **Look at EXPLAIN to see chosen algorithm.**
- **For huge analytical queries, use columnar engines** (ClickHouse, Snowflake, BigQuery).
- **Avoid joining across shards** in distributed systems — denormalize.

## Active Recall Questions

Three classical join algorithms?::Nested loop, hash join, sort-merge join.

When is nested loop best?::Outer table small AND inner table has good index on join key.

When is hash join best?::Tables fit in memory; equality join. The modern workhorse.

When is merge join best?::Both tables already sorted (e.g., indexed); huge tables; supports range joins.

What's the N+1 query problem?::Fetching parent rows, then looping to fetch each child individually. Use JOIN instead of looping.

Why are cross-shard joins hard?::Data lives on different nodes. Must shuffle (move data) or broadcast (replicate small table). Expensive.

## Feynman Test

Walk through a hash join on two 1M-row tables. Where does memory pressure show up?

Why is the N+1 query problem so common, and how does it differ in cost from a single JOIN?

## Mastery Checklist

- **Explain** the three join algorithms.
- **Compare** their costs and best-use cases.
- **Derive** which the planner would pick.
- **Critique** N+1 anti-patterns.
- **Design** a denormalized schema avoiding cross-shard joins.

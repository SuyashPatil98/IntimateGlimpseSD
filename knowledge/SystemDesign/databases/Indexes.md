---
title: Indexes
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[Relational Databases]]", "[[B-Trees]]"]
related: ["[[B-Trees]]", "[[LSM-Trees]]", "[[Query Optimization]]", "[[Materialized Views]]"]
sources:
  - DDIA, Ch. 3
  - SDI vol 1
  - system-design-primer
tags: [databases, indexes, performance]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Indexes

## Executive Summary

An **index** is an auxiliary data structure that speeds up lookups by maintaining a sorted (or hashed) mapping from key → row location. Trades **write performance and storage** for **read performance**. Every database supports indexes; their design defines query speed. Four categories: **primary** (defines row order), **secondary** (additional access paths), **composite** (multi-column), **covering** (includes all columns a query needs, no table lookup). Wrong indexes → slow queries + slow writes. Right indexes → orders of magnitude faster.

## Why This Exists

Without an index, finding a row requires scanning the entire table. For a billion rows, that's prohibitive. With an index, lookups become O(log N) or O(1). The cost: indexes consume storage and slow down writes (every modification updates indexes). The art is identifying which queries justify which indexes.

## Core Intuition

A book's table of contents and index let you find chapters and topics without reading the whole book. Database indexes are the same — auxiliary structures pointing into the data. You pay for index maintenance (writes update the index); you save on every lookup.

## Types of Indexes

**Primary index:**
- Defines the physical storage order of rows (clustered).
- Usually the primary key.
- One per table.
- In MySQL InnoDB, the primary key *is* the row data (clustered B-tree).
- In PostgreSQL, the primary key is a separate index; rows are heap-stored.

**Secondary index:**
- Additional index on non-primary columns.
- Points to the row (heap location or primary key).
- Multiple allowed per table.

**Composite index (multi-column):**
- Index over (col_A, col_B, ...).
- Useful for queries filtering on the prefix.
- Order matters — `(state, city)` helps queries on `state` or `state+city`, not `city` alone.

**Covering index:**
- Includes all columns the query needs.
- Avoids a follow-up lookup to fetch row data (no "key lookup").
- Faster but bigger.

**Hash index:**
- O(1) point lookups; no range scans.
- Used for hash joins, in-memory KV.

**Bitmap index:**
- For low-cardinality columns (status flags, booleans).
- Compact; fast for AND/OR queries.

**Full-text index:**
- Inverted index for text search.
- Used by Elasticsearch, Postgres tsvector.

**Spatial index (R-tree, etc.):**
- For geographic queries.
- Used by PostGIS.

## Design Tradeoffs

**Benefits:**
- Dramatic read speedups.
- Required for any non-trivial query at scale.

**Costs:**
- **Write cost** — every insert/update touches indexes.
- **Storage cost** — indexes can equal or exceed table size.
- **Maintenance** — index bloat over time (especially Postgres).

## Real Production Examples

- **PostgreSQL** — B-tree default; supports GIN (full-text), GiST (spatial), BRIN (range), Hash.
- **MySQL InnoDB** — B+ tree primary (clustered) + secondary indexes.
- **MongoDB** — B-tree primary + secondary; partial and TTL indexes.
- **Elasticsearch** — inverted indexes for full-text.
- **Cassandra** — primary index; secondary indexes are limited/discouraged.

## Interview Perspective

**Common questions:**
- "When to add an index?" → When a query slow + frequent + filters on indexed columns. Measure first.
- "What's a covering index?" → Index that includes all columns the query needs; avoids row fetch.
- "Why are too many indexes bad?" → Writes update every index; bloat; planner confusion.

**Senior-level:**
- Composite index column order matters. Put highest-cardinality / most-restrictive column first... usually. Depends on access patterns.
- Index-only scans (Postgres) — if index covers query, no heap touch needed.
- Index bloat in Postgres is real — VACUUM, REINDEX matter operationally.

**Common mistakes:**
- Adding indexes without measuring.
- Over-indexing → slow writes.
- Composite index in wrong order — doesn't help queries.
- Forgetting that LIKE 'foo%' uses index; LIKE '%foo' doesn't.

## Related Concepts

- [[B-Trees]] · [[LSM-Trees]] — index structures.
- [[Query Optimization]] — planner uses indexes.
- [[Materialized Views]] — denormalized + indexed views.

## Misconceptions

- **"Always add an index."** Index cost is real. Measure.
- **"Index on every column."** Each one slows writes.
- **"Composite indexes work for any column subset."** Only for prefix subsets.

## Failure Scenarios

- **Index bloat** → query plans degrade. Postgres requires VACUUM/REINDEX.
- **Wrong column order in composite** → index not used.
- **Index on low-cardinality column** → planner ignores (not selective enough).
- **Too many indexes** → write performance collapses.

## Practical Engineering Heuristics

- **Index your WHERE, JOIN, and ORDER BY columns.**
- **Composite index: most selective columns first** (usually).
- **Cover queries when possible** — `INCLUDE` clause (Postgres) for extra columns.
- **Monitor index usage** — drop unused indexes.
- **Index bloat: VACUUM in Postgres; OPTIMIZE TABLE in MySQL.**

## Active Recall Questions

What's an index?::Auxiliary data structure mapping key → row location for fast lookups. Trades write/storage for read speed.

Primary vs secondary index?::Primary defines row order (clustered in InnoDB). Secondary is an additional access path pointing at rows.

What's a covering index?::Includes all columns the query needs. Eliminates the row fetch. Faster but bigger.

Why is composite index column order important?::Only prefix subsets are usable. `(A, B)` helps queries on `A` or `A+B`, not on `B` alone.

Why is over-indexing bad?::Every write updates every index. Storage cost. Planner can be confused with too many choices.

What's an index-only scan?::Query satisfied entirely from the index without touching the table data. Possible when the index covers all needed columns.

## Feynman Test

You have a query: `SELECT name, email FROM users WHERE country = 'US' AND age > 18`. Which indexes would help? Walk through trade-offs.

Why does `LIKE 'foo%'` use an index but `LIKE '%foo'` doesn't?

## Mastery Checklist

- **Explain** index types and use cases.
- **Compare** composite index orderings.
- **Derive** which indexes a query plan would use.
- **Critique** "index everything" approaches.
- **Design** an index strategy for a given query workload.

---
title: Wide-Column Store
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[NoSQL]]", "[[Partitioning]]"]
related: ["[[NoSQL]]", "[[LSM-Trees]]", "[[Leaderless Replication]]", "[[Time-Series Databases]]"]
sources:
  - DDIA, Ch. 2, Ch. 3
  - Bigtable paper (Chang et al., 2006)
  - Cassandra docs
tags: [databases, nosql, wide-column]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Wide-Column Store

## Executive Summary

A wide-column store organizes data as **sparse, multi-dimensional rows** — each row identified by a key, containing many possibly-different "columns" grouped into "column families." Originated with Google's **Bigtable** (2006); embodied by **Cassandra, HBase, ScyllaDB**. Optimized for **massive scale, high write throughput, predictable queries** — typically time-series, event logs, sensor data, large append-only workloads. Not a relational table — closer to a sorted map of `(row_key, column_key) → value`. Excellent at what it's designed for; awkward outside it.

## Why This Exists

At Google, traditional RDBMS couldn't scale for web indexing, analytics, time-series. Bigtable introduced a model that scales horizontally without joins, with predictable performance per row, and is friendly to LSM-tree storage (fast writes). Cassandra adapted this for the open-source world and added Dynamo-style replication. Result: a category of database tuned for "write a lot, read by row key, scan ranges."

## Core Intuition

A massive sorted spreadsheet where:
- Each row has a key (sorted lexicographically).
- Each row has many columns; rows can have different columns.
- Columns are grouped into "families."
- Within a row, data is sorted by column.

You always start by knowing the row key. Then you fetch a subset of columns or scan a range. Joins don't exist — you denormalize everything into one row.

## Internal Mechanics

**Data model:**
- Row key → identifies one row across the cluster.
- Column family → group of related columns.
- Column key → identifies a column within a family.
- Cell → value at (row_key, column_family, column_key); often timestamped.

**Storage:**
- LSM-tree (Cassandra, ScyllaDB) or LSM-like (HBase on HDFS).
- Sorted SSTables; periodic compaction.
- Excellent for high write throughput.

**Partitioning:**
- By row key (Cassandra hash; HBase range).
- Each partition independently replicated.

**Replication:**
- Cassandra: Dynamo-style leaderless with tunable quorums.
- HBase: leader-based per region with HDFS replication underneath.

## Real Production Examples

- **Apache Cassandra** — Dynamo + Bigtable hybrid; massive deployments (Netflix, Apple, Instagram).
- **ScyllaDB** — Cassandra-compatible; C++ rewrite, faster.
- **HBase** — open-source Bigtable on HDFS; Hadoop ecosystem.
- **Google Bigtable** — the original; used internally and as a managed cloud service.
- **DynamoDB** — KV-flavored but supports wide-column-like access via composite keys.

## Design Tradeoffs

**Benefits:**
- Massive write throughput (LSM-tree friendly).
- Predictable performance per row.
- Horizontal scaling first-class.
- Tunable consistency (Cassandra).

**Costs:**
- Must design schema around known query patterns.
- No joins; denormalize heavily.
- Bad at ad-hoc queries.
- Operations complexity (especially Cassandra repair).
- Read amplification under deep LSM levels.

## Interview Perspective

**Common questions:**
- "When choose Cassandra?" → Time-series, event logs, very high write throughput, queries predictable by row key.
- "Cassandra vs MongoDB?" → Cassandra: write-throughput optimized, predictable queries. MongoDB: schema flexible, richer queries, lower scale ceiling.
- "How do you model in Cassandra?" → Query-first. Design tables per query pattern; duplicate data freely.

**Senior-level:**
- "Query-first modeling" is the Cassandra discipline. You write one table per query, duplicate data, and update all tables on each write. Opposite of relational normalization.
- Wide partition anti-pattern: too many cells in one row hurts read performance. Bound partition size.
- Cassandra's operational pain (repair, compaction) is real. ScyllaDB tries to alleviate via better engineering.

**Common mistakes:**
- Using wide-column for ad-hoc queries — wrong tool.
- Unbounded partition sizes — leads to slow reads.
- Forgetting to run repair — silent divergence.

## Related Concepts

- [[NoSQL]] · [[LSM-Trees]] · [[Leaderless Replication]]
- [[Partitioning]] · [[Consistent Hashing]]
- [[Time-Series Databases]] — wide-column is a common substrate.

## Misconceptions

- **"Wide-column = column-oriented."** Different. Column-oriented (Parquet, Vertica) is OLAP. Wide-column (Cassandra) is OLTP-ish for specific access patterns.
- **"Cassandra can do anything."** No — works great within its model; bad outside.
- **"Schema-flexible = no schema."** Tables and column families still have structure.

## Failure Scenarios

- **Wide partition** — millions of cells in one row; read latency.
- **Tombstone accumulation** — deletes create tombstones; reads scan past them.
- **Repair not run** — silent divergence between replicas.
- **Compaction backlog** — disk fills; reads slow.

## Practical Engineering Heuristics

- **Design tables per query pattern.**
- **Bound partition sizes** — typically a few thousand rows max.
- **Run repair regularly** (weekly).
- **Use ScyllaDB** if you want Cassandra semantics with better operations.

## Active Recall Questions

What is a wide-column store?::Database organizing data as sparse rows with many possible columns grouped into column families. Row-key access; query patterns must be predictable.

Name three wide-column stores.::Cassandra, HBase, ScyllaDB, Bigtable.

What's Cassandra's modeling philosophy?::Query-first. Design tables per query pattern; duplicate data; update all tables on each write. Opposite of relational normalization.

Why do wide-column stores excel at write throughput?::LSM-tree storage; writes are sequential appends; partitioning natural.

What's the "wide partition" anti-pattern?::Too many cells in one row → slow reads + memory pressure. Bound partition size in modeling.

When is wide-column the wrong choice?::Ad-hoc queries, complex joins, unpredictable access patterns.

## Feynman Test

Design a time-series schema in Cassandra for sensor data: 1M sensors, 1 reading per second per sensor. What's the row key? Column key?

Explain "query-first modeling" with a concrete example.

## Mastery Checklist

- **Explain** wide-column model and Bigtable lineage.
- **Compare** with relational and document DBs.
- **Derive** appropriate schema for a wide-column workload.
- **Critique** wide-column choices for ad-hoc query workloads.
- **Design** a time-series store in Cassandra avoiding wide-partition anti-patterns.

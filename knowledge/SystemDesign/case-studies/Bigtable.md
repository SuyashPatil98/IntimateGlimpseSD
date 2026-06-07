---
title: Bigtable
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[LSM-Trees]]", "[[SSTables]]", "[[Wide-Column Store]]"]
related: ["[[HBase]]", "[[Cassandra]]", "[[Spanner]]"]
builds_toward: []
sources:
  - Chang et al. "Bigtable: A Distributed Storage System for Structured Data" (OSDI 2006)
  - Google internal architecture talks
  - DDIA references
tags: [case-study, storage, google, bigtable]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Bigtable

## Executive Summary

**Google Bigtable** (2006 paper) is a distributed wide-column store running at petabyte scale across thousands of nodes. The data model: **sparse, sorted, three-dimensional map** indexed by `(row_key, column, timestamp) → value`. Architecturally seminal — it pioneered the **LSM-tree + SSTable + WAL** trifecta now standard in HBase, Cassandra, RocksDB, LevelDB.

## Why It Mattered

Pre-Bigtable (early 2000s), Google's data was on GFS files with ad-hoc structure. They needed: structured access, multi-PB scale, low-latency reads, high write throughput, schema flexibility. Bigtable was the answer; it now powers Search, Maps, Gmail, Analytics, and more.

## Data Model

- **Row key** — byte string, sorted lexicographically. Range scans are first-class.
- **Column families** — groups of columns; defined at schema time.
- **Columns** — `family:qualifier`; created dynamically.
- **Timestamps** — each cell has multiple versions; GC by version count / age.
- **Sparse** — empty cells take no space.

## Architecture

```
┌──────────────────┐
│   Client lib     │
└────────┬─────────┘
         │ direct to tablet server (cached locations)
         ▼
┌──────────────────┐    ┌──────────────────┐
│  Master          │    │  Chubby (lock)   │
│  (membership,    │◄──►│                  │
│   tablet assign) │    └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Tablet servers (many)            │
│   ┌──────┐ ┌──────┐ ┌──────┐     │
│   │tablet│ │tablet│ │tablet│ ... │
│   └──────┘ └──────┘ └──────┘     │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  GFS / Colossus  │ (SSTable files + WAL)
└──────────────────┘
```

## Key Design Decisions

### Tablet split

- Table partitioned into **tablets** by row-key range (~100–200 MB each).
- Tablets dynamically split / merged based on load.
- A tablet is "owned" by exactly one tablet server at a time.

### Storage engine

- Writes: append to in-memory **memtable** + WAL on GFS.
- Memtable full → flush to immutable **SSTable** on GFS.
- Reads: merge memtable + SSTables (latest-version wins).
- Background **compaction** merges SSTables to reduce read amplification.

### Chubby

- Distributed lock service for: tablet ownership, master election, schema info.
- Bigtable depends on Chubby being available; outage → unavailability.

### Bloom filters

- Per SSTable, to skip reads when key definitely absent.

### Locality groups

- Column families grouped into locality groups → separate SSTables → query specific subsets fast.

## What Made It Work

- **LSM + SSTable** writes fast (sequential I/O), reads acceptable (with bloom filters + compaction).
- **GFS underneath** removed durability concerns from Bigtable layer.
- **Chubby** provided strong coordination without Bigtable owning it.
- **Sorted row keys** enabled range scans + locality.

## Lessons / Influence

- HBase is an open-source Bigtable clone.
- Cassandra adopted the column-family model + LSM, but Dynamo-style replication (peer-to-peer).
- HBase + Cassandra use Bigtable's tablet/region split + compaction patterns.
- LevelDB / RocksDB are descendants of Bigtable's storage engine.
- Bigtable itself evolved into Cloud Bigtable; underlies BigQuery, Spanner indirectly.

## Trade-offs

- **No multi-row transactions** in original — single-row only.
- **No secondary indexes** — query via row key only; denormalize.
- **Strong dependency on Chubby and GFS**.
- **Eventually consistent reads** in some configurations.

## Related Concepts

- [[Wide-Column Store]] — model.
- [[LSM-Trees]] / [[SSTables]] / [[Compaction]] / [[WAL]] / [[Bloom Filters]] — engine.
- [[HBase]] — open-source clone.
- [[Chubby]] — coordination dependency.
- [[Cassandra]] — sibling design with different replication.
- [[Spanner]] — Google's later globally-consistent SQL system.

## Active Recall Questions

What is the Bigtable data model?::A sparse, sorted, three-dimensional map indexed by (row_key, column, timestamp) → value, with column families defined at schema time and dynamic columns within them.

What three storage engine techniques did Bigtable popularize?::LSM-tree writes (memtable + WAL), immutable SSTable files, background compaction. Bloom filters for read acceleration.

What is the role of Chubby in Bigtable?::Distributed lock service for tablet ownership, master election, and schema/membership state.

How does Bigtable split data?::Tables partitioned into row-key-range tablets (~100–200 MB); dynamically split or merged based on load; each tablet owned by one tablet server.

How does Bigtable handle reads?::Merge results from the in-memory memtable and all relevant SSTables (filtered by Bloom filters); return latest-version winning cell.

What are column families used for besides organization?::Locality groups — column families can be grouped into separate SSTable files, allowing efficient queries that read only a subset of columns.

What's the major absence in Bigtable's original transaction model?::No multi-row or multi-table transactions; only single-row atomicity. (Spanner addressed this later.)

## Feynman Test

Explain to a Postgres engineer why Bigtable doesn't support secondary indexes or multi-row transactions — what design choices preclude these?

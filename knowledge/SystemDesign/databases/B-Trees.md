---
title: B-Trees
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[Relational Databases]]"]
related: ["[[LSM-Trees]]", "[[Indexes]]", "[[WAL]]"]
sources:
  - DDIA, Ch. 3 (pp. 79–84)
  - Bayer & McCreight, 1972
tags: [databases, storage-engines, indexes]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# B-Trees

## Executive Summary

A **B-tree** is a self-balancing, multi-way search tree that's been the **dominant storage structure of relational databases since the 1970s**. Pages of typically 4KB hold sorted keys with pointers; lookups take O(log N) page reads; the tree stays balanced through splits and merges. Used by **PostgreSQL, MySQL InnoDB, SQL Server, Oracle, SQLite** — essentially every RDBMS. Excellent for **read-heavy, point-lookup, and range-scan workloads** with **in-place updates**. The traditional alternative is [[LSM-Trees]], which trade read amplification for write throughput.

## Why This Exists

Disk reads were the bottleneck for early databases. B-trees minimize disk I/O by keeping the tree shallow (O(log N) where N is huge per node) — even billion-row tables fit in 3-4 levels. The "branching factor" matches the disk page size, so each I/O fetches many keys at once. Bayer & McCreight (1972) gave the world a structure tuned for the gap between RAM and disk speeds — and we're still using it 50+ years later.

## Core Intuition

Imagine a library catalog with multiple levels. The top card says "books A-M on shelf 1, N-Z on shelf 2." Shelf 1's first card says "A-D on aisle 1A, E-H on aisle 1B," etc. To find any book, you start at the top, follow pointers down. Each step narrows the search dramatically.

B-trees are this structure scaled up: nodes (pages) hold many keys; each level reduces the search space by the branching factor.

## Internal Mechanics

**Structure:**
- Each node is a disk page (typically 4 KB).
- A node holds many sorted keys + pointers to child pages.
- Leaf nodes contain the actual data (or pointers to it).
- All leaves at the same depth (balanced).

**Lookup:** binary search within each page; follow pointer to child; repeat until leaf. Depth is O(log_B N) where B is branching factor (often ~100-1000).

**Insert:**
1. Find the leaf page where the key belongs.
2. Insert in sorted order.
3. If page overflows: split into two; propagate split upward.

**Delete:**
1. Find leaf.
2. Remove key.
3. If page underflows: merge with sibling; propagate upward.

**Updates:** in-place — change the bytes of the page.

**Durability:** updates go through a [[WAL]] (write-ahead log) for crash recovery.

## Architecture Diagrams

```
B-tree example (branching factor 3):

                  [10 | 20]
                 /    |     \
            [3,5,8] [12,15,18] [22,25,30]

Lookup 15:
  Root: 15 > 10, 15 < 20 → middle child.
  Middle child: [12,15,18] → found.
```

## Design Tradeoffs

**Benefits:**
- Excellent for point lookups (O(log N) reads).
- Excellent for range scans (leaves linked).
- In-place updates — predictable storage.
- Mature, optimized in every RDBMS.

**Costs:**
- Random I/O on writes (page splits scatter).
- Write amplification (page rewrite per update + WAL).
- Less optimal for write-heavy workloads → [[LSM-Trees]] win there.

## Real Production Examples

- **PostgreSQL** — B-tree indexes by default.
- **MySQL InnoDB** — B-tree primary and secondary indexes; primary index is the data (clustered index).
- **SQLite** — B-trees throughout.
- **Most RDBMS** — B-tree is the default index structure.

## Interview Perspective

**Common questions:**
- "Why B-trees in databases?" → Match disk page size; minimize I/O; balanced; good for both lookups and range scans.
- "B-tree vs LSM-tree?" → B-tree: read-optimized, in-place writes, mature. LSM: write-optimized, append-only, better for huge write throughput.
- "What's a clustered index?" → The data itself stored in B-tree order (MySQL InnoDB). Primary key access is one tree traversal.

**Senior-level:**
- B-tree variants — B+ tree (data only in leaves; internal nodes only keys) is what most databases actually use.
- Write amplification in B-trees: one logical write may rewrite the page + WAL entry + sometimes parent.
- Fill factor matters — leaving space in pages reduces split frequency at cost of storage.

**Common mistakes:**
- Assuming B-tree means original 1972 design — modern variants are B+ trees with many tweaks.
- Ignoring that index updates cost; over-indexing tables.
- Treating B-tree as "the default index" without checking workload.

## Related Concepts

- [[LSM-Trees]] — the main alternative.
- [[Indexes]] — B-tree is the canonical index structure.
- [[WAL]] — durability for B-tree updates.

## Misconceptions

- **"B-tree is always best."** Write-heavy workloads often favor LSM-tree.
- **"B-trees are obsolete."** Still dominant in RDBMS; decades of optimization.
- **"Tree depth grows linearly."** Logarithmic — billion rows in 3-4 levels.

## Failure Scenarios

- **Page split storm** under heavy concurrent inserts.
- **Index bloat** from many updates without VACUUM (Postgres).
- **Write amplification** dominating disk I/O.

## Practical Engineering Heuristics

- **Default to B-tree indexes** unless workload suggests otherwise.
- **Run VACUUM** (Postgres) regularly to reclaim space.
- **Monitor index bloat**.
- **Consider LSM-based engines** (RocksDB) for write-heavy workloads.

## Active Recall Questions

What is a B-tree?::Self-balancing multi-way search tree where each node is a disk page; O(log N) lookups; the dominant index structure in RDBMS.

Why does B-tree match disk page size?::Minimizes I/O — one disk read fetches many keys at once.

B-tree vs LSM-tree?::B-tree: read-optimized, in-place updates, mature. LSM: write-optimized, append-only, better for huge writes.

What's a B+ tree?::Variant where data is only in leaves; internal nodes only have keys. Leaves linked for range scans. Most "B-trees" in practice are B+ trees.

What causes B-tree write amplification?::One logical update may rewrite page + WAL entry + possibly parent pages on split. Worse than append-only LSM.

Name three databases using B-trees.::PostgreSQL, MySQL InnoDB, SQL Server, Oracle, SQLite.

## Feynman Test

Walk through inserting a key into a B-tree that causes a page split. How does the change propagate?

Why does B-tree work well for both point lookups and range scans?

## Mastery Checklist

- **Explain** B-tree structure and operations.
- **Compare** with LSM-tree.
- **Derive** disk I/O per lookup.
- **Critique** "use a B-tree" as default for any workload.
- **Design** indexes for a given query pattern.

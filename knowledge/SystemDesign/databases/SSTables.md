---
title: SSTables
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[LSM-Trees]]"]
related: ["[[LSM-Trees]]", "[[Compaction]]", "[[Bloom Filters]]"]
sources:
  - DDIA, Ch. 3 (pp. 76–79)
  - Bigtable paper (Chang et al., 2006)
tags: [databases, storage-engines, sstable]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# SSTables

## Executive Summary

An **SSTable (Sorted String Table)** is an **immutable, sorted, on-disk file mapping keys to values**, the on-disk format of [[LSM-Trees]]. Originated in Google's Bigtable. Each SSTable is written once and never modified — updates produce a new SSTable; deletes write tombstones. Reads use sparse in-memory indexes plus [[Bloom Filters]] to locate keys efficiently. SSTables are the building block of Cassandra, HBase, RocksDB, LevelDB — and the canonical example of "immutable data structures simplify everything."

## Why This Exists

LSM-trees need an on-disk format that's:
- Fast to write (sequentially).
- Fast to read (sorted; binary searchable).
- Immutable (no in-place edits).
- Compactable (mergeable with other SSTables).

SSTables fit all four. The sorted format means merging two SSTables is a streaming operation (like merge sort). Immutability means no concurrency control needed on disk — readers see consistent files.

## Core Intuition

A sorted list of (key, value) pairs written to disk in a single pass. Want to find a key? Binary search the sparse index in memory, then a brief sequential scan in the file. Want to merge two SSTables? Linear pass through both, output one sorted result. Simple, elegant, mergeable.

## Internal Mechanics

**File structure:**
- **Data block** — sorted (key, value) entries.
- **Index block** — sparse index (every Nth key + offset).
- **Bloom filter block** — see [[Bloom Filters]].
- **Footer** — metadata, pointers to index and bloom filter.

**Reading:**
1. Check bloom filter — if "not present," done.
2. Look up sparse index in memory — narrows to a data block.
3. Read data block from disk; binary-search within block.
4. Return value (or "not found").

**Writing:**
- Sequential write of sorted keys.
- Sparse index built during write.
- Bloom filter populated as values pass through.

**Compression:** data blocks typically compressed (LZ4, Snappy, Zstd).

## Architecture Diagrams

```
SSTable on disk:

  [data block 1]   keys "apple" → "banana"
  [data block 2]   keys "carrot" → "donut"
  [data block 3]   keys "egg" → "fig"
  ...
  [sparse index]   "apple→offset", "carrot→offset", "egg→offset"
  [bloom filter]
  [footer]

Lookup "donut":
  Bloom filter: maybe present.
  Sparse index: between "carrot" and "egg" → data block 2.
  Read block; find "donut".
```

## Design Tradeoffs

**Benefits:**
- Immutable — no concurrency on disk.
- Sorted — efficient lookups + range scans.
- Sequential I/O for writes.
- Streaming merges.
- Easy to ship across nodes (replication).

**Costs:**
- No updates — replaced data persists until compaction.
- Sparse index requires reading partial blocks.
- Multiple SSTables per query → read amplification.

## Real Production Examples

- **Cassandra** — SSTables are the on-disk format.
- **HBase** — HFiles are SSTable variants.
- **RocksDB, LevelDB** — SSTables underlie everything.
- **Bigtable** — invented SSTables.

## Interview Perspective

**Common questions:**
- "What's an SSTable?" → Immutable sorted on-disk file mapping keys to values; canonical LSM on-disk format.
- "How is it written?" → Sequential write of sorted keys; sparse index built; bloom filter populated.
- "How is it read?" → Bloom filter → sparse index → data block → binary search.

**Senior-level:**
- SSTable immutability simplifies replication: ship the file; no need to coordinate writes.
- Sparse index trade-off: smaller index (in-memory cost) but partial block read per lookup. Tunable.
- Compression at block level lets readers decompress only the needed block.

**Common mistakes:**
- Tuning block size without considering access pattern (large blocks: fewer index entries but more wasted read; small: more index, less waste).
- Disabling bloom filters to save memory — read amp explodes.

## Related Concepts

- [[LSM-Trees]] — SSTables are the LSM on-disk format.
- [[Compaction]] — merges SSTables.
- [[Bloom Filters]] — skip SSTables that don't have a key.

## Misconceptions

- **"SSTable is just a sorted file."** Plus sparse index + bloom filter + footer + compression.
- **"SSTables are slow to read."** Single SSTable: fast. Multiple SSTables before compaction: amplification.
- **"Updates rewrite SSTables."** No — they write a new SSTable; old one removed during compaction.

## Failure Scenarios

- **Bloom filter saturation** → many false positives → unnecessary disk reads.
- **Block size mismatch** with workload → I/O waste.
- **Compaction lag** → too many SSTables → read amp.

## Practical Engineering Heuristics

- **Use bloom filters** (default in most engines).
- **Tune block size** to workload (typical: 16 KB).
- **Compress** with LZ4 or Snappy (fast) or Zstd (better ratio).
- **Monitor SSTable count per shard.**

## Active Recall Questions

What's an SSTable?::Sorted String Table — immutable on-disk file mapping keys to values, sorted by key. Canonical LSM on-disk format.

What's in an SSTable file?::Sorted data blocks + sparse index + bloom filter + footer with metadata.

How are keys looked up in an SSTable?::Bloom filter check → sparse index narrows to a block → binary search within block.

Why are SSTables immutable?::Simplifies concurrency (no locks), shipping/replication, recoverability. Updates produce new SSTables.

What enables fast merges of SSTables?::Sorted order. Merging is a linear streaming operation (like merge sort).

Why use a sparse index?::Saves memory. Index every Nth key; brief sequential scan per lookup. Tunable trade-off.

## Feynman Test

Walk through reading a key from a system with 5 SSTables. Where does each layer (bloom, index, block) help?

Why does SSTable immutability simplify Cassandra's replication compared to mutable file formats?

## Mastery Checklist

- **Explain** SSTable format and read path.
- **Compare** with B-tree page format.
- **Derive** memory footprint of sparse index.
- **Critique** SSTable engines without bloom filters.
- **Design** SSTable parameters for a given workload.

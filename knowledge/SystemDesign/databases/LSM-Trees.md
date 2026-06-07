---
title: LSM-Trees
area: databases
status: mature
difficulty: advanced
prerequisites: ["[[Relational Databases]]"]
related: ["[[B-Trees]]", "[[SSTables]]", "[[Compaction]]", "[[Bloom Filters]]", "[[Wide-Column Store]]"]
builds_toward: ["[[SSTables]]", "[[Compaction]]"]
sources:
  - DDIA, Ch. 3 (pp. 76–79)
  - O'Neil et al., 1996 (original LSM paper)
  - Cassandra and RocksDB docs
tags: [databases, storage-engines, lsm]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# LSM-Trees

## Executive Summary

A **Log-Structured Merge-tree (LSM-tree)** is a write-optimized storage structure: writes go to an in-memory buffer (memtable), periodically flushed to immutable sorted files ([[SSTables]]) on disk, which are compacted over time. The opposite tradeoff from [[B-Trees]]: **write amplification low, read amplification higher**. Used by **Cassandra, HBase, RocksDB, LevelDB, ScyllaDB, InfluxDB** — anywhere write throughput dominates. Originated 1996 (O'Neil et al.); reinvigorated 2006 (Bigtable paper); now ubiquitous in NoSQL.

## Why This Exists

B-trees do in-place updates: every write rewrites a page (plus WAL). Random I/O dominates. For write-heavy workloads (time-series, event logs, message queues), this is the bottleneck. LSM-trees flip the model: writes are always appends to an in-memory buffer; periodic background compaction merges sorted files. Result: high write throughput at the cost of more work per read.

## Core Intuition

Instead of a meticulously organized filing cabinet (B-tree), keep a "in-box" on your desk (memtable). When it's full, file it as a new folder (SSTable) without re-arranging the cabinet. Periodically, a clerk merges old folders together (compaction). Filing is fast; finding requires checking the in-box plus recent folders.

## Internal Mechanics

**Write path:**
1. Append to [[WAL]] for durability.
2. Insert into in-memory **memtable** (sorted structure — skip list or RB tree).
3. When memtable is full → flush to disk as immutable **SSTable**.
4. Continue with a new memtable.

**Read path:**
1. Check memtable first.
2. Check SSTables in order from newest to oldest.
3. Use [[Bloom Filters]] to skip SSTables that definitely don't contain the key.
4. First match wins (newer overrides older).

**Compaction:**
- Background process merges multiple SSTables into one.
- Removes overwritten or deleted entries.
- Reduces read amplification over time.
- See [[Compaction]] for strategies.

**Tombstones:**
- Deletes are appends — write a "tombstone" marker.
- Compaction eventually removes both tombstone and the original.

## Architecture Diagrams

```
Memory:                       Disk:
  [memtable]                    [SST-1 (newest)]
       │                        [SST-2]
       │ when full              [SST-3]
       ▼                        [SST-4 (oldest)]
   flush to disk →                ↑
                                  │
                            Compaction merges
                            adjacent SSTables.
```

## Design Tradeoffs

**Benefits:**
- **High write throughput** — sequential I/O.
- **Sequential disk usage** — friendly to spinning disks and SSDs.
- Compaction can run in background.

**Costs:**
- **Read amplification** — may check multiple SSTables.
- **Space amplification** — old data persists until compaction.
- **Compaction CPU and I/O cost** — competes with foreground.
- **Tombstone latency** — deletes don't actually free space until compaction.

## Real Production Examples

- **Cassandra, ScyllaDB** — LSM is the storage engine.
- **HBase, Bigtable** — Bigtable's original storage; HBase inherits.
- **RocksDB, LevelDB** — embedded LSM-tree KV stores; underlie many systems (TiKV, CockroachDB, Kafka Streams state stores).
- **InfluxDB** — LSM variant for time-series.
- **MongoDB WiredTiger** — supports LSM mode (B-tree default).

## Interview Perspective

**Common questions:**
- "Why use LSM-tree?" → Write-heavy workloads. Sequential I/O dominates; high write throughput.
- "LSM vs B-tree?" → LSM: write-optimized, append-only, higher read amplification. B-tree: read-optimized, in-place, write amplification.
- "What's compaction?" → Background merge of SSTables. Reduces read amplification; removes deleted/overwritten data.

**Senior-level:**
- The Bigtable paper revived LSM after years in the wilderness. RocksDB then popularized it as a library.
- Compaction strategy choice (size-tiered vs leveled) has huge ops implications. Leveled = lower read amp, higher write amp. Size-tiered = opposite.
- Read amp can be mitigated with bloom filters and good compaction; write amp via write-buffer tuning.

**Common mistakes:**
- Using LSM for read-heavy workloads without measuring.
- Ignoring compaction backpressure — disk fills, reads slow.
- Not tuning bloom filter false-positive rate.

## Related Concepts

- [[B-Trees]] — the alternative.
- [[SSTables]] — LSM's immutable on-disk files.
- [[Compaction]] — background merge.
- [[Bloom Filters]] — speed up reads.
- [[WAL]] — durability layer.
- [[Wide-Column Store]] — Cassandra etc. built on LSM.

## Misconceptions

- **"LSM is always faster."** Faster writes; slower reads (mitigatable but real).
- **"Compaction is free."** It's a major ops concern at scale.
- **"LSM is just for write-heavy."** Mostly true; but with bloom filters and compaction tuning, can serve mixed workloads.

## Failure Scenarios

- **Compaction backlog** — disk fills; reads degrade.
- **Bloom filter misses** under saturated false-positive rate.
- **Tombstone explosion** — many deletes; reads scan past many tombstones.

## Practical Engineering Heuristics

- **Use LSM for write-heavy, append-mostly workloads.**
- **Tune compaction strategy** to your workload.
- **Use bloom filters** liberally.
- **Monitor compaction queue depth** as an SLI.

## Active Recall Questions

What's an LSM-tree?::Log-Structured Merge-tree. Write-optimized storage: writes append to memtable, flush to immutable SSTables, periodically compacted.

What's the read amplification problem in LSM?::Reads may check multiple SSTables (memtable + recent flushes + older levels). Bloom filters help.

What's compaction?::Background process that merges SSTables, removes deleted/overwritten data, reduces read amplification.

LSM vs B-tree?::LSM: write-optimized, append-only, sequential I/O, higher read amp. B-tree: read-optimized, in-place, random I/O, write amp.

What's a tombstone?::Marker that a key was deleted. Compaction eventually removes both the tombstone and the original record.

Name three production systems using LSM.::Cassandra, RocksDB, LevelDB, HBase, Bigtable, ScyllaDB.

What revived LSM-tree popularity?::Google's Bigtable paper (2006). RocksDB then popularized it as a reusable library.

## Feynman Test

Walk through writing and then reading a key in an LSM system. Where does it go? How is it found?

Why does LSM win for write-heavy workloads despite higher read amplification?

## Mastery Checklist

- **Explain** LSM-tree structure and write/read paths.
- **Compare** LSM and B-tree.
- **Derive** read amplification for a given LSM depth.
- **Critique** "use LSM" as default without measuring workload.
- **Design** a write-heavy service using RocksDB.

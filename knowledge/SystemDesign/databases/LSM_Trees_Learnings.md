---
title: Lsm Trees Learnings
area: databases
status: stub
difficulty: intermediate
created: 2026-06-06
last_reviewed: 2026-06-06
sources: []
tags: []
---

# LSM Trees Learning Notes

## Introduction
Log-Structured Merge-trees (LSM Trees) are designed for write-intensive workloads. They append writes directly into an in-memory buffer (memtable), which is periodically flushed to immutable, sorted files called SSTables on disk.

### Key Concepts:
1. **Write Path:** Writes are appended to a memtable and eventually flushed to an SSTable. Memtables can be implemented as skip lists or Red-Black trees for efficient insertion.
2. **Read Path:** Reads start with the memtable; if not found, they proceed sequentially through SSTables from newest (most up-to-date) to oldest.
3. **Compaction:** Compaction merges multiple sorted files into a single file, reducing read amplification by organizing old data together and is performed in the background.

## Conditions for Using LSM Trees
LSM Trees are ideal when:
- Write performance is critical
- Sequential writes are more efficient than random reads and writes
- The system needs higher write throughput at the expense of slightly increased read latency.

### Optimal Use Conditions and Concepts
1. **Read Amplification Acceptability:** Ensure that the application does not require extremely low or precise reads.
2. **Disk Write Efficiency:** Disk must support sequential writes efficiently to leverage LSM's design advantage over B-trees.
3. **Bloom Filters:** Can be used in conjunction with memtable checks to reduce read amplification by indicating likely SSTable misses early.
4. **Compaction Strategies:** Different compaction strategies (e.g., size-tiered, leveled) affect performance metrics such as read and write amplification.
5. **Memory Management:** Efficient memory management is crucial for minimizing the overhead of maintaining memtables.

## Failure Scenarios
1. **Compaction Backlog:** Disk space may fill up, causing a backlog that can degrade system performance.
2. **Bloom Filter Misses:** If false-positive rates are too high, reads might fail to recognize SSTable misses early, leading to unnecessary scans of multiple levels in the tree.
3. **Tombstone Explosion:** Frequent and poorly cleaned deletes can accumulate old tombstones, increasing overall read latency and compaction workload.

By understanding these concepts and conditions, one can effectively utilize LSM Trees in various systems where write throughput dominates over random read access needs.

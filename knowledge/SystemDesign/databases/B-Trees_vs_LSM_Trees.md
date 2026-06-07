---
title: B Trees Vs Lsm Trees
area: databases
status: stub
difficulty: intermediate
created: 2026-06-06
last_reviewed: 2026-06-06
sources: []
tags: []
---

# Comparison of B-Trees vs LSM Trees

B-Trees are designed primarily for read-heavy workloads. They maintain a self-balancing multi-way search tree structure where each node holds multiple sorted keys and pointers to child nodes, keeping the tree shallow with O(log N) depth.

On the other hand, LSM-Trees are optimized for write-intensive workloads. Writes go through an in-memory buffer (memtable), which is periodically flushed to immutable sorted files called SSTables on disk. Reads involve checking the memtable first; if not found there, reads proceed sequentially from SSTables.

In summary, B-trees excel in read-heavy scenarios with fast lookup mechanisms and are balanced for updates, while LSM-Trees focus on high write throughput at the cost of increased read latency.

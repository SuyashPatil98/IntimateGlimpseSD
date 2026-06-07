---
title: HDFS
aliases: ["Hadoop"]
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[GFS]]"]
related: ["[[MapReduce]]", "[[HBase]]", "[[Apache Spark]]"]
builds_toward: []
sources:
  - Shvachko et al. "The Hadoop Distributed File System" (MSST 2010)
  - Apache HDFS docs
tags: [case-study, storage, hdfs, hadoop]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# HDFS

## Executive Summary

**Hadoop Distributed File System** is the open-source [[GFS]] clone, born at Yahoo (2006). The storage layer of the original Hadoop stack ([[MapReduce]] + HDFS), it became the standard data lake substrate at petabyte scale through ~2018. Now in decline as cloud object storage (S3, GCS) replaces it.

## Architecture

Same shape as GFS, different names:
- **NameNode** = master (metadata).
- **DataNodes** = chunkservers (block storage).
- **Block** = chunk; default 128 MB (256 MB common at large scale).
- **Replication factor**: 3 default.

```
client ──► NameNode (metadata) ──► block locations
   │
   └──► DataNodes (read/write bytes directly)
```

## Key Design Decisions

- **Rack awareness** — replicas placed across racks (e.g., 1 on local rack, 2 on remote rack) for durability and read-locality.
- **NameNode HA** — Active + Standby with shared edits log + Zookeeper failover (HA pair since Hadoop 2.x).
- **Federation** — multiple NameNodes for namespace scale (Hadoop 2.x+).
- **Write semantics**: single-writer, append-only. No random writes.

## Strengths

- **Linear scale** to thousands of nodes / tens of PB.
- **High throughput** for sequential reads.
- **Data locality** — Hadoop schedules tasks on the DataNode holding the block.
- **Strong consistency** for the directory tree.

## Weaknesses

- **NameNode memory** — every file/block consumes a fixed RAM amount (~150 B); billions of small files → OOM.
- **Operational complexity** — NameNode HA, federation, Kerberos, configuration sprawl.
- **Not cloud-native** — POSIX-ish API doesn't fit cloud object storage idioms.
- **Erasure coding** added late (3.x); long absence increased storage cost.

## Why Decline

- Cloud object stores (S3, GCS, ADLS) are managed, infinitely scalable, cheap, 11-nines durability.
- Compute frameworks (Spark, Presto, Flink) added S3 support; HDFS lock-in eroded.
- Open-source successors (Apache Ozone, MinIO) target the same data-lake niche with cloud-native APIs.

## Real Production

- **Yahoo, Facebook, LinkedIn, Twitter, Netflix** — historical multi-PB clusters.
- **Hortonworks / Cloudera / MapR** — commercial distributions.
- **Apache Ozone** — HDFS's successor project.

## Lessons

- An open-source clone of a proprietary design (GFS → HDFS) can succeed if the niche is large enough.
- NameNode-memory ceiling is a real, eventually-binding constraint; federation is necessary at extreme scale.
- Cloud economics ultimately eat on-premises storage architectures.
- Compute-storage co-location (Hadoop's locality model) loses relevance when network is faster than disk.

## Related Concepts

- [[GFS]] — predecessor.
- [[MapReduce]] — primary compute layer.
- [[HBase]] — HDFS user.
- [[Apache Spark]] — uses HDFS or replacements.
- [[Object Storage]] — modern alternative.

## Active Recall Questions

What is the role of the NameNode?::Stores the filesystem namespace, file-to-block mapping, and block-to-DataNode mapping; serves metadata operations; bottleneck for very-many-small-file workloads.

What's the typical HDFS block size and how does it differ from GFS chunks?::128 MB default (vs GFS's 64 MB); larger at high scale (256 MB+); larger blocks reduce metadata pressure on the NameNode.

What is rack awareness?::Replica placement policy that distributes replicas across racks (typically 1 local + 2 remote); balances durability against intra-rack network efficiency.

Why does HDFS struggle with many small files?::Each file/block consumes ~150 B of NameNode RAM; billions of small files exhaust the NameNode's memory.

What was added in Hadoop 2.x to address NameNode availability?::HA pair — Active + Standby NameNodes sharing an edits log (typically QuorumJournalManager) with Zookeeper-coordinated failover.

What is HDFS Federation?::Multiple independent NameNodes serving different namespace subtrees; scales metadata beyond a single NameNode's capacity.

Why are organizations migrating off HDFS?::Cloud object storage (S3/GCS/ADLS) offers managed durability, infinite scale, lower TCO, and is now well-supported by Spark/Presto/Flink; HDFS's compute-locality advantage matters less in fast networks.

## Feynman Test

A team with 5 PB on HDFS asks "should we just move to S3?" — list three things they must do that HDFS handles transparently today.

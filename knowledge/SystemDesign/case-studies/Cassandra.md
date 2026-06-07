---
title: Cassandra
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Leaderless Replication]]", "[[Consistent Hashing]]", "[[LSM-Trees]]"]
related: ["[[Bigtable]]", "[[DynamoDB]]", "[[HBase]]"]
builds_toward: []
sources:
  - Lakshman & Malik "Cassandra: A Decentralized Structured Storage System" (Facebook, 2009)
  - Apache Cassandra docs
  - Discord engineering — Cassandra at scale
tags: [case-study, storage, cassandra]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Cassandra

## Executive Summary

**Apache Cassandra** is a peer-to-peer wide-column store combining the **Bigtable data model** with **Dynamo-style replication**. Created at Facebook (2008), open-sourced, now at Apache. Hallmarks: linear scalability, no SPOF, tunable consistency, AP-leaning. Powers Netflix, Discord, Uber Schemaless, Instagram.

## Why It Exists

Facebook had Inbox Search ~2008 needing PB scale + low write latency + multi-region. Neither Bigtable (single owner per tablet) nor Dynamo (KV only) was sufficient. Cassandra fused them.

## Architecture

```
       gossip ring of nodes (no master)
       all peers; clients connect to any
                    │
            ┌───────┴────────┐
            ▼                ▼
       Node A             Node B   ...
       data range R1      data range R2
       (vnode partition)
```

## Key Design Decisions

### Partitioning

- [[Consistent Hashing]] with virtual nodes (256 per physical node default).
- Token assigned to each vnode; key → token → owning node.

### Replication

- Replication factor RF (e.g., 3).
- N nodes clockwise on ring own copies.
- **No leader** — any replica can serve reads/writes; coordinator forwards.

### Consistency

Tunable per-query via consistency levels:
- ONE / TWO / THREE — single replicas.
- QUORUM — majority of RF.
- LOCAL_QUORUM — majority within local DC.
- EACH_QUORUM, ALL — strict.

`W + R > RF` gives "read your write" within a DC.

### Convergence

- **Read repair** on detected divergence.
- **Anti-entropy** via Merkle trees (`nodetool repair`).
- **Hinted handoff** when destination temporarily down.

### Storage engine

- LSM with SSTables + memtable + WAL ("commitlog").
- Compaction strategies: SizeTiered, Leveled, TimeWindow.

### Data model

- Tables with rows + clustering columns within partition key.
- Wide rows (Bigtable-like) — efficient range scans within partition.
- CQL (Cassandra Query Language) — SQL-ish front.

### Multi-DC

- Replication strategy `NetworkTopologyStrategy` distributes replicas across DCs.
- LOCAL_QUORUM avoids cross-DC sync.

## Strengths

- Linear horizontal scale.
- No single point of failure.
- Multi-DC native.
- Write-heavy workloads excellent.

## Weaknesses

- **Eventual consistency by default** — application must reason about it.
- **Tombstones cause performance pathologies** — deletes accumulate; reads slow.
- **No multi-row transactions** (lightweight transactions exist but expensive).
- **JVM tuning** historically painful.
- **Operationally non-trivial** at scale.

## Real Production

- **Netflix** — major Cassandra user; Prima for streaming history.
- **Discord** — published "How Discord Stores Billions of Messages" with Cassandra; later migrated to ScyllaDB.
- **Apple** — largest known Cassandra deployment.
- **Uber Schemaless** — initially built on Cassandra (later moved).
- **Instagram** — feeds, direct messages.

## Lessons

- Bigtable model + Dynamo replication is a powerful fusion.
- Tunable consistency lets apps choose per query, but cognitive load is real.
- Tombstones are an LSM design smell that bit production hard; range deletes mitigated.
- ScyllaDB (Cassandra-compatible, C++) demonstrates JVM overhead was real.

## Related Concepts

- [[Bigtable]] — data model ancestor.
- [[DynamoDB]] — replication ancestor.
- [[Consistent Hashing]] — partitioning.
- [[Leaderless Replication]] — replication model.
- [[Quorums]] / [[Read Repair]] / [[Anti-Entropy]] / [[Hinted Handoff]] — convergence.
- [[LSM-Trees]] — storage engine.

## Active Recall Questions

What's Cassandra's architectural innovation in one sentence?::Bigtable's column-family data model + Dynamo's peer-to-peer leaderless replication with tunable consistency.

What is a vnode and why default to 256?::A virtual node in the consistent-hash ring; multiple vnodes per physical node smooth load distribution (variance ~1/√(NM)) and ease rebalancing.

What does LOCAL_QUORUM mean?::Read/write acknowledged by a quorum of replicas in the local datacenter; avoids cross-DC latency while keeping single-DC consistency.

What three convergence mechanisms does Cassandra use?::Read repair (on read), anti-entropy / Merkle tree comparison (background nodetool repair), hinted handoff (on write when destination down).

What is the tombstone problem?::Deletes are marked as tombstones (special markers); accumulating tombstones bloat SSTables and slow reads/scans until compaction removes them.

What's the formula for read-your-write consistency in Cassandra?::W + R > RF (replication factor); typical RF=3, W=2, R=2 gives RYW within a single DC.

Why did Discord migrate off Cassandra?::Tombstone-related performance, JVM tuning overhead, and operational pain motivated a move to ScyllaDB (Cassandra-API compatible, C++).

## Feynman Test

Explain to an engineer why Cassandra writes are fast but reads can be unpredictable — what specifically in the storage engine causes the asymmetry?

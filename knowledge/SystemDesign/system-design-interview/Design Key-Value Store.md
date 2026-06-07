---
title: Design Key-Value Store
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Replication]]", "[[Partitioning]]", "[[Quorums]]"]
related: ["[[Key-Value Store]]", "[[Consistent Hashing]]", "[[CRDTs]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.6 ("Design a Key-Value Store")
  - Dynamo paper (DeCandia et al., 2007)
  - DDIA Ch.5–6
tags: [system-design-interview, classic-design, kv-store]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Key-Value Store

## Executive Summary

Design a distributed KV store (Dynamo / Cassandra-style): linear scale, tunable consistency, fault-tolerant. The interview is a tour of the distributed-systems canon — partitioning ([[Consistent Hashing]]), replication ([[Leaderless Replication]]), [[Quorums]], [[Vector Clocks]] / [[CRDTs]] for conflict resolution, [[Anti-Entropy]] / [[Read Repair]] / [[Hinted Handoff]] for convergence.

## Requirements

**Functional:** `put(key, value)`, `get(key)`, `delete(key)`. Possibly TTL, range scans (Cassandra), CAS.

**Non-functional:**
- Massive scale (PB, 10s of nodes).
- High availability (write always succeeds).
- Tunable consistency (per-request quorum).
- Low latency (single-digit ms).

## High-Level Design (Dynamo template)

```
client ──► coordinator (any node) ──► consistent-hash ring ──► R replicas
                       │
                       └──► quorum read/write (W, R, N)
```

## Design Deep Dive

### Data partitioning

[[Consistent Hashing]] with virtual nodes. Key → ring position → N replicas (next N distinct servers clockwise).

### Replication

N = replicas (typically 3). Coordinator forwards write to all N, returns after W ack. Read queries R replicas, returns latest (or merged) value.

**Tunable consistency via quorum:** if $W + R > N$, get-after-put returns the latest value. Common: N=3, W=R=2.

### Versioning

Every write tagged with a [[Vector Clocks|vector clock]]. On reads, if multiple concurrent versions exist (causally unrelated), return all to client (Dynamo's "siblings") or auto-resolve via last-write-wins (Cassandra default).

### Convergence

- [[Read Repair]] — coordinator updates stale replicas on read.
- [[Anti-Entropy]] via Merkle trees — periodic background reconciliation.
- [[Hinted Handoff]] — when destination is down, peer stores a hint and forwards later.

### Failure detection

[[Gossip Protocols]] for membership. [[Phi Accrual Failure Detector]] for graded suspicion.

### Storage engine

[[LSM-Trees]] with [[SSTables]] + [[Bloom Filters]] + [[Compaction]] (write-heavy workloads). RocksDB / LevelDB underneath in practice.

### API & client

Client library encodes key → hash → forwards to any node (which forwards if not coordinator).

## Failure Modes

- **Split brain** — different nodes accept writes for same key during partition. Resolved by [[Vector Clocks]] or LWW.
- **Hot key** — caching layer + key sharding (suffix randomization).
- **Slow replica drags reads** — speculative requests; hedged requests (Tail at Scale).
- **Replica imbalance** — vnode tuning.

## Real Production

- **Amazon Dynamo** (2007 paper, then DynamoDB).
- **Cassandra** — open-source Dynamo.
- **Riak** — Dynamo-style.
- **Voldemort** — LinkedIn's Dynamo clone.
- **etcd / Consul** — KV stores but strongly consistent (Raft), different design class.
- **Redis Cluster** — sharded but synchronous; different consistency model.

## Interview Talking Points

- Walk through CAP positioning explicitly (AP system, tunable via N/W/R).
- Discuss quorum math.
- Explain vector clocks vs LWW; client-side conflict resolution.
- Cover failure detection and gossip.
- Discuss read/write paths and replication topology.

## Related Concepts

- [[Key-Value Store]] — abstract concept page.
- [[Consistent Hashing]] — partitioning substrate.
- [[Leaderless Replication]] — replication model.
- [[Quorums]] — consistency tuning.
- [[Vector Clocks]] — concurrency tracking.
- [[CRDTs]] — automated conflict resolution.
- [[LSM-Trees]] — local storage.

## Active Recall Questions

What's the Dynamo formula for read-your-write consistency in a quorum system?::W + R > N (writes acknowledged by W replicas, reads from R replicas; their intersection guarantees latest value).

What are sibling values in Dynamo?::Concurrent (causally unrelated) versions of the same key kept after a partition; resolved by client logic or LWW.

Why use vector clocks rather than wall-clock timestamps in a KV store?::Wall clocks across machines lack ordering guarantees; vector clocks capture true causal happens-before relationships, distinguishing concurrent writes from sequential ones.

What are the three convergence mechanisms in Dynamo-style KV stores?::Read repair (on read), anti-entropy / Merkle-tree comparison (background), hinted handoff (on write when destination down).

Why is the LSM-tree the natural storage engine for a Dynamo-style KV store?::Write-optimized (append + compact); high write throughput; bloom filters keep reads fast; fits the AP-system's write-heavy expectations.

What's the difference between Cassandra and DynamoDB consistency defaults?::Cassandra defaults to LWW (last-write-wins) with tunable consistency levels; DynamoDB offers eventually-consistent reads by default, strongly-consistent on opt-in.

How does the system detect failures?::Gossip protocol for membership; Phi Accrual Failure Detector for graded suspicion before declaring a node down.

## Feynman Test

Walk through a put(key, value) request end-to-end in a Dynamo-style system with N=3, W=2, R=2. Where could it fail, and what compensates?

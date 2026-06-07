---
title: DynamoDB
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Leaderless Replication]]", "[[Consistent Hashing]]"]
related: ["[[Cassandra]]", "[[Bigtable]]"]
builds_toward: []
sources:
  - DeCandia et al. "Dynamo: Amazon's Highly Available Key-value Store" (SOSP 2007)
  - Elhemali et al. "Amazon DynamoDB: A Scalable, Predictably Performant, and Fully Managed NoSQL Database Service" (USENIX ATC 2022)
  - AWS DynamoDB docs
tags: [case-study, storage, dynamodb, aws]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# DynamoDB

## Executive Summary

**Amazon DynamoDB** is the managed evolution of the 2007 Dynamo paper. It's a serverless, fully-managed KV/document store with predictable single-digit-ms latency at any scale. The 2022 USENIX paper documented the system's architecture after 10+ years of refinement.

## Why It Exists

Amazon shopping cart (2004) lost writes during a network outage — Dynamo was the answer for AP-style stores. DynamoDB (2012) productized this with operational simplicity (no servers, no tuning) for AWS customers.

## Data Model

- **Tables** of items (KV with rich attributes).
- Primary key: partition key alone OR partition key + sort key.
- **Local Secondary Index (LSI)** — same partition key, different sort key.
- **Global Secondary Index (GSI)** — different partition key entirely.
- Items up to 400 KB.

## Architecture

- Tables partitioned by hash of partition key into **partitions** (~10 GB / 3 k WPS / 1 k RPS each).
- Each partition replicated 3× across AZs in a region.
- **Paxos-based** replication (per partition leader chosen).
- **Global Tables** — multi-region active-active (last-writer-wins).
- **DynamoDB Streams** — CDC of all changes.

## Key Design Decisions (post-2007 evolution)

### From Dynamo paper to DynamoDB
- Replaced vector clocks + sloppy quorums with **Paxos per partition** for strong consistency option.
- Internal "storage nodes" hold partition replicas.
- Auto-sharding hides partitioning from users.

### Capacity modes
- **Provisioned** — pay per RCU/WCU per second.
- **On-demand** — pay per request; autoscaling.

### Adaptive capacity
- Detects hot keys; reallocates capacity within table.

### Hot partition mitigation
- 2018: split-for-imbalanced-load splits a hot partition.
- Encourage random-prefix sharding in keys.

### Strong vs eventual reads
- Per-request: `ConsistentRead=true` returns strong (Paxos read); default eventual.

### Transactions
- 2018: `TransactWriteItems` / `TransactGetItems` — multi-item atomic ops within region.

## Strengths

- **Predictable performance at any scale** — single-digit ms p99.
- **Zero operational overhead**.
- **Global Tables** for multi-region.
- **Streams** for downstream consumers.

## Weaknesses

- **Locked-in to AWS.**
- **Per-request pricing** can be unpredictable for burst workloads.
- **Limited query flexibility** — no joins, no ad-hoc queries; queries by indexed key only.
- **Schema design is critical** — wrong key design causes hot partitions or expensive scans.

## Real Production

- **Amazon.com retail** — historical primary use; Prime Day workloads.
- **Lyft, Snap, Airbnb, Disney+** — large public adopters.
- **Lambda + DynamoDB** — canonical serverless stack.

## Lessons

- Dynamo's AP-style architecture worked, but managed-service productization required strong consistency option, hot-key mitigation, and abstraction over vnode-style sharding.
- The 2022 paper publicly documented internal Paxos use — a shift from the AP-only 2007 framing.
- Operational simplicity is a product feature.

## Related Concepts

- [[Leaderless Replication]] — original Dynamo model.
- [[Consistent Hashing]] — original partitioning.
- [[Cassandra]] — open-source Dynamo descendant.
- [[Paxos]] — current internal consensus.
- [[CDC]] — DynamoDB Streams.

## Active Recall Questions

What's the difference between Dynamo (2007 paper) and DynamoDB (productized 2012, evolved 2022)?::Dynamo: leaderless, vector clocks, sloppy quorum, AP. DynamoDB: managed service with Paxos-per-partition replication, strong consistency option, automatic sharding, transactional ops.

What is a partition in DynamoDB capacity terms?::A unit of storage and throughput (~10 GB, ~3k WPS, ~1k RPS); tables are split into partitions automatically; replicated 3× across AZs.

What's the difference between LSI and GSI?::LSI shares the partition key with the base table (different sort key); GSI has a different partition key entirely — internally a separate sharded structure.

What is Adaptive Capacity?::DynamoDB feature that automatically reallocates throughput from cool partitions to hot ones (within table-level provisioned capacity).

How are transactions implemented?::TransactWriteItems / TransactGetItems — multi-item atomic operations within a region (introduced 2018); use 2× the WCUs of a normal write.

What are Global Tables?::Multi-region active-active DynamoDB with eventual consistency across regions; LWW conflict resolution.

Why is partition-key design crucial in DynamoDB?::All requests for a key go to the same partition; bad design (e.g., low-cardinality keys, time-based keys) causes hot partitions and throttling.

## Feynman Test

A new dev creates a DynamoDB table with `date` as the partition key. They get throttled. Explain what's happening at the partition level and what the fix is.

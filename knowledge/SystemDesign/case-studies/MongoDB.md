---
title: MongoDB
area: case-studies
status: mature
difficulty: intermediate
prerequisites: ["[[Document Database]]"]
related: ["[[Cassandra]]"]
builds_toward: []
sources:
  - MongoDB engineering docs
  - DDIA Ch.2
  - MongoDB at scale blog posts (Uber, Lyft, others)
tags: [case-study, storage, mongodb, document]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# MongoDB

## Executive Summary

**MongoDB** is the most popular document database: BSON documents organized into collections, with rich query language, secondary indexes, replication, and sharding. Architecturally: a primary-secondary [[Leader-Based Replication|leader-based replicated]] replica set, sharded by `_id` or chosen shard key, with WiredTiger as the default storage engine (B-tree-like).

## Why It Exists

Early 2010s applications wanted JSON-shaped data without rigid schemas. Mongo's pitch: "use JSON-shaped objects in your app, store them as is."

## Data Model

- **Document** — BSON (binary JSON), nested fields, arrays.
- **Collection** — group of documents (no schema enforced by default; optional validators).
- **No joins** historically; `$lookup` added later.

## Architecture

```
Replica set:
   Primary ──► Secondary ──► Secondary
       ▲           ▲           ▲
       │           │           │
       └─── replicated oplog (asynchronous) ───┘

Sharding:
   mongos (router) ──► config servers (metadata)
       │
       ├──► shard 1 (replica set)
       ├──► shard 2 (replica set)
       └──► shard 3 (replica set)
```

## Key Design Decisions

### Replication

- Replica set: primary accepts writes, secondaries replay oplog asynchronously.
- Election of new primary via consensus (Raft-based since 3.2).
- Read concern + write concern tunable (e.g., `w=majority` for durability).

### Sharding

- Shard key chosen at collection creation.
- Hashed sharding (even distribution) or ranged (locality).
- `mongos` routes queries; config servers maintain chunk → shard map.

### Storage engine

- **WiredTiger** (default since 3.2): B-tree, MVCC, compression. Replaced legacy MMAP engine.

### Transactions

- Single-document atomic by default.
- Multi-document transactions added in 4.0 (replica set) and 4.2 (sharded) — heavier cost than single-doc.

### Indexes

- Primary key on `_id`.
- Secondary indexes per collection: single-field, compound, multikey, text, geo, partial.

## Strengths

- Developer-friendly: JSON-shaped app data; auto-id; flexible schema.
- Powerful query language with secondary indexes.
- Replica set is straightforward to operate.

## Weaknesses

- **Schema flexibility = schema drift.** Real-world apps end up needing validators.
- **Shard key is forever** — wrong choice creates jumbo chunks / hot shards.
- **No joins historically** — denormalize or use `$lookup` (slow).
- **Consistency story has evolved** — older versions had foot-guns (default `w=1`); now defaults are safer.

## Real Production

- **Adobe, Coinbase, Shopify, Toyota** — various Mongo users.
- **Atlas** — MongoDB's managed cloud.
- **Uber** ran Mongo as a primary store before moving to Schemaless (Mongo-on-MySQL).
- **Lyft** moved off Mongo for scaling reasons.

## Lessons

- Schema flexibility is great for prototyping; expensive at scale.
- Shard-key choice is the most consequential decision for sharded Mongo deployments.
- Document databases solve a real need; they're not a general-purpose RDBMS replacement.

## Related Concepts

- [[Document Database]] — model.
- [[Leader-Based Replication]] — replica set.
- [[Partitioning]] / [[Consistent Hashing]] — sharding.
- [[Cassandra]] — alternative NoSQL with different model.

## Active Recall Questions

What is MongoDB's data model?::Documents in BSON format (binary JSON), organized in collections; flexible schema (validators optional); rich query language with secondary indexes.

What is a replica set?::A group of MongoDB nodes — one primary (accepts writes), multiple secondaries (asynchronous oplog replay); elections (Raft-based) on primary failure.

What is the default storage engine and what data structure does it use?::WiredTiger; B-tree based with MVCC and compression.

What is the role of mongos and config servers in a sharded cluster?::mongos routes queries to shards based on the shard-key mapping maintained in config servers (themselves a replica set); a stateless router layer.

When were multi-document transactions added?::4.0 for replica sets (2018), 4.2 for sharded clusters (2019); heavier than single-doc but enable cross-document atomicity.

Why is shard-key choice so consequential?::It determines data distribution and query routing; changing it later is extremely costly (full resharding); bad choice causes jumbo chunks or hot shards.

What's the difference between `w=1` and `w=majority` write concerns?::w=1 acknowledges write on primary only (durability risk on failover); w=majority waits for majority of replicas (durable across failover).

## Feynman Test

A startup picks MongoDB for its flexible schema. Three years in, with 1 TB of data, what specific problems do they likely face that the early simplicity didn't reveal?

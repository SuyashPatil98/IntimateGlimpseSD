---
title: Design S3-like Storage
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Object Storage]]", "[[Consistent Hashing]]"]
related: ["[[Design Google Drive]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.9 ("S3-like Object Storage")
  - Amazon S3 paper / blog
  - Ceph, MinIO docs
  - Dropbox Magic Pocket; Facebook Haystack (2010)
tags: [system-design-interview, advanced-design, storage]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design S3-like Storage

## Executive Summary

Object storage — flat namespace of immutable objects keyed by `(bucket, key)`, exabytes of data, 11 nines durability, REST API. Architecture: **metadata service** (object → location), **storage nodes** (replicated/erasure-coded chunks), **front-end servers** (HTTP/REST), **background services** (compaction, repair).

## Requirements

**Functional:** PUT, GET, DELETE, LIST objects in buckets. Immutable; updates = new versions.

**Non-functional:**
- Exabyte scale.
- 11 nines durability ($10^{-11}$ data loss per year).
- High availability, multi-region.
- Strong read-after-write within region.

## High-Level Design

```
client ──► API gateway ──► Metadata Service (object → chunks)
                              │
                              ▼
                       Storage nodes (chunks, replicated / EC)
                              ▲
                              │
                       Background:
                       - durability monitor
                       - rebalance
                       - garbage collection
```

## Design Deep Dive

### Objects → chunks

- Split object into chunks (64 MB).
- Each chunk replicated 3× across racks/zones OR erasure-coded (e.g., 10+4 Reed-Solomon: 10 data + 4 parity, tolerates 4 losses).

### Metadata service

- KV store mapping `(bucket, key)` → list of chunk IDs + locations.
- Sharded by bucket; replicated for HA.
- Hot path of every read.

### Storage nodes

- Append-only segment files per chunk.
- Each node responsible for many chunks.
- Periodic scrub detects bitrot.

### Erasure coding vs replication

- **Replication (3×)**: 200% overhead, simple, fast recovery.
- **EC (10+4)**: 40% overhead, slower recovery, CPU-heavy reads.
- Hot data → replication; cold → EC.

### Durability target (11 nines)

- Multiple zones × replication factor + EC across zones.
- Continuous data integrity scrub.
- Background repair on detected failures.

### Listing

- Prefix-based list within bucket.
- Implemented as range scan on metadata (sorted KV).

### Multi-region

- Async cross-region replication (S3 CRR).
- Strongly consistent within a region.

### Garbage collection

- Deletes are logical; sweeper reclaims space.

## Failure Modes

- **Disk failure** — chunk re-replicated from peer copies; common, expected.
- **Rack/zone failure** — guaranteed survivable via cross-zone placement.
- **Hot key** (one object very popular) — CDN; replicate to more nodes.
- **Metadata partition** — strong consistency may degrade availability.
- **Listing on huge bucket** — paginated; bucket size limits.

## Real Production

- **Amazon S3** — original (2006).
- **Google Cloud Storage** — built on Colossus.
- **Azure Blob Storage** — variant.
- **Facebook Haystack** (2010) — photo storage; many tiny objects optimization.
- **Ceph, MinIO** — open source.
- **Dropbox Magic Pocket** — internal exabyte storage.

## Interview Talking Points

- Object = immutable bytes + metadata; updates = new versions.
- Chunking + replication / EC tradeoff.
- Metadata as separate, sharded service.
- 11 nines via multi-zone + scrubbing.
- Hot vs cold tier policy.

## Related Concepts

- [[Object Storage]] — generic concept.
- [[Consistent Hashing]] — chunk placement.
- [[Design Google Drive]] — sibling.
- [[Replication]] — durability mechanism.

## Active Recall Questions

What does 11 nines of durability mean?::Probability of data loss for an object < 10^-11 per year; achieved via multi-zone replication/EC, scrubbing, and background repair.

Why is the metadata service architected separately from storage?::Different access patterns (small fast KV vs large bytes); independent scaling; can use different storage engines.

What's the trade-off between 3x replication and 10+4 erasure coding?::Replication: 200% overhead, simple, fast recovery. EC: 40% overhead, slower recovery (must reconstruct from multiple shards), CPU-heavy reads. Hot data goes to replication, cold to EC.

How do deletes work in immutable object storage?::Logically marked deleted in metadata; background garbage collector reclaims chunk space later.

How does S3 achieve listing of objects within a bucket?::Sorted KV metadata; range scan over the prefix; paginated.

What does cross-region replication provide and at what cost?::Asynchronous copy to another region (disaster recovery, locality); eventual consistency across regions; doubles storage cost.

Why might an S3 GET cost more than expected?::Hot key with no caching forces all reads through the storage node; per-request overhead; for popular objects use CDN.

## Feynman Test

A user uploads a 1 GB object. What happens to the bytes inside the system, and which durability guarantees are met before the API returns 200?

---
title: GFS
aliases: ["Google File System"]
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Object Storage]]"]
related: ["[[HDFS]]", "[[MapReduce]]", "[[Bigtable]]"]
builds_toward: []
sources:
  - 'Ghemawat, Gobioff, Leung — The Google File System (SOSP 2003)'
  - 'GFS: Evolution on Fast-Forward (CACM 2010)'
tags: [case-study, storage, gfs, google]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# GFS

## Executive Summary

**Google File System (GFS)** (Ghemawat et al., SOSP 2003) is the distributed filesystem underlying GFS' MapReduce, Bigtable, and most early Google data infrastructure. Designed around **assumptions specific to Google**: huge files (GB+), append-mostly writes, commodity hardware, frequent failures. Single-master + chunkservers architecture. Inspired [[HDFS]].

## Why It Existed

Early-2000s Google: petabyte indexes, thousands of commodity nodes, custom workloads. No off-the-shelf filesystem was suited. GFS embraced the constraints:
- Files are huge (multi-GB).
- Writes are mostly **appends** (web crawl output, log streams).
- Random writes rare; random reads tolerable.
- Failures are the norm, not exception.

## Architecture

```
                  ┌─────────┐
                  │ Master  │ (single; periodic snapshots; HA via shadow)
                  └────┬────┘
                       │ metadata
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    chunkserver  chunkserver  chunkserver
    (64 MB chunks; 3× replicated; data path direct to client)
```

- **Master** — namespace, chunk locations, leases, GC. In-memory state.
- **Chunkservers** — host 64 MB chunks; 3× replicated.
- **Clients** — fetch chunk location from master; transfer bytes directly with chunkservers.

## Key Design Decisions

### 64 MB chunk size

Large chunk reduces master metadata (one entry per chunk), reduces TCP overhead, supports sequential read throughput. Small files waste space (mitigated by tiny-file packing in later eras).

### Single master

Simplifies metadata logic; in-memory state allows fast lookups. Bottleneck mitigated by: (1) client caches; (2) data path bypasses master; (3) shadow masters for HA.

### Append-friendly atomic record append

Multiple clients can `RecordAppend` to same file concurrently; GFS chooses an offset. Useful for log-style writes.

### Relaxed consistency

- Mutations may be applied in different orders at replicas.
- "Defined" (consistent + content as last write) or "consistent" (all replicas same but unknown state).
- Applications cope by adding checksums, dedupe, idempotent records.

### Failures

- Chunkserver fails → re-replicate from peers.
- Master fails → standby or operator intervention.
- Bitrot → checksums; reread.

## Influence

- HDFS is essentially open-source GFS.
- Inspired the entire BigData stack architecture (compute close to data).
- Colossus (Google's successor) addressed master bottleneck via federated metadata.

## Weaknesses (and Colossus's Response)

- **Single master is the scaling ceiling.**
- **64 MB chunks fragment small-file workloads.**
- **Relaxed consistency** put burden on applications.

Colossus (Google's GFS successor, 2010s) sharded metadata across many servers (Spanner-backed) and addressed these.

## Lessons

- Workload-specific assumptions can yield 100× simpler systems.
- Single-master is a fine SPOF when metadata fits in RAM and clients cache aggressively.
- Append-only writes simplify replication enormously.
- "Move computation to the data" became the architectural mantra of the BigData era.

## Related Concepts

- [[HDFS]] — open-source GFS clone.
- [[MapReduce]] — primary GFS consumer.
- [[Bigtable]] — stored SSTables on GFS.
- [[Object Storage]] — modern successor.
- [[Chubby]] — used for master election.

## Active Recall Questions

What workload assumptions did GFS embrace?::Huge files (multi-GB), append-mostly writes, sequential reads, commodity hardware, frequent failures.

What is the default chunk size and why so large?::64 MB; reduces master metadata, amortizes TCP overhead, supports sequential throughput; wasteful only for many tiny files.

How does the master avoid being a data bottleneck?::Master serves only metadata (chunk locations, leases); the data path goes directly between clients and chunkservers; clients cache locations heavily.

What is RecordAppend and why was it valuable?::An atomic append operation supporting concurrent appenders; the system picks the offset; ideal for log-style workloads where order across appenders doesn't matter.

What consistency model does GFS provide?::Relaxed — mutations may be applied in different orders at replicas; "defined" vs "consistent" states; applications add checksums and dedup logic.

What was Colossus's main improvement?::Sharded metadata (no single master); scaled past GFS's single-master ceiling; backed by Spanner-like consistent store.

Why was a single master acceptable for GFS at Google's 2003 scale?::Metadata fit in memory; clients cached; shadow masters provided availability; the bottleneck wasn't hit at the scales of the time.

## Feynman Test

Imagine someone wants to use GFS for a transactional database backing store. What specific workload assumptions does GFS make that would make this a poor fit?

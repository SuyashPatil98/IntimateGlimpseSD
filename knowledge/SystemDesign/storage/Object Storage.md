---
title: Object Storage
area: storage
status: draft
difficulty: intermediate
prerequisites: []
related: ["[[Design S3-like Storage]]", "[[Design Google Drive]]", "[[Design YouTube]]", "[[Design Distributed Email]]", "[[GFS]]", "[[HDFS]]", "[[Data Lake]]"]
builds_toward: ["[[Design S3-like Storage]]"]
sources:
  - SDI vol 2 Ch.9
  - AWS S3 docs
  - Data Engineering Cookbook (Kretz)
tags: [storage, object-storage, cloud]
created: 2026-06-04
last_reviewed: 2026-06-04
---

# Object Storage

## Executive Summary

**Object storage** is a flat-namespace, REST-accessed durable byte store: objects keyed by `(bucket, key)` are immutable opaque blobs with metadata; updates create new versions. The dominant cloud-era primitive for unstructured data — S3, GCS, Azure Blob, Cloudflare R2. Distinct from block storage (raw volumes) and file storage (POSIX trees) in three ways: flat namespace, HTTP API, eventual-to-strong-within-region consistency.

## Why This Exists

Pre-cloud, durable bulk storage meant NAS or SAN — POSIX, expensive, capacity-bound. The web app workload (user uploads, backups, logs, lake data) is mostly write-once, read-many, scale-free, and doesn't need POSIX semantics. Object storage matches the workload: cheaper per byte, infinite scale, accessed via HTTP from anywhere.

## Core Intuition

It's a **giant hashtable on the public internet**: PUT `bucket/key` → bytes; GET `bucket/key` → bytes. No directories (the `/` in the key is convention, not structure). No partial writes. No file locks. Just immutable blobs and metadata, replicated across zones for durability.

## Internal Mechanics

See [[Design S3-like Storage]] for full architecture. Summary:

- **Metadata service**: maps `(bucket, key)` → chunk locations; sharded by bucket.
- **Storage nodes**: hold chunks (64 MB typical); replicated 3× or erasure-coded (10+4 Reed-Solomon).
- **Front-end**: HTTPS REST API.
- **Background services**: scrubbing (detect bitrot), repair (re-replicate failed chunks), garbage collection (reclaim deleted space).
- **Durability**: 11 nines via cross-zone placement + scrub-and-repair.

## Design Tradeoffs

**Strengths:**
- Infinite scale, cheap per byte (especially cold tiers).
- 11 nines durability without operator effort.
- HTTP API works from anywhere.
- Versioning, lifecycle policies, server-side encryption built in.

**Weaknesses:**
- **Not POSIX** — no random writes, no directory rename, no file locks. Legacy software requires adapters (s3fs, goofys; all leaky).
- **Per-request latency** higher than local disk (~30–100 ms vs sub-ms).
- **Listing large buckets is slow** (must paginate).
- **Egress costs** dominate cloud bills if served directly to users — use CDN.

## Real Production Examples

- **Amazon S3** (2006) — the original; powers most of the modern web's backend storage.
- **Google Cloud Storage** — built on Colossus.
- **Azure Blob Storage** — variant.
- **Cloudflare R2** — S3-compatible without egress fees.
- **MinIO, Ceph** — open-source S3-compatible.
- **Backblaze B2, Wasabi** — cheap-tier competitors.

## Misconceptions

- **"Object storage is slow."** Latency is higher per request, but aggregate throughput is essentially unlimited. For bulk reads with parallelism, often faster than local disk.
- **"You can treat it like a filesystem."** s3fs et al. work for simple workloads but break under random writes, renames, locking. Use SDKs, not POSIX adapters.
- **"Eventually consistent everywhere."** S3 has been strongly consistent for read-after-write since 2020. Cross-region is still eventually consistent.

## Failure Scenarios

- **Hot key** (one object served at viral rate) — caching at CDN; S3's per-prefix throughput limits apply.
- **Listing on a multi-billion-key bucket** — paginated scans take hours; structure keys for prefix-based slicing.
- **Cross-region replication lag** — async CRR can be minutes behind; build apps that tolerate it.
- **Accidental deletion at scale** — versioning + MFA-delete + lifecycle holds; otherwise unrecoverable.

## Interview Perspective

- *"When would you choose object vs block vs file storage?"* → Object for bulk/static/lake; block for DBs / VM disks; file for legacy POSIX needs.
- *"Why is S3 so durable?"* → Cross-zone replication or EC, continuous scrubbing, background repair.
- Common mistake: treating S3 as a low-latency KV store. It's not — use DynamoDB for that.

## Related Concepts

- [[Design S3-like Storage]] — the full interview design.
- [[GFS]] / [[HDFS]] — predecessor distributed file systems.
- [[Data Lake]] — typically built on object storage.
- [[CDN Caching]] — front-end to object storage for user-facing serving.

## Active Recall Questions

What's the data model of object storage?::Flat namespace of immutable `(bucket, key) → bytes` objects with metadata; updates create new versions; no directories (convention only), no partial writes, no POSIX semantics.

How does object storage achieve 11 nines durability?::Cross-zone replication (3×) or erasure coding (e.g., 10+4 Reed-Solomon), continuous background scrubbing for bitrot detection, automatic re-replication of failed chunks.

Why isn't S3 a good choice for hot small reads (sub-ms required)?::Per-request HTTP latency is 30–100 ms; for that workload use DynamoDB or Redis.

When did S3 become strongly consistent for read-after-write?::December 2020 — before then, new objects had eventual consistency for reads.

Why are POSIX adapters (s3fs, goofys) considered leaky?::They fake POSIX over an HTTP object API; break under random writes, directory rename, file locking — anything that requires mutable in-place state.

What's the difference between replication and erasure coding here?::Replication (e.g., 3×) stores complete copies → 200% overhead, fast recovery. EC (e.g., 10+4) stores parity shards → 40% overhead, slower recovery (must reconstruct), CPU-heavy.

## Feynman Test

Explain why "just put it in S3" works for 1 PB of user uploads but is a disaster as a primary KV store for your auth service.

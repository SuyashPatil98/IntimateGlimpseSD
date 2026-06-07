---
title: Design Google Drive
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Object Storage]]"]
related: ["[[Design YouTube]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.15 ("Design Google Drive")
  - Dropbox engineering — Magic Pocket
  - rsync algorithm
tags: [system-design-interview, classic-design, file-storage]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Google Drive

## Executive Summary

A file-sync and storage service (Drive, Dropbox, OneDrive). Users upload/download files, share with others, sync across devices. Architecture pillars: **chunked upload with deduplication**, **block-level sync (delta upload)**, **metadata service vs blob service split**, **eventual consistency with versioning**, **conflict resolution**.

## Requirements

**Functional:** Upload, download, share, sync across devices, version history.

**Non-functional:**
- 100 M users, 100 GB avg → 10 EB storage.
- 100k QPS metadata ops.
- Multi-region; data durable (99.999999999%).

## Back-of-Envelope

- New writes: ~10 GB/user/year × 100M = 1 EB/year.
- Dedup factor ~2–3× (shared OS files, copies) → ~400 PB/year net.

## High-Level Design

```
client ──► Block Server ──► Block storage (S3/Colossus)
   │              │
   │              ▼
   │       Dedup Service (hash → block)
   │
   ├──► Metadata Service ──► Metadata DB (sharded MySQL / Spanner)
   │
   └──► Notification Service ──► WebSocket/long-poll (sync events)
```

## Design Deep Dive

### Files as chunks

Split each file into **4 MB blocks**. Each block:
- Hashed (SHA-256).
- Stored once globally (dedup) in blob storage.
- Referenced in metadata as `(file → ordered list of block hashes)`.

### Upload (block-level sync)

1. Client splits file into blocks; computes hashes.
2. Sends hash list to server.
3. Server returns: "I already have these, only send these new ones."
4. Client uploads missing blocks → blob storage.
5. Server commits the metadata entry.

This is the **Dropbox/rsync trick**: dramatically reduces upload bandwidth for edits.

### Storage

- Blocks in object storage; replicated across zones; erasure-coded across regions for cold blocks.
- Metadata in sharded RDBMS (Dropbox) or Spanner (Google).

### Sync

- Each client has a "cursor" of the last revision seen.
- Server pushes changes via long-poll / WebSocket.
- Conflict: rename one as "filename (conflicted copy from X).ext".

### Versioning

- Old block lists kept for 30 days.
- Restoring an old version = update metadata to old block list (blocks may still exist due to dedup).

### Sharing & permissions

- ACLs in metadata.
- Public links via signed URLs.

### Compression / encryption

- Compress blocks client-side; encrypt at-rest in storage.

## Failure Modes

- **Sync conflict** — same file edited on two devices offline. Resolved by versioning + manual reconcile.
- **Dedup poisoning** — malicious user uploads a block with the same hash as a popular block. Mitigate: keyed hash + access control.
- **Metadata DB hot shard** — large user with millions of files. Resolve by per-user sub-sharding.
- **Block store outage** — replicated cross-region; degrades to read-only.

## Real Production

- **Google Drive** — uses Colossus storage + Spanner for metadata.
- **Dropbox Magic Pocket** — moved off S3 to in-house exabyte storage (2016).
- **Microsoft OneDrive** — Azure storage backend.
- **Box, iCloud Drive** — similar architectures.

## Interview Talking Points

- Block-level sync (rsync trick) is the central insight.
- Metadata service / blob service split.
- Dedup by content hash.
- Conflict resolution (no merge — rename).
- Sync via WebSocket / long-poll.

## Related Concepts

- [[Object Storage]] — blob substrate.
- [[Design YouTube]] — sibling design (also chunk + CDN).

## Active Recall Questions

What is block-level sync and why is it efficient?::Files split into fixed-size blocks (e.g., 4 MB); only changed blocks uploaded after edit; dramatically reduces upload bandwidth for edits to large files.

What does content-addressed deduplication mean?::Each block stored once globally, keyed by its hash (SHA-256); identical content from different users / files references the same block — saves significant storage.

How does the client know which blocks to upload?::It sends the list of block hashes; the server replies with which it already has; client uploads only the missing blocks.

How are sync conflicts resolved?::No automatic merge; one version is renamed (e.g., "filename (conflicted copy from <device>).ext") so both are preserved; user reconciles manually.

How is versioning implemented given dedup?::Old block-list snapshots kept (e.g., 30 days); restoring just points the file metadata to an older block list; underlying blocks may still exist due to dedup.

What's the typical block size and why?::4 MB — balances chunk count (metadata overhead) vs upload granularity (delta efficiency); smaller chunks improve delta but increase metadata.

How does cross-device sync notification work?::Long-poll or WebSocket from client to notification service; server pushes change events; client updates its cursor and pulls deltas.

## Feynman Test

A user edits one line in a 1 GB log file and saves. Walk through what the Drive client does and how much data hits the server.

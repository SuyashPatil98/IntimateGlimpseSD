---
title: Design YouTube
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[CDN Caching]]", "[[Object Storage]]", "[[Caching]]"]
related: ["[[Recommendation Systems]]", "[[Search Ranking]]", "[[Design Search Autocomplete]]", "[[Design Web Crawler]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.14 ("Design YouTube")
  - Covington 2016 (YT recommendation)
  - Google CDN / Edge network material
tags: [system-design-interview, classic-design, video]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design YouTube

## Executive Summary

A video-sharing platform: users upload videos (huge files), the system encodes them into multiple resolutions/codecs (transcoding), stores them on object storage backed by CDN, and serves them via adaptive bitrate streaming (HLS/DASH). The metadata + recommendation system is separate from the video plane.

## Requirements

**Functional:** Upload, transcode to multiple resolutions, stream with adaptive bitrate (HLS/DASH), search, recommend, comment, like, channel pages.

**Non-functional:**
- 2 B users; 1 B hours watched/day.
- Storage: PB-scale; new uploads 500 hours/min.
- Latency: video start <2 s.
- Global availability.

## Back-of-Envelope

- Uploads: 500 hr/min × 60 = 30,000 video-min/min uploaded; at 50 MB/min raw ≈ 1.5 GB/min upload bandwidth.
- After encoding to ~5 quality levels: 5–10× ingress storage; ~10 GB/min net storage = ~14 PB/year.
- Egress (watch): 1B hours × 5 Mbps avg = 1.2 PB/hour egress; ~10 Tbps sustained.

## High-Level Design

```
Upload ─► Upload Service ──► Raw S3
                                │
                                ▼
                         Transcoding workers
                                │
                                ▼
                          Encoded variants
                                │
                                ▼
                            CDN origin
                                │
                                ▼
                       CDN edge (push/pull)
                                │
client ◄────── HLS/DASH stream ─┘

(parallel: Metadata DB, Search index, Recommendation, Comments)
```

## Design Deep Dive

### Upload

- Resumable chunked upload (TUS protocol or signed S3 multipart).
- Store raw to S3-like object storage; emit job to transcoding queue (Kafka).

### Transcoding

- DAG-based pipeline: split → encode each segment in parallel → assemble manifest.
- Resolutions: 144p, 360p, 480p, 720p, 1080p, 4K.
- Codecs: H.264 (universal), VP9, AV1 (modern).
- Adaptive Bitrate (ABR): produces a manifest (HLS .m3u8 / DASH .mpd) referencing segmented files.

### Storage

- Object storage (Google Colossus / GFS, S3, etc.).
- Hot videos pinned to CDN edge; cold in cheap storage.

### CDN / Edge

- Edge serves bulk of bytes. Origin only on miss.
- Push to popular videos; pull-through cache for tail.
- Multiple CDN providers (Akamai, Cloudflare, in-house Google Edge).

### Adaptive bitrate streaming

- Client requests next segment at bitrate matched to current bandwidth.
- HLS (Apple), DASH (open), both segment-based over HTTP.

### Metadata

- Per-video: title, description, owner, tags, encodes, timestamps. Sharded RDBMS or wide-column.
- Per-user: history, subscriptions, playlists.

### Search & recommendation

- Search: dual-encoder + lexical (see [[Search Ranking]]).
- Recommendation: candidate gen (two-tower) + ranker (DNN), as in [[Recommendation Systems]].

### Comments / Likes / Views

- High-write event streams → Kafka → aggregate. View counter approximate (HyperLogLog).

## Failure Modes

- **Transcoding backlog** — autoscale workers; prioritize popular uploaders.
- **CDN origin overload** on viral video — pre-push; cache warming.
- **Region failover** — DNS-based, primary/secondary CDN.
- **Hot live stream** — dedicated low-latency live ingest (separate stack from VoD).
- **DMCA / abuse** — content fingerprinting (Content ID).

## Real Production

- **YouTube** — Google CDN edge, Colossus storage, Bigtable metadata.
- **Twitch / Vimeo / TikTok** — variants.
- **Netflix Open Connect** — CDN appliances at ISPs.
- **AWS Elemental MediaConvert + CloudFront** — managed.

## Interview Talking Points

- Separate video plane (CDN-heavy) from metadata plane (DB-heavy).
- Transcoding parallelism (split-encode-merge).
- Adaptive bitrate streaming.
- CDN edge economics (origin egress >> CDN cost).
- Recommendation as a separate subsystem.

## Related Concepts

- [[CDN Caching]] — central to economics.
- [[Object Storage]] — video bytes.
- [[Recommendation Systems]] — engagement.
- [[Search Ranking]] — discovery.
- [[Apache Kafka]] — event spine.

## Active Recall Questions

What is adaptive bitrate streaming and which protocols implement it?::Client requests video segments at bitrate matched to current bandwidth; HLS (Apple, .m3u8) and DASH (open standard, .mpd) are the protocols.

Why transcode uploaded videos into multiple resolutions?::Bandwidth heterogeneity (mobile vs fiber), device capability, ABR streaming requires multiple variants.

How is transcoding parallelized?::Split video into segments, encode each segment in parallel on worker pool, reassemble manifest pointing to encoded segments.

Why is the CDN edge critical to video economics?::Egress dominates cost; serving from CDN edge avoids origin egress on cache hit; pushing to edge for popular content amortizes origin transfer.

How is view count computed at scale?::Event stream (view events into Kafka) aggregated with approximate counters (HyperLogLog) and per-window batch jobs.

What's the trade-off between H.264 and AV1?::H.264: universal device support, larger files. AV1: ~30% smaller for same quality, newer device support, slower encoding. Many systems encode both.

What's the role of Content ID / content fingerprinting?::Detects copyrighted content automatically; matches uploaded videos against a database of known fingerprints (Google's Content ID).

## Feynman Test

When a user clicks a YouTube video, what happens in the first 500 ms — list every system touched and the latency budget for each.

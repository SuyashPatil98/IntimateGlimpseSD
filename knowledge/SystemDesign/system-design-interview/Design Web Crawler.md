---
title: Design Web Crawler
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Message Queues]]", "[[DNS]]"]
related: ["[[Search Ranking]]", "[[Bloom Filters]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.9 ("Design a Web Crawler")
  - Najork & Heydon "High-Performance Web Crawler" (2001)
  - Google original Mercator architecture; Heritrix
tags: [system-design-interview, classic-design, crawling]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Web Crawler

## Executive Summary

A web crawler fetches pages, extracts links, and enqueues them for further fetching — feeding a search index or training corpus. Core challenges: massive scale (billions of URLs), politeness (rate-limit per host), deduplication, frontier management, robustness to bad actors and infinite spaces.

## Requirements

**Functional:** Seed URLs → BFS fetch → parse → extract links → store content + queue new URLs.

**Non-functional:**
- 1 B pages/month (~400/s).
- Politeness: respect robots.txt, per-host rate limit.
- De-duplication of URLs and content.
- Resumable; fault-tolerant.

## Back-of-Envelope

- 1 B pages / 30 days / 86,400 s ≈ 400 pages/s; peak ~1200/s.
- Avg page 100 KB → 100 TB/month raw.
- URL frontier ~10 B URLs at 100 B each = 1 TB.

## High-Level Design

```
seed URLs ─► Frontier (priority queue, sharded by host)
                  │
                  ▼
            Fetcher pool ──► DNS cache, robots.txt cache
                  │
                  ▼
              raw HTML ─► Content store (S3/HDFS)
                  │
                  ▼
              Parser ─► extract links + content hash
                  │              │
                  │              ▼
                  │       URL-seen / content-seen filters (Bloom)
                  │              │
                  ▼              │
            New URLs ────────────┘
                  │
                  ▼
             back to Frontier
```

## Design Deep Dive

### URL Frontier

- Priority queue per host (politeness — only one outstanding request per host).
- Outer queues distinguish priority tiers (homepage > deep page).
- Sharded by host (consistent hash) so one worker handles a host's queue → easy politeness.

### URL-seen filter

- 10 B URLs at scale; can't keep all in RAM.
- [[Bloom Filters]] with FPR ~1% saves memory; combined with persistent dedupe DB for confirmation.
- Mercator-style: bloom filter + on-disk lookup for misses.

### Content-seen filter

- Hash page content (SimHash / MinHash for near-duplicate detection).
- Skip pages whose hash already seen.

### DNS

- DNS lookups dominate latency. Maintain DNS cache; resolver pool.

### robots.txt

- Fetch + cache per host. Respect Disallow, Crawl-Delay.

### Fetcher pool

- Async HTTP (libcurl-multi, async I/O); ~1000 connections per worker.
- Timeout aggressively; retry with backoff.

### Crawl traps

- Infinite calendar pages, parameter explosions, server-side dynamic URLs.
- Mitigations: max-depth, URL canonicalization (strip session IDs), per-host page cap.

### Storage

- Raw HTML → S3 / HDFS.
- Index features → warehouse.

## Failure Modes

- **Politeness violation** — one host receives DDoS-level QPS. Mitigation: per-host queue, hard rate cap.
- **DNS poisoning / failure** — bad DNS sends crawler to wrong IP.
- **Spider traps** — infinite pages. Mitigation: canonicalization, depth limit.
- **Frontier explosion** — one viral page links to millions of others; queue grows.
- **Worker crash** — frontier persisted (Kafka / DB); resumable.

## Real Production

- **Googlebot** — proprietary; trillions of pages.
- **Bingbot, Yandex, Baidu** — competitors.
- **Heritrix** — Internet Archive's open-source crawler.
- **Common Crawl** — public web archive, monthly.
- **Apache Nutch** — Hadoop-based.

## Interview Talking Points

- Politeness is the senior-signal detail.
- URL-seen filter design (Bloom + disk).
- Frontier sharding by host = ops + politeness in one move.
- Crawl traps and canonicalization.
- Distinguishing crawl from indexing (separate concerns).

## Related Concepts

- [[Message Queues]] — frontier as a queue.
- [[Bloom Filters]] — URL dedup.
- [[DNS]] — heavy load on resolver.
- [[Search Ranking]] — downstream consumer.
- [[Distributed Caching]] — DNS, robots.txt caches.

## Active Recall Questions

What is the URL frontier and how is it typically organized?::A priority queue of URLs to fetch; sharded by host (consistent hashing) so each host's politeness can be enforced by a single worker; multi-tier priority within each host queue.

Why use a Bloom filter for URL-seen detection?::Fits billions of URLs in tens of GB of RAM with ~1% false positive rate; combined with persistent dedupe DB for confirmation; saves memory over full hash set.

What does "politeness" mean for a crawler?::Respect robots.txt rules and per-host rate limits (e.g., one outstanding request per host, configurable crawl-delay); avoid DDoSing target sites.

What is a crawl trap and how do you mitigate it?::Infinite URL spaces (calendars, parameter explosions) that consume the frontier; mitigations: URL canonicalization, depth limits, per-host page caps, traps-list.

What is content-seen filtering and when is it useful?::Hashing page content (SimHash for near-duplicates) to avoid re-processing duplicate pages with different URLs.

Why shard the frontier by host?::A single worker owns each host's queue, naturally enforcing politeness; distributes load across workers without cross-talk for ordering.

What's the storage budget for 1 B pages at 100 KB each?::100 TB raw content; index-derived data adds more; must use object storage (S3/HDFS).

## Feynman Test

Explain to a junior engineer why "fetch all URLs in parallel as fast as possible" is wrong — what specifically goes badly?

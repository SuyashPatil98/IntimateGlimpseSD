---
title: Design Search Autocomplete
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]", "[[Distributed Caching]]"]
related: ["[[Search Ranking]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.13 ("Design Search Autocomplete System")
  - Google Search Autocomplete blog
tags: [system-design-interview, classic-design, search]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Search Autocomplete

## Executive Summary

Suggest top-K queries as the user types ("typeahead"). Each keystroke triggers a request; response must be <100 ms. Architecture: prefix tree (trie) backed by precomputed top-K-per-prefix, served from in-memory cache, with background pipelines updating from real query logs.

## Requirements

**Functional:** Suggest top 5–10 queries for prefix of length 1+. Sorted by frequency / personalization. Update from real queries with some delay.

**Non-functional:**
- p99 response <100 ms.
- 1 B queries/day → 10 k QPS avg, 30 k peak.
- Updates within hours.

## High-Level Design

```
client ──► API ──► Frontend cache (CDN/local LRU)
              │
              ▼
       Trie service (in-memory)
              ▲
              │ rebuild
              │
       Aggregation pipeline ◄── query log (Kafka)
              ▲
              │
       Spark batch top-K per prefix
```

## Design Deep Dive

### Data structure

- **Trie** (prefix tree) with each node storing **top-K** completions for the prefix ending there.
- Memory: tens of millions of unique queries; with top-10 each, a few GB. Fits in RAM.

### Build pipeline

- Stream of search queries → Kafka.
- Aggregate by query in a sliding window (e.g., last 7 days).
- Compute counts → per-prefix top-K.
- Build new trie snapshot → distribute to serving nodes.

### Serving

- Many small replicas (in-memory trie); load-balanced.
- Cache popular prefixes at the CDN edge.

### Personalization

- Layer user-specific predictions atop the global; combine at serving.

### Phrasing

- Stem / lowercase / unicode normalize.

### Cold start

- New queries take time to rise in counts; mitigate with exploration.

## Failure Modes

- **Trie rebuild too slow** — stale suggestions. Mitigation: incremental updates between full rebuilds.
- **Sensitive completions** ("how to commit fraud") — blocklist + ML filter.
- **Hot prefix** ("a") receives most queries — CDN cache eats it.
- **Spam injection via real queries** — filter + minimum threshold.

## Real Production

- **Google Suggest** — global + personalized; uses BigTable historically.
- **Bing** — similar.
- **Twitter**, **Amazon** — product autocomplete, similar architecture.
- **Elasticsearch suggesters** — generic library.

## Interview Talking Points

- Trie + top-K-per-node is the standard answer.
- Read-heavy → caching at every layer.
- Offline pipeline computes counts; serving is read-only.
- Sensitivity / abuse filtering.
- Personalization as a separate layer.

## Related Concepts

- [[Caching]] — front-line.
- [[Distributed Caching]] — for hot prefixes.
- [[Search Ranking]] — adjacent problem.

## Active Recall Questions

What data structure powers an autocomplete trie?::A prefix tree (trie) with each node storing the top-K completions for queries beginning with that prefix.

Why precompute top-K at each trie node rather than walk subtrees at query time?::Subtree aggregation at query time is too slow for sub-100ms p99; precomputation amortizes the cost into offline pipeline.

How fresh do autocomplete suggestions need to be?::Hours to days is typically acceptable; trade freshness for cost (full nightly rebuild + incremental hot-list updates).

How do you handle the hottest prefixes (single characters)?::CDN/edge caching — single-char results are the same for everyone, fully cacheable.

How do you prevent abuse (spam pushing offensive queries into suggestions)?::Apply blocklist + ML-based filter, plus minimum count threshold; manual review queue for borderline content.

What's the offline-to-online flow for building the trie?::Query log → Kafka → Spark aggregation (top-K per prefix) → trie snapshot → distribute to serving nodes via blue/green or atomic swap.

How do you add personalization on top of global suggestions?::Combine global top-K with user-history layer at serving time; small additional latency.

## Feynman Test

Explain why you can't just `SELECT query FROM logs WHERE query LIKE 'pre%' LIMIT 10 ORDER BY count DESC` at query time — what fails?

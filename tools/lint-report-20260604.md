# Lint Report — 2026-06-04

**Pages scanned:** 321 (7 meta, 314 concept)

## Summary

| Check | Findings |
|---|---|
| Broken wikilinks | 1 |
| Orphans (no inbound at all) | 8 |
| Soft orphans (only meta inbound) | 13 |
| Frontmatter issues | 35 |
| DAG cycles | 0 |
| Stale pages (>180 days) | 0 |
| Status-realism issues | 20 |

## Broken wikilinks

- **`[[SOLID Principles]]`** (1 references)
  - referenced from: `design-patterns`

## Orphans (no inbound from anywhere)

- `0001`
- `0002`
- `0003`
- `0004`
- `0005`
- `0006`
- `caching`
- `reflection_report`

## Soft orphans (only meta files link in)

- `architecture-patterns` ← only `_index`
- `case-studies` ← only `_index`
- `data-engineering` ← only `_index`
- `databases` ← only `_index`
- `design-patterns` ← only `_index`
- `distributed-systems` ← only `_index`
- `messaging` ← only `_index`
- `ml-systems` ← only `_index`
- `networking` ← only `_index`
- `reliability` ← only `_index`
- `software-engineering` ← only `_index`
- `storage` ← only `_index`
- `system-design-interview` ← only `_index`

## Frontmatter issues

- `0001`: no frontmatter
- `0002`: no frontmatter
- `0003`: no frontmatter
- `0004`: no frontmatter
- `0005`: no frontmatter
- `0006`: no frontmatter
- `architecture-patterns`: invalid status: active
- `architecture-patterns`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `caching`: invalid status: active
- `caching`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `case-studies`: invalid status: active
- `case-studies`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `data-engineering`: invalid status: active
- `data-engineering`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `databases`: invalid status: active
- `databases`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `design-patterns`: invalid status: active
- `design-patterns`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `distributed-systems`: invalid status: active
- `distributed-systems`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `messaging`: invalid status: active
- `messaging`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `ml-systems`: invalid status: active
- `ml-systems`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `networking`: invalid status: active
- `networking`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `reflection_report`: no frontmatter
- `reliability`: invalid status: active
- `reliability`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `software-engineering`: invalid status: active
- `software-engineering`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `storage`: invalid status: active
- `storage`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']
- `system-design-interview`: invalid status: active
- `system-design-interview`: missing fields: ['created', 'difficulty', 'last_reviewed', 'sources', 'tags', 'title']

## DAG cycles in prerequisites

_None._

## Stale pages

_None._

## Status realism (declared status missing required sections)

- `Airflow (case study)` (declared `mature`) missing: Architecture, Key Design Decisions
- `Apache Storm` (declared `mature`) missing: Key Design Decisions
- `Architecture Characteristics` (declared `mature`) missing: Design Tradeoffs
- `Availability Math` (declared `mature`) missing: Design Tradeoffs
- `Cache Strategies` (declared `mature`) missing: Core Intuition, Design Tradeoffs
- `Chubby` (declared `mature`) missing: Key Design Decisions
- `Dapper` (declared `mature`) missing: Why This Exists, Architecture
- `Design Rate Limiter` (declared `mature`) missing: Failure Scenarios
- `Design Unique ID Generator` (declared `mature`) missing: High-Level Design
- `GFS` (declared `mature`) missing: Why This Exists
- `HDFS` (declared `mature`) missing: Why This Exists
- `Isolation Levels` (declared `mature`) missing: Design Tradeoffs
- `Kafka Architecture` (declared `mature`) missing: Core Intuition
- `Memcached` (declared `mature`) missing: Key Design Decisions
- `OLTP vs OLAP` (declared `mature`) missing: Design Tradeoffs
- `Query Optimization` (declared `mature`) missing: Design Tradeoffs
- `Redis` (declared `mature`) missing: Key Design Decisions
- `Token Bucket` (declared `mature`) missing: Design Tradeoffs
- `Transactions` (declared `mature`) missing: Design Tradeoffs
- `Zookeeper` (declared `mature`) missing: Key Design Decisions

---
title: Design News Feed
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Caching]]", "[[Distributed Caching]]"]
related: ["[[Recommendation Systems]]", "[[Ranking Systems]]", "[[Pub-Sub]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.11 ("Design News Feed")
  - Facebook engineering — feed publication
  - Twitter engineering — timeline architecture
tags: [system-design-interview, classic-design, feed]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design News Feed

## Executive Summary

A news feed (Facebook, Twitter Home, Instagram) renders a ranked stream of posts from friends/follows for each user. The canonical interview pivot is **fanout-on-write vs fanout-on-read**, with hybrid for celebrity accounts. Heavy use of caching, ranked retrieval, and personalization.

## Requirements

**Functional:** User posts; followers see those posts in their feed; ranked (chronological or ML-ranked).

**Non-functional:**
- 1 B users; 500 M DAU.
- 100 M posts/day; 50 B reads/day.
- Feed load < 200 ms.
- Eventual consistency tolerable.

## Back-of-Envelope

- Write QPS: 100M / 86,400 ≈ 1.2 k/s, peak 4 k/s.
- Read QPS: 50B / 86,400 ≈ 600 k/s, peak 2 M/s.
- Read:write ≈ 500:1 — extreme read skew.

## Two Architectures

### Fanout-on-write (push)

When user posts: write post to DB; copy post-id into each follower's timeline cache.

**Pros:** read = single cache lookup (fast).
**Cons:** write amplification — Justin Bieber (500M followers) means 500M fanout writes per post; doesn't scale for celebrities.

### Fanout-on-read (pull)

When user reads feed: query DB for posts by all their followees, sort, return.

**Pros:** no write amplification.
**Cons:** read is heavy (many followees → many queries); doesn't scale per-read.

### Hybrid (the standard answer)

- Fanout-on-write for normal users.
- Fanout-on-read for celebrities (high follower count).
- At feed read time: merge cached timeline (from push) with on-demand celebrity posts (pull).

## High-Level Design

```
post ──► Post Service ──► Post DB
            │
            ▼
       Fanout Service
       (check celebrity flag)
            │
   ┌────────┴────────┐
   ▼                 ▼
 push to            stash for pull
 follower
 timelines
 (Redis)
            
read ──► Feed Service ──► Redis user timeline
            │
            ▼
        merge with celebrity posts (pull)
            │
            ▼
        Ranker (ML model) ──► return ordered feed
```

## Design Deep Dive

### Timeline cache (Redis)

- Per-user list of post-ids (newest first), capped at N (e.g., 500).
- LRU on users (active users prioritized).
- TTL on inactive users' timelines.

### Post storage

- Posts in sharded RDBMS or wide-column DB; partitioned by user_id.
- Hot recent posts cached.

### Ranking

- Chronological (Twitter Latest) — simple.
- ML-ranked (Twitter Home, Facebook Feed) — [[Ranking Systems]] with engagement features.
- Re-rank candidate timeline at read time (or precomputed).

### Pagination

- Cursor-based, not offset-based; stable in face of new posts.

### Delete propagation

- Mark deleted at post DB; consumers check; eventually purged from timelines.

## Failure Modes

- **Celebrity post slows fanout queue** — celebrities skip push; use pull path.
- **Cache miss storm** on user login — fallback to DB; pre-warm.
- **Inconsistency** (post visible to some not others) — eventually consistent; acceptable.
- **Ranking stale** — features lag; OK for engagement.

## Real Production

- **Facebook** — fanout-on-write + heavy ranking ML; News Feed.
- **Twitter** — "Tweetdeck" history of fanout patterns; pull for celebrities, push for normal.
- **Instagram** — similar to Twitter.
- **LinkedIn Feed** — push + ML rank.

## Interview Talking Points

- Read:write skew justifies fanout-on-write.
- Celebrity problem and hybrid solution.
- Ranking layer separated from feed assembly.
- Cursor pagination over offset.
- Eventual consistency tolerable.

## Related Concepts

- [[Recommendation Systems]] — feed ranking is a recommender.
- [[Ranking Systems]] — re-rank candidates.
- [[Caching]] — central to feed reads.
- [[Distributed Caching]] — Redis timeline shards.
- [[Pub-Sub]] — fanout queue.

## Active Recall Questions

What are the two canonical feed architectures, and what's the hybrid?::Fanout-on-write (push to follower caches; fast reads, write amplification for celebrities), fanout-on-read (query follows at read; cheap writes, heavy reads). Hybrid: push for normal users, pull for celebrities, merge at read.

Why is fanout-on-write expensive for celebrities?::A celebrity with 100M followers means 100M timeline writes per post; doesn't scale.

What's stored in the per-user timeline cache?::A capped list of post-ids (newest first, typically last 500); the post bodies are fetched separately.

Why cursor pagination over offset for feeds?::Stable in face of new posts inserting at head; offset shifts when posts arrive; cursors point to specific items.

What's the typical read-to-write ratio for news feeds?::Often 500:1 or higher; drives cache-heavy architecture.

How do deletes propagate in fanout-on-write systems?::Mark deleted in post DB; consumers filter at read time; lazy purge from timeline caches.

When should the ranker run?::Either precomputed during fanout (offline) or at read time over candidate set (online); modern feeds run a fast ranker at read time over precomputed candidates.

## Feynman Test

Justin Bieber posts. Walk through what happens for a normal follower's next feed load — what work happens at write time vs read time?

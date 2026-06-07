---
title: CDN Caching
aliases: ["CDN"]
area: caching
status: mature
difficulty: intermediate
prerequisites: ["[[Caching]]"]
related: ["[[Caching]]", "[[DNS]]", "[[Load Balancing]]"]
sources:
  - SDI vol 1, Ch. 9
  - system-design-primer
tags: [caching, cdn, networking]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# CDN Caching

## Executive Summary

A **Content Delivery Network (CDN)** is a **globally distributed network of edge servers caching content close to users**. Reduces latency (geographic proximity), origin load (most requests served from edge), and improves resilience. Originally for static content (images, JS, CSS); modern CDNs also cache **dynamic content, APIs, streaming video, and even compute at the edge**. Providers: **Cloudflare, Akamai, Fastly, AWS CloudFront, Google Cloud CDN**. Two basic strategies: **pull** (cache on first miss) and **push** (origin uploads).

## Why This Exists

A single origin in one region serves the world. Users in Australia hit a New York server with 200ms+ RTT. Multiply by all resources (HTML, JS, images) and pages take 3-5 seconds. CDNs put copies of content within 50ms of every user. Page loads drop to under a second. Origin load drops by 90%+.

## Core Intuition

Instead of one bookstore in New York shipping to readers worldwide, build 200 local bookstores. Readers walk in and get their book instantly. The publisher (origin) only handles new titles and restocks. Everyone wins on speed; the publisher wins on bandwidth.

## Internal Mechanics

**Request routing:**
- DNS: user's request resolves to nearest edge (via anycast or geo-routing).
- Anycast: same IP advertised from multiple locations; routes pick closest.

**Edge cache lookup:**
- Cache key includes URL, headers, query string.
- Hit → return.
- Miss → fetch from origin (or upstream edge).

**Cache duration:**
- `Cache-Control: max-age=N` from origin.
- TTL determines edge retention.
- Stale-while-revalidate / stale-if-error patterns.

**Invalidation:**
- "Purge" API removes specific URLs.
- Wildcard purges (entire path).
- Bulk-purge expensive; better: short TTL + revalidation.

**Strategies:**
- **Pull CDN** (most common) — edge fetches origin on miss.
- **Push CDN** — origin proactively uploads to edges (rare; bulk).

## Real Production Examples

- **Cloudflare** — largest CDN; security focus.
- **Akamai** — oldest; enterprise.
- **Fastly** — programmable edge (VCL).
- **AWS CloudFront** — integrated with AWS.
- **Google Cloud CDN** — Google's network.

## Design Tradeoffs

**Benefits:**
- Latency reduction (typically 10× faster).
- Origin load reduction.
- DDoS absorption.
- Geographic resilience.

**Costs:**
- Configuration complexity.
- Invalidation challenges.
- Cost (pay-per-bandwidth typically).
- Cache-bypass scenarios still hit origin.

## Interview Perspective

**Common questions:**
- "What's a CDN?" → Globally distributed edge cache; reduces latency and origin load.
- "Pull vs push CDN?" → Pull: cache on miss (most). Push: origin uploads (rare).
- "How is the nearest edge chosen?" → DNS routing (geo or anycast).

**Senior-level:**
- Modern CDNs are edge compute platforms (Cloudflare Workers, Fastly Compute@Edge), not just caches.
- Cache-key design is subtle: include too much in key → low hit ratio; too little → wrong content served.
- The stale-while-revalidate pattern is powerful — serve stale instantly, refresh in background.

**Common mistakes:**
- Too short TTL → low hit ratio + high origin load.
- Too long TTL → stale content visible.
- Including session cookies in cache key → no sharing.
- Forgetting that purges have propagation delay.

## Related Concepts

- [[Caching]] · [[DNS]] · [[Load Balancing]]

## Misconceptions

- **"CDNs only cache static content."** Modern CDNs cache HTML, APIs, even auth'd content.
- **"CDN solves performance."** Cache-bypass paths still need optimization.
- **"Purge is instant."** Propagation across edges takes seconds to minutes.

## Failure Scenarios

- **Cache-bypass storm** during cache reset.
- **Origin overwhelmed** if TTL is too short or cache-bypass spikes.
- **Stale content** after purge propagation delay.
- **Cache poisoning** — bad response cached for TTL duration.

## Practical Engineering Heuristics

- **Long TTLs for immutable assets** (hashed filenames).
- **Short TTLs + revalidation** for dynamic content.
- **Cache key minimal** — avoid per-user keys for shared content.
- **Test cache-miss scenarios** to ensure origin survives.
- **Use stale-while-revalidate** for smooth UX.

## Active Recall Questions

What's a CDN?::Content Delivery Network. Globally distributed edge servers caching content close to users.

Pull vs push CDN?::Pull: edge fetches origin on miss (most common). Push: origin uploads proactively (rare).

How is the nearest edge chosen?::DNS-based routing — geographic or anycast.

What's stale-while-revalidate?::Serve cached (possibly stale) response immediately; refresh in background. Smooth UX.

Why short TTL hurts origin?::Cache misses more often; origin overwhelmed.

What's a cache key?::Identifier for cached content. Combines URL, headers, query string. Design affects hit ratio.

## Feynman Test

Walk through what happens when a user in Tokyo requests an image hosted in New York. With and without a CDN.

Why is cache-key design one of the subtle CDN engineering problems?

## Mastery Checklist

- **Explain** CDN purpose and architecture.
- **Compare** pull and push CDNs.
- **Derive** appropriate TTL and cache-key for content.
- **Critique** CDN configurations causing cache misses.
- **Design** a CDN strategy for a web app.

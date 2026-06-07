---
title: Load Balancing Algorithms
area: networking
status: mature
difficulty: intermediate
prerequisites: ["[[Load Balancing]]"]
related: ["[[Load Balancing]]", "[[L4 vs L7 Load Balancing]]", "[[Consistent Hashing]]"]
sources:
  - SDI vol 1
  - system-design-primer
tags: [networking, load-balancing, algorithms]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Load Balancing Algorithms

## Executive Summary

A load balancer must pick which backend to send each request to. The **algorithm** governing this choice profoundly affects load distribution, latency, and fairness. Common algorithms: **Round Robin** (rotation), **Weighted Round Robin** (account for capacity), **Least Connections** (send where queue is shortest), **Least Response Time** (send where backend is fastest), **IP Hash** (consistent routing by client IP), **Consistent Hashing** (cache-friendly distribution), **Random**, **Power of Two Choices** (surprisingly good). Different workloads favor different algorithms.

## Why This Exists

Naïve round-robin distributes count of requests equally, ignoring backend capacity, current load, and request size. Real systems have heterogeneous backends and variable request sizes. Better algorithms account for these dynamics, producing better tail latency and resource utilization.

## Core Intuition

A maître d' seating diners. Strategies: rotate tables (round-robin); send to the emptiest (least-connections); send to whichever waiter is freest (least-response-time); send party of 4 to bigger tables (weighted). Each works in different contexts.

## The Algorithms

### Round Robin

Rotate through backends in order.

**Pros:** trivial; fair for homogeneous backends + uniform requests.
**Cons:** ignores load, capacity, request size.

### Weighted Round Robin

Each backend has a weight (capacity factor); rotation respects weights.

**Pros:** handles heterogeneous backends.
**Cons:** still ignores current load.

### Least Connections

Send to the backend with the fewest active connections.

**Pros:** balances actual load.
**Cons:** "connection" ≠ "work"; ignores variable processing times.

### Weighted Least Connections

Least connections normalized by backend weight.

### Least Response Time

Send to the backend with lowest measured latency.

**Pros:** picks fastest backend in real time.
**Cons:** measurement complexity; thundering herd to fast backend.

### IP Hash

Hash client IP → consistent backend.

**Pros:** sticky sessions for free; no central state.
**Cons:** uneven if IPs cluster (NAT, mobile).

### Consistent Hashing

Hash request key → consistent backend.

**Pros:** cache-friendly (same key → same backend); minimal disruption on backend changes.
**Cons:** more complex; hot keys still problematic.

### Random

Pick a random backend.

**Pros:** simple; statistically OK at scale.
**Cons:** ignores everything.

### Power of Two Choices (P2C)

Pick 2 backends randomly; send to the one with fewer connections.

**Pros:** **dramatically better than random**; near-optimal in many studies; cheap.
**Cons:** requires querying 2 backends' state.

## Real Production Examples

- **HAProxy** — supports all major algorithms.
- **Nginx** — round-robin default; least-conn, IP hash available.
- **Envoy** — sophisticated; P2C is default.
- **AWS ALB** — round robin + least outstanding requests.

## Design Tradeoffs

**Simple (round-robin, random):** trivial; bad under heterogeneity.

**Load-aware (least-conn, P2C):** better real-time distribution.

**Hash-based (IP, consistent):** sticky behavior; cache-friendly.

## Interview Perspective

**Common questions:**
- "Name load-balancing algorithms." → Round-robin, weighted RR, least-conn, IP hash, consistent hash, random, P2C.
- "When use consistent hashing?" → Cache layer where same key should hit same backend.
- "What's Power of Two?" → Pick 2 at random, send to less loaded. Surprisingly near-optimal.

**Senior-level:**
- P2C is dramatically better than random with almost the same overhead. Mitchell's "balls into bins" result.
- Least-response-time can stampede the fastest backend; use with care.
- Consistent hashing for cache fan-out is canonical for distributed caches.

**Common mistakes:**
- Round-robin under heterogeneous backends → unbalanced.
- Least-conn under variable request size → misleading.
- IP hash with corporate NAT → all employees on one backend.

## Related Concepts

- [[Load Balancing]] · [[Consistent Hashing]]

## Misconceptions

- **"Round robin is fair."** Equal count, not equal load.
- **"Least connections is best."** Variable request size confounds.
- **"Random is bad."** P2C makes it surprisingly good.

## Failure Scenarios

- **Stampede to fastest** under least-response-time.
- **Hot backend** under IP hash with NAT.
- **Imbalanced distribution** under wrong algorithm + heterogeneous backends.

## Practical Engineering Heuristics

- **Default to least-connections or P2C** for general workloads.
- **Use consistent hashing for cache fan-out.**
- **Weight backends explicitly** if heterogeneous.
- **Measure distribution** — bad algorithm shows in per-backend metrics.

## Active Recall Questions

Name five LB algorithms.::Round robin, weighted RR, least connections, least response time, IP hash, consistent hash, random, Power of Two Choices.

When is least-connections better than round-robin?::Heterogeneous backends or variable request sizes. Equalizes load, not just count.

What's Power of Two Choices?::Pick 2 backends randomly; send to less loaded one. Near-optimal balance with minimal overhead.

When use consistent hashing for LB?::Cache fan-out where same key should hit same backend repeatedly.

What's the IP hash failure with NAT?::Many users behind one IP → all routed to one backend → uneven load.

What's the trade-off of least-response-time?::Picks fastest backend; can stampede if all requests pile on fastest.

## Feynman Test

Compare round-robin and P2C for a heterogeneous fleet. Why does P2C help?

Why is consistent hashing the default algorithm for distributed cache fronting?

## Mastery Checklist

- **Explain** the main LB algorithms.
- **Compare** their behavior under various workloads.
- **Derive** appropriate algorithm for given conditions.
- **Critique** round-robin under heterogeneity.
- **Design** an LB tier with appropriate algorithm + weighting.

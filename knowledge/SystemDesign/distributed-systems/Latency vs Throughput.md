---
title: Latency vs Throughput
area: distributed-systems
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Performance vs Scalability]]", "[[Load Balancing]]", "[[Caching]]", "[[Messaging Fundamentals]]"]
builds_toward: ["[[Caching]]", "[[Messaging Fundamentals]]", "[[Rate Limiting]]"]
sources:
  - SDI vol 1, Ch. 2
  - DDIA, Ch. 1
  - Dean & Barroso, "The Tail at Scale", CACM 2013
  - Little, 1961
  - system-design-primer (Donne Martin)
tags: [distributed-systems, performance, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Latency vs Throughput

## Executive Summary

**Latency** is the time per single operation (how long does one request take?). **Throughput** is the rate of operations (how many requests per second?). They are *related but distinct* — and often in tension. Batching increases throughput at the cost of latency; pipelining can decouple them. Both must be characterized as **distributions** (p50, p95, p99, p999), not averages, because user experience and system behavior are dominated by tails.

## Why This Exists

"Fast" is ambiguous. A system processing 10,000 requests per second may have a typical request that takes 5 seconds (high throughput, high latency — a batch processor). A system processing 100 requests per second may have a typical request of 5ms (low throughput, low latency — an interactive service). Neither is "faster" — they optimize different axes. Distinguishing the two is essential for capacity planning, SLA design, and queueing analysis.

## Core Intuition

A highway analogy: **latency** is how long one car's trip takes; **throughput** is how many cars per hour reach their destination. A wider highway (more lanes) increases throughput. A higher speed limit reduces latency. These can be optimized independently — and they sometimes trade off (rush hour: throughput high, latency high).

Key insight: **average latency is almost never useful**. Tail latency (p99, p999) drives user experience and downstream cascading failures.

## Formal Definition

- **Latency** $L$: time elapsed from request initiation to completion, measured as a distribution. Reported as percentiles: $L_{p50}$, $L_{p95}$, $L_{p99}$, $L_{p999}$.
- **Throughput** $X$: operations completed per unit time, e.g., requests per second.

**Little's Law** relates them: in any stable system,

$$L = \frac{N}{X}$$

where $N$ is the average number of requests in flight (concurrency). Equivalently $N = X \cdot L$.

## Internal Mechanics

A system processes requests via a pipeline of stages. Each stage has its own latency contribution and throughput limit:

```
Request → [LB] → [App Server] → [DB] → Response
           5ms      20ms          50ms

  Total latency: ~75ms (sum of stages, serial)
  Throughput:    min(LB capacity, App capacity, DB capacity)
                                 (the slowest stage caps it)
```

**Trade-offs:**
- **Batching** — group N requests into one batch operation. Throughput ↑ (amortized overhead), latency ↑ (each request waits for batch to fill).
- **Pipelining** — overlap stages of multiple requests. Throughput ↑, latency unchanged.
- **Caching** — serve from cache. Latency ↓ for hits; throughput depends on hit rate.

## Architecture Diagrams

```
Utilization vs Latency (queueing theory, M/M/1):

  Latency
    ↑
    │                                ╱│
    │                              ╱  │ ← p99 explodes
    │                           ╱╱    │
    │                       ╱╱╱       │
    │                  ╱╱╱╱            │
    │___╱╱╱╱╱╱╱╱╱╱╱╱                   │
    └───────────────────────────────────┴──→ Utilization
   0%                                  100%

  At ~70% utilization, p99 latency typically begins growing nonlinearly.
  At ~85%+, the system becomes unstable.
```

## Mathematical Foundations

**Little's Law:** $L = N / X$. Stable system, any distribution. Foundational.

**Queueing theory (M/M/1):** for a single server with arrival rate $\lambda$ and service rate $\mu$:

$$L_{\text{mean}} = \frac{1}{\mu - \lambda}$$

As utilization $\rho = \lambda / \mu \rightarrow 1$, mean latency diverges. **This is why systems become unstable near 100% utilization** — small bursts produce unbounded latency growth.

Practical heuristic: target 50–70% utilization to keep p99 bounded.

## Design Tradeoffs

- **Optimizing latency:** keep request paths short, avoid synchronous waits, cache aggressively, pre-compute, parallelize within a request.
- **Optimizing throughput:** batch, async-ify, increase parallelism, scale horizontally, reduce per-request overhead.
- **They oppose at high utilization:** running hot maximizes throughput per dollar but explodes p99.

## Real Production Examples

- **Web request handlers:** latency-optimized (target <200ms). Throughput handled by horizontal scaling.
- **Hadoop MapReduce job:** throughput-optimized. Job latency might be hours; throughput is petabytes processed.
- **Kafka:** throughput-optimized (batching, sequential I/O). Latency higher than purely synchronous but acceptable for streaming.
- **Trading systems:** latency-optimized (microseconds). Throughput a distant second.
- **CDNs:** both — low latency via edge proximity, high throughput via distributed caching.

## Interview Perspective

**Common questions:**
- "Optimize for latency or throughput?" → Always ask: user-facing or batch? p99 budget? SLA?
- "Why is average latency misleading?" → User experience and downstream failures are tail-driven. A service with average 50ms but p99 of 2s is unacceptable for interactive use.
- "Explain Little's Law." → L = N/X, relates mean latency, throughput, concurrency. Capacity planning starts here.

**Senior-level:**
- Tail latency amplification (Dean & Barroso, "The Tail at Scale"): when a request fans out to many services, p99 of the aggregate is much worse than p99 of any single service. Fan-out 10 services each at p99=100ms → aggregate p99 often >300ms.
- Backpressure: when downstream is saturated, slow the upstream — don't let queues grow unbounded.
- Latency budgets: allocate a total latency budget across services in a request path; treat as a constraint, not a hope.

**Common mistakes:**
- Reporting mean latency instead of percentiles.
- Optimizing the wrong axis.
- Ignoring queueing behavior at high utilization.

## Related Concepts

- [[Performance vs Scalability]] — the coarser distinction.
- [[Load Balancing]] — primarily a throughput tool.
- [[Caching]] — primarily a latency tool.
- [[Messaging Fundamentals]] — async messaging trades latency for throughput.
- [[Linearizability]] — has a latency lower bound (Attiya–Welch).

## Misconceptions

- **"Latency = response time = throughput."** Related but distinct. Latency per-request; throughput aggregate; connected by Little's Law.
- **"Improving throughput improves latency."** Often the opposite. Batching, pipelining, queueing improve throughput at latency's expense.
- **"Average latency is the right metric."** No — use percentiles. The tail is the user's experience.

## Failure Scenarios

- **Hidden p99 explosion** under increasing load. Average looks fine until 80% utilization, then p99 grows nonlinearly. Mitigation: alert on percentile metrics, not averages.
- **Tail latency amplification** in fan-out architectures. One slow leaf kills the whole request. Mitigation: hedged requests, timeouts, partial responses.
- **Queue buildup** under transient overload. Mitigation: backpressure, load shedding, bounded queues with explicit drop policies.

## Practical Engineering Heuristics

- **Report p50, p95, p99, p999 — never just the average.**
- **Target ~70% steady-state utilization.** Headroom for bursts; avoids queueing explosion.
- **Cache for latency; batch for throughput.**
- **Set explicit latency budgets per service in a request path.**
- **Add timeouts everywhere.** A slow caller is worse than a fast failure.

## Active Recall Questions

What's the difference between latency and throughput?::Latency: time per single operation. Throughput: operations per unit time. Related but distinct.

State Little's Law.::L = N / X. Mean latency = average concurrency / throughput. Holds in any stable queueing system regardless of distribution.

Why is average latency misleading?::User experience and downstream cascading failures are driven by tail latency (p99, p999). A service with average 50ms but p99 of 2s is unacceptable for interactive use.

Why does latency explode near 100% utilization?::Queueing theory: as utilization ρ approaches 1, mean latency diverges (1/(μ−λ)). Small bursts produce unbounded queue growth.

What's tail latency amplification?
?
When a request fans out to many services, aggregate p99 is dominated by the slowest leaf. Even if each service has p99 = 100ms, fan-out of 10 services pushes aggregate p99 much higher (Dean & Barroso, "The Tail at Scale").

How does batching trade latency for throughput?::Batching amortizes per-operation overhead, increasing throughput. But individual requests wait for the batch to fill or for a timer to fire, increasing latency.

Target utilization for stable p99?::~50–70% in steady state. Higher saves cost but pushes the system into the queueing-explosion regime.

## Feynman Test

Explain to a non-engineer why "average latency is 100ms" is a near-useless statement on its own.

Walk through a scenario where optimizing throughput hurts user experience, and propose how to design around it.

What does the latency-vs-utilization curve look like, and why does it bend?

## Mastery Checklist

- **Explain** latency vs throughput with Little's Law.
- **Compare** how batching, pipelining, and caching affect each.
- **Derive** required capacity from a latency target + throughput target.
- **Critique** SLAs that quote average latency.
- **Design** a system with explicit per-service latency budgets and percentile-based monitoring.

[^Little]: Little, "A Proof for the Queuing Formula L = λW," 1961.
[^Dean-Tail]: Dean & Barroso, "The Tail at Scale," Communications of the ACM, 2013.

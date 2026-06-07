---
title: RED Method
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[Metrics]]"]
related: ["[[USE Method]]", "[[Metrics]]", "[[Observability]]", "[[SLO]]"]
sources:
  - Tom Wilkie blog (Weaveworks)
tags: [reliability, methodology, services]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# RED Method

## Executive Summary

The **RED Method** (Tom Wilkie) is a methodology for monitoring **services by tracking Rate, Errors, and Duration**. Where [[USE Method]] focuses on resources (CPU, disk), RED focuses on the **service's request behavior**: how many requests, how many fail, how long do they take. Foundation of microservices monitoring; aligns with [[SLO|SLOs]]. Three metrics that universally apply to any request-response service.

## Why This Exists

Microservices need consistent monitoring across services. Each service has different internals but shared behavior: it receives requests and responds. RED captures this universally: rate, errors, duration. Standardizes monitoring across services.

## Core Intuition

A coffee shop. Three numbers tell you everything: drinks per minute (rate), botched orders (errors), wait time (duration). Don't need to know the internals; the three together tell you health.

## The Three Metrics

**Rate (R):**
- Requests per second.
- Indicates load.

**Errors (E):**
- Failing requests per second (or fraction).
- Indicates failure rate.

**Duration (D):**
- Distribution of request latency.
- Use percentiles (p50, p95, p99), not average.

## RED vs USE

| Aspect | RED | USE |
|---|---|---|
| Focus | Services (requests) | Resources (CPU, disk) |
| Use | Service health | System health |
| Metrics | Rate, Errors, Duration | Utilization, Saturation, Errors |
| Originator | Tom Wilkie | Brendan Gregg |

Use both: RED to see if service is healthy from user POV; USE to find the resource bottleneck.

## Alignment with SLOs

RED metrics map directly to common SLOs:
- Availability SLO: 1 - (Errors / Rate).
- Latency SLO: Duration p99 < threshold.

This is why RED is the natural foundation for SLO-driven engineering.

## Real Production Examples

- **Most modern service dashboards** organize around R, E, D.
- **Prometheus + Grafana standard dashboards.**
- **Datadog APM** automatically generates RED metrics.

## Design Tradeoffs

**Benefits:**
- Universal applicability.
- Aligns with SLOs.
- Concise (3 metrics).
- Cross-service comparability.

**Costs:**
- Doesn't show internal bottlenecks (use USE for that).
- Coarse — drill into spans for details.

## Interview Perspective

**Common questions:**
- "What's RED?" → Rate, Errors, Duration. Service-level monitoring.
- "RED vs USE?" → RED: services. USE: resources. Use both.
- "Why use RED?" → Universal service-health metrics, aligns with SLOs.

**Senior-level:**
- RED is the dashboard layout standard for microservices.
- Duration must be percentiles, not averages.
- RED + USE = full coverage.

**Common mistakes:**
- Average duration (use p99).
- Missing one of the three.
- RED metrics not aligned with SLOs.

## Related Concepts

- [[USE Method]] · [[Metrics]] · [[Observability]] · [[SLO]] · [[Latency vs Throughput]]

## Misconceptions

- **"RED = SLOs."** Foundation, not equivalent.
- **"Average duration is fine."** Use percentiles.
- **"RED replaces USE."** Complementary.

## Failure Scenarios

- **Average latency** hides p99 issues.
- **No error breakdown** by status code.
- **Rate not segmented** by endpoint.

## Practical Engineering Heuristics

- **RED dashboard per service.**
- **Percentiles for Duration.**
- **Errors broken down by type.**
- **Rate by endpoint.**
- **RED + USE together.**

## Active Recall Questions

What's RED Method?::Rate, Errors, Duration — three metrics for service monitoring. Tom Wilkie.

RED vs USE?::RED: service-level (requests). USE: resource-level (CPU, disk).

Why use percentiles for Duration?::Averages hide tail latency. p99 shows user pain.

How does RED align with SLOs?::Directly. Availability = 1 - errors/rate. Latency SLO = duration percentiles.

When use RED?::Service-level monitoring; especially microservices.

When use USE?::System-level performance investigation; resource bottlenecks.

## Feynman Test

Design a RED dashboard for a payment service.

Why must Duration use percentiles, not averages?

## Mastery Checklist

- **Explain** RED methodology.
- **Compare** RED and USE.
- **Derive** RED metrics for given service.
- **Critique** average-only dashboards.
- **Design** monitoring dashboard combining RED + USE.

---
title: SLI
aliases: [Service Level Indicator]
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[SLO]]", "[[SLA]]", "[[Observability]]"]
sources:
  - SWE@Google, SRE book
tags: [reliability, sre, sli, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# SLI (Service Level Indicator)

## Executive Summary

A **Service Level Indicator (SLI)** is a **quantitative measure of some aspect of a service's behavior** — the metric underlying an [[SLO]]. Common SLIs: **availability** (fraction of successful requests), **latency** (p99 response time), **error rate**, **throughput**, **freshness**, **correctness**, **durability**. Choosing the right SLIs is the foundation of meaningful reliability engineering. Bad SLIs produce bad SLOs which produce bad engineering decisions.

## Why This Exists

You can't manage what you don't measure. SLOs are useless without underlying SLIs to compute them. The choice of SLI determines what "reliability" means for your service. A poorly chosen SLI (e.g., "CPU usage") doesn't reflect user experience; a well-chosen SLI ("fraction of homepage loads that succeed within 1s") does.

## Core Intuition

Vital signs in a hospital: heart rate, blood pressure, oxygen saturation. Each is a quantitative measure of a patient's state. SLIs are vital signs for services: chosen specifically to reflect health from the user's perspective.

## Internal Mechanics

**Form:** SLI = good_events / total_events (typically a ratio).

**Common SLIs:**

| SLI | Definition |
|---|---|
| Availability | Successful requests / total requests |
| Latency | Fraction of requests faster than N ms |
| Error rate | Failed requests / total requests |
| Throughput | Requests per second |
| Freshness | Fraction of data younger than N seconds |
| Correctness | Successful outcomes / total outcomes |
| Durability | Data retained / total data |

**Measurement:**
- Where? Edge LB? App server? Client? Each gives different numbers.
- What counts as "good"? Need precise definition.

## Choosing SLIs

**Good SLIs:**
- Tied to user experience.
- Measurable.
- Actionable when violated.

**Bad SLIs:**
- Internal metrics (CPU, memory) — symptoms, not user impact.
- Composite that hide details (overall availability with no breakdown).
- Unmeasurable in production.

## Design Tradeoffs

**Benefits:**
- Quantifies reliability.
- Foundation for SLOs.
- Aligns engineering with user experience.

**Costs:**
- Measurement infrastructure cost.
- Choosing wrong metric misleads.
- Multiple SLIs needed per service.

## Real Production Examples

- **Google SRE book** — canonical SLI guidance.
- **Cloud providers** — publish SLIs for managed services.
- **OpenTelemetry, Prometheus** — measurement platforms.

## Interview Perspective

**Common questions:**
- "What's an SLI?" → Quantitative measure of service behavior. Foundation of SLOs.
- "Examples?" → Availability, latency, error rate, throughput, freshness, correctness.
- "Bad SLI examples?" → Internal metrics (CPU) — don't reflect user experience.

**Senior-level:**
- The choice of SLI is more consequential than the SLO value.
- Multiple SLIs per service: availability + latency + correctness typically.
- Measure SLIs where users see them — at the LB or edge.

**Common mistakes:**
- Measuring internal metrics, calling them SLIs.
- Single SLI hiding important details.
- SLIs measured in places users don't see.

## Related Concepts

- [[SLO]] · [[SLA]] · [[Observability]]

## Misconceptions

- **"SLI = metric."** SLIs are a subset of metrics — user-facing, reliability-relevant ones.
- **"More SLIs = better."** Pick a few critical ones.
- **"CPU is a good SLI."** No — it's a symptom, not user impact.

## Failure Scenarios

- **Wrong SLI** misrepresents actual experience.
- **Measurement gaps** under failure modes.
- **SLI computed wrong** (e.g., excluding error responses).

## Practical Engineering Heuristics

- **Tie SLIs to user experience.**
- **Measure at edge** (where users see it).
- **3-5 SLIs per service** typically.
- **Document SLI precisely** — what counts as good?
- **Test SLI measurement** during incidents.

## Active Recall Questions

What's an SLI?::Service Level Indicator. Quantitative measure of service behavior. Foundation for SLOs.

Name five common SLIs.::Availability, latency, error rate, throughput, freshness, correctness, durability.

What's a bad SLI?::Internal metrics (CPU, memory) that don't reflect user experience.

Where measure SLIs?::At the edge, where users see them — typically the LB or load balancer.

How many SLIs per service?::3-5 typically: availability + latency + correctness + workload-specific.

What's the SLI form?::Good events / total events. Typically a ratio.

## Feynman Test

Design SLIs for a video streaming service. What metrics; measured where; what counts as good?

Why is "CPU usage" a bad SLI even though it's measurable?

## Mastery Checklist

- **Explain** SLIs and their role.
- **Compare** SLIs and internal metrics.
- **Derive** appropriate SLIs for a service.
- **Critique** SLIs not tied to user experience.
- **Design** SLI suite for a real service.

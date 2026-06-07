---
title: Observability
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Logs]]", "[[Metrics]]", "[[Distributed Tracing]]", "[[USE Method]]", "[[RED Method]]", "[[SLO]]"]
builds_toward: ["[[Logs]]", "[[Metrics]]", "[[Distributed Tracing]]"]
sources:
  - SWE@Google, SRE book
  - Charity Majors (Honeycomb)
  - SDI vol 1
tags: [reliability, observability, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Observability

## Executive Summary

**Observability** is the property of a system that lets you **understand its internal state from its external outputs**, particularly to debug problems you've never seen before. Distinguished from **monitoring** (which alerts on known failure modes) — observability lets you explore *unknown unknowns*. Built on **three pillars: logs, metrics, distributed traces** (and increasingly **events** and **profiles**). Modern tooling: **Prometheus, Grafana, Jaeger, Honeycomb, Datadog, OpenTelemetry**. Critical for distributed systems where failures emerge from complex interactions.

## Why This Exists

Modern systems have too many components, too many interactions, too many failure modes to predict every alert in advance. Monitoring catches known issues; observability lets you diagnose novel ones. Without observability, distributed-systems debugging is guesswork.

## Core Intuition

A doctor with vital signs alone can spot known conditions (high BP, fever). With imaging, blood tests, history — they can diagnose new conditions never seen. Observability is the imaging + tests of software systems: rich enough data to investigate any question.

## The Three Pillars

### Logs

Discrete event records — when, who, what.

**Pros:** detailed; preserve event order; easy to search.
**Cons:** voluminous; expensive at scale; per-event focus.

### Metrics

Aggregated numeric measurements over time.

**Pros:** cheap to store; easy to alert on; trend analysis.
**Cons:** pre-aggregated (cardinality limits); coarse-grained.

### Distributed Traces

Causal chains showing one request flowing through services.

**Pros:** show end-to-end behavior; identify bottlenecks.
**Cons:** sampling needed; complex tooling.

## Observability vs Monitoring

| Property | Monitoring | Observability |
|---|---|---|
| Question | "Is X failing?" | "Why is X behaving this way?" |
| Knowns | Known failure modes | Unknown unknowns |
| Tools | Dashboards, alerts | Trace exploration, ad-hoc queries |
| Style | Predefined | Exploratory |

Modern practice integrates both.

## Internal Mechanics

**Structured logs:**
- JSON/key-value; not free text.
- High-cardinality fields (user_id, request_id).

**Metrics:**
- Counters, gauges, histograms.
- Labels for dimensions.

**Traces:**
- Each request has trace_id; spans for sub-operations.
- Parent-child span relationships show causality.

**Correlation:**
- Logs + metrics + traces tied by trace_id, request_id.
- Modern tooling correlates automatically (OpenTelemetry).

## Real Production Examples

- **Prometheus + Grafana** — metrics + dashboards.
- **Jaeger / Zipkin** — distributed tracing.
- **ELK / Loki** — log aggregation.
- **Honeycomb** — observability for high-cardinality.
- **Datadog, New Relic, Dynatrace** — commercial all-in-one.
- **OpenTelemetry** — open standard for instrumentation.

## Design Tradeoffs

**Benefits:**
- Debug unknown failure modes.
- Reduce MTTR.
- Performance investigation.
- Capacity planning.

**Costs:**
- Storage and processing cost.
- Tool complexity.
- Cardinality limits.
- Instrumentation effort.

## Interview Perspective

**Common questions:**
- "Three pillars of observability?" → Logs, metrics, distributed traces.
- "Observability vs monitoring?" → Monitoring: known issues, alerts. Observability: investigate unknown.
- "What's OpenTelemetry?" → Open standard for instrumentation (libraries + protocols).

**Senior-level:**
- High-cardinality observability (per-user, per-request dimensions) is the modern direction; Honeycomb pioneered.
- Sampling traces is essential at scale; head-based vs tail-based has trade-offs.
- "You can't observe what you don't instrument" — observability requires upfront work.

**Common mistakes:**
- Only metrics, no traces/logs.
- Free-text logs (hard to query).
- No correlation across pillars.

## Related Concepts

- [[Logs]] · [[Metrics]] · [[Distributed Tracing]] · [[USE Method]] · [[RED Method]] · [[SLO]]

## Misconceptions

- **"Observability = monitoring."** Different; complementary.
- **"More data = better observability."** Useful data is what matters.
- **"Logs are enough."** Need metrics for SLOs, traces for distributed flows.

## Failure Scenarios

- **Missing instrumentation** when needed.
- **High-cardinality explosion** in metrics.
- **Sampling missed the bug.**
- **Logs without structure** → unqueryable.

## Practical Engineering Heuristics

- **Instrument early.**
- **Structured logging from day 1.**
- **OpenTelemetry standard.**
- **Correlate across pillars** (request_id everywhere).
- **Sample traces; full metrics.**

## Active Recall Questions

What are the three pillars of observability?::Logs, metrics, distributed traces. Sometimes extended: events, profiles.

Observability vs monitoring?::Monitoring: predefined alerts for known failures. Observability: exploratory; debug unknown unknowns.

What's OpenTelemetry?::Open standard for instrumentation. Libraries + protocols for metrics, logs, traces.

Why are logs voluminous?::Per-event detail; high write volume; long retention. Expensive at scale.

Why sample traces?::Storing every trace at scale is too expensive. Sample at head (per-trace) or tail (after seeing the request).

Name three observability tools.::Prometheus, Grafana, Jaeger, Honeycomb, Datadog, OpenTelemetry.

## Feynman Test

A distributed system has a mysterious p99 latency spike. How does observability help?

Why is "monitoring is sufficient" wrong for modern distributed systems?

## Mastery Checklist

- **Explain** observability and three pillars.
- **Compare** with monitoring.
- **Derive** appropriate instrumentation for given service.
- **Critique** observability gaps.
- **Design** observability stack using OpenTelemetry.

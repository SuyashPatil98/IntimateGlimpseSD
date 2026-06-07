---
title: Distributed Tracing
area: reliability
status: mature
difficulty: advanced
prerequisites: ["[[Observability]]", "[[Microservices]]"]
related: ["[[Observability]]", "[[Logs]]", "[[Metrics]]", "[[Dapper]]"]
sources:
  - Google Dapper paper, 2010
  - OpenTelemetry docs
tags: [reliability, observability, tracing]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Distributed Tracing

## Executive Summary

**Distributed tracing** captures the **end-to-end flow of a single request through multiple services** — recording each operation as a "span," linked by parent-child relationships into a "trace." Originated with Google's Dapper (2010). Essential for microservices debugging: where is latency? Which service failed? What was the call graph? Implementations: **Jaeger, Zipkin, OpenTelemetry, AWS X-Ray, Honeycomb, Tempo, Datadog APM**.

## Why This Exists

In a microservices request crossing 10 services, logs and metrics show that *something* is slow — but not which call, where the time went, what depended on what. Distributed tracing answers: "Show me this request as it flowed through the system." Without it, microservices debugging is guesswork.

## Core Intuition

A package's tracking. Picked up here, scanned at warehouse A, transferred to warehouse B, delivered. You see every stop, every delay, every handoff. Distributed tracing tracks a request the same way: every service it visits, every operation inside, every elapsed time.

## Internal Mechanics

**Concepts:**
- **Trace** — one logical request from entry to completion.
- **Span** — one unit of work (HTTP call, DB query, function).
- **Trace ID** — identifies the whole trace.
- **Span ID** — identifies one span.
- **Parent Span ID** — establishes the call hierarchy.

**Propagation:**
- Trace context carried in headers (e.g., `traceparent` per W3C Trace Context).
- Each service reads context, creates child span, propagates downstream.

**Sampling:**
- Cannot store every trace at scale.
- **Head-based:** sample at trace start (e.g., 1%).
- **Tail-based:** wait for trace completion; sample based on outcome (errors, slow traces).

## Architecture Diagrams

```
Trace ID: abc123

Service A: [───── span 1 (300ms) ────]
              │
              ├── Service B: [── span 2 (150ms) ──]
              │                  │
              │                  └── DB: [─ span 3 (50ms) ─]
              │
              └── Service C: [── span 4 (100ms) ──]

  Total trace: 300ms, dominated by Service B's DB query (50ms) + processing.
```

## Real Production Examples

- **Jaeger** — open source; popular.
- **Zipkin** — older OSS.
- **AWS X-Ray** — managed.
- **OpenTelemetry** — standard.
- **Honeycomb, Datadog APM** — commercial.

## Design Tradeoffs

**Benefits:**
- End-to-end visibility.
- Identify bottlenecks.
- Debug distributed flows.
- Pinpoint failure source.

**Costs:**
- Instrumentation effort.
- Storage cost (mitigated by sampling).
- Performance overhead (1-5%).
- Tooling complexity.

## Interview Perspective

**Common questions:**
- "What's distributed tracing?" → Capture end-to-end request flow as linked spans.
- "Trace vs span?" → Trace: whole request. Span: one unit of work within.
- "Sampling?" → Head (per-trace) or tail (after seeing trace).

**Senior-level:**
- Dapper paper (2010) is the canonical reference.
- Tail-based sampling lets you keep all interesting (error/slow) traces.
- OpenTelemetry has converged the industry on one standard.

**Common mistakes:**
- Spotty instrumentation — gaps in trace.
- Head-sampling missing rare errors.
- No correlation with logs.

## Related Concepts

- [[Observability]] · [[Logs]] · [[Metrics]] · [[Microservices]]

## Misconceptions

- **"Trace = log."** Trace shows causal chain; log is point event.
- **"Sample == lose data."** Sample smartly = keep what matters.
- **"OpenTracing = OpenTelemetry."** OpenTelemetry merged OpenTracing + OpenCensus.

## Failure Scenarios

- **Instrumentation gap** → broken trace.
- **Head-sample missed** important traces.
- **Trace storage saturated.**

## Practical Engineering Heuristics

- **OpenTelemetry from day 1.**
- **Trace context propagation everywhere.**
- **Tail-based sampling** for production at scale.
- **Correlate with logs via trace_id.**

## Active Recall Questions

What's a distributed trace?::End-to-end record of a single request flowing through multiple services. Made up of spans.

What's a span?::One unit of work — HTTP call, DB query, function. Linked to parent by span ID.

Head vs tail sampling?::Head: decide at trace start (e.g., 1%). Tail: decide after seeing the trace (keep errors, slow ones).

What standard merged OpenTracing and OpenCensus?::OpenTelemetry.

What was the canonical Dapper paper?::Google's Dapper paper (2010) — origin of modern distributed tracing.

Name three distributed tracing tools.::Jaeger, Zipkin, AWS X-Ray, Honeycomb, Datadog APM, Tempo.

## Feynman Test

A request takes 5 seconds. Walk through using distributed tracing to find why.

Why is tail-based sampling generally better than head-based at scale?

## Mastery Checklist

- **Explain** distributed tracing and spans.
- **Compare** with logs and metrics.
- **Derive** appropriate sampling strategy.
- **Critique** spotty instrumentation.
- **Design** tracing strategy for microservices.

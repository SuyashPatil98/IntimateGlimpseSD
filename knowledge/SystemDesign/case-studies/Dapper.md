---
title: Dapper
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Distributed Tracing]]"]
related: ["[[Observability]]"]
builds_toward: []
sources:
  - Sigelman et al. "Dapper, a Large-Scale Distributed Systems Tracing Infrastructure" (Google Tech Report 2010)
  - Brendan Burns / SRE writings
tags: [case-study, observability, tracing, google]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Dapper

## Executive Summary

**Google Dapper** (Sigelman et al., 2010 tech report) is the foundational paper of [[Distributed Tracing]]. It established the **trace + span** model now standard in OpenTelemetry, Jaeger, Zipkin, Honeycomb, and every modern tracing system. Three design pillars: **low overhead** (sampling), **application-level transparency** (no app code changes), **ubiquitous deployment** across Google.

## Why It Existed

At Google, a single user request touched thousands of services (Search → Ads → Spelling → KV stores → ML). Debugging "this request is slow" was impossible without cross-service visibility. Logs alone didn't reconcile across services.

## The Model

- **Trace** — a single end-to-end request, identified by a trace ID.
- **Span** — a unit of work within a service (e.g., "DB query", "HTTP call"); has start/end, parent span id, annotations.
- **Trace tree** — spans form a tree rooted at the entry point.

```
root span (trace_id=T)
   ├── child span (RPC to service B)
   │      └── grandchild span (B's DB call)
   └── child span (RPC to service C)
```

## How It Worked

- **Context propagation** — trace_id and parent_span_id flow with every RPC, injected by Google's RPC library (essentially Stubby / gRPC).
- **Sampling** — only ~0.01% of traces collected end-to-end; on hot paths, sub-rate is dynamic.
- **Aggregation** — span data shipped to BigTable for storage; query UI for trace inspection.
- **Annotations** — apps can attach key-value pairs for context.

## Key Design Decisions

### Low overhead

- Sub-percent CPU and bandwidth cost.
- Achieved via aggressive sampling + lightweight span recording.

### Application-level transparency

- App code untouched — instrumentation lives in RPC framework, threading library, common libraries.
- Engineers don't write "start_span/end_span" everywhere.

### Sampling

- Constant low rate (e.g., 0.1%) preserves statistical visibility while keeping cost down.
- Detailed paths can be force-traced.
- Tail-based sampling (e.g., keep traces with errors / slow) added in later systems.

### Trace storage

- Bigtable for raw spans + per-service indexes.
- TTL on traces.

## Strengths

- Universal at Google — every team uses it for performance debugging.
- Demonstrated end-to-end tracing was practical at planetary scale.
- Provided a **template** every subsequent tracing system adopted.

## Weaknesses (acknowledged in paper)

- **Sampling means rare events may not be traced** — for one-in-a-million errors, you need head-or-tail-based sampling.
- **Cross-system propagation requires consistent libraries** — Google had Stubby/gRPC everywhere; harder in mixed-stack orgs.
- **App-level annotations require engineer discipline** — without them, traces are shallow.

## Influence

- **Zipkin** (Twitter, 2012) — open-source clone.
- **Jaeger** (Uber, 2016) — CNCF-graduated.
- **OpenTracing** → **OpenTelemetry** — standard APIs/SDKs.
- **Honeycomb** — high-cardinality structured observability descendant.
- **Cloud-managed**: AWS X-Ray, GCP Cloud Trace, Datadog APM, Lightstep.

## Lessons

- The (trace, span) model + context propagation + sampling = the canonical architecture.
- Framework-level instrumentation is the only path to ubiquity — manual is sparse.
- Sampling is a feature, not a regret — full collection is economically and operationally untenable.
- "Single-trace deep dive" + "aggregate latency analysis" are the two big use cases; tools must support both.

## Related Concepts

- [[Distributed Tracing]] — abstract concept.
- [[Observability]] — three pillars context.
- [[RED Method]] / [[USE Method]] — adjacent metrics frameworks.

## Active Recall Questions

What is Dapper's trace + span model?::A trace is one end-to-end request identified by a trace ID; a span is a unit of work within a service with start/end, parent reference, annotations; spans form a tree per trace.

What three design principles did Dapper prioritize?::Low overhead (sampling), application-level transparency (instrumentation in shared libs/RPC framework, not app code), ubiquitous deployment (across all services).

How is Dapper context propagated across services?::trace_id and parent_span_id are injected by the RPC framework (Stubby/gRPC) and flow through every cross-service call.

Why is sampling necessary in production tracing?::Full trace collection at planetary QPS would saturate storage and bandwidth; sub-percent sampling preserves statistical visibility while keeping cost negligible.

What systems are direct descendants of Dapper?::Zipkin (Twitter, 2012), Jaeger (Uber, 2016), OpenTracing → OpenTelemetry; commercial: Datadog APM, Lightstep, Honeycomb (with cardinality emphasis), AWS X-Ray, GCP Cloud Trace.

What's a key limitation of head-based sampling that tail-based sampling addresses?::Head sampling picks at request start, before knowing if the request errored or was slow; tail-based decides after, so rare-but-interesting traces (errors, slow ones) can be preferentially kept.

Why is framework-level instrumentation crucial?::Manual instrumentation is sparse and inconsistent across teams; if the RPC library/threading library auto-instruments, every service gets traces without app changes.

## Feynman Test

A team adds "structured logs with request_id" to every service and thinks they've achieved tracing. Explain to them what Dapper-style tracing gives them that correlated logs don't.

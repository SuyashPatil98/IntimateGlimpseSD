---
title: Logs
area: reliability
status: mature
difficulty: beginner
prerequisites: ["[[Observability]]"]
related: ["[[Observability]]", "[[Metrics]]", "[[Distributed Tracing]]"]
sources:
  - SRE book
  - 12-factor app
tags: [reliability, observability, logs]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Logs

## Executive Summary

**Logs** are **discrete, time-stamped event records** describing what happened, when, and (ideally) why. The oldest observability pillar. Modern practice: **structured logs** (JSON/key-value, not free text), **centralized aggregation** (ELK stack, Loki, Splunk, Datadog), **correlation IDs** (request_id, trace_id) to tie related events together. Trade-offs: detailed but expensive; voluminous at scale; per-event focus.

## Why This Exists

When something goes wrong, you need a record of what happened. Logs are the most natural form: write it down as it happens. Predates structured monitoring; still essential. Modern logs aren't just for humans — they're queried, alerted on, joined to other observability signals.

## Core Intuition

A ship's log. The captain writes entries as events occur. After an incident, investigators read the log to understand the sequence. Software logs are the same: a continuous record of what the system saw and decided.

## Internal Mechanics

**Structured log entry:**
```json
{
  "timestamp": "2026-06-02T10:23:45Z",
  "level": "INFO",
  "service": "checkout",
  "trace_id": "abc123",
  "user_id": "u-456",
  "event": "payment_authorized",
  "amount": 99.99,
  "duration_ms": 145
}
```

**Levels (in order of urgency):**
- TRACE / DEBUG — verbose, dev only.
- INFO — normal operations.
- WARN — anomalies that aren't failures.
- ERROR — failures.
- FATAL — severe failures.

**Aggregation:**
- App writes to stdout/stderr.
- Log shipper (Fluentd, Vector) sends to central store.
- Central store (Elasticsearch, Loki, Splunk) indexes and queries.

## Design Tradeoffs

**Benefits:**
- Detailed event-level visibility.
- Audit trail.
- Easy to search.
- Familiar to developers.

**Costs:**
- High storage cost.
- Index expensive.
- Sensitive data leakage risk.
- Volume management.

## Real Production Examples

- **ELK Stack** — Elasticsearch + Logstash + Kibana.
- **Loki** — Grafana's; cheaper.
- **Splunk** — enterprise.
- **Datadog Logs.**
- **Vector, Fluentd** — log shippers.

## Interview Perspective

**Common questions:**
- "Log best practices?" → Structured, correlation IDs, appropriate level, avoid PII.
- "Why structured?" → Queryable; aggregatable; machine-parseable.
- "Log volume challenges?" → Storage cost, indexing cost, signal-to-noise.

**Senior-level:**
- High-cardinality observability tools (Honeycomb) blur the line between logs and metrics.
- "Log everything" is expensive — sampling + ratios matter.
- Sensitive data (passwords, tokens, PII) leaking into logs is a recurring incident cause.

**Common mistakes:**
- Free-text logs (unqueryable).
- Logging passwords/tokens.
- No correlation IDs.
- Too verbose at INFO level.

## Related Concepts

- [[Observability]] · [[Metrics]] · [[Distributed Tracing]]

## Misconceptions

- **"Logs are for humans."** Mostly for machines now.
- **"More logs = better."** Signal-to-noise matters.
- **"Logs replace metrics/traces."** Each pillar has its strengths.

## Failure Scenarios

- **Log storage saturated** → recent events lost.
- **PII leak** in logs.
- **No correlation IDs** — hard to trace a request.

## Practical Engineering Heuristics

- **Structured logs (JSON).**
- **Always include correlation IDs.**
- **Sanitize PII before logging.**
- **Log at appropriate level.**
- **Use sampling for high-volume INFO.**

## Active Recall Questions

What's a log entry?::Time-stamped record of a discrete event with context (service, level, trace_id, message, etc.).

Why structured logs?::Queryable, aggregatable, machine-parseable. Free text is much harder to use.

Common log levels?::TRACE, DEBUG, INFO, WARN, ERROR, FATAL.

What's a correlation ID?::Identifier (trace_id, request_id) tying related logs across services to one logical operation.

Common log aggregation tools?::ELK (Elasticsearch+Logstash+Kibana), Loki, Splunk, Datadog.

What sensitive data should never be logged?::Passwords, tokens, full credit card numbers, SSNs, anything PII unless explicitly required (and even then, carefully).

## Feynman Test

A request fails. Walk through using logs to diagnose.

Why is "log everything" expensive and counterproductive?

## Mastery Checklist

- **Explain** logs and their role.
- **Compare** structured vs free-text.
- **Derive** appropriate logging strategy.
- **Critique** logging anti-patterns.
- **Design** logging architecture with shippers and central store.

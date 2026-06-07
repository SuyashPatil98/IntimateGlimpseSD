---
title: Circuit Breakers
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Bulkheads]]", "[[Retries]]", "[[Rate Limiting]]", "[[Failure Detection]]"]
sources:
  - Michael Nygard, "Release It!"
  - FoSA
  - Netflix Hystrix
tags: [reliability, resilience, circuit-breaker]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Circuit Breakers

## Executive Summary

The **Circuit Breaker pattern** (Michael Nygard, "Release It!") **stops calling a failing dependency to prevent cascading failures**. Like an electrical circuit breaker: when failure exceeds threshold, "trip" the breaker (fail fast); after a cooldown, allow a probe; if successful, close the breaker (resume normal). Three states: **closed** (normal), **open** (failing fast), **half-open** (probing). Prevents the calling service from wasting threads on a downed dependency and gives the dependency time to recover.

## Why This Exists

When a dependency fails, naive retry behavior makes things worse: every request waits for timeout, ties up threads, eventually exhausts resources. The calling service becomes unhealthy because of the dependency's failure — cascading failure. Circuit breakers stop the bleeding: detect repeated failures; stop calling; fail fast.

## Core Intuition

A circuit breaker in your home: short-circuit detected, breaker trips, downstream protected. After cooling, you reset it. Software circuit breaker: failures detected, calls stop, downstream protected. After timeout, probe to test recovery.

## Internal Mechanics

**States:**

**Closed** (normal):
- Calls flow normally.
- Track failure count/rate.
- If exceeds threshold → open.

**Open** (failing fast):
- Calls return immediately with error (don't reach dependency).
- After timeout → half-open.

**Half-Open** (probing):
- Allow limited calls through.
- Success → close.
- Failure → open.

**Configuration:**
- Failure threshold (e.g., 50% failure over 1 min).
- Open timeout (e.g., 30 sec).
- Half-open call count (e.g., 1 probe call).

## Real Production Examples

- **Netflix Hystrix** — popularized; now deprecated.
- **Resilience4j** — modern Java.
- **Polly** — .NET.
- **Envoy / Istio** — circuit breaking at proxy level.
- **AWS SDK** — built-in for some services.

## Design Tradeoffs

**Benefits:**
- Prevents cascading failure.
- Fast failure (vs timeout wait).
- Gives dependency time to recover.

**Costs:**
- More complex than direct call.
- Tuning thresholds is hard.
- May fail fast even for transient issues.

## Interview Perspective

**Common questions:**
- "What's a circuit breaker?" → Stops calling failing dependency; three states (closed/open/half-open).
- "Why?" → Prevents cascading failure.
- "How configure?" → Failure threshold, open timeout, half-open probe count.

**Senior-level:**
- Circuit breakers are essential in microservices. Without them, one slow service brings down callers.
- Configuration is workload-specific; one size doesn't fit all.
- Combined with [[Bulkheads]] for full isolation.

**Common mistakes:**
- No circuit breaker → cascading failure.
- Too-sensitive breaker → opens for transient issues.
- Too-loose breaker → cascading happens anyway.

## Related Concepts

- [[Bulkheads]] · [[Retries]] · [[Rate Limiting]] · [[Failure Detection]] · [[Graceful Degradation]]

## Misconceptions

- **"Circuit breaker = retry."** Different: breaker stops calling; retry repeats calls.
- **"One breaker for all dependencies."** One per dependency.
- **"Breaker eliminates timeouts."** Complements; doesn't replace.

## Failure Scenarios

- **Breaker stuck open** — no recovery probing.
- **Half-open probe always fails** — flapping.
- **No breaker** — cascading failure.

## Practical Engineering Heuristics

- **One breaker per downstream dependency.**
- **Combine with timeouts and retries.**
- **Monitor breaker state** as SLI.
- **Use library** (Resilience4j, Polly).

## Active Recall Questions

What's a circuit breaker?::Pattern that stops calling a failing dependency to prevent cascading failure. Three states: closed, open, half-open.

What are the three states?::Closed (normal), Open (fail fast), Half-Open (probing for recovery).

When does it transition closed → open?::Failure rate exceeds threshold (e.g., 50% failures in 1 minute).

When does it transition open → half-open?::After cooldown timeout (e.g., 30 sec).

What problem does it solve?::Cascading failure — preventing caller from being dragged down by failing dependency.

Name three implementations.::Hystrix (deprecated), Resilience4j, Polly, Envoy circuit breaking.

## Feynman Test

Service A calls Service B. B fails. Walk through circuit breaker behavior over time.

Why does a service without circuit breakers eventually crash when its dependency is slow?

## Mastery Checklist

- **Explain** circuit breaker pattern and states.
- **Compare** with retry and timeout.
- **Derive** appropriate threshold/timeout for given workload.
- **Critique** services without breakers.
- **Design** breaker configuration for a dependency.

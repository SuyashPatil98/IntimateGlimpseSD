---
title: Bulkheads
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Circuit Breakers]]", "[[Rate Limiting]]"]
sources:
  - Michael Nygard, "Release It!"
  - FoSA
tags: [reliability, resilience, isolation]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Bulkheads

## Executive Summary

The **Bulkhead pattern** (named for ship hull compartments) **isolates resources so failure in one part doesn't sink the whole**. Common implementations: **separate thread pools per dependency, connection pool limits, resource quotas, process isolation**. Prevents one bad dependency from exhausting all of a service's resources. Pairs with [[Circuit Breakers]] for full failure isolation: bulkhead limits damage; breaker stops the bleeding.

## Why This Exists

A service calling 10 dependencies often shares one connection pool / thread pool. If dependency D becomes slow, all threads end up waiting for D — even unrelated requests to other dependencies starve. The whole service degrades because of D. Bulkheads partition resources per dependency: D's slowness only consumes D's bulkhead.

## Core Intuition

A ship's hull has watertight compartments (bulkheads). If one hull section is breached, water fills only that compartment; the ship stays afloat. Without bulkheads, one leak sinks the ship. Software: partition resources so one component's failure only consumes its allocation.

## Internal Mechanics

**Common bulkheads:**

**Thread pool per dependency:**
- Dependency A has its own pool of 20 threads.
- Dependency B has its own pool of 10.
- A's slowness can't exhaust B's threads.

**Connection pool per service:**
- DB connections, HTTP clients per dependency.
- Cap per pool prevents one dependency from monopolizing.

**Resource quotas:**
- Memory per workload.
- CPU shares per service (Kubernetes).

**Process isolation:**
- Separate process per workload.
- OS-level isolation.

## Real Production Examples

- **Hystrix** — thread pool isolation per dependency.
- **Kubernetes** — resource limits per pod.
- **Java connection pools** — per-database limits.
- **Nginx worker processes** — separate.

## Design Tradeoffs

**Benefits:**
- Isolation of failures.
- Resource fairness.
- Prevents resource starvation.

**Costs:**
- More complex than shared pool.
- Wasted capacity if traffic asymmetric.
- Configuration burden per dependency.

## Interview Perspective

**Common questions:**
- "What's a bulkhead?" → Resource isolation between components; one's failure doesn't starve others.
- "How implement?" → Thread pools, connection pools, resource quotas, process isolation.
- "Bulkhead vs circuit breaker?" → Bulkhead limits damage; breaker stops calling failing dependency. Complementary.

**Senior-level:**
- Bulkheads + breakers together = full failure containment.
- Per-dependency thread pools (Hystrix style) traded simplicity for safety; modern systems often use async to avoid thread starvation entirely.
- Kubernetes resource limits are bulkheads at the orchestration level.

**Common mistakes:**
- One shared pool → easy cascading.
- Over-isolation → waste.
- No bulkheads at scale.

## Related Concepts

- [[Circuit Breakers]] · [[Rate Limiting]] · [[Graceful Degradation]]

## Misconceptions

- **"Bulkhead = breaker."** Different: bulkhead isolates resources; breaker stops calls.
- **"Bulkhead = thread pool."** Thread pool is one implementation.
- **"More bulkheads = better."** Diminishing returns; ops overhead.

## Failure Scenarios

- **One shared pool** → all threads waiting for slow dependency.
- **Over-tight bulkhead** → starvation.
- **No bulkhead** → cascading exhaustion.

## Practical Engineering Heuristics

- **Bulkhead per major dependency.**
- **Combine with circuit breakers.**
- **Monitor bulkhead utilization.**
- **Tune limits to dependency's typical latency.**

## Active Recall Questions

What's the Bulkhead pattern?::Resource isolation so one component's failure doesn't starve others. Named for ship hull compartments.

Common implementations?::Thread pools per dependency, connection pools per service, resource quotas, process isolation.

Bulkhead vs Circuit Breaker?::Bulkhead isolates resources; Breaker stops calling. Use both.

What's the failure mode without bulkheads?::Shared pool — one slow dependency starves all requests.

Where do bulkheads appear in Kubernetes?::Resource limits per pod (CPU, memory). Each pod is its own bulkhead.

Why is async sometimes better than bulkheads?::Async avoids thread starvation entirely; bulkhead becomes less critical.

## Feynman Test

A service calls 5 dependencies, sharing one thread pool. One dependency is slow. What happens with vs without bulkheads?

Why are Kubernetes resource limits a form of bulkhead?

## Mastery Checklist

- **Explain** bulkhead pattern.
- **Compare** with circuit breaker.
- **Derive** appropriate bulkhead configuration.
- **Critique** shared-pool designs.
- **Design** bulkheads for a microservice.

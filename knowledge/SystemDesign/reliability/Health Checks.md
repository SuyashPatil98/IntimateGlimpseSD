---
title: Health Checks
area: reliability
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Load Balancing]]", "[[Failure Detection]]", "[[Circuit Breakers]]"]
sources:
  - Kubernetes docs
  - SRE book
tags: [reliability, health-checks]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Health Checks

## Executive Summary

**Health checks** are **endpoints that report whether a service is functioning**. Load balancers, orchestrators (Kubernetes), and monitoring systems use them to remove unhealthy instances from rotation. Two standard distinctions: **liveness** (is the process running?) and **readiness** (is it ready to serve traffic?). Poor health check design causes outages — too lax misses failures; too strict causes flapping.

## Why This Exists

Servers fail in ways that don't crash the process: deadlocked threads, stuck DB connections, OOM-pending. Without health checks, traffic continues to dead instances. With them, dead instances are pulled from rotation. Foundation of self-healing systems.

## Core Intuition

A hospital triage. Patients self-report ability to walk; staff observe. If you can't walk (failed health check), you're moved to the high-attention area (removed from rotation). Self-report + observation maintains hospital flow.

## Internal Mechanics

**Liveness:**
- "Am I alive?"
- Just check process responsiveness.
- Fail → restart (in K8s).

**Readiness:**
- "Am I ready to serve traffic?"
- Check dependencies (DB connected, warmup complete).
- Fail → remove from LB; don't restart.

**Startup:**
- For slow-starting apps.
- Allow long startup before liveness applies.

**Common implementations:**
- HTTP endpoint: `/health` returns 200 or 5xx.
- TCP check: can establish connection.
- Custom: check DB, cache, dependencies.

## Design Tradeoffs

**Benefits:**
- Self-healing.
- Automatic failover.
- Smooth deploys.

**Costs:**
- Too lax → traffic to broken.
- Too strict → flapping; cascading failures.

## Health Check Anti-Patterns

**Too deep:**
- Checking all dependencies → one's failure marks all healthy services unhealthy.

**Too shallow:**
- Just returns 200 → doesn't detect actual problems.

**Flapping:**
- Marginal instance toggles in/out of rotation.

## Real Production Examples

- **Kubernetes** — liveness, readiness, startup probes.
- **AWS ELB** — health checks remove backends.
- **HAProxy, Nginx** — backend health checks.
- **Consul** — service health checks.

## Interview Perspective

**Common questions:**
- "Liveness vs readiness?" → Liveness: process alive? Readiness: ready to serve?
- "Failure action?" → Liveness fail → restart. Readiness fail → remove from LB.
- "Anti-patterns?" → Deep checks (cascading), shallow checks (miss issues), flapping.

**Senior-level:**
- Separating liveness from readiness is critical — they have different remediations.
- Health checks should reflect SLI fitness, not just process aliveness.
- Frequent health-check storms can themselves be load.

**Common mistakes:**
- Combined health endpoint that's either too deep or too shallow.
- No startup probe → restarts during legitimate startup.
- Health checks consuming all capacity.

## Related Concepts

- [[Load Balancing]] · [[Failure Detection]] · [[Circuit Breakers]] · [[Fail-Over]]

## Misconceptions

- **"Health check = uptime."** Process up ≠ ready to serve.
- **"Deeper = better."** Cascading failure risk.
- **"Same endpoint for everything."** Liveness and readiness need different.

## Failure Scenarios

- **Deep check fails on dependency** → all instances marked unhealthy → outage.
- **Shallow check misses deadlock** → traffic to broken.
- **Flapping** under marginal conditions.

## Practical Engineering Heuristics

- **Separate liveness and readiness.**
- **Liveness shallow** — process alive.
- **Readiness deeper but bounded** — own dependencies, not transitive.
- **Startup probe for slow apps.**
- **Reasonable frequency (5-10 sec).**

## Active Recall Questions

What's a health check?::Endpoint reporting whether a service is functioning. Used by LBs, orchestrators.

Liveness vs readiness?::Liveness: process alive (fail → restart). Readiness: ready to serve traffic (fail → remove from LB).

Why separate them?::Different remediations. Restarting a not-ready process loses its warmup; removing a deadlocked process doesn't fix it.

Health-check anti-pattern: too deep?::Checking transitive dependencies — one's failure cascades to mark all healthy services unhealthy.

What's a startup probe?::Health check that allows long initial startup before liveness applies. For slow-starting apps.

Typical health-check frequency?::5-10 sec interval. Frequent enough to detect; not so much as to be load.

## Feynman Test

A microservice has a DB connection pool. Design liveness and readiness.

Why is "health check fails if any dependency fails" usually a bad idea?

## Mastery Checklist

- **Explain** health checks and types.
- **Compare** liveness, readiness, startup.
- **Derive** appropriate health checks for given service.
- **Critique** deep-check anti-patterns.
- **Design** health endpoints for microservice.

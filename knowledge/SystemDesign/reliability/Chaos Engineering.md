---
title: Chaos Engineering
area: reliability
status: mature
difficulty: advanced
prerequisites: ["[[Failure Detection]]", "[[Circuit Breakers]]"]
related: ["[[Postmortems]]", "[[Incident Response]]", "[[Fail-Over]]"]
sources:
  - Netflix Chaos Monkey
  - 'Chaos Engineering (Rosenthal & Jones)'
tags: [reliability, chaos-engineering, testing]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Chaos Engineering

## Executive Summary

**Chaos Engineering** is the discipline of **deliberately injecting failures into production systems to discover weaknesses before they cause real outages**. Pioneered by Netflix's **Chaos Monkey** (2011) — a tool that randomly killed production instances. Modern practice: planned **chaos experiments** (kill instances, induce latency, partition networks) with monitoring, hypothesis, blast-radius control, and learning. The "test in production" philosophy — staging will never match prod, so test there.

## Why This Exists

Distributed systems fail in ways unit tests can't catch. Production conditions (scale, network variance, load) are unique. Without deliberate failure injection, systems degrade silently: redundancies untested, circuit breakers misconfigured, fallbacks broken. Chaos engineering surfaces these *before* the real outage.

## Core Intuition

A vaccine — inject weakened version of disease to build immunity. Chaos engineering injects controlled failures so the system practices recovering, surfaces weaknesses, and improves before facing real failures.

## Internal Mechanics

**Principles:**
1. Build a hypothesis around steady state.
2. Vary real-world events (server failure, latency, etc.).
3. Run experiments in production.
4. Automate experiments to run continuously.
5. Minimize blast radius.

**Experiment design:**
- Hypothesis: "When we kill 1 instance, customer error rate stays < 0.1%."
- Inject failure.
- Measure.
- Confirm or learn.

**Common chaos:**
- Kill instances.
- Inject latency.
- Partition network.
- Fail dependency.
- Exhaust resources.

**Tools:** Chaos Monkey (Netflix), Gremlin, Litmus, Chaos Mesh, AWS FIS.

## Real Production Examples

- **Netflix Simian Army** — Chaos Monkey, Latency Monkey, Chaos Kong.
- **Gremlin** — commercial chaos platform.
- **Google** — DiRT (Disaster Recovery Testing) exercises.
- **Slack, GitHub** — game days.

## Design Tradeoffs

**Benefits:**
- Surfaces weaknesses early.
- Validates resilience patterns.
- Builds team confidence.
- Continuous validation.

**Costs:**
- Risk of customer impact (small).
- Tooling complexity.
- Cultural shift.
- Requires good observability first.

## Interview Perspective

**Common questions:**
- "What's chaos engineering?" → Deliberate failure injection in production to discover weaknesses.
- "Why production?" → Staging doesn't match prod conditions.
- "Famous tool?" → Chaos Monkey (Netflix). Gremlin (commercial).

**Senior-level:**
- Chaos engineering is the practical answer to "is our system actually resilient?"
- Prerequisites: solid observability, SLOs, error budgets, incident response.
- Start small — bound blast radius; grow confidence.

**Common mistakes:**
- Chaos before observability → can't measure impact.
- Too aggressive → customer impact.
- No hypothesis → just breaking things.

## Related Concepts

- [[Postmortems]] · [[Incident Response]] · [[Fail-Over]] · [[Circuit Breakers]]

## Misconceptions

- **"Chaos = chaos."** Disciplined experiments, not random destruction.
- **"Chaos in staging only."** Misses prod-specific issues.
- **"Chaos for everyone."** Requires reliability foundation first.

## Failure Scenarios

- **Real customer impact.**
- **Cascading failure** from chaos.
- **Insufficient observability** to measure outcome.

## Practical Engineering Heuristics

- **Hypothesis first.**
- **Small blast radius initially.**
- **Game days** for team practice.
- **Continuous chaos** for mature teams.
- **Observability required.**

## Active Recall Questions

What's chaos engineering?::Deliberate failure injection in production to discover weaknesses before real outages.

Who pioneered it?::Netflix with Chaos Monkey (2011).

Why production?::Staging doesn't match prod conditions. Real failures only happen at scale.

Five principles?::Steady-state hypothesis, vary real-world events, run in production, automate, minimize blast radius.

Name three chaos tools.::Chaos Monkey, Gremlin, Litmus, Chaos Mesh, AWS FIS.

Prerequisites for chaos engineering?::Solid observability, SLOs, incident response, mature engineering culture.

## Feynman Test

Design a chaos experiment for an order-processing service. Hypothesis, injection, measurement.

Why is "chaos in staging only" the wrong approach?

## Mastery Checklist

- **Explain** chaos engineering principles.
- **Compare** with traditional testing.
- **Derive** appropriate experiment for given system.
- **Critique** chaos without observability.
- **Design** game day for a team.

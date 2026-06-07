---
title: Monolith
area: architecture-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Modular Monolith]]", "[[Microservices]]", "[[SOA]]"]
sources:
  - FoSA, Ch. 10
  - Modern Software Engineering (Farley)
tags: [architecture, monolith, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Monolith

## Executive Summary

A **monolith** is an application built and deployed as a **single unit** — one codebase, one process, one database (typically), one deployment. Despite the negative reputation it acquired during the microservices hype, monoliths remain the **right default for most systems**. Faster to build, easier to debug, simpler to operate, no distributed-systems pain. The mature realization (2020s): monolith vs microservices isn't a binary; well-organized monoliths ("modular monolith") scale further than naïve microservices.

## Why This Exists

Splitting an application across many services has real costs: network latency, distributed transactions, debugging across processes, deployment coordination. For most applications — especially early-stage — these costs exceed the benefits. Monoliths are the natural starting point: one codebase, fast iteration, easy local testing, simple deployment.

## Core Intuition

A single ship. Crew works together; one captain; one destination. Adding capabilities means more crew on the same ship. Fast at first; gets crowded at scale. Eventually the ship is too big to handle as one unit — but most ships never reach that scale.

## Internal Mechanics

**Typical structure:**
- One codebase.
- Layered organization (controllers, services, repositories).
- One DB (sometimes more for specific needs).
- Deployed as one artifact.
- Scaled by running multiple replicas of the same artifact.

**Communication within:**
- Function calls (microseconds latency).
- Shared memory, shared transactions.
- No serialization overhead.

**Scaling:**
- Vertical (bigger machine).
- Horizontal (more replicas of monolith behind LB).

## Design Tradeoffs

**Benefits:**
- **Simple deployment** — one artifact.
- **Easy debugging** — single stack trace.
- **Local transactions** — ACID at function-call boundaries.
- **Fast development** — no service contracts.
- **Refactoring is fearless** — IDE knows everything.
- **Lower operational cost.**

**Costs:**
- Large codebase becomes unwieldy.
- All teams deploy together (deployment coupling).
- One technology stack for everything.
- Can't independently scale parts.
- Memory footprint of the whole even if only part used.
- Risk of "ball of mud" without discipline.

## Real Production Examples

- **Stack Overflow** — famously monolithic at enormous scale.
- **Shopify** — large modular monolith.
- **Basecamp** — monolith philosophy ("Majestic Monolith" — DHH).
- **GitHub** — Rails monolith historically.
- **Most early-stage startups** — monolith default.

## Interview Perspective

**Common questions:**
- "Why monolith?" → Simple deployment, easy debugging, no distributed-systems pain. Right default.
- "When move off monolith?" → When team size or deployment coupling becomes painful. Not before.
- "Monolith vs microservices?" → Monolith: simpler, fewer ops. Microservices: independent scaling, organizational alignment.

**Senior-level:**
- "Monolith first" (Martin Fowler) — start with monolith; split only when pain demonstrates need.
- Stack Overflow's monolith handles 10s of millions of requests/day — scale is rarely the reason to leave.
- The real reason to leave monolith is *team scaling*, not technology scaling.

**Common mistakes:**
- Premature microservices.
- No modular discipline → ball of mud.
- One DB for everything without isolation.
- Monolith that no one can deploy safely.

## Related Concepts

- [[Modular Monolith]] · [[Microservices]] · [[SOA]] · [[Service-Based]]

## Misconceptions

- **"Monoliths don't scale."** Many scale enormously. Twitter's pre-microservices Rails monolith handled massive load.
- **"Microservices are always better."** Wrong default.
- **"All monoliths become balls of mud."** With discipline (modular monolith), they don't.

## Failure Scenarios

- **Ball of mud** — no modular discipline.
- **Deployment coupling** — teams blocking each other.
- **Single-language lock-in.**
- **Huge build times.**

## Practical Engineering Heuristics

- **Default to monolith** for new projects.
- **Apply modular discipline** from day one.
- **Use one DB per domain** within the monolith.
- **Plan for split** before it's painful, but don't pre-split.
- **Trunk-based development** with good tests beats premature microservices.

## Active Recall Questions

What is a monolith?::Application built and deployed as a single unit — one codebase, one process, often one database.

When is monolith the right choice?::Most new projects. Early stage. Teams under ~20 engineers. Workloads that don't demand independent scaling.

What's "monolith first"?::Martin Fowler's advice: start with monolith; split into microservices only when pain demonstrates need.

Why is debugging easier in a monolith?::Single stack trace; in-process function calls; no distributed tracing needed; can step through entirely.

What's the real reason to leave monolith?::Team scaling — when deployment coupling and codebase complexity hurt productivity. Not usually technology scaling.

Name three large monolithic systems.::Stack Overflow, Shopify, Basecamp, GitHub (historically).

## Feynman Test

A startup with 3 engineers debates monolith vs microservices. Argue for monolith.

Why does "monolith first" sound conservative but often produces faster systems at higher scale?

## Mastery Checklist

- **Explain** monolith and its trade-offs.
- **Compare** with microservices.
- **Derive** when monolith is appropriate.
- **Critique** premature microservices migrations.
- **Design** a modular monolith with clean boundaries.

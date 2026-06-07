---
title: Layered Architecture
area: architecture-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Hexagonal Architecture]]", "[[Onion Architecture]]", "[[Monolith]]", "[[Microkernel]]", "[[Space-Based Architecture]]"]
sources:
  - FoSA, Ch. 10
tags: [architecture, layered, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Layered Architecture

## Executive Summary

**Layered Architecture** organizes code into **horizontal layers** — typically **Presentation, Business, Persistence, Database** — where each layer only depends on the one beneath. The **default architecture** for most monoliths and most introductory systems. Familiar, easy to teach, easy to reason about. Costs: tendency toward "sinkhole anti-pattern" (requests pass through layers without adding value), tight coupling to specific layer technologies, and difficulty isolating business logic from infrastructure. The architectural style most people are using even when they don't name it.

## Why This Exists

Pre-1990s, code was often spaghetti. Layered architecture imposes order: presentation talks to business; business talks to persistence; persistence talks to DB. Each layer has a clear job. Changes to UI shouldn't ripple to DB.

## Core Intuition

A cake. The icing (UI) sits on top of the cream filling (business logic), which sits on top of the sponge (persistence), which rests on the plate (DB). You can change icing without touching the plate. Layers compose to make the cake.

## Internal Mechanics

**Typical layers (top-down):**
1. **Presentation** — UI / API controllers.
2. **Business** — domain logic, services.
3. **Persistence** — DAOs, repositories.
4. **Database** — actual DB.

**Dependency rule:** layer N depends only on layer N+1 (downward). Higher layers can call lower; not vice versa.

**Closed vs open layers:**
- **Closed:** requests must pass through every layer in order (default).
- **Open:** layers can be skipped (e.g., presentation calls persistence directly — bypasses business).

## Design Tradeoffs

**Benefits:**
- Familiar; easy to teach.
- Separation of concerns.
- Each layer can be tested somewhat in isolation.
- Maps well to typical CRUD apps.

**Costs:**
- **Sinkhole anti-pattern** — request passes through layers untouched (just CRUD through-and-through).
- Domain logic often leaks into persistence (or vice versa).
- Coupling to specific tech per layer.
- Doesn't scale well to complex domains.

## Real Production Examples

- **Most Java enterprise apps** — layered by convention.
- **Spring MVC + JPA** — classic layered pattern.
- **Default in most frameworks.**

## Interview Perspective

**Common questions:**
- "What's layered architecture?" → Horizontal layers; each depends on the one beneath.
- "What's the sinkhole anti-pattern?" → Request passes through layers without adding value at each.
- "Layered vs Hexagonal?" → Layered: vertical strict dependency. Hexagonal: domain at core, infrastructure outside.

**Senior-level:**
- Layered architecture's tendency to mix domain logic into infrastructure is its biggest weakness for complex domains. Hexagonal / Onion address this.
- For simple CRUD, layered is often fine and over-engineering hexagonal hurts.
- Most "we're using layered architecture" deployments are actually distributed-monolith-by-accident.

**Common mistakes:**
- Sinkhole anti-pattern in CRUD-heavy code.
- Mixing domain logic into persistence layer.
- Tight coupling to specific DB / ORM.

## Related Concepts

- [[Hexagonal Architecture]] · [[Onion Architecture]] · [[Monolith]]

## Misconceptions

- **"Layered is outdated."** Still appropriate for many apps.
- **"All architectures are layered."** Many are, but layered specifically means strict top-down.
- **"Layers prevent coupling."** Only if dependency rule is enforced.

## Failure Scenarios

- **Sinkhole** under heavy CRUD.
- **Domain logic in DAOs** when developers take shortcuts.
- **Cross-layer leaks** (UI calls DB directly "just this once").

## Practical Engineering Heuristics

- **Use for simple CRUD apps.**
- **Enforce dependency rule** via tooling.
- **For complex domains, consider Hexagonal/Onion.**
- **Watch for sinkhole symptoms.**

## Active Recall Questions

What's layered architecture?::Horizontal layers — Presentation, Business, Persistence, Database. Each layer depends only on the one beneath.

What's the dependency rule?::Layer N depends only on layer N+1 (downward). Higher layers may call lower; never the reverse.

What's the sinkhole anti-pattern?::Request flows through every layer without each adding meaningful value. Common in CRUD-heavy code.

Closed vs open layers?::Closed: must pass through every layer in order. Open: layers can be skipped.

When is layered appropriate?::Simple CRUD apps. Familiar; easy. For complex domains, Hexagonal/Onion better.

## Feynman Test

A typical Spring MVC + JPA app — identify the layers. What's the sinkhole risk?

Why does layered architecture often mix domain logic into infrastructure layers?

## Mastery Checklist

- **Explain** layered architecture and dependency rule.
- **Compare** with Hexagonal and Onion.
- **Derive** when layered is appropriate.
- **Critique** sinkhole patterns.
- **Design** a layered app with clear layer boundaries.

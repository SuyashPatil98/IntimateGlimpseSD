---
title: Strangler Fig
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Monolith]]", "[[Microservices]]"]
related: ["[[Monolith]]", "[[Microservices]]", "[[Anti-Corruption Layer]]"]
sources:
  - Martin Fowler (original article)
  - Modern Software Engineering (Farley)
tags: [architecture, migration, refactoring]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Strangler Fig Pattern

## Executive Summary

The **Strangler Fig pattern** (Martin Fowler) is a strategy for **incrementally replacing a legacy system by gradually intercepting traffic and routing it to the new system, until the old is fully retired**. Named after a tree that grows around its host, eventually replacing it. The pragmatic alternative to risky big-bang rewrites — the new system grows alongside the old, slowly taking over functionality.

## Why This Exists

Big-bang rewrites famously fail: 18-month projects that miss deadlines, lose features, and disappoint users. The Strangler Fig acknowledges reality: legacy systems can't be replaced overnight. By intercepting traffic and progressively migrating capabilities, the rewrite delivers continuous value, allows reverting any step, and never has a single high-risk cutover.

## Core Intuition

A strangler fig tree grows around an older tree, gradually replacing it. By the time the original is gone, the fig has assumed its function. Slow, organic, low-risk. Software: build new system around the old; route traffic to new components as they're built; eventually the old is dead and replaced.

## Internal Mechanics

**Steps:**
1. **Identify boundaries** — capabilities to extract first.
2. **Intercept** — proxy or facade in front of legacy.
3. **Build new capability** — implement in new system.
4. **Route to new** — proxy sends new-capability traffic to new system; legacy gets the rest.
5. **Repeat** for next capability.
6. **Retire legacy** when nothing left.

**Facade / proxy:** the strangler is typically a routing layer between clients and (legacy + new) backends.

**Coexistence:** legacy and new run side by side throughout the migration.

## Design Tradeoffs

**Benefits:**
- **Low risk** — incremental.
- **Continuous value** delivered.
- Easy to revert any step.
- No "freeze" period during migration.
- Real production validation.

**Costs:**
- Long migration timeline (months to years).
- Maintaining two systems.
- Routing complexity.
- Data sync between old and new.

## Real Production Examples

- **Many enterprise modernizations** — banks, retail.
- **Cloud migrations** — gradual lift-and-shift.
- **Monolith → microservices.**
- **Mainframe modernization.**

## Interview Perspective

**Common questions:**
- "What's Strangler Fig?" → Incrementally replace legacy by intercepting traffic and routing to new system.
- "Why use it?" → Big-bang rewrites fail; gradual migration is lower risk.
- "How is traffic routed?" → Facade/proxy/router in front; routes per capability.

**Senior-level:**
- The Strangler is the *only* migration approach that's been proven at scale.
- Common pitfall: never finishing — the legacy lingers for years.
- Data sync between old and new during migration is the hardest part.

**Common mistakes:**
- Starting without a clear "we will finish" commitment.
- Underestimating data migration complexity.
- Routing logic becoming its own monolith.

## Related Concepts

- [[Monolith]] · [[Microservices]] · [[Anti-Corruption Layer]] · [[API Gateway]]

## Misconceptions

- **"Strangler is slow."** Slower than naive rewrite plan, faster than failed rewrite.
- **"Strangler eliminates risk."** Reduces; doesn't eliminate.
- **"Routing is the hard part."** Data sync usually is.

## Failure Scenarios

- **Never-finished migration** — legacy persists for years.
- **Data drift** between old and new during dual-write.
- **Routing complexity** outgrowing capability.

## Practical Engineering Heuristics

- **Commit to finishing.**
- **Start with leaf capabilities** that have few dependencies.
- **Anti-corruption layer** between new and old.
- **Plan data migration carefully.**
- **Measure and celebrate progress.**

## Active Recall Questions

What's the Strangler Fig pattern?::Incrementally replace legacy system by intercepting traffic and routing to new system as capabilities are built.

Who coined it?::Martin Fowler.

Why prefer Strangler over big-bang rewrite?::Big-bang rewrites famously fail. Strangler delivers continuous value, allows reverting, validates in production.

What's the routing layer?::Facade or proxy in front of (legacy + new); routes per-capability to either backend.

Hardest part of Strangler migrations?::Data sync between old and new during dual-write window.

Common pitfall?::Never finishing. Legacy persists for years.

## Feynman Test

A company has a 15-year-old monolith. Design a Strangler migration to microservices.

Why is "we'll finish in a year" rarely true — and why is that OK with Strangler?

## Mastery Checklist

- **Explain** Strangler Fig pattern.
- **Compare** with big-bang rewrite.
- **Derive** appropriate first capability to extract.
- **Critique** never-finished migrations.
- **Design** a multi-year migration plan with milestones.

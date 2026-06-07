---
title: Onion Architecture
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Layered Architecture]]"]
related: ["[[Hexagonal Architecture]]", "[[Layered Architecture]]"]
sources:
  - Jeffrey Palermo (original posts, 2008)
  - Modern Software Engineering (Farley)
tags: [architecture, onion]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Onion Architecture

## Executive Summary

**Onion Architecture** (Jeffrey Palermo, 2008) organizes code as **concentric rings, with the domain model at the center** and infrastructure at the outermost. Like [[Hexagonal Architecture]], dependencies point inward; the domain depends on nothing. Closely related to **Clean Architecture** (Uncle Bob) and Hexagonal. Pattern provides: testable domain, technology independence, easy refactoring of outer rings.

## Why This Exists

Solving the same problem as Hexagonal: domain logic shouldn't depend on infrastructure. Palermo proposed "rings" as a more intuitive metaphor than ports/adapters. Practically equivalent; pick whichever terminology resonates.

## Core Intuition

An onion. Center: domain entities (the most stable, least changing). Surrounding rings: domain services, application services, infrastructure. Dependencies always point inward. Peeling layers (removing infrastructure) leaves the domain intact.

## Internal Mechanics

**Typical rings (center → outside):**
1. **Domain Model** — entities, value objects, domain logic.
2. **Domain Services** — operations on multiple entities.
3. **Application Services** — orchestration, use cases.
4. **Infrastructure** — DB, UI, external APIs.

**Dependency rule:** all dependencies point inward. Infrastructure depends on application; application on domain services; domain services on entities. The reverse never happens.

**Inversion of control:** when domain needs infrastructure (e.g., to save), it defines an interface; infrastructure implements it — Dependency Inversion Principle.

## Comparison with Hexagonal

| Aspect | Hexagonal | Onion |
|---|---|---|
| Metaphor | Hexagon with ports/adapters | Concentric rings |
| Originator | Cockburn (2005) | Palermo (2008) |
| Practical | Essentially the same | Essentially the same |

Most experts treat them as equivalent with different presentations. **Clean Architecture** (Uncle Bob) is a third variant.

## Design Tradeoffs

Same as Hexagonal:
- Domain testable in isolation.
- Tech-independent domain.
- Costs: upfront design, indirection.

## Real Production Examples

- **DDD-style services.**
- **.NET community** popularized Onion via Palermo.
- **Clean Architecture** projects (Uncle Bob).

## Interview Perspective

**Common questions:**
- "What's Onion Architecture?" → Concentric rings with domain at center. Dependencies point inward.
- "Onion vs Hexagonal?" → Essentially the same; different metaphors.
- "When use it?" → Complex domains needing testability and technology independence.

**Senior-level:**
- The three "domain-centric" styles (Hexagonal, Onion, Clean) converge on the same idea. Choose terminology your team finds clearest.
- Onion's strength is showing dependencies visually as rings — intuitive.
- For trivial CRUD, overkill.

**Common mistakes:**
- Over-engineering for simple apps.
- Treating Onion and Hexagonal as different in substance.
- Allowing infrastructure types to leak inward.

## Related Concepts

- [[Hexagonal Architecture]] · [[Layered Architecture]]

## Misconceptions

- **"Onion is fundamentally different from Hexagonal."** Practically the same.
- **"Onion has more layers than necessary."** Layer count is a guide, not gospel.
- **"Onion = Clean."** Related; Clean is yet another variant.

## Failure Scenarios

- **Outer ring types leaking inward.**
- **Application services becoming bloated.**
- **Over-abstraction** producing code no one understands.

## Practical Engineering Heuristics

- **Pick one of Hexagonal/Onion/Clean** and stick with it.
- **Enforce inward dependencies** via tooling.
- **Keep domain pure** of infrastructure types.
- **For simple apps, layered is fine.**

## Active Recall Questions

What's Onion Architecture?::Concentric rings with domain at center; dependencies point inward; infrastructure on the outside.

Who coined Onion?::Jeffrey Palermo, 2008.

Onion vs Hexagonal?::Essentially the same idea with different metaphors. Both put domain at core; both have inward-pointing dependencies.

What's the dependency rule?::All dependencies point inward. Inner rings know nothing of outer rings.

When use Onion (or Hexagonal)?::Complex domains needing testability and technology independence. Overkill for simple CRUD.

What's the trio of similar styles?::Onion (Palermo), Hexagonal/Ports & Adapters (Cockburn), Clean Architecture (Uncle Bob).

## Feynman Test

Why does Onion's "rings" metaphor resonate with developers used to layered architecture?

When would you choose Onion over Hexagonal in a team discussion?

## Mastery Checklist

- **Explain** Onion Architecture.
- **Compare** with Hexagonal and Clean.
- **Derive** when domain-centric architecture is justified.
- **Critique** layered apps wishing for testability.
- **Design** an Onion-styled service.

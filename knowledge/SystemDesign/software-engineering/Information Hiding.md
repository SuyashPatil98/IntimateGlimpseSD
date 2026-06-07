---
title: Information Hiding
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Modularity]]", "[[First Principles of SE]]", "[[Hexagonal Architecture]]"]
sources:
  - David Parnas, 1972
  - David Farley, "Modern Software Engineering"
tags: [software-engineering, encapsulation, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Information Hiding

## Executive Summary

**Information hiding** (David Parnas, 1972) is the principle that **modules should hide their implementation details, exposing only well-defined interfaces**. The corollary to [[Modularity]]: not enough to split into modules; modules must encapsulate. Forms the basis of **encapsulation**, **abstract data types**, **APIs**, **microservice contracts**. Farley considers it one of software engineering's foundational techniques for managing complexity.

## Why This Exists

When implementation details leak, consumers depend on them — and changes break consumers. With hidden implementation, you can change internals freely; only the interface matters. The interface is the commitment; everything else is private.

## Core Intuition

A car's gas pedal. You press it; car accelerates. You don't (and shouldn't need to) know the carburetor, fuel injection, transmission timing. The pedal is the interface; the engine is hidden. Replace the engine (gas → electric); pedal still works.

## Internal Mechanics

**Practice:**
- Define public interface.
- Make everything else private.
- Internal details may change without breaking consumers.

**Language mechanisms:**
- `private`, `public` keywords.
- Modules / packages.
- Abstract classes / interfaces.
- Hidden internal types.

**Service-level:**
- API contracts.
- Database is internal — never accessed directly by other services.
- Schema changes hidden behind API.

## Parnas's Insight

The "secret" of a module is what makes it changeable. If you ask: "if I change X, who breaks?" — the answer should be "nobody outside this module." The secret is the design decision the module encapsulates.

## Design Tradeoffs

**Benefits:**
- Internal change freedom.
- Smaller blast radius.
- Cleaner reasoning.
- Better abstractions.

**Costs:**
- Discipline to define and respect interface.
- Extra abstraction.

## Real Production Examples

- **OOP encapsulation** — fundamental.
- **Service APIs** — implementation hidden.
- **Database-per-service** in microservices.

## Interview Perspective

**Common questions:**
- "What's information hiding?" → Modules expose interface; hide implementation.
- "Who?" → David Parnas, 1972.
- "Why?" → Implementation changes don't break consumers.

**Senior-level:**
- Information hiding is the *prerequisite* for [[Modularity]] to actually contain complexity.
- The "secret" framing is most useful: what's the design decision this module encapsulates?
- Microservices' "database per service" is information hiding at service level.

**Common mistakes:**
- "Public by default."
- Leaking internals via "getters."
- Sharing internal database access.

## Related Concepts

- [[Modularity]] · [[First Principles of SE]] · [[Hexagonal Architecture]] · [[Microservices]]

## Misconceptions

- **"Encapsulation = getters/setters."** Just exposing fields differently. Real encapsulation hides decisions.
- **"Information hiding = privacy."** It's about changeability.

## Failure Scenarios

- **Leaked internals** — change breaks consumers.
- **God object** — knows everything; can change nothing safely.

## Practical Engineering Heuristics

- **Private by default.**
- **Public interface minimal.**
- **Hide the design decision** that's likely to change.
- **No shared DB across services.**

## Active Recall Questions

What's information hiding?::Modules expose well-defined interface; hide implementation details. Internal changes don't break consumers.

Who coined it?::David Parnas, 1972, "On the Criteria to be Used in Decomposing Systems into Modules."

What's the "secret" framing?::The design decision the module encapsulates. If I change this, who breaks? Should be: nobody outside the module.

Why is this important?::Implementation changes shouldn't break consumers. Information hiding makes change safe.

How does it apply to microservices?::Each service owns its data and exposes only API. Other services can't bypass.

What's the prerequisite relationship to modularity?::Information hiding is what makes modularity work. Without it, modules leak; complexity not contained.

## Feynman Test

Design a payment module hiding its DB schema. Why does this enable schema migration?

Why is "getters and setters for every field" not real information hiding?

## Mastery Checklist

- **Explain** information hiding and Parnas's framing.
- **Compare** with simple access modifiers.
- **Derive** what's the "secret" of given module.
- **Critique** leaked internals.
- **Design** modules with deliberate information hiding.

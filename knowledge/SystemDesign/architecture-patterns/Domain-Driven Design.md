---
title: Domain-Driven Design
aliases: [DDD]
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Bounded Contexts]]", "[[Hexagonal Architecture]]", "[[Microservices]]", "[[Anti-Corruption Layer]]"]
sources:
  - Eric Evans, "Domain-Driven Design" (2003)
  - Vaughn Vernon, "Implementing DDD"
  - FoSA
tags: [architecture, ddd]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Domain-Driven Design (DDD)

## Executive Summary

**Domain-Driven Design (DDD)** is an approach to software development that **places the business domain at the center of design decisions**, using a **ubiquitous language** shared between developers and domain experts. From Eric Evans' 2003 book. Provides patterns (Entities, Value Objects, Aggregates, Repositories, Domain Services) and strategic concepts ([[Bounded Contexts]], Context Maps, Ubiquitous Language). Foundational influence on modern microservices — service boundaries often follow bounded contexts.

## Why This Exists

Software for complex business domains often fails because developers and domain experts speak different languages. Code becomes mechanical CRUD divorced from the domain. DDD makes the domain the organizing principle: terminology in code matches the business; modules align with bounded contexts; complexity managed by separation rather than accumulation.

## Core Intuition

Building software for a hospital. The wrong way: generic "User," "Item," "Order" objects, hospital concepts buried in implementation. The DDD way: "Patient," "Admission," "Diagnosis," "Treatment" as first-class types, modeled with the doctors. The code reads like the domain.

## Key Concepts

**Strategic DDD:**
- **Ubiquitous Language** — shared vocabulary between devs and experts.
- **[[Bounded Contexts]]** — explicit boundaries where a model applies.
- **Context Maps** — relationships between bounded contexts.
- **[[Anti-Corruption Layer]]** — translation between contexts.

**Tactical DDD:**
- **Entities** — objects with identity (Patient, Order).
- **Value Objects** — immutable, identity-free (Money, Address).
- **Aggregates** — clusters of entities treated as a unit.
- **Repositories** — persistence boundaries.
- **Domain Services** — operations not naturally on one entity.
- **Domain Events** — significant happenings.

## Design Tradeoffs

**Benefits:**
- Domain alignment.
- Clear boundaries.
- Maintainable complex domains.
- Aligns with microservices.

**Costs:**
- Steep learning curve.
- Heavy ceremony for simple domains.
- Easy to misapply.

## Real Production Examples

- **Financial systems** — DDD-influenced architectures.
- **Healthcare, insurance** — complex domains benefit.
- **Many microservices** — bounded contexts → services.

## Interview Perspective

**Common questions:**
- "What's DDD?" → Approach centering software design on the business domain. Ubiquitous language + bounded contexts + tactical patterns.
- "Strategic vs tactical DDD?" → Strategic: bounded contexts, context maps. Tactical: entities, value objects, aggregates.
- "DDD + microservices?" → Bounded contexts often map to service boundaries.

**Senior-level:**
- DDD's tactical patterns are useful even outside full DDD.
- Strategic DDD (bounded contexts) is what saves microservices from chaos.
- DDD-lite — use the patterns without the orthodoxy.

**Common mistakes:**
- Applying tactical DDD without ubiquitous language.
- Bounded contexts that don't match real business divisions.
- Treating DDD as religious orthodoxy.

## Related Concepts

- [[Bounded Contexts]] · [[Anti-Corruption Layer]] · [[Hexagonal Architecture]] · [[Microservices]] · [[Event Sourcing]]

## Misconceptions

- **"DDD = entities and value objects."** Tactical patterns are part of DDD; strategic concepts are more important.
- **"DDD requires Java."** Language-independent.
- **"DDD = microservices."** Influenced; not equivalent.

## Failure Scenarios

- **Ubiquitous language fails** — devs and experts still talk past each other.
- **Bounded contexts wrong** — chaos.
- **Tactical patterns without strategy** — over-engineered CRUD.

## Practical Engineering Heuristics

- **Ubiquitous language first.**
- **Bounded contexts second.**
- **Tactical patterns where they add value.**
- **Don't over-DDD simple domains.**

## Active Recall Questions

What's DDD?::Approach centering software design on the business domain. Ubiquitous language + bounded contexts + tactical patterns.

Strategic vs tactical DDD?::Strategic: bounded contexts, context maps, ubiquitous language. Tactical: entities, value objects, aggregates, repositories.

What's ubiquitous language?::Shared vocabulary between developers and domain experts. Terms used in code match terms used in business.

What's an entity vs value object?::Entity: has identity (Patient ID matters). Value Object: immutable, identity-free (Money is just amount + currency).

How does DDD relate to microservices?::Bounded contexts often map to microservice boundaries. DDD provides the strategy for finding service edges.

When is DDD overkill?::Simple CRUD; small teams; no complex domain logic.

## Feynman Test

Walk through modeling a hospital system with DDD. Identify bounded contexts, entities, value objects.

Why does "ubiquitous language" prevent more bugs than any tactical pattern?

## Mastery Checklist

- **Explain** strategic and tactical DDD.
- **Compare** DDD with naive CRUD.
- **Derive** bounded contexts from business divisions.
- **Critique** tactical DDD without strategic foundation.
- **Design** a domain using DDD principles.

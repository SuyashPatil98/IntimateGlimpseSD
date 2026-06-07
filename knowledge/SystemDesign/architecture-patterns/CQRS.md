---
title: CQRS
area: architecture-patterns
status: mature
difficulty: advanced
prerequisites: ["[[Event Sourcing]]", "[[Bounded Contexts]]"]
related: ["[[Event Sourcing]]", "[[Materialized Views]]", "[[Saga Pattern]]"]
sources:
  - Greg Young (CQRS docs)
  - FoSA
tags: [architecture, cqrs]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# CQRS

## Executive Summary

**CQRS (Command Query Responsibility Segregation)** separates **write operations (commands) from read operations (queries)** into distinct models. Commands change state; queries read it. Each side can be optimized independently: writes use a normalized transactional model; reads use denormalized/projected views. Often paired with [[Event Sourcing]]. Trade-off: complexity vs. independent scaling and tailored models. Best for **complex domains with very different read and write patterns**.

## Why This Exists

In traditional CRUD, the same model serves reads and writes — a compromise that often fits neither. Writes need normalized, validated, transactional models. Reads need denormalized, fast, query-shaped data. CQRS lets each side optimize: writes go through a domain model; reads use materialized projections. Each can scale and evolve independently.

## Core Intuition

A library has librarians (writers) and patrons (readers). Librarians use the formal cataloging system — meticulous, normalized. Patrons use a simple "where's the book?" lookup — denormalized, fast. Same library; two views; each optimized for its users.

## Internal Mechanics

**Command side:**
- Receives intent ("place order").
- Validates against domain rules.
- Persists state changes.
- May emit events.

**Query side:**
- Maintains read-optimized projections.
- Updates from events or via DB replication.
- Serves queries fast.

**Sync:** events from command side update query side projections. Eventually consistent.

## CQRS Without Event Sourcing

CQRS doesn't require [[Event Sourcing]] — they're independent. CQRS can use any persistence on write side + projections on read side. Together they're powerful; separately they're useful.

## Design Tradeoffs

**Benefits:**
- Models optimized for purpose.
- Independent scaling.
- Easy to add new read models.
- Aligns with DDD.

**Costs:**
- Eventual consistency between sides.
- More complexity.
- Two models to maintain.
- Overkill for simple CRUD.

## Real Production Examples

- **Financial systems** — trades on write side; reports on read side.
- **E-commerce** — orders separate from catalog reads.
- **Many DDD systems.**

## Interview Perspective

**Common questions:**
- "What's CQRS?" → Separate write and read models. Each optimized for purpose.
- "CQRS + Event Sourcing?" → Often paired; ES provides events; CQRS uses them for projections.
- "When use it?" → Complex domains; very different read/write patterns; need to scale independently.

**Senior-level:**
- CQRS is one of the most over-applied patterns. Many systems would be better with a single model.
- The "eventual consistency" between sides surprises users — design UX with that in mind.
- Materialized views in DBs are a lightweight CQRS pattern.

**Common mistakes:**
- CQRS on simple CRUD apps.
- Forgetting eventual consistency in UX.
- Not committing to two models (drifts back to one).

## Related Concepts

- [[Event Sourcing]] · [[Materialized Views]] · [[Saga Pattern]] · [[Bounded Contexts]]

## Misconceptions

- **"CQRS = Event Sourcing."** Independent; often paired but not required.
- **"CQRS = read replicas."** Read replicas have same model; CQRS has different models.
- **"CQRS for everything."** Wrong default; only for complex domains.

## Failure Scenarios

- **Read model out of sync** with writes (lag visible to users).
- **Read model bug** produces wrong queries; rebuild from events.
- **Two models drift** when not maintained together.

## Practical Engineering Heuristics

- **Use CQRS for genuine complexity.**
- **Embrace eventual consistency** in UX.
- **Read model is replaceable** — rebuild from events.
- **Don't CQRS trivial CRUD.**

## Active Recall Questions

What's CQRS?::Command Query Responsibility Segregation. Separate models for writes (commands) and reads (queries).

CQRS + Event Sourcing?::Often paired. Events from ES feed CQRS read projections. Independent concepts.

When is CQRS appropriate?::Complex domains; very different read/write patterns; need to scale or evolve independently.

What's the consistency model?::Eventually consistent between sides. Writes commit; reads catch up via projection updates.

Why is CQRS over-applied?::Many systems don't have complex enough domains to justify two models. Should be reserved for genuine need.

How can you simplify CQRS?::Start with a single model; introduce read projections (materialized views) only when bottleneck.

## Feynman Test

Design an order system using CQRS. What's on write side? Read side?

Why does CQRS create user-visible eventual consistency, and how do you handle it?

## Mastery Checklist

- **Explain** CQRS.
- **Compare** with CRUD and Event Sourcing.
- **Derive** when CQRS is justified.
- **Critique** premature CQRS adoption.
- **Design** a CQRS system with explicit read projections.

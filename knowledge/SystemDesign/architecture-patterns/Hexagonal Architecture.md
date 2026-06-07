---
title: Hexagonal Architecture
aliases: [Ports and Adapters]
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Layered Architecture]]"]
related: ["[[Layered Architecture]]", "[[Onion Architecture]]", "[[Anti-Corruption Layer]]"]
sources:
  - Alistair Cockburn (original paper)
  - Modern Software Engineering (Farley)
  - FoSA
tags: [architecture, hexagonal, ports-adapters]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Hexagonal Architecture (Ports and Adapters)

## Executive Summary

**Hexagonal Architecture** (Alistair Cockburn, 2005), also called **Ports and Adapters**, puts the **domain logic at the center** with **ports (interfaces)** defining what it needs, and **adapters** implementing those ports for specific technologies (DB, UI, message queue). The domain depends on no infrastructure; infrastructure depends on the domain. Makes domain testable in isolation; lets you swap implementations (in-memory for tests, Postgres for prod). Closely related to [[Onion Architecture]] and Uncle Bob's Clean Architecture.

## Why This Exists

In [[Layered Architecture]], domain logic typically depends on persistence (which depends on DB). Changing DB ripples through domain code. Testing requires DB. Hexagonal flips this: domain defines abstract ports for what it needs (e.g., `UserRepository` interface); adapters implement those ports (e.g., `PostgresUserRepository`). The domain is testable without infrastructure and unaware of specific technologies.

## Core Intuition

A hexagonal building (any shape really; "hexagon" was Cockburn's drawing convenience). Inside: the business logic. The hexagon has multiple sides; each side has a port. Outside the hexagon: adapters that connect to the world (DB, UI, message queue, external APIs). The hexagon doesn't know or care which adapter is plugged in — only that the contract (port) is honored.

## Internal Mechanics

**Three zones:**
1. **Domain (core)** — business logic; no infrastructure dependencies.
2. **Ports** — interfaces the domain defines for what it needs (driven ports) or offers (driving ports).
3. **Adapters** — implement ports for specific technologies.

**Driving (input) adapters:** UI, HTTP controllers, CLI, message consumers — drive the domain.

**Driven (output) adapters:** DB repositories, external API clients, message publishers — driven by the domain.

**Dependency rule:** adapters depend on ports (which the domain defines). Domain depends on nothing external.

## Architecture Diagrams

```
         HTTP API ──→ (input port) ──→
                                         ┌──────────────┐
         CLI ──→ (input port) ─────────→ │   DOMAIN     │ ←── (output port) ←── PostgresRepo
                                         │   (core)     │ ←── (output port) ←── KafkaPublisher
         Message ──→ (input port) ────→ │              │ ←── (output port) ←── EmailClient
                                         └──────────────┘

  Domain knows nothing about HTTP, Postgres, Kafka, etc.
  Adapters know the domain's ports.
```

## Design Tradeoffs

**Benefits:**
- **Domain testable in isolation** — no DB, no HTTP needed.
- **Easy to swap implementations** — different adapters for tests vs prod.
- **Tech-independent domain.**
- **Clear boundaries.**

**Costs:**
- More upfront design — ports and adapters take more code.
- Overkill for simple CRUD.
- Indirection can confuse new developers.

## Real Production Examples

- Many **DDD-influenced systems.**
- **Spring framework** allows hexagonal style (interfaces + DI).
- **Backend services with rich domain logic.**

## Interview Perspective

**Common questions:**
- "What's Hexagonal Architecture?" → Domain at core; ports define needs; adapters implement them.
- "Why use it?" → Testable domain, swappable infrastructure.
- "Vs Onion?" → Very similar — both put domain at center. Onion has more concentric rings; hexagonal has ports/adapters terminology.

**Senior-level:**
- Hexagonal + DDD = clean domain isolation that scales for complex business domains.
- Adapters become the "anti-corruption layer" between domain and external systems.
- For simple CRUD, overkill. For domains with real complexity, transformative.

**Common mistakes:**
- Hexagonal for trivial CRUD — overhead with no benefit.
- Domain accidentally depending on infrastructure types.
- Ports too granular (one per method) — defeats abstraction.

## Related Concepts

- [[Layered Architecture]] · [[Onion Architecture]] · [[Anti-Corruption Layer]]
- [[Bounded Contexts]] — DDD pairing.

## Misconceptions

- **"Hexagonal = 6 sides."** "Hexagon" was illustration convenience; concept is technology-agnostic.
- **"Hexagonal = Onion."** Closely related; some say identical.
- **"Hexagonal eliminates infrastructure code."** No — it isolates infrastructure code in adapters.

## Failure Scenarios

- **Domain leaking infrastructure types** (e.g., `JdbcTemplate` in business logic).
- **Adapter logic too thick** — should be thin translation.
- **Port explosion** — ports for every minor operation.

## Practical Engineering Heuristics

- **Use for domains with real complexity.**
- **Define ports in domain terms** (not DB terms).
- **Adapters are thin translators.**
- **Test domain without infrastructure** to verify isolation.

## Active Recall Questions

What's Hexagonal Architecture?::Architecture style with domain at core; ports (interfaces) defining what it needs; adapters implementing ports for specific technologies.

Who coined Hexagonal?::Alistair Cockburn, 2005.

What's a port?::Interface defined by the domain for an interaction with the outside world.

What's an adapter?::Implementation of a port for a specific technology (DB, HTTP, message queue).

Driving vs driven adapters?::Driving (input): drive the domain (UI, HTTP, message consumer). Driven (output): driven by the domain (DB repository, publisher, client).

Hexagonal vs Onion?::Closely related; some say identical. Both put domain at center. Differs in terminology and presentation.

## Feynman Test

Walk through testing a domain function in Hexagonal — no DB, no HTTP. How does it work?

Why does Hexagonal Architecture survive a DB technology change without touching domain code?

## Mastery Checklist

- **Explain** Hexagonal Architecture.
- **Compare** with Layered and Onion.
- **Derive** appropriate ports for a given domain.
- **Critique** layered apps with domain logic in persistence.
- **Design** a service using hexagonal with proper port/adapter separation.

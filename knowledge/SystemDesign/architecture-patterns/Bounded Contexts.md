---
title: Bounded Contexts
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Domain-Driven Design]]"]
related: ["[[Domain-Driven Design]]", "[[Microservices]]", "[[Anti-Corruption Layer]]", "[[Federation]]"]
sources:
  - Eric Evans, DDD
  - Vaughn Vernon, "Implementing DDD"
tags: [architecture, ddd, bounded-contexts]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Bounded Contexts

## Executive Summary

A **Bounded Context** is an **explicit boundary within which a domain model is valid and consistent**. The central strategic concept of [[Domain-Driven Design]]. Inside a context, words have specific meanings; outside, the same word may mean something different. Bounded contexts **prevent model coupling**, **enable team autonomy**, and **commonly map to microservice boundaries**. Discovering them is the hardest and most consequential part of architecting a non-trivial system.

## Why This Exists

In a large organization, "Customer" means different things to Sales (a prospect), Billing (an account), Support (a ticket creator), and Inventory (an address to ship to). Trying to share one Customer model produces a frankenstein that satisfies no one. Bounded contexts make these differences explicit: each domain has its own Customer model; integration happens at boundaries.

## Core Intuition

A multinational corporation. The same word ("revenue") means different things in different departments. Forcing one global definition breaks everyone's nuanced understanding. Each department has its own meaning; cross-department reports translate explicitly.

## Internal Mechanics

**Identifying bounded contexts:**
- Listen for vocabulary shifts — same word, different meaning.
- Find natural team / business boundaries.
- Notice where data models conflict.

**Within a bounded context:**
- One domain model.
- One ubiquitous language.
- One team typically.

**Between bounded contexts:**
- Explicit integration via Context Maps.
- [[Anti-Corruption Layer]] translates between models.
- Async events common.

**Common context maps:**
- **Partnership** — two contexts evolve together.
- **Shared Kernel** — small shared model.
- **Customer/Supplier** — one depends on another.
- **Conformist** — accept the upstream's model.
- **Anti-Corruption Layer** — translate at boundary.
- **Open Host Service** — published API.
- **Published Language** — shared event format.

## Design Tradeoffs

**Benefits:**
- Models stay coherent inside contexts.
- Independent evolution.
- Team autonomy.
- Maps naturally to microservices.

**Costs:**
- Integration overhead between contexts.
- Translation logic (ACLs).
- Requires deep business understanding.

## Real Production Examples

- **Most well-designed microservices architectures** — services align with bounded contexts.
- **E-commerce** — Catalog, Pricing, Inventory, Orders, Fulfillment as separate contexts.
- **Financial services** — clear context boundaries between trading, settlement, compliance.

## Interview Perspective

**Common questions:**
- "What's a bounded context?" → Explicit boundary where a domain model is valid. Outside, same words may mean differently.
- "Why important?" → Prevents model coupling; enables team autonomy; maps to service boundaries.
- "How identify them?" → Listen for vocabulary shifts; find natural business divisions.

**Senior-level:**
- Bounded contexts are the most important strategic concept in DDD.
- Microservices that don't align with bounded contexts produce distributed monoliths.
- Context discovery requires deep domain dialogue, not just diagrams.

**Common mistakes:**
- Sharing one model across contexts.
- Service boundaries not matching business boundaries.
- Forcing global definitions.

## Related Concepts

- [[Domain-Driven Design]] · [[Microservices]] · [[Anti-Corruption Layer]] · [[Federation]]

## Misconceptions

- **"Bounded context = microservice."** Often correlated; not identical. One context can have multiple services; rarely the reverse.
- **"Shared models are fine."** They invariably calcify.
- **"You can find them on whiteboards."** Requires domain expert dialogue.

## Failure Scenarios

- **Contexts wrong** — distributed monolith.
- **Shared kernel grows** beyond manageability.
- **No ACL** — foreign concepts leak.

## Practical Engineering Heuristics

- **Listen for vocabulary shifts** to find boundaries.
- **One model per context.**
- **ACL between contexts.**
- **Align services with contexts.**
- **Evolve over time** — initial contexts won't be right.

## Active Recall Questions

What's a bounded context?::Explicit boundary within which a domain model is valid and consistent. Same word may mean differently in different contexts.

Why are they important?::Prevent model coupling. Enable team autonomy. Map naturally to microservice boundaries.

How do you identify bounded contexts?::Listen for vocabulary shifts. Find business divisions. Notice model conflicts.

Bounded context vs microservice?::Often map 1:1 but not required. Bounded context is conceptual; service is deployment.

What's a Context Map?::Documentation of relationships between bounded contexts (partnership, customer/supplier, conformist, ACL).

What's the failure mode of ignoring bounded contexts in microservices?::Distributed monolith — services that should be independent share models and couple via implicit dependencies.

## Feynman Test

Identify bounded contexts in an e-commerce system. How do they integrate?

Why does "shared Customer model across all services" calcify a system over time?

## Mastery Checklist

- **Explain** bounded contexts and their role.
- **Compare** with shared-model alternatives.
- **Derive** appropriate context boundaries for a domain.
- **Critique** microservices that ignore bounded contexts.
- **Design** a system with explicit contexts and context maps.

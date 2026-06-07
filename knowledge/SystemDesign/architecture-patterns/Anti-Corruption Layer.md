---
title: Anti-Corruption Layer
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Bounded Contexts]]"]
related: ["[[Bounded Contexts]]", "[[Strangler Fig]]", "[[Hexagonal Architecture]]"]
sources:
  - Eric Evans, "Domain-Driven Design" (2003)
  - FoSA
tags: [architecture, ddd, integration]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Anti-Corruption Layer

## Executive Summary

An **Anti-Corruption Layer (ACL)** is a translation layer between **your domain model and an external system's model** — preventing the external system's concepts from "corrupting" yours. From Eric Evans' Domain-Driven Design (2003). Used when integrating with legacy systems, third-party APIs, or other bounded contexts whose models conflict with your own. The ACL absorbs the impedance mismatch.

## Why This Exists

When integrating with external systems, naïve approaches let foreign concepts leak into your domain — your code becomes shaped by their idiosyncrasies. Over time, your domain calcifies around theirs. ACL keeps your domain pure: it translates between your model and theirs at the boundary.

## Core Intuition

A diplomatic translator at a border. People (data) cross; the translator converts between language and customs. Your country's internal communication stays in your language; the translator handles foreign quirks. Without it, your country's language slowly morphs to accommodate the foreign.

## Internal Mechanics

**Position:**
- Between your domain and external system.
- Translates models in both directions.
- Encapsulates external system's complexity.

**Responsibilities:**
- Map external concepts to your domain types.
- Hide external API quirks.
- Handle external errors and translate to your domain.
- Protocol bridging if needed.

**Implementation:** typically a separate module/service called by domain code; never the reverse.

## Design Tradeoffs

**Benefits:**
- Domain remains pure.
- External changes isolated.
- Easier to swap external systems.
- Testable boundary.

**Costs:**
- More code.
- Translation overhead.
- ACL itself can become complex.

## Real Production Examples

- **Banking integration** — translating between legacy COBOL system and modern microservice domain.
- **Third-party API wrappers** — Stripe, PayPal SDK wrapped behind ACL.
- **Strangler Fig migrations** — ACL between new and old systems.
- **DDD bounded context integration.**

## Interview Perspective

**Common questions:**
- "What's Anti-Corruption Layer?" → Translation layer between your domain and external system; prevents foreign concepts from corrupting yours.
- "When use it?" → Integrating with legacy, third-party APIs, other bounded contexts.
- "Trade-off?" → More code; domain purity.

**Senior-level:**
- ACL is a manifestation of [[Hexagonal Architecture]]'s adapter pattern — but specifically for inter-system integration.
- The cost of ACL is justified when the external system is complex, ugly, or volatile.
- For stable, well-designed external APIs, ACL may be overkill.

**Common mistakes:**
- Skipping ACL for "simple" integrations — foreign concepts seep in.
- ACL becoming too thick — translating logic, not just types.
- No ACL between bounded contexts.

## Related Concepts

- [[Bounded Contexts]] — DDD parent concept.
- [[Strangler Fig]] — often uses ACLs.
- [[Hexagonal Architecture]] — ACLs implement adapter pattern.

## Misconceptions

- **"ACL = SDK wrapper."** Wrappers translate API; ACL translates *concepts*.
- **"ACL always needed."** Cost-benefit depends on external system's quality.
- **"ACL adds latency."** Minimal in practice.

## Failure Scenarios

- **ACL too thin** — foreign concepts leak.
- **ACL too thick** — becomes its own domain.
- **External changes** ripple despite ACL.

## Practical Engineering Heuristics

- **ACL between every bounded context.**
- **Translate concepts, not just types.**
- **Keep ACL focused** — don't accumulate logic.
- **Test boundary scenarios.**

## Active Recall Questions

What's an Anti-Corruption Layer?::Translation layer between your domain and external system. Prevents external concepts from corrupting your domain.

Who coined ACL?::Eric Evans in "Domain-Driven Design" (2003).

When use ACL?::Integrating with legacy, third-party APIs, other bounded contexts with different models.

Trade-off?::More code and translation overhead. Domain stays pure and isolated from external changes.

How does ACL relate to Hexagonal?::ACL implements the adapter pattern from Hexagonal — specifically for inter-system integration.

What's the failure mode without ACL?::Foreign concepts seep into your domain. Over time, your model calcifies around the external system.

## Feynman Test

You're integrating with a 20-year-old banking COBOL system. Design ACL to keep your modern domain clean.

Why is ACL essential during Strangler Fig migrations?

## Mastery Checklist

- **Explain** Anti-Corruption Layer.
- **Compare** with simple SDK wrapping.
- **Derive** when ACL is justified.
- **Critique** integrations without ACL.
- **Design** an ACL for a complex external system.

---
title: BFF
aliases: [Backend for Frontend]
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[API Gateway]]", "[[Microservices]]"]
related: ["[[API Gateway]]", "[[Microservices]]"]
sources:
  - FoSA
  - SoundCloud BFF blog (Phil Calçado, 2015)
tags: [architecture, bff, microservices]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Backend for Frontend (BFF)

## Executive Summary

**Backend for Frontend (BFF)** is the pattern of **building a dedicated backend per client type** (mobile, web, partner API) rather than one shared backend. Each BFF aggregates backend services and tailors responses for its specific client. Originated at SoundCloud (2015, Phil Calçado). Solves the "one-size-fits-none" problem of shared APIs — mobile wants different data than web; partners want different shapes than first-party apps.

## Why This Exists

A shared API serving mobile, web, and partner clients tends to be a compromise — too much data for mobile (bandwidth waste), not enough for web (extra calls), wrong shape for partners. Each client tries to optimize differently. BFF gives each client its own backend that aggregates from shared services and shapes responses ideally.

## Core Intuition

Restaurants with different cuisines have different kitchens. A single fusion kitchen serves no one well. BFF is one kitchen per cuisine: mobile-kitchen optimizes for mobile diners; web-kitchen for web. Each calls the same wholesale ingredient suppliers (backend services) but prepares differently.

## Internal Mechanics

**Topology:**
- Mobile BFF for mobile clients.
- Web BFF for web clients.
- Partner API BFF for B2B.
- Each BFF calls common backend microservices.
- Each tailors aggregation, filtering, response shape.

**Responsibilities:**
- Aggregate calls to backend services.
- Filter data the client doesn't need.
- Transform formats (e.g., GraphQL for web).
- Handle client-specific auth nuances.

## Design Tradeoffs

**Benefits:**
- Client-optimized APIs.
- Decoupled client and backend evolution.
- Better mobile bandwidth.
- Reduced client round-trips.

**Costs:**
- Multiple BFFs to maintain.
- Code duplication across BFFs.
- Additional service hop.
- Team coordination.

## Real Production Examples

- **SoundCloud** — originated the pattern.
- **Netflix** — different backends per device.
- **Spotify, Uber** — variants of BFF.
- **GraphQL + BFF** — common combo.

## Interview Perspective

**Common questions:**
- "What's BFF?" → One backend per client type. Mobile, web, partner each get their own BFF.
- "BFF vs API Gateway?" → Gateway: general purpose, cross-cutting. BFF: client-specific aggregation and shaping.
- "When use BFF?" → Multiple distinct client types with different data needs.

**Senior-level:**
- BFF and API Gateway often coexist: Gateway handles auth/rate limit; BFF handles client-specific logic.
- GraphQL can serve a similar purpose (client requests shape they want) — sometimes replaces BFFs.
- Owning the BFF: the team that owns the client owns the BFF.

**Common mistakes:**
- One BFF for all clients (defeats purpose).
- Business logic in BFF (should be in backend services).
- Code duplication without shared libraries.

## Related Concepts

- [[API Gateway]] · [[Microservices]]

## Misconceptions

- **"BFF = API Gateway."** Gateway is general; BFF is client-specific.
- **"BFF replaces backend services."** It calls them; doesn't replace.
- **"Always need a BFF."** Only when multiple distinct client types diverge meaningfully.

## Failure Scenarios

- **BFF doing business logic** that should be in services.
- **Duplicate logic across BFFs.**
- **BFF as SPOF for its client type.**

## Practical Engineering Heuristics

- **One BFF per distinct client type.**
- **Owner: the client team.**
- **Thin BFF; business logic in services.**
- **Consider GraphQL as alternative.**

## Active Recall Questions

What's Backend for Frontend?::Dedicated backend per client type. Mobile, web, partner each get their own BFF that aggregates backend services.

Who originated BFF?::Phil Calçado at SoundCloud, ~2015.

BFF vs API Gateway?::Gateway: general cross-cutting. BFF: client-specific aggregation and shaping.

When use BFF?::Multiple distinct client types with diverging data needs.

What's the alternative to multiple BFFs?::GraphQL — clients request exactly the shape they want; one backend with client-flexible interface.

Who owns the BFF?::Usually the team that owns the client. Aligns evolution.

## Feynman Test

A mobile app and a web app have different data needs. Design with one shared API vs BFFs. Trade-offs?

Why is "BFF doing business logic" an anti-pattern?

## Mastery Checklist

- **Explain** BFF and its motivation.
- **Compare** with shared API and Gateway.
- **Derive** when BFF is justified.
- **Critique** business logic in BFFs.
- **Design** a BFF architecture for mobile + web + partners.

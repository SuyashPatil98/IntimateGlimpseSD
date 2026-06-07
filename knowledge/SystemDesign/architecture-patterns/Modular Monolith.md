---
title: Modular Monolith
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Monolith]]"]
related: ["[[Monolith]]", "[[Microservices]]", "[[Bounded Contexts]]"]
sources:
  - FoSA
  - Shopify engineering blog
  - DHH's "Majestic Monolith"
tags: [architecture, monolith, modularity]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Modular Monolith

## Executive Summary

A **modular monolith** is a single deployable application **internally organized into well-bounded modules**, each with its own clear interface, owned data, and minimal cross-module coupling. Combines the operational simplicity of a [[Monolith]] with the structural benefits of [[Microservices]]. Examples: **Shopify**, **Basecamp**, many large engineering organizations. The 2020s consensus: most teams should build modular monoliths and only extract microservices when specific pressures (independent scaling, organizational autonomy) demand it.

## Why This Exists

Naïve monoliths become "balls of mud" — every part touches every other; changes ripple; no team owns anything cleanly. Microservices solve modularity but introduce distributed-systems pain. Modular monolith asks: what if we kept the deployment simplicity of monoliths but enforced module boundaries internally? Combined with [[Bounded Contexts]] (DDD), the result scales much further than naïve monolith.

## Core Intuition

A single building with clear departments. Marketing, Engineering, Sales each have their own floor, their own filing system, their own meeting rooms. Cross-department communication is through formal interfaces (emails, meetings) — not someone walking into another department's filing cabinet. The building is one structure; the departments are autonomous.

## Internal Mechanics

**Module boundaries:**
- Each module owns its code, data (DB schema or tables), and public interface.
- Cross-module access only through public APIs (function calls within process).
- Internal implementation hidden.

**Data ownership:**
- Each module has its own tables.
- No foreign keys across modules (intentional).
- Modules communicate via API calls or events; not via shared DB joins.

**Build & deploy:**
- One artifact, but enforced module structure.
- Tooling enforces boundary violations (e.g., Shopify's "Packwerk").

**Future-proofing for split:**
- Modules with clean boundaries can be extracted to microservices later if needed.

## Design Tradeoffs

**Benefits:**
- All monolith benefits (simple deployment, debugging).
- Plus: modular structure, team ownership, clean boundaries.
- Easy to extract microservices when justified.
- No distributed-systems pain unless and until needed.

**Costs:**
- Requires discipline to enforce boundaries.
- Tooling helps but doesn't enforce alone.
- One technology stack.
- Single deployment unit.

## Real Production Examples

- **Shopify** — famous modular monolith; built `packwerk` to enforce boundaries.
- **Basecamp** — DHH's "Majestic Monolith" philosophy.
- **Etsy** — modular monolith for many years.
- **GitHub** — moved from monolith to modular monolith over time.

## Interview Perspective

**Common questions:**
- "Modular monolith vs microservices?" → Modular monolith: simpler ops, intra-process calls. Microservices: independent deploy + scale, distributed-systems cost.
- "How enforce modularity?" → Tooling (Packwerk, internal package boundaries), code review, layered architecture.
- "When extract microservice?" → When specific module needs independent scaling, deploy, or technology.

**Senior-level:**
- The modular monolith is the architecture most teams should converge on. Microservices is for specific pressure points.
- Shopify's `packwerk` is influential — making boundary violations a build-time error.
- "Death by 1000 microservices" is real; modular monolith avoids it.

**Common mistakes:**
- Treating modular monolith as a stepping stone to microservices (it may stay modular monolith forever).
- No boundary enforcement → drifts back to ball of mud.
- Sharing DB tables across modules.

## Related Concepts

- [[Monolith]] · [[Microservices]] · [[Bounded Contexts]]

## Misconceptions

- **"Modular monolith = microservices."** Different deployment topology; same modular benefits.
- **"Just build microservices instead."** Different cost profile.
- **"Module boundaries enforce themselves."** Tooling and discipline required.

## Failure Scenarios

- **Boundary erosion** without enforcement.
- **Cross-module DB queries** sneaking in.
- **Hidden coupling** through shared types.

## Practical Engineering Heuristics

- **Define module boundaries early** by domain (DDD).
- **Use boundary-enforcement tooling** (Packwerk, language-level encapsulation).
- **One DB schema per module.**
- **Public APIs between modules** even within the monolith.
- **Extract to microservice only when justified.**

## Active Recall Questions

What's a modular monolith?::Single deployable application internally organized into well-bounded modules with clean interfaces and owned data.

How does it differ from naïve monolith?::Enforced internal boundaries vs free-for-all coupling. Discipline + tooling.

How does it differ from microservices?::Same process, single deployment. No distributed-systems cost. Modules communicate via in-process calls.

What's Packwerk?::Shopify's tool for enforcing Ruby module boundaries at build time.

When should modular monolith become microservices?::When specific modules need independent scaling, deploy cadence, or technology stack.

Why is modular monolith often the "right answer"?::Combines monolith ops simplicity with microservices' modularity. Avoids distributed-systems pain.

## Feynman Test

Walk through extracting a module from a modular monolith to a microservice. Why is this easier than from a naïve monolith?

Why is "we'll go to microservices when needed" easier with a modular monolith?

## Mastery Checklist

- **Explain** modular monolith and its discipline.
- **Compare** with naïve monolith and microservices.
- **Derive** when modular monolith is the answer.
- **Critique** premature microservices.
- **Design** a modular monolith with clear module boundaries and tooling.

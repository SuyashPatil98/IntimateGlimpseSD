---
title: Architecture Characteristics
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[ADRs]]", "[[Architecture Fitness Functions]]", "[[CAP Theorem]]"]
sources:
  - FoSA Ch.4
tags: [architecture, characteristics, ilities]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Architecture Characteristics

## Executive Summary

**Architecture Characteristics** (the "-ilities") are the **non-functional requirements that define a system's qualities**: scalability, availability, reliability, performance, security, maintainability, testability, deployability, observability, and many more. While functional requirements define *what* a system does, characteristics define *how well*. From FoSA (Ford & Richards), they argue **characteristics are the *real* drivers of architecture decisions** — not features.

## Why This Exists

Most architecture discussions start with features, but features can be built in any architecture. The interesting question is: which qualities matter most? "Scalable" and "highly available" require different architectures. Identifying the top 3-5 characteristics for a system narrows the architectural choices dramatically.

## Core Intuition

When designing a car, the question "what's the architecture?" depends on what you need: a sports car prioritizes performance; an SUV prioritizes capacity; an EV prioritizes efficiency. Same general purpose (transport people), wildly different architectures driven by characteristic priorities.

## Common Characteristics (FoSA's taxonomy)

**Operational characteristics:**
- Availability, Continuity, Performance, Recoverability, Reliability, Robustness, Scalability.

**Structural characteristics:**
- Configurability, Extensibility, Installability, Localization, Maintainability, Portability, Supportability, Upgradeability.

**Cross-cutting characteristics:**
- Accessibility, Authentication, Authorization, Legal compliance, Privacy, Security, Usability.

## Design Process

1. **Identify** characteristics from requirements.
2. **Prioritize** — pick top 3-5.
3. **Choose** architecture style supporting those.
4. **Trade off** explicitly — improving one often hurts another (CAP theorem in macro).

## Tensions Between Characteristics

- Scalability vs simplicity.
- Performance vs maintainability.
- Security vs usability.
- Cost vs reliability.

Real architects choose **which** to optimize and accept where they're weaker.

## Real Production Examples

- **Netflix** — availability + scalability dominate.
- **Banking** — security + correctness dominate.
- **Trading systems** — performance + reliability dominate.
- **Startups** — agility + iterability dominate.

## Interview Perspective

**Common questions:**
- "What are architecture characteristics?" → Non-functional qualities (the -ilities) that define how a system behaves.
- "How do you prioritize them?" → Identify, prioritize top 3-5, choose architecture, accept trade-offs.
- "Common trade-offs?" → Scalability vs simplicity; performance vs maintainability; security vs usability.

**Senior-level:**
- "What architecture should I use?" is the wrong question. "What characteristics matter most?" is right.
- Composite characteristics like "elasticity" (auto-scaling) combine multiple.
- Many failed projects optimized the wrong characteristics.

**Common mistakes:**
- Trying to optimize everything.
- Not validating with stakeholders.
- Implicit prioritization that doesn't survive contact with reality.

## Related Concepts

- [[ADRs]] · [[Architecture Fitness Functions]] · [[CAP Theorem]]

## Misconceptions

- **"All -ilities are equally important."** No — pick 3-5.
- **"Characteristics are subjective."** Many are measurable.
- **"Optimizing characteristics is post-hoc."** Best done upfront.

## Failure Scenarios

- **Wrong characteristics prioritized** — system fails real needs.
- **Implicit priorities** — drift over time.
- **Characteristics shift** without architecture evolving.

## Practical Engineering Heuristics

- **Make characteristics explicit** in ADRs.
- **Prioritize top 3-5.**
- **Measure** characteristics where possible.
- **Revisit** as requirements evolve.

## Active Recall Questions

What are architecture characteristics?::Non-functional qualities that define how a system behaves. The "-ilities."

Why prioritize them?::Architecture choices depend on which characteristics matter most. Can't optimize everything.

Name common characteristics.::Availability, scalability, performance, reliability, security, maintainability, testability, observability, deployability.

What's a common trade-off?::Scalability vs simplicity. Performance vs maintainability. Security vs usability.

When should you identify characteristics?::Upfront, before choosing architecture style.

Why is "what architecture should I use?" the wrong question?::Architecture depends on which characteristics matter. Better question: "what characteristics matter most for our system?"

## Feynman Test

Two startups — one for trading, one for social media. Identify their top 3 characteristics and how they shape architecture differently.

Why is "we need all the -ilities" a doomed strategy?

## Mastery Checklist

- **Explain** architecture characteristics.
- **Compare** characteristics priorities across system types.
- **Derive** appropriate priorities from requirements.
- **Critique** architectures optimizing wrong characteristics.
- **Design** a prioritization framework for a given system.

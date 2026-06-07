---
title: Service-Based
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Microservices]]", "[[Monolith]]"]
related: ["[[Microservices]]", "[[Modular Monolith]]", "[[SOA]]"]
sources:
  - FoSA, Ch. 13
tags: [architecture, service-based]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Service-Based Architecture

## Executive Summary

**Service-Based Architecture** is the middle ground between [[Monolith]] and [[Microservices]] — typically **4-12 coarse-grained services with a shared database**. Each service is independently deployable but services may share data through a common DB. Avoids both monolith's coupling and microservices' distributed-data complexity. From the FoSA taxonomy (Ford & Richards) — a pragmatic style often appearing in real-world architectures by accident or design.

## Why This Exists

Microservices' "one DB per service" is operationally expensive: distributed transactions, eventual consistency, data replication. For many domains, that complexity isn't justified. Service-Based keeps a shared DB (or a few DBs) but splits the application layer into independently-deployable services. Less operational overhead than microservices; more flexibility than monolith.

## Core Intuition

A few small businesses sharing one bank account. They operate independently day-to-day; they trust the bank's records as the source of truth. Coordination on the shared account requires care, but most operations are independent.

## Internal Mechanics

**Topology:**
- 4-12 services typically.
- Each service: independently deployable, scaled.
- Shared DB (or small number of DBs).
- Coarser granularity than microservices.

**Communication:**
- HTTP/REST typical.
- Shared DB for state access.

**Data:**
- Read-heavy services share the DB.
- Writes coordinated via DB transactions.

## Design Tradeoffs

**Benefits:**
- Independent deploy and scale of services.
- Shared DB simplifies data consistency.
- Lower operational cost than microservices.
- Easier than microservices to get right.

**Costs:**
- Shared DB is a coupling point.
- Schema changes affect multiple services.
- Less independent scaling of data layer.
- "Hidden" via the DB → schema becomes an implicit contract.

## Real Production Examples

- Many "microservices" deployments are actually service-based.
- Mid-stage startups often arrive here naturally.
- Enterprise apps splitting a monolith into a few services + shared DB.

## Interview Perspective

**Common questions:**
- "Service-based vs microservices?" → Service-based: shared DB, fewer services. Microservices: per-service DB, finer granularity.
- "When use service-based?" → Mid-scale where microservices' complexity isn't justified but monolith is too constrained.

**Senior-level:**
- Service-based is often the *true* intermediate stage between monolith and microservices — many "microservices" are really service-based.
- The shared DB is the contentious bit — couples services but simplifies consistency.
- Reasonable choice for mid-scale where you don't yet have ops maturity for microservices.

**Common mistakes:**
- Calling it microservices when it's service-based.
- Tight coupling through DB schema.
- Lack of clear service boundaries.

## Related Concepts

- [[Microservices]] · [[Monolith]] · [[Modular Monolith]] · [[SOA]]

## Misconceptions

- **"Service-based = microservices."** Differs in data ownership.
- **"Shared DB is always wrong."** For service-based, it's the explicit choice.
- **"Should always migrate to full microservices."** Service-based may be the right end state.

## Failure Scenarios

- **DB schema change** breaks multiple services.
- **DB performance** affects all services.
- **Hidden coupling via shared tables.**

## Practical Engineering Heuristics

- **Accept the shared DB consciously.**
- **Treat schema as a contract** — version, coordinate changes.
- **Identify service boundaries clearly.**
- **Don't pretend you have microservices when you don't.**

## Active Recall Questions

What's Service-Based Architecture?::4-12 coarse-grained services with shared database. Middle ground between monolith and microservices.

How is it different from microservices?::Shared DB instead of per-service DB. Fewer, coarser services. Lower operational cost.

When choose service-based over microservices?::Mid-scale where you need deployment independence but not full data isolation. Microservices' complexity not justified.

What's the main coupling point?::Shared DB schema. Changes affect multiple services.

Is service-based "less mature" than microservices?::No — it's a valid choice for many workloads. Often the right end state.

## Feynman Test

Compare service-based with microservices for a mid-stage SaaS app. Trade-offs?

Why might "service-based" be the honest description for many "microservices" deployments?

## Mastery Checklist

- **Explain** service-based architecture.
- **Compare** with monolith and microservices.
- **Derive** when service-based fits.
- **Critique** mislabeled "microservices" deployments.
- **Design** a service-based architecture with explicit shared-DB strategy.

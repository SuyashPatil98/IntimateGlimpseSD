---
title: Federation
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Partitioning]]"]
related: ["[[Partitioning]]", "[[Microservices]]", "[[Bounded Contexts]]"]
sources:
  - system-design-primer (Donne Martin) — "Federation (functional partitioning)"
  - FoSA, Ch. 13 (service-based architecture, related)
  - DDIA, Ch. 6 (touches in partitioning discussion)
tags: [distributed-systems, partitioning, architecture]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Federation

## Executive Summary

Federation (also: **functional partitioning**) splits data and services **by function or domain** rather than by row/key. Instead of one user-database shard 1-of-100, you have a *user service* DB, a *billing service* DB, a *catalog service* DB — each on its own infrastructure. Different from horizontal sharding: federation partitions by *kind of data*, not by *which data of a kind*. It's the foundational pattern behind [[Microservices]] data ownership and is often the *first* scaling step before resorting to per-table sharding.

## Why This Exists

Before sharding individual tables (which is complex), most systems can dramatically scale by splitting along functional lines. Your `users` table doesn't need to share a database with `orders` and `inventory`. Federating gives each domain its own DB — smaller dataset, focused query patterns, independent scaling, isolated failure. Sharding individual domains comes *later*, if at all.

## Core Intuition

Imagine your company's database is a single warehouse holding inventory, HR records, accounting books, and customer data. As the company grows, the warehouse overflows. Two paths:

1. **Federation** — separate buildings for each function (HR building, accounting building, etc.).
2. **Sharding** — split the inventory across multiple identical warehouses (warehouse 1: A-M items, warehouse 2: N-Z items).

Federation is the first move because the buildings are independent — different security, different staff, different visiting hours. Sharding adds complexity *within* each function.

## Internal Mechanics

**Federation strategies:**

1. **One database per service** — each microservice owns its DB; no cross-service joins; communication via APIs/events.
2. **One database per business domain** — group related services around a domain (User, Order, Payment, Inventory).
3. **One database per tenant** (in multi-tenant SaaS) — variant of federation; tenant-level isolation.

**Communication across federated boundaries:**

- **Synchronous API calls** — service A asks service B for data when needed. Coupling + latency.
- **Event-driven sync** — service B publishes change events; A subscribes and maintains a local read model. [[CDC]] or [[Event-Driven Architecture]].
- **Read-model aggregation** — a separate service builds joined read models from upstream events.

**Cross-domain queries** are intentionally hard. The discipline: if you need a query across domains often, you've probably drawn the boundary wrong.

## Architecture Diagrams

```
HORIZONTAL SHARDING:
  users-shard-1 ──┐
  users-shard-2 ──┼─→ same schema, different rows
  users-shard-3 ──┘

FEDERATION:
  users-db          ─→ user schema
  orders-db         ─→ order schema
  inventory-db      ─→ inventory schema
  payments-db       ─→ payment schema
                       ↑ different schemas, different domains
```

The two are **orthogonal**. Production systems often federate first, then shard within a domain if it grows.

## Design Tradeoffs

**Benefits:**
- Each domain scales independently.
- Smaller datasets → smaller indexes, faster queries within domain.
- Failure isolation — billing DB outage doesn't kill user lookups.
- Different technologies per domain (Postgres for transactional, ClickHouse for analytics, Redis for ephemeral).
- Maps naturally to team ownership ([[Microservices]] / [[Bounded Contexts]]).

**Costs:**
- **Cross-domain queries are hard.** No more `JOIN users ON orders` — you need API calls, event streams, or aggregated read models.
- **Transactions across domains require sagas or 2PC** — both painful.
- **Operational footprint multiplies** — N databases to monitor, back up, schema-migrate.
- **Data duplication** — read models replicate upstream data; care needed to keep consistent.

## Real Production Examples

- **Amazon's classic transition** — early Amazon had a giant monolithic DB. The famous Bezos memo led to mandatory federation by service; each service owns its data.
- **Netflix** — strict per-service ownership; cross-service data via APIs or stream-derived read models.
- **Stripe** — federated by domain (charges, customers, subscriptions, balance). Within domain, sometimes sharded.
- **Uber** — federation by service plus sharding for high-volume domains (trips, locations).
- **Most modern microservices architectures** — federation is the default.

## Interview Perspective

**Common questions:**
- "What's federation?" → Splitting data by function/domain (vs sharding by row). Each domain owns its DB.
- "Federation vs sharding?" → Federation is by kind; sharding is by which. Orthogonal; often combined.
- "How do you query across federated DBs?" → API calls, event-driven read models, aggregation services. Joins are intentionally avoided.

**Senior-level:**
- Federation is the *first* scaling step. Sharding is the *second*. Most companies federate but never need to shard individual domains.
- Drawing domain boundaries is the hardest part — [[Bounded Contexts]] is the canonical framework.
- Federation enables organizational scaling (Conway's Law); each domain maps to a team.
- The cost of federation is paid in queries-across-domains. If those are rare, federation is cheap; if frequent, it's painful.

**Common mistakes:**
- Federating prematurely (before scale demands it) — operational complexity exceeds the benefit.
- Drawing domain boundaries that don't match real query patterns — cross-domain queries become the system's primary work.
- Forgetting that federation requires designing for eventual consistency across domains.

## Related Concepts

- [[Partitioning]] — sharding is the row-level partitioning; federation is functional partitioning.
- [[Microservices]] — federation is microservices' data layer pattern.
- [[Bounded Contexts]] — DDD term for the domains being federated.
- [[CDC]] / [[Event-Driven Architecture]] — common mechanism for cross-domain data sync.
- [[Saga Pattern]] — cross-domain transactions.

## Misconceptions

- **"Federation = microservices."** Federation is the data-layer pattern; microservices are the broader service pattern. They're closely related but distinct.
- **"Federation eliminates the need for sharding."** It's the *first step*. Individual federated DBs may still need sharding at higher scale.
- **"Federation makes everything faster."** Within domains, yes. Across domains, slower (network hops vs local joins).

## Failure Scenarios

- **Distributed transaction needed unexpectedly** — two domains' data must commit atomically. Mitigation: saga, eventual consistency with reconciliation.
- **Cross-domain query joins** — discover too late that a feature needs joining across 4 databases. Mitigation: aggregation service, read model.
- **Operational sprawl** — 50 databases, 50 backups, 50 schema migrations. Mitigation: standardized tooling, paved-road infrastructure.

## Practical Engineering Heuristics

- **Federate before sharding.** Almost always the cheaper first step.
- **Domain boundaries = query boundaries.** If your queries cross domains constantly, redraw.
- **Async between domains by default.** Sync API calls couple deployments and propagate failures.
- **Standardize cross-DB tooling.** Don't let each team invent its own backup/migration scheme.

## Active Recall Questions

What is federation (functional partitioning)?::Splitting data by function or domain rather than by row/key. Each domain (users, orders, billing) gets its own DB.

How is federation different from sharding?::Federation is by *kind* of data (users vs orders). Sharding is by *which* data of one kind (users 1-1M, users 1M-2M). Orthogonal.

What's the typical scaling order?::Federate first. Shard later if individual domains grow beyond a single DB.

How are cross-federation queries handled?::Synchronous API calls between services, event-driven sync with local read models, or aggregation services. Joins across DBs are intentionally avoided.

What's the main cost of federation?::Cross-domain queries become harder. Transactions across domains require sagas or 2PC. Operational footprint grows.

How does federation relate to microservices?::Federation is microservices' data layer. Each microservice owns its database; cross-service data via APIs or events.

## Feynman Test

You have a monolithic app with one giant DB. Walk through federating it. Which boundaries do you draw? What does the first query-across-DBs look like?

Why is federation almost always the cheaper first scaling step than sharding?

## Mastery Checklist

- **Explain** federation and contrast with horizontal sharding.
- **Compare** federation, sharding, and combined approaches.
- **Derive** appropriate domain boundaries for a given application.
- **Critique** premature federation in small systems.
- **Design** a federated architecture with explicit cross-domain communication.

[^prim-Fed]: system-design-primer, "Federation (functional partitioning)."

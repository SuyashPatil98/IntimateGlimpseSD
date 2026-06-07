---
title: Microservices
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Monolith]]", "[[Modular Monolith]]"]
related: ["[[Monolith]]", "[[Modular Monolith]]", "[[SOA]]", "[[Bounded Contexts]]", "[[API Gateway]]", "[[Service Mesh]]", "[[Saga Pattern]]"]
sources:
  - FoSA, Ch. 17
  - Fowler & Lewis (microservices articles)
  - SWE@Google
  - SDI vol 1
tags: [architecture, microservices, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Microservices

## Executive Summary

**Microservices** is an architectural style where an application is composed of **small, autonomous services**, each focused on a single capability, **independently deployable**, owning its own data, and communicating via lightweight protocols (HTTP/REST, gRPC, async messaging). Popularized by Netflix, Amazon, Uber in the 2010s. Benefits: independent deployment, technology flexibility, team autonomy, independent scaling. Costs: distributed-systems pain (CAP, latency, debugging, eventual consistency), operational complexity (deployment, observability), data management harder. **Not the right default for most teams** — but transformative when justified.

## Why This Exists

Once an organization passes ~20 engineers, a monolith creates deployment coupling — every team's changes block every other's. Independent scaling becomes impossible (you scale the whole monolith for one hot path). Microservices break these couplings: each team owns one or more services; deploys independently; scales independently; uses appropriate tech per service.

## Core Intuition

A fleet of small specialized ships instead of one supertanker. Each captain (team) makes decisions. Communication via radio (network). Ships go to ports independently. Faster overall fleet velocity — but coordination is now a real problem.

## Core Principles

1. **Single responsibility** — each service does one thing well.
2. **Independent deployment** — deploy without coordinating with others.
3. **Owned data** — each service has its own database; no sharing.
4. **Smart endpoints, dumb pipes** — logic in services; transport is simple (HTTP, MQ).
5. **Decentralized governance** — teams choose tech for their service.
6. **Failure-resilient** — assume dependencies fail.
7. **Observability** — distributed tracing essential.

## Internal Mechanics

**Service structure:**
- One bounded context per service (DDD).
- Own DB / data store.
- Public API (REST, gRPC).
- Health endpoints.

**Communication:**
- Synchronous: HTTP/REST, gRPC.
- Asynchronous: events via Kafka, message queues.
- See [[CDC]] and [[Outbox Pattern]] for state sync.

**Infrastructure:**
- Container orchestration (Kubernetes).
- Service mesh (Istio, Linkerd).
- API Gateway at edge.
- Distributed tracing (Jaeger, Zipkin).
- Centralized logging.

**Data management:**
- No shared DB.
- Cross-service queries via API or replicated read models.
- Distributed transactions via sagas.

## Design Tradeoffs

**Benefits:**
- Independent deploy + scale.
- Team autonomy.
- Technology flexibility per service.
- Fault isolation.
- Mature for very large orgs.

**Costs:**
- **Distributed-systems pain** — latency, partial failures, consistency.
- **Operational complexity** — many services to monitor, deploy, secure.
- **Data management hard** — no joins; eventual consistency.
- **Debugging cross-service** — distributed tracing essential.
- **Testing complexity** — contract testing, integration tests.
- **Operational cost** — many deployments, much infrastructure.

## Real Production Examples

- **Netflix** — early pioneer; 100s of services.
- **Amazon** — "two-pizza teams" → many services.
- **Uber** — extreme microservices (>2000 services).
- **Spotify** — squad model + microservices.
- **Many modern startups** — adopt prematurely.

## Interview Perspective

**Common questions:**
- "Why microservices?" → Independent deploy + scale, team autonomy, technology flexibility.
- "Costs?" → Distributed-systems pain, ops complexity, data management.
- "When to adopt?" → When team scaling or specific scale needs justify the costs.

**Senior-level:**
- Microservices is an organizational pattern as much as a technical one. Conway's Law applies.
- "Microservices premium" — the operational complexity tax is real. Pay only when justified.
- "Distributed monolith" — microservices that deploy together, share DB, depend tightly. Worse than monolith.

**Common mistakes:**
- Adopting microservices before the team needs them.
- Sharing DBs across services → distributed monolith.
- No observability infrastructure → debugging nightmare.
- Underestimating operational cost.

## Related Concepts

- [[Monolith]] · [[Modular Monolith]] · [[SOA]] · [[Bounded Contexts]]
- [[API Gateway]] · [[Service Mesh]] · [[Saga Pattern]] · [[CDC]] · [[Outbox Pattern]]

## Misconceptions

- **"Microservices = better."** Wrong default; costly when premature.
- **"Microservices = small."** Granularity is workload-dependent.
- **"Microservices solve all coupling."** New couplings (network) replace old.

## Failure Scenarios

- **Distributed monolith** — services tightly coupled.
- **Cascading failures** without circuit breakers.
- **Data inconsistency** without sagas / idempotency.
- **Operational meltdown** without observability.

## Practical Engineering Heuristics

- **Don't start with microservices.** Build modular monolith; extract when justified.
- **One DB per service.**
- **Async by default** between services.
- **Invest in observability** before microservices.
- **API contracts and contract testing.**
- **Service mesh** when service count grows.

## Active Recall Questions

What are microservices?::Small, autonomous services, each focused on one capability, independently deployable, owning their data.

Six microservices principles?::Single responsibility, independent deploy, owned data, smart endpoints (dumb pipes), decentralized governance, failure-resilient, observable.

When are microservices the wrong choice?::Early-stage; small teams; workloads not demanding independent scaling. Cost > benefit.

What's a distributed monolith?::Microservices that deploy together, share DB, depend tightly. Has all costs and few benefits.

How do microservices manage cross-service data?::API calls, async events, replicated read models. No shared DB, no joins across services.

Name three companies known for microservices.::Netflix, Amazon, Uber, Spotify.

## Feynman Test

A 5-person startup considers microservices. Argue the case for not adopting yet.

Why is "premature microservices" worse than "ball of mud monolith"?

## Mastery Checklist

- **Explain** microservices and their principles.
- **Compare** with monolith and modular monolith.
- **Derive** when microservices are justified.
- **Critique** distributed monolith anti-patterns.
- **Design** a microservices architecture with proper observability and data ownership.

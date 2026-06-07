---
title: Saga Pattern
area: architecture-patterns
status: mature
difficulty: advanced
prerequisites: ["[[Distributed Transactions]]", "[[Microservices]]"]
related: ["[[Distributed Transactions]]", "[[Two-Phase Commit]]", "[[Microservices]]", "[[Idempotency]]"]
sources:
  - Garcia-Molina & Salem, 1987 (original Sagas paper)
  - FoSA Ch.14
  - SDI vol 2
tags: [architecture, saga, distributed-transactions]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Saga Pattern

## Executive Summary

A **saga** is a **long-running transaction decomposed into a sequence of local transactions, each with a compensating action**. If any step fails, previously completed steps are undone via their compensations. Avoids [[Two-Phase Commit]]'s blocking semantics. Two styles: **choreography** (services react to events) and **orchestration** (central coordinator drives steps). The canonical answer to "atomic transactions across microservices" — at the cost of complexity and eventual consistency.

## Why This Exists

Distributed transactions via 2PC block on coordinator failure and don't scale across microservices well. Sagas trade strict ACID for **eventual atomicity via compensation**: each step is a local transaction; failures undo prior work. Used wherever cross-service workflows must achieve all-or-nothing without distributed locking.

## Core Intuition

Booking a trip: reserve flight, hotel, rental car. If car booking fails, cancel hotel and flight. Each step is independent and reversible (via compensation). If everything succeeds, the trip is booked. If anything fails, compensations roll back.

## Internal Mechanics

**Saga = sequence of local transactions T1, T2, ..., Tn**

Each Ti has a compensating action Ci. If Ti fails:
- Run C1, C2, ..., C(i-1) in reverse order.
- Saga aborted.

If all succeed: saga complete.

**Two styles:**

### Choreography
- No central coordinator.
- Each service listens for events; performs its step; emits next event.
- Pros: decentralized, simple.
- Cons: flow scattered; hard to understand.

### Orchestration
- Central coordinator (orchestrator) calls each service in sequence.
- On failure, orchestrator invokes compensations.
- Pros: explicit workflow; observable.
- Cons: orchestrator is central component.

## Design Tradeoffs

**Benefits:**
- Works across microservices.
- No distributed locking.
- Each step independently committable.
- Resilient to coordinator failure (vs 2PC).

**Costs:**
- Eventual atomicity, not ACID.
- Compensation logic complex.
- Visible intermediate states.
- Idempotency essential.
- Hard to debug.

## Compensation Subtleties

Compensations aren't always simple inverses:
- Canceling an email is impossible (mitigation: send apology).
- Refunding a charge isn't always the same as not charging.
- Some operations have irreversible side effects.

The application must be designed so compensations are meaningful.

## Real Production Examples

- **E-commerce orders** — reserve inventory, charge payment, create shipment. Saga on failure.
- **Travel booking** — flight, hotel, car.
- **Stripe payment flows** — sagas with idempotency.
- **Temporal, Camunda, AWS Step Functions** — orchestration platforms.

## Interview Perspective

**Common questions:**
- "What's a saga?" → Sequence of local transactions with compensations. Provides eventual atomicity across services.
- "Choreography vs orchestration?" → Choreography: event-driven, decentralized. Orchestration: central coordinator.
- "Vs 2PC?" → 2PC: synchronous, blocking, ACID. Saga: async, non-blocking, eventual.

**Senior-level:**
- Sagas are the modern answer for cross-service workflows; 2PC is rarely the right tool.
- Compensation design is the hard part — irreversible operations need careful handling.
- Idempotency is essential: compensations may be retried.

**Common mistakes:**
- No compensation for steps with side effects.
- Forgetting idempotency.
- Choreography without observability — flow becomes a mystery.

## Related Concepts

- [[Distributed Transactions]] · [[Two-Phase Commit]] · [[Microservices]] · [[Idempotency]]

## Misconceptions

- **"Saga = transaction."** Eventual atomicity, not ACID.
- **"Compensation = rollback."** Application-level; may not perfectly undo.
- **"Choreography always better."** Orchestration often clearer for complex flows.

## Failure Scenarios

- **Compensation fails** — manual intervention.
- **Step succeeds but ack lost** — duplicate execution.
- **Stuck saga** — orchestrator down or step never returns.
- **Visible intermediate state** confuses users.

## Practical Engineering Heuristics

- **Design compensations explicitly** for every step.
- **Idempotency keys everywhere.**
- **Orchestrator for complex flows; choreography for simple events.**
- **Observability** — distributed tracing essential.
- **Saga frameworks** (Temporal) handle much of this.

## Active Recall Questions

What's a saga?::Sequence of local transactions with compensating actions. Eventual atomicity across services without distributed locks.

Choreography vs orchestration?::Choreography: event-driven, decentralized. Orchestration: central coordinator drives steps.

Saga vs 2PC?::2PC: synchronous, blocking, ACID. Saga: async, non-blocking, eventual atomicity.

What's compensation?::Application-level undo of a previously-committed step. Not always a perfect inverse (e.g., can't un-send email).

Name a saga framework.::Temporal, AWS Step Functions, Camunda, Conductor.

Why is idempotency essential?::Steps and compensations may be retried; must produce same effect on duplicate calls.

## Feynman Test

Design a flight-hotel-car booking saga. What are compensations? What happens if hotel booking succeeds but car fails?

Why is the orchestrator a useful pattern despite being a central component?

## Mastery Checklist

- **Explain** saga pattern.
- **Compare** choreography and orchestration.
- **Derive** appropriate compensations for given operations.
- **Critique** sagas without explicit idempotency.
- **Design** a microservices flow using sagas with orchestrator.

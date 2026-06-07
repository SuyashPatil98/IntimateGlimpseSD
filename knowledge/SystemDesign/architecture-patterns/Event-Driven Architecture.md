---
title: Event-Driven Architecture
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Pub-Sub]]", "[[Event Streams]]"]
related: ["[[Pub-Sub]]", "[[Event Streams]]", "[[Event Sourcing]]", "[[CDC]]", "[[Microservices]]"]
sources:
  - FoSA, Ch. 14
  - DDIA, Ch. 11
tags: [architecture, eda, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Event-Driven Architecture

## Executive Summary

**Event-Driven Architecture (EDA)** is an architectural style where **components communicate by producing and consuming events** rather than direct synchronous calls. Loose coupling, scalability, asynchrony are the wins; complexity, debugging difficulty, and eventual consistency are the costs. Two main flavors: **mediator** (a central orchestrator routes events) and **broker** (decentralized — services subscribe directly to event streams). The dominant style for modern microservices integration.

## Why This Exists

Synchronous request/response couples services tightly: producer must know consumer's address, must wait for response, fails if consumer is down. Events flip this: producer fires-and-forgets; consumers react when ready; new consumers added without producer changes. Trade-off: harder debugging, eventual consistency.

## Core Intuition

A newspaper publishing system. The publisher prints the paper; doesn't know who reads it. Subscribers get copies and decide what to do. Adding a new subscriber doesn't affect the publisher. The newspaper (event) carries information; readers interpret.

## Two Topologies

### Mediator Topology

- Central orchestrator receives initial event.
- Routes events to participants based on workflow.
- Examples: business process management (BPM), Camunda, Apache Camel.

**Pros:** centralized workflow visibility, easy to evolve.
**Cons:** mediator can become bottleneck and SPOF.

### Broker Topology

- No central mediator.
- Events flow through pub/sub broker.
- Each service subscribes to events it cares about; emits new events.

**Pros:** decentralized; highly scalable.
**Cons:** workflow scattered across services; harder to trace.

## Internal Mechanics

**Event:**
- Immutable record of something that happened.
- Typically named in past tense: `OrderPlaced`, `UserSignedUp`.
- Has timestamp, schema, payload.

**Producer:**
- Publishes event to broker / topic.
- Doesn't know consumers.

**Consumer:**
- Subscribes to topic; processes events.
- May emit further events.

**Broker:**
- Kafka, RabbitMQ, AWS EventBridge, Google Pub/Sub.

## Design Tradeoffs

**Benefits:**
- Loose coupling.
- Independent scaling.
- New consumers without producer changes.
- Natural async + retry.
- Audit log (events are records).

**Costs:**
- Eventual consistency.
- Hard to trace flows.
- Event schema evolution.
- Debugging requires distributed tracing.
- Failure modes subtle.

## Real Production Examples

- **Uber** — trip lifecycle as events.
- **Netflix** — service integration via events.
- **Amazon retail** — order placed → fulfillment, billing, inventory react.
- **Most modern microservices.**

## Interview Perspective

**Common questions:**
- "What's EDA?" → Components communicate via events; loose coupling; async.
- "Mediator vs Broker?" → Mediator: central orchestration. Broker: decentralized.
- "Trade-off?" → Loose coupling + async vs eventual consistency + debugging difficulty.

**Senior-level:**
- EDA pairs naturally with [[Microservices]] for service integration.
- Event schemas need versioning; producers and consumers evolve independently.
- Choreography (broker) vs orchestration (mediator) is a deep design choice.

**Common mistakes:**
- Treating EDA as fire-and-forget when downstream needs reliability.
- No event schema discipline.
- "Hidden coupling" through shared event types.

## Related Concepts

- [[Pub-Sub]] · [[Event Streams]] · [[Event Sourcing]] · [[CDC]] · [[Microservices]] · [[Saga Pattern]]

## Misconceptions

- **"EDA = pub/sub."** Pub/sub is a primitive; EDA is the architectural style.
- **"EDA = eventual consistency."** Often, but not necessarily.
- **"EDA eliminates coupling."** Schema and ordering coupling remain.

## Failure Scenarios

- **Event order matters but isn't guaranteed.**
- **Consumer fails repeatedly** without DLQ.
- **Schema mismatch** breaks consumers.
- **Event storm** under cascading reactions.

## Practical Engineering Heuristics

- **Define event schemas in a registry.**
- **Use past-tense event names.**
- **Version events** carefully.
- **Distributed tracing** essential.
- **Idempotency in consumers.**

## Active Recall Questions

What's Event-Driven Architecture?::Components communicate by producing and consuming events instead of direct synchronous calls.

Mediator vs Broker topology?::Mediator: central orchestrator routes events. Broker: decentralized; services subscribe via broker.

What's an event?::Immutable record of something that happened. Past tense (OrderPlaced, UserSignedUp). Timestamp + payload + schema.

Benefits of EDA?::Loose coupling, async, independent scaling, new consumers without producer changes.

Costs of EDA?::Eventual consistency, hard to trace, schema evolution, debugging complexity.

When use mediator vs broker?::Mediator: workflow visibility important. Broker: maximum decoupling, scale.

## Feynman Test

Walk through "user places order" in EDA broker topology. What services react?

Why is debugging an event-driven system fundamentally harder than synchronous?

## Mastery Checklist

- **Explain** EDA and its topologies.
- **Compare** mediator and broker.
- **Derive** when EDA is appropriate.
- **Critique** EDA without schema discipline or tracing.
- **Design** an event-driven microservices architecture.

---
title: API Gateway
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Microservices]]", "[[Reverse Proxy]]"]
related: ["[[BFF]]", "[[Service Mesh]]", "[[Reverse Proxy]]", "[[Rate Limiting]]"]
sources:
  - FoSA
  - SDI vol 1
  - system-design-primer
tags: [architecture, api-gateway, microservices]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# API Gateway

## Executive Summary

An **API Gateway** is a single entry point in front of microservices that **handles cross-cutting concerns: routing, authentication, rate limiting, request transformation, caching, monitoring, response aggregation**. Sits between clients and backend services. Examples: **Kong, AWS API Gateway, Apigee, Zuul, Envoy as gateway, Tyk**. Reduces client complexity (one endpoint, one auth) and centralizes policies. Risk: becoming a monolith of cross-cutting logic.

## Why This Exists

Without a gateway, every client must know every service's address; each client must implement auth, retries, rate limiting; cross-cutting concerns scatter. With a gateway: clients hit one URL; gateway routes, authenticates, applies policies, aggregates. Backends focus on business logic.

## Core Intuition

A hotel concierge. Guests don't navigate to housekeeping, kitchen, valet — they talk to the concierge, who routes their request. The concierge handles common needs (room key, restaurant recommendation) without involving every department. Specialized requests get forwarded.

## Internal Mechanics

**Common functions:**
- **Request routing** — path/host-based → backend service.
- **Authentication** — verify JWT, API key, OAuth.
- **Rate limiting** — per client / API key.
- **Request/response transformation** — protocol bridging (REST → gRPC), field renaming.
- **Caching** — cache common responses.
- **Aggregation** — call multiple backends, combine responses.
- **Monitoring** — central place for metrics, logs, traces.
- **Circuit breaking** — protect backends.

## Design Tradeoffs

**Benefits:**
- Single client entry point.
- Centralized cross-cutting concerns.
- Backend simplification.
- Easier client evolution.

**Costs:**
- Gateway is critical path — must be reliable.
- Becomes monolith of policy logic if not careful.
- Performance overhead.
- Configuration complexity.

## Real Production Examples

- **Kong** — open-source; widely used.
- **AWS API Gateway** — managed; integrates with Lambda.
- **Apigee** — enterprise.
- **Netflix Zuul / Spring Cloud Gateway** — Netflix-stack.
- **Cloudflare API Shield** — edge-based.
- **Envoy as API Gateway.**

## Interview Perspective

**Common questions:**
- "What's an API Gateway?" → Single entry point handling cross-cutting concerns for microservices.
- "Why use it?" → Simplify clients, centralize policies, protect backends.
- "Gateway vs LB?" → Gateway: smart, application-level. LB: dumb, traffic distribution.

**Senior-level:**
- The gateway can become a chokepoint — must be horizontally scalable and highly available.
- BFF pattern often pairs with gateway for client-specific aggregation.
- Service mesh handles east-west traffic; gateway handles north-south.

**Common mistakes:**
- Putting too much logic in the gateway (becomes a monolith).
- No HA — gateway as SPOF.
- Gateway-coupling client to backend internals.

## Related Concepts

- [[BFF]] · [[Service Mesh]] · [[Reverse Proxy]] · [[Rate Limiting]] · [[Microservices]]

## Misconceptions

- **"Gateway = LB."** Gateway is smarter; protocol-aware; applies policies.
- **"Gateway eliminates the need for service discovery."** Often uses it underneath.
- **"More features in gateway = better."** Becomes the new monolith.

## Failure Scenarios

- **Gateway down** → all traffic blocked.
- **Gateway slow** → all requests slow.
- **Gateway bug** affects everyone.
- **Misconfigured rate limit** blocks valid traffic.

## Practical Engineering Heuristics

- **HA gateway cluster.**
- **Keep gateway logic minimal** — push to backends when possible.
- **Use BFF for client-specific aggregation.**
- **Versioned APIs at gateway.**

## Active Recall Questions

What's an API Gateway?::Single entry point handling cross-cutting concerns (auth, rate limit, routing, transformation) for backend services.

Gateway vs LB?::LB: traffic distribution (often L4). Gateway: application-level smarts (auth, routing by path).

Name three API gateway implementations.::Kong, AWS API Gateway, Apigee, Zuul, Envoy, Tyk.

What's BFF and how does it relate?::Backend for Frontend — client-specific gateway. May coexist with general gateway.

Gateway risks?::Gateway as SPOF; becoming monolith of policy logic; performance overhead; configuration complexity.

North-south vs east-west traffic?::North-south: client ↔ backend (gateway domain). East-west: service ↔ service (service mesh domain).

## Feynman Test

A web app with 30 microservices: how does the client find them via a gateway?

Why is "putting business logic in the gateway" a common anti-pattern?

## Mastery Checklist

- **Explain** API Gateway and its functions.
- **Compare** with LB, reverse proxy, service mesh.
- **Derive** when gateway is necessary.
- **Critique** business logic in gateway.
- **Design** a gateway tier with proper HA and minimal logic.

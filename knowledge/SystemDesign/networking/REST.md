---
title: REST
area: networking
status: draft
difficulty: beginner
prerequisites: ["[[HTTP/1.1]]"]
related: ["[[gRPC]]", "[[JSON]]", "[[HTTP/1.1]]"]
builds_toward: []
sources:
  - 'Fielding dissertation — Architectural Styles and the Design of Network-based Software Architectures (2000)'
  - SDI vol 1
  - FoSA
tags: [networking, rest, api]
created: 2026-06-04
last_reviewed: 2026-06-04
---

# REST

## Executive Summary

**REST** (Representational State Transfer) is an architectural style for web APIs introduced in Roy Fielding's 2000 dissertation. The web's de facto API style: HTTP verbs (GET/POST/PUT/DELETE) act on noun-keyed resources (`/users/42`), state lives on the server, responses are usually JSON. Vast majority of public APIs follow REST.

## Why This Exists

Pre-REST web APIs were RPC-style (SOAP, XML-RPC) — verb-centric, brittle, heavy. REST's bet: align with HTTP's existing semantics (uniform interface, statelessness, cacheable) rather than tunnel RPC through HTTP.

## Core Intuition

Resources are nouns identified by URLs. HTTP methods are the verbs. Stateless requests carry everything the server needs. Responses include hypermedia (HATEOAS, in theory).

```
GET /users/42         → fetch user 42
POST /users           → create user
PUT /users/42         → replace user 42
PATCH /users/42       → partial update
DELETE /users/42      → delete user 42
```

## Fielding's Constraints

1. **Client-server** — separation of concerns.
2. **Stateless** — each request carries all needed context.
3. **Cacheable** — responses indicate cacheability.
4. **Uniform interface** — resources, representations, self-descriptive messages, HATEOAS.
5. **Layered system** — intermediaries (CDN, gateway) transparent.
6. **Code-on-demand** (optional, rarely used).

In practice, most "REST" APIs satisfy 1–4 partially; few are truly RESTful by Fielding's definition (especially HATEOAS).

## Design Tradeoffs

**Strengths:**
- Universal client support (every HTTP library).
- Cacheable via standard HTTP semantics (ETag, Cache-Control).
- Debuggable (curl, browser, JSON eyeball).
- Loose coupling — schema-less helps independent evolution.

**Weaknesses:**
- **Schema-loose** — typos and breaking changes pass silently without OpenAPI/JSON Schema discipline.
- **Verbose wire format** (JSON) — 5–10× bigger than Protobuf.
- **No native streaming** — must use SSE / WebSockets.
- **Verb mismatches** — many operations don't fit CRUD; `POST /actions/calculate` is common.

## Real Production

- **Most public web APIs** — Twitter, GitHub, Stripe, Twilio, Slack.
- **Internal services** — common for browser-facing; competing with [[gRPC]] for service-to-service.

## Misconceptions

- **"REST = JSON."** Originally agnostic; XML or anything else works. JSON dominates by convention.
- **"REST = stateless on server."** Means each request carries its context; server can have state (DB).
- **"GraphQL replaces REST."** Different trade-offs (query flexibility vs caching); coexist in practice.

## Related Concepts

- [[HTTP/1.1]] — underlying protocol.
- [[JSON]] — typical representation.
- [[gRPC]] — RPC alternative.
- [[BFF]] — pattern often layering REST over downstream services.

## Active Recall Questions

What did Roy Fielding contribute in 2000?::Defined REST as an architectural style for distributed hypermedia in his PhD dissertation; codified the constraints (client-server, stateless, cacheable, uniform interface, layered, code-on-demand).

What does "stateless" mean in REST?::Each request carries all the context needed to process it; the server doesn't store per-client session state (DB state is separate).

What is HATEOAS and why is it rare in practice?::Hypermedia As The Engine Of Application State — responses include links describing what the client can do next; rare because most clients hardcode URL templates anyway.

What's the trade-off between REST and gRPC?::REST: universal clients, cacheable, debuggable, JSON verbose, schema-loose. gRPC: compact binary, schema-strict, streaming, code-generated, not browser-native.

Why are many "REST" APIs not strictly RESTful by Fielding's definition?::Most lack HATEOAS, some require client knowledge of URL structure, some use POST for everything; pragmatic REST follows the spirit, not the letter.

What does Cache-Control: max-age=300 communicate?::The response can be cached and reused for 300 seconds before revalidating with the origin.

## Feynman Test

When would you choose REST over gRPC for a new API? Give three concrete scenarios.

---
title: Proxy
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Decorator]]", "[[Adapter]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.11
tags: [design-patterns, gof, structural]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Proxy

## Executive Summary

The **Proxy pattern** provides a **surrogate or placeholder for another object**, controlling access to it. Same interface; different implementation that wraps the real object. Common types: **Remote Proxy** (object on different machine), **Virtual Proxy** (lazy initialization), **Protection Proxy** (access control), **Caching Proxy** (caches results), **Smart Reference** (additional bookkeeping). Distinguished from [[Decorator]] (adds behavior) by intent: Proxy controls access.

## Why This Exists

Sometimes accessing the real object is expensive (remote), should be controlled (security), or should be deferred (lazy). Proxy provides a stand-in with the same interface, handling these concerns transparently.

## Core Intuition

A real estate agent (proxy) for a property owner. Buyers interact with the agent; the agent controls access to the owner. Same conversation interface; the proxy filters, schedules, validates before passing through.

## Common Proxy Types

### Remote Proxy
- Local stand-in for remote object.
- Marshals calls over network.
- Example: RPC client stubs, RMI proxies.

### Virtual Proxy
- Stand-in for expensive-to-create object.
- Creates real object only on first use.
- Example: Hibernate lazy loading.

### Protection Proxy
- Controls access (auth, permissions).
- Filters method calls based on caller.

### Caching Proxy
- Caches results of expensive calls.
- Returns cached if available.

### Smart Reference
- Adds bookkeeping (reference counting, locking).

## Proxy vs Decorator

| Aspect | Proxy | Decorator |
|---|---|---|
| Intent | Control access | Add behavior |
| Relationship | Often manages lifecycle | Always passes through |
| Stack | Usually one | Often stacked |

Code can look identical; intent differs.

## Real Production Examples

- **Hibernate / JPA** — virtual proxies for lazy loading.
- **Java RMI, gRPC stubs** — remote proxies.
- **Spring AOP** — proxy-based aspect injection.
- **Caching layers** — caching proxies.

## Design Tradeoffs

**Benefits:**
- Transparent access control.
- Deferred initialization.
- Caching for free.

**Costs:**
- Indirection.
- Hidden behavior (surprising).

## Interview Perspective

**Common questions:**
- "What's Proxy?" → Surrogate that controls access to another object.
- "Proxy vs Decorator?" → Proxy: control access. Decorator: add behavior.
- "Types?" → Remote, Virtual (lazy), Protection, Caching, Smart Reference.

**Senior-level:**
- Spring AOP is proxy-based — most "magical" Spring features.
- Lazy loading proxies in ORMs cause famous N+1 query bugs.

**Common mistakes:**
- Confusing Proxy and Decorator.
- Lazy proxy when eager initialization fits.
- Proxies that hide too much.

## Related Concepts

- [[Decorator]] · [[Adapter]]

## Misconceptions

- **"Proxy = Decorator."** Different intent.
- **"Proxy always remote."** Many types are local.

## Failure Scenarios

- **N+1 queries** via lazy proxies.
- **Auth bypass** if proxy not used everywhere.
- **Performance surprise** when proxy adds latency.

## Practical Engineering Heuristics

- **Choose proxy type intentionally.**
- **Document proxy behavior.**
- **Beware lazy loading at scale.**

## Active Recall Questions

What's the Proxy pattern?::Surrogate/placeholder for another object. Controls access; same interface; wraps real object.

Five common types?::Remote, Virtual (lazy), Protection, Caching, Smart Reference.

Proxy vs Decorator?::Proxy: controls access. Decorator: adds behavior. Same structure; different intent.

What's Spring AOP based on?::Proxies. Aspect-oriented features inject behavior via proxy.

Why are lazy proxies risky?::N+1 query problem — code uses proxy in a loop; each access triggers DB call.

Remote proxy example?::gRPC/RMI stub — local stand-in for remote service.

## Feynman Test

Design a caching proxy for an expensive database call.

Why is Spring AOP "magical" and how does Proxy explain it?

## Mastery Checklist

- **Explain** Proxy pattern.
- **Compare** Proxy and Decorator.
- **Derive** which proxy type fits.
- **Critique** lazy proxies causing N+1.
- **Design** caching proxy with TTL.

---
title: Chain of Responsibility
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Decorator]]", "[[Pipeline Architecture]]"]
sources:
  - GoF, "Design Patterns"
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Chain of Responsibility

## Executive Summary

The **Chain of Responsibility pattern** passes a request along a chain of handlers, each deciding either to process or pass to the next. Decouples sender from receiver — sender doesn't know which handler will process. Common: **HTTP middleware, logging hierarchies, GUI event propagation, exception handling**. The "do you handle this? If not, ask the next person" pattern.

## Why This Exists

Some requests can be handled by multiple potential receivers; you don't want sender to know which. Chain: sender hands request to first handler; each decides to process or forward. Adding handlers doesn't change sender.

## Core Intuition

A help desk escalation. Customer calls tier 1; if too complex, tier 1 escalates to tier 2; tier 2 escalates to tier 3 if needed. Customer doesn't pick the tier — the chain decides.

## Internal Mechanics

```java
abstract class Handler {
  protected Handler next;
  public void setNext(Handler n) { next = n; }
  public abstract void handle(Request r);
}

class AuthHandler extends Handler {
  public void handle(Request r) {
    if (!authenticated(r)) return;  // stop chain
    if (next != null) next.handle(r);  // forward
  }
}

class LoggingHandler extends Handler { ... }
class BusinessHandler extends Handler { ... }

// Setup:
authHandler.setNext(loggingHandler);
loggingHandler.setNext(businessHandler);
authHandler.handle(request);  // flows through chain
```

## Design Tradeoffs

**Benefits:**
- Decouples sender from receiver.
- Add handlers without changing sender.
- Handler order configurable.

**Costs:**
- No guarantee of being handled.
- Order matters.
- Debug requires following chain.

## Real Production Examples

- **HTTP middleware** (Express, Django middleware).
- **Logging frameworks** — log4j hierarchy.
- **Servlet filters** in Java.
- **AWS Lambda middleware.**
- **Exception handlers** in many frameworks.

## Interview Perspective

**Common questions:**
- "What's Chain of Responsibility?" → Request flows through handlers; each processes or forwards.
- "Use?" → HTTP middleware, logging, event propagation, exception handling.
- "Vs Pipeline?" → Pipeline always passes through; chain can stop early.

**Senior-level:**
- HTTP middleware is canonical chain of responsibility.
- Authorization can short-circuit the chain (fail fast).

**Common mistakes:**
- No handler catches → request lost.
- Order bugs in middleware setup.

## Related Concepts

- [[Decorator]] · [[Pipeline Architecture]]

## Misconceptions

- **"Chain = Pipeline."** Chain can stop; pipeline doesn't.

## Failure Scenarios

- **No handler** processes → silent.
- **Wrong order** → wrong behavior.

## Practical Engineering Heuristics

- **Document chain order.**
- **Ensure terminal handler.**
- **Use framework middleware.**

## Active Recall Questions

What's Chain of Responsibility?::Request flows through chain of handlers. Each handles or forwards.

Real example?::HTTP middleware (auth, logging, validation, handler).

Chain vs Pipeline?::Chain: handler can stop early. Pipeline: always passes through.

What's the failure mode?::No handler in chain accepts request → silently dropped.

Where order matters?::Auth must come before business logic. Logging early to capture errors.

Vs Decorator?::Decorator: each adds behavior, all execute. Chain: each may or may not handle.

## Feynman Test

Design HTTP middleware chain: auth, rate limit, logging, handler. Where can chain short-circuit?

Why is middleware essentially Chain of Responsibility?

## Mastery Checklist

- **Explain** Chain of Responsibility.
- **Compare** with Pipeline.
- **Derive** appropriate chain order.
- **Critique** chains without terminal.
- **Design** middleware chain.

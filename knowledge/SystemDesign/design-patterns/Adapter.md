---
title: Adapter
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Facade]]", "[[Decorator]]", "[[Anti-Corruption Layer]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.7
tags: [design-patterns, gof, structural]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Adapter

## Executive Summary

The **Adapter pattern** (also: **Wrapper**) **converts the interface of one class into another that clients expect**. Lets incompatible interfaces work together. Like a physical power-plug adapter — same electricity, different shape. Common use: integrating legacy code, third-party libraries, or external APIs with code that expects a different interface. Closely related to [[Anti-Corruption Layer]] at the architectural level.

## Why This Exists

You need class A to use class B, but B's interface doesn't match what A expects. Options: change A (intrusive), change B (often impossible — third-party), or write an Adapter wrapping B with A's expected interface.

## Core Intuition

A USB-C to USB-A adapter. Your laptop has USB-C; your device has USB-A. Adapter sits between, presenting USB-A on one side and USB-C on the other. Same underlying signal; reformatted interface.

## Internal Mechanics

```java
// Existing class with wrong interface
class LegacyLogger {
  void writeMessage(String level, String text) { ... }
}

// Target interface
interface ModernLogger {
  void log(LogLevel level, String message);
}

// Adapter
class LegacyLoggerAdapter implements ModernLogger {
  private LegacyLogger legacy;
  public void log(LogLevel level, String message) {
    legacy.writeMessage(level.toString(), message);
  }
}
```

**Variants:**
- **Object Adapter** — composition (most common).
- **Class Adapter** — inheritance (less common; multiple inheritance languages).

## Design Tradeoffs

**Benefits:**
- Integrates incompatible interfaces.
- Doesn't modify either side.
- Encapsulates compatibility logic.

**Costs:**
- Extra layer.
- Maintenance if interfaces drift.

## Real Production Examples

- **Java's** `InputStreamReader` adapts byte streams to character streams.
- **JDBC drivers** — adapt DB-specific APIs.
- **Wrapper classes** for legacy libraries.
- **REST → gRPC adapters.**

## Interview Perspective

**Common questions:**
- "What's an Adapter?" → Converts one interface to another that clients expect.
- "When use?" → Integrating incompatible code, especially legacy/third-party.
- "Adapter vs Facade?" → Adapter: change interface. Facade: simplify interface.

**Senior-level:**
- Closely related to Hexagonal Architecture's adapters.
- ACL (Anti-Corruption Layer) is essentially Adapter at architectural level.

**Common mistakes:**
- Adapter when both sides are yours (just use the right interface).
- Adapter as kitchen-sink for unrelated logic.

## Related Concepts

- [[Facade]] · [[Decorator]] · [[Anti-Corruption Layer]] · [[Hexagonal Architecture]]

## Misconceptions

- **"Adapter = Wrapper."** Same concept; same purpose.
- **"Adapter = Facade."** Different: Adapter changes interface; Facade simplifies.

## Failure Scenarios

- **Both sides drift** → adapter becomes complex.
- **Adapter accumulates logic** → becomes mini-app.

## Practical Engineering Heuristics

- **Use to bridge interfaces, not transform data extensively.**
- **Keep adapters thin.**
- **Test adapters independently.**

## Active Recall Questions

What's the Adapter pattern?::Converts the interface of one class into another that clients expect.

When use it?::Integrating incompatible code — legacy, third-party, mismatched interfaces.

Adapter vs Facade?::Adapter: changes interface (target wants A; you have B). Facade: simplifies interface (expose subset of complex system).

Object vs Class Adapter?::Object: composition (most common, language-agnostic). Class: inheritance (rare).

What's a real example in Java?::InputStreamReader adapts byte stream to character stream.

Architectural equivalent?::Anti-Corruption Layer (ACL) in DDD; adapter ring in Hexagonal Architecture.

## Feynman Test

A modern app expects `Logger` interface; you have a legacy `LegacyLog` class. Design adapter.

Why is Adapter common in microservice integration with legacy systems?

## Mastery Checklist

- **Explain** Adapter pattern.
- **Compare** Adapter, Facade, Decorator.
- **Derive** when to apply.
- **Critique** thick adapters with business logic.
- **Design** adapter integrating legacy system.

---
title: Dependency Injection
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[SOLID]]", "[[Composition over Inheritance]]", "[[Singleton]]"]
sources:
  - Martin Fowler "Inversion of Control Containers and the Dependency Injection pattern" (2004)
  - Spring framework docs
tags: [design-patterns, di, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Dependency Injection (DI)

## Executive Summary

**Dependency Injection** is the technique of **providing an object's dependencies from outside** rather than the object creating them itself. The practical embodiment of SOLID's **Dependency Inversion Principle**. Variants: **constructor injection** (preferred), **setter injection**, **field injection** (worst — magic). Implemented via **DI containers** (Spring, Guice, Dagger) or manually (just pass things in). Makes code testable (mock dependencies), flexible (swap implementations), and explicit (dependencies visible).

## Why This Exists

When objects create their dependencies (`new Database()` inside constructor), they're tightly coupled. Testing requires real DB; swapping implementations requires editing. DI inverts: dependencies passed in; object doesn't know or care which concrete type. Decoupled, testable, flexible.

## Core Intuition

A car requires an engine. Two designs: (1) Car builds its own engine. Replace engine = rebuild car. (2) Engine handed to Car when built. Swap engine = trivial. DI is design (2) applied to software.

## Internal Mechanics

**Constructor injection (preferred):**
```java
class OrderService {
  private final Repository repo;
  private final Notifier notifier;
  
  public OrderService(Repository repo, Notifier notifier) {
    this.repo = repo;
    this.notifier = notifier;
  }
}

// Manual:
OrderService service = new OrderService(new PostgresRepo(), new EmailNotifier());
```

**DI container:**
```java
@Service
class OrderService {
  @Autowired
  public OrderService(Repository repo, Notifier notifier) { ... }
}
// Container provides instances based on configuration.
```

**Setter injection:** dependency set after construction. Mutable; less safe.

**Field injection:** annotation magic. Often worst — hidden dependencies.

## Design Tradeoffs

**Benefits:**
- Testable — inject mocks.
- Flexible — swap implementations.
- Explicit — dependencies visible.
- Inversion of control.

**Costs:**
- More boilerplate without container.
- DI container can be "magic."
- Object graph complexity.

## Real Production Examples

- **Spring Framework** — DI is core feature.
- **Guice (Google)** — Java DI library.
- **Dagger** — compile-time DI for Android.
- **Most modern OO codebases** use DI extensively.

## Interview Perspective

**Common questions:**
- "What's DI?" → Dependencies provided externally, not created internally.
- "Why?" → Testability, flexibility, explicit dependencies.
- "Forms?" → Constructor (preferred), setter, field.

**Senior-level:**
- DI is the practical implementation of Dependency Inversion Principle.
- Constructor injection is universally preferred — immutable, explicit, can't be misused.
- Field injection (Spring `@Autowired` on fields) is convenient but obscures dependencies.

**Common mistakes:**
- Field injection (hidden deps).
- Service locator pattern instead (anti-pattern).
- DI containers without understanding.

## Related Concepts

- [[SOLID]] · [[Composition over Inheritance]] · [[Singleton]]

## Misconceptions

- **"DI = DI container."** Manual DI is fine; containers are convenience.
- **"DI is for tests."** Tests benefit; design benefits more.

## Failure Scenarios

- **Field injection** hides dependencies.
- **Circular dependencies** in container graph.
- **DI container magic** confuses.

## Practical Engineering Heuristics

- **Constructor injection always.**
- **Immutable dependencies.**
- **Avoid service locator.**
- **Use DI library** for non-trivial graphs.

## Active Recall Questions

What's Dependency Injection?::Providing object's dependencies externally rather than creating them internally.

Three forms?::Constructor injection (preferred), setter injection, field injection.

Why constructor injection preferred?::Immutable, explicit (compiler enforces), can't be in inconsistent state.

What's the relationship to SOLID?::DI is the practical mechanism of Dependency Inversion Principle.

Common DI container?::Spring (Java), Guice (Java), Dagger (Android), .NET built-in.

When isn't DI needed?::Trivial code with no dependencies; throwaway scripts.

## Feynman Test

A service depends on DB and email. Refactor to use DI. Why is testing easier?

Why is field injection a worse pattern than constructor injection?

## Mastery Checklist

- **Explain** DI and its forms.
- **Compare** constructor / setter / field injection.
- **Derive** when DI is appropriate.
- **Critique** field injection / service locator.
- **Design** dependency graph with DI.

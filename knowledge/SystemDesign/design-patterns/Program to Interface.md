---
title: Program to Interface
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[SOLID]]", "[[Dependency Injection]]", "[[Composition over Inheritance]]"]
sources:
  - GoF "Design Patterns"
  - Head First Design Patterns
tags: [design-patterns, principles, interfaces]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Program to an Interface, Not an Implementation

## Executive Summary

**Program to an interface, not an implementation** (GoF) — depend on abstract types, not concrete classes. The umbrella principle behind **Dependency Inversion (SOLID-D)**, **[[Strategy]]**, **[[Dependency Injection]]**. Lets you swap implementations without changing dependent code. Foundation of testable, flexible OO design. Subtly different from "use interfaces for every class" — it's about *what you depend on*, not declaring interfaces everywhere.

## Why This Exists

Code that depends on concrete classes is locked to those classes. Swap one for another: refactor every dependent. Code that depends on interfaces: swap implementations freely, mock for tests, evolve without ripple.

## Core Intuition

A wall outlet. Devices plug into the outlet (interface); they don't depend on the power station, fuse box, or generator. Replace power source: devices unaffected. Software: depend on the outlet shape (interface), not the specific power source (implementation).

## Internal Mechanics

**Don't:**
```java
class OrderService {
  private PostgresOrderRepository repo;  // concrete
  
  public OrderService() {
    this.repo = new PostgresOrderRepository();  // hard-coded
  }
}
```

**Do:**
```java
interface OrderRepository {
  void save(Order order);
  Order find(String id);
}

class OrderService {
  private OrderRepository repo;  // abstract
  
  public OrderService(OrderRepository repo) {  // injected
    this.repo = repo;
  }
}

// Real:
new OrderService(new PostgresOrderRepository());
// Tests:
new OrderService(new InMemoryOrderRepository());
```

## When Interface IS the Implementation

For data classes (`record`, `Pair`, `Point3D`), the class IS the type. No interface needed. The principle applies when *behavior* may vary — algorithms, services, repositories.

## Design Tradeoffs

**Benefits:**
- Swap implementations.
- Testable (mock).
- Decoupled modules.
- Evolution-friendly.

**Costs:**
- Extra interface declarations.
- Indirection.

## Real Production Examples

- **Repositories** in DDD-style code.
- **Service interfaces** in Spring.
- **Standard library** collections (`List`, `Map` interfaces).

## Interview Perspective

**Common questions:**
- "What's 'program to interface'?" → Depend on abstract types, not concrete classes.
- "Why?" → Swap implementations, mock for tests, decouple.
- "Always create an interface?" → No — when behavior varies. Data classes don't need.

**Senior-level:**
- The principle is "depend on stable abstractions," not "always declare interfaces."
- Premature interfaces are over-engineering — wait for second implementation or testing need.

**Common mistakes:**
- Interface for every class (over-engineering).
- Concrete class everywhere (no swap path).

## Related Concepts

- [[SOLID]] · [[Dependency Injection]] · [[Composition over Inheritance]] · [[Strategy]]

## Misconceptions

- **"Interface for every class."** Only where behavior varies.
- **"Interface = Java interface."** Concept; many language constructs (traits, protocols).

## Failure Scenarios

- **Concrete dependency** locks in implementation.
- **Premature interface** for single implementation.

## Practical Engineering Heuristics

- **Interface when 2+ implementations likely or testing requires.**
- **Concrete when only one implementation ever.**
- **YAGNI (You Aren't Gonna Need It)** for interfaces.

## Active Recall Questions

What's "program to an interface, not an implementation"?::Depend on abstract types, not concrete classes. Swap implementations freely.

When create an interface?::When 2+ implementations likely, or testing requires mocking.

When NOT?::Data classes; single-implementation services.

Relation to Dependency Inversion?::"Program to interface" is the practical phrasing of Dependency Inversion's "depend on abstractions."

What makes the principle subtle?::It's about dependencies, not interface declarations. Data classes are fine to depend on directly.

Real example?::Java's `List` interface — code depends on `List`, not `ArrayList` or `LinkedList`.

## Feynman Test

Refactor a service depending on `PostgresRepository` to depend on `Repository` interface.

When does creating an interface count as over-engineering?

## Mastery Checklist

- **Explain** the principle.
- **Compare** with concrete dependencies.
- **Derive** when to introduce interface.
- **Critique** over-application and under-application.
- **Design** service with proper abstraction.

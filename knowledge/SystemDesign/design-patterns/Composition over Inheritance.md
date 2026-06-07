---
title: Composition over Inheritance
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[SOLID]]", "[[Dependency Injection]]", "[[Strategy]]"]
sources:
  - GoF "Design Patterns" (1994) — original principle
  - Head First Design Patterns Ch.1
  - Effective Java (Bloch)
tags: [design-patterns, composition, principles]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Composition over Inheritance

## Executive Summary

**Composition over Inheritance** is the principle that **objects should be composed of other objects (HAS-A) rather than extended via inheritance (IS-A)**, except when inheritance is genuinely the right tool. From GoF (1994): *"Favor object composition over class inheritance."* Inheritance creates tight coupling between superclass and subclass; composition is more flexible — objects can be swapped, behavior changed at runtime. Rule of thumb adopted by modern OO design and beyond.

## Why This Exists

Inheritance was the original "reuse" mechanism of OO. Decades of experience showed: it's fragile. Superclass changes break subclasses (fragile base class). "Is-a" relationships are often "behaves like" — composition models that better. Composition gives most reuse benefits with fewer pitfalls.

## Core Intuition

A car HAS-A engine. You can swap engines. Now consider: a car IS-A vehicle, but that doesn't help you swap behavior. Composition supports change; inheritance fossilizes structure.

## Internal Mechanics

**Inheritance:**
```java
class Duck { ... }
class MallardDuck extends Duck { ... }
class RubberDuck extends Duck {
  @Override
  void quack() { /* squeak */ }  // overrides
  @Override
  void fly() { /* can't fly! */ throw new ... }  // LSP violation
}
```

**Composition:**
```java
class Duck {
  QuackBehavior quackBehavior;
  FlyBehavior flyBehavior;
}

Duck mallard = new Duck();
mallard.quackBehavior = new RealQuack();
mallard.flyBehavior = new FlyWithWings();

Duck rubber = new Duck();
rubber.quackBehavior = new Squeak();
rubber.flyBehavior = new NoFly();
```

Behaviors are objects; ducks compose them. Swap at runtime.

## Why Inheritance Fails

- **Fragile base class** — superclass changes break subclasses unpredictably.
- **Combinatorial explosion** — every combination of behaviors needs a new subclass.
- **Tight coupling** — subclass intimately knows superclass.
- **Static** — relationship fixed at compile time.

## When Inheritance Is Right

- **True is-a** relationship that won't change (real domain hierarchies).
- **Framework hooks** (extending `AbstractList`).
- **Interface inheritance** (different from implementation inheritance).

## Design Tradeoffs

**Composition:**
- ✓ Flexible (swap at runtime).
- ✓ Loose coupling.
- ✓ Supports multiple "is-a" via interfaces.
- ✗ More objects to wire up.

**Inheritance:**
- ✓ Less boilerplate when fits.
- ✗ Tight coupling.
- ✗ Fragile.
- ✗ Combinatorial explosion.

## Real Production Examples

- **GoF Strategy pattern** — composition.
- **React (vs class inheritance for components)** — composition.
- **Modern JS frameworks** — favor composition.

## Interview Perspective

**Common questions:**
- "Why prefer composition?" → More flexible, less fragile, supports change.
- "When inheritance OK?" → True is-a; interface-based; framework hooks.
- "Famous example?" → Head First's ducks.

**Senior-level:**
- The principle is older than OO design patterns; persists because it's right.
- Modern languages (Go, Rust) lack inheritance entirely; force composition.

**Common mistakes:**
- Inheritance for code reuse.
- "Quick subclass" that violates LSP.

## Related Concepts

- [[SOLID]] · [[Dependency Injection]] · [[Strategy]]

## Misconceptions

- **"Composition = always better."** Sometimes inheritance fits.
- **"Composition = many objects."** Same code in objects vs in subclasses.

## Failure Scenarios

- **Subclass override breaks parent.**
- **Combinatorial explosion** of subclasses.

## Practical Engineering Heuristics

- **Default to composition.**
- **Inheritance when modeling true is-a.**
- **Interface inheritance vs implementation inheritance** — first usually fine.

## Active Recall Questions

What's "Composition over Inheritance"?::Favor object composition (HAS-A) over class inheritance (IS-A). Composition more flexible, less fragile.

Who coined it?::GoF "Design Patterns" (1994).

Why prefer composition?::More flexible (swap at runtime), less fragile (no base-class issues), supports change.

When is inheritance OK?::True is-a relationship; framework hooks; interface inheritance.

What languages lack inheritance entirely?::Go, Rust (force composition).

Famous example?::Head First's ducks — composing QuackBehavior and FlyBehavior instead of subclassing.

## Feynman Test

Refactor Duck hierarchy from inheritance to composition. Show flexibility gained.

Why do Go and Rust deliberately omit inheritance?

## Mastery Checklist

- **Explain** composition vs inheritance.
- **Compare** their trade-offs.
- **Derive** which is right per case.
- **Critique** inheritance for code reuse.
- **Design** flexible system using composition.

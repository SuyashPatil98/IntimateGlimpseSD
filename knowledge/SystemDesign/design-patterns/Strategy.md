---
title: Strategy
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Template Method]]", "[[State]]", "[[Dependency Injection]]", "[[Observer]]", "[[Command]]", "[[Visitor]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.1
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Strategy

## Executive Summary

The **Strategy pattern** **encapsulates each algorithm in its own class and makes them interchangeable** at runtime. Client uses a strategy via a common interface; concrete strategies plug in. Replaces conditional logic ("if type == X, do A; else do B") with polymorphism. Used everywhere: sorting algorithms, compression algorithms, payment methods, pricing strategies. The first chapter of Head First Design Patterns; the "Hello World" of patterns.

## Why This Exists

Switch statements based on type are inflexible — adding a new type requires modifying the switch. Strategy: each algorithm in its own class; add new algorithm without modifying clients. Open/Closed Principle in practice.

## Core Intuition

A duck. Different ducks fly differently. Instead of `if (type == mallard) { ... } else if (type == rubber) { ... }`, give each duck a `flyBehavior` strategy. Set it; call it. Strategies are interchangeable.

## Internal Mechanics

```java
interface SortStrategy {
  void sort(int[] data);
}

class QuickSort implements SortStrategy { ... }
class MergeSort implements SortStrategy { ... }

class Sorter {
  private SortStrategy strategy;
  public void setStrategy(SortStrategy s) { this.strategy = s; }
  public void sort(int[] data) { strategy.sort(data); }
}

// Usage:
Sorter sorter = new Sorter();
sorter.setStrategy(new QuickSort());
sorter.sort(myData);
```

## Design Tradeoffs

**Benefits:**
- Algorithms interchangeable.
- Open/Closed Principle.
- Testable in isolation.

**Costs:**
- More classes.
- Client knows about strategies.

## Real Production Examples

- **Java's Comparator** — sort strategies.
- **Spring's PasswordEncoder** — strategy for password hashing.
- **Payment processing** — different gateways as strategies.
- **Compression library APIs.**

## Interview Perspective

**Common questions:**
- "What's Strategy?" → Encapsulates interchangeable algorithms. Selected at runtime.
- "Vs Template Method?" → Strategy: composition. Template: inheritance.
- "Modern equivalent?" → Higher-order functions, lambdas.

**Senior-level:**
- Strategy is essentially "pass a function" — modern languages with first-class functions make it lightweight.
- "Functional Strategy" with lambdas is the modern idiom.

**Common mistakes:**
- Strategy for one algorithm.
- Strategy when an enum works.

## Related Concepts

- [[Template Method]] · [[State]] · [[Dependency Injection]]

## Misconceptions

- **"Strategy = Inheritance."** Composition. Different from Template Method.
- **"Need classes."** Modern: lambda/function.

## Failure Scenarios

- **One-strategy class** → unnecessary.

## Practical Engineering Heuristics

- **Use for varying algorithms.**
- **Modern: lambdas where possible.**
- **One strategy = don't bother.**

## Active Recall Questions

What's the Strategy pattern?::Encapsulates interchangeable algorithms; client picks at runtime via common interface.

Strategy vs Template Method?::Strategy: composition (has-a). Template Method: inheritance (is-a, override hooks).

Modern equivalent?::Higher-order functions / lambdas. "Pass a function" is functional strategy.

Java example?::Comparator passed to sort() is strategy.

When unnecessary?::One strategy (just inline). Two strategies (often if/else is fine).

What's the Open/Closed benefit?::Add new strategies without modifying existing client code.

## Feynman Test

A payment system needs to support multiple payment methods. Apply Strategy.

Why are lambdas the modern strategy implementation?

## Mastery Checklist

- **Explain** Strategy pattern.
- **Compare** with Template Method.
- **Derive** when justified.
- **Critique** over-applied strategies.
- **Design** with lambdas.

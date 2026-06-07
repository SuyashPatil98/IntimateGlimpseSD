---
title: Template Method
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Strategy]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.8
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Template Method

## Executive Summary

The **Template Method pattern** defines the **skeleton of an algorithm in a base class**, deferring some steps to subclasses. Subclasses customize specific steps without changing the algorithm's structure. The inheritance counterpart to [[Strategy]] (composition). Common in **frameworks**: base class implements the "what"; subclass implements the "how." Risks: tight inheritance coupling; fragile base class problem.

## Why This Exists

Algorithm structure is fixed; specific steps vary by use case. Hardcoded variants duplicate the structure. Template Method: structure in base; variants override hooks. New variants = subclass.

## Core Intuition

A recipe for "make a hot beverage": boil water, add ingredient, pour into cup, add condiments. Specific ingredient (tea bag vs coffee grounds) and condiments vary. Recipe stays the same.

## Internal Mechanics

```java
abstract class CaffeineBeverage {
  // Template method — final, defines algorithm
  public final void prepare() {
    boilWater();
    brew();         // subclass overrides
    pourInCup();
    addCondiments(); // subclass overrides
  }
  
  void boilWater() { System.out.println("Boiling"); }
  void pourInCup() { System.out.println("Pouring"); }
  
  abstract void brew();
  abstract void addCondiments();
}

class Tea extends CaffeineBeverage {
  void brew() { System.out.println("Steeping tea"); }
  void addCondiments() { System.out.println("Adding lemon"); }
}

class Coffee extends CaffeineBeverage {
  void brew() { System.out.println("Dripping coffee"); }
  void addCondiments() { System.out.println("Adding milk"); }
}
```

**Hooks:** non-abstract methods subclasses MAY override (default to no-op).

## Design Tradeoffs

**Benefits:**
- Reuse algorithm structure.
- Open/Closed for steps.

**Costs:**
- Inheritance coupling.
- Fragile base class — changes ripple.
- Hard to compose multiple variations.

## Real Production Examples

- **Spring's JdbcTemplate** — algorithm fixed; query/result handler vary.
- **Servlet's `service()`** — calls `doGet()`, `doPost()` hooks.
- **Java's `AbstractList`** — provides skeleton; subclass implements core.

## Interview Perspective

**Common questions:**
- "Template Method vs Strategy?" → Template Method: inheritance, base defines algorithm. Strategy: composition, plug in.
- "When use it?" → Algorithm structure fixed; specific steps vary.
- "Risk?" → Fragile base class; tight coupling.

**Senior-level:**
- "Composition over inheritance" usually suggests Strategy over Template Method.
- Template Method survives in frameworks where the framework owns the algorithm.

**Common mistakes:**
- Template Method when Strategy is cleaner.
- Too many hooks (interface explosion).

## Related Concepts

- [[Strategy]]

## Misconceptions

- **"Template Method = Strategy."** Different mechanism (inheritance vs composition).

## Failure Scenarios

- **Base class change breaks subclasses.**
- **Multiple variations** want combinations → inheritance can't handle.

## Practical Engineering Heuristics

- **Use sparingly.**
- **Prefer Strategy** for most cases.
- **Mark template method final.**
- **Keep hooks minimal.**

## Active Recall Questions

What's Template Method?::Defines algorithm skeleton in base class; subclasses override specific steps via inheritance.

Template Method vs Strategy?::Template Method: inheritance (override hooks). Strategy: composition (plug strategy).

What's the algorithm structure?::Fixed in base class; hooks are overridable.

What's a hook?::Non-abstract method subclasses MAY override (default to no-op or sensible default).

Risk?::Fragile base class — changes in base affect all subclasses.

Real example?::Spring JdbcTemplate; Java Servlet `service()`.

## Feynman Test

Design Template Method for "process payment" with steps that vary by payment method.

Why is Strategy often preferred over Template Method in modern code?

## Mastery Checklist

- **Explain** Template Method.
- **Compare** with Strategy.
- **Derive** which fits.
- **Critique** fragile inheritance.
- **Design** Template Method for framework code.

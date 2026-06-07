---
title: Decorator
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Adapter]]", "[[Facade]]", "[[Proxy]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.3
tags: [design-patterns, gof, structural]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Decorator

## Executive Summary

The **Decorator pattern** **adds behavior to an object dynamically by wrapping it** in another object with the same interface. Like adding toppings to a pizza — same pizza interface; new functionality stacked. Alternative to subclassing for behavior extension, especially when combinations are needed (`BoldItalicUnderline` text doesn't need 8 subclasses; stack three decorators). Java's I/O streams (`BufferedInputStream(FileInputStream(file))`) is the canonical example.

## Why This Exists

Subclassing for every combination of features explodes (`BoldText`, `ItalicText`, `BoldItalicText`, ...). Decorator: each feature is a wrapper; compose at runtime. Combinations explode in number but not in code.

## Core Intuition

Wrapping a present in paper, then a bow, then a tag. Each layer adds something without changing the underlying gift. You can stack layers in any order, any combination.

## Internal Mechanics

```java
interface Coffee {
  double cost();
  String description();
}

class SimpleCoffee implements Coffee {
  public double cost() { return 2.0; }
  public String description() { return "Coffee"; }
}

abstract class CoffeeDecorator implements Coffee {
  protected Coffee inner;
  CoffeeDecorator(Coffee c) { inner = c; }
}

class Milk extends CoffeeDecorator {
  Milk(Coffee c) { super(c); }
  public double cost() { return inner.cost() + 0.5; }
  public String description() { return inner.description() + ", milk"; }
}

class Sugar extends CoffeeDecorator { ... }

// Usage:
Coffee c = new Sugar(new Milk(new SimpleCoffee()));
// Cost: 2.0 + 0.5 + 0.2 = 2.7
// Description: "Coffee, milk, sugar"
```

## Design Tradeoffs

**Benefits:**
- Combinable behaviors.
- Open/Closed principle.
- Avoids subclass explosion.

**Costs:**
- Many small classes.
- Order can matter (sometimes good, sometimes confusing).
- Stack debugging tricky.

## Real Production Examples

- **Java I/O streams** — canonical example.
- **HTTP middleware** — request wrapping (auth, logging, compression).
- **GUI components** with borders, scrollbars.

## Interview Perspective

**Common questions:**
- "What's Decorator?" → Adds behavior by wrapping with same interface. Stackable.
- "Why over subclassing?" → Avoids combinatorial explosion of subclasses.
- "Example?" → Java's `BufferedInputStream(FileInputStream(file))`.

**Senior-level:**
- HTTP middleware is decorator pattern at scale (Express middleware, Django middleware).
- Order of stacking can matter — design with awareness.

**Common mistakes:**
- Decorator for one-off behavior (just subclass).
- Confused with Adapter (different interface) or Proxy (controls access).

## Related Concepts

- [[Adapter]] · [[Facade]] · [[Proxy]]

## Misconceptions

- **"Decorator = Subclass."** Composition, not inheritance.
- **"Decorator = Adapter."** Decorator adds behavior; Adapter changes interface.

## Failure Scenarios

- **Order-dependent decorators** — confusing.
- **Deep stack** — performance overhead.

## Practical Engineering Heuristics

- **Use for combinable features.**
- **Same interface as wrapped object.**
- **Document order requirements.**

## Active Recall Questions

What's the Decorator pattern?::Wraps an object to add behavior; wrapper has same interface as wrapped. Stackable for combining features.

Why over subclassing?::Avoids combinatorial explosion of subclasses. Compose features at runtime.

Canonical example?::Java I/O: `new BufferedInputStream(new FileInputStream(file))`.

Decorator vs Adapter?::Decorator: same interface, adds behavior. Adapter: different interface, translates.

Decorator vs Proxy?::Decorator: adds behavior to interface. Proxy: controls access (similar but purpose differs).

What's HTTP middleware?::Decorator at scale — request/response wrapped by auth, logging, compression layers.

## Feynman Test

Design Decorator for coffee with milk, sugar, extra-shot toppings. Show stacking.

Why is HTTP middleware essentially Decorator pattern?

## Mastery Checklist

- **Explain** Decorator pattern.
- **Compare** with subclassing.
- **Derive** when Decorator fits.
- **Critique** order-confusing decorators.
- **Design** decorator stack for HTTP middleware.

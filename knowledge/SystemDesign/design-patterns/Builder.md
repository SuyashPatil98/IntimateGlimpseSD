---
title: Builder
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Factory]]"]
sources:
  - GoF, "Design Patterns"
  - Effective Java (Bloch)
tags: [design-patterns, gof, creational]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Builder

## Executive Summary

The **Builder pattern** **constructs complex objects step-by-step**, separating construction logic from the object's representation. Used when an object has many parameters (especially optional ones) or when construction order matters. Joshua Bloch (Effective Java) popularized the **fluent Builder** style. Solves the "telescoping constructor" anti-pattern: instead of `new Pizza(true, true, false, false, true, 12, ...)`, use `Pizza.builder().cheese().pepperoni().size(12).build()`.

## Why This Exists

Constructors with many parameters are unreadable and error-prone (which boolean is which?). Optional parameters compound the problem (telescoping constructors with many overloads). Builder solves: incremental construction with named methods; readable; flexible.

## Core Intuition

Ordering a custom pizza. You don't say "give me pizza(true, false, large, false, ...)." You say: "I want cheese, pepperoni, large, no olives." Each choice is named. The Builder is the conversational interface.

## Internal Mechanics

```java
class Pizza {
  // constructor private
  
  public static Builder builder() { return new Builder(); }
  
  public static class Builder {
    private Pizza pizza = new Pizza();
    public Builder cheese() { pizza.cheese = true; return this; }
    public Builder pepperoni() { pizza.pepperoni = true; return this; }
    public Builder size(int s) { pizza.size = s; return this; }
    public Pizza build() { return pizza; }
  }
}

// Usage:
Pizza p = Pizza.builder().cheese().pepperoni().size(12).build();
```

**Properties:**
- Fluent API (chained calls).
- Optional steps.
- `build()` finalizes.
- Often immutable result.

## Design Tradeoffs

**Benefits:**
- Readable construction.
- Optional parameters clean.
- Immutable result.
- Validation in `build()`.

**Costs:**
- More code than constructor.
- Two classes (target + Builder).

## Real Production Examples

- **Java StringBuilder** (somewhat builder-like).
- **Lombok @Builder** annotation.
- **Most Java HTTP client builders.**
- **AWS SDK builders.**
- **SQL query builders.**

## Interview Perspective

**Common questions:**
- "What's Builder?" → Incremental construction of complex objects via fluent API.
- "Why?" → Many parameters, optional, telescoping constructor problem.
- "Bloch's recommendation?" → Builder for constructors with > ~4 parameters or many optional.

**Senior-level:**
- Builder + immutability is a clean combo.
- Modern languages with named/default arguments (Python, Kotlin) reduce need.

**Common mistakes:**
- Builder for simple objects.
- No validation in `build()`.
- Mutable Builder reused for multiple objects.

## Related Concepts

- [[Factory]]

## Misconceptions

- **"Builder = Factory."** Different: Builder constructs one complex object; Factory picks among types.

## Failure Scenarios

- **No validation** → invalid objects built.
- **Mutable Builder reused** → unexpected sharing.

## Practical Engineering Heuristics

- **Use for > 4 parameters or many optional.**
- **Validate in `build()`.**
- **Make result immutable.**
- **Use Lombok @Builder** to reduce boilerplate.

## Active Recall Questions

What's the Builder pattern?::Step-by-step construction of complex objects via fluent API. Solves telescoping-constructor problem.

When use it?::Many parameters; many optional; complex construction; want immutable result.

Who popularized fluent Builder?::Joshua Bloch in "Effective Java."

What's the rule of thumb?::Constructor with > 4 parameters → consider Builder.

Builder vs Factory?::Builder constructs one complex object step-by-step. Factory selects which concrete type to create.

What's the modern alternative?::Named/default arguments in languages that support them (Python, Kotlin).

## Feynman Test

Design Builder for a Pizza class with many toppings and size options.

Why is "telescoping constructor" worse than Builder?

## Mastery Checklist

- **Explain** Builder pattern.
- **Compare** with constructor and Factory.
- **Derive** when Builder is justified.
- **Critique** Builder for trivial objects.
- **Design** Builder with validation.

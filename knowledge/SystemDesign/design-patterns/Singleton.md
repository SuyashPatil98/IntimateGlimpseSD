---
title: Singleton
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Factory]]", "[[Dependency Injection]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.5
tags: [design-patterns, gof, creational, controversial]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Singleton

## Executive Summary

The **Singleton pattern** ensures a class has **exactly one instance** and provides global access to it. Famous GoF pattern; **famously overused and now considered an anti-pattern in most cases**. Real use cases: logger, cache, config — where global access genuinely makes sense. Modern replacement: **dependency injection** (still one instance; just not globally accessed). Testability is the killer issue — singletons are hard to mock.

## Why This Exists

Sometimes you genuinely want one instance (one logger, one config). The Singleton pattern provides controlled global access. But it's been wildly over-applied — many "singletons" should just be normal objects passed via DI.

## Core Intuition

A king. There's one; you reference "the king." But should everything depend on "the king" globally? Probably not — most code can be parameterized by who's king.

## Internal Mechanics

```java
class Singleton {
  private static Singleton instance;
  private Singleton() {}  // private constructor
  
  public static Singleton getInstance() {
    if (instance == null) {
      instance = new Singleton();
    }
    return instance;
  }
}
```

**Thread-safety:** vanilla version isn't thread-safe. Variants:
- Eager initialization (instance created at class load).
- Synchronized method (slow).
- Double-checked locking (subtle).
- Initialization-on-demand holder (Java idiom).

## Why Singletons Are Controversial

- **Global state** — hidden dependencies.
- **Hard to test** — can't easily mock.
- **Thread-safety subtle.**
- **Cross-cutting** — every consumer depends.
- **Often disguised as good engineering** when it's hidden coupling.

## Modern Alternatives

- **Dependency injection** — DI container provides single instance; consumers receive it.
- **Pure functions** — no state needed.
- **Module-level value** — simpler, language-aware.

## Real Production Examples

- **`Runtime.getRuntime()`** in Java.
- **Logger** — often singleton.
- **DB connection pool** — sometimes singleton.

## Design Tradeoffs

**Benefits:**
- Single instance guaranteed.
- Global access.

**Costs:**
- Hidden coupling.
- Test brittleness.
- Thread-safety burden.
- Encourages bad design.

## Interview Perspective

**Common questions:**
- "What's Singleton?" → One instance, global access.
- "Why considered anti-pattern?" → Hidden state, hard to test, hidden coupling.
- "Modern alternative?" → DI container provides single instance without global access.

**Senior-level:**
- Most "we need a singleton" is "we need DI to provide one instance."
- Genuine singletons exist; rare.

**Common mistakes:**
- Singleton for everything stateful.
- Threading bugs.
- Singleton makes testing painful.

## Related Concepts

- [[Factory]] · [[Dependency Injection]]

## Misconceptions

- **"Singleton = best practice."** Mostly anti-pattern.
- **"Singleton = thread-safe."** Vanilla isn't.

## Failure Scenarios

- **Race condition** in lazy init.
- **Hard to mock** in tests.
- **Hidden coupling** complicates refactoring.

## Practical Engineering Heuristics

- **Use DI instead** when possible.
- **If you must: thread-safe construction.**
- **Avoid for stateful objects** that vary per test.

## Active Recall Questions

What's the Singleton pattern?::Ensures one instance of a class; provides global access.

Why anti-pattern?::Hidden state, hard to test (can't mock), thread-safety subtle, hidden coupling.

Modern alternative?::DI container provides single instance; consumers receive via injection, not global access.

When is singleton legit?::Truly single-instance things like the JVM runtime, system clock, etc.

Thread-safe singleton in Java?::Initialization-on-demand holder pattern, or `enum` (Bloch's recommendation).

## Feynman Test

A logger needs one instance. Implement with Singleton; then with DI. Why is DI better for tests?

Why is "we'll use Singleton because we want one" usually wrong reasoning?

## Mastery Checklist

- **Explain** Singleton.
- **Compare** with DI-based approach.
- **Derive** when (rarely) Singleton is right.
- **Critique** singleton overuse.
- **Design** DI alternative for "one instance" needs.

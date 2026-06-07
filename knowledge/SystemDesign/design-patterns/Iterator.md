---
title: Iterator
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Composite]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.9
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Iterator

## Executive Summary

The **Iterator pattern** provides a **way to traverse a collection without exposing its underlying representation**. Same iteration interface (next, hasNext) regardless of whether the collection is a list, tree, hash table, or stream. Most languages have iteration **built in** (`for...of`, `for in`, `for each`), making explicit Iterator implementation rare today — but the concept is foundational.

## Why This Exists

Collections come in many shapes (array, linked list, tree, hash). Without Iterator, clients must know each shape. With Iterator, clients use the same interface for all.

## Core Intuition

A TV remote's "next channel" button. The button works the same regardless of how the TV stores channels internally (linear, grouped, custom order).

## Internal Mechanics

```java
interface Iterator<T> {
  boolean hasNext();
  T next();
}

interface Iterable<T> {
  Iterator<T> iterator();
}

// Usage:
Iterator<Item> it = collection.iterator();
while (it.hasNext()) {
  Item item = it.next();
  process(item);
}

// Or syntactic sugar:
for (Item item : collection) { process(item); }
```

## Design Tradeoffs

**Benefits:**
- Uniform iteration.
- Multiple iterators per collection possible.
- External iteration (client controls).

**Costs:**
- More objects.
- Concurrent modification issues.

## Real Production Examples

- **Java Collections** — `Iterator<T>`.
- **Python iterators** — `__iter__`, `__next__`.
- **JavaScript** — `[Symbol.iterator]`.
- **C# IEnumerable.**

Modern languages have language-level iteration; explicit Iterator implementation rare.

## Interview Perspective

**Common questions:**
- "What's Iterator?" → Traverse collection without exposing internal structure.
- "Modern relevance?" → Built into most languages; foundational concept.
- "External vs internal iteration?" → External: client calls next. Internal: collection calls callback (`forEach`).

**Senior-level:**
- Streams / lazy iterators avoid materializing whole collections in memory.
- Concurrent modification while iterating is the classic bug.

**Common mistakes:**
- Modifying collection during iteration.
- Implementing iterator manually when language has built-in.

## Related Concepts

- [[Composite]]

## Misconceptions

- **"Iterator = for loop."** For loop uses iterator under the hood.

## Failure Scenarios

- **Concurrent modification** → ConcurrentModificationException.
- **Two iterators** sharing state.

## Practical Engineering Heuristics

- **Use language built-ins.**
- **Don't modify collection during iteration.**
- **Lazy/stream iterators for large data.**

## Active Recall Questions

What's the Iterator pattern?::Provides way to traverse collection without exposing internal representation. Uniform interface.

What methods?::`hasNext()` and `next()`. Modern: `__iter__`/`__next__` (Python), `[Symbol.iterator]` (JS).

External vs internal iteration?::External: client calls next. Internal: collection iterates and calls callback (forEach).

What's a stream / lazy iterator?::Doesn't materialize whole collection; produces elements on demand. Crucial for huge / infinite collections.

Why "concurrent modification" bug?::Modifying collection while iterating invalidates iterator state. Most libs throw.

When implement manually?::Custom traversal of complex structures (trees) beyond language defaults.

## Feynman Test

Implement Iterator for a binary tree (depth-first).

Why are streams a more useful version of Iterator for large data?

## Mastery Checklist

- **Explain** Iterator.
- **Compare** internal and external iteration.
- **Derive** when to implement custom iterator.
- **Critique** modifying-during-iteration.
- **Design** lazy iterator for large dataset.

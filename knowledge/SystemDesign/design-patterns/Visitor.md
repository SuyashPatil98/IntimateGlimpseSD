---
title: Visitor
area: design-patterns
status: mature
difficulty: advanced
prerequisites: []
related: ["[[Composite]]", "[[Iterator]]"]
sources:
  - GoF, "Design Patterns"
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Visitor

## Executive Summary

The **Visitor pattern** **separates an algorithm from the objects it operates on**, letting you add new operations to a class hierarchy without modifying the classes. Useful for tree structures (especially **AST traversal in compilers**) where operations are added more often than nodes. Implements **double dispatch** in single-dispatch languages. Powerful but complex; often replaced by pattern matching in modern languages.

## Why This Exists

Adding a new operation to a class hierarchy normally requires modifying every class. Visitor inverts: classes accept a Visitor; the Visitor defines the operation; adding an operation = new Visitor (without modifying classes).

## Core Intuition

A museum guide (Visitor) walks through exhibits. Each exhibit doesn't know the guide's tour content; the guide knows what to say at each exhibit. Adding a new guide = new tour, same exhibits unchanged.

## Internal Mechanics

```java
interface Visitor {
  void visit(Painting p);
  void visit(Sculpture s);
  void visit(Photo p);
}

interface Artwork {
  void accept(Visitor v);
}

class Painting implements Artwork {
  public void accept(Visitor v) { v.visit(this); }
}

// New operation = new Visitor
class AppraisalVisitor implements Visitor {
  public void visit(Painting p) { ... }
  public void visit(Sculpture s) { ... }
  public void visit(Photo p) { ... }
}
```

**Double dispatch:** `artwork.accept(visitor)` then `visitor.visit(this)` — dispatch on both runtime types.

## Design Tradeoffs

**Benefits:**
- Add operations without modifying classes.
- Operations grouped (each Visitor is one operation).
- Type-safe double dispatch.

**Costs:**
- Adding new class type requires updating all Visitors.
- Complex.
- Often awkward.

## Real Production Examples

- **Compilers** — AST visitors for type-check, codegen, optimization.
- **XML/JSON serialization libraries.**
- **Java's `JavadocVisitor`.**

## Interview Perspective

**Common questions:**
- "What's Visitor?" → Separates algorithm from objects. Add operations without modifying classes.
- "Use case?" → AST traversal in compilers; tree-walking operations.
- "Trade-off?" → Easy to add operations; hard to add new node types.

**Senior-level:**
- Visitor exists because OOP languages don't support pattern matching well.
- Modern languages with pattern matching (Scala, Rust, modern Java) reduce need.

**Common mistakes:**
- Visitor for non-hierarchical structures.
- Adding node types frequently — Visitor becomes pain.

## Related Concepts

- [[Composite]] · [[Iterator]]

## Misconceptions

- **"Visitor = Iterator."** Visitor: typed double dispatch. Iterator: uniform traversal.

## Failure Scenarios

- **New node type** → must update every Visitor.
- **Performance** — virtual call overhead.

## Practical Engineering Heuristics

- **Use when ops change more than types.**
- **Pattern matching alternative in modern languages.**
- **Stable hierarchy + many ops = Visitor.**

## Active Recall Questions

What's the Visitor pattern?::Separates algorithm from objects. Add operations without modifying classes. Common for AST traversal.

When is it good?::Hierarchy is stable; operations change frequently.

When is it bad?::Hierarchy changes — adding type requires updating every Visitor.

What's double dispatch?::Method called depends on both runtime types of receiver and argument. Visitor implements via accept-then-visit.

Modern alternative?::Pattern matching (Scala, Rust, modern Java/C#).

Canonical use?::AST traversal in compilers — type-check, codegen, optimization as Visitors.

## Feynman Test

Design Visitor for an AST with operations: print, type-check, optimize.

Why is pattern matching a cleaner alternative in modern languages?

## Mastery Checklist

- **Explain** Visitor and double dispatch.
- **Compare** with pattern matching.
- **Derive** when Visitor fits.
- **Critique** Visitor for changing hierarchies.
- **Design** AST visitor for compiler.

---
title: Key Refactorings
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Refactoring]]", "[[Code Smells]]"]
related: ["[[Refactoring]]", "[[Code Smells]]"]
sources:
  - Martin Fowler, "Refactoring" (2nd ed.)
tags: [software-engineering, refactoring, patterns]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Key Refactorings

## Executive Summary

Fowler's "Refactoring" catalogs ~70 named refactorings. A small subset — **Extract Function, Inline Function, Extract Variable, Inline Variable, Change Function Declaration, Encapsulate Field, Rename Variable, Replace Magic Literal, Move Function, Move Field, Extract Class, Inline Class, Replace Conditional with Polymorphism, Introduce Parameter Object** — covers most day-to-day refactoring needs. Modern IDEs automate them. Knowing the catalog and applying mechanically (no improvisation per refactor) is the discipline.

## Why This Exists

Refactoring at the keyboard requires named, step-by-step procedures so each step is small and verifiable. The catalog provides them: each refactoring has a name, motivation, mechanics, example. Applying recipes is safer than improvising.

## Core Intuition

A chef has named recipes for sauces, cuts, techniques. They don't reinvent them each time. The recipes are reliable; the chef applies them. Refactoring patterns are software's recipes.

## The Most-Used Refactorings

### Extract Function
- Long method → extract part into its own function.
- Most-used; antidote to Long Method.

### Inline Function
- Function adds no value → remove indirection.
- Reverse of Extract.

### Extract Variable
- Complex expression → assign to named variable.
- Improves readability.

### Inline Variable
- Variable used once and adds no clarity → inline.

### Change Function Declaration
- Rename function or change parameters.
- Most common day-to-day change.

### Rename Variable
- Variable name doesn't reflect intent.
- IDE-automated.

### Replace Magic Literal
- Hardcoded value with unclear meaning → named constant.

### Move Function
- Function belongs in another module/class.
- Cure for Feature Envy.

### Move Field
- Field belongs in another class.

### Extract Class
- Class doing too much → split.
- Cure for Large Class.

### Inline Class
- Two classes that should be one.

### Replace Conditional with Polymorphism
- Big switch/if-else on type → polymorphism.
- Cure for Switch Statements smell.

### Introduce Parameter Object
- Many params used together → group into object.
- Cure for Long Parameter List.

### Encapsulate Field
- Public field → getter/setter.

### Replace Primitive with Object
- Domain concept as primitive (e.g., string for ZIP) → Type.

## Mechanics

Each refactoring in Fowler's book has:
- **Motivation** — when to apply.
- **Mechanics** — step-by-step procedure.
- **Example** — before/after code.

Apply mechanically. Tests after each step.

## Real Production Examples

- **IntelliJ, VS Code** — automate many refactorings.
- **Resharper** — extensive C# refactoring.
- **Daily work** of any engineer in healthy codebase.

## Design Tradeoffs

**Benefits:**
- Mechanical = safe.
- Named = teachable.
- IDE-automated = fast.

**Costs:**
- Memorizing names.
- Knowing when (not every smell needs fix).

## Interview Perspective

**Common questions:**
- "Most-used refactoring?" → Extract Function.
- "When apply?" → When a smell exists and the refactoring addresses it.
- "Why mechanics?" → Reliable, safe, repeatable.

**Senior-level:**
- IDE-automated refactorings are leverage — learn them.
- "Extract function" is the universal solvent for code complexity.
- Apply incrementally; commit after each.

**Common mistakes:**
- Big-bang refactor instead of small steps.
- Not running tests between steps.
- Over-engineering with too-many extractions.

## Related Concepts

- [[Refactoring]] · [[Code Smells]]

## Misconceptions

- **"Memorize all 70."** No — know the core 15.
- **"Apply blindly."** Context matters.

## Failure Scenarios

- **No tests** → behavior breaks.
- **Over-extraction** → fragmented code.
- **Improvised refactoring** → bugs.

## Practical Engineering Heuristics

- **Use IDE automation.**
- **Tests after each step.**
- **One refactoring per commit.**
- **Know Extract Function deeply** — most-used.

## Active Recall Questions

Most-used refactoring?::Extract Function. Antidote to Long Method.

How many refactorings does Fowler catalog?::~70. About 15 cover daily needs.

What's Replace Conditional with Polymorphism?::Replace big switch/if-else on type code with polymorphic dispatch.

What's Introduce Parameter Object?::Many parameters used together → group into one object. Cure for Long Parameter List.

What's the universal rule for each refactoring step?::Tests pass before; apply one step; tests still pass.

Who wrote the canonical book?::Martin Fowler, "Refactoring" (1999, 2nd ed. 2018).

## Feynman Test

A 100-line function does three things. Walk through Extract Function step by step.

Why is "one refactoring per commit" the discipline?

## Mastery Checklist

- **Explain** key refactorings.
- **Compare** their use cases.
- **Derive** which refactoring fits given smell.
- **Critique** improvised refactoring.
- **Design** refactoring plan for legacy module.

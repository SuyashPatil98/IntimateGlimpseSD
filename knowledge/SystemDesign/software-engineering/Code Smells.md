---
title: Code Smells
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Refactoring]]"]
related: ["[[Refactoring]]", "[[Key Refactorings]]", "[[Technical Debt]]"]
sources:
  - Martin Fowler, "Refactoring" Ch.3
tags: [software-engineering, refactoring, code-quality]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Code Smells

## Executive Summary

**Code smells** (Fowler & Beck, "Refactoring" Ch.3) are **surface signs in code that often indicate deeper design problems**. Not bugs — code works — but warns of fragility, rigidity, complexity. **Long Method, Large Class, Duplicate Code, Long Parameter List, Feature Envy, Data Clumps, Primitive Obsession** are canonical. Recognizing smells is the first skill; applying [[Key Refactorings|appropriate refactorings]] is the second. Don't fix every smell — context matters — but recognize them.

## Why This Exists

Bad code is recognizable: humans can sniff it ("this smells off") even if they can't name why. Codifying these instincts makes them teachable. Name the smell → apply the standard refactoring → improve the code.

## Core Intuition

Medical symptoms. Fever isn't a disease; it's a sign of one. Code smells aren't bugs; they're signs of design weaknesses. Diagnosing the underlying issue (and applying treatment) is the work.

## Canonical Smells

**Long Method:**
- Method does too much.
- *Refactor:* Extract Function.

**Large Class:**
- Class has too many responsibilities.
- *Refactor:* Extract Class.

**Duplicate Code:**
- Same logic in multiple places.
- *Refactor:* Extract Function, Pull Up Method.

**Long Parameter List:**
- Many parameters; hard to remember.
- *Refactor:* Introduce Parameter Object.

**Feature Envy:**
- Method uses another class's data more than its own.
- *Refactor:* Move Method.

**Data Clumps:**
- Same group of fields appearing together.
- *Refactor:* Extract Class.

**Primitive Obsession:**
- Using strings/integers for domain concepts (e.g., string for currency).
- *Refactor:* Replace Primitive with Object.

**Switch Statements:**
- Big switch/if-else chains on type codes.
- *Refactor:* Replace Conditional with Polymorphism.

**Shotgun Surgery:**
- One change requires modifications in many places.
- *Refactor:* Move Method, Inline Class.

**Divergent Change:**
- One class changes for many different reasons.
- *Refactor:* Extract Class (SRP).

**Speculative Generality:**
- Code anticipating future needs that never come.
- *Refactor:* Remove Dead Code.

**Comments:**
- Comments explaining unclear code.
- *Refactor:* Extract Function with meaningful name.

## Real Production Examples

- **Sonarqube, ESLint, Rubocop** — static analysis tools that detect smells.
- **Most code reviews** identify smells.

## Design Tradeoffs

**Recognizing smells is leverage:**
- Quick to spot.
- Pre-existing remedies.
- Common vocabulary.

**Costs:**
- Not every smell needs fixing.
- Context matters.
- Over-engineering risk.

## Interview Perspective

**Common questions:**
- "Name some code smells." → Long Method, Large Class, Duplicate Code, Long Parameter List, Feature Envy, Primitive Obsession, Shotgun Surgery.
- "Treatment?" → Standard refactoring per smell.
- "Always fix?" → Context-dependent. Some smells are acceptable.

**Senior-level:**
- The vocabulary of smells unifies code review and refactoring discussions.
- Speculative Generality is the most underrated — "we'll need this later" is usually wrong.
- "Comments" as a smell is contentious — many comments are useful; the smell is *explanatory* comments hiding bad code.

**Common mistakes:**
- Treating every smell as urgent.
- Over-refactoring (gold-plating).
- Missing context-specific reasons.

## Related Concepts

- [[Refactoring]] · [[Key Refactorings]] · [[Technical Debt]]

## Misconceptions

- **"Code smell = bug."** Smells indicate design issues, not bugs.
- **"Fix every smell."** Context matters; some are acceptable.
- **"Comments are smells."** Specifically: explanatory comments for unclear code. Public API docs and "why" comments are fine.

## Failure Scenarios

- **Over-refactoring** introduces complexity.
- **Smells ignored** accumulate as technical debt.

## Practical Engineering Heuristics

- **Learn the vocabulary.**
- **Fix smells while in the area** (Boy Scout Rule).
- **Don't refactor unrelated code in feature PR.**
- **Static analysis catches common smells.**

## Active Recall Questions

What's a code smell?::Surface sign in code indicating possible deeper design problem. Not a bug.

Name five code smells.::Long Method, Large Class, Duplicate Code, Long Parameter List, Feature Envy, Data Clumps, Primitive Obsession, Shotgun Surgery.

What's Feature Envy?::Method uses another class's data more than its own. Refactor: Move Method.

What's Primitive Obsession?::Using strings/integers for domain concepts. Refactor: Replace Primitive with Object.

What's Shotgun Surgery?::One conceptual change requires modifications in many places.

What's Speculative Generality?::Code anticipating future needs that never come. Remove.

## Feynman Test

You review code with a 200-line method. Diagnose the smell and propose treatment.

Why is "we'll need this later" usually wrong?

## Mastery Checklist

- **Explain** code smells and their role.
- **Compare** smells to bugs.
- **Derive** appropriate refactoring per smell.
- **Critique** ignored or over-fixed smells.
- **Design** code review checklist using smells.

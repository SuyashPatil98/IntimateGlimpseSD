---
title: Refactoring
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Code Smells]]", "[[Key Refactorings]]", "[[Technical Debt]]", "[[Unit Testing]]"]
builds_toward: ["[[Code Smells]]", "[[Key Refactorings]]"]
sources:
  - Martin Fowler, "Refactoring" (2nd ed.)
  - Modern Software Engineering (Farley)
tags: [software-engineering, refactoring, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Refactoring

## Executive Summary

**Refactoring** is **changing the internal structure of code without changing its external behavior** — making it easier to understand, modify, extend. Martin Fowler's "Refactoring" (1999, 2nd ed. 2018) codified the discipline: small steps, each verifiable, with tests catching mistakes. Refactoring isn't a project — it's a continuous practice. The discipline most distinguishes engineers who maintain healthy codebases from those who don't.

## Why This Exists

Code rots without refactoring. New features bolt on; structure decays; what was clear becomes opaque. Refactoring continuously reshapes code to fit current understanding. Done well, the codebase stays healthy indefinitely. Done poorly (big rewrites), engineers lose months and often the result is no better.

## Core Intuition

A garden continuously tended: weeded, pruned, replanted. Compare to: ignore for a year, then "the big cleanup" — overwhelming and incomplete. Refactoring is the gardening; not the demolition.

## Two Hats Rule

Fowler's "two hats" — wear one at a time:
1. **Add feature hat** — write code; don't refactor.
2. **Refactor hat** — improve code; don't add features.

Mixing them is when bugs slip in. Discipline of switching is key.

## Internal Mechanics

**Steps:**
1. Tests pass (precondition).
2. Apply one small refactoring.
3. Tests still pass.
4. Commit.
5. Repeat.

If tests fail, immediately undo. Small steps mean small undos.

**Common patterns:** Extract Function, Rename Variable, Move Method, Inline Variable. See [[Key Refactorings]].

**Trigger:** when adding a feature, refactor first to make the addition easy; then add the feature ("make the change easy, then make the easy change").

## Design Tradeoffs

**Benefits:**
- Code stays healthy.
- Future changes cheaper.
- Bugs surface.
- Knowledge spreads as code clarifies.

**Costs:**
- Time investment (paid back manyfold).
- Discipline required.
- Without tests, dangerous.

## Real Production Examples

- **Any healthy codebase** — refactoring is continuous.
- **Modern IDEs** — automate common refactorings (IntelliJ, VS Code).

## Interview Perspective

**Common questions:**
- "What's refactoring?" → Changing internal structure without changing behavior.
- "Why?" → Maintain code health; enable future change.
- "Hardest part?" → Discipline; not mixing refactoring with feature work.

**Senior-level:**
- "Make the change easy, then make the easy change" — Kent Beck's rule.
- Refactoring requires tests. Without tests, it's reckless.
- Big-bang rewrites famously fail; continuous refactoring works.

**Common mistakes:**
- Refactoring + feature in one commit.
- No tests → fear-driven.
- Big-bang rewrites.

## Related Concepts

- [[Code Smells]] · [[Key Refactorings]] · [[Technical Debt]] · [[Unit Testing]]

## Misconceptions

- **"Refactoring = rewriting."** Refactoring preserves behavior; rewriting may not.
- **"Refactoring breaks things."** Without tests, yes. With tests, safe.
- **"Refactoring is a project."** Continuous practice.

## Failure Scenarios

- **No tests** → refactor breaks behavior.
- **Mixed with features** → bugs.
- **Big-bang rewrite** → fails to deliver value.

## Practical Engineering Heuristics

- **Tests required.**
- **Small steps.**
- **Two hats.**
- **Make the change easy.**
- **Use IDE refactorings** when possible.

## Active Recall Questions

What's refactoring?::Changing internal structure of code without changing external behavior.

Who codified it?::Martin Fowler in "Refactoring" (1999, 2nd ed. 2018).

What's the "two hats" rule?::Wear one at a time — add feature, or refactor. Never both in one commit.

What's Kent Beck's rule?::Make the change easy, then make the easy change. Refactor first to simplify; then add the feature.

Precondition for refactoring?::Tests pass. Then each refactoring step, tests still pass.

Why are big-bang rewrites bad?::Take too long; risk losing existing behavior; rarely deliver promised improvements. Continuous refactoring instead.

## Feynman Test

A feature is hard to add because of bad code structure. Walk through Kent Beck's rule.

Why is "no tests" a precondition for not refactoring?

## Mastery Checklist

- **Explain** refactoring discipline.
- **Compare** with rewriting.
- **Derive** when to refactor vs add feature.
- **Critique** big-bang rewrites.
- **Design** refactoring approach to legacy code.

---
title: SOLID Principles
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Dependency Injection]]", "[[Composition over Inheritance]]", "[[Program to Interface]]"]
sources:
  - Robert C. Martin (Uncle Bob) — coined the acronym
  - Head First Design Patterns
  - Modern Software Engineering (Farley)
tags: [design-patterns, solid, principles, fundamental]
aliases: ["SOLID Principles"]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# SOLID Principles

## Executive Summary

**SOLID** is a mnemonic (Robert C. "Uncle Bob" Martin, ~2000) for **five object-oriented design principles**: **S**ingle Responsibility, **O**pen/Closed, **L**iskov Substitution, **I**nterface Segregation, **D**ependency Inversion. Together, they guide designs toward: **modular, testable, extensible code**. Not laws but guidelines — context-sensitive. Foundational vocabulary for OO design discussions; appear constantly in interviews and code reviews.

## Why This Exists

OO code can be elegant or a tangled mess. The difference often comes down to following a few foundational principles. SOLID names them, making them teachable and discussable. "Your class violates SRP" is a precise critique.

## Core Intuition

A toolbox of design heuristics. Each principle is a lens for evaluating code. Together they push toward maintainable systems.

## The Five Principles

### S — Single Responsibility Principle (SRP)

**"A class should have one reason to change."**

If a class has multiple distinct responsibilities, changes for one reason may break the others. Separate them.

**Example:** A `User` class that handles authentication AND persistence AND email sending has three reasons to change. Split into `User`, `Authenticator`, `UserRepository`, `EmailService`.

**Caveat:** "Responsibility" can be slippery. Don't atomize trivially. Cohesion matters.

### O — Open/Closed Principle (OCP)

**"Open for extension, closed for modification."**

You should be able to add behavior without modifying existing code. Achieved via polymorphism, [[Strategy]], plugins.

**Example:** Adding a new payment method shouldn't require editing the checkout flow — just plug in a new `PaymentStrategy`.

### L — Liskov Substitution Principle (LSP)

**"Subtypes must be substitutable for their base types."**

If `Duck` is a base type and `RubberDuck` is a subtype, code expecting `Duck` must work with `RubberDuck`. Subtypes can't violate contracts of the supertype.

**Classic example:** `Rectangle` and `Square`. If `Square extends Rectangle`, setting width and height independently breaks invariants. LSP violation.

### I — Interface Segregation Principle (ISP)

**"Many specific interfaces are better than one general one."**

Clients shouldn't depend on methods they don't use. Big interfaces force implementers to no-op irrelevant methods.

**Example:** Instead of a `Worker` interface with `work()` and `eat()`, split into `Workable` and `Eatable`. A `Robot` implements `Workable` but not `Eatable`.

### D — Dependency Inversion Principle (DIP)

**"Depend on abstractions, not concretions."**

High-level modules shouldn't depend on low-level modules. Both should depend on abstractions. Concrete implementations are injected.

**Example:** A `ReportGenerator` shouldn't depend directly on a `PostgresDB`. It should depend on a `DataStore` interface; the Postgres implementation is injected.

Closely related to [[Dependency Injection]] (the mechanism).

## Design Tradeoffs

**Benefits:**
- Modular, testable, extensible.
- Common vocabulary.
- Foundation for maintainable OO.

**Costs:**
- Over-applied → over-engineered.
- Context-sensitive — not absolute rules.
- Dogmatic application is anti-pattern.

## Real Production Examples

- **Any healthy OO codebase** balances these principles.
- **Spring framework** built on DI (Dependency Inversion).
- **Most well-designed libraries** follow ISP.

## Interview Perspective

**Common questions:**
- "Name the SOLID principles." → SRP, OCP, LSP, ISP, DIP.
- "Explain each with example." → As above.
- "When violate?" → Often; principles are heuristics, not laws.

**Senior-level:**
- "SOLID is necessary but not sufficient" — designs can be SOLID-compliant and still poor.
- Modern lean: "SOLID was a useful starting point; modern thinking has moved on" (Farley).
- Dependency Inversion is probably the most-impactful in practice.

**Common mistakes:**
- Dogmatic application.
- "Single responsibility" used to atomize trivially.
- Treating SOLID as bug-free guarantee.

## Related Concepts

- [[Dependency Injection]] · [[Composition over Inheritance]] · [[Program to Interface]]

## Misconceptions

- **"Follow SOLID and you have good code."** Necessary, not sufficient.
- **"SOLID is universal."** OO-flavored; functional code has different principles.

## Failure Scenarios

- **Over-engineering** from dogmatic application.
- **LSP violations** producing buggy hierarchies.
- **Dependency Inversion ignored** → tightly-coupled monoliths.

## Practical Engineering Heuristics

- **Treat as heuristics, not laws.**
- **DIP + DI** is the most-impactful pairing.
- **SRP is judgment-based** — don't over-atomize.
- **LSP requires hierarchical discipline** — prefer composition.

## Active Recall Questions

What does SOLID stand for?::Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.

Who coined it?::Robert C. Martin (Uncle Bob), ~2000.

What's SRP?::A class should have one reason to change. Separate distinct responsibilities.

What's OCP?::Open for extension, closed for modification. Add behavior without modifying existing code.

What's LSP?::Subtypes must be substitutable for base types. Don't violate base's contract.

What's ISP?::Many specific interfaces better than one general. Don't force clients to depend on methods they don't use.

What's DIP?::Depend on abstractions, not concretions. High-level modules shouldn't depend on low-level; both depend on interfaces.

Classic LSP violation example?::Square extends Rectangle. Setting width and height independently breaks Rectangle invariants for Square.

## Feynman Test

Code review identifies SRP violation. Walk through what to do.

Why is "SOLID compliance" not sufficient for good code?

## Mastery Checklist

- **Explain** each of the five principles.
- **Compare** them with concrete examples.
- **Derive** appropriate application.
- **Critique** dogmatic application.
- **Design** code refactor improving multiple SOLID principles.

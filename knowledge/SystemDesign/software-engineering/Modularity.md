---
title: Modularity
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[First Principles of SE]]", "[[Information Hiding]]", "[[Bounded Contexts]]", "[[Microservices]]"]
builds_toward: ["[[Information Hiding]]"]
sources:
  - David Farley, "Modern Software Engineering"
  - David Parnas (1972)
  - SWE@Google
tags: [software-engineering, modularity, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Modularity (with Cohesion & Coupling)

## Executive Summary

**Modularity** is the practice of decomposing systems into pieces (modules). Two qualities govern good modularity: **high cohesion** (within a module, things belong together) and **low coupling** (between modules, dependencies are minimal and clean). David Parnas's 1972 paper "On the Criteria to be Used in Decomposing Systems into Modules" established the foundation. Combined with [[Information Hiding]], modularity is **the central technique for managing complexity** (Farley's second discipline).

## Why This Exists

Without modularity, every change affects everything. Bug fixes ripple; features risk regressions in unrelated areas. With modular structure, each piece has bounded scope; changes are localized; complexity contained.

## Core Intuition

A house with rooms. Each room has a purpose (cohesion); doorways are deliberate (coupling). Without rooms, every activity disrupts every other. With rooms, plus reasonable doors, life works.

## Cohesion

**High cohesion:** within a module, elements belong together — same purpose, same data, same level of abstraction.

**Types (low to high):**
1. **Coincidental** — random grouping.
2. **Logical** — grouped by category (e.g., "all utility functions").
3. **Temporal** — done at same time (initialization).
4. **Procedural** — sequential steps.
5. **Communicational** — operate on same data.
6. **Sequential** — output of one feeds next.
7. **Functional** — all parts contribute to one task. **Best.**

## Coupling

**Low coupling:** between modules, dependencies are minimal and clean.

**Types (worst to best):**
1. **Content** — module modifies another's internals. Awful.
2. **Common** — share global data. Bad.
3. **External** — share external format.
4. **Control** — pass control flags.
5. **Stamp** — share data structure (use part of it).
6. **Data** — share simple parameters. **Good.**
7. **Message** — communicate via well-defined message. **Best.**

## Design Tradeoffs

**Good modularity:**
- Contains complexity.
- Enables parallel work.
- Allows targeted change.
- Aids testing.

**Costs:**
- Up-front design.
- Premature modularity = over-engineering.

## Real Production Examples

- **Object-oriented design** principles built on Parnas.
- **Microservices** = modularity at deployment level.
- **Modular monoliths** = modularity within one process.

## Interview Perspective

**Common questions:**
- "Cohesion?" → Things in a module belong together.
- "Coupling?" → Connections between modules minimized.
- "Goal?" → High cohesion + low coupling.

**Senior-level:**
- Parnas's paper is the foundational text on modularity (1972).
- Microservices are modularity made physical; modular monoliths are modularity made discipline.
- Wrong module boundaries are worse than no boundaries.

**Common mistakes:**
- Over-modularizing trivial systems.
- Wrong boundaries (low cohesion).
- "Modular" with hidden tight coupling.

## Related Concepts

- [[First Principles of SE]] · [[Information Hiding]] · [[Bounded Contexts]] · [[Microservices]] · [[Modular Monolith]]

## Misconceptions

- **"Modular = many modules."** Quality matters more than count.
- **"Microservices = modular."** Only if boundaries right.

## Failure Scenarios

- **Bad boundaries** — every change crosses modules.
- **Hidden coupling** — looks modular; isn't.
- **Over-modular** — too many tiny modules; overhead.

## Practical Engineering Heuristics

- **High cohesion within; low coupling between.**
- **Boundaries by domain / behavior.**
- **Resist premature modularity.**
- **Refactor when boundaries become wrong.**

## Active Recall Questions

What's cohesion?::Within a module, things belong together (same purpose, data, abstraction). High cohesion is good.

What's coupling?::Between modules, dependencies. Low coupling is good — minimal, clean connections.

Who pioneered modularity?::David Parnas, 1972, "On the Criteria to be Used in Decomposing Systems into Modules."

Highest cohesion type?::Functional — all parts contribute to one task.

Worst coupling type?::Content coupling — module modifies another's internals.

Goal?::High cohesion + low coupling. Localizes change; contains complexity.

## Feynman Test

Design a payment system module with high cohesion. Show coupling to user system.

Why is "many modules" not the same as "modular"?

## Mastery Checklist

- **Explain** modularity, cohesion, coupling.
- **Compare** module qualities.
- **Derive** appropriate boundaries.
- **Critique** poorly-modularized systems.
- **Design** modular system with explicit boundaries.

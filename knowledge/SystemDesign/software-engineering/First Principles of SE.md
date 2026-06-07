---
title: First Principles of SE
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Iterative & Incremental]]", "[[Empirical Feedback]]", "[[Modularity]]", "[[Information Hiding]]"]
builds_toward: ["[[Iterative & Incremental]]", "[[Modularity]]"]
sources:
  - David Farley, "Modern Software Engineering" (2021)
tags: [software-engineering, principles, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# First Principles of Software Engineering

## Executive Summary

**David Farley's "Modern Software Engineering" (2021)** proposes that software engineering rests on **two foundational disciplines: optimizing for learning** (we're doing exploration; treat code as experiments) and **optimizing for managing complexity** (systems get complex; we must contain it). From these flow five techniques: **iterative & incremental, empirical feedback, modularity, cohesion, separation of concerns / information hiding**. Farley argues these are the genuine first-principles of the discipline — what experimental science is to physics, these are to software.

## Why This Exists

Software engineering has lacked first principles — too many "best practices," not enough foundational reasoning. Farley aims to ground the discipline: engineering is applied science; software is applied learning + complexity management. Everything else (Agile, TDD, CI/CD, microservices) is technique built on these foundations.

## Core Intuition

Physics has Newton's laws — foundations from which mechanics derives. Farley argues software has analogous foundations. Once you internalize them, choices become clear: does this practice help us learn faster? Does it manage complexity? If yes, adopt; if no, skip.

## The Two Disciplines

### Optimizing for Learning

Software is exploration: we don't know exactly what to build, how it will perform, what users want. Engineering is the discipline of *learning fast and reliably*.

Techniques:
- **Iterative & Incremental** — small steps; learn from each.
- **Empirical Feedback** — measure, don't guess.
- **Experimental approach** — hypothesis + test.

### Managing Complexity

Software systems grow complex. Without discipline, they become unmaintainable.

Techniques:
- **Modularity** — decompose into pieces.
- **Cohesion** — related things together.
- **Separation of concerns** — different things separate.
- **Information hiding** — implementation details encapsulated.

## Real Production Examples

- **Continuous Delivery** — Farley's earlier book; embodies these principles.
- **Most modern engineering practices** — fit into this frame.

## Design Tradeoffs

**Following first principles:**
- Pros: clear reasoning; transferable; lasting.
- Cons: more abstract than recipes.

## Interview Perspective

**Common questions:**
- "What's Farley's framing?" → Learning + complexity management. Two disciplines underlying SE.
- "Five techniques?" → Iterative & Incremental, Empirical Feedback, Modularity, Cohesion, Information Hiding.
- "Why this matters?" → Provides reasoning ground for practice choices.

**Senior-level:**
- Farley's framing is influential for senior engineers reasoning about practices.
- Practices come and go; principles persist.

**Common mistakes:**
- Adopting practices without understanding principles.
- Treating Farley's principles as religion.

## Related Concepts

- [[Iterative & Incremental]] · [[Empirical Feedback]] · [[Modularity]] · [[Information Hiding]]

## Misconceptions

- **"Just follow best practices."** Practices need reasoning ground.
- **"First principles = no judgment."** Provides framework; judgment still needed.

## Failure Scenarios

- **Cargo-cult adoption** of practices.
- **Principles without practice** — empty.

## Practical Engineering Heuristics

- **Ask: does this help us learn faster?**
- **Ask: does this manage complexity?**
- **Adopt practices that serve principles.**
- **Question practices that don't.**

## Active Recall Questions

What are Farley's two disciplines?::Optimizing for learning; managing complexity.

Five techniques?::Iterative & incremental, empirical feedback, modularity, cohesion, separation of concerns / information hiding.

What does "optimizing for learning" mean?::Software is exploration. Engineering practice optimizes for learning fast and reliably what to build and how.

What does "managing complexity" mean?::Systems grow complex; deliberate practices contain complexity through modularity and encapsulation.

What's the book?::"Modern Software Engineering" by David Farley (2021).

Why first principles?::Provides reasoning ground for practice choices. Practices come and go; principles persist.

## Feynman Test

Apply Farley's principles to decide whether to adopt microservices.

Why does "optimizing for learning" justify continuous delivery?

## Mastery Checklist

- **Explain** Farley's two disciplines.
- **Compare** principles with practices.
- **Derive** practice choices from principles.
- **Critique** practices not serving principles.
- **Design** an engineering culture around first principles.

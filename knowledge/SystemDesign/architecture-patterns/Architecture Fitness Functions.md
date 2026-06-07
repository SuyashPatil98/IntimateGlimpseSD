---
title: Architecture Fitness Functions
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: ["[[Architecture Characteristics]]"]
related: ["[[Architecture Characteristics]]", "[[ADRs]]"]
sources:
  - FoSA Ch.6
  - 'Building Evolutionary Architectures (Ford, Parsons, Kua)'
tags: [architecture, fitness-functions, evolutionary]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Architecture Fitness Functions

## Executive Summary

An **Architecture Fitness Function** is an **automated check that an architecture characteristic is being maintained** — a test for the architecture, not for individual features. From "Building Evolutionary Architectures" (Ford, Parsons, Kua). Examples: load test verifying scalability; dependency analysis ensuring no cross-module violations; security scan for vulnerabilities. Like unit tests for architecture: fail when the system drifts from intended properties.

## Why This Exists

Architecture decisions decay. The team that decided "no circular dependencies" doesn't enforce it as new code is written. The decision "p99 < 200ms" is forgotten when changes slow things down. Fitness functions automate enforcement: run them in CI; fail the build when architecture drifts.

## Core Intuition

Fitness in evolution: continuously measured; selection pressure maintains it. Software architecture is the same: without continuous measurement, undesirable mutations accumulate. Fitness functions provide the selection pressure.

## Categories

**By trigger:**
- **Triggered** — run on commits, in CI.
- **Continuous** — always running (e.g., monitoring).

**By scope:**
- **Atomic** — single characteristic.
- **Holistic** — combination.

**By execution:**
- **Static** — analyze code (no runtime).
- **Dynamic** — observe running system.
- **Manual** — chaos experiments, design reviews.

## Examples

**Modularity:**
- Tool checks no cycles in dependency graph.
- Packwerk (Shopify) enforces module boundaries.

**Performance:**
- Load test ensures p99 < target.

**Security:**
- SAST scan for OWASP issues.

**Reliability:**
- Chaos engineering experiments.

**Cost:**
- Daily check that infrastructure cost < threshold.

## Real Production Examples

- **Architecture testing** in CI (ArchUnit for Java, NetArchTest for .NET).
- **Performance budgets** in browser apps.
- **SLO monitoring** as runtime fitness functions.
- **Linters and static analysis** for cross-cutting rules.

## Design Tradeoffs

**Benefits:**
- Architecture stays as intended.
- Drift caught early.
- Documentation through code.
- Confidence in evolution.

**Costs:**
- Up-front effort.
- Maintenance.
- False positives.

## Interview Perspective

**Common questions:**
- "What's a fitness function?" → Automated check that an architecture characteristic is maintained.
- "Examples?" → Dependency analysis, load test, security scan, SLO monitoring.
- "Why use them?" → Architecture decays without continuous enforcement.

**Senior-level:**
- Fitness functions turn architecture from a one-time decision into an ongoing property.
- They're the modern answer to "architecture documents that no one reads."
- ArchUnit-style tests in Java were pioneering.

**Common mistakes:**
- Too many fitness functions → CI bloat.
- Fitness functions without thresholds → meaningless.
- Manual checks called "fitness functions."

## Related Concepts

- [[Architecture Characteristics]] · [[ADRs]]

## Misconceptions

- **"Fitness functions = unit tests."** Similar idea, but for architecture-level properties.
- **"Manual reviews suffice."** They decay; automation doesn't.
- **"Fitness functions slow development."** Less than incurring architecture debt.

## Failure Scenarios

- **No fitness functions** → architecture drift.
- **Fitness functions too strict** → constant false positives.
- **Fitness functions ignored** → silent decay.

## Practical Engineering Heuristics

- **One fitness function per priority characteristic.**
- **Automated in CI.**
- **Visible failure** — block builds or flag.
- **Maintain them** as architecture evolves.

## Active Recall Questions

What's an Architecture Fitness Function?::Automated check that an architecture characteristic is being maintained. Like unit tests for architecture.

Examples?::Dependency analysis (no cycles), load test (p99 budget), security scan, SLO monitoring, chaos experiments.

Categories?::Triggered vs continuous; atomic vs holistic; static vs dynamic vs manual.

Why use them?::Architecture decays without continuous enforcement. Decisions are forgotten; properties drift.

Name a tool.::ArchUnit (Java), NetArchTest (.NET), Packwerk (Ruby), ESLint with custom rules.

What's the relationship to ADRs?::ADRs document decisions; fitness functions enforce them.

## Feynman Test

Design fitness functions for "modular monolith" and "p99 < 200ms."

Why does an architecture without fitness functions inevitably drift?

## Mastery Checklist

- **Explain** fitness functions.
- **Compare** with manual review.
- **Derive** appropriate fitness functions for given characteristics.
- **Critique** architectures without enforcement.
- **Design** fitness function suite for a project.

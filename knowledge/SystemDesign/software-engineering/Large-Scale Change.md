---
title: Large-Scale Change
area: software-engineering
status: mature
difficulty: advanced
prerequisites: []
related: ["[[Monorepos]]", "[[Deprecation]]", "[[CI-CD]]"]
sources:
  - SWE@Google Ch.22
tags: [software-engineering, large-scale, refactoring]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Large-Scale Change (LSC)

## Executive Summary

A **Large-Scale Change (LSC)** is a coordinated **modification across many files, projects, or teams in a codebase** — typically too large to fit one PR. At Google's scale: refactoring a library used by thousands of services; migrating to a new auth system; updating from one framework version to another. Requires specialized **tooling, process, and discipline**: automated transformation, distributed review, gradual rollout. The "rolling upgrade" of code across an enormous codebase.

## Why This Exists

Monorepos enable atomic LSCs (vs polyrepos where they're impossible). But "atomic" doesn't mean "one PR" — LSCs touch tens of thousands of files. Without process, they'd be unreviewable, unmergeable, and rollback-risky. LSC infrastructure manages this complexity.

## Core Intuition

Painting every door in a 500-building campus. One person, one PR, can't. But a coordinated effort with the right tooling, sequencing, and rollback can. LSC is software's equivalent.

## Internal Mechanics

**LSC tooling (Google example):**
- **Rosie** — distributes LSC across many PRs.
- **Refaster, Error Prone** — pattern-based code transformation.
- **OWNERS** — distributed approval (each file's owner reviews).
- **Tap (test infra)** — runs affected tests.

**LSC process:**
1. **Identify** the change (deprecate API, rename type).
2. **Tool up** — write automated transformation.
3. **Pilot** — try on a few files; verify.
4. **Distribute** — split into small PRs (~50 files each).
5. **Roll out** — send to file owners for review.
6. **Verify** — tests pass; no regressions.
7. **Complete** — confirm zero usage; remove old code.

**Properties:**
- Incremental (small PRs).
- Reversible (each PR can be reverted).
- Automated (consistency).

## Real Production Examples

- **Google** — thousands of LSCs per year.
- **Facebook codemod** — pattern-based.
- **Many language version migrations.**

## Design Tradeoffs

**Benefits:**
- Atomic change across codebase.
- Coordinated.
- Reversible.

**Costs:**
- Tooling investment.
- Coordination overhead.
- Specialist work.

## Interview Perspective

**Common questions:**
- "What's an LSC?" → Coordinated change across many files/projects. Too big for one PR.
- "How execute?" → Automated transformation; small PRs to file owners; verification.
- "Why monorepo?" → Atomic visibility across all callers.

**Senior-level:**
- LSC infrastructure is what makes monorepos work at scale.
- Polyrepo LSCs are impossible — can't atomically change across boundaries.
- LSC + deprecation = the cleanup half of software engineering.

**Common mistakes:**
- LSC in one giant PR.
- No automation → inconsistencies.
- No rollback plan.

## Related Concepts

- [[Monorepos]] · [[Deprecation]] · [[CI-CD]] · [[Strangler Fig]]

## Misconceptions

- **"LSC = giant PR."** Opposite — many small PRs.
- **"Only for huge orgs."** Smaller orgs do LSC too at smaller scale.

## Failure Scenarios

- **Giant PR** unreviewable.
- **Inconsistent transformation** → breaks.
- **No rollback** → forced to keep broken.

## Practical Engineering Heuristics

- **Automate transformation.**
- **Many small PRs.**
- **Distribute to file owners.**
- **Verify incrementally.**
- **Rollback plan per PR.**

## Active Recall Questions

What's a Large-Scale Change?::Coordinated change across many files, projects, or teams in a codebase. Too big for one PR.

How execute LSC?::Automated transformation, many small PRs, distributed review by file owners, incremental verification.

Why does monorepo enable LSC?::Atomic visibility across all callers; you see who depends on what.

Why not one giant PR?::Unreviewable; impossible to rollback; tests can't keep up.

What's Google's LSC tool?::Rosie (distribution); Refaster, Error Prone (transformations); Critique (review); Tap (test infra).

What's the cleanup half of engineering?::Deprecation + LSC. Removing old, migrating users.

## Feynman Test

A library used by 5000 callers needs a breaking change. Walk through LSC process.

Why is "LSC in one PR" the canonical anti-pattern?

## Mastery Checklist

- **Explain** LSC and its tooling.
- **Compare** with regular PRs and deprecation.
- **Derive** when LSC is needed.
- **Critique** big-bang LSC attempts.
- **Design** LSC plan for a migration.

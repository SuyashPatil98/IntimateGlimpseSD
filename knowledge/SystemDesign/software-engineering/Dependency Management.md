---
title: Dependency Management
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Build Systems]]", "[[Monorepos]]"]
sources:
  - SWE@Google Ch.21
tags: [software-engineering, dependencies]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Dependency Management

## Executive Summary

**Dependency management** is the discipline of **declaring, resolving, and updating external code your project depends on**. Modern dev: dozens to thousands of transitive dependencies. Managers: **npm (JS), pip/poetry (Python), Maven/Gradle (Java), Cargo (Rust), Bazel rules**. Concerns: **version resolution, lock files, security vulnerabilities, supply chain attacks, license compliance, dependency hell**. The unglamorous foundation of all modern software development.

## Why This Exists

No modern project is written from scratch — everything uses libraries. Without management: version conflicts, security holes, "works in dev, breaks in prod." Dependency managers solve these: declare what you need, the tool figures out compatible versions, lock files ensure reproducibility.

## Core Intuition

Building a house with bricks from multiple suppliers. You need: a list of what bricks, exact dimensions, suppliers stand behind quality, no toxic materials. Dependency management is this discipline for code.

## Key Concepts

**Direct vs transitive:**
- Direct: your project depends directly on lib A.
- Transitive: A depends on B; you transitively depend on B.

**Version resolution:**
- Solve: which versions are mutually compatible?
- Algorithms: backtracking, SAT solvers (Cargo).

**Lock files:**
- Record exact resolved versions (package-lock.json, Pipfile.lock, Cargo.lock).
- Reproducibility across machines and time.

**Semantic versioning (semver):**
- MAJOR.MINOR.PATCH.
- Breaking changes bump MAJOR.
- Many libraries don't actually follow it.

**Supply chain attacks:**
- Malicious code published to public registries.
- npm event-stream incident, others.
- Mitigations: lockfile pinning, dependency scanning, private registries.

## Real Production Examples

- **npm, Yarn, pnpm** — JS.
- **pip, poetry, pipenv** — Python.
- **Maven, Gradle** — Java.
- **Cargo** — Rust.
- **Bazel rules_*** — multi-language.
- **Snyk, Dependabot** — vulnerability scanning.

## Design Tradeoffs

**Modern dep management:**
- **Pros:** reuse; productivity; ecosystem.
- **Cons:** supply chain risk; version conflicts; bloat.

## Interview Perspective

**Common questions:**
- "What's a lock file?" → Records exact resolved versions for reproducibility.
- "Direct vs transitive?" → Direct: you declared. Transitive: your deps' deps.
- "Supply chain risk?" → Malicious code in dependencies; mitigated by pinning, scanning.

**Senior-level:**
- "Dependency hell" — conflicting version requirements that can't be satisfied.
- Pinning vs floating: lockfile pins; range specs (^1.2.0) float within compatible.
- Security: never blindly trust transitive deps. Scan continuously.

**Common mistakes:**
- No lock file → non-reproducible.
- Auto-update everything → breakage.
- Ignoring CVEs.

## Related Concepts

- [[Build Systems]] · [[Monorepos]]

## Misconceptions

- **"Lock file = pinned."** Yes for reproducibility; you must update intentionally.
- **"Transitive deps are someone else's problem."** They're yours.

## Failure Scenarios

- **CVE in transitive dep** → exploited.
- **Version conflicts** → dependency hell.
- **Supply chain attack** via compromised package.

## Practical Engineering Heuristics

- **Always commit lock files.**
- **Scan for CVEs** (Dependabot, Snyk).
- **Pin direct deps** to specific versions.
- **Audit transitive deps** periodically.
- **Minimize dependency surface.**

## Active Recall Questions

What's dependency management?::Declaring, resolving, and updating external code your project depends on.

Direct vs transitive dependencies?::Direct: declared by you. Transitive: deps of your deps.

What's a lock file?::Records exact resolved versions of all deps. Reproducibility across machines.

What's a supply chain attack?::Malicious code published to a public registry your project depends on. Mitigated by pinning, scanning, private registries.

What's semantic versioning?::MAJOR.MINOR.PATCH. Breaking → MAJOR bump. Many libraries don't follow it consistently.

Name three vulnerability scanners.::Snyk, Dependabot, OSV, npm audit.

## Feynman Test

Walk through `npm install` from package.json to lockfile.

Why is "transitive dependency CVE" your problem despite not declaring it?

## Mastery Checklist

- **Explain** dependency management.
- **Compare** lock-based and range-based pinning.
- **Derive** appropriate strategy for given project.
- **Critique** projects without lock files.
- **Design** dependency strategy with security scanning.

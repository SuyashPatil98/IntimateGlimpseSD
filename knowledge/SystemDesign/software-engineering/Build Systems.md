---
title: Build Systems
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Monorepos]]", "[[Dependency Management]]", "[[CI-CD]]"]
sources:
  - SWE@Google Ch.18
tags: [software-engineering, build, tooling]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Build Systems

## Executive Summary

A **build system** transforms source code into executable artifacts (binaries, container images, deployment packages). Modern build systems: **Bazel, Buck, Pants** (artifact-oriented, distributed caching, hermetic builds). Legacy: **Make, Maven, Gradle, npm scripts**. At scale, builds are **the** productivity bottleneck — every developer waits for them dozens of times daily. Investment in build infrastructure pays off enormously at any size beyond trivial.

## Why This Exists

A 10-second build means engineers iterate freely. A 10-minute build means engineers context-switch; productivity collapses. Build systems determine which world you live in. Modern systems (Bazel-class) provide: incremental builds, distributed caching, hermetic reproducibility, parallelism.

## Core Intuition

A factory's tooling. With good tooling, a manufacturing job takes minutes; with bad tooling, hours. Same source materials; vastly different output rates. Software builds are the same: tooling determines throughput.

## Key Features

**Incremental builds:**
- Only rebuild what changed (and its dependents).
- Track dependencies precisely.

**Distributed caching:**
- One developer builds; another fetches the cached result.
- Massive savings at scale.

**Hermeticity:**
- Build inputs explicit; output depends only on inputs.
- Reproducible builds; no "works on my machine."

**Parallelism:**
- Independent targets built simultaneously.
- Uses all cores.

**Remote execution:**
- Build happens on cluster; not laptop.
- Bazel Remote Execution, Buck.

## Build System Comparison

| System | Domain | Hermetic | Distributed cache | Notes |
|---|---|---|---|---|
| Make | Generic | No | No | Foundation; brittle |
| Maven, Gradle | JVM | Partial | Limited | Common Java |
| npm, Yarn | JS | No | Limited | Common JS |
| **Bazel** | Multi-language | Yes | Yes | Google's; for monorepos |
| **Buck** | Multi-language | Yes | Yes | Facebook's |
| **Pants** | Multi-language | Yes | Yes | OSS, modern |

## Real Production Examples

- **Google** — Bazel (originally Blaze).
- **Facebook** — Buck.
- **Twitter** — Pants.
- **Most large orgs with monorepos** — Bazel or similar.

## Design Tradeoffs

**Modern hermetic build:**
- **Pros:** reproducible, cacheable, fast.
- **Cons:** steeper learning curve; strict dependency declaration.

**Legacy build (Make-like):**
- **Pros:** simple to start.
- **Cons:** "works on my machine" syndrome; cache-invalidation bugs.

## Interview Perspective

**Common questions:**
- "Why use Bazel over Make?" → Hermetic, distributed cache, parallel, incremental.
- "What's a hermetic build?" → Output depends only on declared inputs. Reproducible.
- "When invest in build system?" → When builds slow productivity; or with monorepo from day 1.

**Senior-level:**
- Build performance is leverage — fast builds = faster iterations = faster product.
- Bazel-class systems have steep learning curves but huge payoff at scale.
- Cache hit rate is the key metric.

**Common mistakes:**
- Tolerating slow builds.
- No build caching.
- Build infrastructure as afterthought.

## Related Concepts

- [[Monorepos]] · [[Dependency Management]] · [[CI-CD]]

## Misconceptions

- **"Bazel is just for monorepos."** Useful any time builds are slow.
- **"Make is fine."** Until your project grows.

## Failure Scenarios

- **Slow build** → CI bypassed.
- **Non-hermetic** → "works on my machine."
- **No cache** → engineers wait constantly.

## Practical Engineering Heuristics

- **Monitor build time as a KPI.**
- **Invest in caching early.**
- **Bazel/Buck/Pants for monorepos.**
- **Hermetic builds non-negotiable** at scale.

## Active Recall Questions

What's a hermetic build?::Build output depends only on declared inputs; no hidden environment leakage. Reproducible.

Why use Bazel?::Hermetic, distributed caching, parallelism, incremental. Massive build-speed wins at scale.

What's distributed caching in builds?::One developer/CI builds; result cached centrally; others fetch without rebuilding.

Why is build speed leverage?::Engineers wait for builds dozens of times daily. Slow builds compound across team.

Name three modern build systems.::Bazel, Buck, Pants.

What's the failure mode of non-hermetic builds?::"Works on my machine" — output depends on local environment; different machines produce different artifacts.

## Feynman Test

A team's builds take 15 minutes. Walk through the productivity impact.

Why does "hermetic" enable distributed caching, while non-hermetic doesn't?

## Mastery Checklist

- **Explain** build systems and their role.
- **Compare** modern vs legacy systems.
- **Derive** when to invest in build infrastructure.
- **Critique** slow / non-hermetic builds.
- **Design** build strategy for a monorepo.

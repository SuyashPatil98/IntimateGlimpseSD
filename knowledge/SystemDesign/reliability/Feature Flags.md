---
title: Feature Flags
area: reliability
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Canary Releases]]", "[[Blue-Green Deployment]]"]
sources:
  - SWE@Google + SRE book
  - LaunchDarkly engineering blog
tags: [reliability, deployment, feature-flags]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Feature Flags

## Executive Summary

**Feature flags** (toggles) let you **enable or disable code paths at runtime without deploying** — separating **deploy from release**. Variants: **release toggles** (gradual rollout), **experiment toggles** (A/B testing), **ops toggles** (kill switches for failures), **permission toggles** (per-user features). Decoupling deploy from release is a foundational continuous-delivery practice. Implementations: **LaunchDarkly, Split.io, Unleash, AWS AppConfig**.

## Why This Exists

Without feature flags, every release goes to everyone at once. With flags, you can deploy code with a feature off, then turn it on for 1% of users, then 10%, then everyone — without redeploying. Bug surfaces? Turn the flag off. Big wins: smaller blast radius, gradual rollouts, A/B testing, kill switches.

## Core Intuition

Code with an `if` statement: "if flag X is on, do new behavior; else, old behavior." The flag's value comes from external config — change anytime. Flip flag → behavior changes. No redeploy.

## Flag Types

**Release toggles:** roll out new features gradually.
- Lifecycle: short-lived (weeks).
- Removed once feature is fully released.

**Experiment toggles:** A/B testing.
- Different users get different variants.
- Measure outcome.

**Ops toggles (kill switches):** disable risky paths under incident.
- Live longer; on-call uses them.

**Permission toggles:** per-user or per-role features.
- Long-lived.

## Implementations

**Local config:**
- Simple; one source of truth in file.
- No real-time changes.

**Centralized service:**
- LaunchDarkly, Split.io, Unleash.
- Real-time evaluation; targeting rules.
- Audit logs.

**Self-built:**
- Database table + cache.
- Custom evaluation logic.

## Design Tradeoffs

**Benefits:**
- Deploy ≠ release.
- Gradual rollout.
- Instant kill switch.
- A/B testing.
- Risk reduction.

**Costs:**
- Code complexity (branches).
- Stale flags accumulate.
- Testing combinations grows exponentially.

## Real Production Examples

- **Google, Facebook, Netflix** — extensive flag use.
- **LaunchDarkly** — leading commercial.
- **Unleash** — open source.
- **AWS AppConfig** — managed.

## Interview Perspective

**Common questions:**
- "What's a feature flag?" → Runtime toggle of code paths without redeploy.
- "Types?" → Release, experiment, ops (kill switch), permission.
- "Why?" → Decouple deploy from release; smaller blast radius; instant rollback.

**Senior-level:**
- Feature flags are foundational to continuous delivery.
- Stale flags are tech debt — track and remove.
- "Flag everything" creates combinatorial test explosion.

**Common mistakes:**
- Flags never removed → permanent dead branches.
- Untested combinations.
- Centralized flag service as SPOF.

## Related Concepts

- [[Canary Releases]] · [[Blue-Green Deployment]] · [[CI/CD]]

## Misconceptions

- **"Flags = bug-free deploys."** Reduce risk; don't eliminate.
- **"All deploys need flags."** Wasteful for trivial changes.

## Failure Scenarios

- **Flag service outage** → fallback to default (good design).
- **Stale flags accumulate** → code rot.
- **Untested combinations** → bugs in production.

## Practical Engineering Heuristics

- **Use flags for risky features.**
- **Plan flag removal as part of feature dev.**
- **Default fallback if flag service down.**
- **Track flag age; remove stale.**
- **Use library (LaunchDarkly, Unleash).**

## Active Recall Questions

What's a feature flag?::Runtime toggle of code paths without deploying. Decouples deploy from release.

Four flag types?::Release toggles (rollout), experiment toggles (A/B), ops toggles (kill switch), permission toggles (per-user).

Why decouple deploy from release?::Smaller blast radius; gradual rollouts; instant kill switch; A/B testing.

Main cost?::Code complexity; stale flag accumulation; testing combinations.

Name a commercial flag platform.::LaunchDarkly, Split.io, Unleash, AWS AppConfig.

What's the failure-mode safety?::Default behavior if flag service is unreachable.

## Feynman Test

A risky new feature is being rolled out. Design flag-based rollout.

Why does "flag everything" create more problems than it solves?

## Mastery Checklist

- **Explain** feature flags and types.
- **Compare** flag service vs local config.
- **Derive** appropriate flag use.
- **Critique** stale-flag accumulation.
- **Design** flag-based rollout strategy.

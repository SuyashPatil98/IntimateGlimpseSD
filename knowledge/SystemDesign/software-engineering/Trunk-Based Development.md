---
title: Trunk-Based Development
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[CI-CD]]"]
related: ["[[CI-CD]]", "[[Feature Flags]]"]
sources:
  - SWE@Google
  - Modern Software Engineering (Farley)
  - Paul Hammant (trunkbaseddevelopment.com)
tags: [software-engineering, branching, trunk]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Trunk-Based Development

## Executive Summary

**Trunk-Based Development (TBD)** is the practice where **all developers commit to a single shared branch (trunk/main) frequently — at least daily — using short-lived feature branches (hours, not weeks)**. Combined with [[CI-CD]] and [[Feature Flags]] for unfinished features. The proven approach at Google, Facebook, and other high-velocity orgs. Contrasts with **GitFlow** (long-lived feature branches, release branches) which inflates merge pain.

## Why This Exists

Long-lived branches diverge from main; merging becomes painful and risky. Engineers fear merging; merge less often; divergence grows. Vicious cycle. TBD: merge constantly; divergence stays small; merges are trivial.

## Core Intuition

Two rivers flowing into a confluence. Merge every minute: ripples blend smoothly. Merge once a month: tidal waves crash. The frequency of integration determines its pain.

## Internal Mechanics

**Practices:**
- All commits go to main / trunk.
- Feature branches live hours, not days/weeks.
- Use [[Feature Flags]] to hide unfinished features.
- CI runs on every commit.
- Bad commits revertable in seconds.

**Comparison with GitFlow:**
| Aspect | Trunk-Based | GitFlow |
|---|---|---|
| Branches | One (main); short branches OK | Many (develop, feature, release, hotfix) |
| Merge frequency | Multiple per day | Weeks |
| Conflict pain | Minimal | Significant |
| Release model | Continuous | Versioned |
| Best for | Web apps, modern services | Versioned products (rare today) |

**Required:**
- Strong CI.
- Test discipline.
- Feature flags for incomplete work.
- Fast review culture.

## Real Production Examples

- **Google, Facebook** — extreme TBD.
- **Most modern SaaS.**
- **GitFlow** persists for traditional versioned products.

## Design Tradeoffs

**Benefits:**
- Minimal merge pain.
- Fast feedback.
- Aligns with CI/CD.
- Whole-team awareness.

**Costs:**
- Requires strong CI.
- Discipline to commit small.
- Feature flag overhead.

## Interview Perspective

**Common questions:**
- "What's trunk-based dev?" → Everyone commits to main frequently; short-lived branches; feature flags for unfinished work.
- "Vs GitFlow?" → TBD: single branch, frequent integration. GitFlow: many branches, less frequent.
- "When use GitFlow?" → Versioned products (libraries, on-prem software).

**Senior-level:**
- TBD is what enables high deploy frequency at Google, Facebook, Netflix.
- Discipline required: CI must be reliable; tests must run fast.
- GitFlow's complexity is an anti-pattern for most modern services.

**Common mistakes:**
- "Trunk-based" with branches living for weeks → not really TBD.
- No feature flags → incomplete features deployed.
- Weak CI → broken main.

## Related Concepts

- [[CI-CD]] · [[Feature Flags]] · [[Testing Pyramid]]

## Misconceptions

- **"TBD = no branches."** Short-lived branches fine. Long-lived not.
- **"TBD = no review."** Review still essential; just fast.
- **"GitFlow is best practice."** Was; outdated for most modern services.

## Failure Scenarios

- **Main broken** due to bad CI.
- **Long branches sneak in** despite policy.
- **No feature flags** → users see incomplete features.

## Practical Engineering Heuristics

- **Daily commits to main.**
- **Branches < 1 day.**
- **Feature flags for unfinished work.**
- **Reliable CI.**
- **Block bad main with required checks.**

## Active Recall Questions

What's trunk-based development?::Practice where developers commit to main frequently; short-lived branches; feature flags for unfinished work.

TBD vs GitFlow?::TBD: single branch, frequent integration, minimal merge pain. GitFlow: many branches, infrequent integration, more merge pain.

What's required for TBD?::Reliable CI, strong tests, feature flags, fast review.

When use GitFlow?::Versioned products (libraries, on-prem software) where release branches matter.

How long should feature branches live in TBD?::Hours to a day. If longer, you're really doing branch-based dev.

Why does TBD reduce merge pain?::Constant integration keeps divergence small. Conflicts surface immediately and are minor.

## Feynman Test

A team switches from GitFlow to TBD. What changes? What breaks?

Why does GitFlow's complexity persist despite being outdated?

## Mastery Checklist

- **Explain** TBD.
- **Compare** with GitFlow.
- **Derive** when TBD vs GitFlow.
- **Critique** GitFlow-by-default decisions.
- **Design** TBD adoption plan.

---
title: Monorepos
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[CI-CD]]", "[[Build Systems]]", "[[Dependency Management]]"]
sources:
  - SWE@Google Ch.16
  - Google Engineering blog
tags: [software-engineering, monorepo, version-control]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Monorepos

## Executive Summary

A **monorepo** is a **single version-control repository containing many projects/services**. Used by **Google (one repo for ~all code), Facebook, Microsoft (Windows), Twitter, Uber**. Counter-intuitive at first; deeply pragmatic at scale. Benefits: **atomic cross-project changes, unified tooling, easy dependency updates, shared libraries**. Costs: **specialized tooling required, large clones, build/CI complexity, governance**. The choice often comes down to: many repos at small scale; monorepo at large scale.

## Why This Exists

With many small repos ("polyrepo"), shared changes require coordinated PRs across many repos. Library upgrades take months. Dependency drift is constant. Monorepo: change everything in one PR; atomic; immediately consistent across the org.

## Core Intuition

One library catalog for the whole city vs. each branch maintaining its own. The big catalog is harder to manage but enables unified search, consistent classification, and bulk changes.

## Internal Mechanics

**Structure:**
- One repo containing all services / libraries.
- Folders represent projects.
- Build system aware of cross-project dependencies.

**Tooling required:**
- **Build systems:** Bazel, Buck, Pants — handle huge codebases.
- **Code search:** can't grep — need indexers (Google's Code Search, Sourcegraph).
- **Sparse checkout:** developers fetch only relevant subtree.
- **CI:** must build only what changed; not the whole repo.

**Workflows:**
- Atomic commits across boundaries.
- Trunk-based development typical.
- Shared libraries upgraded in one commit.

## Monorepo vs Polyrepo

| Property | Monorepo | Polyrepo |
|---|---|---|
| Atomic changes across boundaries | Easy | Hard |
| Tooling | Specialized | Standard |
| Repository size | Huge | Per-project |
| Cross-team visibility | High | Low |
| Independent versioning | Hard | Easy |
| Onboarding | Steep | Shallow |
| Best for | Large orgs, tight coupling | Small orgs, loose coupling |

## Real Production Examples

- **Google** — billions of lines, one repo. Custom tooling (Piper, then Citc, Critique, Code Search).
- **Facebook** — Mercurial-based, custom tooling.
- **Microsoft Windows** — single repo using custom Git extensions.
- **Twitter, Uber, Airbnb** — monorepo for backend.
- **Many startups** — adopt monorepo early.

## Design Tradeoffs

**Benefits:**
- Atomic cross-project changes.
- Unified tooling.
- No dependency drift.
- Cross-team visibility.

**Costs:**
- Specialized build/CI.
- Large clones (mitigated by VFS, sparse checkout).
- Governance complexity.
- Permissions harder.

## Interview Perspective

**Common questions:**
- "What's a monorepo?" → Single repo containing many projects/services.
- "Why use one?" → Atomic cross-project changes, unified tooling, no dependency drift.
- "Costs?" → Specialized tooling required; large repo; build complexity.

**Senior-level:**
- Google's monorepo is the canonical case study. The tooling (Bazel, Piper, Code Search) is the enabler.
- The "monorepo vs polyrepo" debate is largely about org structure.
- "Monorepo with Git" is increasingly viable thanks to partial clone, sparse checkout (introduced for Windows source).

**Common mistakes:**
- Monorepo without tooling investment → unmanageable.
- Polyrepo at scale → dependency hell.

## Related Concepts

- [[CI-CD]] · [[Build Systems]] · [[Dependency Management]] · [[Trunk-Based Development]]

## Misconceptions

- **"Monorepo = one binary."** No — one repo, many independent services.
- **"Monorepo needs Google-scale tooling."** Small monorepos work with normal Git.
- **"Polyrepo is simpler."** Until you have to coordinate across them.

## Failure Scenarios

- **No build caching** → 10-min builds → no one runs CI.
- **No partial clone** → 50GB checkouts.
- **No access controls** → all engineers see all code (sometimes a feature, sometimes not).

## Practical Engineering Heuristics

- **For >5 services with shared code → consider monorepo.**
- **Invest in Bazel or similar.**
- **Sparse checkout for large repos.**
- **CI builds only affected projects.**
- **Document migration costs.**

## Active Recall Questions

What's a monorepo?::Single repository containing many projects/services. Used by Google, Facebook, Microsoft Windows.

Why use one?::Atomic cross-project changes, unified tooling, no dependency drift, cross-team visibility.

Specialized tooling?::Bazel/Buck (builds), code search (Sourcegraph), sparse checkout (Git extensions).

When is polyrepo better?::Small orgs, loosely coupled projects, need for independent versioning.

What enabled monorepos in Git?::Partial clone, sparse checkout (originally for Microsoft Windows).

Three monorepo examples?::Google, Facebook, Microsoft Windows, Twitter, Uber.

## Feynman Test

A startup grows to 10 engineers and 5 services. Argue monorepo vs polyrepo.

Why is Google's monorepo only manageable due to specialized tooling?

## Mastery Checklist

- **Explain** monorepos.
- **Compare** with polyrepos.
- **Derive** when monorepo is appropriate.
- **Critique** premature monorepo or polyrepo decisions.
- **Design** monorepo structure for a small org.

---
title: Deprecation
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Large-Scale Change]]", "[[Hyrum's Law]]", "[[Strangler Fig]]"]
sources:
  - SWE@Google Ch.15
tags: [software-engineering, deprecation, lifecycle]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Deprecation

## Executive Summary

**Deprecation** is the discipline of **safely retiring code, APIs, features, or systems**. Sounds trivial; turns out to be one of the hardest engineering problems at scale. Hyrum's Law: every observable behavior of your system will be depended on by somebody. Deprecation work is the systematic removal of those dependencies. SWE@Google argues: **deprecation is a feature**, not an afterthought. Plan for it from day one; budget for the work; commit to finishing.

## Why This Exists

Software accumulates. Old APIs persist; obsolete patterns linger; nobody removes anything. The codebase becomes unmaintainable. Deprecation pushes against this entropy: deliberate retirement, with migration paths, communication, and follow-through.

## Core Intuition

A library that keeps adding books but never removes any. After 50 years: chaos. Modern libraries deaccession deliberately. Software needs the same: scheduled, planned, completed retirements.

## Internal Mechanics

**Lifecycle:**
1. **Mark deprecated** — annotation, compile warning, runtime warning.
2. **Document migration** — what users should use instead.
3. **Communicate** — internal docs, release notes.
4. **Migrate users** — often the deprecator's job.
5. **Remove** — once usage is zero.

**Deprecation policies:**
- **Soft:** still works; warns. Hyrum's Law means users may ignore.
- **Hard:** breaks at some scheduled date.
- **Cascading:** as new things take over, old recedes.

**Common deprecation anti-patterns:**
- Deprecated forever (never removed).
- Removed before users migrated (breaks them).
- "Just delete it" — doesn't account for invisible users.

## Why Hard

- Hyrum's Law — every behavior depended on by someone.
- Internal users hidden — can't always survey.
- Migration cost on users — they have other priorities.
- "Just one more release" — perpetual deferral.

## Real Production Examples

- **Google deprecation infrastructure** — extensive tooling.
- **Java deprecation** — language has @Deprecated annotation.
- **Python 2 → 3 migration** — multi-year saga.
- **Browser API deprecation** — slow because of users in the wild.

## Design Tradeoffs

**Deprecating:**
- Cleaner codebase.
- Less to maintain.
- Focus on what matters.

**Costs:**
- Migration work.
- User communication.
- Time investment.

## Interview Perspective

**Common questions:**
- "What's deprecation?" → Safe retirement of code/APIs/features.
- "Why hard?" → Hidden users; migration cost; perpetual deferral.
- "Best practices?" → Mark, document, migrate, remove. Commit to finishing.

**Senior-level:**
- "Deprecation is a feature" — budget engineering time for it.
- The deprecating team often owns the migration of users.
- Hyrum's Law means even "compile warning" deprecations don't get acted on without push.

**Common mistakes:**
- "Deprecated for years" without removal.
- Breaking users with no migration path.
- Underestimating migration work.

## Related Concepts

- [[Large-Scale Change]] · [[Hyrum's Law]] · [[Strangler Fig]]

## Misconceptions

- **"Deprecated = removed."** Long gap typically.
- **"Users will migrate themselves."** Rarely; they have other priorities.

## Failure Scenarios

- **Deprecated forever** → cruft accumulates.
- **Removed too soon** → breaks users.
- **No communication** → surprise breakage.

## Practical Engineering Heuristics

- **Plan removal from day 1.**
- **Migrate users yourself** (don't expect them to do it).
- **Set hard deadlines** — soft warnings ignored.
- **Communicate widely** — release notes, emails, dashboards.

## Active Recall Questions

What's deprecation?::Safe retirement of code, APIs, features. Mark, migrate, remove.

Why is it hard?::Hyrum's Law — hidden users depend on details. Migration cost on users. Perpetual deferral.

Standard lifecycle?::Mark deprecated, document migration, communicate, migrate users, remove.

What's "soft" vs "hard" deprecation?::Soft: warns but still works. Hard: breaks at scheduled date.

Why is "we'll just delete it" usually wrong?::Hidden users will break. Need migration period and communication.

Whose job is migration?::Usually the deprecator's. Users won't prioritize someone else's cleanup.

## Feynman Test

You want to remove an old API. Walk through the deprecation process.

Why does "deprecated but never removed" become the default?

## Mastery Checklist

- **Explain** deprecation lifecycle.
- **Compare** soft and hard deprecation.
- **Derive** appropriate migration plan.
- **Critique** never-finished deprecations.
- **Design** a deprecation process with deadlines.

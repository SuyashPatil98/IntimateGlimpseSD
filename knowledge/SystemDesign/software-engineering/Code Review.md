---
title: Code Review
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[CI-CD]]", "[[Trunk-Based Development]]"]
sources:
  - SWE@Google Ch.9
tags: [software-engineering, code-review, practices]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Code Review

## Executive Summary

**Code review** is the practice of **another engineer reading and approving code before merge**. Catches bugs, spreads knowledge, enforces standards, mentors junior engineers, creates shared ownership. Modern norm at most companies; **mandatory at Google** (no commit without LGTM). Two distinct purposes often conflated: **correctness** (catch bugs, security issues) and **mentoring/learning**. Best when fast and constructive; worst when slow and gatekeeping.

## Why This Exists

Pre-modern: code shipped directly by author; bugs and bad design slipped in unchallenged. Code review: a second pair of eyes; bugs caught before prod; knowledge distributed. The cultural norm of "no merge without review" caught on through 2000s; now near-universal.

## Core Intuition

A surgical team's culture: two doctors verify before any irreversible action. Catches mistakes; trains residents; raises standards. Code review applies the same discipline to software.

## Internal Mechanics

**Process:**
1. Author writes code; sends PR/CR.
2. Reviewer reads; comments.
3. Author addresses comments.
4. Reviewer approves (LGTM).
5. Merge.

**At Google:**
- Every commit requires LGTM from a designated reviewer.
- Reviewer must have appropriate OWNERS / readability.
- Mandatory; tooling-enforced (Critique).

**What reviewers check:**
- **Correctness** — does it work?
- **Tests** — adequate?
- **Design** — appropriate approach?
- **Readability** — understandable?
- **Style** — conventions followed?

## Best Practices (from SWE@Google)

- **Small PRs.** < 200 lines reviews well; > 1000 doesn't.
- **Fast turnaround.** Within a day, ideally hours.
- **Constructive tone.** Suggest, don't dictate.
- **Approval based on "good enough"**, not perfection.
- **Author addresses or pushes back.** Discussion, not edict.

## Design Tradeoffs

**Benefits:**
- Catches bugs.
- Spreads knowledge.
- Mentorship.
- Higher quality.

**Costs:**
- Latency (waiting for review).
- Reviewer burden.
- Can become gatekeeping.

## Real Production Examples

- **Google** — every commit reviewed (Critique tool).
- **GitHub/GitLab PR flow** — standard for OSS.
- **Most engineering orgs.**

## Interview Perspective

**Common questions:**
- "What's code review for?" → Catch bugs, spread knowledge, mentor, enforce standards.
- "Best practices?" → Small PRs, fast turnaround, constructive tone.
- "Anti-patterns?" → Massive PRs, slow review, gatekeeping.

**Senior-level:**
- "LGTM" doesn't mean "perfect"; means "ship it."
- Author-driven review (author drives the discussion) often more productive than reviewer-driven.
- Hold standards consistently — not based on author.

**Common mistakes:**
- Huge PRs.
- Slow review (days).
- Nitpicking.
- Gatekeeping personality.

## Related Concepts

- [[CI-CD]] · [[Trunk-Based Development]]

## Misconceptions

- **"Review = perfection."** Good-enough, ship.
- **"Reviewer must approve everything."** Push back; discuss.
- **"Code review catches all bugs."** Catches some; not a substitute for tests.

## Failure Scenarios

- **Massive PR** → reviewer rubber-stamps.
- **Slow review** → developers context-switch.
- **Gatekeeping** → resentment.

## Practical Engineering Heuristics

- **Small PRs (< 200 lines).**
- **Review within hours.**
- **Constructive language.**
- **Push back when appropriate.**
- **Pair on hard reviews.**

## Active Recall Questions

What's code review for?::Catch bugs, spread knowledge, mentor, enforce standards. Pre-merge verification.

Why small PRs?::Reviewable in reasonable time. Large PRs get rubber-stamped or take days.

What does LGTM mean?::"Looks Good To Me." Approval; meaning "good enough to ship," not "perfect."

What's the typical fast turnaround?::Within hours, ideally; certainly < 1 day. Slow review blocks engineers.

What does Google require for every commit?::At least one LGTM from a designated reviewer (OWNERS).

Common anti-pattern?::Massive PRs, slow review, nitpicking, gatekeeping.

## Feynman Test

You're asked to review a 3000-line PR. What's the right response?

Why is "fast review" more important than "perfect review"?

## Mastery Checklist

- **Explain** code review purpose.
- **Compare** good and bad review patterns.
- **Derive** appropriate PR size and review time.
- **Critique** gatekeeping reviews.
- **Design** code review norms for a team.

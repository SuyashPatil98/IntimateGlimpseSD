---
title: Beyoncé Rule
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[CI-CD]]", "[[Testing Pyramid]]", "[[Large-Scale Change]]"]
sources:
  - SWE@Google
tags: [software-engineering, principles, testing]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Beyoncé Rule

## Executive Summary

The **Beyoncé Rule** (Google): *"If you liked it, then you shoulda put a ring on it."* In software: **if you don't want a behavior to change, write a test for it.** Anything not tested can and will change without notice. The corollary to [[Hyrum's Law]]: since all observable behavior gets depended on, but we can only commit to *tested* behavior, **the test suite IS the contract**. Memorable, useful, often cited.

## Why This Exists

Engineers complain when an "internal change" breaks them. Beyoncé Rule retorts: did you write a test? If not, the behavior wasn't part of the contract. You depended on undocumented behavior; that's at your own risk.

Aligns with [[Hyrum's Law]]: users will depend on observable behavior; the team's commitment is bounded by tests. If you want a behavior preserved, write a test. Now the team will preserve it (or the test will fail).

## Core Intuition

The Beyoncé song's chorus: relationship status requires explicit commitment. Software: contract status requires explicit test.

## In Practice

**Used in LSC discussions:**
- "Our LSC changed behavior X. Did anything break?"
- "Yes — we depended on it."
- "Was there a test?"
- "No."
- "Beyoncé Rule. Add a test going forward; we'll preserve it now and forward."

**Implications:**
- Tests are the contract.
- Untested = not promised.
- Adding regression tests to lock behavior is the cure.

## Design Tradeoffs

**Acknowledging:**
- Pro: clarifies team responsibilities.
- Con: pushes burden on users to write tests.

**Mitigation:**
- Comprehensive test suites.
- Easy regression testing.
- Don't require unrelated tests for unrelated changes.

## Real Production Examples

- **Google LSC discussions** — Beyoncé Rule frequently invoked.
- **Many engineering teams** adopt it informally.

## Interview Perspective

**Common questions:**
- "What's the Beyoncé Rule?" → If you don't want behavior to change, write a test.
- "Why?" → Untested = not part of contract. Tests are the commitment.
- "Relation to Hyrum's Law?" → Hyrum: users depend on observed. Beyoncé: team commits to tested.

**Senior-level:**
- The Beyoncé Rule is practical philosophy: bound the team's responsibility to what's testable.
- Without it, every observed behavior becomes a maintenance burden.
- Encourages test-writing culture.

**Common mistakes:**
- Citing Beyoncé Rule pedantically to reject reasonable requests.
- Using to dismiss user concerns when there's a clear bug.

## Related Concepts

- [[Hyrum's Law]] · [[CI-CD]] · [[Testing Pyramid]] · [[Large-Scale Change]]

## Misconceptions

- **"Untested behavior = OK to change."** Often true; not absolute. Common sense applies.
- **"Beyoncé Rule replaces communication."** It's a starting point.

## Failure Scenarios

- **No tests** + behavior change → users surprised.
- **Beyoncé Rule weaponized** → toxic.

## Practical Engineering Heuristics

- **Write regression tests for behavior you depend on.**
- **Encourage tests in PRs.**
- **Use Beyoncé Rule pragmatically.**

## Active Recall Questions

What's the Beyoncé Rule?::"If you liked it, then you shoulda put a ring on it." Software: if you don't want behavior to change, write a test.

Who coined it?::Google engineering culture (SWE@Google book).

Relation to Hyrum's Law?::Hyrum: users will depend on any observable behavior. Beyoncé: team commits only to tested behavior. Together: tests are the contract.

How does it appear in LSC discussions?::"Did you write a test?" If not, behavior wasn't promised. Add test going forward.

What does it encourage?::Test writing. The way to lock behavior is to test it.

Caveat?::Can be weaponized. Use pragmatically.

## Feynman Test

A team complains a change broke their code. Walk through how Beyoncé Rule applies.

Why is "the test suite is the contract" a pragmatic interpretation?

## Mastery Checklist

- **Explain** Beyoncé Rule.
- **Compare** with Hyrum's Law.
- **Derive** practical implications.
- **Critique** misuse of the rule.
- **Design** test culture using Beyoncé Rule pragmatically.

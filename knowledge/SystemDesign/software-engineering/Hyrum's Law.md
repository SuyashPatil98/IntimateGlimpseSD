---
title: Hyrum's Law
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Deprecation]]", "[[Large-Scale Change]]", "[[Beyoncé Rule]]"]
sources:
  - Hyrum Wright (Google)
  - SWE@Google
tags: [software-engineering, principles, hyrums-law]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Hyrum's Law

## Executive Summary

**Hyrum's Law** (Hyrum Wright, Google): *"With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody."* The cold reality of API design: **the implementation is the contract**. Anything users can observe — exact error messages, performance characteristics, race-condition behavior — becomes someone's dependency. Implications: deprecation is hard, changes break consumers, "private" details aren't really private.

## Why This Exists

API authors design contracts thinking users will respect them. At scale: someone, somewhere, depended on the exact bug. Now changing it breaks them. Hyrum named the phenomenon so we can reason about it.

## Core Intuition

A door that "only opens 95% of the time." Users adapt: they jiggle the handle, push harder, develop workarounds. Now you fix the bug — door opens 100%. Workarounds break: the jiggle now drops the lock; the push damages the frame. You "improved" the system; you broke users.

## The Law in Practice

**Observable behaviors that become contracts:**
- Exact error messages.
- Specific exception types.
- Performance characteristics (assumed timing).
- Race conditions.
- Default values.
- Iteration order of "unordered" collections (Python dict).
- Memory layouts.

**Examples:**
- Python dict insertion order became official because users depended on it.
- HashMap iteration order changes broke code.
- Removing a "useless" header broke parsing somewhere.

## Implications

**For API design:**
- Document what's promised.
- Hide everything else.
- Randomize "unordered" behavior to discourage dependence.
- Keep promises minimal.

**For deprecation:**
- Even "private" or "deprecated" features have users.
- Need to detect dependence (telemetry).
- Migration work, not just documentation.

## Real Production Examples

- **Python dict insertion order** — was incidental; became official.
- **Java HashMap** — iteration changes broke code.
- **Linux kernel ABI** — Linus famously protects user-space compatibility.
- **Browser quirks** — old behaviors preserved because sites depend.

## Design Tradeoffs

**Acknowledging Hyrum's Law:**
- Pro: realistic API evolution.
- Con: pessimistic; can't change anything.

**Mitigations:**
- **Randomize** non-essential behavior (Go's map iteration order).
- **Document** the contract precisely; hide everything else.
- **Telemetry** to detect dependence.
- **Strong typing** to limit what's observable.

## Interview Perspective

**Common questions:**
- "What's Hyrum's Law?" → All observable behaviors will be depended on by somebody.
- "Implications?" → API evolution is hard; deprecation requires migration.
- "Mitigations?" → Randomize non-essential behavior; document precisely; hide everything else.

**Senior-level:**
- Hyrum's Law is *the* fundamental constraint on API evolution at scale.
- Linus's "we don't break user-space" is Hyrum's Law internalized.
- Modern languages randomize default iteration orders to combat the Law.

**Common mistakes:**
- Believing "internal" means "safe to change."
- Removing "useless" features.
- Underestimating user dependence.

## Related Concepts

- [[Deprecation]] · [[Large-Scale Change]]

## Misconceptions

- **"Hyrum's Law is pessimistic."** Realistic, not pessimistic.
- **"Only at Google scale."** Applies everywhere; severity scales with users.

## Failure Scenarios

- **"Tiny" change breaks consumers.**
- **Removing private behavior** breaks code depending on it.
- **Performance improvements** breaking timing-dependent code.

## Practical Engineering Heuristics

- **Document promises explicitly.**
- **Randomize non-essential behavior.**
- **Telemetry for usage.**
- **Migrate users on changes.**
- **Assume everything is observed.**

## Active Recall Questions

What's Hyrum's Law?::With sufficient users, all observable behaviors of your system will be depended on by somebody.

Who coined it?::Hyrum Wright at Google.

Why does it matter?::API evolution is constrained by undocumented dependencies. Deprecation is hard.

Example?::Python dict insertion order, originally an implementation detail, became official because users depended on it.

How combat it?::Document precisely, hide everything else, randomize non-essential behavior, telemetry.

What's "we don't break user-space"?::Linus Torvalds's Linux kernel policy. Hyrum's Law internalized.

## Feynman Test

You "fix" a bug. Users break. Walk through Hyrum's Law explaining.

Why does Go's map iteration order randomize on each run?

## Mastery Checklist

- **Explain** Hyrum's Law.
- **Compare** documented vs observable contracts.
- **Derive** API change consequences.
- **Critique** "internal change won't affect anyone."
- **Design** APIs minimizing Hyrum's Law exposure.

---
title: Technical Debt
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Refactoring]]", "[[Code Smells]]", "[[Architecture Characteristics]]"]
sources:
  - Ward Cunningham (coined 1992)
  - SWE@Google, FoSA
tags: [software-engineering, debt, metaphor]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Technical Debt

## Executive Summary

**Technical debt** (Ward Cunningham, 1992) is the metaphor that **shipping suboptimal code now is like taking on debt — you pay interest until you fix it**. Useful framing: debt isn't inherently bad (sometimes you take loans to ship faster); unpaid interest compounds (bad code makes future changes harder); occasional bankruptcy (rewrites) is sometimes inevitable. Four categories (Fowler): **deliberate-prudent**, **deliberate-reckless**, **inadvertent-prudent**, **inadvertent-reckless**. Recognizing debt explicitly is the start; managing it is the discipline.

## Why This Exists

Engineers tolerate bad code because "we needed to ship." That's debt — implicit. Without naming it, it accumulates silently until the system can't move. The metaphor makes debt explicit: track it, discuss it, pay it down deliberately.

## Core Intuition

Financial debt: take a loan to do something now; pay interest until you repay. Sometimes wise (mortgage), sometimes foolish (credit card debt for luxury). Technical debt is similar: ship suboptimal code now; pay interest in future complications until fixed.

## Internal Mechanics

**Sources of debt:**
- **Time pressure** — ship before refactoring.
- **Knowledge gaps** — didn't know better at the time.
- **External changes** — requirements drift; old code obsolete.
- **Compounding** — one bit of debt makes adjacent code harder to write well.

**Fowler's quadrant:**
- **Deliberate-Prudent:** "Ship now; refactor after launch."
- **Deliberate-Reckless:** "We don't have time to do it right."
- **Inadvertent-Prudent:** "Now we know how it should have been."
- **Inadvertent-Reckless:** "What's layering?"

**Interest:**
- Bugs more likely.
- Features take longer.
- Onboarding harder.
- Risk grows.

## Design Tradeoffs

**Taking debt:**
- Ship faster now.
- Pay later.
- Sometimes correct (time-to-market).

**Not paying debt:**
- Interest compounds.
- Eventually bankruptcy (rewrite).

## Real Production Examples

- **Every codebase** — varying amounts.
- **Bankruptcy** — Netscape's rewrite (Joel Spolsky's "Things You Should Never Do").
- **Healthy orgs** — track debt explicitly; budget for paydown.

## Interview Perspective

**Common questions:**
- "What's technical debt?" → Shipping suboptimal code now; paying interest in future complications.
- "Always bad?" → No — sometimes deliberate-prudent.
- "How manage?" → Track explicitly; budget paydown; refactor continuously.

**Senior-level:**
- The "tech debt" conversation is sometimes a distraction from "we have bugs and bad design that need to be fixed."
- Cunningham's original metaphor was specifically about "first ship to learn, then refactor with that learning" — *not* "shipping garbage."
- Untracked debt is invisible; track explicitly.

**Common mistakes:**
- "We have technical debt" without specifics.
- Treating all suboptimality as debt.
- Endless paydown without feature work.
- Endless feature work without paydown.

## Related Concepts

- [[Refactoring]] · [[Code Smells]] · [[Architecture Characteristics]]

## Misconceptions

- **"Tech debt = bad code."** Cunningham's metaphor specifically: ship-now-learn-and-refactor.
- **"Debt is always wrong."** Sometimes the right business decision.
- **"Rewrite pays it all off."** Often introduces new debt while losing existing value.

## Failure Scenarios

- **Endless debt accumulation** → bankruptcy.
- **Endless paydown** → no features shipped.
- **Untracked debt** → invisible decline.

## Practical Engineering Heuristics

- **Track debt explicitly** — backlog items, README, ADRs.
- **Budget paydown** — 10-20% of capacity for non-feature work.
- **Refactor while in area** (Boy Scout Rule).
- **Big-bang rewrite as last resort.**

## Active Recall Questions

Who coined technical debt?::Ward Cunningham, 1992.

Cunningham's original meaning?::Ship-to-learn metaphor: first ship to learn what's needed, then refactor with that understanding. Not "ship garbage."

Fowler's debt quadrant?::Deliberate-Prudent, Deliberate-Reckless, Inadvertent-Prudent, Inadvertent-Reckless.

What's "interest" in tech debt?::Future cost: bugs more likely, features slower, onboarding harder, risk grows.

Why is "we have tech debt" insufficient?::Vague. Track specific items with owners and paydown plans.

When is taking debt prudent?::When time-to-market matters and you'll genuinely pay it down. Deliberate-prudent.

## Feynman Test

A team says "we have tech debt." How would you make this actionable?

Why are big-bang rewrites often a worse choice than continuous refactoring?

## Mastery Checklist

- **Explain** technical debt metaphor.
- **Compare** the four quadrants.
- **Derive** when debt is acceptable.
- **Critique** unmanaged debt.
- **Design** a debt-tracking and paydown process.

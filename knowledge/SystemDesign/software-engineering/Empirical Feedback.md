---
title: Empirical Feedback
area: software-engineering
status: mature
difficulty: beginner
prerequisites: []
related: ["[[First Principles of SE]]", "[[Iterative & Incremental]]", "[[Observability]]", "[[SLO]]"]
sources:
  - David Farley, "Modern Software Engineering"
tags: [software-engineering, feedback, empirical]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Empirical Feedback

## Executive Summary

**Empirical feedback** is the discipline of **measuring rather than guessing**. Engineering is applied science: form hypothesis, test, observe, learn. Software practices that embody this: **tests, monitoring, SLOs, A/B testing, error budgets, post-incident review**. Farley argues this is one of software engineering's two foundational disciplines (along with managing complexity). Without empirical feedback, we build on opinion; with it, we build on knowledge.

## Why This Exists

Engineering opinions are cheap. Without measurement, the loudest voice wins. With measurement, evidence wins. Empirical feedback is what makes engineering engineering rather than craft or art.

## Core Intuition

Doctors used to debate humor balance and bloodletting based on theory. Modern medicine: measure outcomes; adjust treatment based on data. Software the same: measure, don't argue.

## Internal Mechanics

**The empirical loop:**
1. **Hypothesis** — "This change will improve X."
2. **Experiment** — make the change.
3. **Measure** — observe the outcome.
4. **Learn** — was the hypothesis right?
5. **Adjust** — what next?

**Practices that embody:**
- **Tests** — feedback on correctness.
- **CI** — feedback on integration.
- **Production monitoring** — feedback on behavior.
- **SLOs** — feedback on reliability.
- **A/B tests** — feedback on user outcomes.
- **Postmortems** — feedback on incidents.

## Design Tradeoffs

**Benefits:**
- Evidence-based decisions.
- Faster learning.
- Less ego-driven debate.

**Costs:**
- Measurement infrastructure.
- Discipline to actually look at data.
- Sometimes data inconclusive.

## Real Production Examples

- **Google, Netflix, Amazon** — heavy A/B testing.
- **SLO + error budget cultures.**
- **Postmortem culture.**

## Interview Perspective

**Common questions:**
- "What's empirical feedback?" → Measure, don't guess. Engineering as applied science.
- "How embody?" → Tests, monitoring, SLOs, A/B, postmortems.
- "Vs opinion?" → Opinion → debate. Measurement → evidence-based decision.

**Senior-level:**
- Empirical feedback is what separates engineering from craft.
- Investment in measurement infrastructure pays back constantly.
- Cultures resistant to feedback (no postmortems, no A/B) are anti-engineering.

**Common mistakes:**
- "I think it'll be faster" without measuring.
- Ignoring data that contradicts intuition.
- Measurement theater (collect; never look).

## Related Concepts

- [[First Principles of SE]] · [[Iterative & Incremental]] · [[Observability]] · [[SLO]]

## Misconceptions

- **"Empirical = no design."** Design + measure → iterate.
- **"All decisions need data."** Sometimes intuition is fine; major calls need data.

## Failure Scenarios

- **Decisions on opinion** alone.
- **Data ignored** because uncomfortable.
- **Measurement theater** — collect; never act.

## Practical Engineering Heuristics

- **Hypothesize before changing.**
- **Measure outcome.**
- **Learn explicitly.**
- **Invest in infrastructure.**
- **Build review into culture.**

## Active Recall Questions

What's empirical feedback?::Measuring rather than guessing. Engineering as applied science.

The empirical loop?::Hypothesis → experiment → measure → learn → adjust.

Practices that embody?::Tests, CI, monitoring, SLOs, A/B testing, postmortems.

Why is this engineering, not craft?::Engineering uses evidence; craft uses opinion and tradition.

What's measurement theater?::Collecting data but never acting on it. Defeats the purpose.

## Feynman Test

A team debates "should we cache?" Apply empirical feedback to answer.

Why is "I think microservices will be faster" a non-engineering argument?

## Mastery Checklist

- **Explain** empirical feedback discipline.
- **Compare** with opinion-driven decisions.
- **Derive** appropriate measurement for decision.
- **Critique** opinion-driven engineering.
- **Design** culture of empirical feedback.

---
title: Error Budgets
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[SLO]]"]
related: ["[[SLO]]", "[[SLI]]", "[[Toil]]"]
sources:
  - SWE@Google, SRE book
tags: [reliability, sre, error-budgets]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Error Budgets

## Executive Summary

An **error budget** is the **allowed unreliability** — derived from [[SLO|SLOs]] as 1 - SLO. If SLO is 99.9%, budget is 0.1% of operations. When budget is **healthy**, teams can ship features freely; when **spent**, they freeze features and focus on reliability. The mechanism that turns reliability from a vague aspiration into an explicit budget engineers spend deliberately. Google SRE's signature concept.

## Why This Exists

Without error budgets, reliability vs feature velocity is an unstructured argument. SRE wants reliability; product wants features; managers pick whichever side is louder. Error budgets make it data-driven: budget healthy → ship features; budget exhausted → fix reliability. Decision automated.

## Core Intuition

A monthly grocery budget. When healthy, you eat well; when spent, you economize. No discussion needed — just check the budget. Error budgets do the same for reliability vs features.

## Internal Mechanics

**Computation:**
- SLO: 99.9% (target).
- Error budget: 0.1% of requests/time.
- Spend tracker: actual badness consumed.

**Example:**
- 100M requests/month.
- 99.9% SLO → 100,000 errors allowed.
- 60,000 errors so far → 40,000 remaining.
- Reliability is fine; ship features.

**Policy:**
- Budget healthy → normal velocity.
- Budget halfway gone → caution; review risky changes.
- Budget spent → freeze risky changes; focus on reliability.
- Budget overspent → incident; major focus on reliability.

## Design Tradeoffs

**Benefits:**
- Data-driven priority decisions.
- Aligns SRE and product.
- Self-regulating system.
- Forces investment when needed.

**Costs:**
- Requires SLO infrastructure.
- Policy must be respected (cultural).
- "Slow burn" (steady minor violations) tricky to detect.

## Burn Rate

Error budgets are consumed over time. **Burn rate** = how fast you're spending:
- 1× burn = budget lasts the full window.
- 10× burn = budget gone in 1/10th the window.

Alerts on high burn rate catch fast-burning incidents.

## Real Production Examples

- **Google** — invented and uses extensively.
- **Many mature SRE teams** — error budget policies enforce reliability.
- **Cloud providers' internal** — error budgets for their services.

## Interview Perspective

**Common questions:**
- "What's an error budget?" → 1 - SLO. Allowed unreliability over a window.
- "What happens when spent?" → Per policy, often freeze features and focus on reliability.
- "Burn rate?" → How fast budget is being consumed. High burn → alert.

**Senior-level:**
- Error budgets work only with leadership buy-in. Without it, "freeze features" gets overridden.
- The genius is alignment: SRE and product now share an incentive.
- Burn rate alerts beat threshold alerts — early warning.

**Common mistakes:**
- Error budgets without policy → no action.
- Policy not enforced → cultural failure.
- Not measuring burn rate.

## Related Concepts

- [[SLO]] · [[SLI]] · [[Toil]]

## Misconceptions

- **"Error budget = bug budget."** It's *any* unreliability — outages, slow responses, errors.
- **"Spent budget = failure."** It's an alert; trigger for action.
- **"Error budgets reduce reliability."** They right-size it.

## Failure Scenarios

- **Budget spent in first week** of window → freeze features.
- **Slow burn** silently degrades reliability.
- **Policy ignored by leadership** → useless mechanism.

## Practical Engineering Heuristics

- **Define error budget policy upfront.**
- **Alert on burn rate, not threshold.**
- **Make budget visible** — dashboards.
- **Enforce policy consistently.**

## Active Recall Questions

What's an error budget?::1 - SLO. Allowed unreliability over a measurement window.

What happens when budget is spent?::Per policy, typically freeze risky changes; focus on reliability fixes.

What's burn rate?::Speed at which error budget is being consumed. High burn → early-warning alert.

Why are error budgets useful?::Convert vague "reliability vs features" debate into data-driven decision.

What's required for error budgets to work?::Leadership buy-in on the policy; enforcement when budget spent.

Name the canonical source of error budgets.::Google SRE Book / SWE at Google.

## Feynman Test

A team has 99.9% SLO and used 80% of budget in week 1. What do they do?

Why does "error budget policy" require leadership buy-in to actually work?

## Mastery Checklist

- **Explain** error budgets and policies.
- **Compare** error budget mechanism with threshold-based alerting.
- **Derive** appropriate burn rate alerts.
- **Critique** organizations with SLOs but no error budget enforcement.
- **Design** an error budget policy for a service.

---
title: Toil
area: reliability
status: mature
difficulty: beginner
prerequisites: []
related: ["[[SLO]]", "[[Error Budgets]]", "[[Observability]]"]
sources:
  - SWE@Google, SRE book
tags: [reliability, sre, toil]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Toil

## Executive Summary

**Toil**, in SRE vocabulary, is **manual, repetitive, automatable, tactical work with no enduring value** — the kind of operational work that grows with service scale unless deliberately controlled. Google's SRE practice mandates **<50% of SRE time on toil**, the rest on engineering work that reduces future toil. Recognizing and eliminating toil is the central practice that distinguishes SRE from traditional ops.

## Why This Exists

Traditional operations grows linearly with service size — more services, more manual work. Eventually ops drowns. SRE asks: what work is automatable? That's toil; eliminate it. The remaining work (debugging, design, new tools) is engineering.

## Core Intuition

A factory worker doing the same task repeatedly all day. Automation could do it; it doesn't get better with practice; nothing accumulates. That's toil. Compare to a designer creating new processes — work that compounds.

## Internal Mechanics

**Toil characteristics:**
- **Manual** — humans do it.
- **Repetitive** — happens often.
- **Automatable** — could be scripted.
- **Tactical** — reactive, not strategic.
- **No enduring value** — done; nothing learned.
- **Scales linearly with service** — more services = more toil.

**Not toil:**
- Overhead (admin, meetings) — different category.
- Engineering (designing systems).
- Investigation of novel incidents.

**Toil examples:**
- Manual deployment.
- Manually scaling instances.
- Repeated incident response for known issues.
- Manual database backups.
- Updating configurations one by one.

## Toil Budget

Google SRE: **<50% of an SRE's time on toil**. If exceeded:
- Stop accepting new features (this service).
- Devote time to automating away toil.

## Design Tradeoffs

**Benefits of reducing toil:**
- More time for engineering.
- Services scale without proportional staff growth.
- Fewer human errors.

**Costs:**
- Automation takes effort upfront.
- Some toil is hard to automate.

## Real Production Examples

- **Google SRE** — coined and exemplifies toil management.
- **Many SRE teams** — track toil percentage as KPI.

## Interview Perspective

**Common questions:**
- "What's toil?" → Manual, repetitive, automatable, tactical work that grows with scale.
- "Toil budget?" → Google's <50% rule for SREs.
- "Why limit toil?" → Without limits, ops drowns as service grows.

**Senior-level:**
- Toil is not bad per se — small amounts inevitable. Unmanaged growth is the killer.
- Distinguish toil from useful operational work (incidents that teach, new investigations).
- Engineering work to reduce toil is the highest-leverage activity in SRE.

**Common mistakes:**
- "Doing more efficiently" instead of automating.
- Toil disguised as engineering (sysadmin work in a script).
- No measurement of toil percentage.

## Related Concepts

- [[SLO]] · [[Error Budgets]] · [[Observability]]

## Misconceptions

- **"Toil = bad work."** Some toil necessary; growth is the problem.
- **"Toil = manual work."** Specifically: manual + repetitive + automatable + no learning.
- **"All ops work is toil."** Investigation, design, novel work — not toil.

## Failure Scenarios

- **Toil grows unchecked** → SRE drowns.
- **Automation not built** because "no time" → vicious cycle.
- **Toil mislabeled as engineering** → false metric.

## Practical Engineering Heuristics

- **Measure toil percentage.**
- **Cap at 50% per SRE.**
- **Toil reduction is engineering work.**
- **Automate the next painful repetitive task.**
- **Distinguish toil from overhead.**

## Active Recall Questions

What's toil in SRE vocabulary?::Manual, repetitive, automatable, tactical work with no enduring value. Grows linearly with service scale.

Six characteristics of toil?::Manual, repetitive, automatable, tactical (reactive), no enduring value, scales with service.

What's Google's toil budget?::Less than 50% of SRE time on toil; rest on engineering.

What happens when toil exceeds budget?::Per policy, stop new features and devote time to automating away toil.

What's NOT toil?::Engineering work, investigation of novel incidents, design, overhead.

Why is toil dangerous?::Grows linearly with service; without controls, ops drowns as scale grows.

## Feynman Test

Identify toil vs not-toil in a typical SRE week: deploy 5 services, debug new outage, write a new monitoring tool, respond to known alerts.

Why does "do toil more efficiently" miss the point compared to "automate it away"?

## Mastery Checklist

- **Explain** toil and its characteristics.
- **Compare** toil with engineering and overhead.
- **Derive** which work is toil in a given role.
- **Critique** teams without toil budgets.
- **Design** toil-reduction program for a service.

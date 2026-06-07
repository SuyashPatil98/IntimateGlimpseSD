---
title: SLO
aliases: [Service Level Objective]
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[SLI]]", "[[SLA]]", "[[Error Budgets]]", "[[Observability]]", "[[Availability Math]]"]
builds_toward: ["[[Error Budgets]]"]
sources:
  - SWE@Google, SRE book
  - system-design-primer
tags: [reliability, sre, slo, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# SLO (Service Level Objective)

## Executive Summary

A **Service Level Objective (SLO)** is a **target value or range for a service's reliability** — the explicit promise an engineering team makes about how reliable their service will be. Expressed in terms of [[SLI|Service Level Indicators]]: "99.9% of requests succeed", "p99 latency < 200ms over rolling 30 days". SLOs are the *internal* commitment (vs [[SLA|SLAs]] which are external/legal). The foundation of modern SRE practice: SLOs drive engineering priorities, error budgets, and incident response.

## Why This Exists

Without explicit reliability targets, "reliable enough" is a gut feeling that varies by person and mood. Teams over-engineer some services (perfectionism) and under-engineer others (neglect). SLOs make the target precise: now everyone knows what reliable means; engineering effort can be calibrated; trade-offs are explicit.

## Core Intuition

A pizza shop promises "30-minute delivery 95% of the time." Not 100% — that would require unrealistic over-provisioning. 95% is the SLO. The shop sizes its fleet, kitchen, processes to meet 95%. If delivery hits 99%, maybe they over-invested; if 90%, they're failing the promise.

## Internal Mechanics

**Structure:**
- SLI: measurable signal (e.g., success rate).
- SLO: target (e.g., 99.9%).
- Window: time period (e.g., rolling 30 days).

**Example:** "99.9% of HTTP requests return 2xx or 3xx in any rolling 30-day window."

**Common SLOs:**
- Availability: 99.9%, 99.95%, 99.99%.
- Latency: p99 < N ms.
- Error rate: < 0.1%.
- Freshness: 95% of data < 5min stale.

**Computing achievement:**
- Measure SLI continuously.
- Compute success / failure over window.
- Track [[Error Budgets]] (1 - SLO = budget for badness).

## Design Tradeoffs

**Benefits:**
- Explicit target.
- Engineering prioritization.
- Conflict resolution between teams.
- Sane incident response.

**Costs:**
- Measurement overhead.
- Wrong SLOs misalign incentives.
- Too-strict SLOs constrain feature work.

## SLO Math

**Availability nines:**
- 99% → 3.65 days/year downtime.
- 99.9% → 8.77 hours/year.
- 99.95% → 4.38 hours/year.
- 99.99% → 52.6 min/year.
- 99.999% → 5.26 min/year.

Each "nine" costs roughly 10× more. **Don't set 99.999% unless you must.**

## Real Production Examples

- **Google Search** — sub-second latency SLOs.
- **AWS S3** — 99.9% durability and availability advertised.
- **GitHub** — explicit SLOs published.

## Interview Perspective

**Common questions:**
- "SLO vs SLA?" → SLO: internal target. SLA: external contractual.
- "How pick SLO?" → Start with customer happiness threshold; reverse-engineer the number.
- "What's an error budget?" → 1 - SLO. Allowed badness; once spent, freeze new features and fix reliability.

**Senior-level:**
- Setting SLO too high creates over-engineering and feature stagnation.
- SLO should be the user-noticeable threshold, not a wishlist.
- Different services need different SLOs — payment ≠ analytics.

**Common mistakes:**
- 100% SLO (impossible target).
- SLO not tied to user experience.
- SLO without measurement infrastructure.

## Related Concepts

- [[SLI]] · [[SLA]] · [[Error Budgets]] · [[Observability]]

## Misconceptions

- **"Higher SLO = better."** Diminishing returns; high cost.
- **"SLO = SLA."** Different audiences.
- **"100% is achievable."** Never; networks fail.

## Failure Scenarios

- **SLO too strict** → constant violations, alarm fatigue.
- **SLO too loose** → bad UX masked.
- **SLO without budget** → no triggered action.

## Practical Engineering Heuristics

- **Choose SLO based on user pain threshold.**
- **Start conservative; tighten if measurement allows.**
- **Three-nines (99.9%) is common reasonable target.**
- **Make SLO part of every service's contract.**

## Active Recall Questions

What's an SLO?::Service Level Objective. Explicit target for service reliability, expressed via SLIs (e.g., 99.9% success).

SLO vs SLA?::SLO: internal engineering target. SLA: external contractual commitment with penalties.

How many hours/year is 99.9% availability?::~8.77 hours.

Why not set 100% SLO?::Impossible (networks, hardware fail). And cost grows roughly 10× per nine.

What's an Error Budget?::1 - SLO. Allowed unreliability. Spent budget → freeze features, fix reliability.

How pick an SLO?::Based on user pain threshold — point where users notice and care.

## Feynman Test

A payment service must be reliable. Pick an SLO. Defend.

Why does 99.99% cost roughly 10× more than 99.9%?

## Mastery Checklist

- **Explain** SLOs and their role.
- **Compare** SLO and SLA.
- **Derive** appropriate SLO for given service.
- **Critique** 100% SLO ambitions.
- **Design** an SLO framework for a service.

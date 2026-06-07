---
title: A/B Testing for ML
aliases: ["A/B Testing for ML"]
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Model Serving]]", "[[Canary Releases]]"]
related: ["[[Model Monitoring]]", "[[MLOps]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - SDI vol 2 (ML chapters)
  - Kohavi, Tang, Xu "Trustworthy Online Controlled Experiments" (2020)
  - Microsoft ExP, Google's experimentation platform writeups
  - Chip Huyen "Designing ML Systems" (2022)
tags: [ml-systems, experimentation, mlops]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# A/B Testing for ML

## Executive Summary

**A/B testing for ML** is an online controlled experiment where users are randomized between a control (current model) and a treatment (candidate model); the treatment is judged on user-facing metrics, not offline accuracy. ML-specific issues: long-running experiments due to noisy metrics, interaction effects (other experiments), feedback loops, novelty/primacy effects, and validating that offline gains translate online.

## Why This Exists

Offline accuracy improvements often **don't ship**. A model that scores +2% AUC on the holdout might not move CTR — or might move it negatively due to overfitting, biased holdout, or feedback effects. The only ground truth is randomized exposure of real users.

## Core Intuition

Same idea as web A/B testing, with extra hazards:
1. **Power**: ML metric movements are small (+0.5% CTR is huge); need lots of traffic for statistical power.
2. **Time**: novelty effect (new model triggers exploration) wears off in days; primacy (users learn new behavior) takes weeks.
3. **Interactions**: another team's ranking experiment changes what your model sees.
4. **Feedback loop**: model A shows different content → users see different things → labels collected differ → A/B comparison contaminated.

## Internal Mechanics

**Experiment design:**
- **Randomization unit** — user, session, request (must match the unit the model decision applies to; cluster effects if sessions correlated).
- **Variants** — control + N treatments.
- **Allocation** — start small (1%), ramp to 50/50 when safe.
- **Duration** — minimum until power threshold reached (typically 1–4 weeks).

**Metrics:**
- **OEC** (Overall Evaluation Criterion) — single decision metric (e.g., revenue per session).
- **Guardrail metrics** — never-regress invariants (latency, error rate, complaints).
- **Diagnostic metrics** — explain *why* (clicks-per-session, dwell time).

**Analysis:**
- Two-sample test (t-test, CUPED variance reduction) per metric.
- Multiple testing correction (Bonferroni / FDR).
- **CUPED** (Controlled-experiment Using Pre-Experiment Data) reduces variance by 30–60%, halving required sample size.

**Shadow/interleaving alternatives:**
- **Shadow traffic** — treatment receives requests but its output discarded; compare offline. No user-facing risk but no user-feedback signal.
- **Interleaving** — for ranking, mix items from both models in one results list; user clicks pick winner; far more sensitive than A/B (10–100× sample efficiency).

## Design Tradeoffs

**A/B vs interleaving:** A/B measures real outcomes but slow; interleaving fast but only relative ranking, no absolute movement.

**Short vs long experiments:** short = novelty effects dominate; long = high opportunity cost if treatment is bad.

**Multiple concurrent experiments:** parallelism is great until interactions inflate variance or bias estimates.

## Real Production Examples

- **Google** — runs tens of thousands of concurrent experiments; "overlapping experiment infrastructure" paper (2010).
- **Microsoft Bing** — pioneered ML interleaving for search ranking.
- **Netflix** — combination of A/B + offline metrics; thumbnail and recommendation experiments.
- **Meta, LinkedIn, Booking.com, Airbnb** — internal experimentation platforms; Booking famously runs 1000+ experiments concurrently.
- **Spotify** — Discover Weekly and recommendation experiments.

## Misconceptions

- **"Offline AUC gain = ship it."** Often false; online tests overturn ~50% of offline-positive results.
- **"50/50 is always optimal."** Asymmetric splits reduce risk (1% candidate) during ramp; symmetric improves power once safe.
- **"Statistical significance is enough."** Effect size, business impact, and guardrails matter equally.

## Failure Scenarios

- **Sample ratio mismatch (SRM)** — traffic split deviates from intended; data poisoned. Mitigation: SRM check on day 1.
- **Network/exposure effects** — treatment "leaks" into control (shared resources, peer effects).
- **Simpson's paradox** — overall metric moves opposite to per-segment metrics due to mix shifts.
- **Peeking** — stopping early when significant inflates false-positive rate.
- **Novelty effect** — early effect overstates long-term; experiment ended too soon.

## Interview Perspective

- *"How do you validate a model that beat offline benchmarks?"* → online A/B with traffic ramp, OEC + guardrails, run for at least a power-adequate window.
- *"Why might offline gains not translate?"* → holdout bias, distribution shift in prod, feedback loops, latency degradation, side effects.
- *"What's interleaving and when do you prefer it?"* → mix items from both rankers in one list; sample-efficient for ranking but not for non-list models.
- *"What is CUPED?"* → variance reduction using pre-experiment covariates; cuts required sample size meaningfully.
- Staff-level: SRM detection, multi-armed bandit alternatives, sequential testing, and experiment governance at scale.

## Related Concepts

- [[Canary Releases]] — the deployment mechanism A/B sits on top of.
- [[Model Monitoring]] — provides metrics for experiment evaluation.
- [[Model Serving]] — must support traffic-splitting per request.
- [[Model Registry]] — candidate model versions referenced in experiments.
- [[MLOps]] — experimentation is one MLOps pillar.

## Practical Engineering Heuristics

- **Define OEC + guardrails before launching.**
- **Check SRM** day 1 — most common silent corruption.
- **Use CUPED** when pre-experiment data exists.
- **Don't peek** — pre-register analysis or use sequential methods.
- **Ramp traffic** asymmetrically (1% → 10% → 50%) during risk window.
- **Track guardrail metrics continuously**; auto-rollback on regression.
- **Prefer interleaving for ranking** when applicable; A/B for non-ranker changes.
- **Wait out novelty effects** — at least one week.

## Active Recall Questions

Why is offline accuracy improvement insufficient before shipping a new model?::Offline gains often fail to translate online due to holdout bias, distribution shift, feedback loops, latency, and user-behavior effects.

What is the OEC in an experiment?::Overall Evaluation Criterion — the single decision metric (e.g., revenue per session); other metrics are diagnostic or guardrails.

What is CUPED and what does it do?::Controlled-experiment Using Pre-Experiment Data — variance reduction technique using pre-experiment covariates; cuts required sample size 30–60%.

What is interleaving and when is it superior to A/B?::Mixing items from two rankers in a single result list; user clicks indicate preference. Far more sample-efficient than A/B for ranking changes, but only applicable to list-based outputs.

What is Sample Ratio Mismatch (SRM)?::Actual traffic split deviates from intended (e.g., 49.5/50.5 instead of 50/50); signals data corruption; invalidates the experiment.

Why is the novelty effect dangerous in short ML experiments?::Users explore new behavior when they notice change; the early effect doesn't reflect steady-state behavior. Ending experiments too soon overstates impact.

Name two guardrail metrics commonly tracked alongside the OEC.::Latency / p99, error rate, user complaints, support tickets, retention, opt-outs.

## Feynman Test

A PM is confused: "We tested model B offline and it has +3% AUC; why does the A/B test on it show -0.2% revenue?" Walk them through the four most likely explanations.

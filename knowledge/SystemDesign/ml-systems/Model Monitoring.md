---
title: Model Monitoring
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Model Serving]]", "[[Observability]]"]
related: ["[[Data Drift]]", "[[Concept Drift]]", "[[A-B Testing for ML]]", "[[MLOps]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - SDI vol 2 (ML chapters)
  - Data Engineering Cookbook (Kretz)
  - Chip Huyen "Designing ML Systems" (2022) Ch.8
  - Evidently / WhyLabs docs
  - Google "Hidden Technical Debt in ML Systems" (Sculley et al., 2015)
tags: [ml-systems, monitoring, mlops]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Model Monitoring

## Executive Summary

**Model monitoring** is the practice of detecting silent regressions in production ML systems: service health (latency, errors), data quality (input feature health), prediction quality (output distribution), and *eventually* ground-truth accuracy. Unlike conventional services, ML systems can be fully "up" while quietly producing worse predictions; monitoring is what makes that detectable.

## Why This Exists

Unique to ML: the model has no errors, but its accuracy decays. Causes — input distribution shifts ([[Data Drift]]), label distribution shifts ([[Concept Drift]]), feature pipeline bugs, data source schema changes, upstream model changes. Conventional monitoring (CPU/latency/errors) misses all of these.

## Core Intuition

Four layers of monitoring, ordered by detection latency:

| Layer | What it watches | Signal latency |
|---|---|---|
| **Operational** | Latency, error rate, throughput | seconds |
| **Data** | Input feature distributions (drift, missing, range) | minutes–hours |
| **Prediction** | Output distribution (e.g., predicted class proportions) | minutes–hours |
| **Outcome** | Accuracy vs ground-truth labels | hours–weeks (labels arrive late) |

Layers 2-3 are early-warning; layer 4 is the truth but lags. Production monitoring must use all four.

## Internal Mechanics

**Data drift detection:**
- Per-feature: compare current distribution to training reference (KS test, PSI, KL divergence, Jensen-Shannon).
- Detect: missing rate spike, range violations, categorical-set drift, mean/variance shift.
- Threshold + alert.

**Prediction monitoring:**
- Distribution of outputs (class probabilities, regression mean).
- Correlation with features (e.g., feature importance stability).

**Outcome / accuracy:**
- Requires labels — often delayed (fraud confirmed days later) or partial (only labeled refunds).
- Use **delayed labels** — match predictions to outcomes via a join window.
- Use **proxy metrics** when labels are too slow (CTR for ranking).

**Slice monitoring:** aggregate metrics hide per-cohort regressions; monitor key slices (geo, device, segment).

**Alerting strategy:** alert on **rate-of-change**, not absolutes — a 5% feature missing rate is fine if it's been stable; sudden jump to 5% is an incident.

## Architecture Diagrams

```
prediction ──┬──► outcome (later)
             │     │
             ▼     ▼
        ┌─────────────┐
        │  Monitor    │── service metrics ──► dashboards / alerts
        │  pipeline   │── data drift    ────►
        │             │── prediction dist ──►
        │             │── slice metrics ────►
        │             │── outcome accuracy ─►
        └─────────────┘
              ▲
              │
        reference (training) distribution
```

## Design Tradeoffs

**Batch vs streaming monitoring:** batch (daily aggregations) is cheap but slow; streaming catches issues fast but is expensive and noisy.

**Alert sensitivity:** loose thresholds miss issues; tight thresholds cause alert fatigue.

**Reference window:** training-time reference is stable but rapidly stale; rolling-window references mask gradual drift.

**Cost:** logging every prediction + features is bandwidth and storage; sample at >1% for high-QPS systems.

## Real Production Examples

- **Uber Michelangelo Monitoring** — built-in drift + outcome tracking.
- **Meta** — model + feature monitoring across ranking systems.
- **Stripe Radar** — fraud monitoring with delayed labels (chargebacks).
- **Open-source / commercial**: Evidently, WhyLabs, Arize, Fiddler, Aporia, Monte Carlo (data-focused).

## Misconceptions

- **"Monitoring = accuracy."** Accuracy comes late; drift and data quality come early — and prevent more damage if caught.
- **"P50 latency is the model SLI."** That's service health; model SLI is prediction quality vs reference.
- **"One overall metric is enough."** Aggregate hides per-slice regressions; cohort analysis is mandatory.

## Failure Scenarios

- **Feature pipeline bug → distribution shift → silent accuracy drop.** Mitigation: feature monitoring.
- **Upstream model change** (e.g., embedding service v2) shifts inputs to your model. Mitigation: track upstream version pins.
- **Concept drift over months** — model gradually outdated. Mitigation: drift-triggered retraining.
- **Ground truth never arrives** for new segments — model untestable on them.
- **Alert fatigue from drift on rare features.** Mitigation: tier features; only alert on top-N important.

## Interview Perspective

- *"How do you know your model is still good in prod?"* → four-layer monitoring (operational, data, prediction, outcome) with slice analysis.
- *"What's a leading vs lagging indicator in ML monitoring?"* → leading: feature/output drift; lagging: ground-truth accuracy.
- *"How do you set drift thresholds?"* → from training-time variation; PSI > 0.25 commonly "shift", > 0.5 "major shift" rules of thumb.
- Staff-level: discuss closed-loop retraining triggered by monitoring; feedback-loop pathologies (model influences future data).

## Related Concepts

- [[Data Drift]] — leading indicator class 1 (input shifts).
- [[Concept Drift]] — leading indicator class 2 (input→label relationship shifts).
- [[A-B Testing for ML]] — online evaluation paired with monitoring.
- [[Observability]] — applies same metrics/logs/traces frame to ML.
- [[Model Serving]] — the system being monitored.
- [[MLOps]] — encompasses monitoring.

## Practical Engineering Heuristics

- **Log inputs + predictions** (sampled) — irreplaceable for postmortem and retraining.
- **Reference distribution** = training set; refresh when retraining.
- **Tier features** by importance; alert only on critical drift.
- **Track slice metrics**; aggregate hides regressions.
- **Match predictions to outcomes** via stable IDs for delayed accuracy tracking.
- **Practice incident response** — what does the on-call do when a drift alert fires?

## Active Recall Questions

What are the four layers of model monitoring?::Operational (latency/errors), data (feature distributions), prediction (output distributions), outcome (accuracy vs ground truth).

Why is operational monitoring alone insufficient for ML systems?::Models can be fully "up" — no errors, normal latency — while silently producing degraded predictions due to drift or pipeline issues.

What is PSI and how is it used?::Population Stability Index — a drift metric comparing current vs reference distributions; common thresholds: <0.1 stable, 0.1–0.25 moderate shift, >0.25 significant shift.

Why are accuracy metrics a *lagging* indicator?::Ground-truth labels often arrive late (days/weeks) or partially; by the time accuracy drops, damage is done.

Name two leading indicators of model degradation.::Feature distribution drift (PSI/KS/KL), prediction distribution shifts, feature missing-rate spikes, upstream model version changes.

What is slice monitoring and why is it required?::Per-cohort metric tracking (geo, device, segment); aggregate metrics hide cohort-specific regressions.

What's the trade-off between training-time vs rolling-window reference distributions?::Training reference is stable and detects all drift but quickly stales; rolling-window adapts but masks gradual real drift.

## Feynman Test

Explain to an SRE why "all green dashboards" doesn't mean an ML system is healthy — and what specifically they should add to their alerting.

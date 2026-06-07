---
title: Data Drift
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Model Monitoring]]"]
related: ["[[Concept Drift]]", "[[Training Pipelines]]", "[[Data Quality]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - Chip Huyen "Designing ML Systems" (2022) Ch.8
  - SDI vol 2 (ML chapters)
  - Data Engineering Cookbook (Kretz)
  - Evidently AI docs — "Drift detection methods"
tags: [ml-systems, drift, monitoring]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Data Drift

## Executive Summary

**Data drift** (a.k.a. **covariate shift**, **feature drift**) is the change in the *input* distribution $P(X)$ between training time and production. Even if the input-output relationship $P(Y|X)$ is unchanged, a model trained on stale inputs makes worse predictions because it sees regions of feature space it wasn't optimized for. Distinct from [[Concept Drift]], which shifts $P(Y|X)$.

## Why This Exists

The world changes. User behavior shifts post-launch of a new product. Seasonality shifts categorical distributions. An upstream pipeline starts emitting a feature in different units. None of these touch the model itself — they shift its inputs. Detecting and responding is the goal.

## Core Intuition

Imagine a fraud model trained on 2024 transactions. In 2026, payment methods have shifted (more BNPL, more crypto). The *meaning* of fraud may be unchanged, but the model never saw these inputs heavily — its predictions on them are less reliable.

## Formal Definition

Let $P_{\text{train}}(X)$ be the training input distribution, $P_{\text{prod}}(X)$ the production input distribution. **Data drift** occurs when $P_{\text{prod}}(X) \neq P_{\text{train}}(X)$, even if $P(Y|X)$ is unchanged. Special cases:
- **Covariate shift** — same $P(Y|X)$, different $P(X)$.
- **Prior probability shift** — $P(Y)$ changes (e.g., fraud rate doubles).
- **Sample selection bias** — training set unrepresentative of production.

## Internal Mechanics

**Detection methods (univariate, per feature):**
- **Kolmogorov-Smirnov (KS) test** — nonparametric, compares CDFs; small p-value = drift.
- **Population Stability Index (PSI)** — $\text{PSI} = \sum_i (p_i^{\text{prod}} - p_i^{\text{train}}) \ln(p_i^{\text{prod}} / p_i^{\text{train}})$ over bins. Rule of thumb: <0.1 stable, 0.1–0.25 moderate, >0.25 significant.
- **Jensen-Shannon (JS) divergence** — bounded [0,1] symmetric variant of KL.
- **Chi-square** — categorical features.

**Multivariate / model-based:**
- **Domain classifier** — train a classifier to distinguish train vs prod samples; high AUC implies the two distributions differ.
- **Embedding-space drift** — for image/text, monitor distance between distributions in embedding space (MMD, Wasserstein).

**Reference & windows:**
- Reference = training distribution (or a chosen baseline period).
- Detection window = recent N hours of production.

## Design Tradeoffs

**Sensitivity:** tight thresholds catch everything but cause alert fatigue; loose thresholds miss real shifts.

**Univariate misses interactions:** each feature can be individually stable while their joint shifts (e.g., user_age × device_type combinations change).

**Reference staleness:** static reference becomes irrelevant as the world genuinely changes; rolling reference can normalize away real drift.

**Costs:** computing distance metrics across hundreds of features is expensive; tier by feature importance.

## Real Production Examples

- **E-commerce** — seasonality (Black Friday) shifts most features; expected, not actionable.
- **Fraud** — adversarial drift (attackers adapt); critical to retrain.
- **Recommendations** — new content categories appear; feature space expands.
- **Geolocation models** — new app launches in new regions shift `country_code` distribution.

## Misconceptions

- **"Data drift = concept drift."** No — data drift is input-only ($P(X)$); concept drift is the input→label mapping ($P(Y|X)$).
- **"Drift implies model degradation."** Not always — if drifted inputs are still in regions the model handles well, accuracy may be stable.
- **"Statistical significance = drift importance."** Large samples flag tiny shifts as significant; effect size matters more.

## Failure Scenarios

- **Schema change masquerading as drift** — upstream renames a category; PSI fires; root cause is data pipeline, not "the world changing."
- **Adversarial drift** — fraudsters mutate; drift signal lags damage.
- **Drift on unimportant features** — alert fires; ignored; later drift on important features ignored too (fatigue).
- **Rolling reference normalizes a slow shift** — drift never detected because reference moves with prod.

## Interview Perspective

- *"How would you detect feature drift?"* → univariate (KS/PSI) per feature, multivariate domain classifier, tracked over time vs training reference.
- *"PSI = 0.3 on `device_os` — what do you do?"* → check root cause (pipeline bug? real shift?), assess accuracy impact, schedule retrain if real.
- *"How is drift different from concept drift?"* → drift = input distribution; concept drift = input-label relationship.
- Mistake: alerting on any drift; not separating "drift" from "drift that matters."

## Related Concepts

- [[Concept Drift]] — the dual: $P(Y|X)$ shifts.
- [[Model Monitoring]] — drift detection is a primary monitor.
- [[Training Pipelines]] — drift triggers retraining.
- [[Data Quality]] — schema/range violations often mistaken for drift.
- [[Feature Stores]] — natural place to compute & log distributions.

## Practical Engineering Heuristics

- **Tier features by importance**; only alert on top-N drifting features.
- **Distinguish data quality (broken pipeline) from real drift** before paging.
- **Track effect size**, not just p-value.
- **Pair drift detection with outcome metrics**; drift without accuracy impact may not warrant action.
- **Snapshot training distribution** in the registry; reference it explicitly.
- **Use embedding drift** for unstructured inputs (text, images).

## Active Recall Questions

What is data drift?::A change in the input distribution P(X) between training and production, while P(Y|X) may be unchanged.

How is data drift different from concept drift?::Data drift = input distribution changes; concept drift = input-to-label relationship changes.

Name two univariate drift detection methods.::Kolmogorov-Smirnov test, PSI (Population Stability Index), Jensen-Shannon divergence, Chi-square (for categorical).

What is the PSI formula and its rough thresholds?::PSI = sum over bins of (p_prod - p_train) * ln(p_prod / p_train); <0.1 stable, 0.1–0.25 moderate shift, >0.25 significant.

What is a domain classifier for drift detection?::A binary classifier trained to distinguish train vs prod samples — high AUC means the distributions differ; captures multivariate shifts univariate tests miss.

Why doesn't statistical significance alone tell you to act on drift?::Large samples flag trivial shifts; effect size and predicted accuracy impact matter more than p-values.

Give an example of drift that is *not* a problem for the model.::A categorical distribution shifts but the model is robust on the new bins; accuracy unchanged.

## Feynman Test

Convince your manager that "PSI fired on feature_42" is not by itself a reason to retrain — what additional questions do you need to answer before action?

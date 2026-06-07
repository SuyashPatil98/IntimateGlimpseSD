---
title: MLOps
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Training Pipelines]]", "[[Model Serving]]", "[[Model Monitoring]]"]
related: ["[[Feature Stores]]", "[[Model Registry]]", "[[A-B Testing for ML]]", "[[CI-CD]]"]
builds_toward: []
sources:
  - Google "MLOps: Continuous delivery and automation pipelines in ML" (whitepaper)
  - Chip Huyen "Designing ML Systems" (2022)
  - Data Engineering Cookbook (Kretz)
  - Sculley et al. "Hidden Technical Debt in ML Systems" (NeurIPS 2015)
tags: [ml-systems, mlops]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# MLOps

## Executive Summary

**MLOps** is the discipline of operating ML systems in production — the practices, tooling, and organizational structures that take a model from research notebook to a reliably evolving production service. It's DevOps for systems whose behavior depends on data as well as code, where retraining, versioning, evaluation, and monitoring loops are first-class.

## Why This Exists

Sculley et al. (2015) showed that ML code is a tiny sliver of a production ML system; most is data validation, configuration, monitoring, serving infrastructure, and "glue code". Treating ML like ordinary software fails because: data is a co-equal input; models silently degrade; reproducibility is multi-dimensional; experiments are first-class; release cadence is data-driven not just code-driven.

## Core Intuition

MLOps = DevOps + Data + Models.

| DevOps concept | MLOps extension |
|---|---|
| Code versioning | + Data, features, model versioning |
| CI | + Data validation, model training tests |
| CD | + Model deployment, traffic splitting |
| Monitoring | + Data drift, prediction drift, accuracy |
| Rollback | + Model rollback via alias |
| Reproducibility | + Snapshot data + config + seed |

## Internal Mechanics — The MLOps Loop

```
data ──► training pipeline ──► model registry ──► serving ──► monitoring
  ▲             │                                   │           │
  │             └── eval / validate                 │           │
  │                                                 ▼           ▼
  └─────────────── retrain trigger ◄────── A/B + drift signals
```

**Maturity levels (Google):**
- **Level 0 — Manual**: Notebook to prod; no automation. Most orgs start here.
- **Level 1 — ML pipeline automation**: Training pipeline orchestrated; auto-retrain on schedule/trigger; CI/CD for the pipeline code.
- **Level 2 — CI/CD automation**: Full automation including pipeline-of-pipelines, A/B testing infrastructure, automated rollouts.

## Pillars

1. **Versioning** — code (git), data (DVC, lakeFS, snapshot IDs), features (feature store), models (registry).
2. **Pipelines** — training and inference both orchestrated, reproducible.
3. **Registry & catalog** — discoverable models with lineage.
4. **Serving** — managed, multi-version, traffic-split-capable.
5. **Monitoring** — operational, data, prediction, outcome.
6. **Experimentation** — A/B / shadow / interleaving infrastructure.
7. **Governance** — access control, audit, fairness, compliance, model cards.

## Design Tradeoffs

**Build vs buy:** in-house platform (Michelangelo, FBLearner) gives control; commercial (SageMaker, Vertex AI, Databricks ML) accelerates but locks in.

**Centralized platform vs federated tooling:** central platform amortizes complexity; per-team flexibility suffers.

**Investment vs ROI:** MLOps is significant upfront cost; payoff requires multiple models in production. Single-model orgs often shouldn't bother with full stack.

## Real Production Examples

- **Uber Michelangelo** (2017) — first end-to-end MLOps platform publicly described.
- **Meta FBLearner Flow** — pipeline-as-a-service.
- **Google TFX + Vertex AI** — open-source + cloud.
- **Netflix Metaflow** — researcher-friendly pipelines.
- **Airbnb Bighead** — notebook-integrated platform.
- **Booking.com, Spotify, LinkedIn, Stripe** — variants on the same pattern.

## Misconceptions

- **"MLOps = MLflow + Kubeflow."** Tools are not the practice; practice is reproducibility + automation + monitoring across the lifecycle.
- **"MLOps is for big tech."** Small teams need *some* MLOps (registry, monitoring, retrain triggers) once they have any models in prod.
- **"Model in prod = MLOps done."** It begins there: monitoring, drift response, retraining are the steady state.

## Failure Scenarios

- **The "Jupyter notebook deploy"** — researcher pushes a pickle to prod; no lineage, no monitoring, no rollback. Quickly explodes.
- **MLOps without monitoring** — infrastructure perfect; model silently rotting.
- **Tooling proliferation** — every team brings their own; cross-cutting governance impossible.
- **Retraining loops without guardrails** — auto-retrain on drift; one bad batch poisons all future models.

## Interview Perspective

- *"Walk through a production ML system from data ingestion to monitoring."* → data → feature store → training pipeline → registry → serving → monitoring → drift triggers → retrain.
- *"What's the difference between DevOps and MLOps?"* → MLOps adds data + model dimensions to versioning, CI/CD, monitoring, plus experimentation infrastructure.
- *"How do you decide between in-house and managed?"* → team size, scale, control needs, lock-in tolerance.
- Staff-level: discuss Sculley's "hidden technical debt", platform vs framework debate, ML feedback loops, governance and model cards.

## Related Concepts

- [[Training Pipelines]] — central MLOps construct.
- [[Model Registry]] — versioning pillar.
- [[Model Serving]] — production endpoint.
- [[Model Monitoring]] — operational eye.
- [[Feature Stores]] — data pillar.
- [[A-B Testing for ML]] — experimentation pillar.
- [[Data Quality]] — input-side invariants.
- [[CI-CD]] — adapted for ML.

## Practical Engineering Heuristics

- **Start with versioning + monitoring** — those compound before pipeline automation.
- **One model in prod = one full MLOps loop**; don't generalize until pattern repeats.
- **Treat training pipelines as production code** — review, test, version.
- **Automate the boring parts, leave humans for judgment** (validation gates, fairness review).
- **Adopt standards**: OpenLineage for lineage, OpenTelemetry for serving traces, model cards for governance.
- **Right-size the platform** — most orgs don't need Michelangelo.

## Active Recall Questions

What does MLOps add to DevOps?::Versioning of data + features + models, training pipelines, experimentation infrastructure, monitoring across data/prediction/outcome layers — all the things needed because ML systems depend on data as well as code.

What is Google's "MLOps Level 0"?::Manual workflow — notebook to prod with no automation; most orgs start here and remain there longer than they should.

Name the seven pillars of MLOps.::Versioning, pipelines, registry/catalog, serving, monitoring, experimentation, governance.

What did Sculley et al. (2015) observe about ML systems?::ML code is a tiny fraction of a production ML system; most code is data validation, glue, serving, monitoring — i.e., infrastructure.

Why is "model in prod" the beginning of MLOps, not the end?::Steady-state work is monitoring, drift response, retraining, experimentation; deployment is one event among many.

What does versioning need to cover for ML reproducibility?::Code (git SHA), data (snapshot), features (feature view version), model (registry), config (params), environment (container).

Name two cloud-managed MLOps platforms.::AWS SageMaker, GCP Vertex AI, Azure Machine Learning, Databricks ML.

## Feynman Test

Explain to a CTO why "we have MLflow, we're doing MLOps" is wrong — what specifically still needs to be true for the org to claim MLOps maturity?

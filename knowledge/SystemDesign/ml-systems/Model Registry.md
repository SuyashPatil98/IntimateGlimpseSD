---
title: Model Registry
area: ml-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Training Pipelines]]"]
related: ["[[Model Serving]]", "[[Feature Stores]]", "[[MLOps]]"]
builds_toward: ["[[Model Monitoring]]"]
sources:
  - MLflow docs — Model Registry
  - Data Engineering Cookbook (Kretz)
  - SageMaker Model Registry docs
  - SDI vol 2 (ML chapters)
tags: [ml-systems, registry, mlops]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Model Registry

## Executive Summary

A **model registry** is a versioned catalog of trained models: artifacts + metadata + lineage + stage (Staging, Production, Archived). It sits between [[Training Pipelines]] (which produce models) and [[Model Serving]] (which consumes them). The canonical open-source implementation is MLflow Model Registry; cloud equivalents include SageMaker, Vertex AI, Azure ML Model Registry.

## Why This Exists

Trained models multiply quickly: a team running daily training produces hundreds of artifacts per quarter. Without a registry: artifacts live on someone's laptop or in scattered S3 prefixes; deployments reference latest by convention; rollbacks are scavenger hunts; no one knows which model is in prod.

## Core Intuition

The registry is to models what a Docker registry is to images: a versioned, addressable store with promotion semantics.

## Internal Mechanics

A registry entry typically includes:
- **Artifact** — serialized model (pickle, SavedModel, ONNX) + dependencies (conda/pip).
- **Version** — monotonic integer per model name.
- **Stage** — `None`, `Staging`, `Production`, `Archived`.
- **Lineage** — git SHA, training run ID, dataset snapshot, hyperparameters.
- **Metrics** — offline eval scores (overall + per slice).
- **Signature** — input/output schema (Tensor specs).
- **Tags** — owners, framework, intended use.

**Promotion workflow:**
1. Training pipeline registers v3.
2. Validation gates run (compare to current prod, slice eval, fairness).
3. Promote `v3` to `Staging`; deploy to staging serving.
4. Smoke tests, shadow traffic.
5. Promote to `Production`; serving's "production" alias swaps to v3.
6. Demote previous prod to `Archived`.

**Aliases / channels** (MLflow 2.0+): replace stages with named pointers (`@champion`, `@challenger`) for finer-grained traffic management.

## Design Tradeoffs

**Centralized vs per-team:** central registry enables governance; per-team registries reduce coordination.

**Coupling to serving:** serving systems pull by alias (`production`) so promotion is the deploy event; tight integration is convenient but conflates artifact storage with deploy orchestration.

**Costs:** must back up artifact store (S3); growth is linear in #(models × versions × size); apply retention.

## Real Production Examples

- **MLflow Model Registry** — de facto open-source.
- **Uber Michelangelo** — internal end-to-end with built-in registry.
- **Meta FBLearner** — internal.
- **DVC + Git-LFS** — lighter-weight alternative for small teams.
- **SageMaker Model Registry, Vertex AI Model Registry** — cloud-native.

## Misconceptions

- **"S3 + naming convention = registry."** Without metadata, lineage, and promotion semantics, you have storage, not a registry.
- **"Registry handles deployment."** Mostly no — it tracks promotion intent; the serving system observes and reconciles. Some platforms tightly couple them.
- **"Versioning the model is enough."** Reproducibility also requires versioning data, code, and config — registry captures references to all three.

## Failure Scenarios

- **Alias drift** — `production` alias not atomically updated; mix of versions serve traffic. Mitigation: atomic alias updates + serving observes change.
- **Artifact rot** — environment changes; old model can't load. Mitigation: pin container image alongside artifact.
- **Lineage gap** — manual upload bypasses pipeline; no lineage; can't reproduce. Mitigation: register-only-via-pipeline policy.
- **Storage growth** — gigabytes of unused versions. Mitigation: retention policy on `Archived`.

## Interview Perspective

- *"How do you safely promote a model?"* → register → eval gates → Staging → shadow/canary → Production alias swap → old version archived but warm for rollback.
- *"How do you roll back a bad model?"* → repoint production alias to last known good; serving observes and loads previous artifact.
- *"What does a registry give you that S3 doesn't?"* → metadata, lineage, signatures, stages, governance, audit log.
- Staff-level: discuss alias-based vs stage-based workflows, multi-region serving consistency, and registry as a compliance artifact.

## Related Concepts

- [[Training Pipelines]] — register on successful validation.
- [[Model Serving]] — consumes registered artifacts.
- [[Feature Stores]] — registry should reference the feature view versions used.
- [[MLOps]] — the registry is one pillar of MLOps tooling.
- [[Data Lineage]] — analogous concept; registry captures *model* lineage.

## Practical Engineering Heuristics

- **Register only via pipeline** — no manual uploads.
- **Pin everything**: artifact, signature, container image, dataset snapshot, code SHA.
- **One alias per environment** (`staging`, `production`, `shadow`); promote by repointing.
- **Keep last N production versions warm** for instant rollback.
- **Tag ownership** — on-call lives by it.
- **Retention** on `Archived` to control storage cost.

## Active Recall Questions

What does a model registry store besides the model artifact?::Version, stage/alias, lineage (git SHA, dataset, params), metrics, signature, tags/ownership.

Walk through a typical promotion workflow.::Pipeline registers new version → validation gates → move to Staging → shadow/canary tests → promote alias to Production → archive previous Production version.

What does using aliases (champion/challenger) add over fixed stages?::Finer-grained traffic management and multi-candidate workflows beyond binary Staging/Production.

Why is "register only via pipeline" a useful policy?::Ensures every registered model has lineage and met validation gates; prevents lineage gaps from manual uploads.

What's the analog of a model registry in container infrastructure?::A Docker / OCI registry — both are versioned, addressable, governed artifact stores with promotion semantics.

How do you roll back a bad production model?::Repoint the production alias to the previous version; serving observes the change and loads the prior artifact (kept warm).

Name two ways model artifacts "rot" in storage.::Dependency drift (can't reload old framework version), environment incompatibility (CUDA/glibc changes), missing companion files (preprocessor pickled separately), serialization format deprecation.

## Feynman Test

Explain to your team's release manager why dragging `model_final_v3_REAL.pkl` to S3 is not an acceptable deploy workflow — list four concrete failure modes that a registry prevents.

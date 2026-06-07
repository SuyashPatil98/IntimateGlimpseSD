---
title: Feature Stores
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Caching]]", "[[Data Quality]]"]
related: ["[[Training Pipelines]]", "[[Model Serving]]", "[[Model Registry]]", "[[Online vs Batch Inference]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - Data Engineering Cookbook (Kretz)
  - SDI vol 2 (ML chapters)
  - Uber Michelangelo (Hermann et al., 2017)
  - Feast docs (feast.dev)
  - Tecton blog — "What is a Feature Store"
tags: [ml-systems, feature-store, mlops]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Feature Stores

## Executive Summary

A **feature store** is a centralized, dual-serving system for ML features: an **offline store** (warehouse-like) for training and backfill, and an **online store** (low-latency KV) for inference. It guarantees **train-serve consistency** — the same definition produces the same value at train time and serve time — and lets teams **share and reuse features** across models. Pioneered by Uber's Michelangelo (2017); now standard at FAANG-scale and emerging open-source (Feast, Hopsworks, Tecton).

## Why This Exists

Before feature stores, every ML team rebuilt feature pipelines per model. Two pathologies:
1. **Train-serve skew** — features computed differently in offline SQL (training) vs online Python (inference); model performs worse in prod than offline metrics suggested.
2. **Duplication** — "user_7d_purchase_count" reimplemented in five teams' codebases, subtly differently.

A feature store solves both: **define once, materialize twice** — to warehouse for training, to KV for serving.

## Core Intuition

Think of features as a *managed dataset* with two views:
- **Offline view**: parquet / warehouse table, partitioned by time, supports point-in-time joins for training.
- **Online view**: Redis / DynamoDB keyed by entity (user_id), returns latest values at <10ms p99.

A **feature definition** (SQL or DataFrame transformation) produces both views. The store handles materialization, freshness, and serving.

## Internal Mechanics

**Entities & features:**
- An **entity** is the join key (user, item, merchant).
- A **feature view** is a set of features per entity computed from a source.
- **Point-in-time correctness** is the central technical challenge — training labels at time `t` must join with feature values *as of `t`*, not the latest values (otherwise label leakage).

**Materialization:**
- Batch pipelines (Spark, dbt) compute features and write to both stores.
- Streaming pipelines (Flink, Spark Structured Streaming) update online store in near-real-time for fresh features (e.g., last_login).

**Serving:**
- **Online lookup** — `get_online_features(entity_ids, feature_names)` returns a vector at low ms.
- **Offline retrieval** — `get_historical_features(entity_df, feature_names)` does point-in-time joins for training datasets.

**Train-serve consistency** is enforced by deriving both serving paths from the same feature definition.

## Architecture Diagrams

```
                            ┌───────────────┐
sources ──► transformations ┤ materialize   ├──► offline store (warehouse) ──► training
                            │               │
                            └───────────────┴──► online store (KV)         ──► inference
                                                  ▲
                                                  │ get_online_features()
                                            model serving
```

## Design Tradeoffs

**Benefits:** train-serve consistency, feature reuse across models, lineage, governance, faster model dev (most work is feature engineering).

**Costs:**
- Operational complexity (two stores + pipeline + catalog).
- Point-in-time joins are expensive (Spark + asof joins on billions of rows).
- Latency budget split between feature lookup and inference; complex features hurt p99.
- Schema drift between offline and online if pipelines diverge.

**When NOT to use:**
- Single model, single team, small feature set — overkill.
- Features purely derived from request-time data — no offline component needed.

## Real Production Examples

- **Uber Michelangelo** — 2017 reference architecture; tens of thousands of features.
- **Airbnb Zipline** — batch + streaming feature platform.
- **Twitter, Pinterest, Spotify** — internal stores.
- **Feast** — open-source, vendor-neutral, popular standalone.
- **Tecton** — commercial enterprise feature platform.
- **Databricks Feature Store, Vertex AI Feature Store, SageMaker Feature Store** — cloud-managed.

## Misconceptions

- **"A KV cache is a feature store."** No — feature stores additionally guarantee point-in-time correctness for training; a raw cache doesn't.
- **"Feature stores are only for big tech."** True historically; Feast lowered the floor significantly.
- **"Online and offline are independent."** They must come from the same definition or train-serve skew returns.

## Failure Scenarios

- **Train-serve skew via divergent pipelines** — offline pipeline updated but online pipeline shipped late; model accuracy silently drops.
- **Stale online features** — streaming pipeline lags; inference uses 2-hour-old values.
- **Point-in-time bug** — feature computed at training time uses *future* values (label leakage); offline metrics great, prod terrible.
- **Online store hot key** — one user_id receives millions of requests; shard the entity.

## Interview Perspective

- *"Why do we need a feature store separate from a warehouse?"* → warehouse can't serve sub-10ms online lookups; feature store provides the dual serving + point-in-time semantics.
- *"What is train-serve skew and how does a feature store prevent it?"* → divergence between training and inference feature values; the store enforces a single feature definition for both paths.
- *"How would you handle a streaming feature like '5-min click count'?"* → Flink job updates online store; offline backfill via tumbling-window aggregation.
- Staff-level: discuss governance (PII tagging, access control), economics (online storage cost), and migration paths from monolithic ML to a shared platform.

## Related Concepts

- [[Training Pipelines]] — consume offline features.
- [[Model Serving]] — consumes online features.
- [[Online vs Batch Inference]] — determines which store the model hits.
- [[Model Registry]] — paired with feature store for full ML asset management.
- [[Caching]] — online store is essentially a managed cache.
- [[Data Quality]] — feature stores embed quality checks.

## Practical Engineering Heuristics

- **Define once** — share Python/SQL between offline and online materialization.
- **Point-in-time joins** are the hardest test — write integration tests with synthetic time-shifted data.
- **Budget online lookups**: ≤10 features, ≤10 ms; if you need 1000 features, batch precompute embedding vectors.
- **Track feature freshness as an SLO** — alert if online store > N minutes behind.
- **Catalog ownership** — every feature has a producer team.

## Active Recall Questions

What two stores does a feature store typically maintain and why?::An offline store (warehouse-like) for training and point-in-time joins; an online store (low-latency KV) for serving inference at <10ms.

What is train-serve skew?::Divergence between feature values at training time vs inference time, leading to silent accuracy degradation; usually caused by two different code paths computing "the same" feature.

What is point-in-time correctness in feature stores?::Training joins must use feature values *as of* the label time, not latest values — otherwise the model trains on future information (label leakage).

Name three open-source or commercial feature stores.::Feast (open-source), Tecton, Hopsworks, Databricks Feature Store, Vertex AI FS, SageMaker FS, Uber Michelangelo (internal).

Why isn't a Redis cache by itself a feature store?::It lacks an offline counterpart with point-in-time semantics, materialization pipelines, governance, and catalog.

What is the role of an entity in a feature store?::The join key (user, item, merchant) that identifies the row whose features are looked up.

Why do streaming features require a feature store and not just streaming infra?::To serve the freshly computed values at <10ms during inference; the store provides the online lookup layer plus offline backfill consistency.

## Feynman Test

Explain to a data engineer who has never done ML why "just put the features in a Postgres table" isn't a feature store — what specifically is missing?

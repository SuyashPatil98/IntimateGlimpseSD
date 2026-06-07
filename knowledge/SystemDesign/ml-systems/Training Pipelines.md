---
title: Training Pipelines
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Feature Stores]]", "[[Orchestration]]"]
related: ["[[Model Serving]]", "[[Model Registry]]", "[[MLOps]]"]
builds_toward: ["[[Model Monitoring]]"]
sources:
  - Data Engineering Cookbook (Kretz)
  - SDI vol 2 (ML chapters)
  - Google "Hidden Technical Debt in ML Systems" (Sculley et al., NeurIPS 2015)
  - TFX paper (Baylor et al., 2017)
  - Uber Michelangelo
tags: [ml-systems, training, mlops]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Training Pipelines

## Executive Summary

A **training pipeline** is the end-to-end, repeatable workflow that ingests data, generates features, trains a model, validates it, and registers it for serving. The training-script-in-a-Jupyter-notebook approach scales to demos; production needs orchestrated, versioned, reproducible pipelines (Kubeflow, Vertex AI Pipelines, SageMaker Pipelines, TFX, MLflow).

## Why This Exists

ML production has more failure modes than backend services: data changes (drift), code changes (model architecture), hyperparameters, training-serving skew, dependencies. Sculley et al. (2015) showed the ML code is a *small fraction* of a production ML system — most is infrastructure. Training pipelines codify that infrastructure: every model is built by running the same DAG.

## Core Intuition

Training is not "run `python train.py`." It's a DAG: ingest → validate data → generate features → split (train/val/test) → train → evaluate → validate (against baseline) → register → (maybe) deploy. Each stage is a versioned task with inputs and outputs.

## Internal Mechanics

**Canonical stages:**
1. **Data ingestion** — pull from warehouse/lake at a fixed snapshot.
2. **Data validation** — schema check, statistical drift vs prior runs (TFX `DataValidator`).
3. **Feature engineering** — derive features (or read from [[Feature Stores]]).
4. **Train/val/test split** — time-based for production-like evaluation.
5. **Training** — hyperparameter search, distributed training (Horovod, PyTorch DDP).
6. **Evaluation** — offline metrics vs holdout set; slice analysis (per cohort).
7. **Model validation** — compare to current production model on a fairness/regression set; reject if worse.
8. **Registration** — versioned artifact + metadata to [[Model Registry]].
9. **Optional auto-deploy** — promote candidate to canary.

**Reproducibility requirements:**
- Pin code (git SHA), data (snapshot ID or feature store as-of), config (YAML), environment (Docker image).
- Deterministic seeds where possible; record nondeterministic sources.

**Distributed training:**
- Data parallelism (each worker processes a shard).
- Model parallelism (model split across workers — for huge models).
- Parameter servers vs all-reduce.

## Design Tradeoffs

**Batch vs continuous training:**
- **Batch (daily/weekly)** — simpler, deterministic, easier to validate.
- **Continuous / online learning** — adapts to drift but risks silent regressions; rare outside ads/feeds.

**Triggers:** scheduled (daily), event-driven (new data dump), drift-triggered (monitoring fires retrain).

**Hyperparameter tuning vs single config:** tuning improves metrics but costs compute and complicates reproducibility; many shops use periodic tuning + fixed config between sweeps.

**Costs:** training runs are expensive (hours-days of GPU); failures partway through waste compute. Checkpointing is essential.

## Real Production Examples

- **Uber Michelangelo** — internal training + serving platform; thousands of models.
- **Google TFX** — open-source pipeline framework, used internally at scale.
- **Meta FBLearner** — pipeline service spawning millions of training runs/year.
- **Airbnb Bighead** — pipeline + notebook integration.
- **Spotify, Netflix, LinkedIn** — variants of the same pattern.
- **Open-source**: Kubeflow Pipelines, MLflow, Metaflow (Netflix).

## Misconceptions

- **"Training is the hard part."** No — data wrangling, validation, and operationalization usually consume 80% of effort.
- **"Reproducibility = pinning library versions."** Necessary, not sufficient — must also pin data snapshot, config, and seed nondeterminism.
- **"Distributed training is always faster."** Communication overhead can dominate; small models train faster on one GPU.

## Failure Scenarios

- **Silent data drift** — pipeline succeeds; model trained on shifted distribution. Mitigation: validation stage with drift detection.
- **Model worse than current prod, deployed anyway** — no champion-challenger guard. Mitigation: model-validation stage with rejection threshold.
- **Reproducibility loss** — six months later, can't reproduce a regression. Mitigation: snapshot data + record commit SHA + container image.
- **Training/eval data leakage** — feature computed using label or future data. Mitigation: time-based splits + point-in-time joins.
- **OOM partway through 12-hour run** — checkpoint not saved. Mitigation: periodic checkpointing.

## Interview Perspective

- *"Design a training pipeline for a recommendation model."* → DAG: snapshot warehouse → feature store retrieval → train/val time split → distributed PyTorch → eval per-cohort → compare to prod → register → canary.
- *"How do you ensure reproducibility?"* → pin code (git SHA), data (snapshot or as-of), config, environment (container); seed RNGs; log everything to MLflow.
- *"When should you retrain?"* → schedule + drift-triggered (when monitored data/concept drift exceeds threshold) + on-model-degradation alarms.
- Staff-level: discuss feedback loops (model influences what data is collected next), online learning risks, and the "ML debt" frame.

## Related Concepts

- [[Feature Stores]] — primary source of training features.
- [[Model Registry]] — destination of trained artifacts.
- [[Model Serving]] — downstream consumer of registered models.
- [[Orchestration]] — training pipelines are orchestrated DAGs.
- [[Data Quality]] — input validation stage.
- [[Data Drift]] — trigger for retraining.
- [[MLOps]] — the broader practice training pipelines live in.

## Practical Engineering Heuristics

- **Train-time split should mimic prod**: future data is "test", past is "train".
- **Always compare to baseline** before registering; reject regressions automatically.
- **Slice evaluation** — report metrics per cohort (new vs returning users, geography); aggregate hides regressions.
- **Checkpoint frequently** during long runs.
- **One pipeline per model use case**; resist a "do everything" mega-pipeline.
- **Track everything to MLflow / W&B**: params, metrics, artifacts, code SHA.

## Active Recall Questions

What are the canonical stages of a training pipeline?::Ingest → validate data → feature engineering → split → train → evaluate → model validation → register → (optional) deploy.

Why is reproducibility hard in ML?::Multiple sources of variance — data snapshot, code, config, environment, RNG seeds, hardware nondeterminism — must all be pinned.

What is "model validation" as a pipeline stage?::Compare a candidate model to the current production model on a holdout/fairness set; reject if worse on key metrics or slices.

What did Sculley et al. (2015) point out about ML systems?::Most of a production ML system is *not* model code — it's infrastructure (data validation, serving, monitoring, configs). "ML code is a tiny fraction."

When should you retrain a model?::On schedule (daily/weekly), on drift triggers (data/concept drift beyond threshold), on degradation alarms.

Why is time-based train/test splitting important?::Random splits leak future information; production sees data from after training, so evaluation must too.

Name two failure modes specific to ML training pipelines.::Silent data drift, label/future leakage, model regression deployed without check, irreproducible runs.

## Feynman Test

Walk a senior backend engineer through what changes when their "service" outputs a *model* instead of a JSON response — what infrastructure does the team need that backend systems don't?

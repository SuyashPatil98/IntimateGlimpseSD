---
title: Ranking Systems
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Recommendation Systems]]", "[[Model Serving]]"]
related: ["[[Search Ranking]]", "[[A-B Testing for ML]]", "[[Feature Stores]]"]
builds_toward: []
sources:
  - SDI vol 2 (ML chapters)
  - Burges "From RankNet to LambdaRank to LambdaMART" (2010)
  - Liu "Learning to Rank for Information Retrieval" (2009)
  - Facebook DLRM paper (Naumov et al., 2019)
  - Eugene Yan blog
tags: [ml-systems, ranking, ltr]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Ranking Systems

## Executive Summary

A **ranking system** orders a candidate set of items by predicted relevance / utility for a user-context pair. Core technique: **Learning to Rank (LTR)** — train a model whose objective is order quality rather than per-item probability. Three loss families: pointwise (regression on each item), pairwise (correctly order pairs), listwise (optimize full-list metrics like NDCG). Production: deep models (DLRM, wide-and-deep) blending dense + sparse features.

## Why This Exists

After candidate generation, a system has ~1000 items and must pick the best ordering for a slot of ~10. A classifier that predicts P(click) per item works but ignores list-level interactions (diversity, position). LTR optimizes order quality directly.

## Core Intuition

The job isn't "is this item good?" but "is this item better than that one?" Pointwise treats each independently; pairwise treats pairs; listwise considers the full ordering. Pairwise/listwise consistently outperform pointwise for top-K rankings.

## Internal Mechanics

**Loss families:**

| Approach | Loss | Examples |
|---|---|---|
| Pointwise | per-item regression / classification | logistic regression on (item, click) |
| Pairwise | hinge / cross-entropy on item pairs | RankNet, LambdaRank |
| Listwise | full-list metric (NDCG / MAP) | LambdaMART, ListNet |

**Features:**
- **User features** — demographics, history, embeddings.
- **Item features** — content, popularity, embeddings.
- **Cross features** — user-item interaction history, co-engagement.
- **Context features** — time, device, location.
- **Position features** — used at training, masked at serving (to avoid position bias).

**Model architectures:**
- **GBDT** (XGBoost, LightGBM) — strong on tabular features, popular for search ranking.
- **DLRM** (Meta) — sparse embeddings + MLPs; ads/feed standard.
- **Two-tower with cross** — efficient retrieval-then-rank pipeline.
- **Transformer-based** — recent for sequence-aware ranking.

**Multi-objective:**
- Optimize a weighted sum (engagement + revenue + creator fairness).
- Or multi-task heads (predict click, dwell time, share separately; combine at serving).

**Calibration:** raw model scores may need recalibration so they're comparable across requests or interpretable as probabilities (for downstream auction / blending).

## Design Tradeoffs

**Engagement vs long-term value:** maximizing short-term clicks often degrades retention.

**Sparsity vs density of features:** sparse embeddings for IDs; dense for histograms; DLRM blends.

**Latency vs accuracy:** richer features improve ranking but stretch budget; truncate features that don't move the metric.

**Position bias:** training data is observational; clicks correlate with position. Counterfactual / inverse-propensity-weighted training helps.

## Real Production Examples

- **Google Search ranking** — long history of LTR; LambdaMART canonical.
- **Meta Feed ranking** — DLRM, multi-task heads.
- **YouTube** — DNN ranker with watch-time-weighted loss.
- **TikTok** — heavy retrieval + ranker.
- **LinkedIn Feed** — Quasar (multi-task).
- **Twitter Home Timeline** — published "Heavy Ranker" (transformer 2023).
- **Etsy, Booking.com, Airbnb search** — GBDT-heavy with embedding features.

## Misconceptions

- **"Higher AUC = better ranking."** AUC measures pairwise, not top-K; NDCG@K is the production metric.
- **"Ranking is just classification."** Pointwise treats it as classification; pairwise/listwise often substantially better.
- **"One model objective is enough."** Real systems blend multiple signals (engagement + revenue + safety).

## Failure Scenarios

- **Position bias unacknowledged** — model overweights position, can't generalize.
- **Engagement-only objective** — clickbait dominates; long-term users churn.
- **Calibration drift** — scores no longer interpretable for downstream blending.
- **Recall ceiling** — candidate gen too narrow; ranking polishes a bad set.
- **Stale features at serving** — feature store lag; ranker sees yesterday's user state.

## Interview Perspective

- *"How would you design ranking for a news feed?"* → LTR with multi-task heads (click, dwell, share), DLRM-style architecture, position-aware loss, online A/B with engagement + retention guardrails.
- *"NDCG vs AUC — which to optimize?"* → NDCG for ordered top-K; AUC for pairwise discrimination overall. Production usually NDCG.
- *"What's pairwise ranking?"* → Train on pairs (item_i, item_j) labeled "i preferred over j"; minimize incorrect orderings.
- Staff-level: discuss multi-stakeholder optimization (users + creators + ads), counterfactual evaluation, debias techniques.

## Related Concepts

- [[Recommendation Systems]] — uses ranking as second stage.
- [[Search Ranking]] — ranking applied to query-driven retrieval.
- [[Feature Stores]] — ranking is feature-heavy.
- [[Model Serving]] — high-QPS, latency-bound serving.
- [[A-B Testing for ML]] — only valid measurement of ranking quality.

## Practical Engineering Heuristics

- **Use NDCG@K** as the offline target.
- **Train with position features, serve without** them.
- **Blend objectives** — weighted multi-task heads beat single-objective.
- **Calibrate scores** if used downstream (ads, multi-source blending).
- **Watch slice NDCG** — global NDCG hides regressions on rare queries / new users.
- **Recall must keep up** — improving ranking on bad candidates is wasted work.

## Active Recall Questions

What are the three families of LTR loss functions?::Pointwise (per-item), pairwise (item pairs), listwise (full list).

Why is NDCG often preferred to AUC for ranking?::NDCG measures top-K ordering quality with position discounting, which matches what users see; AUC scores all pair comparisons equally and isn't position-aware.

What is position bias and how is it handled at training time?::Position influences clicks regardless of relevance; mitigated by including position as a training feature (masked at serving), or via inverse-propensity weighting.

What is DLRM?::Meta's Deep Learning Recommendation Model — sparse embedding tables for categorical features + dense MLPs + interaction layer; standard for feed/ads ranking.

What are multi-task ranking heads?::Separate output heads predict different signals (click, dwell, share); combined at serving via a weighted sum to optimize multiple objectives.

Why is engagement-only optimization risky?::It rewards clickbait, fueling short-term engagement and long-term churn; multi-objective + retention guardrails counter this.

What's the role of score calibration in ranking?::Makes scores comparable across requests or usable downstream (e.g., second-price auctions in ads); raw model logits often aren't probabilities.

## Feynman Test

Explain to a new ML engineer why a perfectly-calibrated P(click) classifier might still produce worse rankings than a pairwise model — what is the classifier missing?

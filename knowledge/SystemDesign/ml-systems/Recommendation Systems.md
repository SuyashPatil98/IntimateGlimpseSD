---
title: Recommendation Systems
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Model Serving]]", "[[Feature Stores]]"]
related: ["[[Ranking Systems]]", "[[Vector Databases]]", "[[Online vs Batch Inference]]"]
builds_toward: ["[[Search Ranking]]"]
sources:
  - SDI vol 1 Ch.14 (YouTube)
  - Covington, Adams, Sargin "Deep Neural Networks for YouTube Recommendations" (RecSys 2016)
  - Eugene Yan blog — "System Design for Recommendations"
  - Chip Huyen "Designing ML Systems" (2022)
tags: [ml-systems, recommendations, ranking]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Recommendation Systems

## Executive Summary

A **recommendation system** suggests items (videos, products, posts) for a user given context and history. Production systems use a two-stage architecture: **candidate generation** narrows from millions to hundreds (recall-oriented, fast), then **ranking** scores those hundreds precisely (precision-oriented, expensive). Both stages typically use embeddings + ML models; the system blends collaborative filtering, content features, and contextual signals.

## Why This Exists

Catalogs (YouTube videos, Amazon products) have $10^8$+ items. Scoring each item per user per request is impossible. The two-stage funnel makes the problem tractable: cheap recall over the full catalog, expensive precision over the candidate set.

## Core Intuition

```
billions of items ── candidate generation (recall) ──► ~1000
                       (embedding ANN search)
                                                          │
                              ranking (precision) ────────┘
                            (full-feature DL model)
                                  │
                                  ▼
                       ~10 items, ordered, shown
```

Candidate generation tolerates false positives; ranking removes them. Ranking can't reach the long tail; candidates must.

## Internal Mechanics

**Candidate generation approaches:**
- **Collaborative filtering** — matrix factorization, item-item, user-user.
- **Two-tower / embedding retrieval** — separate towers for user and item produce vectors; nearest-neighbor search via [[Vector Databases]] (FAISS, ScaNN).
- **Heuristic** — co-watch lists, trending, follow-graph.
- **Multiple sources** — union of N retrievers, deduped.

**Ranking model:**
- Inputs: user features, item features, user-item interaction features, context (time, device).
- Output: predicted engagement (probability of click / watch time / conversion).
- Architecture: typically a deep model (DLRM, Wide & Deep, two-tower with full features at the head).
- Latency budget: ~50–200 ms; batched within request across candidates.

**Re-ranking / business rules:**
- Diversity (don't show 10 cat videos in a row).
- Fairness / freshness / promotion.
- Constraint satisfaction (don't show items user already saw).

## Architecture Diagrams

```
   user_id, context
        │
        ▼
  ┌────────────────┐    candidates (~1000)    ┌──────────────┐
  │ Candidate Gen  │──────────────────────────►│   Ranker     │
  │ (2-tower ANN,  │                           │ (DL, full    │
  │  CF, heuristic)│                           │  features)   │
  └────────────────┘                           └──────┬───────┘
                                                       │
                                                       ▼
                                               ┌─────────────┐
                                               │  Re-rank /  │
                                               │  Business   │
                                               │  Rules      │
                                               └──────┬──────┘
                                                       ▼
                                                   top-K shown
```

## Design Tradeoffs

**Precompute vs online retrieval:**
- Precompute top-N per user nightly (Netflix homepage) — cheap, stale.
- Online retrieve + rank per request (YouTube watch-next) — fresh, expensive.

**Exploration vs exploitation:**
- Pure ranking exploits known good items; users get stuck.
- Bandits / epsilon-greedy / Thompson sampling inject exploration.

**Feedback loops:**
- Ranker promotes what users click; users click what ranker promotes; positive feedback amplifies popular items, starves long tail (filter bubbles).
- Mitigation: explicit diversity constraints, exploration, off-policy correction.

**Cost:** ranking model is the highest QPS × latency × GPU spend in many companies.

## Real Production Examples

- **YouTube** — Covington 2016: two-tower candidate gen + DNN ranker; one of the first publicly described.
- **Netflix homepage** — multiple personalized rows; offline candidates + online ranking.
- **TikTok For You** — heavy online retrieval, strong exploration.
- **Amazon "Customers who bought…"** — classic item-item CF.
- **Spotify Discover Weekly** — batch precomputed weekly.
- **Pinterest Pixie / PinSage** — graph-based candidate generation.

## Misconceptions

- **"Recommendation is just collaborative filtering."** No — modern systems heavily use content embeddings and contextual deep models; CF is one input.
- **"Better ranking = better recommendations."** Recall (candidate gen) sets the ceiling; you can't rank what you didn't retrieve.
- **"Accuracy is the metric."** Offline accuracy doesn't equal user satisfaction; need online A/B with engagement metrics.

## Failure Scenarios

- **Cold start (new users / items)** — no embedding history; recommendations bad. Mitigation: content-based fallback, popularity prior.
- **Filter bubble** — feedback loop concentrates on popular items. Mitigation: exploration, diversity constraints.
- **Position bias** — top-ranked items get clicked because they're top, not because they're best. Mitigation: position-aware loss, randomized evaluation.
- **Stale embeddings** — item embeddings cached, content changed. Mitigation: refresh cadence.
- **Recall starvation** — candidate gen returns same N items per user; ranking can't recover diversity.

## Interview Perspective

- *"Design YouTube recommendations."* → two-stage funnel; candidate gen (two-tower + heuristic union) → ranking (DLRM/DNN) → re-rank with diversity + freshness. Discuss feature store, latency budget per stage, A/B framework.
- *"How do you handle cold start?"* → content embeddings (text/image), popularity priors, contextual bandits.
- *"What's the difference between recall and precision in recommendation?"* → recall (did we retrieve relevant items?) drives candidate gen; precision (did we rank them well?) drives ranking.
- Staff-level: feedback loops, off-policy evaluation, multi-objective optimization (engagement vs revenue vs creator fairness).

## Related Concepts

- [[Ranking Systems]] — the precision stage in detail.
- [[Vector Databases]] — backbone of embedding retrieval candidate gen.
- [[Feature Stores]] — supply both stages.
- [[Online vs Batch Inference]] — both used (batch candidates + online ranking is common).
- [[A-B Testing for ML]] — the only valid measurement.

## Practical Engineering Heuristics

- **Two stages or your latency dies.** Don't try to rank the whole catalog.
- **Diversify the candidate generators.** Multiple retrievers > one.
- **Explore explicitly.** Pure exploit kills long-term engagement.
- **Track recall as well as precision** — Recall@K of candidate gen is the often-ignored metric.
- **A/B everything**, including small ranking tweaks.
- **Watch feedback loops** — slice metrics by item popularity to detect concentration.

## Active Recall Questions

What is the two-stage architecture for recommendation systems?::Candidate generation (recall, cheap, narrows millions to hundreds) followed by ranking (precision, expensive, scores the candidates).

Why can't a single model rank the entire catalog?::Latency — scoring billions of items per request is impossible; the recall stage exists to make precision affordable.

What is two-tower retrieval?::Separate neural networks (towers) produce user and item embeddings in the same space; retrieval is nearest-neighbor search over precomputed item embeddings, scalable via ANN.

What is the feedback loop problem in recommendations?::The ranker promotes what users click; users click what ranker shows; popular items dominate, long tail starves, filter bubbles form.

How do you handle cold start for new items?::Content-based embeddings (text/image features), popularity priors, exploration (e.g., epsilon-greedy or bandits).

What is position bias and how do you mitigate it?::Top-ranked items get more clicks regardless of quality; mitigated via position-aware loss, click models, or randomized evaluation.

Why is candidate-generation Recall@K a critical metric?::The ranker can only rank items the candidate stage returned; bad recall caps the system's quality.

## Feynman Test

Walk a product manager through why "let's just train a bigger model" doesn't fix poor recommendations — what's the architectural answer instead?

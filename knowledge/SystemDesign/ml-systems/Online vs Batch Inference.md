---
title: Online vs Batch Inference
area: ml-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Model Serving]]"]
related: ["[[Feature Stores]]", "[[Caching]]", "[[Batch Processing]]"]
builds_toward: ["[[Recommendation Systems]]"]
sources:
  - SDI vol 2 (ML chapters)
  - Data Engineering Cookbook (Kretz)
  - Eugene Yan blog — "Real-time ML"
  - Chip Huyen "Designing ML Systems" (2022)
tags: [ml-systems, inference, serving]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Online vs Batch Inference

## Executive Summary

ML predictions are served in two regimes: **online** (request-time, latency-sensitive, one record at a time) and **batch** (offline job, throughput-oriented, millions of records at once). Many production systems are *hybrid*: batch-precompute predictions for common inputs, fall back to online for the long tail.

## Why This Exists

Use case dictates regime. Real-time fraud blocking can't wait for a nightly job — online. Daily personalized email recommendations don't need 10 ms — batch. Choosing wrong: spend 10× on infra (over-engineering with online when batch suffices) or fail SLOs (using batch when freshness matters).

## Core Intuition

| Aspect | Online | Batch |
|---|---|---|
| Trigger | Per-request | Scheduled |
| Latency | ms–s | minutes–hours |
| Volume | 1 per call | millions per job |
| Hardware | GPU/CPU live | Spark cluster |
| Freshness | request-time | last batch |
| Cost model | per QPS | per job |
| Feature source | online store | warehouse |

## Internal Mechanics

**Online inference:**
- Request hits serving endpoint → fetch features from online feature store → run model → return.
- Latency budget split between feature lookup, model execution, network.
- Requires hot model in memory, autoscaling, batching for GPU.

**Batch inference:**
- Spark/Beam job reads input set + features from warehouse → applies model UDF (Spark Pandas UDF, TensorFlow on Beam) → writes predictions to a table or KV.
- Throughput, not latency.
- Pipeline scheduled (daily/hourly) via [[Apache Airflow]].

**Hybrid pattern (precompute + online fallback):**
- Batch nightly: predict for all known users; store in KV.
- Online: lookup by key; if miss (new user / new item), run model live.
- Best of both worlds: serving latency = KV lookup (single-digit ms) for the head; freshness only suffers for the tail.

**Streaming inference** is a third mode: predictions produced continuously from event streams (Flink job applies model on each event). Latency between online and batch; throughput moderate.

## Design Tradeoffs

**Choose online when:**
- Input is request-only (user query, page context).
- Freshness <1 min required.
- Long tail of inputs (can't precompute).

**Choose batch when:**
- Input set is known in advance.
- Freshness tolerance hours+.
- Cost matters (batch GPU utilization >> serving GPU utilization).

**Costs of online:** GPU idle time, autoscaling headroom, on-call. **Costs of batch:** stale predictions, can't react to fresh signals.

## Real Production Examples

- **Netflix homepage rows** — batch-precomputed daily per user.
- **Google Ads CTR prediction** — online (sub-50ms).
- **YouTube recommendations** — hybrid: candidate generation precomputed, ranking online.
- **Stripe Radar (fraud)** — online (block bad txns within request).
- **Spotify Discover Weekly** — batch (one playlist/user/week).
- **Uber ETA** — online (request-time, fresh traffic).

## Misconceptions

- **"Real-time is always better."** Often not — batch is cheaper, simpler, easier to validate. Use real-time when freshness *demonstrably* moves a business metric.
- **"Streaming = online."** Streaming is continuous batch with low latency; not the same as request-driven online.
- **"Once batch, always batch."** Migration is common: start batch (lower risk) → add streaming for fresh features → eventually move ranking online.

## Failure Scenarios

- **Online cold start at peak** — autoscaler too slow; users see errors.
- **Batch SLA miss** — overnight job runs into morning; users see yesterday's recommendations.
- **Hybrid miss-rate explosion** — schema change invalidates KV cache; everything hits online fallback; serving fleet OOM.
- **Stale features in batch** — features computed at job start are 8 hours old by job end; predictions inconsistent within run. Mitigation: snapshot features.

## Interview Perspective

- *"Online or batch for fraud detection?"* → online (must decide during transaction).
- *"Online or batch for daily personalized email?"* → batch (no real-time need).
- *"What's the latency budget for online inference at e-commerce search?"* → typically <100 ms p99 end-to-end; feature lookup, model, post-processing all share it.
- Mistake: defaulting to online for everything; not considering hybrid precompute.

## Related Concepts

- [[Model Serving]] — typically refers to online; batch served via pipeline.
- [[Feature Stores]] — provides both online and offline serving for features.
- [[Batch Processing]] — substrate for batch inference.
- [[Caching]] — hybrid pattern relies on cached predictions.
- [[Recommendation Systems]] — common hybrid use case.

## Practical Engineering Heuristics

- **Default to batch** unless freshness or interactivity demands online.
- **Hybrid precompute + online fallback** captures most use cases.
- **Snapshot features at job start** for batch to ensure within-run consistency.
- **Measure miss rate** in hybrid systems as a primary SLO.
- **Right-size GPUs** — over-provisioning online inference is the #1 cost line.

## Active Recall Questions

What is the difference between online and batch inference?::Online runs per-request, latency-sensitive, one record at a time; batch runs scheduled jobs over millions of records optimized for throughput.

When is the hybrid precompute + online fallback pattern useful?::When most requests are for a predictable set (precomputed in batch) but a long tail of fresh inputs needs live inference.

Why is "real-time is better" often wrong?::Real-time is more expensive, harder to validate, and harder to operate; only worth it when freshness measurably improves the business metric.

Give an example use case for each regime.::Online: fraud detection, search ranking. Batch: daily email recommendations, periodic risk scoring. Streaming: live engagement scoring.

What is streaming inference?::Continuous predictions from an event stream (e.g., Flink running a model on each Kafka event); latency between online and batch.

What's the dominant cost driver for online inference?::GPU idle/headroom — over-provisioning to meet latency under traffic spikes.

What can go wrong if batch inference features aren't snapshotted at job start?::Features drift during a long job; predictions earlier and later in the same run see different feature values, breaking consistency.

## Feynman Test

A PM asks "why can't we just make everything real-time?" — give them three concrete reasons batch is the right answer for most of the company's ML use cases.

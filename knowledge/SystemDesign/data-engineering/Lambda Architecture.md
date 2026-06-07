---
title: Lambda Architecture
area: data-engineering
status: mature
difficulty: advanced
prerequisites: ["[[Batch Processing]]", "[[Stream Processing]]"]
related: ["[[Kappa Architecture]]", "[[Batch Processing]]", "[[Stream Processing]]"]
sources:
  - Nathan Marz, "Big Data" book
  - DDIA Ch.11
tags: [data-engineering, lambda, hybrid]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Lambda Architecture

## Executive Summary

**Lambda Architecture** (Nathan Marz, ~2011) is a **hybrid data-processing approach combining batch and streaming**: a **batch layer** computes accurate results periodically over all data; a **speed layer** computes approximate real-time results from recent data; a **serving layer** merges both for queries. Historically influential; **largely superseded by [[Kappa Architecture]]** (stream-only) where modern frameworks (Flink, Kafka Streams) can handle both accuracy and latency.

## Why This Exists

Pre-modern-streaming: batch was accurate but slow; streaming was fast but unreliable. Lambda's answer: run both. Batch periodically corrects what streaming approximates. Result: real-time queries with eventual accuracy.

## Core Intuition

A bank: ATM withdrawals show approximate balance instantly (speed layer); nightly batch reconciles exact balance (batch layer). User sees live + accurate.

## Internal Mechanics

**Three layers:**

1. **Batch layer:**
   - Stores all data immutably.
   - Periodically recomputes views from scratch.
   - Slow but exact.

2. **Speed layer:**
   - Real-time stream processing.
   - Approximate views from recent data.
   - Fast but possibly inaccurate.

3. **Serving layer:**
   - Merges batch and speed views.
   - Answers queries.

**Trade:** batch corrects approximations over time.

## Design Tradeoffs

**Benefits:**
- Real-time + accurate (eventually).
- Robust to streaming bugs (batch is truth).

**Costs:**
- **Two codebases** (batch + stream logic).
- **Operational complexity.**
- **Reasoning hard** about combined views.

## Why Lambda Declined

[[Kappa Architecture]] proposed: skip the batch layer entirely. Modern stream processors (Flink) can:
- Replay from Kafka.
- Recompute views from streams.
- Handle backfills.

Why maintain two systems if one suffices? Most modern data infrastructure converges on Kappa.

## Real Production Examples

- **Twitter (historically)** — Lambda for analytics.
- **Many 2010s big-data shops.**
- **Modern: Kappa preferred.**

## Interview Perspective

**Common questions:**
- "What's Lambda Architecture?" → Hybrid: batch + speed layers + serving layer merging.
- "Vs Kappa?" → Lambda: two layers. Kappa: stream-only.
- "Why declined?" → Two codebases; modern streamers can do both.

**Senior-level:**
- Lambda was right for its time; modern streaming made it obsolete for most.
- Some Lambda deployments persist for organizational / legacy reasons.

**Common mistakes:**
- Lambda for new projects (Kappa usually better).
- Underestimating two-codebase cost.

## Related Concepts

- [[Kappa Architecture]] · [[Batch Processing]] · [[Stream Processing]]

## Misconceptions

- **"Lambda = modern best practice."** Was; now usually replaced by Kappa.
- **"Lambda is required for real-time."** Modern streaming alone suffices.

## Failure Scenarios

- **Codebase drift** between batch and stream.
- **Operational overhead** dominates value.

## Practical Engineering Heuristics

- **For new systems, consider Kappa first.**
- **Lambda only if legacy or specific constraints.**

## Active Recall Questions

What's Lambda Architecture?::Hybrid data processing: batch layer (accurate, slow) + speed layer (fast, approximate) + serving layer (merge for queries).

Who coined it?::Nathan Marz, ~2011, "Big Data" book.

Three layers?::Batch (accurate), Speed (real-time approximate), Serving (merged queries).

Why declined?::Modern stream processors (Flink, Kafka Streams) handle both accuracy and latency. Maintaining two codebases not worth it.

Successor?::Kappa Architecture — stream-only.

Real-world example of Lambda?::Twitter analytics in the 2010s.

## Feynman Test

Design Lambda for real-time tweet counts. Walk through the three layers.

Why has Kappa Architecture largely replaced Lambda?

## Mastery Checklist

- **Explain** Lambda Architecture.
- **Compare** with Kappa.
- **Derive** why Lambda declined.
- **Critique** new Lambda deployments.
- **Design** legacy Lambda migration to Kappa.

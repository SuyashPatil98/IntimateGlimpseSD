---
title: Kappa Architecture
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Stream Processing]]", "[[Lambda Architecture]]"]
related: ["[[Lambda Architecture]]", "[[Stream Processing]]", "[[Event Streams]]"]
sources:
  - Jay Kreps (Confluent / Kafka) — coined the term
  - DDIA Ch.11
tags: [data-engineering, streaming, architecture]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Kappa Architecture

## Executive Summary

**Kappa Architecture** (Jay Kreps, 2014) is a **data architecture pattern that uses stream processing for everything** — batch is just a special case of replaying the stream. Proposed as simpler alternative to [[Lambda Architecture]]'s dual-codebase approach: one engine, one codebase, batch derived by replaying historical streams. Enabled by **modern stream processors (Flink) + durable event logs (Kafka)** that can replay arbitrarily into the past. The current consensus for new data architectures.

## Why This Exists

[[Lambda Architecture]]'s two codebases (batch + stream) double maintenance burden. Kafka's durable, replayable logs change the math: if you can replay all events from the beginning, you don't need a separate batch system. Kappa proposes: stream everything; for "batch" needs, replay from beginning.

## Core Intuition

A river that records its own history. Want the average flow last month? Don't open a separate batch system — replay the recording at higher speed, computing as you go. One system; one logic; multiple uses.

## Internal Mechanics

**Components:**
- **Append-only log** (Kafka) — source of all events.
- **Stream processor** (Flink, Kafka Streams) — processes events.
- **Materialized views** (DB, search index) — current state derived from stream.

**Workflow:**
- Events written to log.
- Stream processor consumes; updates views.
- For new analyses: spin up new consumer; replay from beginning; build new view.
- For reprocessing (bug fixes): replay; rebuild view.

**Backfill:** replay history through current logic.

**Lambda vs Kappa comparison:**

| Aspect | Lambda | Kappa |
|---|---|---|
| Codebases | 2 (batch + stream) | 1 (stream) |
| Backfill | Run batch | Replay stream |
| Complexity | High | Lower |
| Storage | Both (often) | Stream + materialized views |

## Real Production Examples

- **LinkedIn** — pioneered Kappa-style architectures.
- **Confluent's stack** — Kafka + Kafka Streams / ksqlDB.
- **Modern data platforms** — increasingly Kappa-flavored.

## Design Tradeoffs

**Benefits:**
- Single codebase.
- Simpler operationally.
- Replay → flexible reprocessing.

**Costs:**
- Long-retention log (storage cost).
- Replay time at scale.
- Stream framework maturity needed.

## Interview Perspective

**Common questions:**
- "What's Kappa?" → Single stream-based architecture; batch via replay.
- "Vs Lambda?" → One codebase vs two.
- "What enabled it?" → Durable, replayable logs (Kafka) + mature stream processors (Flink).

**Senior-level:**
- Kappa requires long-retention Kafka — costs scale.
- "Replay from beginning" can take days for huge histories.
- Some workloads still benefit from explicit batch (very long aggregates).

**Common mistakes:**
- Kappa with short retention → can't replay.
- Treating Kappa as silver bullet — sometimes Lambda fits better.

## Related Concepts

- [[Lambda Architecture]] · [[Stream Processing]] · [[Event Streams]] · [[Apache Flink]] · [[Kafka Architecture]]

## Misconceptions

- **"Kappa = no batch."** Batch via replay; still real work.
- **"Kappa is always simpler."** Operational complexity moves elsewhere.

## Failure Scenarios

- **Retention too short** → can't replay.
- **Replay too slow** for production needs.

## Practical Engineering Heuristics

- **Kappa for new systems by default.**
- **Long Kafka retention** for replay capability.
- **Flink for sophisticated state.**

## Active Recall Questions

What's Kappa Architecture?::Single stream-based architecture. Batch is a replay of the stream through current logic.

Who coined it?::Jay Kreps (Confluent / Kafka), 2014.

Vs Lambda?::Kappa: one codebase (stream). Lambda: two (batch + stream).

What enabled Kappa?::Durable, replayable event logs (Kafka) + mature stream processors (Flink).

Replay use cases?::Backfill new analyses; reprocess after bug fix; build new materialized view.

What's the storage trade-off?::Long Kafka retention costs storage. But avoids separate batch infrastructure.

## Feynman Test

A new analytics need arises. Walk through Kappa: how do you compute over historical data?

Why does Kappa require Kafka rather than a traditional message queue?

## Mastery Checklist

- **Explain** Kappa Architecture.
- **Compare** with Lambda.
- **Derive** when Kappa fits.
- **Critique** Kappa with short retention.
- **Design** Kappa pipeline using Kafka + Flink.

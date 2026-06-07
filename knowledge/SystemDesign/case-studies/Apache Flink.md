---
title: Apache Flink
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Stream Processing]]", "[[Stream Windowing]]"]
related: ["[[Apache Spark]]", "[[Apache Storm]]", "[[Apache Kafka]]"]
builds_toward: []
sources:
  - Carbone et al. "Apache Flink: Stream and Batch Processing in a Single Engine" (2015)
  - Flink docs
  - Ververica engineering
tags: [case-study, streaming, flink]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Apache Flink

## Executive Summary

**Apache Flink** is the leading native stream processor. Originated as Stratosphere at TU Berlin (2010); rebranded Flink, joined Apache (2014). Strengths: **true event-time processing**, **bounded-state event-time windows**, **exactly-once semantics via consistent checkpoints**, sub-100ms latency. Used by Alibaba (Singles' Day 4-PB/sec), Netflix, Uber, Stripe.

## Why It Mattered

Pre-Flink streaming was either:
- Storm: low-latency but at-least-once, no built-in state.
- Spark Streaming: micro-batch, awkward event-time semantics.

Flink offered **record-at-a-time processing** with **rigorous event-time semantics + exactly-once + scalable state**. The Tyler Akidau "Streaming 101" worldview made manifest.

## Architecture (essentials)

- **JobManager** — coordinates checkpoints, schedules tasks.
- **TaskManagers** — run operator instances; hold state.
- **DataFlow** — DAG of operators; data flows record-by-record.
- **State backend**: in-memory + RocksDB; large state spills to disk.
- **Checkpoints** — periodic distributed snapshots via Chandy-Lamport-style barriers.

## Event-Time + Watermarks

- Each event carries a **timestamp** (when it happened).
- **Watermarks** propagate: "no more events with timestamp ≤ T".
- Windows close when watermark passes the window end + allowed lateness.
- Late events update closed windows as corrections (or are dropped).

## Exactly-Once

- Checkpoint barrier flows through DAG; each operator snapshots state at barrier.
- On failure: roll back to last checkpoint; replay from input source's offset.
- **Two-phase commit** with sink (Kafka, files) → end-to-end exactly-once.

## State

- Keyed state (per-key, partitioned).
- Operator state (per-task).
- Backed by RocksDB; supports TB-scale state.
- Queryable state for interactive lookups.

## Strengths

- **True streaming** — record-at-a-time, no micro-batch.
- **Event-time correctness** — watermarks + allowed lateness.
- **Exactly-once end-to-end** with transactional sinks.
- **TB-scale state**.
- **Batch as bounded stream** — same API for both.

## Where Flink Hurts

- **Operational complexity** — JobManager HA, RocksDB state tuning.
- **Memory tuning** — large state requires careful sizing.
- **Smaller ecosystem** than Spark for SQL/ML.

## Real Production

- **Alibaba** — Singles' Day; "Blink" fork upstreamed (2019).
- **Netflix** — Keystone for real-time CDN routing.
- **Uber** — financial pipelines.
- **Stripe** — fraud detection.
- **Ververica** — commercial vendor (acquired by Alibaba 2019).

## Lessons

- Event-time semantics are non-negotiable for correctness in streaming systems.
- Distributed snapshots (Chandy-Lamport) give exactly-once cleanly.
- Stateful stream processing at TB scale is feasible with RocksDB-backed state.
- Batch and stream unify under a streaming engine more naturally than under a batch engine.

## Related Concepts

- [[Stream Processing]] — fundamentals.
- [[Stream Windowing]] — event-time windows.
- [[Apache Spark]] — competitor (more batch-leaning).
- [[Apache Storm]] — predecessor (less robust).
- [[Apache Kafka]] — common source/sink.
- [[Kappa Architecture]] — Flink is the natural Kappa engine.

## Active Recall Questions

What does Flink offer that Storm and Spark Streaming did not?::True event-time semantics with watermarks, end-to-end exactly-once via consistent checkpoints, TB-scale stateful processing — all with record-at-a-time (not micro-batch) latency.

What is a watermark in Flink?::A signal carrying "no more events with timestamp ≤ T"; allows event-time windows to close at the right moment and bounds the wait for out-of-order data.

How does Flink achieve exactly-once?::Distributed checkpoints (Chandy-Lamport barriers); on failure, roll back state to last checkpoint and replay from source offset; combined with transactional sinks for end-to-end EO.

What backs large Flink state?::RocksDB state backend (LSM-based); spills to disk; supports TB-scale state per job.

What's the trade-off Flink makes vs Spark Streaming?::Better event-time correctness, lower latency, stronger exactly-once at the cost of operational complexity and a smaller ecosystem.

What is allowed lateness in event-time windowing?::Tolerance for events arriving after the watermark passed; updates closed windows for late events; balances completeness vs latency.

What is Blink and how did it relate to Flink?::Alibaba's Flink fork (2017–2019) with major performance and SQL improvements; upstreamed into mainline Flink in 2019.

## Feynman Test

Explain to a Spark engineer why Flink's micro-batching alternative produces different results for "event count per 1-minute window" when events arrive out of order.

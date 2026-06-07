---
title: Pipeline Architecture
area: architecture-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Event-Driven Architecture]]", "[[Stream Processing]]"]
sources:
  - FoSA, Ch. 11
tags: [architecture, pipeline]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Pipeline Architecture

## Executive Summary

**Pipeline Architecture** (also: Pipes and Filters) chains processing **stages where the output of each becomes the input of the next**. The canonical model of **Unix shell pipelines, ETL jobs, compilers, data processing frameworks**. Each filter (stage) does one thing; pipes carry data. Simple, composable, parallelizable. The granddaddy of stream processing.

## Why This Exists

Many problems decompose naturally into sequential stages: input → parse → transform → enrich → output. Putting each stage in a separate, composable unit yields reusable filters, easy debugging (inspect each stage), and natural parallelism (pipeline parallelism).

## Core Intuition

Unix shell: `cat file | grep "ERROR" | sort | uniq -c`. Each command is a filter; pipes carry data between. Each filter is simple; the pipeline composes complex behavior.

## Internal Mechanics

**Components:**
- **Pipes** — carry data between filters.
- **Filters** — process one input → one output.

**Filter types:**
- **Producer** — generates output (no input).
- **Transformer** — transforms input to output.
- **Tester** — passes or rejects (boolean).
- **Consumer** — final sink.

**Execution:**
- Sequential or parallel (stages overlap).
- Often streaming (data flows through; not all in memory).

## Real Production Examples

- **Unix shell pipelines.**
- **Compilers** (lexer → parser → optimizer → codegen).
- **ETL tools** (Airbyte, Fivetran).
- **Apache NiFi, Apache Beam.**
- **GStreamer** (media).
- **CI/CD pipelines.**

## Design Tradeoffs

**Benefits:**
- Reusable filters.
- Easy to understand.
- Naturally parallel.
- Easy debugging (inspect intermediate output).

**Costs:**
- Serialization between stages.
- Pipeline-wide changes hard.
- Doesn't fit non-linear flows.

## Interview Perspective

**Common questions:**
- "What's pipeline architecture?" → Chained filters; output of one is input of next.
- "When use it?" → Sequential transformations; data processing; ETL; compilers.
- "Pipeline vs EDA?" → Pipeline: linear, deterministic. EDA: graph, dynamic.

**Senior-level:**
- Pipeline architecture predates modern terminology; it's been around since Doug McIlroy's Unix work (1970s).
- Modern stream processing (Kafka Streams, Flink) is pipeline architecture at network scale.
- Often nested in larger architectures.

**Common mistakes:**
- Forcing pipeline onto non-linear flows.
- Stages with internal state (defeats reusability).
- Fan-out / fan-in in pure pipeline — needs more.

## Related Concepts

- [[Event-Driven Architecture]] · [[Stream Processing]]

## Misconceptions

- **"Pipeline = batch processing."** Streaming pipelines are common.
- **"Filters must be stateless."** Stateful filters exist; trade reusability.
- **"Pipelines don't scale."** Modern distributed pipelines (Flink, Spark) scale enormously.

## Failure Scenarios

- **Slow stage** stalls the pipeline.
- **Stateful filter** breaks parallelism.
- **Branching needed** — pure pipeline doesn't handle.

## Practical Engineering Heuristics

- **Use for sequential transformations.**
- **Stateless filters** when possible.
- **Streaming when data is large.**
- **For non-linear flows, use EDA or workflows.**

## Active Recall Questions

What's Pipeline Architecture?::Chained processing stages (filters) connected by pipes. Output of one becomes input of next.

Name three pipeline systems.::Unix shell, compilers, ETL tools, Apache Beam, GStreamer, CI/CD.

Pipeline vs EDA?::Pipeline: linear, deterministic. EDA: graph-shaped, dynamic, event-driven.

What's a filter?::Processing unit that takes input, produces output. Stateless ideally.

When use pipeline?::Sequential transformations: data processing, compilers, ETL.

Why is the pipeline metaphor natural in Unix?::McIlroy's pipe operator made composition trivial; tools became filters; complex behavior from simple parts.

## Feynman Test

A log analysis pipeline: read → parse → filter ERRORs → group by hour → write. Design with pipeline architecture.

Why is "pipeline" sometimes too rigid? When does EDA win?

## Mastery Checklist

- **Explain** pipeline architecture.
- **Compare** with EDA.
- **Derive** when pipeline fits.
- **Critique** non-linear flows forced into pipeline.
- **Design** a streaming pipeline for log processing.

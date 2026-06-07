---
title: MapReduce
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Batch Processing]]"]
related: ["[[Batch Processing]]", "[[Apache Spark]]", "[[MapReduce (Google)]]"]
sources:
  - Dean & Ghemawat (Google MapReduce paper, 2004)
  - DDIA Ch.10
tags: [data-engineering, batch, mapreduce]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# MapReduce

## Executive Summary

**MapReduce** (Dean & Ghemawat, Google 2004) is the **foundational distributed batch-processing model**: **Map** (transform each input record) → **Shuffle** (group by key) → **Reduce** (aggregate per key). Inspired by functional programming primitives. Hadoop implemented it for the OSS world (2006); spawned the big data era. Today **largely replaced by [[Apache Spark|Spark]]**, but the conceptual model remains foundational for understanding distributed batch.

## Why This Exists

Pre-MapReduce: distributed computation was custom per problem. Google's contribution: a simple, restricted model that fits many problems and scales automatically across thousands of machines with built-in fault tolerance. Made distributed batch processing accessible.

## Core Intuition

Counting words in a billion documents:
1. **Map:** for each document, emit (word, 1) for every word.
2. **Shuffle:** group all (word, 1)s by word.
3. **Reduce:** for each word, sum the 1s.

Map runs in parallel across documents. Reduce runs in parallel across words. Scales linearly.

## Internal Mechanics

**Algorithm:**

```
Map phase:
  input: (key, value)
  output: list of (key', value')

Shuffle (framework):
  groups output by key'

Reduce phase:
  input: (key', list of values')
  output: list of (key'', value'')
```

**Properties:**
- Map functions are pure (no side effects).
- Shuffle is the network-intensive step.
- Reduce per key is independent → parallel.
- Fault tolerance: re-run failed tasks (Map is pure).

## Real Production Examples

- **Google internal** — originated here.
- **Hadoop MapReduce** — open-source implementation.
- **PageRank computation.**
- **Log analysis at scale.**
- **Indexing for search.**

Modern: largely replaced by Spark which subsumes MapReduce as a special case.

## Design Tradeoffs

**Benefits:**
- Simple model.
- Automatic parallelism.
- Built-in fault tolerance.
- Scales to thousands of nodes.

**Costs:**
- **Rigid model** — only Map + Reduce.
- **Disk-based** between stages (slow).
- **Verbose** for multi-stage pipelines.
- **Latency** — minutes minimum.

## Why Replaced

Spark improvements:
- In-memory between stages (faster).
- Richer operators (joins, filters, aggregations).
- Iterative algorithms (MapReduce required chaining jobs).
- Better APIs.

## Interview Perspective

**Common questions:**
- "What's MapReduce?" → Distributed batch model: Map → Shuffle → Reduce.
- "Famous origin?" → Dean & Ghemawat, Google 2004 paper.
- "Why replaced?" → Spark in-memory, richer ops, easier multi-step.

**Senior-level:**
- The MapReduce paper is foundational reading. Started the big-data era.
- Hadoop's MapReduce launched a whole ecosystem (Hive, Pig, HBase).
- Even though direct use rare, the concept underlies all modern batch.

**Common mistakes:**
- Using MapReduce directly when Spark / SQL is better.
- Confusing MapReduce framework with the model.

## Related Concepts

- [[Batch Processing]] · [[Apache Spark]] · [[Hadoop]]

## Misconceptions

- **"MapReduce = Hadoop."** Different — model vs implementation.
- **"MapReduce is dead."** Direct use, mostly. Concept lives in Spark.

## Failure Scenarios

- **Shuffle bottleneck** under bad partitioning.
- **Long iterative pipelines** — chained MapReduce jobs slow.

## Practical Engineering Heuristics

- **Use Spark, not MapReduce directly.**
- **Understand the model — it underlies modern engines.**

## Active Recall Questions

What's MapReduce?::Distributed batch model: Map (transform) → Shuffle (group by key) → Reduce (aggregate).

Who originated?::Dean & Ghemawat, Google 2004 paper.

What replaced direct MapReduce use?::Apache Spark — in-memory, richer ops, easier iteration.

Why is shuffle the bottleneck?::Network-intensive — all output of Map phase reshuffles across cluster by key.

Why was Map function pure?::Enables fault tolerance — failed task safely re-run.

What's the OSS Hadoop equivalent?::Hadoop MapReduce — implemented model in Java; started big-data ecosystem.

## Feynman Test

Implement word count with MapReduce. Identify Map, Shuffle, Reduce.

Why is the Map function being pure essential for fault tolerance?

## Mastery Checklist

- **Explain** MapReduce model.
- **Compare** with Spark.
- **Derive** map/reduce decomposition.
- **Critique** direct use today.
- **Design** MapReduce for given aggregation.

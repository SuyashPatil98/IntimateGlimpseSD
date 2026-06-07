---
title: DAGs
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Orchestration]]"]
related: ["[[Apache Airflow]]", "[[Apache Spark]]", "[[MapReduce]]"]
builds_toward: ["[[Data Lineage]]"]
sources:
  - Data Engineering Cookbook (Kretz)
  - Airflow docs — Concepts/DAG
  - DDIA Ch.10, pp. 421-425
  - Dagster docs — "Software-defined assets"
tags: [data-engineering, orchestration, graphs]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# DAGs

## Executive Summary

A **Directed Acyclic Graph (DAG)** is the canonical structure for expressing dependencies between tasks: nodes are tasks, edges are "happens-before" relations, and acyclicity guarantees a valid execution order exists. In data engineering, "DAG" usually means a pipeline definition consumed by an orchestrator like [[Apache Airflow]]. The same abstraction underlies query planners ([[Apache Spark]] physical plans, BigQuery), build systems (Bazel), and ML training graphs.

## Why This Exists

Tasks have ordering constraints: load before transform, transform before publish, train before serve. Expressing these as code that the runtime can introspect — instead of hardcoded shell pipelines — unlocks parallelism, dependency-aware retries, partial reruns, and visualization.

## Core Intuition

If you can draw it on a whiteboard with arrows and never need to draw a cycle, it's a DAG. A topological sort gives you the execution order; independent branches run in parallel.

```
        ┌─ transform_users ─┐
extract ┤                    ├─ join ─ load ─ notify
        └─ transform_orders ┘
```

## Formal Definition

A DAG is a directed graph $G = (V, E)$ with no directed cycles. Equivalently: there exists a **topological order** $v_1, \dots, v_n$ such that for every edge $(v_i, v_j) \in E$, $i < j$.

## Internal Mechanics

The orchestrator's scheduler:
1. Parses the DAG (in Airflow, by executing a Python file).
2. Computes the set of **ready tasks** — those whose upstream dependencies are all `success`.
3. Submits ready tasks to executors.
4. On completion, updates state; recomputes ready set.
5. Repeats until all tasks terminal.

**Trigger rules** customize the "ready" predicate: `all_success` (default), `all_done`, `one_success`, `none_failed`, `none_skipped`.

**Dynamic DAGs** (TaskFlow API, dynamic task mapping in Airflow 2.3+) generate tasks at runtime based on data — e.g., one task per S3 partition.

## Design Tradeoffs

**Why acyclicity:** cycles imply mutual waiting (deadlock) or unbounded execution. Iterative workflows fake cycles with separate DAG runs per iteration.

**Static vs dynamic:** static DAGs are easier to reason about and visualize; dynamic DAGs handle variable fan-out (one task per file, one per tenant) but complicate debugging.

**Granularity:** one mega-DAG centralizes coordination but couples teams and blows up on partial failure. Many small DAGs with cross-DAG sensors decouple but lose end-to-end visibility.

**Costs:** the DAG-as-Python-code in Airflow means the *graph structure* itself is executed every scheduler tick; heavy imports or DB calls at module level cripple scheduling.

## Real Production Examples

- **Airflow DAGs** — Python file declaring `DAG()` and `Task()`s with `>>` operators.
- **Spark physical plan** — Catalyst produces a DAG of stages; the DAG scheduler maps stages to executors.
- **Dagster software-defined assets** — invert the model: declare *assets* (datasets), let Dagster derive the DAG.
- **dbt** — `ref()` calls between models produce a DAG of SQL transformations.
- **Bazel / Buck** — build graphs are DAGs; incremental builds reuse subgraph results.

## Misconceptions

- **"DAGs guarantee parallelism."** No — only *independent* branches run in parallel; a serial chain runs serially.
- **"DAGs imply batch."** False — streaming systems (Flink, Spark Structured Streaming) also build DAGs of operators.
- **"More tasks = better observability."** Past a point (~100), DAGs become unreadable; group into logical sub-DAGs / TaskGroups.

## Failure Scenarios

- **Cycle introduced by refactor** — orchestrator refuses to load DAG. Mitigation: DAG-validation unit tests.
- **Long serial chain** — adds latency proportional to chain depth; refactor to fan out earlier.
- **Hot upstream** — a single source feeding 100 downstreams becomes a bottleneck; cache its output.
- **DAG-parse OOM** — DAG file does heavy work at import time; scheduler crashes.

## Interview Perspective

- *"Why is the execution graph in Spark a DAG, not a tree?"* → operators with multiple inputs (joins, unions) require multiple parents; DAG captures this.
- *"How would you parallelize a 10-step pipeline?"* → identify independent subgraphs in the DAG; introduce fan-out keys.
- Mistake: drawing a "DAG" that's actually a list.

## Related Concepts

- [[Orchestration]] — DAGs are the artifact orchestrators execute.
- [[Apache Airflow]] — declares DAGs as Python.
- [[Apache Spark]] — query plans compile to a stage DAG.
- [[MapReduce]] — the chain Map→Shuffle→Reduce is a trivial DAG.
- [[Data Lineage]] — lineage graphs are derived DAGs at the asset/column level.

## Practical Engineering Heuristics

- Keep DAG files **declaration-only** — no I/O at module load.
- Use **TaskGroups** (Airflow 2.x) to chunk visually.
- One DAG = one team's responsibility = one SLA, usually.
- Test DAGs: `pytest` that imports each DAG and asserts no cycles, no orphan tasks.

## Active Recall Questions

What does DAG stand for?::Directed Acyclic Graph.

Why must task-dependency graphs be acyclic?::Cycles imply mutual waiting (deadlock) or unbounded re-execution; topological order requires no cycles.

What is a topological sort and why does it matter for DAGs?::A linear ordering consistent with edges; it gives a valid serial execution order, used by schedulers.

What is the difference between a static and a dynamic DAG?::Static DAGs are fixed at definition; dynamic DAGs (e.g., Airflow dynamic task mapping) generate tasks at runtime from data.

Why can heavy work at DAG-file import time crash the scheduler?::Airflow re-imports DAG files every few seconds; expensive imports compound and starve the scheduler.

Give two non-orchestration uses of DAGs in data systems.::Spark physical plans, dbt model graphs, Bazel build graphs, MapReduce stage chains.

Name three Airflow trigger rules other than all_success.::all_done, one_success, none_failed, none_skipped, one_failed.

## Feynman Test

Convince a junior engineer that a DAG is a richer specification than a numbered TODO list — what does the graph give you that the list can't?

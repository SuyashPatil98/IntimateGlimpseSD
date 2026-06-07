---
title: Data Lineage
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Orchestration]]", "[[DAGs]]"]
related: ["[[Data Quality]]", "[[Schema Evolution]]", "[[Apache Airflow]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - Data Engineering Cookbook (Kretz)
  - OpenLineage spec (openlineage.io)
  - Marquez project (Lyft / LF AI & Data)
  - DataHub docs (LinkedIn / Acryl)
  - Amundsen docs (Lyft)
  - Google Goods paper (2016)
tags: [data-engineering, lineage, governance]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Data Lineage

## Executive Summary

**Data lineage** is the recorded provenance of data: which inputs produced which outputs, via which transformations, when, by whom. It's the audit trail and dependency graph of the warehouse — answering "where did this column come from?" and "what breaks if I change this table?" Modern lineage spans pipeline-level (Airflow → BigQuery) and column-level (this `revenue` column = sum of `orders.amount`).

## Why This Exists

When a dashboard goes red, the analyst needs to walk *backward* through transformations to find the source. When a PII rule changes, the security team needs to know every place a column flows. When a producer wants to drop a column, they need to know who consumes it. Without lineage, this is `grep` archaeology across hundreds of SQL files.

## Core Intuition

Lineage is a graph: **datasets** are nodes, **jobs** that read inputs and write outputs are the edges (or vice versa). At the coarse end, "table → table". At the fine end, "column → expression → column". It's the [[DAGs|DAG]] of your *data*, not your *tasks*.

## Internal Mechanics

**Capture methods:**
1. **SQL parsing** — analyze `INSERT ... SELECT` to derive column-level lineage (dbt, sqlglot, DataHub).
2. **Runtime instrumentation** — orchestrator emits events on task start/end with input/output URIs (OpenLineage from Airflow, Spark, dbt).
3. **Manual annotation** — producers tag datasets/columns; brittle, used for systems that can't be instrumented.

**OpenLineage standard:**
- Events: `START`, `COMPLETE`, `FAIL`.
- Each event references: job (namespace, name), run (id), inputs[], outputs[] (with optional facets: schema, column lineage, data quality).
- Vendor-neutral; emitters in Airflow, Spark, dbt, Flink.

**Storage / query:**
- Catalog stores the graph (Marquez, DataHub, Amundsen, Atlan, Collibra).
- UI lets users navigate upstream/downstream; impact analysis queries.

## Architecture Diagrams

```
source_db ──► raw.orders ──► stg.orders ──► mart.daily_revenue ──► dashboard
              │                                  ▲
              └──► raw.events ──► stg.events ────┘

   (each arrow = a job/transformation, emitting OpenLineage events to a catalog)
```

## Design Tradeoffs

**Coarse vs column-level:** table lineage is cheap and broadly available; column-level requires SQL parsing and is expensive but powerful (GDPR/privacy compliance, precise impact analysis).

**Push vs pull:** push (runtime emission) is accurate but couples producers to lineage infra; pull (periodic SQL scan) is decoupled but stale.

**Centralized catalog vs federated:** centralized (DataHub) simplifies discovery; federated (per-domain) fits data mesh but loses global view.

**Cost:** capturing lineage for every job-run produces enormous event volume; sampling and roll-up are necessary at scale.

## Real Production Examples

- **LinkedIn DataHub** — open-source catalog with lineage, popularized in industry.
- **Lyft Amundsen + Marquez** — discovery (Amundsen) + lineage (Marquez); Marquez is the OpenLineage reference.
- **Airbnb Dataportal** — internal.
- **Uber Databook** — internal, columnar lineage.
- **Google Goods** — 2016 paper on warehouse-scale dataset catalog.
- **Acryl, Atlan, Monte Carlo, Collibra** — commercial.

## Misconceptions

- **"Lineage = data catalog."** A catalog includes lineage but also schema, ownership, freshness, quality scores, documentation.
- **"Lineage solves data quality."** No — it explains failures faster but doesn't prevent them. Pair with [[Data Quality]] checks.
- **"Column-level lineage is automatic."** Only for SQL transformations that can be parsed; UDFs, Spark code, Python transforms are opaque without explicit instrumentation.

## Failure Scenarios

- **Stale lineage** — pipelines change weekly; lineage scraped monthly is wrong. Mitigation: runtime emission.
- **Lineage gap at boundaries** — pipeline crosses a system without OpenLineage support; chain breaks. Mitigation: shim emitters.
- **Misleading column lineage** — `SELECT *` propagates all columns; lineage flags everything as influencing everything. Mitigation: explicit column lists, expression-aware parsing.
- **Lineage tracked, never used** — UI exists but no one references it during incidents. Mitigation: link from dashboards, embed in on-call runbooks.

## Interview Perspective

- *"You need to deprecate column X. How do you assess impact?"* → query lineage catalog for downstream consumers; notify owners; deprecation window.
- *"A PII column was accidentally exposed in a dashboard. Trace it."* → reverse lineage from dashboard query upstream to original table.
- *"How do you build column-level lineage for a Spark job?"* → emit OpenLineage with `columnLineage` facet from the Spark listener.
- Mistake: confusing lineage with dependency in the orchestrator's DAG; orchestrator dependency is task-level, lineage is dataset/column-level.

## Related Concepts

- [[Data Quality]] — lineage scopes the blast radius of quality failures.
- [[Schema Evolution]] — lineage informs which consumers must adapt.
- [[DAGs]] — lineage graphs *are* DAGs (over data, not tasks).
- [[Orchestration]] — orchestrators are natural emission points.
- [[Apache Airflow]] — supports OpenLineage emission via `openlineage-airflow`.
- [[Distributed Tracing]] — analogous concept for requests; same shape, different domain.

## Practical Engineering Heuristics

- Emit lineage from **runtime**, not by static SQL scan, where possible.
- Adopt **OpenLineage** for vendor independence.
- Surface lineage in **dashboard tooltips** and **alert payloads** so engineers see it in context, not as a separate tool.
- Pair lineage with **ownership metadata** — a graph without "who do I call?" is incomplete.
- Track **column-level** for PII / regulated columns at minimum.

## Active Recall Questions

What is data lineage?::The recorded provenance of data — which inputs produced which outputs via which transformations, captured as a graph of datasets and jobs.

What is OpenLineage?::A vendor-neutral standard for emitting lineage events (START/COMPLETE/FAIL) with job, run, input, and output references; emitters exist for Airflow, Spark, dbt, Flink.

What is the difference between table-level and column-level lineage?::Table-level tracks which tables flow into which; column-level tracks expressions on individual columns — required for fine-grained impact analysis and privacy compliance.

Why is "SQL parsing" not sufficient for capturing all lineage?::UDFs, Spark/Python transforms, and dynamic SQL are opaque to parsers; runtime instrumentation is needed for full coverage.

Give two distinct uses of lineage during an incident.::Reverse: trace a bad downstream value to its source. Forward: assess which consumers a producer change will break.

How does data lineage differ from a task-DAG in Airflow?::The task-DAG tracks task ordering; lineage tracks dataset (and column) flow. They overlap but are not the same — a task can produce zero or many datasets.

Name three popular lineage / catalog systems.::DataHub (LinkedIn), Marquez (Lyft, OpenLineage reference), Amundsen (Lyft), DataHub, Atlan, Monte Carlo, Collibra.

## Feynman Test

Explain the value of column-level lineage to a privacy officer: why is "this PII column flows into table X" insufficient, and what does column-level give them?

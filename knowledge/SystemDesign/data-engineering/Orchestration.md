---
title: Orchestration
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Batch Processing]]", "[[ETL vs ELT]]"]
related: ["[[DAGs]]", "[[Apache Airflow]]", "[[Data Quality]]", "[[Data Lineage]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - Data Engineering Cookbook (Kretz), "Workflow Orchestration"
  - Airflow docs (airflow.apache.org)
  - DDIA Ch.10, pp. 419-422 ("Workflows")
  - Maxime Beauchemin, "The Rise of the Data Engineer" (2017)
tags: [data-engineering, orchestration, pipelines]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Orchestration

## Executive Summary

**Orchestration** is the coordination of multi-step data workflows — scheduling tasks, managing dependencies, handling retries on failure, and tracking state. Where a single job runs one transformation, an orchestrator runs *hundreds* of interdependent jobs across heterogeneous systems (warehouses, lakes, ML training, dashboards). Modern orchestrators (Airflow, Prefect, Dagster, Argo) express pipelines as code, usually as a [[DAGs|DAG]].

## Why This Exists

Production data work is rarely one job. A daily pipeline might: extract from 12 source systems, land raw data in S3, validate schemas, transform into a warehouse, materialize aggregates, train an ML model, push features to a feature store, and refresh BI dashboards. Each step has dependencies, SLAs, and failure modes. Cron + bash is the naive answer; it collapses under: cross-job dependencies, partial failures, backfills, observability, dynamic parameters, and team coordination.

## Core Intuition

An orchestrator is to data jobs what Kubernetes is to containers: a scheduler that knows the *shape* of your workload (the DAG), tracks state per task, and reconciles desired vs actual.

Three jobs the orchestrator does:
1. **Schedule** — fire workflows on time / on event / on signal.
2. **Coordinate** — run task B only after task A succeeds; fan-out/fan-in across partitions.
3. **Recover** — retry, alert, backfill missed runs, allow manual reruns.

## Internal Mechanics

A typical orchestrator has:
- **Scheduler** — parses DAGs, decides which tasks are ready, enqueues them.
- **Executor / Worker pool** — runs tasks (LocalExecutor, CeleryExecutor, KubernetesExecutor in Airflow).
- **Metadata DB** — task state (queued/running/success/failed), run history, XComs (small data passed between tasks).
- **Web UI** — DAG visualization, log access, manual triggers, backfill.

**Task lifecycle:** `scheduled → queued → running → {success | failed | retry}`. Failure triggers retry policy (max retries, backoff, alerts).

**Backfill** is first-class: re-run a window of historical runs (e.g., reprocess Jan 1–10 after a bug fix). This requires tasks to be **idempotent** — see [[Idempotency]].

## Design Tradeoffs

**Benefits:** central observability; declarative dependencies; built-in retry/alerting; backfill; pipeline-as-code (review, version, test); rich UI.

**Costs:** the orchestrator itself becomes critical infrastructure — its failure stops every pipeline. Operational burden (DB, scheduler HA, executor scaling). DAG-as-code creates a steep learning curve; complex DAGs become unreadable.

**Failure modes:**
- **Cascading skips** — one upstream failure marks dozens of downstreams `upstream_failed`.
- **Scheduler lag** — under-provisioned scheduler delays task start; SLAs miss.
- **State drift** — manual `success` marks lie to downstream consumers.
- **Side-effects in DAG parsing** — DAG files re-imported every few seconds; expensive imports kill the scheduler.

## Real Production Examples

- **Airbnb** — open-sourced [[Apache Airflow]] in 2014; thousands of DAGs daily.
- **Netflix** — Maestro (replaced Meson, internal Airflow-ish).
- **Lyft, Stripe** — large Airflow installs.
- **Shopify** — moved from Airflow to Dagster citing testability and asset-based modeling.
- **GitLab, dbt Cloud** — built-in orchestrators for dbt jobs.

## Misconceptions

- **"Orchestrator = ETL tool."** No — Airflow runs tasks but rarely *does* the transformation; the heavy lifting happens in Spark, BigQuery, dbt. Airflow is the dispatcher.
- **"Cron is enough."** Cron has no dependency model, no retry, no backfill, no observability — fine for 5 jobs, untenable at 500.
- **"DAGs are static."** Modern orchestrators (Prefect, Dagster) support dynamic DAGs computed at runtime.

## Failure Scenarios

- **Scheduler down** — all DAGs stop. Mitigation: HA scheduler (Airflow 2.x), monitoring on heartbeat.
- **Metadata DB outage** — orchestrator blind to state. Mitigation: managed Postgres, frequent backups.
- **Task storms after backfill** — backfilling 90 days × 1000 partitions saturates the cluster. Mitigation: `max_active_runs`, pool limits.
- **Hidden coupling via XCom** — passing large data via XCom blows up the metadata DB. Mitigation: pass references (S3 paths), not data.

## Interview Perspective

- *"How would you schedule a daily pipeline that depends on a partner's S3 drop?"* → orchestrator + `S3KeySensor` polling or event-driven trigger.
- *"What if the partner drops 3 hours late?"* → SLA misses; sensor `timeout` + alert; backfill on arrival.
- *"How do you reprocess after a bug?"* → idempotent tasks + backfill window.
- Common mistake: conflating orchestration with transformation; sketching pipelines in cron.
- Staff-level: discuss DAG-as-code vs declarative assets (Dagster), data-aware scheduling, and reproducibility.

## Related Concepts

- [[DAGs]] — the structure orchestrators execute.
- [[Apache Airflow]] — the dominant open-source orchestrator.
- [[Data Quality]] — orchestrators commonly run validation tasks.
- [[Data Lineage]] — pipelines produce lineage as a byproduct.
- [[Idempotency]] — required for safe retries and backfills.
- [[Batch Processing]] — orchestrated workflows are typically batch.

## Practical Engineering Heuristics

- Make every task **idempotent** — assume retries.
- Externalize state to durable stores (S3/warehouse), not orchestrator metadata.
- Pipelines should be **partitioned by time** (date macros), not "latest" — reprocessability.
- Alert on **SLA miss**, not just failure; silent slowdowns kill downstream consumers.
- Treat DAG files like code: review, test (DAG-validation unit tests), and version.
- Limit DAG complexity: a DAG with >100 tasks is usually two DAGs.

## Active Recall Questions

What is the primary role of a workflow orchestrator?::To schedule, coordinate (dependency-aware), and recover multi-step data workflows expressed as a DAG.

Why is cron insufficient for production data pipelines?::No dependency model, no retries, no backfill, no observability, no cross-job coordination.

What does "backfill" mean in orchestration?::Re-running a window of historical pipeline runs (e.g., after a bug fix or schema change).

Why must orchestrated tasks be idempotent?::Because retries, backfills, and manual reruns can execute the same task multiple times; non-idempotent tasks cause duplication or corruption.

Name two failure modes specific to orchestrators.::Scheduler outage halts all DAGs; metadata DB outage blinds state tracking; DAG-parsing side effects kill the scheduler; XCom abuse blows up the metadata DB.

What is the difference between an orchestrator and an ETL engine?::The orchestrator schedules and coordinates; the ETL engine (Spark, BigQuery, dbt) performs the actual transformation. Airflow dispatches; it rarely transforms.

Why pass S3 paths rather than data through XCom?::XCom data is serialized into the metadata DB; large payloads crash the DB. Pass references.

## Feynman Test

Explain to a backend engineer who knows cron: why does a 200-pipeline org need Airflow, and what specifically about its DAG model breaks down at 2000 pipelines?

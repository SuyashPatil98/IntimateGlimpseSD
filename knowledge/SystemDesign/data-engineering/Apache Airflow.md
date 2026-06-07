---
title: Apache Airflow
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Orchestration]]", "[[DAGs]]"]
related: ["[[Data Quality]]", "[[Data Lineage]]", "[[ETL vs ELT]]", "[[Airflow (case study)]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - Apache Airflow docs (2.x)
  - Maxime Beauchemin, "Airflow: a workflow management platform" (Airbnb Eng blog, 2015)
  - Data Engineering Cookbook (Kretz)
  - DDIA Ch.10 (workflow systems)
tags: [data-engineering, orchestration, airflow, case-study]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Apache Airflow

## Executive Summary

**Apache Airflow** is the dominant open-source workflow orchestrator: pipelines as Python code, a metadata-backed scheduler, pluggable executors, and a rich web UI. Created at Airbnb (2014) by Maxime Beauchemin, donated to ASF (2016), graduated as top-level project (2019). Airflow 2.x (2020) introduced HA scheduler, TaskFlow API, dynamic task mapping, and better Kubernetes integration.

## Why This Exists

Airbnb in 2014 had hundreds of data jobs in cron and bash; failures were invisible until dashboards broke. They needed: (1) explicit dependencies, (2) retry/alert, (3) backfill, (4) a single pane to see what ran when. Airflow was the response.

## Core Intuition

Airflow is "cron for grown-ups." You write a Python file declaring a DAG; the scheduler scans the file, finds tasks ready to run, and dispatches them to workers. State and history live in a metadata DB; you watch it all in the web UI.

## Internal Mechanics

**Components:**
- **Scheduler** — parses DAG files (default every 30s), evaluates dependencies, schedules task instances. HA in 2.x: multiple active schedulers coordinate via row-level locks in the metadata DB.
- **Executor** — strategy for running tasks: `LocalExecutor` (subprocess), `CeleryExecutor` (Redis/RabbitMQ + Celery workers), `KubernetesExecutor` (one pod per task), `CeleryKubernetesExecutor` (hybrid).
- **Workers** — actually run task code.
- **Metadata DB** — Postgres or MySQL; stores DAG runs, task instances, XComs, connections, variables.
- **Webserver** — Flask app for UI.
- **Triggerer** (2.2+) — async process for deferrable operators (sensors that don't burn a worker slot).

**Key concepts:**
- **DAG** — Python file declaring tasks and dependencies.
- **Operator** — task class (`BashOperator`, `PythonOperator`, `KubernetesPodOperator`, `S3KeySensor`, etc.).
- **TaskFlow API** (2.0+) — decorator-based (`@task`) that auto-derives XCom passing; closer to native Python.
- **XCom** — small inter-task data passed via metadata DB.
- **Pools** — concurrency limits per resource (e.g., max 4 concurrent BigQuery jobs).
- **Sensors** — tasks that poll for an external condition (S3 key arrival, partition existence); deferrable variants release the worker.
- **Macros / Jinja templating** — `{{ ds }}` (execution date), enabling reproducible time-partitioned jobs.

## Architecture Diagrams

```
            ┌─────────────┐
DAG files ─►│  Scheduler  │──► queue ──► ┌──────────┐
            └──────┬──────┘              │ Workers  │
                   │                     └────┬─────┘
                   ▼                          │
            ┌─────────────┐                   │
            │ Metadata DB │◄──────────────────┘
            └──────┬──────┘
                   ▲
            ┌──────┴──────┐
            │  Webserver  │
            └─────────────┘
```

## Design Tradeoffs

**Strengths:** huge ecosystem (1000+ providers/operators), mature UI, Python-native, battle-tested at thousands of orgs.

**Weaknesses:**
- **Task-centric, not data-centric** — Airflow tracks task state, not the datasets they produce. Dagster's asset model addresses this.
- **XCom misuse** — easy to pass MB-scale data through metadata DB and crash it.
- **DAG-file re-parsing** — expensive Python imports at module level cripple scheduler.
- **No native data validation** — must bolt on Great Expectations / Soda.
- **Time-based scheduling baggage** — `execution_date` semantics (run "for" 2026-01-01 starts at 2026-01-02 00:00) confuse newcomers; Airflow 2.2 renamed to `logical_date`/`data_interval_start`.

## Real Production Examples

- **Airbnb** — origin; ~10k DAGs.
- **Lyft, Stripe, Shopify, GitLab, Twitter** — large-scale users.
- **Astronomer, AWS MWAA, GCP Composer** — managed Airflow.
- Many orgs migrate *off* Airflow to Dagster/Prefect/Temporal for asset-based models or workflow-as-code semantics.

## Misconceptions

- **"Airflow is real-time."** No — Airflow is *batch* orchestration. Minimum schedule interval ~1 min; not for sub-second pipelines.
- **"Airflow runs your transformation."** Rarely — operators usually dispatch to Spark/BigQuery/dbt. Heavy compute inside `PythonOperator` is an anti-pattern.
- **"Airflow guarantees exactly-once."** It retries on failure; tasks must be idempotent for safety.

## Failure Scenarios

- **Single-scheduler 1.x** — scheduler crash stops everything. Mitigation: upgrade to 2.x HA.
- **DAG-import error** — silently breaks scheduling for that DAG; visible only in scheduler logs.
- **Metadata DB bloat** — millions of task instances; query slowdown. Mitigation: `airflow db clean`, retention policies.
- **Celery worker zombie** — task marked running, worker died. Mitigation: `task_instance_heartbeat` checks.
- **Sensor exhaustion** — non-deferrable sensors occupy worker slots indefinitely. Mitigation: deferrable sensors via the Triggerer.

## Interview Perspective

- *"Walk through how Airflow would schedule a daily ETL with three SaaS sources."* → DAG with three extract tasks (in parallel) → join → load → publish, with `S3KeySensor`s and `email_on_failure`.
- *"How do you handle backfill 6 months of data?"* → idempotent tasks, `airflow dags backfill`, throttle with pools.
- *"What's the difference between Airflow and Spark?"* → orchestrator vs distributed compute. Airflow schedules; Spark crunches.
- Senior discussion: data-centric (Dagster) vs task-centric (Airflow); workflow-as-code (Temporal) vs DAG-as-code.

## Related Concepts

- [[Orchestration]] — Airflow is the leading implementation.
- [[DAGs]] — Airflow's primary abstraction.
- [[Data Quality]] — Airflow runs validation tasks via Great Expectations operator.
- [[Data Lineage]] — emitted to OpenLineage from Airflow.
- [[Apache Spark]] — frequently invoked by `SparkSubmitOperator`.
- [[ETL vs ELT]] — Airflow orchestrates both.

## Practical Engineering Heuristics

- Make every task **idempotent** — use date macros, write to partitioned destinations.
- **Use Operators over BashOperator** — typed parameters, retries, easier observability.
- Keep DAG file lightweight; do work *inside* tasks, not at import.
- Prefer **deferrable sensors** in long-poll scenarios.
- Use **Connections + Secrets backend**, not env vars or hardcoded creds.
- Set `max_active_runs` to prevent backfill storms.
- Adopt OpenLineage for downstream lineage tracking.

## Active Recall Questions

What year was Airflow created and by whom?::2014, by Maxime Beauchemin at Airbnb.

Name Airflow's four core components.::Scheduler, Executor + Workers, Metadata DB, Webserver. (Triggerer added in 2.2 for deferrable operators.)

What is XCom in Airflow and what's its primary risk?::Small inter-task data passed through the metadata DB; passing large payloads bloats and degrades the DB.

What problem do deferrable operators solve?::Long-polling sensors occupying worker slots; deferrable variants run on the lightweight Triggerer process.

What did Airflow 2.x's HA scheduler change?::Multiple active schedulers run concurrently and coordinate via DB row locks, eliminating the 1.x single-point-of-failure.

Why is Airflow considered "task-centric" and what alternative addresses this?::It tracks task state, not dataset state; Dagster's software-defined assets invert the model to be data-centric.

What's the difference between execution_date and data_interval_start?::Legacy execution_date = start of the data interval (one full period before the run actually fires); 2.2 renamed it to data_interval_start to clarify the semantics.

## Feynman Test

Explain Airflow's execution_date confusion to a SQL analyst: why does a "daily run for 2026-01-01" actually fire at midnight on 2026-01-02?

---
title: Data Quality
area: data-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[ETL vs ELT]]", "[[Orchestration]]"]
related: ["[[Data Lineage]]", "[[Schema Evolution]]", "[[Apache Airflow]]"]
builds_toward: ["[[Model Monitoring]]"]
sources:
  - Data Engineering Cookbook (Kretz), "Data Quality"
  - Great Expectations docs (greatexpectations.io)
  - dbt docs — "Tests"
  - Monte Carlo blog — "Five Pillars of Data Observability"
  - DDIA Ch.10 ("data quality" discussion)
tags: [data-engineering, data-quality, observability]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Data Quality

## Executive Summary

**Data quality** is the discipline of measuring and enforcing that data in pipelines is fit for downstream use: correct, complete, fresh, consistent, and conformant to schema. Mature data orgs codify expectations (Great Expectations, dbt tests, Soda) and run them as orchestrated checks; failures block downstream consumers (via "data contracts" and circuit-breaker patterns) rather than silently propagating.

## Why This Exists

Bad data is invisible until a stakeholder notices a wrong dashboard or a model retrains on poison data. By that point: trust is lost, root cause is buried under 30 transformations, and the fix is expensive. Pipelines that *test data as code* surface issues at the source, cheaply.

## Core Intuition

Treat data like code: unit-test it. Every dataset has expectations — "user_id is never null", "daily revenue should be within ±30% of yesterday", "schema matches v3.2". Codify them, run on every load, alert (or block) on failure.

## The Six Dimensions

Standard dimensions (varies by source; "Monte Carlo's 5 pillars" is a popular subset):

| Dimension | Question | Example check |
|---|---|---|
| **Freshness** | Is the data current? | `max(updated_at) > now() - 1h` |
| **Volume** | Is the row count expected? | `count` within ±20% of 7-day rolling avg |
| **Schema** | Did columns / types change? | Compare to registered schema |
| **Distribution** | Are values where we expect? | Null rate < 1%; values in known set |
| **Lineage** | Where does it come from / go to? | (See [[Data Lineage]]) |
| **Accuracy** | Does it match a source of truth? | Reconciliation with system-of-record |

## Internal Mechanics

A typical validation flow:
1. **Define expectations** — declarative checks (Great Expectations suites, dbt `tests:` blocks, Soda checks YAML).
2. **Run on every batch** — orchestrator inserts a validation task after each load.
3. **On failure** — choose policy: warn (Slack), block (fail downstream), quarantine (move to error table).
4. **Persist results** — for SLO reporting and trend analysis.

**Test types:**
- **Singular** — SQL queries returning 0 rows when valid (`select * from orders where amount < 0`).
- **Generic / parameterized** — `not_null`, `unique`, `accepted_values`, `relationships` (referential integrity).
- **Custom expectations** — domain-specific business logic.
- **Anomaly detection** — statistical (Z-score on row counts, distribution shifts).

**Data contracts** push validation *upstream*: producer teams commit to schema + SLA; CI rejects breaking changes.

## Design Tradeoffs

**Warn vs block:** blocking enforces correctness but creates fragile pipelines (one bad partner file halts the warehouse). Warning is loose. Hybrid: block on critical checks (schema, PII rules), warn on soft (volume drift).

**Coverage vs cost:** running 10k checks per pipeline is expensive; risk-rank and focus on critical tables ("certified" datasets).

**Reactive vs proactive:** post-hoc detection vs producer-side contracts. Contracts shift effort upstream; producers resist.

## Real Production Examples

- **Airbnb** — data quality scoring; Midas certifies critical datasets.
- **Netflix** — DataMesh + audit pipelines for content engineering.
- **Uber** — internal data quality framework (DQ), Databook (lineage).
- **Stripe, Convoy** — pioneers of "data contracts" in production.
- **dbt-core ecosystem** — `dbt test` widely used; `dbt-expectations` ports Great Expectations.

## Misconceptions

- **"Data quality is the analytics team's problem."** No — pollution originates upstream. Producers must own contracts.
- **"More tests = better quality."** Past a point, false positives erode trust faster than they prevent issues.
- **"Schema validation is enough."** Schema catches type errors; semantic drift (a revenue column suddenly in cents instead of dollars) passes schema but breaks dashboards.

## Failure Scenarios

- **Test fatigue** — too many soft-fail alerts → all ignored. Mitigation: tier checks, route by severity.
- **Silent backfill regression** — a backfill changes historical numbers; no test catches it. Mitigation: snapshot tests on key aggregates.
- **Test-only-in-prod** — devs don't run checks locally; CI catches nothing. Mitigation: sample-data unit tests in CI.
- **Drift in test data** — assertions hardcoded against stale baselines; pass when they shouldn't.

## Interview Perspective

- *"How would you ensure a daily revenue table is trustworthy?"* → freshness check, row-count anomaly, schema test, reconciliation with source system, alert on each.
- *"You see a bad row in production. What do you do?"* → quarantine, root-cause via lineage, fix at source, backfill, add a test that would have caught it.
- *"What's a data contract?"* → producer-side schema + SLA commitments enforced in CI/CD.
- Mistake: mixing data validation with business logic; testing only after publication.

## Related Concepts

- [[Data Lineage]] — required for root-cause analysis of quality issues.
- [[Schema Evolution]] — schema is a data-quality dimension; evolution must not break consumers.
- [[Orchestration]] — quality checks are tasks in the DAG.
- [[Apache Airflow]] — hosts validation operators.
- [[Model Monitoring]] — ML's quality discipline; data drift is a quality issue.
- [[Observability]] — "data observability" applies the metrics/logs/traces frame to data.

## Practical Engineering Heuristics

- Test at the boundary of every stage; cheap-to-run tests near ingestion.
- Use **circuit breakers**: failed checks halt downstream rather than poison silently.
- Maintain a **data SLO** per certified table (freshness, accuracy targets) and review on-call.
- Adopt **data contracts** for cross-team data; producers own schema.
- **Snapshot critical aggregates**; alert on day-over-day deltas beyond threshold.
- Quarantine bad rows to error tables; never drop silently.

## Active Recall Questions

Name five common data-quality dimensions.::Freshness, volume, schema, distribution, lineage, accuracy. (Often called "the 5 pillars of data observability.")

What is a data contract?::A producer-side commitment to schema and SLAs for a dataset, enforced in CI/CD; shifts quality enforcement upstream.

Why is "warn-only" data quality risky?::Soft-fail alerts cause fatigue; eventually all signals are ignored.

Give an example of a schema-conforming but semantically wrong change.::A revenue column silently switching units from dollars to cents — types and nullability unchanged, but downstream numbers off by 100×.

What is the trade-off between blocking and warning on a failed check?::Blocking enforces correctness but creates fragile pipelines; warning is permissive but risks unnoticed corruption.

What does "circuit breaker" mean in a data pipeline?::A failed quality check halts downstream propagation, preventing poison data from spreading.

Why does data quality require lineage?::To diagnose root cause: a bad downstream number requires tracing upstream through transformations to the offending source.

## Feynman Test

Walk a product manager through why a "100% green test suite" on the codebase does not mean the dashboards they see are trustworthy.

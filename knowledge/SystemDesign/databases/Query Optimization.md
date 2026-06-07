---
title: Query Optimization
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[Relational Databases]]", "[[Indexes]]"]
related: ["[[Indexes]]", "[[Joins]]", "[[Materialized Views]]"]
sources:
  - DDIA, Ch. 3
  - SDI vol 1
  - system-design-primer
tags: [databases, queries, performance]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Query Optimization

## Executive Summary

Query optimization is the **process by which a database picks an efficient execution plan** for a declarative SQL query. The optimizer (planner) considers indexes, join orders, access methods, and estimates costs using **statistics about table size and data distribution**. The same SQL can run 100ms or 100s depending on the plan chosen. Production debugging often means reading EXPLAIN output and nudging the planner via index hints, stats refresh, or query rewrites. Understanding query optimization separates "SQL user" from "database engineer."

## Why This Exists

SQL is declarative — you say what you want, not how. The optimizer figures out the "how." A query joining 5 tables has hundreds of possible execution orders; the optimizer picks one that should be fast given table statistics. When statistics are stale or queries are pathological, the optimizer chooses badly and queries slow down inexplicably.

## Core Intuition

A travel planner given "I want to fly NYC → Tokyo." Many routes possible (direct, via LAX, via Seoul). The planner consults flight times, costs, layovers, and picks one. SQL optimizer does the same for queries — many ways to compute the result; pick the cheapest based on what it knows about your data.

## Internal Mechanics

**Parsing → planning → execution:**

1. **Parse** SQL into a logical query tree.
2. **Rewrite** (apply heuristic transformations — push predicates down, eliminate subqueries).
3. **Plan** — enumerate candidate execution plans; estimate cost of each; pick cheapest.
4. **Execute** — run the chosen plan.

**Cost-based optimization:**
- Use statistics: table size, column distinct values, histograms.
- Estimate rows at each step.
- Estimate I/O + CPU cost.
- Pick lowest-cost plan.

**Key decisions:**
- **Index vs scan** — use an index or sequentially read the table?
- **Join order** — which tables join first? Join order is the largest determinant.
- **Join algorithm** — nested loop, hash, merge.
- **Aggregation strategy** — hash or sort-based.

**Statistics:**
- Postgres: ANALYZE updates.
- MySQL: ANALYZE TABLE.
- Stale stats → bad plans. Refresh after large data changes.

## Real Production Examples

- **PostgreSQL** — sophisticated cost-based optimizer; reads `pg_statistic`.
- **MySQL** — historically weaker; modern versions improved.
- **SQL Server, Oracle** — sophisticated optimizers; hints supported.
- **Distributed SQL (CockroachDB, Spanner)** — adds shard locality to plan choices.

## Interview Perspective

**Common questions:**
- "What does the query planner do?" → Picks an execution plan from many candidates, based on statistics and cost estimates.
- "Why might a query suddenly slow down?" → Stale stats → bad plan choice. Or table growth crossing a threshold.
- "What's EXPLAIN?" → Shows the planner's chosen plan. Essential debugging tool.

**Senior-level:**
- The biggest performance wins from query optimization come from join order changes. Bad join orders are catastrophic.
- Postgres's planner is one of the most sophisticated in open source. It can still be wrong; hint via `pg_hint_plan`.
- Modern: vectorized execution and JIT-compiled queries (Postgres, Snowflake) accelerate execution beyond planning.

**Common mistakes:**
- Not running ANALYZE after bulk loads → stale stats → bad plans.
- Trusting EXPLAIN ANALYZE row counts under low load (production has different distribution).
- "Optimizing" by adding indexes the planner doesn't actually use.

## Related Concepts

- [[Indexes]] — optimizer's primary tool.
- [[Joins]] — algorithm choice is critical.
- [[Materialized Views]] — pre-computed query results.

## Misconceptions

- **"SQL == performance."** The same query can run 100× different speeds depending on plan.
- **"Indexes guarantee fast queries."** Only if the planner uses them.
- **"EXPLAIN shows what really happened."** Some show planned; some run-and-measure (EXPLAIN ANALYZE).

## Failure Scenarios

- **Stale statistics** → wrong join order → query times out.
- **Parameter sniffing** (SQL Server) — plan cached for one parameter value; bad for others.
- **Skew** — planner assumes uniform distribution; actual data is skewed.
- **Plan flip-flop** — small changes cause planner to switch between plans erratically.

## Practical Engineering Heuristics

- **Run ANALYZE regularly**, especially after bulk loads.
- **Use EXPLAIN ANALYZE in dev** to verify plan choice.
- **Monitor slow query log** — find pathological queries.
- **Don't over-hint** — hints calcify the plan; defeats the optimizer.
- **For complex reports, consider materialized views** rather than re-computing.

## Active Recall Questions

What does a query planner do?::Picks an execution plan from many candidates based on statistics about your data and estimated costs of operations.

Why might a query suddenly become slow?::Stale statistics → bad plan. Or data growth crossing a planner threshold. Or parameter sniffing.

What's EXPLAIN?::Shows the planner's chosen execution plan. Critical debugging tool. EXPLAIN ANALYZE also executes and shows actual numbers.

What's the largest determinant of join performance?::Join order. The optimizer enumerates possible orders and picks the cheapest.

Why update statistics after bulk loads?::Optimizer relies on stats. Stale stats lead to bad plans. Run ANALYZE (Postgres) or ANALYZE TABLE (MySQL).

What's parameter sniffing?::SQL Server caches a plan based on the parameter values used at first execution. Subsequent executions reuse the plan even if parameters differ — sometimes badly.

## Feynman Test

A query suddenly takes 10 seconds instead of 100ms. Walk through the diagnostic process.

Why is join order optimization so important, and how does the optimizer reason about it?

## Mastery Checklist

- **Explain** query optimization at a high level.
- **Compare** different join algorithms in the planner's view.
- **Derive** which plan a planner is likely to choose.
- **Critique** queries with stale-stats-driven slowdowns.
- **Design** a workflow with regular ANALYZE and slow-query monitoring.

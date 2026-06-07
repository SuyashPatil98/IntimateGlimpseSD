---
title: Relational Databases
area: databases
status: mature
difficulty: beginner
prerequisites: []
related: ["[[ACID]]", "[[NoSQL]]", "[[Transactions]]", "[[Indexes]]", "[[Normalization]]"]
builds_toward: ["[[Transactions]]", "[[Indexes]]"]
sources:
  - DDIA, Ch. 2 (pp. 27–74)
  - SDI vol 1, Ch. 3
  - system-design-primer
tags: [databases, relational, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Relational Databases

## Executive Summary

A relational database organizes data into **tables of rows and columns** with **strong schemas**, queried via **SQL**, and provides **ACID** transactions. Born from Codd's 1970 paper, it remains the default choice for most workloads in 2026. Strengths: arbitrary ad-hoc queries via JOINs, strong consistency, mature tooling, decades of optimization. Weaknesses: schema rigidity, vertical-scale limits, JOIN cost at scale. Production examples: PostgreSQL, MySQL, SQL Server, Oracle. Despite NoSQL's rise, "Postgres scales further than you think" is now industry folklore.

## Why This Exists

Before relational, databases were navigational (hierarchical, network): applications walked pointers between records. Changing access patterns meant rewriting code. Codd proposed a model where data is just relations (tables), queries are declarative ("what" not "how"), and the engine optimizes execution. The shift from imperative navigation to declarative queries was revolutionary — and remains the dominant paradigm.

## Core Intuition

A spreadsheet, but with rules. Each sheet (table) has fixed columns (schema). Rows are records. Cells contain typed values. Relations between sheets are explicit (foreign keys). Queries combine sheets via JOINs. The database enforces structure; applications get correctness guarantees in exchange.

## Internal Mechanics

**Schema:**
- Tables with named, typed columns.
- Primary keys (unique row identifiers).
- Foreign keys (references between tables).
- Constraints (NOT NULL, UNIQUE, CHECK).
- Indexes for performance.

**Query language (SQL):**
- DDL — schema definition (CREATE TABLE).
- DML — data manipulation (SELECT, INSERT, UPDATE, DELETE).
- DCL — access control (GRANT, REVOKE).
- TCL — transactions (BEGIN, COMMIT, ROLLBACK).

**Execution:**
1. Parse SQL.
2. Query planner generates execution plan (uses statistics).
3. Optimizer picks cheapest plan among alternatives (JOIN orders, index choices).
4. Executor runs the plan.
5. Returns results.

**Storage:**
- Row-oriented (default — OLTP) or columnar (analytical — OLAP).
- B-tree indexes (primary, secondary).
- WAL for durability.
- MVCC for concurrency (Postgres) or 2PL (MySQL InnoDB).

## Design Tradeoffs

**Benefits:**
- Ad-hoc queries with arbitrary JOINs.
- Strong consistency, ACID guarantees.
- Mature ecosystem — tools, libraries, expertise.
- Decades of optimization.
- Schema enforces data quality.

**Costs:**
- Schema migrations are operationally heavy.
- JOINs across large tables expensive.
- Vertical scaling has limits (large machines exist but pricy).
- Sharding RDBMS is painful (vs sharded-by-default NoSQL).

## Real Production Examples

- **PostgreSQL** — feature-rich, extensible, beloved.
- **MySQL** — ubiquitous, especially in web.
- **SQL Server** — Microsoft enterprise.
- **Oracle** — legacy enterprise; expensive.
- **MariaDB** — MySQL fork.
- **CockroachDB, Spanner, YugabyteDB** — distributed SQL, scaling RDBMS horizontally.
- **SQLite** — embedded; the most-deployed database in the world (every phone, browser, OS).

## Interview Perspective

**Common questions:**
- "When would you choose SQL vs NoSQL?" → SQL: ad-hoc queries, complex relations, strong consistency. NoSQL: scale beyond single-machine, simple access patterns, flexible schema.
- "How do RDBMS handle concurrency?" → MVCC (Postgres) or 2PL (InnoDB). Both ensure serializability or weaker isolation levels.
- "Why can't RDBMS scale writes?" → Single primary; sharding is bolt-on; distributed transactions are slow.

**Senior-level:**
- "Postgres scales further than you think." Many "we need NoSQL" decisions are premature.
- Distributed SQL (Spanner, CockroachDB) blurs the SQL/NoSQL line — relational semantics with horizontal scale, at consensus-protocol cost.
- The relational model itself is timeless. What changes is the storage engine (row vs column, B-tree vs LSM).

**Common mistakes:**
- Migrating away from SQL because of premature scaling anxiety.
- Treating schema migrations as cheap (they aren't at scale).
- Ignoring index design until performance breaks.

## Related Concepts

- [[ACID]] · [[Transactions]] · [[Indexes]] · [[Normalization]]
- [[NoSQL]] — the broad alternative.
- [[OLTP vs OLAP]] — analytical vs transactional workloads.
- [[Partitioning]] — sharding RDBMS.

## Misconceptions

- **"NoSQL is always more scalable."** Distributed SQL exists. Many NoSQL stores were chosen prematurely.
- **"SQL is dead."** SQL is the universal query language; even NoSQL stores increasingly support SQL-like dialects.
- **"Schema is bad."** Schema is structure; structure prevents whole classes of bugs.

## Failure Scenarios

- **Schema migration locks table** during ALTER. Mitigation: online schema changes (gh-ost, pt-online-schema-change).
- **Bad query plan** on stats drift. Mitigation: ANALYZE, hint judiciously.
- **JOIN explosion** under skewed data.
- **Connection storm** when application restarts and hammers DB.

## Practical Engineering Heuristics

- **Default to Postgres** for new projects unless you have specific reasons otherwise.
- **Index for your queries** — measure first.
- **Avoid N+1 queries** — JOIN or batch fetch.
- **Plan for schema migrations** — online tools, backward-compatible changes.
- **Consider distributed SQL** before NoSQL when scale concerns arise.

## Active Recall Questions

What is a relational database?::A database organized as tables of rows and columns with strong schemas, queried via SQL, providing ACID transactions.

What's a foreign key?::A column whose value references the primary key of another table; enforces referential integrity.

When choose SQL over NoSQL?::Ad-hoc queries with JOINs, complex relations, strong consistency requirements, mature tooling needed.

Why is RDBMS sharding painful?::SQL features (cross-shard JOINs, transactions) don't naturally work across shards. Bolt-on sharding loses many RDBMS strengths.

What's distributed SQL?::SQL semantics with horizontal scaling. Examples: Spanner, CockroachDB, YugabyteDB. Uses consensus protocols underneath.

Name three production RDBMS.::PostgreSQL, MySQL, SQL Server, Oracle, MariaDB, SQLite, CockroachDB.

## Feynman Test

Explain why the relational model (Codd, 1970) was revolutionary compared to navigational databases.

Compare PostgreSQL and CockroachDB. Same SQL surface; different underlying architecture. Trade-offs?

## Mastery Checklist

- **Explain** the relational model and SQL.
- **Compare** RDBMS with NoSQL families.
- **Derive** when to use RDBMS vs alternatives.
- **Critique** premature NoSQL migrations.
- **Design** a service using PostgreSQL with proper indexing and migrations.

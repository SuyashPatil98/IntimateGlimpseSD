---
title: NoSQL
area: databases
status: mature
difficulty: beginner
prerequisites: ["[[Relational Databases]]"]
related: ["[[Key-Value Store]]", "[[Document Database]]", "[[Wide-Column Store]]", "[[Graph Database]]", "[[BASE]]", "[[ACID]]"]
builds_toward: ["[[Key-Value Store]]", "[[Document Database]]", "[[Wide-Column Store]]", "[[Graph Database]]"]
sources:
  - DDIA, Ch. 2
  - SDI vol 1, Ch. 3
  - system-design-primer
tags: [databases, nosql, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# NoSQL

## Executive Summary

**NoSQL** ("Not Only SQL") is an umbrella term for non-relational databases that emerged in the late 2000s to address scaling, schema flexibility, and specific workload patterns where RDBMS were impractical. Four canonical families: **[[Key-Value Store]]**, **[[Document Database]]**, **[[Wide-Column Store]]**, **[[Graph Database]]** — each suited to different access patterns. Common traits: schema flexibility (or schemaless), horizontal scaling, often [[Eventual Consistency]] in exchange for availability, simpler query model than SQL. Not a single thing — choose the right family for your workload.

## Why This Exists

By the mid-2000s, several pains hit web-scale companies: RDBMS sharding was painful; schema migrations couldn't keep up with feature velocity; horizontal scale was a structural mismatch with relational semantics. NoSQL emerged as targeted solutions: Dynamo for KV at scale, Bigtable for wide-column, MongoDB for documents, Neo4j for graphs. Each traded some SQL features (joins, ACID, ad-hoc queries) for some property (scale, flexibility, specific-pattern performance).

## Core Intuition

NoSQL is not "anti-SQL" — it's "different tools for different jobs." A KV store is a giant hash table. A document store is a hierarchical JSON-like document collection. A wide-column store is a sparse 2D map. A graph DB stores nodes and edges natively. Each excels at a workload that RDBMS handles awkwardly.

## The Four Families

**[[Key-Value Store]]:**
- Data: opaque value for each key.
- Examples: Redis, Memcached, DynamoDB (when used as KV), Riak.
- Use: caching, session storage, simple lookups.

**[[Document Database]]:**
- Data: hierarchical documents (JSON, BSON).
- Examples: MongoDB, Couchbase, Firestore.
- Use: catalogs, user profiles, content management — anywhere data is naturally hierarchical.

**[[Wide-Column Store]]:**
- Data: sparse rows with many possible columns; column families.
- Examples: Cassandra, HBase, Bigtable, ScyllaDB.
- Use: time-series, event logs, very high write throughput at scale.

**[[Graph Database]]:**
- Data: nodes and edges with properties.
- Examples: Neo4j, JanusGraph, Amazon Neptune, TigerGraph.
- Use: social networks, fraud detection, recommendation, knowledge graphs.

## Design Tradeoffs

**Common NoSQL trade-offs vs SQL:**

| Property | NoSQL | SQL |
|---|---|---|
| Schema | Flexible / schemaless | Strict |
| Joins | Limited or none | Native |
| Transactions | Often local / limited | Native ACID |
| Scaling | Horizontal native | Sharding hard |
| Query language | Specific to each | Universal SQL |
| Ad-hoc queries | Limited | Excellent |
| Consistency | Often tunable / eventual | Strong by default |

## Real Production Examples

- **Redis** (KV) — cache, session, leaderboards, pubsub.
- **MongoDB** (document) — many web apps.
- **DynamoDB** (KV/document hybrid) — Amazon retail, many AWS services.
- **Cassandra** (wide-column) — Netflix, Instagram, eBay.
- **Neo4j** (graph) — fraud detection, recommendations.
- **Bigtable** (wide-column) — Google's internal time-series and event storage.

## Interview Perspective

**Common questions:**
- "When choose NoSQL over SQL?" → Workload-specific: KV for cache; document for nested data; wide-column for write-heavy time-series; graph for connected data.
- "Is NoSQL better at scale?" → For specific workloads, yes (horizontal scaling native). For ad-hoc queries, SQL still wins.
- "Why does Cassandra exist?" → Time-series and event workloads where write throughput dominates, queries are predictable, eventual consistency is acceptable.

**Senior-level:**
- The line between SQL and NoSQL is blurring. Postgres supports JSON; MongoDB supports SQL-like queries; CockroachDB does distributed SQL. Choose semantics, not labels.
- The original NoSQL movement was a scale necessity in 2008-2012. Today, Postgres and distributed SQL cover many cases NoSQL was chosen for.
- "Schemaless" is misleading — schema exists in your application code; you've just moved it from DB to app. Trade-offs apply.

**Common mistakes:**
- Choosing NoSQL because of premature scaling anxiety.
- Choosing the wrong family — using Cassandra for ad-hoc queries hurts.
- Forgetting that "schemaless" makes data quality your problem.

## Related Concepts

- [[Relational Databases]] — the contrast.
- [[Key-Value Store]] · [[Document Database]] · [[Wide-Column Store]] · [[Graph Database]] — the families.
- [[ACID]] · [[BASE]] — consistency framings.
- [[Eventual Consistency]] · [[CAP Theorem]] — relevant when picking.

## Misconceptions

- **"NoSQL = no schema."** Schema exists in your app code. The DB just doesn't enforce it.
- **"NoSQL is always faster."** For specific workloads, yes. For arbitrary queries, often slower.
- **"NoSQL means no SQL."** "Not Only SQL" — many NoSQL stores now have SQL-like dialects.

## Failure Scenarios

- **Wrong family choice** — Cassandra for ad-hoc queries; KV when you need queries.
- **Schemaless drift** — data shapes diverge over time; bugs everywhere.
- **Lack of transactions** — partial updates leave inconsistent state.

## Practical Engineering Heuristics

- **Pick the family by access pattern**, not by buzz.
- **Default to PostgreSQL** unless workload clearly demands NoSQL.
- **Use Redis for cache**, not as primary store.
- **Use Cassandra/Bigtable for time-series at scale**.
- **Document your schema** in code even if DB is schemaless.

## Active Recall Questions

What does NoSQL stand for?::"Not Only SQL." Umbrella for non-relational databases.

Name the four NoSQL families.::Key-value, document, wide-column, graph.

When choose KV store?::Cache, session storage, simple lookups by key. Redis, Memcached, DynamoDB.

When choose document DB?::Hierarchical data (user profiles, content), schema flexibility. MongoDB, Couchbase.

When choose wide-column?::Very high write throughput, time-series, event logs, predictable queries. Cassandra, HBase, Bigtable.

When choose graph DB?::Connected data with deep traversals — social, fraud detection, recommendations. Neo4j.

What's the biggest NoSQL trade-off vs SQL?::Limited or no joins; often eventual consistency; less ad-hoc query power. In exchange: horizontal scale and schema flexibility.

## Feynman Test

A new social network is being designed. Which NoSQL family for the social graph? Which for user profiles? Which for caching? Defend.

Explain why "NoSQL is more scalable than SQL" is misleading in 2026.

## Mastery Checklist

- **Explain** the four NoSQL families.
- **Compare** them on access patterns and use cases.
- **Derive** which family suits a given workload.
- **Critique** premature NoSQL adoption.
- **Design** a multi-store architecture combining SQL and NoSQL appropriately.

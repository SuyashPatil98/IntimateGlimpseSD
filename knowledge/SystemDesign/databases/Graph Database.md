---
title: Graph Database
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[NoSQL]]"]
related: ["[[NoSQL]]", "[[Relational Databases]]", "[[Document Database]]"]
sources:
  - DDIA, Ch. 2 (pp. 49–63)
  - Neo4j documentation
tags: [databases, nosql, graph]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Graph Database

## Executive Summary

A graph database stores **nodes (entities)** and **edges (relationships)** as first-class citizens, both with properties. Queries traverse the graph efficiently — "friends of friends," "shortest path," "all transactions involving this account." Where RDBMS treats relationships as JOINs (computed per query), graph DBs store them as pointers (constant-time hops). Examples: **Neo4j, JanusGraph, Amazon Neptune, TigerGraph, ArangoDB**. Sweet spot: highly connected data with deep traversals — social networks, fraud detection, recommendations, knowledge graphs.

## Why This Exists

In RDBMS, a JOIN across N tables costs O(N) at minimum and explodes with data growth. For deep traversals (6 hops of "friend-of-friend"), the JOIN cost becomes prohibitive. Graph DBs encode relationships as direct pointers between nodes — traversal is constant-time per hop. The deeper your queries, the bigger the win.

## Core Intuition

Imagine a wiki — pages with hyperlinks. To find "pages linked from pages linked from pages linked to X," you click links three times. Each click is constant-time. In RDBMS terms, that's a self-join three times — devastating at scale. Graph DBs make those clicks the native operation.

## Internal Mechanics

**Data model:**
- **Nodes** — entities with labels and properties (e.g., `(:Person {name: "Alice"})`).
- **Edges** — typed relationships with properties (e.g., `(:Person)-[:FOLLOWS {since: 2020}]->(:Person)`).

**Storage:**
- Nodes and edges as records.
- Adjacency lists for fast neighbor lookups.
- Indexes on node properties.

**Query languages:**
- **Cypher** (Neo4j, openCypher) — pattern matching.
- **Gremlin** (Apache TinkerPop) — imperative traversal.
- **SPARQL** — for RDF triplestores.
- **GQL** (ISO standard, emerging).

**Example Cypher:**
```
MATCH (a:Person {name:"Alice"})-[:FOLLOWS*1..3]->(p:Person)
RETURN DISTINCT p.name
```
Find everyone within 3 hops of Alice via FOLLOWS edges.

## Real Production Examples

- **Neo4j** — most popular graph DB; Cypher query language.
- **Amazon Neptune** — managed; supports Gremlin + SPARQL.
- **TigerGraph** — scalable; emphasis on analytics.
- **ArangoDB** — multi-model (graph + document + KV).
- **JanusGraph** — open-source distributed graph DB.
- **Knowledge graphs** — Google's Knowledge Graph, Wikidata.
- **Fraud detection** — banks use graph DBs to find transaction rings.
- **LinkedIn's social graph, Facebook's social graph** (internal, custom).

## Design Tradeoffs

**Benefits:**
- Constant-time traversal per hop — kills deep JOINs.
- Natural for connected data.
- Expressive query patterns.

**Costs:**
- Smaller ecosystem than RDBMS.
- Operationally less mature.
- Sharding graph data is hard (edges cross shards).
- Aggregations less optimized than columnar.

## Interview Perspective

**Common questions:**
- "When use graph DB?" → Highly connected data, deep traversals (3+ hops), social/fraud/recommendation.
- "Why not just use SQL with self-joins?" → Cost explodes with hop depth. Graph DBs are O(1) per hop; SQL is O(N) per join.
- "What's Cypher?" → Neo4j's pattern-matching query language.

**Senior-level:**
- Graph DB scaling is genuinely hard — edges cross partitions, breaking the locality wins. Many "graph at scale" deployments are custom.
- For shallow queries (1-2 hops), Postgres with proper indexes often competes well. Graph DB wins as depth grows.
- Knowledge graphs are a major growing use case (Google KG, enterprise knowledge bases) — combining graph DB with semantic enrichment.

**Common mistakes:**
- Using graph DB for shallow workloads where SQL suffices.
- Underestimating operational maturity gap vs RDBMS.
- Forgetting that graph sharding is much harder than table sharding.

## Related Concepts

- [[NoSQL]] · [[Relational Databases]] · [[Document Database]]

## Misconceptions

- **"Graph DBs are always faster."** Only for deep-traversal queries. For typical CRUD, RDBMS competes well.
- **"Graphs scale linearly."** Distributing graphs is hard — edges cross shards.
- **"Graph DBs are niche."** Used by Google KG, LinkedIn, fraud detection, biotech — significant production use.

## Failure Scenarios

- **Supernode** — a node with millions of edges (celebrity, mega-account). Traversals through supernodes are slow.
- **Sharding cuts edges** — distributed graphs lose locality benefits.
- **Cypher cost explosion** under poor query design.

## Practical Engineering Heuristics

- **Use Neo4j** for standard graph workloads.
- **Limit traversal depth** in queries — explosion is real.
- **Handle supernodes specially** — cap edges, route differently.
- **For shallow queries, evaluate Postgres first** — may be sufficient.

## Active Recall Questions

What is a graph database?::Stores nodes (entities) and edges (relationships) as first-class citizens. Constant-time traversal per hop.

Why does RDBMS struggle with deep traversals?::JOIN cost grows per hop. 6-hop "friend-of-friend" is a 6-way self-join — explosively expensive.

Name three graph databases.::Neo4j, Amazon Neptune, TigerGraph, ArangoDB, JanusGraph.

What's Cypher?::Neo4j's pattern-matching query language for graphs. ISO-standardized variant: GQL.

Name three graph-DB use cases.::Social networks, fraud detection, recommendation systems, knowledge graphs, supply-chain analysis.

What's the supernode problem?::A node with millions of edges (celebrity); traversals through it dominate query time. Mitigation: special handling, cap edges, route differently.

## Feynman Test

Walk through "find all transactions within 3 hops of this account" in SQL vs in a graph DB. Where's the win?

Why is sharding a graph fundamentally harder than sharding a table?

## Mastery Checklist

- **Explain** graph DB model and traversal advantage.
- **Compare** with RDBMS for varying traversal depths.
- **Derive** when graph DB beats SQL.
- **Critique** premature graph-DB adoption.
- **Design** a fraud-detection schema using a graph DB.

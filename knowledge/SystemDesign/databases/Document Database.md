---
title: Document Database
area: databases
status: mature
difficulty: beginner
prerequisites: ["[[NoSQL]]"]
related: ["[[NoSQL]]", "[[Key-Value Store]]", "[[Wide-Column Store]]", "[[MongoDB]]"]
sources:
  - DDIA, Ch. 2
  - SDI vol 1, Ch. 3
tags: [databases, nosql, document]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Document Database

## Executive Summary

A document database stores **self-contained, hierarchical documents** — typically JSON or BSON — keyed by document ID. Each document can have its own structure (schema-flexible); fields can be deeply nested. Queries support filtering on any field, not just the key (unlike pure KV). Examples: **MongoDB, Couchbase, Firestore, AWS DocumentDB**. Sweet spot: data that's naturally hierarchical (user profiles, content, product catalogs) where you want flexibility plus querying. Often the "default NoSQL" choice for web apps.

## Why This Exists

Relational databases require shredding hierarchical data across many tables, then JOINing back. For naturally tree-shaped data (a blog post with comments and tags), this is awkward. Document DBs let you store the whole entity as one document. Combined with schema flexibility — add fields without migration — they fit fast-iterating apps well.

## Core Intuition

Imagine a collection of JSON files. Each file is a complete, self-contained record. You can index any field for fast lookup. You can update individual fields. You can query "all documents where status = active." That's a document DB.

## Internal Mechanics

**Storage:**
- Each document is a JSON/BSON blob with a unique ID.
- Documents grouped into "collections" (loosely like tables).
- Schema is flexible — different documents in same collection can have different fields.

**Indexing:**
- Primary index on document ID.
- Secondary indexes on any field (including nested fields).

**Queries:**
- Filter, project, sort by any field.
- Limited joins (MongoDB's `$lookup`, but usually denormalize instead).

**Transactions:**
- Single-document ACID (always).
- Multi-document ACID (MongoDB 4.0+).

**Sharding:**
- Distribute documents across shards by a shard key.

## Real Production Examples

- **MongoDB** — most popular; rich queries; ACID transactions (4.0+).
- **Couchbase** — document + KV + caching hybrid.
- **Firestore** (Google) — real-time sync; offline-first.
- **AWS DocumentDB** — MongoDB-compatible.
- **Elastic** — full-text search on documents.
- **PostgreSQL with JSONB** — RDBMS with strong document support.

## Design Tradeoffs

**Benefits:**
- Natural for hierarchical data.
- Schema flexibility — easy iteration.
- Query power beyond pure KV.
- Documents map well to API responses (JSON).

**Costs:**
- Limited joins — denormalize instead.
- No schema enforcement (unless explicitly added).
- Multi-document transactions are recent/limited.
- "Schemaless" can lead to data quality issues.

## Interview Perspective

**Common questions:**
- "When use document DB?" → Naturally hierarchical data, fast iteration, no need for ad-hoc cross-collection joins.
- "MongoDB vs Postgres JSONB?" → Postgres JSONB gives document features in a relational DB. Often the better choice.
- "How do you model relationships?" → Embed for one-to-few; reference for one-to-many; consider denormalization.

**Senior-level:**
- The "MongoDB vs Postgres" debate is largely settled: Postgres JSONB makes the comparison favorable to Postgres for most use cases. MongoDB still wins on sharding ergonomics.
- Document modeling discipline matters — without schema enforcement, drift produces bugs.
- "Embed or reference" is the canonical modeling question. Embed for read-heavy hierarchies; reference for shared entities.

**Common mistakes:**
- Unbounded growth in embedded arrays (comments in a post forever).
- Overusing $lookup — defeats the document model.
- No schema discipline — data shape drifts.

## Related Concepts

- [[NoSQL]] · [[Key-Value Store]] · [[Wide-Column Store]]
- [[Denormalization]] — common pattern in document DBs.

## Misconceptions

- **"Documents = no schema."** Application code has implicit schema; DB just doesn't enforce.
- **"Document DBs can't do transactions."** Modern document DBs do multi-document ACID.
- **"MongoDB is always the answer."** Postgres JSONB often wins.

## Failure Scenarios

- **Unbounded array growth** — embedded array (comments) hits document size limits.
- **Schema drift** — fields appear/disappear over time; queries return inconsistent results.
- **N+1 queries** — fetching parent + children separately when embedding would suffice.

## Practical Engineering Heuristics

- **Embed for one-to-few**, reference for one-to-many.
- **Define schema in code** even if DB is flexible.
- **Cap embedded arrays** — don't unbounded.
- **Consider Postgres JSONB** before MongoDB for new projects.

## Active Recall Questions

What is a document database?::Stores hierarchical JSON/BSON documents keyed by ID. Schema-flexible; supports queries on any field.

Name three document databases.::MongoDB, Couchbase, Firestore, AWS DocumentDB, Elastic.

When choose document DB?::Naturally hierarchical data, fast iteration, schema flexibility needed.

Embed or reference?::Embed for one-to-few relationships; reference for one-to-many or shared entities.

Why is Postgres JSONB often competitive with MongoDB?::Postgres provides document features (JSONB type, indexed) plus relational features. For many workloads, gives the best of both.

What's the "unbounded array" pitfall?::Embedding a growing list (comments, events) in a single document until it hits size limits. Plan capacity from start.

## Feynman Test

Walk through modeling a blog post with comments. Embed or reference? Defend.

Explain why Postgres JSONB often makes MongoDB unnecessary for new projects.

## Mastery Checklist

- **Explain** document DBs and the embed/reference choice.
- **Compare** with relational and KV.
- **Derive** which workloads fit document DBs.
- **Critique** "schemaless" assumptions.
- **Design** a document schema with bounded growth.

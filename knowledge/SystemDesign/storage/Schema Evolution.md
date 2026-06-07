---
title: Schema Evolution
area: storage
status: mature
difficulty: intermediate
prerequisites: ["[[Encoding Formats]]"]
related: ["[[Backward and Forward Compatibility]]", "[[Protobuf]]", "[[Avro]]", "[[Thrift]]", "[[JSON]]"]
builds_toward: ["[[Backward and Forward Compatibility]]"]
sources:
  - DDIA, Ch. 4 (pp. 111–150)
  - SDI vol 1
tags: [storage, encoding, schema]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Schema Evolution

## Executive Summary

Schema evolution is the discipline of **changing data structures over time without breaking systems that read or write older versions**. In long-lived systems, schemas change constantly: new fields, removed fields, renamed fields, restructured records. The encoding format dictates what changes are safe; the deployment strategy dictates how to roll them out. Get it wrong → broken consumers, lost data, on-call pages. Get it right → systems evolve continuously without coordinated rewrites.

## Why This Exists

Real systems don't update everything at once. A microservice deployment rolls out gradually; a Kafka topic has years of data; a database has live and historical records. During any change, **old code reads new data** and **new code reads old data** simultaneously. Without explicit rules, these crossings produce silent corruption. Schema evolution defines the rules so changes can be made safely.

## Core Intuition

You change a form your customers fill out. Some have the old form; some have the new. Your system must handle both — old forms missing the new field, new forms with extra fields old code doesn't know about. The rules for what fields you can add/remove/rename, and what defaults to use, are schema evolution.

## Two Directions

- **Backward compatibility:** new code can read **old data**. New consumer, old producer.
- **Forward compatibility:** old code can read **new data**. Old consumer, new producer. Harder to achieve.
- **Full compatibility:** both directions work.

See [[Backward and Forward Compatibility]] for depth.

## Common Evolution Operations

| Operation | Protobuf | Avro | JSON |
|---|---|---|---|
| Add field | Safe (use new number) | Safe with default | Silent; consumer ignores unknown |
| Remove field | Reserve old number | Mark in writer schema | Silent; consumer sees missing |
| Rename field | Safe (number is key) | Use aliases | Breaks (key change) |
| Change type | Dangerous | Limited promotions | Breaks |
| Reuse field id | Catastrophic | N/A | N/A |
| Reorder fields | Safe | Safe | Safe (key-based) |

## Deployment Patterns

**Expand-Migrate-Contract:**
1. **Expand:** add new field/structure, both readable.
2. **Migrate:** populate new from old; readers shift to new.
3. **Contract:** remove old.

**Dual-write:** during transition, write to both old and new structures.

**Backfill:** historical data updated to new structure.

**Versioned APIs:** keep `/v1` and `/v2` endpoints simultaneously; consumers migrate at their own pace.

## Real Production Examples

- **Kafka with Schema Registry** — configurable compatibility (backward, forward, full). Schema changes validated at publish time.
- **Protobuf at Google** — schemas evolve constantly with field-number discipline.
- **REST API versioning** — `/v1`, `/v2` endpoints during transition.
- **Database schema migrations** — Liquibase, Flyway, manual SQL.

## Design Tradeoffs

**Stricter rules** (Protobuf, Avro) catch errors at design/publish time.
**Looser rules** (JSON) allow rapid iteration but silent breakage.

## Interview Perspective

**Common questions:**
- "What's schema evolution?" → Changing data structures over time without breaking old/new consumers.
- "Backward vs forward compatibility?" → Backward: new code reads old data. Forward: old code reads new data.
- "How does Protobuf support evolution?" → Field numbers (renames safe), unknown-field preservation, defaults.

**Senior-level:**
- Forward compatibility is harder than backward. Old code must gracefully handle data it wasn't designed for. Achievable with unknown-field preservation (Protobuf, Avro) but requires discipline.
- Schema registries are the practical infrastructure for managed evolution at scale.
- Database schema migrations should follow expand-migrate-contract rather than big-bang changes.

**Common mistakes:**
- Renaming fields in JSON without coordination.
- Reusing Protobuf field numbers.
- Big-bang DB migrations that lock production.

## Related Concepts

- [[Backward and Forward Compatibility]] — the two directions in depth.
- [[Encoding Formats]] · [[Protobuf]] · [[Avro]] · [[Thrift]] · [[JSON]]

## Misconceptions

- **"Schema evolution = just add fields."** Removes, renames, type changes also need rules.
- **"JSON doesn't have schema evolution."** It does — just informal and easy to violate.
- **"Big-bang migrations are fine for small services."** Even small services have downtime cost; expand-migrate-contract is usually worth it.

## Failure Scenarios

- **Field reuse** in Protobuf → silent data corruption.
- **Removed required field** → consumers error.
- **No registry** → schema drift silently breaks consumers.

## Practical Engineering Heuristics

- **Use a schema registry** for binary formats.
- **Apply expand-migrate-contract** for breaking changes.
- **Version APIs** when semantic changes can't be backward compat.
- **Test old + new combos** explicitly.
- **Document evolution rules** for your team.

## Active Recall Questions

What is schema evolution?::Changing data structures over time without breaking systems that read or write older versions.

Backward vs forward compatibility?::Backward: new code reads old data. Forward: old code reads new data.

What's expand-migrate-contract?::Three-step deployment: add new structure (expand), populate it from old (migrate), then remove old (contract). Avoids breaking either old or new code.

How does Protobuf safely add a field?::New field number with a default; old consumers preserve it as unknown; new consumers use it.

What's a schema registry?::Service that stores and validates schemas. Producers publish; consumers fetch. Standard for Kafka + Avro.

Why is forward compatibility harder than backward?::Old code must gracefully handle data shapes it wasn't designed for. Requires unknown-field preservation and good defaults.

## Feynman Test

Walk through evolving a Protobuf schema: add a field, remove a field, rename a field. Which are safe?

Why does database schema migration usually need expand-migrate-contract?

## Mastery Checklist

- **Explain** schema evolution and its two directions.
- **Compare** evolution support across formats.
- **Derive** safe evolution path for a given change.
- **Critique** big-bang migration plans.
- **Design** an API with versioning and schema registry.

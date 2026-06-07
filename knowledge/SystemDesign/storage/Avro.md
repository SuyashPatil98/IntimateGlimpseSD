---
title: Avro
area: storage
status: mature
difficulty: intermediate
prerequisites: ["[[Encoding Formats]]"]
related: ["[[Encoding Formats]]", "[[Protobuf]]", "[[Thrift]]", "[[Schema Evolution]]"]
sources:
  - DDIA, Ch. 4 (pp. 122–127)
  - Apache Avro documentation
tags: [storage, encoding, avro]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Avro

## Executive Summary

Apache Avro is a **binary serialization format with schemas in JSON**, **schema embedded in data files**, and **first-class schema evolution via reader/writer schema separation**. Born in the Hadoop ecosystem (2009), it's the de facto standard for **Kafka streaming, big data pipelines, and event sourcing** where data outlives any single application version. Distinct from [[Protobuf]] by using **field names + types** (not field numbers) and supporting **schema projection** — read data written with one schema using a different, compatible schema.

## Why This Exists

Hadoop and stream processing have a distinct problem: data files written today are read years later by code that has evolved. JSON drifts; Protobuf requires careful field-number management. Avro solves this by writing the **writer's schema** with the data and letting consumers supply their own **reader's schema** — Avro reconciles the two if they're compatible. The schema is the contract; field names are stable.

## Core Intuition

Imagine archiving documents: each document includes a header describing its format. Years later, anyone reading it can interpret the bytes correctly, even if they've never seen this format before. Avro is exactly this — the data file embeds the schema. Producers write with schema A; consumers read with schema B; Avro's runtime translates if A and B are compatible.

## Internal Mechanics

**Schema in JSON:**
```json
{
  "type": "record",
  "name": "Person",
  "fields": [
    {"name": "id", "type": "int"},
    {"name": "name", "type": "string"},
    {"name": "emails", "type": {"type": "array", "items": "string"}}
  ]
}
```

**Wire format:**
- For Avro container files: schema in header + data records.
- For Kafka with schema registry: schema ID in header; consumer fetches schema by ID.
- Field-by-field encoding without field names or types in the data (those come from the schema).

**Schema resolution:**
- Reader has its own schema.
- Writer's schema travels with data (or via registry).
- Avro resolves differences: missing fields use defaults; extra fields ignored; type promotions handled.

**Evolution rules:**
- Add field with default: backward compatible.
- Remove field: forward compatible if consumers can tolerate missing.
- Rename: use aliases.
- Change type: limited (int→long, float→double safe; others restricted).

## Real Production Examples

- **Apache Kafka with Schema Registry** — Avro is the most common Kafka serialization format.
- **Hadoop ecosystem** — HDFS, Hive, Spark.
- **Confluent platform** — Avro + Schema Registry is the recommended stack.
- **Event sourcing** — events written years ago must be readable today.

## Design Tradeoffs

**Benefits:**
- Schema travels with data (or registry) — no separate schema management needed.
- Reader/writer schema separation — independent evolution.
- Schema projection — read just the fields you need.
- Smaller wire format than JSON.
- Strong evolution discipline.

**Costs:**
- Java-centric tooling (other languages less mature).
- More complex than Protobuf in some ways.
- Schema registry adds operational dependency.

## Interview Perspective

**Common questions:**
- "Avro vs Protobuf?" → Avro: schema in data/registry, field names, projection. Protobuf: field numbers, separate IDL, smaller registry need.
- "Why Avro for Kafka?" → Events are long-lived; readers may use older schemas. Avro's reader/writer separation handles this naturally.
- "What's a schema registry?" → Service that stores schemas by ID; producers register, consumers fetch. Avoids sending schema with every message.

**Senior-level:**
- Avro's schema-in-stream is the right answer for long-lived data. Years of Kafka logs can be re-read with new code.
- Confluent's Schema Registry has become the de facto standard for Kafka-Avro deployments. Provides compatibility checks at publish time.
- Avro's tooling is weakest outside JVM — Python/Go bindings exist but are less polished.

**Common mistakes:**
- Choosing Avro outside JVM ecosystems without considering tooling gap.
- Skipping schema registry — schema management becomes manual.
- Breaking compatibility rules — readers fail on old data.

## Related Concepts

- [[Encoding Formats]] · [[Protobuf]] · [[Thrift]]
- [[Schema Evolution]] · [[Backward and Forward Compatibility]]

## Misconceptions

- **"Avro = JSON wire format."** Schema is in JSON; wire format is binary.
- **"Avro and Protobuf are equivalent."** Different evolution models; different ecosystem fit.
- **"Avro requires schema registry."** Can also embed schema in file (Avro container files).

## Failure Scenarios

- **Schema registry outage** — producers/consumers can't deserialize. Mitigation: cache schemas, redundancy.
- **Incompatible schema published** — consumers break. Mitigation: registry compatibility checks.
- **Tooling gap** in non-JVM languages — debugging painful.

## Practical Engineering Heuristics

- **Use Avro for Kafka and Hadoop.**
- **Always use a schema registry** for managed evolution.
- **Configure compatibility mode** (backward, forward, full) per topic.
- **Test schema evolution** explicitly before production publish.

## Active Recall Questions

What is Avro?::Binary serialization format with schemas in JSON, schema embedded in data files or referenced via registry. Strong schema evolution support.

How does Avro's reader/writer schema separation work?::Writer's schema travels with data. Reader has its own schema. Avro resolves differences if they're compatible (defaults, projection, type promotion).

Avro vs Protobuf?::Avro: schema in data/registry, field names, projection support. Protobuf: field numbers, separate IDL, simpler but less projection.

What's a Schema Registry?::Service storing schemas by ID. Producers register; consumers fetch by ID. Standard in Kafka deployments.

Where does Avro shine?::Long-lived data (events, logs), Hadoop ecosystem, Kafka. Schema evolution over years.

What's the main tooling weakness?::Java-centric. Other languages have bindings but less polish.

## Feynman Test

Walk through Kafka publishing an Avro message: producer side, broker, consumer side. Where does the schema live?

Why does Avro's reader/writer schema model fit event sourcing better than Protobuf?

## Mastery Checklist

- **Explain** Avro and reader/writer schema separation.
- **Compare** Avro and Protobuf for streaming use cases.
- **Derive** appropriate compatibility mode for given workload.
- **Critique** Avro adoption without schema registry.
- **Design** a Kafka pipeline with Avro + Schema Registry.

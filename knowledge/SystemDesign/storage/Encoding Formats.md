---
title: Encoding Formats
area: storage
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Protobuf]]", "[[Avro]]", "[[Thrift]]", "[[JSON]]", "[[Schema Evolution]]"]
builds_toward: ["[[Schema Evolution]]", "[[Backward and Forward Compatibility]]"]
sources:
  - DDIA, Ch. 4 (pp. 111–150)
  - SDI vol 1, Ch. 6
tags: [storage, encoding, serialization, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Encoding Formats

## Executive Summary

Encoding (serialization) is the **conversion of in-memory data structures to bytes** for network transmission or disk storage. The format choice affects **size, speed, schema evolution, language interop, and debuggability**. Two main camps: **text-based** (JSON, XML, CSV) — human-readable but verbose and slow; **binary** (Protobuf, Avro, Thrift, MessagePack) — compact and fast but require schemas and tooling. Every distributed system makes this choice — implicitly or explicitly — and the consequences compound over years.

## Why This Exists

Programs operate on objects in memory; networks and disks operate on bytes. The bridge between them is encoding. The choice affects bandwidth (cost), latency (CPU), compatibility (can old code read new data?), and operational debuggability. There's no universal right answer — different workloads favor different formats.

## Core Intuition

You need to mail a complex object — say, a Lego model — to someone. You can: (1) draw a picture and describe it in English (JSON: human-readable, verbose), (2) photograph it pixel by pixel and send the binary (BSON: compact-ish, opaque), (3) send a numbered list of pieces and a schema for reassembly (Protobuf: tiny, requires schema), (4) include the schema in the package (Avro: self-describing within a stream). Each has trade-offs.

## Major Formats

| Format | Type | Schema | Size | Speed | Languages |
|---|---|---|---|---|---|
| **JSON** | Text | None | Large | Slow | Universal |
| **XML** | Text | XSD optional | Largest | Slowest | Universal |
| **CSV** | Text | None | Medium | Medium | Universal |
| **MessagePack** | Binary | None | Small | Fast | Many |
| **Protobuf** | Binary | Required (.proto) | Smallest | Fastest | Major |
| **Avro** | Binary | Required (in-stream) | Smallest | Fast | Mostly Java |
| **Thrift** | Binary | Required (.thrift) | Small | Fast | Many |
| **Cap'n Proto** | Binary | Required | Tiny | Zero-copy | Many |
| **FlatBuffers** | Binary | Required | Tiny | Zero-copy | Many |

## Internal Mechanics

**Text vs binary:**
- Text: human-readable, verbose, slow parsing, no schema needed.
- Binary: opaque, compact, fast parsing, schema typically required.

**Schema-required vs schemaless:**
- Schemaless (JSON, XML): producer/consumer agree informally. Easy iteration; brittle at scale.
- Schema-required (Protobuf, Avro, Thrift): explicit contract. Tooling validates. Schema can evolve safely.

**Compactness:** binary formats encode field numbers, not field names. Save bytes; lose self-description.

## Real Production Examples

- **JSON** — REST APIs, config files, JavaScript-heavy ecosystems.
- **Protobuf** — Google's lingua franca; gRPC; Kubernetes internals.
- **Avro** — Hadoop ecosystem; Kafka schema registry.
- **Thrift** — Facebook's internal; some open-source uses.
- **MessagePack** — Redis serialization, smaller services.
- **Cap'n Proto / FlatBuffers** — game state, very latency-sensitive.

## Design Tradeoffs

**Choose text (JSON) when:**
- Public APIs (REST).
- Debug-heavy workflows.
- JavaScript-first stacks.
- Iteration speed > efficiency.

**Choose binary (Protobuf, Avro) when:**
- Internal service-to-service.
- High volume / cost-sensitive.
- Strong schema discipline.
- Multiple languages.

## Interview Perspective

**Common questions:**
- "JSON vs Protobuf?" → JSON: human-readable, verbose, no schema. Protobuf: binary, compact, schema-required, faster.
- "Why use schemas?" → Type safety, evolution rules, smaller bytes, faster parsing.
- "When NOT use Protobuf?" → Public APIs (debugging pain), small-scale (overhead), JS-first stacks.

**Senior-level:**
- Schema evolution discipline is the underrated win of binary formats. JSON drifts; Protobuf evolves with rules.
- gRPC's choice of Protobuf isn't accidental — it requires schemas for evolution + tooling.
- Avro's "schema in stream" is interesting for batch/Kafka — schema travels with data, supports projection.

**Common mistakes:**
- Using JSON for high-volume internal traffic (cost adds up).
- Using Protobuf without schema registry (operational pain).
- Forgetting backward/forward compatibility rules during evolution.

## Related Concepts

- [[Protobuf]] · [[Avro]] · [[Thrift]] · [[JSON]]
- [[Schema Evolution]] · [[Backward and Forward Compatibility]]

## Misconceptions

- **"Binary is always better."** Operational cost (tooling, debugging) often outweighs efficiency for small services.
- **"JSON is slow."** Slow vs binary, fast enough for many workloads.
- **"All binary formats are equivalent."** Protobuf, Avro, Thrift, MessagePack have meaningful differences (schema rules, evolution model, tooling).

## Failure Scenarios

- **Schema drift** (JSON) — producers/consumers disagree silently.
- **Field-number reuse** (Protobuf) — old data interpreted with new schema; subtle corruption.
- **No schema registry** — versioning chaos.

## Practical Engineering Heuristics

- **Public APIs: JSON.** Discoverability + debuggability.
- **Internal services: Protobuf + gRPC.** Tooling, performance, evolution.
- **Streaming/Kafka: Avro with schema registry.** Schema evolution well-supported.
- **Always use schema registry** for binary formats.

## Active Recall Questions

What's encoding/serialization?::Converting in-memory data structures to bytes for network transmission or disk storage.

JSON vs Protobuf trade-off?::JSON: human-readable, verbose, slow, no schema. Protobuf: binary, compact, fast, schema-required.

Why use schema-required formats?::Type safety, smaller bytes, faster parsing, well-defined evolution rules.

What's Avro's distinguishing feature?::Schema embedded in stream/file. Supports schema projection (read with different schema than written).

When use JSON?::Public APIs, config files, JS-first stacks, debugging-heavy workflows.

When use Protobuf?::Internal services, high volume, multiple languages, gRPC, strong schema discipline.

## Feynman Test

Compare JSON, Protobuf, Avro for: external API, internal microservice, Kafka stream. Best choice each?

Why does gRPC require Protobuf rather than supporting JSON?

## Mastery Checklist

- **Explain** encoding format trade-offs.
- **Compare** JSON, Protobuf, Avro, Thrift.
- **Derive** appropriate format for given workload.
- **Critique** "binary is always faster" claims.
- **Design** a multi-format strategy across system tiers.

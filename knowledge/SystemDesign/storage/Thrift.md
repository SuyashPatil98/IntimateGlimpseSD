---
title: Thrift
area: storage
status: mature
difficulty: intermediate
prerequisites: ["[[Encoding Formats]]"]
related: ["[[Encoding Formats]]", "[[Protobuf]]", "[[Avro]]"]
sources:
  - DDIA, Ch. 4 (pp. 117–122)
  - Apache Thrift documentation
tags: [storage, encoding, thrift]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Thrift

## Executive Summary

Apache Thrift is a **binary serialization format + RPC framework** developed at Facebook (2007, open-sourced via Apache). Like [[Protobuf]] it uses **field numbers** in the wire format and requires schemas (`.thrift` files). Distinguishing feature: **bundled RPC framework** — Thrift was a complete service-stack solution from day one, not just a serialization library. Used at Facebook, Twitter (historically), Evernote, and others. Less prominent than Protobuf today (Protobuf + gRPC took over) but still in significant production deployments.

## Why This Exists

In 2007, Facebook needed a multi-language RPC system: services in PHP, Java, C++, Python, Ruby calling each other. JSON was too slow and untyped; XML was a non-starter. Thrift was designed as a complete solution — IDL + multi-language code generation + binary wire format + RPC framework. Open-sourced because the broader industry had the same problem.

## Core Intuition

Like Protobuf in spirit: define your data structures and services in an IDL; codegen client/server stubs in many languages; wire format is compact binary. Thrift differs in including the **transport, protocol, server** abstractions — a more complete RPC framework, less of a pure serialization library.

## Internal Mechanics

**Schema (`.thrift` file):**
```thrift
struct Person {
  1: required i32 id,
  2: required string name,
  3: optional list<string> emails,
}

service UserService {
  Person getUser(1: i32 id),
}
```

**Wire formats (multiple, pluggable):**
- **BinaryProtocol** — straightforward binary.
- **CompactProtocol** — variable-length encoding (smaller).
- **JSON Protocol** — text variant for debugging.

**Codegen:**
- `thrift` compiler generates code in 20+ languages.

**Versions:** Apache Thrift; Facebook Thrift (Facebook's fork with improvements, used internally).

## Schema Evolution Rules

Similar to Protobuf:
- Add field with new number: safe.
- Remove field: safe if old data is gone.
- Change field type: dangerous.
- Reuse field number: dangerous.

`required` and `optional` keywords influence compatibility — making fields `required` is generally avoided because adding required fields breaks old code.

## Real Production Examples

- **Facebook** — heavy internal use (Facebook Thrift fork).
- **Twitter** — used historically; migrated some services to Protobuf/gRPC.
- **Evernote** — service APIs in Thrift.
- **Cassandra** — RPC interface originally Thrift (now native CQL).
- **Various startups** that adopted Thrift before gRPC matured.

## Design Tradeoffs

**Benefits:**
- Multi-language support.
- Complete RPC framework (not just serialization).
- Pluggable protocols (compact, JSON, etc.).
- Production-tested at Facebook scale.

**Costs:**
- Less mindshare than Protobuf today.
- Tooling ecosystem smaller than Protobuf.
- Apache Thrift vs Facebook Thrift divergence.

## Interview Perspective

**Common questions:**
- "Thrift vs Protobuf?" → Both binary, schema-required, field-numbered. Thrift bundles RPC; Protobuf+gRPC is the equivalent modern combo. Protobuf has larger ecosystem.
- "When use Thrift?" → If you're already in a Thrift shop. New projects typically default to Protobuf + gRPC.
- "Why did Protobuf win?" → gRPC + Google's marketing + larger ecosystem. Thrift is technically fine but lost the platform war.

**Senior-level:**
- Thrift's pluggable protocols (binary, compact, JSON) are flexible; Protobuf is more opinionated.
- Facebook Thrift has continued evolving with features (Thrift2, async); Apache Thrift moves slower.
- For pure new projects in 2026, Protobuf + gRPC is the default unless specific reasons argue otherwise.

**Common mistakes:**
- Treating Apache Thrift and Facebook Thrift as interchangeable.
- Adopting Thrift when Protobuf + gRPC would serve.

## Related Concepts

- [[Encoding Formats]] · [[Protobuf]] · [[Avro]]
- [[gRPC]] — modern equivalent to Thrift's RPC layer.

## Misconceptions

- **"Thrift is dead."** Still used at Facebook scale; not dominant in new projects.
- **"Thrift = Protobuf."** Similar but different — protocols, evolution details, tooling.
- **"All Thrift is Apache Thrift."** Facebook Thrift fork is significant.

## Failure Scenarios

- Same as Protobuf: field number reuse, type changes, `required` field misuse.

## Practical Engineering Heuristics

- **New projects: prefer Protobuf + gRPC.**
- **Existing Thrift code: keep it; don't migrate without reason.**
- **Avoid `required`** — making fields required complicates evolution.
- **Use Compact protocol** for production wire format.

## Active Recall Questions

What is Thrift?::Binary serialization + RPC framework from Facebook (2007). Uses IDL with field numbers and codegen for many languages.

Thrift vs Protobuf?::Similar in concept. Thrift bundles RPC framework; Protobuf + gRPC is the equivalent. Protobuf has larger modern ecosystem.

What are Thrift "protocols"?::Pluggable wire formats: BinaryProtocol (straightforward), CompactProtocol (variable-length, smaller), JSONProtocol (debugging).

Why is Thrift's `required` keyword dangerous?::Making a field required prevents safe evolution — old code can't handle missing required fields; adding required fields breaks old data.

What's Facebook Thrift?::Facebook's fork with additional features (async, perf improvements). Diverged from Apache Thrift.

What replaced Thrift in many new deployments?::Protobuf + gRPC. Google's marketing, broader ecosystem, simpler conceptual model.

## Feynman Test

Compare Thrift and Protobuf + gRPC for a multi-language microservice architecture. What does each offer?

Why did Protobuf win the mindshare battle despite Thrift being technically comparable?

## Mastery Checklist

- **Explain** Thrift and its protocols.
- **Compare** with Protobuf, Avro.
- **Derive** when to keep Thrift vs migrate.
- **Critique** `required` field usage in Thrift schemas.
- **Design** a service API with appropriate Thrift evolution rules.

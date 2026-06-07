---
title: Backward and Forward Compatibility
area: storage
status: mature
difficulty: intermediate
prerequisites: ["[[Schema Evolution]]"]
related: ["[[Schema Evolution]]", "[[Protobuf]]", "[[Avro]]", "[[Encoding Formats]]"]
sources:
  - DDIA, Ch. 4 (pp. 112–114)
  - Kafka Schema Registry docs
tags: [storage, encoding, compatibility]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Backward and Forward Compatibility

## Executive Summary

**Backward compatibility:** newer code can read data written by older code. **Forward compatibility:** older code can read data written by newer code. Most systems aim for backward (easy); fewer achieve forward (harder); production-grade systems with rolling deployments need both. These properties enable independent deployment, gradual rollouts, and long-lived data (Kafka topics, archived files). The discipline isn't optional at scale — coordinated big-bang updates don't work past 3 services.

## Why This Exists

In real production systems, code is deployed gradually. During any rollout, old and new versions coexist. Data written by one version is read by another. Without compatibility rules: old code crashes on new fields; new code can't parse old data; consumers and producers must update in lockstep (impossible at scale). Backward and forward compatibility make independent evolution possible.

## Core Intuition

You write a journal with old paper and old pen. Years later, you've upgraded. Can you still read the old entries? (Backward compatibility — new you reads old data.) Can your friend still read the new ones with their old eyeglasses? (Forward compatibility — old reader reads new data.) Most systems guarantee the first; production systems need the second too.

## Detailed Definitions

**Backward compatibility:**
- Definition: Newer version V_n can read data written by older version V_{n-1}, V_{n-2}, ...
- Easier because the newer code can know about old patterns and handle them.
- Required for deploying new code over a long-lived data store.

**Forward compatibility:**
- Definition: Older version V_{n-1} can read data written by newer version V_n.
- Harder because old code doesn't know about future changes.
- Typically achieved via "ignore what you don't understand."
- Critical for rolling deployments and pub-sub where consumers lag producers.

**Full compatibility:** both directions work.

## How Different Formats Handle It

**Protobuf:**
- Backward: new code reads old data (missing fields use defaults).
- Forward: old code reads new data (unknown fields preserved, ignored).
- Both achievable with field-number discipline.

**Avro:**
- Backward: new schema reads old data via projection.
- Forward: old schema reads new data via projection.
- Schema registry can enforce specific compatibility modes.

**JSON:**
- Backward: usually fine — extra fields ignored, missing fields use defaults.
- Forward: usually fine — same reasons, but no enforcement.
- Drift is silent; bugs compound.

**XML:**
- Similar to JSON in flexibility, with optional XSD validation.

## Real Production Examples

- **Kafka Schema Registry compatibility modes:**
  - `BACKWARD` — new schema can read old data.
  - `FORWARD` — old schema can read new data.
  - `FULL` — both.
  - `NONE` — no checks.
- **Protobuf at Google** — both directions maintained as discipline.
- **REST API versioning** — `/v1`, `/v2` parallel deployments.

## Design Tradeoffs

**Strict full compatibility** limits what you can change:
- Can add fields (with defaults).
- Cannot remove required fields.
- Cannot change types.

**Looser compatibility** (one direction) allows more changes but constrains deployment ordering:
- Backward-only: must update consumers before producers.
- Forward-only: must update producers before consumers.

## Interview Perspective

**Common questions:**
- "Backward vs forward compatibility?" → Backward: new reads old. Forward: old reads new. Backward easier; forward harder.
- "Why do we need both?" → Rolling deployments — old and new coexist. Producers and consumers can be updated independently.
- "What's a 'breaking change'?" → A schema change that violates compatibility in the desired direction.

**Senior-level:**
- The deployment ordering trick: backward-compat lets you update *consumers first*. Forward-compat lets you update *producers first*. Choose based on operational needs.
- Many "breaking changes" can be made non-breaking via expand-migrate-contract — patient evolution beats coordinated cutover.
- Long-lived data (Kafka topics, archived files) makes forward compatibility especially important — old consumers may exist for years.

**Common mistakes:**
- Assuming JSON's flexibility means compatibility — it just makes violations silent.
- Removing fields without checking consumer code.
- Breaking forward compat in long-lived data streams.

## Related Concepts

- [[Schema Evolution]] — the parent discipline.
- [[Protobuf]] · [[Avro]] · [[Thrift]] · [[JSON]] — formats with varying support.

## Misconceptions

- **"Backward = forward."** Different. Backward = new reads old. Forward = old reads new.
- **"JSON has compatibility."** Informal at best; easy to violate silently.
- **"Full compat is always achievable."** Sometimes a change is genuinely breaking; then version it (`/v2`).

## Failure Scenarios

- **Field removed; consumer expects it** → backward break.
- **Field added without default** (Avro) → backward break.
- **Type change** → both directions break.
- **Required field added** → backward break for old data.

## Practical Engineering Heuristics

- **Default to backward compatibility** for normal evolution.
- **Add forward compatibility** for long-lived data (Kafka, archives).
- **Use registry compatibility modes** to enforce at publish time.
- **Test with old and new versions in parallel.**
- **Version when you must break** — `/v1`, `/v2`.

## Active Recall Questions

What's backward compatibility?::Newer code can read data written by older code. "New reads old."

What's forward compatibility?::Older code can read data written by newer code. "Old reads new." Harder than backward.

Why does forward compatibility require "ignore what you don't understand"?::Old code wasn't designed for newer fields/structures. Must gracefully skip rather than crash.

What's the deployment ordering implication?::Backward-compat lets you update consumers first (new readers, old data). Forward-compat lets you update producers first (old readers, new data).

What's Kafka Schema Registry's "FULL" compatibility mode?::Both backward and forward — schema changes must be safe in both directions.

When can't you avoid a breaking change?::When the semantic change is fundamental (type change, removed required field). Then version explicitly.

## Feynman Test

Walk through deploying a new field across a producer-consumer system. Which compatibility direction is needed in which order?

Why is forward compatibility critical for Kafka but less so for short-lived REST traffic?

## Mastery Checklist

- **Explain** backward and forward compatibility precisely.
- **Compare** their difficulty and deployment implications.
- **Derive** which mode fits a given workload.
- **Critique** schema changes for compatibility risks.
- **Design** a rolling-deployment-safe schema change.

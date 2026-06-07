---
title: JSON
area: storage
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Encoding Formats]]", "[[Protobuf]]", "[[Avro]]", "[[REST]]"]
sources:
  - DDIA, Ch. 4 (pp. 114–117)
  - RFC 8259
tags: [storage, encoding, json, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# JSON

## Executive Summary

JSON (JavaScript Object Notation, RFC 8259) is the **dominant text-based data interchange format** of the modern web. Six primitive types (string, number, boolean, null, object, array) — minimal, readable, universally supported. Strengths: **human-readable, debuggable, no schema required, native in JavaScript and well-supported everywhere**. Weaknesses: **verbose, slow parsing, no schema enforcement, ambiguous numbers, lacks date/binary types**. Used in REST APIs, config files, NoSQL document storage, and inter-service communication where simplicity and debuggability matter more than efficiency.

## Why This Exists

XML was the previous default — verbose, complex schema (XSD), namespace headaches. JSON emerged from JavaScript object literal syntax as a simpler alternative. Its minimalism became its strength: no schema required, no special characters, easy to inspect, parsable in any language. JSON eats the world of data interchange where compactness isn't critical.

## Core Intuition

JSON is just text representing nested objects and arrays. A computer reads the text and reconstructs the structure. Anyone can read it, edit it, paste it into a tool, and understand what it means. That readability is the killer feature.

## Internal Mechanics

**Primitive types:**
- String (UTF-8).
- Number (no distinction between int/float).
- Boolean (true/false).
- Null.
- Object (key-value pairs).
- Array (ordered list).

**Example:**
```json
{
  "id": 42,
  "name": "Alice",
  "emails": ["alice@example.com"],
  "active": true,
  "score": 99.5
}
```

**Wire format:** literal text. Parsing involves tokenizing the string, building a tree.

**Standards:** RFC 8259 (current). RFC 7159 (predecessor). Extensions: JSON5 (relaxed), JSONL (newline-delimited), JSON-LD (linked data), Canonical JSON.

## Limitations

- **No comments** (intentionally — debate about JSON5).
- **No date type** — encoded as string by convention (ISO 8601).
- **No binary type** — base64-encode binary data.
- **Numbers are ambiguous** — no native int vs float; large integers may lose precision in JS (53-bit limit).
- **No schema** in the spec — JSON Schema is an external standard.

## Design Tradeoffs

**Benefits:**
- Universally supported.
- Human-readable.
- Easy to debug with curl, browser, jq.
- No schema needed.
- Native in JS.

**Costs:**
- Verbose vs binary (3-10× larger).
- Slow parsing.
- No type safety.
- Number precision issues.
- Schema drift possible.

## Real Production Examples

- **REST APIs** — the default response format.
- **Config files** — package.json, tsconfig, many tools.
- **Document DBs** — MongoDB stores BSON (binary JSON), exposes JSON.
- **Postgres JSONB** — JSON storage with indexes.
- **Logging** — structured logs as JSON lines.

## Interview Perspective

**Common questions:**
- "When use JSON?" → Public APIs, config, JS-heavy stacks, debug-heavy workflows.
- "JSON limitations?" → Verbose, slow, no schema, number ambiguity, no comments/dates.
- "JSON vs Protobuf?" → JSON: human-readable, verbose, slow, schemaless. Protobuf: binary, compact, fast, schema-required.

**Senior-level:**
- For public APIs, JSON's debuggability outweighs efficiency. You'll inspect responses many times during development.
- JSON Schema (separate spec) provides type validation without changing the wire format. Use it for important interfaces.
- BSON (MongoDB) and Postgres JSONB are binary variants — same logical model, more efficient.

**Common mistakes:**
- Using JSON for high-volume internal traffic — cost adds up.
- Not validating with JSON Schema — silent drift.
- Sending large integers as JSON numbers — precision loss in JS clients.

## Related Concepts

- [[Encoding Formats]] · [[Protobuf]] · [[Avro]]
- [[REST]] — typically uses JSON.
- [[Document Database]] — JSON-shaped data.

## Misconceptions

- **"JSON has a schema."** It doesn't — JSON Schema is separate.
- **"JSON numbers are integers."** No type distinction; large ints lose precision in many parsers.
- **"JSON is fast."** Slow vs binary, fast enough for most uses.

## Failure Scenarios

- **Large integer precision loss** in JS clients (`Number.MAX_SAFE_INTEGER` = 2^53 - 1).
- **Schema drift** — fields appear/disappear silently.
- **Date format inconsistency** — different conventions.

## Practical Engineering Heuristics

- **Use ISO 8601** for dates: `"2026-06-02T12:00:00Z"`.
- **Stringify large integers** to avoid precision loss.
- **Use JSON Schema** for important interfaces.
- **Use JSON Lines** for streaming/logs.
- **Use binary** (Protobuf, Avro) when efficiency matters.

## Active Recall Questions

What is JSON?::Text-based data interchange format with 6 primitive types. Human-readable; widely used in APIs and config.

JSON limitations?::No native date/binary types; no schema in spec; number precision issues in JS; verbose vs binary.

What's JSON Schema?::Separate standard for describing/validating JSON structure. Not part of JSON itself.

Why might large integers cause JSON problems?::JavaScript numbers are 64-bit floats with 53-bit integer precision. Larger integers lose precision when parsed.

When choose JSON over Protobuf?::Public APIs, JS-heavy stacks, debug-heavy workflows. When debuggability > efficiency.

What's BSON?::Binary JSON used internally by MongoDB. Compact but logically JSON-equivalent.

## Feynman Test

Why is JSON the default for REST APIs but not for service-to-service traffic at Google scale?

Walk through how a large integer (e.g., user ID 2^54) gets corrupted through JSON in JavaScript.

## Mastery Checklist

- **Explain** JSON syntax and limitations.
- **Compare** with binary formats.
- **Derive** when JSON is appropriate.
- **Critique** JSON for high-volume internal traffic.
- **Design** an API contract using JSON + JSON Schema.

---
title: Design Unique ID Generator
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[4-Step Framework]]"]
related: ["[[Design URL Shortener]]", "[[Consistent Hashing]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.7 ("Design Unique ID Generator")
  - Twitter Snowflake blog (2010)
  - Instagram engineering — "Sharding & IDs at Instagram"
  - Flickr engineering — "ticket servers"
tags: [system-design-interview, classic-design, ids]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Unique ID Generator

## Executive Summary

Generate globally unique IDs across a distributed system at 10k–1M IDs/s, ideally **roughly sortable by time**, without coordination per ID. Options: UUIDs (simple, big, unsorted), DB ticket servers (centralized), Snowflake (Twitter's 64-bit time + machine + sequence — the canonical answer), MongoDB ObjectIDs (similar idea).

## Requirements

**Functional:**
- Globally unique IDs.
- Fixed-size (often 64 bits).
- Roughly time-sortable (for indexing efficiency).

**Non-functional:**
- 10k+ IDs/s per node.
- No coordination on the hot path.
- Tolerant of clock skew / restarts.

## Approaches (compare in interview)

| Approach | Size | Sortable | Coordination | Notes |
|---|---|---|---|---|
| **UUIDv4** | 128 b | No | None | Easy, big, random. |
| **UUIDv7** | 128 b | Time-sorted prefix | None | Newer, time-sortable. |
| **DB auto-increment** | 64 b | Yes | Per-write | Bottleneck at scale. |
| **Ticket server** (Flickr) | 64 b | Yes | One DB call (batched) | Centralized SPOF unless HA. |
| **Snowflake** (Twitter) | 64 b | Yes | None | Standard answer. |
| **MongoDB ObjectID** | 96 b | Yes | None | Time + machine + counter. |

## Snowflake — the standard answer

64-bit ID layout:
```
| 1 bit | 41 bits           | 10 bits         | 12 bits         |
| sign  | timestamp ms      | machine id      | sequence        |
|       | (since epoch)     | (1024 machines) | (4096 per ms)   |
```

**Capacity:**
- 41 bits ≈ 69 years from custom epoch.
- 10 bits = 1024 machines.
- 12 bits = 4096 IDs/ms/machine = **~4 M IDs/s/machine**.

**Algorithm (per machine):**
```python
on_request():
  ts = now_ms()
  if ts == last_ts:
      seq = (seq + 1) & 0xFFF
      if seq == 0:  # exhausted this ms
          wait_until(ts + 1)
          ts = now_ms()
  else:
      seq = 0
  last_ts = ts
  return (ts << 22) | (machine_id << 12) | seq
```

**Time-sortable:** higher bits are timestamp, so IDs naturally sort by creation time. This dramatically helps B-tree index locality.

## Design Deep Dive

### Machine ID assignment

- Static config (manual).
- Zookeeper / etcd ephemeral nodes (Snowflake's original approach).
- Hostname / pod ordinal in K8s StatefulSet.

### Clock skew handling

- If `now_ms() < last_ts` (clock went backwards): refuse to mint until clock catches up, or shift to "logical clock" by incrementing last_ts.
- Reject NTP step backward; only accept slew.

### Custom epoch

Choose an epoch close to system launch (e.g., 2024-01-01) to maximize remaining range.

### Sequence exhaustion

4096 IDs/ms = 4M/s/machine — almost never exhausted. If it is, busy-wait until next ms.

### UUIDv7 alternative

Newer standard: 48-bit Unix epoch ms + version/variant + 74 bits randomness. Time-sortable like Snowflake but 128 bits and no coordination at all.

## Failure Modes

- **Two machines with same ID** — config bug; use Zookeeper for assignment.
- **Clock backwards** — outage. Use monotonic time source or NTP-slew only.
- **Restart loses sequence** — fine if `now_ms()` advanced; risky if restart within same ms (rare).
- **Snowflake's epoch overflow at 69 years** — far enough out, but plan for an extension scheme.

## Real Production

- **Twitter Snowflake** (2010) — the eponymous original.
- **Instagram** — variant: 41-bit timestamp + 13-bit shard ID + 10-bit sequence; shard ID also routes to the DB shard.
- **Discord** — Snowflake-style 64-bit.
- **MongoDB ObjectID** — 96-bit (32 timestamp + 5 machine + 3 PID + 3 counter).
- **Sony Sonyflake** — variant.
- **UUID v7** — RFC 9562 (2024), emerging standard.

## Interview Talking Points

- Walk through 5 options; pick Snowflake with justification.
- Discuss machine ID assignment.
- Discuss clock skew and monotonic-time defense.
- Mention sortability advantage for indexes.
- Mention UUIDv7 as a coordination-free alternative.

## Related Concepts

- [[Design URL Shortener]] — uses ID gen to produce short codes.
- [[Consistent Hashing]] — Instagram's variant combines ID + shard routing.
- [[B-Trees]] — beneficiary of time-sortable IDs (better locality).

## Active Recall Questions

What is the 64-bit Snowflake ID layout?::1 sign bit + 41 bits timestamp (ms since epoch) + 10 bits machine ID + 12 bits sequence number.

How many IDs/second can one Snowflake machine generate?::4096 sequence × 1000 ms = ~4 million IDs/s per machine.

Why are time-sortable IDs better for database indexes?::Sequential inserts into B-tree indexes have excellent locality (append to rightmost leaf); random IDs scatter inserts and increase write amplification.

How long does a 41-bit ms timestamp last?::~69 years from the chosen epoch.

What's the trade-off of UUIDv4 vs Snowflake?::UUIDv4: 128 bits, no coordination, no sortability. Snowflake: 64 bits, requires machine-ID assignment, sortable. UUIDv7 splits the difference (128 bits, no coordination, sortable).

How does Instagram's variant differ from Snowflake?::13-bit shard ID instead of 10-bit machine ID; the ID itself encodes the DB shard that owns the row, enabling direct routing.

What do you do if the clock moves backward on a Snowflake node?::Refuse to mint IDs until the clock catches up (preserve uniqueness) or use a logical clock; reject NTP step-backwards adjustments, allow only slew.

## Feynman Test

Why is the timestamp the *most significant* bits of a Snowflake ID, not the least significant? What property would break if you reversed the layout?

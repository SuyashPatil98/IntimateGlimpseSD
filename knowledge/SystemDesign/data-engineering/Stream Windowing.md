---
title: Stream Windowing
area: data-engineering
status: mature
difficulty: advanced
prerequisites: ["[[Stream Processing]]"]
related: ["[[Stream Processing]]", "[[Apache Flink]]"]
sources:
  - Tyler Akidau ("Streaming 101" / "Streaming Systems" book)
  - DDIA Ch.11
tags: [data-engineering, streaming, windowing]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Stream Windowing

## Executive Summary

**Windowing** is the technique of **bounding unbounded streams to compute aggregates** ("count events per minute"). Four canonical window types: **tumbling** (fixed-size, non-overlapping), **sliding** (fixed-size, overlapping), **session** (gap-based), **global** (one window, manually triggered). Combined with **event time + watermarks**, windowing enables real-time aggregations that handle late-arriving data correctly. Tyler Akidau's "Streaming 101" articles are the canonical reference.

## Why This Exists

Aggregates need bounded inputs — "count" requires a definite set. Streams are unbounded. Windowing slices the stream into bounded groups for aggregation. Different window types fit different aggregation semantics.

## Core Intuition

A river of fish swimming past. "How many in last minute?" requires bounding "last minute" — that's a window. Different window shapes capture different things: fixed-interval (tumbling), running (sliding), bursts of activity (session).

## The Four Window Types

### Tumbling Windows
- Fixed size; non-overlapping.
- "Count requests per minute."
- Each event in exactly one window.

```
0-1min  | 1-2min  | 2-3min  | ...
[event] | [event] | [event] |
```

### Sliding Windows
- Fixed size; overlap by slide interval.
- "Rolling 5-minute count, updated every minute."
- Each event in multiple windows.

```
0-5min      |
  1-6min    |
    2-7min  |
```

### Session Windows
- Variable size based on activity.
- Closes after inactivity gap.
- "Group user actions into sessions of activity."

```
[event][event][event]    gap > 30min   [event][event]
└────── session 1 ──────┘                └ session 2 ┘
```

### Global Windows
- One window for all events.
- Triggered manually (count-based, custom).
- Rare; specialized.

## Event Time vs Processing Time

Crucial: windowing typically by **event time** (when it happened), not **processing time** (when consumer saw it). Late arrivals can still update windows.

**Watermarks** trigger window completion: "I believe all events up to time T have arrived." Used to fire output and clean state.

**Late data handling:**
- Allow events past watermark for grace period.
- Re-emit updated results (or drop).

## Real Production Examples

- **Flink, Kafka Streams, Beam** — all support these windows.
- **Real-time dashboards** — tumbling windows.
- **Anomaly detection** — sliding windows.
- **User analytics** — session windows.

## Design Tradeoffs

**Tumbling:** simple, predictable. Less smooth.
**Sliding:** smoother trends. More computation.
**Session:** natural for user behavior. Variable size.

## Interview Perspective

**Common questions:**
- "Four window types?" → Tumbling, sliding, session, global.
- "Event time vs processing time?" → Window by event time; watermarks bridge.
- "Late data?" → Within grace period: update window. Past: drop or special handling.

**Senior-level:**
- Tyler Akidau's "Streaming 101" is canonical reading.
- Watermark strategy is a deep topic — too aggressive = lost data, too lazy = stale results.

**Common mistakes:**
- Windowing by processing time when event time matters.
- Aggressive watermarks dropping late data.
- Unbounded session windows (no gap).

## Related Concepts

- [[Stream Processing]] · [[Apache Flink]]

## Misconceptions

- **"Windows are just timeframes."** Specific semantic types; choice matters.
- **"Late events are bugs."** Network reality; handle them.

## Failure Scenarios

- **Aggressive watermark** drops valid data.
- **Lazy watermark** delays outputs.
- **Unbounded session** never closes.

## Practical Engineering Heuristics

- **Window by event time** when possible.
- **Tune watermark to acceptable latency.**
- **Choose type by aggregation semantics.**

## Active Recall Questions

Four window types?::Tumbling, sliding, session, global.

Tumbling vs sliding?::Tumbling: non-overlapping; each event in one. Sliding: overlapping; each event in multiple.

Session windows?::Variable size based on activity; close after inactivity gap.

What triggers window emission?::Watermark passes window end. Late arrivals within grace may update.

Event time vs processing time?::Event time: when event happened. Processing time: when consumer saw it. Window by event time generally.

Canonical reference?::Tyler Akidau's "Streaming 101"/"Streaming 102" articles; "Streaming Systems" book.

## Feynman Test

User sessions: design windowing strategy. Tumbling, sliding, session — which?

Why are watermarks the most subtle stream-processing concept?

## Mastery Checklist

- **Explain** the four window types.
- **Compare** their semantics.
- **Derive** appropriate window for given aggregation.
- **Critique** processing-time windowing.
- **Design** windowing strategy for real-time analytics.

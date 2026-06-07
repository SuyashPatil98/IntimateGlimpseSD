---
title: USE Method
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[Metrics]]"]
related: ["[[RED Method]]", "[[Metrics]]", "[[Observability]]"]
sources:
  - Brendan Gregg blog
tags: [reliability, methodology, performance]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# USE Method

## Executive Summary

The **USE Method** (Brendan Gregg) is a methodology for **investigating performance issues by examining every resource's Utilization, Saturation, and Errors**. Provides a systematic checklist: for every resource (CPU, memory, disk, network), check U/S/E. Quickly surfaces bottlenecks: "I haven't looked at disk yet." Complementary to [[RED Method]] (which focuses on requests, not resources). Foundation of low-level performance work.

## Why This Exists

Performance problems hide. Without a systematic approach, engineers anchor on one hypothesis and miss the actual bottleneck. USE forces enumeration: check every resource; look for U/S/E signatures; find the bottleneck.

## Core Intuition

Diagnosing a slow car. Don't guess — check tires (utilization), engine load (saturation), check-engine light (errors). For every system: examine each potential bottleneck for utilization, saturation, errors.

## The Three Metrics

**Utilization (U):**
- Average percentage of time the resource is busy.
- For CPU: % busy. For disk: % I/O time. For network: % bandwidth used.
- High utilization may indicate saturation incoming.

**Saturation (S):**
- Degree of queued work the resource can't service yet.
- For CPU: load average above core count. For disk: queue depth. For network: dropped packets.
- Saturation is the real warning sign.

**Errors (E):**
- Count of error events.
- For network: dropped packets, retransmissions. For disk: I/O errors. For CPU: protection faults.

## Resources to Check

- **CPU** — utilization, run queue depth, faults.
- **Memory** — used, page fault rate, swap.
- **Disk** — utilization, queue depth, errors.
- **Network** — utilization, packet drops, errors.
- **Custom** — DB connections, file descriptors, etc.

## Application Pattern

1. For each resource, ask: what's the U/S/E signature?
2. The bottleneck typically has high U + high S + maybe E.
3. Drill into the highest-saturation resource.

## Real Production Examples

- **System debugging** — `top`, `iostat`, `vmstat`, `sar`.
- **Modern dashboards** — node_exporter metrics for Prometheus.

## Design Tradeoffs

**Benefits:**
- Systematic; comprehensive.
- Surfaces unexpected bottlenecks.
- Low-level focus.

**Costs:**
- Requires resource enumeration.
- Doesn't help with application logic.

## Interview Perspective

**Common questions:**
- "What's USE?" → Utilization, Saturation, Errors. Check for every resource.
- "USE vs RED?" → USE: resources (CPU, disk). RED: requests (rate, errors, duration).
- "When use USE?" → System-level performance investigation.

**Senior-level:**
- USE pairs with RED — different perspectives.
- High utilization without saturation may be fine; saturation is the warning.
- Always check the queue (saturation) for the real bottleneck.

**Common mistakes:**
- Only checking utilization, missing saturation.
- Forgetting to enumerate all resources.
- Confusing USE with application-level metrics.

## Related Concepts

- [[RED Method]] · [[Metrics]] · [[Observability]]

## Misconceptions

- **"USE = monitoring resources."** It's a methodology, not just metrics.
- **"High utilization = problem."** Only with saturation does it bite.

## Failure Scenarios

- **Saturation overlooked** → root cause missed.
- **Resource not enumerated** → blind spot.

## Practical Engineering Heuristics

- **Enumerate resources upfront.**
- **Always check saturation, not just utilization.**
- **Combine USE + RED for full picture.**

## Active Recall Questions

What's USE Method?::Utilization, Saturation, Errors — checked for every resource. Brendan Gregg's methodology for performance investigation.

What's saturation?::Queued work the resource can't yet service. Load average, queue depth, dropped packets.

USE vs RED?::USE: resources (CPU, disk, network). RED: requests (rate, errors, duration).

Why is saturation more critical than utilization?::High utilization without saturation may be fine. Saturation means work is queueing — actual bottleneck.

Resources to check?::CPU, memory, disk, network, custom (DB conns, file descriptors).

Who created USE?::Brendan Gregg, Netflix.

## Feynman Test

A server is slow. Walk through USE for CPU, memory, disk, network.

Why is "100% CPU utilization" not always a problem, but "high run queue" usually is?

## Mastery Checklist

- **Explain** USE methodology.
- **Compare** USE and RED.
- **Derive** USE checks for a given system.
- **Critique** investigations missing saturation.
- **Design** a USE-based performance audit.

---
title: Failure Detection
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]"]
related: ["[[Heartbeats]]", "[[Phi Accrual Failure Detector]]", "[[Split Brain]]", "[[Leader Election]]", "[[Gossip Protocols]]"]
builds_toward: ["[[Consensus]]", "[[Leader Election]]"]
sources:
  - DDIA, Ch. 8 (pp. 277–290)
  - SDI vol 1, Ch. 6
tags: [distributed-systems, failure-detection, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Failure Detection

## Executive Summary

Failure detection is the **mechanism by which one node decides another node has failed**. Crucial for everything from leader election to load balancing to rebalancing — but **fundamentally hard** because in an asynchronous network, you cannot distinguish "node is dead" from "node is slow" from "network is dropping packets." Failure detectors are necessarily *probabilistic and tunable*: trade false positives (declaring live nodes dead → unnecessary failover) against false negatives (missing real failures → degraded service).

## Why This Exists

Distributed systems must respond to node failures: route around dead nodes, elect new leaders, rebalance data. But there's no oracle that says "node X is dead." Detection is inferred from observations (no response to ping, missed heartbeat, gossip says it's gone). The detector encodes a *decision rule*: how long do I wait before declaring failure? The cost of being wrong differs in each direction.

## Core Intuition

You text a friend. No reply in 5 minutes. Are they ignoring you? Phone dead? On the subway? You don't know. After an hour you might assume they're not coming. After a day, definitely. The wait threshold trades responsiveness for accuracy. In distributed systems, that threshold is a *failure detector*.

## Internal Mechanics

Three classes of detector:

1. **Timeout-based** — assume failure after T seconds of silence. Simple; binary decision.
2. **Heartbeat-based** — node periodically sends "I'm alive." Missing N consecutive heartbeats → failed. Slightly more robust.
3. **Adaptive (Phi Accrual)** — output is a *suspicion level* on a continuous scale, computed from inter-arrival history. Caller chooses threshold per use case.

Failure detectors are characterized by:
- **Completeness** — every failed node is eventually suspected. (Strong vs weak completeness.)
- **Accuracy** — no correct node is permanently suspected. (Strong vs weak accuracy.)

The **FLP impossibility result** (Fischer, Lynch, Paterson, 1985): in a fully asynchronous network with even one possible failure, no deterministic algorithm can solve [[Consensus]]. Practical systems work around this by accepting imperfect failure detectors.

## Architecture Diagrams

```
Heartbeat-based:
  Node A ──── HB ────→ Node B
  Node A ──── HB ────→ Node B
  Node A ──── HB ────→ Node B
                  X         ← Node A silent
                  X
                  X
  After 3 missed: B suspects A failed → triggers reaction.
```

## Design Tradeoffs

**Aggressive (short timeout):**
- ✓ Fast failure response
- ✗ False positives (transient network blips flagged as failures)
- ✗ Unnecessary failovers, churn

**Conservative (long timeout):**
- ✓ Fewer false alarms
- ✗ Slow response to real failures
- ✗ Degraded service during the detection window

There's no universally right answer — it depends on workload, network reliability, cost of failover.

## Real Production Examples

- **Kubernetes** — liveness/readiness probes with configurable thresholds; pods marked unhealthy after N failures.
- **Cassandra** — Phi Accrual Failure Detector for node health; outputs continuous suspicion level.
- **Consul / Serf** — SWIM-style gossip with indirect pings: A asks B and C to also ping suspect node before deciding.
- **etcd / ZooKeeper** — session timeouts; client must heartbeat or session expires.
- **AWS load balancers** — health checks at configurable interval; N consecutive failures → unhealthy.

## Interview Perspective

**Common questions:**
- "How do you detect node failure?" → Heartbeats with timeout, gossip, or adaptive (Phi Accrual). Trade-off between aggressive (false positives) and conservative (slow response).
- "Why is failure detection hard?" → Cannot distinguish dead from slow in an async network. FLP impossibility says no perfect detector exists.
- "What's SWIM?" → Scalable Weakly-consistent Infection-style Membership. Uses random pings + indirect probes to reduce false positives.

**Senior-level:**
- The choice of detector matters more than people think. Production outages frequently trace to false-positive failure detection triggering unnecessary failovers.
- The "split-brain" problem is downstream of failure detection: false positive on a partition can elect a new leader while the old one is still alive.
- Adaptive detectors (Phi Accrual) outperform fixed timeouts at scale because they learn the network's behavior.

**Common mistakes:**
- Tuning timeouts based on lab conditions, not production tail latencies.
- Forgetting that a slow GC pause looks identical to a network partition.
- Trusting a single detector's output for high-stakes decisions like failover.

## Related Concepts

- [[Heartbeats]] · [[Phi Accrual Failure Detector]] — specific mechanisms.
- [[Split Brain]] — what happens when failure detection goes wrong during a partition.
- [[Leader Election]] · [[Consensus]] — consumers of failure detection signals.
- [[Gossip Protocols]] — substrate for distributed failure detection.

## Misconceptions

- **"You can know for certain a node is dead."** Not in an async network. Detection is always probabilistic.
- **"Shorter timeouts are always better."** They increase false positives, which can cause worse problems than slow detection.
- **"Heartbeats are enough."** Adaptive detectors handle real-world network noise better.

## Failure Scenarios

- **GC pause looks like a partition** — Java service GC pauses can exceed timeout; falsely declared failed. Mitigation: tune timeouts above realistic GC duration; or use language with shorter pauses.
- **Asymmetric partition** — A sees B but B can't see A. Mitigation: bidirectional confirmation; gossip via third party (SWIM).
- **Heartbeat storm** — too many heartbeats saturate network. Mitigation: lower frequency, hierarchical detection.

## Practical Engineering Heuristics

- **Set timeouts above realistic p99 of round-trip + GC pauses.**
- **Use indirect probes** (ask a third party) before declaring failure.
- **Test the false-positive case** — what happens if you spuriously declare a node dead?
- **Distinguish "down" from "unhealthy."** A node returning errors is different from a node not responding.

## Active Recall Questions

What is failure detection?::Mechanism by which one node decides another has failed. Fundamentally probabilistic — cannot distinguish "dead" from "slow" in async networks.

Three classes of failure detector?::Timeout-based (binary after T seconds), heartbeat-based (N missed heartbeats), adaptive (Phi Accrual — continuous suspicion level).

What does the FLP impossibility result say?::In a fully asynchronous network with even one possible failure, no deterministic algorithm can solve consensus. Practical systems work around this with imperfect failure detectors.

Aggressive vs conservative timeouts trade-off?::Aggressive (short): fast response, more false positives, unnecessary failover. Conservative (long): fewer false alarms, slower response to real failures.

What's SWIM?::Scalable Weakly-consistent Infection-style Membership. Random pings + indirect probes (ask third party) before declaring failure. Reduces false positives.

Why does a GC pause look like a partition?::No response from the node during the pause. If pause exceeds timeout, detector falsely flags failure. Mitigation: tune timeouts above realistic GC duration.

## Feynman Test

A node hasn't responded in 30 seconds. Walk through the chain of inferences before you declare it dead. What could you be wrong about?

Explain the trade-off in setting heartbeat timeout for a real production service.

## Mastery Checklist

- **Explain** failure detection and its impossibility properties.
- **Compare** timeout, heartbeat, and adaptive detectors.
- **Derive** an appropriate timeout for a given workload.
- **Critique** systems with fixed timeouts ignoring tail-latency reality.
- **Design** a failure detection layer using indirect probes.

[^DDIA-277]: Designing Data-Intensive Applications, Kleppmann, Ch. 8, pp. 277–290.
[^FLP]: Fischer, Lynch, Paterson, "Impossibility of Distributed Consensus with One Faulty Process," 1985.

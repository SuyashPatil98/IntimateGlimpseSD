---
title: Heartbeats
area: distributed-systems
status: mature
difficulty: beginner
prerequisites: ["[[Failure Detection]]"]
related: ["[[Failure Detection]]", "[[Phi Accrual Failure Detector]]", "[[Gossip Protocols]]"]
sources:
  - DDIA, Ch. 8
  - SDI vol 1, Ch. 6
tags: [distributed-systems, failure-detection, mechanism]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Heartbeats

## Executive Summary

A heartbeat is a **periodic message a node sends to signal "I am alive."** The simplest, most ubiquitous failure-detection primitive in distributed systems. A receiver expects heartbeats at known intervals; missing N consecutive heartbeats → suspect failure. Implementation is trivial; **tuning** is what's hard — interval and threshold determine the trade-off between false positives and detection delay.

## Why This Exists

Failure detection requires *some* signal that a node is healthy. Heartbeats are the minimal signal: "if you don't hear from me, assume the worst." They're universally adopted because they're cheap, simple, and good enough for most failure-detection needs at small to medium scale.

## Core Intuition

A patient on a hospital monitor. The machine beeps regularly. Three missed beeps and the nurse rushes in. The beep itself is just "I'm here"; absence is the signal that matters.

## Internal Mechanics

1. Node A sends a heartbeat message to node B every `T` seconds.
2. B tracks the last heartbeat received from A.
3. If B hasn't heard from A in `K × T` seconds (typically K=3 or 5), B suspects A failed.
4. Suspicion may trigger reaction: route traffic away, initiate failover, etc.

**Variants:**
- **Direct heartbeats** — A → B directly. Simple; O(N²) for full mesh.
- **Indirect heartbeats** — heartbeats flow via gossip; scales to large clusters.
- **Push** (A → B) vs **pull** (B asks A).
- **Embedded heartbeats** — piggybacked on regular RPC traffic; no dedicated heartbeat.

## Design Tradeoffs

**Heartbeat interval (T):**
- Shorter → faster detection, more network overhead.
- Longer → less overhead, slower detection.

**Threshold (K missed):**
- Lower → faster detection, more false positives.
- Higher → fewer false alarms, slower response.

**Common defaults:** T=1s, K=3 (3-second detection window). For high-stakes systems: T=100ms with K=10. For loose clusters: T=10s, K=3.

## Real Production Examples

- **Kubernetes** — kubelet sends node heartbeats to API server every 10s; node considered failed after 40s.
- **Cassandra** — heartbeats via gossip every second.
- **TCP keepalive** — heartbeats at the transport layer.
- **ZooKeeper sessions** — clients heartbeat to keep session alive.
- **AWS ALB health checks** — heartbeats from load balancer to targets.

## Interview Perspective

**Common questions:**
- "How do heartbeats work?" → Periodic "I'm alive" messages; N consecutive misses signals failure.
- "What's the trade-off in setting interval and threshold?" → Aggressive: fast but noisy. Conservative: stable but slow.
- "What's wrong with heartbeats alone?" → False positives during GC pauses, network blips. Adaptive detectors and indirect probes help.

**Senior-level:**
- Heartbeats are necessary but insufficient at scale. Real production systems combine heartbeats with gossip (Cassandra), indirect probes (SWIM), or adaptive detectors (Phi Accrual).
- Network overhead matters in large clusters — N² direct heartbeats becomes prohibitive past ~100 nodes.
- The "heartbeat thread starvation" anti-pattern: heartbeat sender starved by other work; node falsely flagged failed.

**Common mistakes:**
- Running heartbeat threads at low priority — starved during load spikes.
- Setting K=1 — single missed heartbeat causes failover.
- Forgetting to actually monitor what happens *after* a heartbeat fails.

## Related Concepts

- [[Failure Detection]] — parent concept.
- [[Phi Accrual Failure Detector]] — adaptive alternative.
- [[Gossip Protocols]] — propagates heartbeat info through the cluster.

## Misconceptions

- **"Missing one heartbeat = failure."** No — typically need K consecutive misses (K=3+) to account for transient losses.
- **"Heartbeats prove health."** They prove the heartbeat thread is alive, not necessarily that the service is healthy. Separate "liveness" from "readiness."
- **"More frequent heartbeats are always better."** Saturates network at scale.

## Failure Scenarios

- **Heartbeat thread blocked** by GC, lock, or I/O — node falsely flagged failed.
- **Network buffer drops heartbeats** during congestion — false failure.
- **Clock skew** between sender and receiver causes wrong inter-arrival measurement.
- **N² heartbeat storm** in large clusters saturates network.

## Practical Engineering Heuristics

- **Run heartbeat thread at high priority**, isolated from app work.
- **K ≥ 3** consecutive misses before declaring failure.
- **Distinguish liveness from readiness** — heartbeats prove the former, not the latter.
- **For large clusters, use gossip** to distribute heartbeat info; avoid N² direct meshes.

## Active Recall Questions

What is a heartbeat?::A periodic message from a node signaling "I am alive." Failure inferred from absence over a threshold.

What's the canonical heartbeat threshold?::K=3 consecutive missed heartbeats. Tolerates transient network drops while bounding detection delay.

Why not use shorter heartbeat intervals?::Network overhead. In large clusters, frequent direct heartbeats become a bandwidth problem. Solution: gossip-based propagation.

What's the GC-pause failure mode?::Heartbeat thread blocked during GC; node falsely flagged failed even though it's alive (just paused). Mitigation: ensure timeout > realistic GC pause duration.

Difference between liveness and readiness?::Liveness: the service is running (heartbeat works). Readiness: the service is ready to serve traffic (deps healthy, warmed up). A live but not-ready node should be excluded from LB without failover.

## Feynman Test

Walk through a heartbeat-based failure detection cycle with T=1s, K=3. What's the detection delay? When are false positives most likely?

Why might Kubernetes' kubelet heartbeat fail during a node's high-CPU spike, and how would you mitigate?

## Mastery Checklist

- **Explain** heartbeats and the role of interval + threshold.
- **Compare** direct, indirect, and embedded heartbeats.
- **Derive** appropriate T and K for a given workload.
- **Critique** systems with fixed-interval heartbeats ignoring GC reality.
- **Design** a heartbeat layer combined with gossip for scale.

[^DDIA-Ch8]: Designing Data-Intensive Applications, Kleppmann, Ch. 8.

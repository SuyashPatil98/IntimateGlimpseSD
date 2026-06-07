---
title: Hinted Handoff
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Quorums]]", "[[Leaderless Replication]]"]
related: ["[[Anti-Entropy]]", "[[Read Repair]]", "[[Leaderless Replication]]", "[[Quorums]]"]
sources:
  - DDIA, Ch. 5 (p. 184)
  - Dynamo paper (DeCandia et al., 2007)
tags: [distributed-systems, replication, convergence]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Hinted Handoff

## Executive Summary

Hinted handoff is a convergence mechanism for leaderless systems: when a write can't reach one of its target replicas (the replica is down or unreachable), the write is **stored on another node as a "hint"** and **delivered to the original target when it comes back online**. Pairs with [[Read Repair]] and [[Anti-Entropy]] to keep replicas converging. Originated in Amazon's Dynamo; used by Cassandra, Riak, ScyllaDB.

## Why This Exists

In leaderless quorum systems, a write must reach W replicas to succeed. If one of the W target replicas is down: (a) fail the write, or (b) accept it with a sloppy quorum — write to a different node, with a hint to forward later. Option (b) preserves availability at the cost of temporary divergence. Hinted handoff is how (b) gets reconciled when the down replica returns.

## Core Intuition

You want to deliver a package, but your friend isn't home. You leave it with their neighbor with a note: "give this to my friend when they return." When the friend returns, the neighbor hands over the package. The friend now has the delivery, even though they were away.

## Internal Mechanics

1. Client write arrives at coordinator (any node in Dynamo-style).
2. Coordinator forwards to W "home" replicas (chosen by consistent hashing).
3. If one home replica is unreachable, coordinator writes to a substitute node.
4. Substitute stores the write **with a hint**: "this belongs to node X; deliver when reachable."
5. Substitute periodically checks if X is back.
6. When X returns, substitute forwards hinted writes to X.
7. X applies them; hint is cleared.

**Sloppy quorum** — the W writes include substitutes, not just home replicas. Quorum overlap is *temporarily* violated until handoff completes.

**Hint expiry** — hints have a TTL (Cassandra's `max_hint_window_in_ms`, default 3 hours). If target stays down longer, hints are dropped — [[Anti-Entropy]] eventually reconciles.

## Design Tradeoffs

**Benefits:**
- Preserves write availability during transient failures.
- Automatic recovery — no operator intervention.
- Faster convergence than waiting for anti-entropy.

**Costs:**
- Temporarily violates strict quorum overlap (sloppy quorum).
- Hint storage consumes substitute capacity.
- If hint expires before delivery, divergence persists until anti-entropy.

## Real Production Examples

- **Cassandra** — hinted handoff on by default; configurable window and storage limits.
- **Riak** — hinted handoff with vnode-level granularity.
- **DynamoDB** — internal mechanism, not user-facing.
- **ScyllaDB** — Cassandra-compatible, same model.

## Interview Perspective

**Common questions:**
- "What is hinted handoff?" → Mechanism to preserve write availability when a target replica is down: write to a substitute with a "deliver later" hint.
- "What's sloppy quorum?" → The W replicas accepting the write include substitutes. Temporarily violates strict overlap.
- "Why have a hint expiry?" → Bounded storage on substitutes; long-down targets are repaired by anti-entropy.

**Senior-level:**
- Sloppy quorum is the practical compromise between strict consistency and write availability. Strict systems refuse writes; sloppy systems take them with deferred reconciliation.
- Hinted handoff + read repair + anti-entropy is the **Dynamo trio** of convergence mechanisms. Each catches what the others miss.
- Hint expiry is operationally important — sustained outage can fill substitutes; the cluster must drop old hints and rely on anti-entropy.

**Common mistakes:**
- Setting hint expiry too short — frequent fallback to anti-entropy.
- Setting hint expiry too long — substitute nodes fill up; storage pressure.
- Believing hinted handoff alone guarantees convergence.

## Related Concepts

- [[Quorums]] — hinted handoff enables sloppy quorums.
- [[Anti-Entropy]] · [[Read Repair]] — sibling convergence mechanisms.
- [[Leaderless Replication]] — architecture where hinted handoff lives.

## Misconceptions

- **"Hinted handoff = strong consistency."** No — preserves availability with deferred reconciliation.
- **"Hints last forever."** No — bounded by TTL. Long outages fall back to anti-entropy.
- **"Substitutes are random."** Typically the next available node by consistent hashing, not random.

## Failure Scenarios

- **Substitute fills up with hints** during extended target outage. Mitigation: bounded hint storage; fall back to anti-entropy.
- **Hint expiry before target returns** — hints dropped; data only repaired via subsequent anti-entropy. Mitigation: tune TTL; monitor downtime.
- **Substitute also fails** — hints lost. Mitigation: anti-entropy.

## Practical Engineering Heuristics

- **Default hint window: 3 hours.**
- **Monitor hint count** per node — sustained growth indicates a failing target.
- **Bound hint storage** per substitute.
- **Run anti-entropy on a schedule** — backup for expired hints.

## Active Recall Questions

What is hinted handoff?::Mechanism in leaderless replication. When a write can't reach a target replica, it's stored on another node as a "hint" and delivered when the target returns.

What's sloppy quorum?::Quorum that includes substitutes (hint-holders) rather than only home replicas. Preserves write availability; temporarily violates strict overlap.

Why does hinted handoff have a TTL?::Bounded storage on substitute nodes. Long outages overflow hints; anti-entropy takes over.

What's the Dynamo trio of convergence mechanisms?::Hinted handoff (writes for down replicas), read repair (inline on reads), anti-entropy (background full scan).

What does hinted handoff alone NOT guarantee?::Long-term convergence. If hints expire before target returns, divergence persists until anti-entropy.

## Feynman Test

Walk through a write in a 3-replica Cassandra cluster where one replica is down. What happens via hinted handoff?

Explain why hint expiry matters and how it interacts with anti-entropy.

## Mastery Checklist

- **Explain** hinted handoff and sloppy quorum.
- **Compare** with anti-entropy and read repair.
- **Derive** appropriate hint TTL for a given operational profile.
- **Critique** "hinted handoff = strong consistency" claims.
- **Design** a write path with hinted handoff and bounded hint storage.

[^DDIA-184]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, p. 184.

---
title: Consistent Hashing
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Partitioning]]"]
related: ["[[Partitioning]]", "[[Rebalancing]]", "[[Leaderless Replication]]", "[[Hot Partitions]]", "[[Design Consistent Hashing System]]"]
builds_toward: ["[[Rebalancing]]"]
sources:
  - DDIA, Ch. 6, pp. 217–219
  - SDI vol 1, Ch. 5 (dedicated chapter)
  - Karger et al., 1997 (original paper)
  - system-design-primer (Donne Martin)
tags: [distributed-systems, partitioning, hashing, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Consistent Hashing

## Executive Summary

Consistent hashing (Karger et al., 1997) is a hashing scheme that **minimizes data movement when nodes are added or removed**. Naive hashing (`hash(key) % N`) repartitions ~all keys when N changes — disastrous at scale. Consistent hashing remaps only ~1/N of keys, making node churn cheap. Combined with **virtual nodes** for even distribution, it's the foundation of Dynamo-style systems (Cassandra, DynamoDB, Riak), CDN routing, distributed caches, and most load-balancer designs.

## Why This Exists

In a partitioned system with `hash(key) % N`, going from N=10 to N=11 nodes requires moving ~91% of keys (10/11). That's catastrophic — a routine scale-up triggers terabyte data movement. Consistent hashing solves it: adding one node moves only ~1/N of keys. Removing one node moves only the keys it owned. Cluster topology becomes a fluid, low-cost operation.

## Core Intuition

Imagine a clock face (a "ring" of hash space, e.g., 0 to 2^32). Both nodes and keys are placed on the ring by their hash values. Each key is owned by the **next node clockwise** from its position.

Adding a new node: it claims a position on the ring; takes ownership of the keys between itself and the previous node. Only those keys move. Everyone else's data stays put.

Removing a node: its keys are taken by the next node clockwise. Same story.

## Internal Mechanics

**Basic algorithm:**

1. Place N nodes on a ring at positions `hash(node_id) mod 2^32`.
2. For each key, compute `hash(key) mod 2^32`.
3. The key belongs to the **first node clockwise** from its position.

**Problem with basic version:** node placements may cluster on the ring → uneven load. Some nodes own large arcs, others tiny ones.

**Virtual nodes (vnodes):** each physical node is placed at *many* (e.g., 100-200) positions on the ring. With more virtual placements, the law of large numbers smooths out distribution. Most production systems use this.

**Weighted virtual nodes:** assign more vnodes to higher-capacity machines. Distribution scales with capacity.

**Rendezvous hashing (Highest Random Weight):** an alternative to consistent hashing with similar properties. For each key, compute `hash(key, node_i)` for all nodes; assign the key to the node with the highest score. Simpler to reason about; slightly different trade-offs.

## Mathematical Foundations

For a ring with $N$ nodes and uniform-distributed keys:

- Expected keys per node: $K/N$ (where $K$ is total keys).
- Adding one node displaces approximately $K/(N+1)$ keys.
- With $V$ virtual nodes per physical node, the standard deviation of load decreases as $\sqrt{1/V}$ — so $V = 100$ gives roughly $\sigma \approx 10\%$ imbalance.

This is dramatically better than modulo hashing, which can require remapping the entire keyspace.

## Architecture Diagrams

```
        Consistent hash ring (simplified):

                    [Node A] ────►
                    /
                ┌──────────────┐
       key1 →   │              │   ← key2 (owned by Node B)
              ┌─┤              ├─┐
              │ │   The Ring   │ │
              │ │              │ │
              └─┤              ├─┘
                │              │
                └──────────────┘
                       ◄────[Node C]
            ▲
            └ [Node B]
```

Add Node D → it claims a slice of the ring; only the keys in that slice migrate to D.

## Design Tradeoffs

**Benefits:**
- Adding/removing one node moves only ~1/N of keys.
- Topology changes cheap → enables dynamic scaling, smooth rolling upgrades.
- Combined with vnodes: even load distribution.

**Costs:**
- More complex routing than `hash % N`.
- Hot keys are still hot (consistent hashing doesn't fix [[Hot Partitions]]).
- Requires gossip or coordination to know current ring state.

## Real Production Examples

- **Amazon Dynamo / DynamoDB** — consistent hashing for partition assignment.
- **Apache Cassandra** — consistent hashing with configurable vnodes (default 256).
- **Riak** — consistent hashing with vnodes.
- **Memcached clients (ketama hashing)** — client-side consistent hashing across cache servers.
- **CDN routing** — consistent hashing assigns requests to edge servers.
- **Akamai** — pioneered web-scale consistent hashing.
- **Google's Maglev load balancer** — uses a variant for connection persistence.

## Interview Perspective

**Common questions:**
- "What problem does consistent hashing solve?" → Minimizing data movement when N changes. Naive `hash % N` requires repartitioning ~all keys.
- "What are virtual nodes?" → Each physical node has many placements on the ring → smooth distribution. Without vnodes, basic consistent hashing has high variance.
- "How does adding a node work?" → New node claims position(s) on the ring; takes ownership of keys in its arc; only those keys move.

**Senior-level:**
- Vnode count is a tuning knob. Too few → load imbalance. Too many → coordination overhead. 100-256 is typical.
- Rendezvous hashing is mathematically cleaner and often preferred in modern designs (Google Maglev uses a variant).
- Consistent hashing alone doesn't handle hot keys — you need additional strategies (replication of hot data, request hedging).

**Common mistakes:**
- Implementing without vnodes; suffering load imbalance.
- Treating consistent hashing as a fix for hot-key problems (it isn't).
- Forgetting that the ring needs to be agreed across all clients/nodes (gossip, coordination).

## Related Concepts

- [[Partitioning]] — consistent hashing is a partitioning scheme.
- [[Rebalancing]] — what happens when ring topology changes.
- [[Leaderless Replication]] — Dynamo-style systems use consistent hashing for both partitioning and replica assignment.
- [[Hot Partitions]] — consistent hashing doesn't solve this; complementary techniques needed.

## Misconceptions

- **"Consistent hashing distributes evenly."** Not without virtual nodes. Bare consistent hashing has substantial variance.
- **"Consistent hashing solves hot keys."** No — a hot key still hashes to one specific node. Hot-key handling is orthogonal.
- **"It's just a fancy hash function."** It's a *partitioning scheme* with the property of minimal disruption.

## Failure Scenarios

- **Ring topology drift** — different clients have different ring views during a topology change. Mitigation: gossip protocols, coordinator-driven updates with versioned ring state.
- **Vnode skew** — random placement may still cluster. Mitigation: deterministic placement, more vnodes, weighted assignment.
- **Hash collision on physical nodes** — two nodes hash to nearby positions, one owns a tiny slice. Mitigation: vnodes mask this.

## Practical Engineering Heuristics

- **Use ≥100 vnodes per physical node** for reasonable load balance.
- **Combine consistent hashing with replication.** Replicate to the next N nodes clockwise on the ring.
- **Test ring transitions under load.** Topology changes shouldn't cause coordinated failures.
- **For caches (memcached, Redis cluster), use ketama-style consistent hashing** — battle-tested.

## Active Recall Questions

What problem does consistent hashing solve?::Minimizing data movement when nodes are added or removed. Naive `hash % N` requires repartitioning nearly the entire keyspace; consistent hashing only moves ~1/N keys.

How does basic consistent hashing work?::Place nodes and keys on a conceptual ring by their hash values. Each key is owned by the next node clockwise.

What are virtual nodes (vnodes)?::Each physical node has many positions on the ring (typically 100–256). Smooths load distribution by law of large numbers.

What's the load imbalance with V virtual nodes per physical node?::Standard deviation of load is approximately σ/√V. For V=100, ~10% imbalance.

Does consistent hashing solve hot keys?::No. A hot key still hashes to one specific node. Hot-key handling requires separate techniques (replication of hot data, request hedging).

Name three production systems using consistent hashing.::Cassandra, DynamoDB, Riak, Memcached clients (ketama), most CDNs, Akamai.

What's an alternative to consistent hashing with similar properties?::Rendezvous (Highest Random Weight) hashing. For each key, score against all nodes via hash(key, node); pick the highest.

## Feynman Test

Sketch a consistent hash ring with 3 nodes. Add a 4th node. Which keys move? Why is this better than `hash % N`?

Explain why vnodes are essential and what happens without them.

## Mastery Checklist

- **Explain** consistent hashing with the ring metaphor.
- **Compare** consistent hashing with modulo hashing and with rendezvous hashing.
- **Derive** the expected load imbalance for a given vnode count.
- **Critique** systems using bare consistent hashing without vnodes.
- **Design** a partitioned cache using consistent hashing with replication.

[^DDIA-217]: Designing Data-Intensive Applications, Kleppmann, Ch. 6, pp. 217–219.
[^Karger-1997]: Karger et al., "Consistent Hashing and Random Trees," STOC 1997.

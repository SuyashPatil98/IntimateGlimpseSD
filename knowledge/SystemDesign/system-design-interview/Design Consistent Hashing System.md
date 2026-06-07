---
title: Design Consistent Hashing System
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Consistent Hashing]]", "[[Partitioning]]"]
related: ["[[Distributed Caching]]", "[[Rebalancing]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.5 ("Design Consistent Hashing")
  - Karger et al. "Consistent Hashing and Random Trees" (1997)
  - Dynamo paper
tags: [system-design-interview, classic-design, sharding]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Consistent Hashing System

## Executive Summary

Consistent hashing assigns keys to servers via a hash-ring such that adding or removing a server moves only $K/N$ keys (vs $K$ for naive modulo). This problem in interviews focuses on **implementing it correctly with virtual nodes, handling membership changes, and integrating with replication**. The end product is the routing layer for a distributed cache or KV store.

## Requirements

**Functional:**
- Given a key, route to the correct server.
- Add/remove servers without re-routing most keys.
- Replicate each key to N servers for fault tolerance.

**Non-functional:**
- Routing latency negligible (<100 μs).
- Even load distribution.
- Tolerate server failures.

## High-Level Design

```
                     hash ring
                  ┌──────────────┐
                  │     S2       │
                  │  ●  vn1      │
                  │           ●  │
        key ─►hash│  vn3      vn2│
                  │ ●           ●│
                  │      vn4      │
                  │         S1   │
                  └──────────────┘
                  servers S1..Sn each with M virtual nodes
                  key routes to next server clockwise
```

## Design Deep Dive

### Hash function

Choose a uniform hash: **MurmurHash3** or **xxHash** for speed; cryptographic hashes (SHA-256) when adversarial input is possible. Keyspace = $2^{32}$ or $2^{64}$ (ring positions).

### Virtual nodes (vnodes)

Why: with N physical servers, naive consistent hashing produces uneven load (load variance ~ $1/\sqrt{N}$). With $M$ vnodes per server (typically 100–200), variance reduces to ~ $1/\sqrt{NM}$.

Each server is hashed M times (e.g., `hash("server1#1")`, `hash("server1#2")`, …) and each hash is placed on the ring.

### Routing

- Maintain a sorted data structure of ring positions → server (TreeMap, skiplist, sorted array).
- Lookup: binary search for the next position ≥ hash(key) → that vnode's server.
- $O(\log N \cdot M)$ per lookup; negligible.

### Replication

For replication factor R, walk the ring forward and take the next R *distinct* physical servers (skip multiple vnodes of the same server). Standard Dynamo pattern.

### Adding a server

1. Compute vnode hashes for new server.
2. Insert into ring.
3. For each new vnode, the keys in the arc clockwise of it (up to next vnode) migrate to the new server.
4. Migration: copy from existing replica → new owner; switch routing → cleanup old.

Only ~$K/N$ keys move (vs full reshuffle in naive modulo).

### Removing / failing a server

- Remove its vnodes from the ring.
- Keys re-route to the next clockwise vnode (a different physical server).
- Re-replicate to maintain R replicas (anti-entropy via [[Read Repair]] or [[Hinted Handoff]]).

### Bootstrap and membership

- Use a coordinator (Zookeeper, etcd) or gossip protocol to disseminate ring membership.
- Clients cache ring; refresh on miss / periodically.

## Math

Variance in load per server with M vnodes:
$$\sigma^2 \approx \frac{K}{N \cdot M}$$
where K = key count, N = servers. M = 100–200 is the standard sweet spot.

## Failure Modes

- **Ring partition during membership change** — clients see inconsistent rings. Mitigation: versioned ring; gossip convergence.
- **Hot key** — consistent hashing doesn't solve this; one key still hits one server. Mitigation: replication + client-side caching.
- **Adversarial key distribution** — attacker crafts keys hashing to one server. Mitigation: salted/keyed hash.
- **Migration storm on multi-server failure** — failing N servers triggers replication of N/total fraction of data. Mitigation: rate-limit anti-entropy.

## Real Production

- **Amazon Dynamo** (2007) — the canonical reference.
- **Cassandra** — vnode-based consistent hashing.
- **Riak** — Dynamo-style.
- **Akamai CDN** — origin of consistent hashing (Karger 1997 was Akamai work).
- **memcached clients** (Ketama) — popularized client-side consistent hashing.
- **Discord** — published their Cassandra ring scaling.

## Interview Talking Points

- Compare naive `hash(key) % N` (moves K keys per change) vs consistent hashing (moves K/N).
- Explain virtual nodes and why M = 100–200.
- Discuss replication (walk ring for R distinct servers).
- Address hot keys (consistent hashing doesn't solve them).
- Mention ring dissemination (gossip vs Zookeeper).

## Related Concepts

- [[Consistent Hashing]] — algorithmic concept.
- [[Partitioning]] — sharding strategies overview.
- [[Rebalancing]] — what happens during membership change.
- [[Distributed Caching]] — common use case (memcached / Redis Cluster).

## Active Recall Questions

What problem does consistent hashing solve compared to hash(key) % N?::With naive modulo, adding/removing a server remaps all K keys; consistent hashing remaps only ~K/N keys.

What are virtual nodes (vnodes) and why are they needed?::Multiple ring positions per physical server (typically 100–200); reduce load variance from ~1/√N to ~1/√(NM) and smooth migration.

How does replication work on a consistent-hash ring?::Walk forward from the key's primary position and take the next R *distinct* physical servers (skipping additional vnodes of the same server).

What's the lookup complexity for a key on a ring with N servers and M vnodes each?::O(log(NM)) via binary search on the sorted ring positions.

What does consistent hashing NOT solve?::Hot keys — a single popular key still hits one server's replicas; mitigated separately via caching, replication, or key sharding.

How is ring membership disseminated?::Either a coordinator (Zookeeper, etcd) for strong consistency, or gossip protocol for eventual consistency at scale.

What happens to keys when a server fails?::They re-route clockwise to the next vnode (a different physical server), then are re-replicated to restore the replication factor via anti-entropy.

## Feynman Test

Sketch a ring with 3 servers and 3 vnodes each. Explain to a teammate what happens when you add a 4th server — which keys migrate, and how do you copy them safely without dropping requests?

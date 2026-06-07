---
title: Consensus
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Quorums]]", "[[Failure Detection]]", "[[Leader-Based Replication]]"]
related: ["[[Paxos]]", "[[Raft]]", "[[Leader Election]]", "[[Two-Phase Commit]]", "[[Split Brain]]", "[[Linearizability]]"]
builds_toward: ["[[Distributed Transactions]]"]
sources:
  - DDIA, Ch. 9 (pp. 354–376)
  - Lamport, 1998 (Paxos)
  - Ongaro & Ousterhout, 2014 (Raft)
tags: [distributed-systems, consensus, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Consensus

## Executive Summary

Consensus is the problem of **getting multiple nodes to agree on a single value, despite failures**. It's the bedrock primitive of distributed systems — every linearizable system, every safe leader election, every distributed lock service relies on consensus. The FLP impossibility result (1985) proves no deterministic protocol solves consensus in a fully asynchronous network with failures; practical protocols ([[Paxos]], [[Raft]], Zab) work by assuming **partial synchrony** and using **majority quorums** to guarantee safety. Used in etcd, ZooKeeper, Consul, Spanner, CockroachDB — anywhere you need a single source of truth across replicas.

## Why This Exists

Many distributed problems reduce to consensus: who's the leader? what's the next entry in the log? did transaction T commit or abort? If you can solve consensus, you can solve those. If you can't, you build fragile systems that lose data, split-brain, or corrupt state under failure. Consensus is the canonical primitive.

## Core Intuition

A group of generals must agree on whether to attack at dawn. Messengers can be killed; messages can be lost; some generals might be traitors (in Byzantine variants) or simply unreachable. The generals must arrive at the same decision despite partial information. Consensus protocols are the formal rules they follow.

For non-Byzantine consensus (the common case in distributed databases): assume crash failures only. Use majority quorums so at most one decision can be reached.

## Formal Definition

A consensus protocol satisfies:

1. **Agreement** — no two correct nodes decide different values.
2. **Validity** — the decided value was proposed by some node.
3. **Termination** — every correct node eventually decides (under partial synchrony).
4. **Integrity** — each node decides at most once.

**Crash-fault tolerance:** tolerates F failures with 2F+1 nodes (majority quorum).
**Byzantine-fault tolerance:** tolerates F malicious failures with 3F+1 nodes.

## Internal Mechanics

All practical consensus protocols share a basic shape:

1. **Propose** — a node (typically a leader) proposes a value.
2. **Promise / vote** — replicas acknowledge the proposal, often after checking it's not stale.
3. **Commit** — once a majority has acknowledged, the value is committed; all correct nodes will eventually learn it.
4. **Apply** — replicas apply the committed value to their state.

[[Paxos]] is the original (Lamport, 1998); notoriously hard to understand and implement. [[Raft]] (Ongaro & Ousterhout, 2014) is designed for understandability; uses an explicit leader, log replication, and clear leader-election rules. Both achieve the same safety properties.

**Why majority quorums?** With 2F+1 nodes, any two majorities of F+1 share at least one node. That overlap is what guarantees agreement — any new decision must include a node that's seen the previous decision.

## Architecture Diagrams

```
Raft consensus (simplified):
                  ┌─────────┐
                  │ LEADER  │ ──── proposes "X" ──→ all followers
                  └─────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
       [Follower 1]           [Follower 2]
       acks                   acks
                       │
                 leader counts acks
                 + self = majority → commits X
                       │
            broadcasts "X is committed" to all
```

## Design Tradeoffs

**Benefits:**
- **Linearizability** — consensus enables linearizable operations on a replicated value.
- **Safe under failures** — majority quorum prevents split brain.
- **Foundation** for locks, leader election, ordered logs.

**Costs:**
- **Latency** — minimum round-trip to a majority per decision.
- **Availability** — minority side of a partition cannot make progress.
- **Throughput** — leader is a bottleneck; coordination serializes.
- **Complexity** — Paxos is famously hard; Raft easier but still nontrivial.

## Real Production Examples

- **etcd** — Raft-based KV store; the consensus core of Kubernetes.
- **ZooKeeper** — uses Zab (similar to Raft); coordination service for many systems (Kafka, HBase, Solr).
- **Consul** — Raft-based for cluster state.
- **Google Spanner** — Paxos per data shard; TrueTime adds bounded clock to enable global serializability.
- **CockroachDB** — Raft per range; multi-Raft architecture.
- **Apache Kafka (newer versions)** — Raft-based controller (KRaft) replacing ZooKeeper dependency.
- **TiKV / TiDB** — Raft per region.

## Interview Perspective

**Common questions:**
- "What does consensus solve?" → Getting multiple nodes to agree on a value despite failures.
- "Why is consensus hard?" → Asynchronous network + failures = FLP impossibility. Real protocols rely on partial synchrony.
- "Paxos vs Raft?" → Same safety properties, different presentations. Raft is more understandable and implementable.

**Senior-level:**
- Consensus is *one round-trip to a majority* per decision. This is the latency floor; no clever protocol gets below it.
- Multi-Paxos / Raft optimizes the common case by electing a stable leader and skipping prepare phases. Without optimization, naive Paxos is multiple round-trips per decision.
- Byzantine consensus (PBFT, HotStuff) costs much more — 3F+1 nodes and additional rounds. Used in blockchain; rarely in distributed databases.

**Common mistakes:**
- Confusing consensus with quorum. Quorum is a primitive; consensus is a protocol *using* quorums plus extra safety.
- Believing consensus protocols give you availability — they explicitly trade availability for safety under partition.
- Rolling your own consensus. Don't. Use etcd, ZooKeeper, or a battle-tested library.

## Related Concepts

- [[Paxos]] · [[Raft]] — specific protocols.
- [[Leader Election]] — sub-problem solved by consensus.
- [[Quorums]] — the primitive consensus is built on.
- [[Linearizability]] — what consensus enables.
- [[Two-Phase Commit]] — atomic commit, related but distinct (different fault assumptions).
- [[Split Brain]] — what consensus protocols prevent.
- [[CAP Theorem]] — consensus-based systems are CP.

## Misconceptions

- **"Consensus and quorum are the same."** Quorum is overlap math; consensus is a protocol with safety properties.
- **"Consensus scales horizontally."** No — consensus is inherently serializing. To scale, partition; run consensus per partition.
- **"Paxos is impractical."** Production systems run Paxos at huge scale (Spanner, Megastore). It's hard to implement, not impractical to run.

## Failure Scenarios

- **Network partition** — minority side cannot make progress. By design.
- **Leader failure** — triggers a new election; window of unavailability.
- **Election storm** — flapping leaders cause repeated elections. Mitigation: randomized timeouts (Raft), pre-vote phase.
- **Slow majority** — one slow replica in the quorum slows everything. Mitigation: select fastest quorum among available.

## Practical Engineering Heuristics

- **Don't roll your own.** Use etcd, ZooKeeper, Consul, or a battle-tested library.
- **Use consensus for coordination, not data path.** Coordination services hold small amounts of critical state; bulk data goes elsewhere.
- **Test partitions explicitly.** Jepsen-style testing is standard.
- **For multi-region, accept the WAN latency cost** of cross-region consensus — or partition consensus per region.

## Active Recall Questions

What is consensus?::Getting multiple nodes to agree on a single value despite failures. Foundation for linearizability, locks, leader election, replicated logs.

State the safety properties of consensus.::Agreement (no two nodes decide different values), Validity (decided value was proposed), Termination (eventually decides), Integrity (decides at most once).

What does the FLP impossibility result say?::In a fully asynchronous network with even one failure, no deterministic protocol solves consensus. Practical protocols assume partial synchrony.

How many nodes for F-failure tolerance?::Crash failures: 2F+1 (majority quorum). Byzantine failures: 3F+1.

Why majority quorums?::Any two majorities of F+1 share at least one node. That overlap guarantees agreement — no two majorities can decide different values.

Paxos vs Raft?::Same safety properties. Paxos: original (Lamport 1998), notoriously hard. Raft: designed for understandability (Ongaro & Ousterhout 2014), explicit leader + log + clear election rules.

Name three production systems using consensus.::etcd, ZooKeeper, Consul, Spanner, CockroachDB, Kafka (KRaft), TiKV.

## Feynman Test

Explain to a junior engineer why consensus is "the central primitive of distributed systems."

Walk through why a system using "heartbeat + elect new leader" without majority quorum can split-brain.

## Mastery Checklist

- **Explain** consensus and its safety properties.
- **Compare** Paxos and Raft.
- **Derive** node count for a given fault tolerance.
- **Critique** systems claiming consistency without using consensus.
- **Design** a coordination layer using etcd or ZooKeeper.

[^DDIA-354]: Designing Data-Intensive Applications, Kleppmann, Ch. 9, pp. 354–376.
[^FLP-1985]: Fischer, Lynch, Paterson, "Impossibility of Distributed Consensus with One Faulty Process," 1985.

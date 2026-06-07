---
title: Zookeeper
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Consensus]]", "[[Leader Election]]"]
related: ["[[Chubby]]", "[[HBase]]", "[[Apache Kafka]]"]
builds_toward: []
sources:
  - Hunt et al. "ZooKeeper: Wait-free coordination for Internet-scale systems" (USENIX ATC 2010)
  - Apache ZooKeeper docs
tags: [case-study, coordination, zookeeper]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Zookeeper

## Executive Summary

**Apache Zookeeper** is the open-source coordination service modeled on Google's [[Chubby]]. Provides a tiny hierarchical filesystem-like data store with **strong consistency** (Zab protocol, a Paxos variant), **ephemeral nodes** tied to client sessions, and **watches** for change notification. The substrate for distributed locks, leader election, service discovery, and configuration in countless systems.

## Why It Exists

Distributed systems all need: leader election, configuration, group membership, distributed locks. Building these per project is bug-prone. Zookeeper centralizes the hard parts (consensus, durability) so applications get correct coordination for free.

## Architecture

- **Ensemble** (cluster) of typically 3 or 5 servers.
- **Zab protocol** — leader-based atomic broadcast (similar to Paxos/Raft).
- **Quorum** writes go through leader; reads can be from any server (eventually consistent unless `sync()` called).
- **Sessions** — TCP heartbeat; expire on disconnect.
- **Ephemeral znodes** — auto-deleted on session expire.
- **Watches** — one-shot notifications on znode change.

## Data Model

- **Hierarchical namespace**: `/services/foo/bar` like a filesystem.
- **Znodes** — nodes in tree; small (KB-sized) data.
- **Persistent vs ephemeral**.
- **Sequential nodes** — auto-numbered (used in lock recipes).
- **Versioned** — each write returns a new version; CAS via expected version.

## Recipes (canonical patterns)

- **Distributed lock** — create ephemeral sequential node; the lowest-numbered holder owns the lock.
- **Leader election** — same pattern.
- **Configuration distribution** — watch a config znode; consumers re-read on change.
- **Group membership** — each member creates an ephemeral child; group = list of children.

## Strengths

- **Strong consistency** by default (linearizable writes).
- **Tiny dependency footprint** — battle-tested for 15+ years.
- **Recipes** are well-understood.

## Weaknesses

- **Not a database** — small data (KB per znode), low throughput (~10k writes/s).
- **Operational fragility** — JVM heap, GC pauses; ensemble HA tricky.
- **Hot watches** can overload.
- **Single namespace** — multi-tenant isolation requires care.

## Real Production

- **Kafka** — used Zookeeper for cluster metadata (until KRaft, 2021+).
- **HBase** — coordination.
- **Hadoop / YARN** — RM HA, service discovery.
- **Twitter Finagle, LinkedIn** — service discovery.
- **Solr** — cluster coordination.

## Evolution

- **etcd** (CoreOS, 2013) — Raft-based, gRPC API, used by Kubernetes; widely supplants Zookeeper in new systems.
- **Consul** (HashiCorp) — service discovery + KV.
- **Kafka KRaft** — internalized coordination, removing Zookeeper dependency.

## Lessons

- A simple correct primitive (consistent KV + ephemeral nodes + watches) replaces many bespoke coordination layers.
- Distributed coordination is **expensive** — don't put hot paths through it.
- Even successful designs get superseded — etcd/KRaft show how Zookeeper's role evolved.

## Related Concepts

- [[Chubby]] — Google's predecessor.
- [[Consensus]] / [[Paxos]] / [[Raft]] — substrate.
- [[Leader Election]] — canonical recipe.
- [[Apache Kafka]] — historical user.

## Active Recall Questions

What protocol does Zookeeper use for consensus?::Zab (Zookeeper Atomic Broadcast) — a leader-based atomic broadcast protocol similar to Paxos/Raft.

What is an ephemeral znode?::A znode tied to a client session; automatically deleted when the session ends (heartbeat lost); foundational for leader election and group membership.

How does a distributed lock work in Zookeeper?::Each contender creates an ephemeral sequential node under a lock parent; the node with the lowest sequence number holds the lock; others watch their predecessor.

Why are writes routed through the leader?::Zab requires the leader to assign ordering and broadcast to a quorum of followers; ensures linearizable write semantics.

What's the typical Zookeeper ensemble size and why an odd number?::3 or 5 nodes; odd sizes balance fault tolerance and quorum (3 tolerates 1 failure, 5 tolerates 2) without giving an even quorum.

Why are reads not strictly linearizable by default?::Followers can serve reads from their local replicated state; to read latest, client calls `sync()` first or contacts the leader.

What replaced Zookeeper in Kafka and Kubernetes ecosystems?::KRaft in Kafka (internalized Raft-based metadata); etcd in Kubernetes (Raft-based, gRPC API).

## Feynman Test

Why is "putting application data into Zookeeper" almost always a mistake even though it has a hierarchical namespace like a database?

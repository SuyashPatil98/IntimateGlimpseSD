---
title: Rebalancing
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Partitioning]]", "[[Consistent Hashing]]"]
related: ["[[Partitioning]]", "[[Consistent Hashing]]", "[[Hot Partitions]]", "[[Replication]]"]
sources:
  - DDIA, Ch. 6, pp. 209–214
  - SDI vol 1, Ch. 5
tags: [distributed-systems, partitioning, operations]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Rebalancing

## Executive Summary

Rebalancing is the process of **moving partitions between nodes** when cluster topology changes — new nodes added, old nodes removed, load skewed. The goal: restore even distribution of data and load without disrupting ongoing operations. Done badly, rebalancing causes cascading failures (the new node falls over during ingest), data loss (writes lost during migration), or degraded service (latency spikes for hours). Done well, it's largely invisible. The hard problems are *when* to trigger, *how fast* to move data, and *how to keep serving* during the move.

## Why This Exists

Partitioned clusters aren't static. Storage grows, nodes fail, capacity gets added, hot partitions emerge. Without rebalancing, the cluster's distribution drifts from optimal — some nodes overflow, others sit idle. Rebalancing is the operational mechanism that keeps the cluster healthy as the world changes.

## Core Intuition

A library has 10 shelves. Books arrive faster than expected; shelf 3 overflows. You hire two new shelves. You need to redistribute books — but the library can't close. You move books in batches at off-peak hours, keep a forwarding pointer for anything mid-move, and accept temporarily higher staff load during the migration.

Distributed system rebalancing is the same operation in software.

## Internal Mechanics

**Rebalancing strategies:**

1. **Fixed number of partitions** (Cassandra, Riak, ElasticSearch) — far more partitions than nodes; move whole partitions between nodes. Simple, predictable.
2. **Dynamic partitioning** (HBase, MongoDB) — partitions auto-split when too large, auto-merge when small. Continuous gentle rebalancing.
3. **Proportional to node count** (Cassandra with vnodes) — number of partitions scales with cluster size; movement is per-vnode.

**Trigger types:**

- **Manual** — operator decides when to rebalance. Safest; least automatic.
- **Automatic** — system detects skew and reacts. Fastest; risk of thrashing.
- **Hybrid** — automatic detection, manual approval (Cassandra's rebalance recommendation).

**Migration mechanics:**

1. Mark destination as receiving for the partition.
2. Copy data from source to destination (often via streaming replication of the partition's log).
3. Verify consistency.
4. Update routing table; clients now direct writes to new node.
5. Source releases the partition.

**Forwarding** during migration: routing layer holds a temporary "this partition is moving" state; requests to either source or destination are forwarded as needed.

## Architecture Diagrams

```
Before:
  Node A: [P0, P1, P2]
  Node B: [P3, P4, P5]
  
Add Node C:
  Phase 1 (copying):
    Node A: [P0, P1, P2]                Node C: [P2 copying]
    Node B: [P3, P4, P5]
  
  Phase 2 (transition):
    Node A: [P0, P1]    Node B: [P3, P4]    Node C: [P2, P5]
    
  Phase 3 (steady):
    Node A: [P0, P1]    Node B: [P3, P4]    Node C: [P2, P5]
```

## Design Tradeoffs

**Throttling rebalance speed:** faster movement = quicker recovery but more CPU/disk/network load. Most systems offer tunable throttle.

**Auto vs manual:**
- Auto: handles routine churn invisibly; risks thrashing during transient skew.
- Manual: predictable; requires operator vigilance.

**Move whole partitions vs split + migrate:**
- Move whole: simple; large partitions take longer.
- Split + migrate: gradual but more bookkeeping.

## Real Production Examples

- **Cassandra** — uses vnodes for fine-grained rebalancing. Manual trigger (`nodetool repair / rebuild`). Throttle via `stream_throughput_outbound_megabits_per_sec`.
- **MongoDB** — automatic chunk migration in sharded clusters. Throttled by balancer settings.
- **HBase** — auto-split regions when they exceed threshold; region server load balancer redistributes.
- **Kafka** — partition reassignment is a manual operation but is the standard way to add brokers.
- **DynamoDB** — adaptive capacity automatically migrates hot partitions.
- **Elastic / OpenSearch** — automatic shard allocation with awareness of node load.

## Interview Perspective

**Common questions:**
- "How do you add a node to a sharded cluster?" → Run rebalancing: copy partitions to new node, update routing, drain old assignments.
- "What goes wrong during rebalancing?" → Network saturation, latency spikes, write loss if not careful, cascading failures if new node can't keep up.
- "Auto vs manual?" → Auto for routine scale; manual for major topology changes.

**Senior-level:**
- The hard part of rebalancing isn't the algorithm — it's the operational orchestration. Network saturation, double-counting writes, partial failures during migration, cluster topology disagreements.
- Cassandra's "fixed number of vnodes" choice trades flexibility (you can't easily change vnode count later) for simplicity (rebalancing is just streaming).
- Cluster topology changes should be slow and observable. Sudden, large changes are how systems die.

**Common mistakes:**
- Rebalancing during peak traffic and saturating the network.
- Triggering automatic rebalancing on transient skew — leads to oscillation.
- Forgetting that new nodes need warm-up time before serving production load.

## Related Concepts

- [[Partitioning]] · [[Consistent Hashing]] — the schemes that determine rebalancing behavior.
- [[Hot Partitions]] — sometimes triggers rebalancing.
- [[Replication]] — rebalancing typically streams partition logs.

## Misconceptions

- **"Adding a node always helps."** Not during rebalancing — the new node is *consuming* capacity, not adding it, until migration completes.
- **"Auto-rebalancing is always safer."** No — risk of thrashing under transient skew. Hysteresis is required.
- **"Rebalancing is just a copy operation."** It involves coordination, routing updates, validation, and rollback paths.

## Failure Scenarios

- **Network saturation during rebalance:** background migration competes with production traffic. Mitigation: throttle; off-peak scheduling.
- **New node falls over** during initial ingest. Mitigation: warm-up phase, traffic ramp.
- **Lost writes during transition window** — writes go to old node but should be on new. Mitigation: dual-write window, or routing layer holds writes during cutover.
- **Topology disagreement** — different clients see different ring versions. Mitigation: gossip with version vectors; coordinator-driven topology changes.
- **Rebalance thrashing** — auto-rebalance reacts to noise; constantly moves data. Mitigation: hysteresis, minimum-stability window.

## Practical Engineering Heuristics

- **Rebalance during off-peak** if at all possible.
- **Throttle aggressively** — better slow and stable than fast and disruptive.
- **Pre-warm new nodes** before they take production traffic.
- **Monitor during rebalance** — latency, write success rate, throughput, queue depths.
- **Use hysteresis** for automatic rebalancing — don't react to transient skew.

## Active Recall Questions

What is rebalancing?::Moving partitions between nodes to restore even distribution when cluster topology changes (nodes added/removed) or load shifts.

What's the main goal during rebalancing?::Restore even distribution without disrupting service. Writes should not be lost; latency should not spike unacceptably.

Three rebalancing strategies?::Fixed number of partitions (Cassandra, Riak, ElasticSearch); dynamic partitioning with auto-split (HBase, MongoDB); proportional to node count (Cassandra with vnodes).

Auto vs manual rebalancing trade-off?::Auto handles routine churn invisibly but risks thrashing under transient skew. Manual is predictable but requires operator vigilance.

Why throttle rebalancing?::Faster movement uses more CPU/disk/network, potentially saturating production traffic. Slow + stable beats fast + disruptive.

What's the dual-write technique during migration?::During the cutover window, writes are sent to both source and destination partitions. Avoids losing writes mid-move. Drop the dual-write once migration completes.

## Feynman Test

Walk through adding a new node to a 4-node Cassandra cluster. What happens in what order? What can go wrong?

Why does auto-rebalancing need hysteresis? Construct a thrashing scenario without it.

## Mastery Checklist

- **Explain** rebalancing strategies (fixed, dynamic, proportional).
- **Compare** auto and manual triggering with their failure modes.
- **Derive** an appropriate throttle for a given cluster size and traffic.
- **Critique** "just add a node" suggestions during high traffic.
- **Design** a rebalancing protocol with explicit dual-write windows.

[^DDIA-209]: Designing Data-Intensive Applications, Kleppmann, Ch. 6, pp. 209–214.

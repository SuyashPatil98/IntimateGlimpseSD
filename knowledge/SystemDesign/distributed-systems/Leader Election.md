---
title: Leader Election
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Consensus]]", "[[Failure Detection]]"]
related: ["[[Consensus]]", "[[Paxos]]", "[[Raft]]", "[[Split Brain]]", "[[Leader-Based Replication]]"]
sources:
  - DDIA, Ch. 9 (pp. 366–372)
  - Raft and Paxos papers
tags: [distributed-systems, consensus, leader-election]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Leader Election

## Executive Summary

Leader election is the **sub-problem of consensus where nodes agree on which one of them is the leader**. Required by every leader-based system: replicated logs, coordination services, transaction managers, primary-replica databases. Naive election (heartbeat timeout + first to try wins) silently causes [[Split Brain]]. Safe leader election requires **quorum agreement** — typically embedded in a consensus protocol like [[Raft]] or [[Paxos]] — plus **fencing tokens** to prevent old leaders from continuing to act.

## Why This Exists

Many distributed problems are easier with a single coordinator: a leader for the write log, a primary for the database, a master for the cluster. But you can't just "designate" one — the designated node might fail; multiple nodes might try to take over simultaneously; partition might isolate the current leader. Leader election is the protocol that elects a single leader safely under failures.

## Core Intuition

A teacher leaves a classroom. The students need to pick a representative. Several volunteer; they vote. Whoever gets a majority becomes the representative. If two students claim victory because they didn't see each other's votes, you have [[Split Brain]] — both think they're the leader, both make conflicting decisions.

The discipline is: **majority must agree**, and the old leader (if it returns) must accept that it's been deposed.

## Internal Mechanics

**Naive (unsafe) approach:**
1. All nodes monitor the current leader via heartbeats.
2. When timeout fires, the first node to notice declares itself leader.
3. Other nodes accept it.

**Why this fails:** asymmetric partition → two nodes both think they're alone → both declare themselves leader → split brain.

**Safe approach (used by Raft, Paxos, ZooKeeper):**
1. Nodes monitor leader via heartbeats with randomized timeouts.
2. When a follower's timeout fires, it becomes a candidate, increments its term.
3. Candidate requests votes from others.
4. Each node votes for at most one candidate per term (first-come or based on log freshness).
5. **Majority vote required.** Only the side of a partition with the majority can elect.
6. New leader takes office; old leader (if it returns) sees a higher term and steps down.

**Fencing:** to prevent an old leader from continuing to act after a new one is elected, storage layers reject writes from outdated tokens. Each leader gets a monotonically increasing token; storage tracks the latest.

## Architecture Diagrams

```
3 nodes; leader L1 partitioned from L2, L3.

Time t1: L1 sees only itself. Cannot reach majority.
         L2, L3 see each other. L2 starts election.
         L2 requests vote from L3. L3 votes yes.
         L2 has 2 votes (self + L3) = majority. L2 becomes leader.

Time t2: Partition heals. L1 returns.
         L1 sees L2 has higher term. L1 steps down.

If L1 tried to keep writing during partition:
  - With fencing tokens: storage rejects L1's writes (lower token).
  - Without: split brain. Divergent state. Disaster.
```

## Design Tradeoffs

**Quorum-based election:**
- ✓ Mathematically prevents split brain on majority side.
- ✗ Minority side cannot elect → loses availability.
- ✗ Election window is unavailable for writes.

**Lease-based election:**
- ✓ Time-bounded; old leader can self-terminate.
- ✗ Depends on bounded clock skew.

**External coordinator (ZooKeeper/etcd):**
- ✓ Offload election complexity to a battle-tested service.
- ✗ Adds external dependency.
- ✗ Requires understanding the coordinator's failure modes too.

## Real Production Examples

- **Raft-based systems (etcd, Consul, CockroachDB)** — leader election is built into Raft.
- **ZooKeeper / Curator recipes** — clients elect a leader via ephemeral nodes.
- **MongoDB replica sets** — Raft-derived leader election.
- **PostgreSQL with Patroni** — election via Consul/etcd lease.
- **Kafka (older versions)** — ZooKeeper-based controller election.
- **Kubernetes** — `leader-election` library for controllers.

## Interview Perspective

**Common questions:**
- "How would you elect a leader?" → Use a consensus protocol (Raft/Paxos) or an external coordinator (etcd/ZooKeeper). Don't roll your own.
- "What's wrong with 'first to detect failure declares itself leader'?" → Split brain. Multiple nodes can declare simultaneously without coordination.
- "What's a fencing token?" → Monotonic ID issued to each leader; storage rejects writes from old tokens. Prevents deposed leaders from continuing.

**Senior-level:**
- The hardest part of leader election isn't electing — it's *deposing* the old leader. Without fencing, the old leader can keep writing until it realizes it's deposed.
- "Bully algorithm" and "ring algorithm" are textbook leader-election protocols; both suffer from split-brain risks. Production uses majority quorum + fencing.
- For high availability, the election window must be short — but short election timeouts cause false-positive elections under load.

**Common mistakes:**
- Rolling your own election with just heartbeats.
- Forgetting fencing tokens — leads to split brain on partition healing.
- Setting election timeouts too aggressive — election storms under load.

## Related Concepts

- [[Consensus]] — leader election is a sub-problem.
- [[Paxos]] · [[Raft]] — consensus protocols that include election.
- [[Failure Detection]] — triggers elections.
- [[Split Brain]] — what bad election causes.
- [[Leader-Based Replication]] — primary consumer of leader election.

## Misconceptions

- **"The first node to notice the leader is gone becomes the new leader."** Recipe for split brain.
- **"Election is rare so it doesn't need to be safe."** Even one bad election causes data loss.
- **"Heartbeats + timeouts = leader election."** That's just failure detection. Election is the protocol that follows.

## Failure Scenarios

- **Election storm** — leader keeps churning due to network noise. Mitigation: pre-vote phase, larger timeouts, hysteresis.
- **Partition healing surfaces split brain** — old leader returns, kept writing. Mitigation: fencing tokens.
- **Slow election** — long timeout = long unavailability. Mitigation: tune timeout to network reality; accept the trade-off.

## Practical Engineering Heuristics

- **Use a coordination service (etcd, ZooKeeper, Consul) or a Raft library.**
- **Always combine quorum election with fencing tokens.**
- **Test partitions explicitly** with chaos engineering.
- **Monitor leader stability** — frequent elections are an operational signal.

## Active Recall Questions

What is leader election?::The sub-problem of consensus where nodes agree on which one of them is the leader. Required by every leader-based system.

Why does naive election cause split brain?::Without quorum coordination, multiple nodes can declare themselves leader simultaneously under partition or asymmetric failure detection.

What prevents split brain in safe leader election?::Majority quorum (only majority side can elect) + fencing tokens (storage rejects writes from old leaders).

What's a fencing token?::Monotonically increasing ID issued to each leader. Storage layer rejects writes from outdated tokens, preventing deposed leaders from continuing.

How does Raft handle leader election?::Followers with timeout become candidates; request votes; majority vote wins. Randomized timeouts break ties; election restriction ensures the new leader has all committed entries.

What's the trade-off in election timeout duration?::Short: fast detection but false positives under load. Long: stable but slow recovery.

Why not implement leader election from scratch?::Subtle bugs cause data loss. Use Raft (etcd) or ZooKeeper recipes — battle-tested implementations.

## Feynman Test

Walk through a leader election scenario with three nodes where the leader is partitioned. What goes right; what could go wrong?

Why is "first to detect failure becomes leader" fundamentally unsafe? Construct a split-brain scenario.

## Mastery Checklist

- **Explain** leader election and its relationship to consensus.
- **Compare** Raft election with naive heartbeat election.
- **Derive** why quorum + fencing prevents split brain.
- **Critique** "automatic failover" designs lacking fencing.
- **Design** a leader-elected service using etcd.

[^DDIA-366]: Designing Data-Intensive Applications, Kleppmann, Ch. 9, pp. 366–372.

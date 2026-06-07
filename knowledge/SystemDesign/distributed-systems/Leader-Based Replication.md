---
title: Leader-Based Replication
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]"]
related: ["[[Replication]]", "[[Multi-Leader Replication]]", "[[Leaderless Replication]]", "[[Replication Lag]]", "[[Synchronous vs Asynchronous Replication]]", "[[Consensus]]", "[[Leader Election]]"]
builds_toward: ["[[Consensus]]", "[[Distributed Transactions]]"]
sources:
  - DDIA, Ch. 5, pp. 152–164
  - SDI vol 1, Ch. 6
  - system-design-primer (Donne Martin)
tags: [distributed-systems, replication]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Leader-Based Replication

## Executive Summary

Leader-based replication (also: master-slave, primary-replica, single-leader) designates **one node as the leader** that accepts all writes. The leader replicates writes to **followers**. Reads can come from the leader (strongly consistent) or any follower (potentially stale). It's the **default architecture** for most relational databases (PostgreSQL, MySQL) and many NoSQL systems (MongoDB, Redis). Simple to reason about; creates a single point of failure for writes; demands careful failover.

## Why This Exists

Multiple nodes can't independently accept writes to the same data without coordinating — concurrent writes produce inconsistent state. The simplest coordination is: designate ONE node as authoritative. All writes flow through it; it orders them; everyone else replicates. This eliminates concurrent-write conflicts at the cost of routing all writes through one bottleneck.

## Core Intuition

A librarian and assistants. Anyone can read books (followers serve reads). Only the librarian (leader) can add or modify books. After adding a book, the librarian whispers the change to assistants (followers), who update their lists. Ask an assistant about a brand-new book and they might say "no record" because the whisper hasn't arrived — that's [[Replication Lag]].

## Internal Mechanics

1. **Write** arrives at leader.
2. Leader applies write locally; appends entry to replication log.
3. **Replication mode** ([[Synchronous vs Asynchronous Replication]]):
   - **Sync** — leader waits for ≥1 follower ack.
   - **Async** — leader responds immediately; followers catch up.
   - **Semi-sync** — leader waits for one specific follower; others async.
4. **Followers** consume log; apply in order.
5. **Reads** → leader (linearizable) or followers (sequentially consistent, stale).

**Failover** (leader fails):
1. Detect failure (heartbeat timeout).
2. Choose new leader (manual, or via [[Consensus]]).
3. Reconfigure clients.
4. Old leader (if returns) demotes to follower.

## Architecture Diagrams

```
                    ┌──────────────┐
                    │   LEADER     │ ← all writes
                    └──────┬───────┘
                           │ replication log
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌────────┐   ┌────────┐   ┌────────┐
        │Follower│   │Follower│   │Follower│
        └────────┘   └────────┘   └────────┘
            ↑            ↑            ↑
            └────────────┴────────────┘
                         │
                    reads (possibly stale)
```

## Design Tradeoffs

**Benefits:**
- Simple consistency model — one writer serializes.
- Easy to reason about; most familiar DB pattern.
- Strong consistency on leader; reasonable read scaling via followers.

**Costs:**
- **SPOF for writes.** Failover required and risky.
- Leader is a **write-throughput ceiling**.
- Follower reads are **stale** under async.
- Failover risks **split brain**.

## Real Production Examples

- **PostgreSQL** — streaming replication; sync/async per follower.
- **MySQL** — async default; semi-sync available.
- **MongoDB replica sets** — Raft-derived election.
- **Redis Sentinel / Cluster** — leader-based per shard with auto-failover.
- **Kafka** — per-partition leader-based.

## Interview Perspective

**Common questions:**
- "Explain failover." → Detect → elect → reconnect. Write-failure window.
- "Why are reads stale?" → Async; follower hasn't caught up.
- "What's split brain?" → Old leader returns thinking it's still leader; two leaders. Mitigation: fencing tokens, leases.

**Senior-level:**
- Leader is a throughput cap — past it, you must [[Partitioning|partition]]. Replication alone doesn't scale writes.
- Failover correctness is the hardest part. "Just elect a new leader" hides safety properties (no two leaders, no committed-write loss).
- Spanner uses Paxos per-shard; CockroachDB uses Raft. Heartbeat-based failover is fragile.

## Related Concepts

- [[Replication]] — parent.
- [[Synchronous vs Asynchronous Replication]] · [[Replication Lag]] · [[Consensus]] · [[Leader Election]]
- [[Multi-Leader Replication]] — alternative when single leader too restrictive.

## Misconceptions

- **"Single leader = no scaling."** Reads scale via followers; writes do not.
- **"Automatic failover always works."** Failover is the most failure-prone operation in a leader-based system. Test rigorously.
- **"Sync replication = no data loss."** Only with quorum sync to ≥1 durable replica.

## Failure Scenarios

- **Leader fails before async replication catches up:** acknowledged writes lost. Mitigation: sync/semi-sync.
- **Split brain:** old leader partitioned but alive; new leader elected; both accept writes. Mitigation: fencing tokens (monotonic IDs), leases shorter than partition detection.
- **Follower diverges:** schema bug or corruption causes incorrect log apply. Mitigation: checksums, drift detection.
- **Cascading failure on failover:** new leader can't handle traffic. Mitigation: capacity headroom on followers.

## Practical Engineering Heuristics

- **Always ≥1 sync follower** for writes that matter.
- **Raft/Paxos for election**, not heartbeat timeouts alone.
- **Capacity-plan followers as if they'll become leader.**
- **Read from leader for read-your-writes**; followers for general reads.
- **Monitor lag per-follower** with SLO breach alerts.

## Active Recall Questions

What's the core principle of leader-based replication?::All writes go through a designated leader; followers replicate the log. Eliminates concurrent-write conflicts by serializing through one node.

Where do reads come from in leader-based replication?::Leader (linearizable) or followers (potentially stale, sequentially consistent).

What's the main failure mode?::Leader failure requires failover. During the gap between failure and new-leader election, writes fail. Risk of split brain.

What's split-brain and how is it prevented?::Two leaders simultaneously accept writes after partition. Prevented by quorum-based election (only majority can elect), fencing tokens, and leases.

Why doesn't leader-based replication scale writes?::All writes go through one node — its throughput is the system's ceiling. To scale writes, shard.

How does MongoDB replica set failover work?::Heartbeat detects primary failure → secondaries elect via Raft-derived protocol → majority chooses new primary → clients reconnect via driver discovery.

## Feynman Test

Walk through async replication where a user "loses" their own write. How would you prevent it?

Why is Raft-based election safer than heartbeat-timeout election?

## Mastery Checklist

- **Explain** leader-based replication including failover.
- **Compare** with multi-leader and leaderless.
- **Derive** when leader-based is the right choice.
- **Critique** "we'll just use a primary/secondary setup" — what's missing?
- **Design** a leader-based system with explicit failover protocol.

[^DDIA-152]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 152–164.

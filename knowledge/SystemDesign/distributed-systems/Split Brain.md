---
title: Split Brain
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Leader-Based Replication]]", "[[Failure Detection]]"]
related: ["[[Leader Election]]", "[[Failure Detection]]", "[[Consensus]]", "[[Leader-Based Replication]]"]
sources:
  - DDIA, Ch. 8 (pp. 293–301), Ch. 9
  - SDI vol 1, Ch. 6
tags: [distributed-systems, failure-mode, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Split Brain

## Executive Summary

Split brain is the failure mode where **a partitioned cluster ends up with two (or more) nodes simultaneously believing they are the leader**, each accepting writes. Devastating: divergent state, lost writes, undetectable corruption. The classic cause: leader becomes briefly unreachable; followers elect a new leader; old leader returns thinking it's still in charge. Mitigated by **quorum-based [[Leader Election]]**, **fencing tokens**, **leases**, and **STONITH** ("shoot the other node in the head") — but never fully solved without coordination.

## Why This Exists

Single-leader systems gain consistency by routing all writes through one node. The implicit assumption: there's exactly one leader. Network partitions break that assumption. Without explicit safeguards, partition healing finds two leaders that disagree. Their accepted writes are now mutually contradictory; merging them may lose data. Split brain is the canonical "this looks fine but is silently broken" failure.

## Core Intuition

A company with one CEO. The CEO goes on vacation; the board appoints a replacement. The original CEO returns thinking they're still in charge, makes decisions, signs contracts. Now there are two CEOs, both authoritative, both signing conflicting deals. When the company tries to honor both sets of decisions, contradictions emerge — and they can't all be reconciled.

## Internal Mechanics

**Classic split-brain scenario:**

1. Leader L is partitioned from followers (or has a long GC pause).
2. Followers detect failure; elect L' as new leader.
3. Clients reach L' and write to it.
4. Meanwhile, L is also reachable from some clients (asymmetric partition) and continues accepting writes.
5. Both L and L' append to their own logs.
6. Partition heals.
7. Now: incompatible logs. Some writes will be lost or require manual reconciliation.

**Mitigations:**

- **Quorum-based election** — leader must hold majority. With odd N, only one side of a partition can have majority. Old leader on minority side cannot keep its role.
- **Fencing tokens** — each leader is issued a monotonically increasing token. Storage rejects writes from old tokens. Old leader's writes fail.
- **Leases** — leader holds time-bounded lease. Lease expires if not renewed. After expiry, old leader cannot write.
- **STONITH** — explicit "shoot the other node in the head." Failover triggers a power-off or network-disable on the old leader before electing a new one.

## Architecture Diagrams

```
Before partition:
  Clients → [Leader L] → Followers
                  
Partition:
  Clients → [Leader L]   X   [Leader L'] ← Other clients
                              (newly elected)
                              
Both accept writes. Diverging logs.

Healing:
  L's log:  W1 → W2 → W3  (writes from L)
  L'' log:  W1 → W4 → W5  (writes from L')

Reconciliation impossible without losing data.
```

## Design Tradeoffs

**Quorum election:**
- ✓ Mathematically prevents two leaders on majority side.
- ✗ Loses availability — minority side cannot elect.

**Fencing tokens:**
- ✓ Storage enforces single-leader invariant.
- ✗ Requires storage that respects tokens (not all systems do).

**Leases:**
- ✓ Self-expiring; no coordination on revocation.
- ✗ Time-based; clock skew can cause spurious failures.

**STONITH:**
- ✓ Decisive.
- ✗ Requires infrastructure to physically disable a node; can take down a healthy node by mistake.

## Real Production Examples

- **PostgreSQL with Patroni** — uses Consul/etcd for quorum-based election; fencing via lease.
- **MongoDB replica set** — Raft election ensures only majority side has a primary.
- **Etcd / ZooKeeper / Consul** — built on consensus; cannot have split brain by construction.
- **GitHub's MySQL Orchestrator** — quorum-based failover.
- **Famous outage: GitHub 2018** — MySQL failover went wrong because of network partition and inconsistent failure detection; partial split brain resulted in 24-hour incident.

## Interview Perspective

**Common questions:**
- "What is split brain?" → Multiple nodes simultaneously act as leader after a partition. Causes divergent writes and data loss.
- "How do you prevent it?" → Quorum-based election (majority required), fencing tokens, leases, STONITH.
- "Why don't all systems use Raft/Paxos?" → They're complex; for some workloads, the safety/availability trade-off doesn't justify it. But correctness-critical systems should.

**Senior-level:**
- Split brain is the canonical reason "naive failover" doesn't work. Heartbeat timeout + elect new leader = split brain waiting to happen.
- The minority side of a partition *should* lose availability — that's the price of safety. Systems that try to keep both sides writable accept split-brain risk.
- Real production outages from split brain are devastating because they're often silent — writes accepted on both sides, partial loss on reconciliation, root cause hidden.

**Common mistakes:**
- Implementing "automatic failover" with just heartbeats — invites split brain.
- Forgetting fencing — quorum election alone doesn't prevent old leader from writing.
- Assuming "the partition was brief, surely no harm done" — even seconds of split brain can corrupt state.

## Related Concepts

- [[Leader-Based Replication]] — the architecture vulnerable to split brain.
- [[Leader Election]] — how to safely elect leaders.
- [[Consensus]] — protocols that prevent split brain by construction.
- [[Failure Detection]] — its imperfections cause split brain.
- [[CAP Theorem]] — split brain is what you get if you choose A over C during partition.

## Misconceptions

- **"Quorum election alone prevents split brain."** No — without fencing, old leader can still write until it realizes it's deposed.
- **"Brief partitions can't cause split brain."** False. Sub-second partitions have caused real-world split-brain incidents.
- **"Split brain only happens with network partitions."** No — long GC pauses, kernel hangs, and overloaded nodes also trigger it.

## Failure Scenarios

- **Asymmetric partition** — A can send to B but B can't send to A; failure detection inconsistent across the cluster.
- **Slow leader masquerading as failed** — GC pause exceeds timeout; new leader elected; old leader returns mid-write.
- **Failover during write** — write reaches old leader but ack lost during failover; new leader doesn't have the write; client sees inconsistency.

## Practical Engineering Heuristics

- **Never roll your own failover.** Use Raft/Paxos-based coordination (etcd, ZooKeeper, Consul).
- **Always combine quorum election with fencing.**
- **Test partition scenarios** — Jepsen-style testing is the standard.
- **Bias toward losing availability on the minority side** rather than risking split brain.

## Active Recall Questions

What is split brain?::Failure mode where multiple nodes simultaneously act as leader after a partition or false-failure detection, each accepting writes and diverging.

Name four split-brain mitigations.::Quorum-based leader election, fencing tokens, leases, STONITH (shoot the other node in the head).

Why does quorum election alone not prevent split brain?::Because the old leader doesn't know it's been deposed. It can keep writing until external mechanisms (fencing tokens, leases) stop it.

What's a fencing token?::A monotonically increasing token issued to each leader. Storage rejects writes from outdated tokens. Old leader's writes fail even if it doesn't know it's deposed.

Why is the minority side of a partition expected to lose availability?::Because allowing writes on both sides invites split brain. Sacrificing minority-side availability is the price of consistency.

What's the canonical split-brain prevention?::Use consensus protocols (Raft, Paxos) — they prevent two simultaneous leaders by construction.

## Feynman Test

Walk through a split-brain incident: leader has 10-second GC pause, new leader elected, original returns. What happens to writes from each? How is this resolved?

Why does GitHub's 2018 MySQL outage illustrate the danger of naive failover?

## Mastery Checklist

- **Explain** split brain with a concrete scenario.
- **Compare** prevention mechanisms (quorum, fencing, leases, STONITH).
- **Derive** why quorum election alone is insufficient.
- **Critique** "automatic failover" designs lacking fencing.
- **Design** a failover protocol that prevents split brain end-to-end.

[^DDIA-293]: Designing Data-Intensive Applications, Kleppmann, Ch. 8, pp. 293–301.

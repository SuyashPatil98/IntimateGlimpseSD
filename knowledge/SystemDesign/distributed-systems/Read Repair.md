---
title: Read Repair
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Quorums]]", "[[Leaderless Replication]]"]
related: ["[[Anti-Entropy]]", "[[Hinted Handoff]]", "[[Quorums]]", "[[Leaderless Replication]]"]
sources:
  - DDIA, Ch. 5 (p. 178)
  - Dynamo paper (DeCandia et al., 2007)
tags: [distributed-systems, replication, convergence]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Read Repair

## Executive Summary

Read repair is an **inline convergence mechanism**: when a client reads from R replicas and detects that some have stale data, the client (or coordinator) writes the latest value back to the stale ones during or after the read. The cheapest, most immediate form of replica reconciliation — catches divergence exactly where users encounter it. Complements [[Anti-Entropy]] (catches cold data) and [[Hinted Handoff]] (catches data missed during downtime).

## Why This Exists

In leaderless systems, replicas have different states at any moment (replication lag, lost messages, restarts). Without intervention, divergence persists. Anti-entropy is periodic; hinted handoff catches recent missed writes. Read repair fills the gap: *every read* implicitly checks consistency among responding replicas and fixes mismatches on the spot. Free (comparison already happening for quorum read) and immediate (no waiting for background scans).

## Core Intuition

You ask three friends for the latest news. Two say "X"; one says "Y." You believe the majority (or the most recent timestamp), tell the third friend the correct version, and move on. Next time someone asks, all three give the same answer.

## Internal Mechanics

During a quorum read:
1. Client sends read to R (or all N) replicas.
2. Replicas respond with values and version markers (timestamp, vector clock).
3. Client identifies the latest value (LWW or version-vector logic).
4. **Repair:** client/coordinator writes the latest value to any stale replica.
5. Client returns the value.

**Variants:**
- **Synchronous read repair** — repair completes before the read returns. Stronger consistency; higher latency.
- **Asynchronous read repair** — repair happens after the read returns. Faster client response; brief inconsistency window.
- **Probabilistic read repair** — only a fraction of reads trigger repair (Cassandra's `read_repair_chance`). Amortizes cost.

## Design Tradeoffs

**Benefits:**
- Cheap — comparison already happening; repair is one extra write.
- Immediate — fix at moment of detection.
- Workload-targeted — popular data gets repaired most.

**Costs:**
- Doesn't catch unread (cold) data.
- Concurrent writes during repair can break linearizability.
- Probabilistic variants add nondeterminism.

## Real Production Examples

- **Apache Cassandra** — `read_repair_chance` setting (default 10%); blocking vs background tunable.
- **Amazon DynamoDB** — internal read repair as part of eventually consistent reads.
- **Riak** — read repair on detected version mismatch.

## Interview Perspective

**Common questions:**
- "How does read repair work?" → On a quorum read, detect mismatches across replicas; write the latest value back inline.
- "What does it miss?" → Data never read. Cold data needs [[Anti-Entropy]].
- "Sync vs async?" → Sync: stronger consistency, higher latency. Async: faster reads, brief inconsistency window.

**Senior-level:**
- Read repair can violate linearizability when concurrent writes interact with repair. Even with quorum overlap, races exist.
- For correctness-critical operations, use LWT (Paxos), not bare quorums + read repair.
- Repair traffic adds load; probabilistic repair reduces overhead in read-heavy workloads.

**Common mistakes:**
- Relying on read repair alone — cold data never gets fixed.
- Disabling read repair to "speed up reads" — silent divergence accumulates.
- Assuming read repair gives linearizability.

## Related Concepts

- [[Anti-Entropy]] — catches what read repair misses (cold data).
- [[Hinted Handoff]] — catches what read repair misses (writes during downtime).
- [[Quorums]] — read repair extends quorum reads.
- [[Leaderless Replication]] — the architecture where read repair lives.

## Misconceptions

- **"Read repair fixes everything."** Only fixes what gets read.
- **"Read repair = strong consistency."** Quorum overlap + repair gives LWW consistency, not linearizability.
- **"Sync repair = no inconsistency."** Concurrent writes during repair can still produce non-linearizable histories.

## Failure Scenarios

- **Repair storm** on a hot key with many stale replicas — every read triggers writes. Mitigation: probabilistic repair.
- **Repair-during-write race** — a write happens mid-repair; linearizability violated. Mitigation: LWT for correctness-critical ops.
- **Repair to a slow node** — read latency dominated by repair write. Mitigation: async repair.

## Practical Engineering Heuristics

- **Enable read repair by default.**
- **For high-throughput reads:** probabilistic (10–20%) to amortize cost.
- **For correctness-critical writes:** don't rely on quorum + read repair; use LWT.
- **Combine with anti-entropy on a schedule** — they cover different cases.

## Active Recall Questions

What is read repair?::Inline convergence mechanism. On a quorum read, the client detects replicas with stale data and writes the latest value back during or after the read.

What does read repair miss?::Data never read. Cold keys diverge forever without anti-entropy.

Sync vs async read repair?::Sync: repair before read returns (stronger consistency, higher latency). Async: repair after (faster, brief inconsistency window).

Does read repair give linearizability?::No. Concurrent writes during repair can produce non-linearizable histories.

What's probabilistic read repair?::Only a fraction of reads trigger repair (e.g., 10%). Reduces repair traffic in read-heavy workloads.

Why is anti-entropy still needed?::Read repair only fires on access. Cold data needs periodic background scanning.

## Feynman Test

Walk through a quorum read where one replica is stale. What does read repair do? What if a write arrives during the repair?

Explain why read repair alone is insufficient for long-term consistency.

## Mastery Checklist

- **Explain** read repair and how it fits with anti-entropy and hinted handoff.
- **Compare** sync, async, probabilistic variants.
- **Derive** read repair behavior in concurrent-write scenarios.
- **Critique** "quorum + read repair = linearizability" claims.
- **Design** a leaderless read path with appropriate repair strategy.

[^DDIA-178]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, p. 178.

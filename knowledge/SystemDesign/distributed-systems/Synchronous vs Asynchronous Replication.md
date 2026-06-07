---
title: Synchronous vs Asynchronous Replication
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]"]
related: ["[[Leader-Based Replication]]", "[[Replication Lag]]", "[[CAP Theorem]]", "[[PACELC]]"]
sources:
  - DDIA, Ch. 5, pp. 153–155
  - SDI vol 1, Ch. 6
tags: [distributed-systems, replication]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Synchronous vs Asynchronous Replication

## Executive Summary

The core trade-off in replication: **synchronous** replication waits for follower(s) to acknowledge before reporting success — strong durability, but write latency = max-follower-roundtrip. **Asynchronous** replication reports success immediately and propagates in the background — fast, but acknowledged writes can be lost if the leader fails before propagation. **Semi-synchronous** is the practical middle: wait for one follower, allow the rest to lag. Most production systems use async by default and sync for the writes that absolutely cannot be lost.

## Why This Exists

Every replicated system must answer: when do we tell the client their write succeeded? Before or after we've copied it elsewhere? "Before" wins on latency but loses durability if leader fails. "After" wins on durability but pays roundtrip latency. No third option without redefining "success."

## Core Intuition

Synchronous = "I'll only confirm your message when I've forwarded it to a witness." Slow, but if I crash, the witness has your message.

Asynchronous = "I'll confirm immediately and forward later." Fast, but if I crash before forwarding, your message is gone — even though I told you it was received.

## Internal Mechanics

**Synchronous flow:**
1. Client → write to leader.
2. Leader applies locally.
3. Leader sends to follower(s).
4. Follower(s) apply and ack.
5. Leader acks client.

Total latency = local write + network round-trip + follower apply.

**Asynchronous flow:**
1. Client → write to leader.
2. Leader applies locally.
3. Leader acks client immediately.
4. (Later) Leader sends to followers; they apply.

Total latency = local write only.

**Semi-synchronous:** one follower is designated sync (must ack before client returns); others async. Bounds worst-case data loss to "one specific follower must also fail."

## Design Tradeoffs

| Mode | Latency | Durability | Availability under follower failure |
|---|---|---|---|
| Sync to all | Highest | Strongest | Writes block if any follower down |
| Sync to one (semi-sync) | Higher | Strong | Writes block if the chosen follower down |
| Async | Lowest | Weakest | Writes always proceed |

Semi-sync is usually the right production default: bounded data loss without making writes hostage to all followers.

## Real Production Examples

- **PostgreSQL** — per-replica `synchronous_standby_names`; sync, async, or quorum.
- **MySQL** — `semi-sync` plugin commonly used in production.
- **MongoDB** — `writeConcern: majority` is quorum-sync (write to majority before ack).
- **Kafka** — `acks=all` waits for all in-sync replicas; `acks=1` is leader-only async.
- **Cassandra (W=1)** — async-ish; `W=QUORUM` is quorum-sync.

## Interview Perspective

**Common questions:**
- "Why not always synchronous?" → Latency. Sync replication adds round-trip cost to every write. Often unacceptable for user-facing workloads.
- "Why not always async?" → Data loss risk. If the leader fails before propagation, acknowledged writes vanish.
- "What's semi-sync?" → Compromise: one mandatory follower (durability bound), rest async (latency bound).

**Senior-level:**
- The right level varies per operation, not per system. Financial commits → sync. Profile updates → async. Modern DBs support per-transaction tuning.
- "Sync to majority" (writeConcern: majority, acks=all with min ISR) is the practical sweet spot — durable, but tolerates F follower failures where N=2F+1.
- Sync replication interacts with [[CAP Theorem]] — sync over a partition stops writes (CP). Async keeps serving (AP).

**Common mistakes:**
- "Sync = guaranteed no data loss." Only if all sync replicas use durable storage AND the round-trip really completed.
- Async without monitoring replication lag — invisible data risk.
- Forgetting that the failure mode "leader dies right after acking but before replicating" is exactly what async accepts.

## Related Concepts

- [[Replication]] · [[Leader-Based Replication]] · [[Replication Lag]]
- [[CAP Theorem]] · [[PACELC]] — the choice maps to A vs C and to L vs C.
- [[Quorums]] — quorum-sync is a generalization.

## Misconceptions

- **"Sync replication = strong consistency."** Sync gives durability of acknowledged writes; consistency is a separate property determined by read path.
- **"Async replication is unsafe."** Used with proper monitoring and acceptable RPO, it's the right default for most workloads.
- **"Semi-sync is just a compromise."** It's a deliberate engineering choice giving bounded data loss with acceptable latency.

## Failure Scenarios

- **Leader fails post-ack, pre-replicate (async):** the write is lost. Client thinks it succeeded.
- **Sync follower is down:** sync writes block. Mitigation: timeout + fallback to async (with explicit alert).
- **Sync follower is slow:** all writes pay its latency. Mitigation: quorum-sync, ejection policies.
- **Replication-protocol bug:** sync follower applies different data than it acked. Mitigation: checksums, post-failover validation.

## Practical Engineering Heuristics

- **Default to async** unless you have a specific durability requirement.
- **Use semi-sync** for production databases with money or anything you can't lose.
- **Quorum-sync** (writeConcern: majority) is the most robust pattern at moderate latency cost.
- **Monitor replication lag** as an SLI in async mode. Set alerts.
- **Test the post-ack-pre-replicate failure** explicitly during chaos drills.

## Active Recall Questions

What's the core trade-off between sync and async replication?::Sync = strong durability of acknowledged writes, higher latency. Async = low latency, possible data loss if leader fails before propagation.

What is semi-sync?::Leader waits for one designated follower to ack (bounded durability) but allows others to lag. Compromise between sync and async.

How is "writeConcern: majority" in MongoDB different from full sync?::Waits for a majority of replicas to ack, not all. Tolerates minority failures without blocking writes.

What's the worst-case data loss in async replication?::All writes acknowledged in the time window between the last successful replication and the leader failure.

Why is async still the right default for most workloads?::Latency. Most user-facing operations tolerate sub-second window of data-loss risk in exchange for sub-10ms writes.

What's the relationship between sync replication and CAP?::Sync replication is CP-leaning — it stops accepting writes when replicas can't be reached. Async is AP-leaning.

## Feynman Test

Walk through the exact failure window in async replication where a successful write is lost. How big is this window in practice?

Explain why quorum-sync (writeConcern: majority) gives you most of sync's durability with most of async's latency.

## Mastery Checklist

- **Explain** sync, async, semi-sync, and quorum-sync.
- **Compare** them on latency, durability, and availability.
- **Derive** the right mode for a given workload's RPO and latency budget.
- **Critique** "we use sync replication for safety" without questioning latency cost.
- **Design** a system that uses different modes for different operations.

[^DDIA-153]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 153–155.

---
title: Replication Lag
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]", "[[Synchronous vs Asynchronous Replication]]"]
related: ["[[Read-Your-Writes Consistency]]", "[[Monotonic Reads]]", "[[Eventual Consistency]]", "[[Leader-Based Replication]]"]
builds_toward: ["[[Read-Your-Writes Consistency]]", "[[Monotonic Reads]]"]
sources:
  - DDIA, Ch. 5, pp. 161–168
  - SDI vol 1, Ch. 6
tags: [distributed-systems, replication, observability]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Replication Lag

## Executive Summary

Replication lag is the **time gap between a write being acknowledged on the leader and that write being applied on a follower**. In async-replicated systems, lag is always non-zero; under load or partition, it can grow to seconds, minutes, or unboundedly. Lag is the source of user-visible anomalies: stale reads, reads that go backward, "I just saved this but it's not showing." Three classic session guarantees — [[Read-Your-Writes Consistency]], [[Monotonic Reads]], **consistent prefix** — exist specifically to paper over replication lag for individual users without paying full sync cost.

## Why This Exists

Async replication trades durability and latency. The trade is paid in lag. Lag is invisible until it produces a user-facing anomaly: "I just updated my profile, why does it still show the old name?" The discipline is recognizing lag as a first-class concern: monitor it, bound it, and design session guarantees around it.

## Core Intuition

Mail being delivered to satellite branches. The headquarters processes a deposit instantly; the satellite branches see it tomorrow when the mail arrives. If you walk into HQ then a satellite, you might be told your balance is $0 (HQ knows it's $100; satellite hasn't gotten the mail). Replication lag is the duration of "the mail is in transit." Most of the time it's minutes; under failure, it can be days.

## Internal Mechanics

Lag emerges from:
- Network propagation time.
- Follower's apply speed (CPU, disk).
- Backlog when follower can't keep up with leader's write rate.
- Network partition or follower outage (lag grows during, catches up after).

**Lag measurement:** typically position in the replication log (e.g., Postgres WAL byte offset) compared between leader and follower. Reported as time-behind-leader or bytes-behind.

**Three categories of user-visible anomalies** caused by lag:

1. **Read your writes violation** — User writes, then reads from a stale follower. Doesn't see their own write.
2. **Monotonic reads violation** — User reads, then reads again from a more-stale follower. Sees data go backward in time.
3. **Consistent prefix violation** — Causally related writes seen out of order (e.g., reply visible before original message).

## Architecture Diagrams

```
Time →
Leader:   [W1]──[W2]──[W3]──[W4]──[W5]──[W6]──── (write rate)
            │     │     │     │     │     │
Follower:   └─[W1]─┘─[W2]──[W3]                   (lag = 3 writes ≈ 200ms)
                       ↑
                User reads here; sees W3, misses W4-W6
```

## Design Tradeoffs

Lag is the price of async. Lower lag → more sync → higher latency. Strategies to mitigate:

- **Read your writes:** route writes-then-reads to the same replica (or the leader). Solves the specific user's problem.
- **Monotonic reads:** sticky session to one replica. Prevents reads from going backward.
- **Consistent prefix:** ensure causally-related writes propagate together (typically via causal consistency).
- **Quorum reads:** read from majority, trust the newest version. Higher latency, addresses lag.

## Real Production Examples

- **Read replicas** in production databases (MySQL, Postgres): commonly used for analytics or read scaling; user-facing reads often routed to leader to avoid lag exposure.
- **MongoDB** — `readPreference: primary` for leader reads; `secondaryPreferred` accepts staleness.
- **Cassandra** — `LOCAL_QUORUM` reads from local DC; eventual visibility across DCs.
- **Cloud SQL replicas** — typical lag is milliseconds in healthy state; can spike during heavy writes or maintenance.
- **CDNs** — propagation lag from origin to edge, typically seconds.

## Interview Perspective

**Common questions:**
- "What's replication lag?" → Time gap between write on leader and apply on follower.
- "How do you handle it for user-facing reads?" → Read-your-writes (route to leader for the user's session), monotonic reads (sticky replica).
- "How do you monitor it?" → Lag in bytes or time, alerted at SLO breach.

**Senior-level:**
- Lag is *not* a constant. It's bursty — fine for hours then spikes under load. SLO on lag must be a percentile, not a mean.
- The "tail" of replication lag matters more than the average — p99 lag of 10s with mean 50ms is still a 10-second user pain.
- Session-based guarantees (RYW, MR) are cheap and effective for individual users. System-wide consistency is much more expensive.

**Common mistakes:**
- Reporting average lag instead of p99/p999.
- Assuming lag stays in the "normal" range during failure modes.
- Not testing the user experience under high lag.

## Related Concepts

- [[Replication]] · [[Synchronous vs Asynchronous Replication]]
- [[Read-Your-Writes Consistency]] · [[Monotonic Reads]] — session guarantees against lag.
- [[Eventual Consistency]] — what async replication delivers.
- [[Causal Consistency]] — addresses consistent-prefix violations.

## Misconceptions

- **"Lag is small enough to ignore."** Under load or failure it can grow huge. Plan for the tail.
- **"Lag is the same as latency."** Different. Latency = end-to-end response time. Lag = staleness gap between replicas.
- **"Sync replication eliminates lag."** Sync to all eliminates inbound lag for written replicas. Other followers (not in sync set) still lag.

## Failure Scenarios

- **Replication lag grows unboundedly** under sustained overload. Mitigation: load shedding, alerting, capacity planning.
- **Follower falls catastrophically behind** during outage; rejoining causes write storm. Mitigation: bounded recovery rate, possibly re-snapshot rather than catch up.
- **"Read your writes" silently broken** because reads were routed to a stale follower after failover. Mitigation: monotonic version tokens carried per-client.
- **Cross-region lag spike** under WAN issue. Mitigation: route reads to local quorum during impairment.

## Practical Engineering Heuristics

- **Monitor p99 lag**, not average.
- **Set explicit SLOs on lag** (e.g., p99 < 5s in healthy state).
- **Use session tokens** to route writes-then-reads to consistent replicas.
- **Read from leader for user-edit flows.** Saves a class of bugs.
- **Test high-lag scenarios** during chaos engineering — they're common in production.

## Active Recall Questions

What is replication lag?::Time gap between a write being acknowledged on the leader and being applied on a follower. Source of stale reads in async-replicated systems.

Name three user-visible anomalies caused by replication lag.::Read-your-writes violation (don't see own write); monotonic reads violation (data appears to go backward); consistent-prefix violation (causal order broken across replicas).

What's read-your-writes consistency?::A session guarantee: a client always sees its own writes. Implemented by routing writes-then-reads to the same replica or via version tokens.

What's monotonic reads?::A session guarantee: successive reads from one client never return older data than previous reads.

How is lag measured in practice?::Position in the replication log (e.g., WAL byte offset) compared between leader and follower. Reported as time-behind-leader or bytes-behind.

Why is p99 lag more important than mean lag?::Lag is bursty. Mean stays low while p99 spikes during load or partial failure. Users hit the tail and experience the worst case.

## Feynman Test

A user updates their profile photo, then refreshes the page and sees the old photo. Trace this scenario through replication lag. What guarantees would fix it, and at what cost?

Why does lag grow unboundedly under partition, and what's a sensible bound to enforce?

## Mastery Checklist

- **Explain** replication lag and the anomalies it produces.
- **Compare** session-level mitigations (RYW, MR) with system-level (sync, quorum).
- **Derive** which lag-mitigation strategy fits a given app.
- **Critique** "average lag is 50ms" claims.
- **Design** a system with explicit lag SLOs and session-token-based routing.

[^DDIA-161]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 161–168.

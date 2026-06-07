---
title: Multi-Leader Replication
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Replication]]", "[[Leader-Based Replication]]"]
related: ["[[Leader-Based Replication]]", "[[Leaderless Replication]]", "[[CRDTs]]", "[[Vector Clocks]]", "[[Eventual Consistency]]"]
builds_toward: ["[[CRDTs]]", "[[Conflict Resolution]]"]
sources:
  - DDIA, Ch. 5, pp. 168–177
  - SDI vol 1, Ch. 6
tags: [distributed-systems, replication]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Multi-Leader Replication

## Executive Summary

Multi-leader replication (also: master-master, active-active) allows **multiple nodes to accept writes**, each acting as a leader to its own followers, with leaders bidirectionally replicating to each other. Used primarily for **geographic distribution** (one leader per region, writes local to users), **collaborative editing** (each user's device is a leader), and **availability during leader failure** (multiple leaders means no single failover). The price is **conflict resolution**: when two leaders accept conflicting writes to the same key, the system must reconcile.

## Why This Exists

Single-leader replication forces all writes through one node — disastrous for users far from that node (cross-region latency) and creates a SPOF. Multi-leader lets each region or device have its own leader, accepting writes locally and replicating asynchronously to peers. The trade is: you get low write latency and partition tolerance, but you must handle write conflicts.

## Core Intuition

Multiple branches of a bank, each with its own copy of accounts. Customers can update accounts at any branch (local write — fast). Branches periodically sync. If two branches accept changes to the same account simultaneously, they must reconcile. Google Docs is a more familiar example: every user's browser is essentially a leader; edits sync; the system merges concurrent edits.

## Internal Mechanics

1. **Write** arrives at any leader.
2. Leader applies locally; sends to other leaders (async).
3. Each leader applies received writes to its own state.
4. **Conflict detection** — when two leaders independently modified the same record:
   - **Last-write-wins** — keep the higher timestamp. Lossy.
   - **Version vectors** — detect concurrency; surface conflict to app.
   - **CRDTs** — design data structures that merge associatively.
   - **App-defined merge** — domain knowledge resolves.

## Architecture Diagrams

```
   Region: US-East              Region: EU-West
   ┌──────────┐                 ┌──────────┐
   │ Leader A │←─── sync ──────→│ Leader B │
   └─────┬────┘                 └─────┬────┘
         │                            │
   ┌─────┴────┐                 ┌─────┴────┐
   │Followers │                 │Followers │
   └──────────┘                 └──────────┘
       ↑                              ↑
   US users                       EU users
```

Multi-leader doesn't *eliminate* SPOFs — it eliminates the *single* one. Each leader is now an authority within its region.

## Design Tradeoffs

**Benefits:**
- Low write latency per region.
- Survives leader failure without global failover (other leaders keep accepting writes).
- Enables offline-first apps (mobile devices, browser-based collaborative editors).

**Costs:**
- **Conflict resolution** is required and hard.
- Replication lag between leaders means stale reads across regions.
- More complex operational model.
- Foreign-key/uniqueness constraints become difficult (can't atomically check across leaders).

## Real Production Examples

- **DynamoDB Global Tables** — multi-region active-active; last-write-wins by timestamp.
- **Cosmos DB multi-write regions** — multi-leader with multiple conflict-resolution modes.
- **MySQL Group Replication / Galera** — multi-master via certification-based consensus.
- **PostgreSQL via BDR (Bi-Directional Replication)** — extension for multi-master.
- **CouchDB / PouchDB** — designed for multi-leader, offline-first usage.
- **Google Docs** — each browser is effectively a leader; operational transformation merges edits.

## Interview Perspective

**Common questions:**
- "When would you use multi-leader?" → Geo-distributed writes, offline-first apps, leader-failure tolerance.
- "How do you handle conflicts?" → LWW (simple, lossy), vector clocks + app merge, CRDTs (auto-merge), or domain rules.
- "Why don't more systems use multi-leader?" → Conflict resolution is hard and error-prone; few problems genuinely need it.

**Senior-level:**
- The right multi-leader question isn't "should we?" but "are our writes really conflicting?" If they're per-user (user A writes their own profile from US, user B writes their profile from EU — no conflict possible), multi-leader is trivial. If they're shared state (inventory, account balances), conflicts are constant.
- CRDTs change the calculus — for the right data shape, multi-leader becomes safe and simple.
- Multi-leader is best designed with **commutativity** in mind: structure writes so order doesn't matter.

**Common mistakes:**
- Treating multi-leader as a drop-in upgrade for single-leader. Conflict handling must be designed in.
- Using LWW for data that can't tolerate silent overwrite (e.g., inventory counters).
- Ignoring the operational complexity — debugging conflicts at 3am is painful.

## Related Concepts

- [[Replication]] · [[Leader-Based Replication]] · [[Leaderless Replication]]
- [[CRDTs]] — auto-mergeable data structures.
- [[Vector Clocks]] — detect concurrent writes.
- [[Eventual Consistency]] — multi-leader systems are typically eventually consistent.

## Misconceptions

- **"Multi-leader is always better — no SPOF!"** No. The conflict-resolution complexity often outweighs the availability gain.
- **"LWW is fine."** Only if losing concurrent updates is acceptable. For counters, sets, money — it isn't.
- **"Multi-leader scales writes linearly with leaders."** Only if writes don't overlap. With overlap, you scale conflicts, not throughput.

## Failure Scenarios

- **Conflict storms** — sustained high-rate conflicting writes. Mitigation: per-user partitioning (write affinity), or CRDTs.
- **Replication topology cycles** — write loops infinitely between leaders. Mitigation: replica IDs in log entries to skip already-seen writes.
- **Schema divergence across leaders** during migration. Mitigation: phased migration with backward-compat windows.
- **Constraint violations** — unique key inserted independently on two leaders. Mitigation: app-level idempotency, or accept duplicates and dedupe.

## Practical Engineering Heuristics

- **Default away from multi-leader.** Reach for it only when single-leader can't meet geo-latency or offline requirements.
- **Partition writes by ownership** when possible (each user/tenant has a "home" leader). Eliminates most conflicts.
- **Use CRDTs** if the data shape allows.
- **Test conflict resolution** with adversarial scenarios; don't trust the happy path.

## Active Recall Questions

What is multi-leader replication?::Multiple nodes accept writes simultaneously, each acting as a leader. Leaders replicate bidirectionally. Used for geo-distribution, offline-first apps, and tolerance of single-leader failure.

Name three conflict resolution strategies in multi-leader.::Last-write-wins (LWW), version vectors with app-level merge, CRDTs, application-defined domain rules.

Why is multi-leader rarely the default?::Conflict handling is hard. For most apps, single-leader is simpler and sufficient.

When does multi-leader make sense?::Geo-distributed writes (each region writes locally), offline-first apps (mobile/browser), high-availability scenarios where global failover is unacceptable.

What's the most common subtle bug?::Using LWW on data that can't tolerate silent overwrite (counters, sets). Concurrent updates get dropped.

How does write-affinity reduce conflicts?::Route a given user/tenant's writes to one designated leader. Eliminates most conflicts because no other leader is writing the same data.

## Feynman Test

Construct a scenario where multi-leader replication silently loses an update under LWW. How would CRDTs fix it?

Explain why Google Docs can support millions of concurrent editors despite being effectively multi-leader.

## Mastery Checklist

- **Explain** multi-leader replication and its conflict-resolution strategies.
- **Compare** with leader-based and leaderless.
- **Derive** when multi-leader is appropriate.
- **Critique** "let's use multi-leader for availability" suggestions.
- **Design** a multi-leader system with explicit conflict-resolution rules.

[^DDIA-168]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 168–177.

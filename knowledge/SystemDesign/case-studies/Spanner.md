---
title: Spanner
area: case-studies
status: mature
difficulty: staff
prerequisites: ["[[Paxos]]", "[[Distributed Transactions]]", "[[Linearizability]]"]
related: ["[[Bigtable]]", "[[Hybrid Logical Clocks]]"]
builds_toward: []
sources:
  - Corbett et al. "Spanner: Google's Globally-Distributed Database" (OSDI 2012)
  - Bacon et al. "Spanner: Becoming a SQL System" (SIGMOD 2017)
  - Google Cloud Spanner docs
tags: [case-study, storage, spanner, google]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Spanner

## Executive Summary

**Google Spanner** is a globally-distributed, strongly-consistent SQL database. Its defining innovation is **TrueTime** — a hardware-backed (GPS + atomic clock) globally-synchronized time API that returns bounded intervals `[earliest, latest]`. This enables **external consistency** (linearizability) across continents at SQL transaction granularity. Underlies Google's F1/AdWords, Photos, Drive metadata; available as Cloud Spanner.

## Why It Exists

Google's F1 (AdWords) needed SQL semantics + strong consistency + global distribution. Bigtable lacked transactions; classic RDBMSs lacked global scale. Spanner is the answer.

## Architecture

```
Universe (entire deployment)
  ├── Zone (datacenter analog)
  │     ├── Spanserver (data, Paxos group leader)
  │     │     └── tablet → Paxos group → replicas in other zones
  │     ├── Location proxy
  │     └── Zone master
  ├── Universe master
  └── Placement driver (moves tablets)
```

- Data sharded into **tablets** (Bigtable lineage), each replicated via **Paxos** across zones.
- Each Paxos group has a leader serving reads/writes.
- **Spanserver** hosts hundreds of tablets.

## TrueTime

- API: `TT.now()` returns `[earliest, latest]` with bounded uncertainty $\epsilon$ (typically ~7 ms via GPS + atomic clocks in every DC).
- Used to assign commit timestamps that respect external consistency.

**Commit-wait** protocol:
- After choosing commit timestamp $t$ via Paxos, wait until `TT.now().earliest > t` before acknowledging.
- Ensures any later transaction sees a higher timestamp than $t$ — preserves linearizability.
- Adds ~ε ≈ 7 ms latency per commit; acceptable.

## Key Design Decisions

### Transactions
- **Read-write** — Paxos for commit; commit-wait for TT.
- **Read-only** — assigned timestamp from TT; lock-free; consistent snapshot across the DB.
- **Snapshot reads** — historical reads at any timestamp within retention.

### SQL
- 2017 paper documented evolution to a proper SQL engine.
- Query planner, distributed joins, schema changes.

### Schema changes
- Online schema migration without downtime via versioned schema.

### Multi-region
- Geographic replication; user picks zones; can be 5-way replicated across continents.

## Strengths

- **Globally strong consistency** (external consistency) at SQL granularity.
- **No need for app-level distributed-transaction code.**
- **Operates at exabyte scale**.

## Weaknesses

- **TrueTime hardware** — Google has it; cloud customers depend on Google.
- **Commit-wait cost** — ~ε ms per commit.
- **Cost** — expensive vs Bigtable for the same data.
- **Open-source alternatives** (CockroachDB, YugabyteDB) emulate the architecture without hardware-backed clocks — use [[Hybrid Logical Clocks]] instead.

## Real Production

- **Google F1 (AdWords)** — flagship internal workload.
- **Google Photos, Drive, Play** — metadata.
- **Niantic Pokémon Go** — published case study.
- **Cloud Spanner** — managed.
- **CockroachDB, YugabyteDB, TiDB** — Spanner-inspired open-source.

## Lessons

- Hardware (TrueTime) can unlock fundamentally new distributed-system designs.
- SQL + strong consistency + global scale is not inherently impossible — it requires investment in synchronized time.
- The trade between ε of latency and external consistency is favorable for most apps.
- Influence — every modern "NewSQL" system descends from Spanner conceptually.

## Related Concepts

- [[Paxos]] — replication consensus.
- [[Distributed Transactions]] — Spanner's flavor.
- [[Linearizability]] — external consistency.
- [[Hybrid Logical Clocks]] — open-source workaround for TrueTime.
- [[Bigtable]] — predecessor; tablet model inherited.

## Active Recall Questions

What is Spanner's defining innovation?::TrueTime — a hardware-backed (GPS + atomic clock) globally-synchronized time API that returns bounded intervals, enabling external consistency across continents.

What is external consistency?::Linearizability at the transaction level — if transaction T1 commits before T2 starts (in real time), then T1's commit timestamp < T2's timestamp.

What is commit-wait and why is it needed?::After choosing a commit timestamp t, wait until TT.now().earliest > t before acknowledging — ensures no later transaction can observe an earlier timestamp; preserves external consistency.

How is read-only transaction overhead minimized?::Assign a timestamp from TrueTime; perform lock-free reads at that timestamp from any replica; no Paxos required for snapshot reads.

How do open-source alternatives (CockroachDB, YugabyteDB) replace TrueTime?::Use Hybrid Logical Clocks — software-only, no hardware GPS/atomic clocks; trade tighter guarantees for portability.

What is the typical TrueTime uncertainty ε?::~7 milliseconds; commit-wait adds this latency per commit.

What replicates a Spanner tablet?::A Paxos group with replicas in multiple zones (typically 5); leader serves writes; followers can serve stale reads.

## Feynman Test

Why is "external consistency" easier with TrueTime than with NTP? What specific guarantee does the bounded interval `[earliest, latest]` provide that NTP timestamps can't?

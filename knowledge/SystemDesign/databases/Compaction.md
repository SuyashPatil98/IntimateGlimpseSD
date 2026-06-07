---
title: Compaction
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[LSM-Trees]]", "[[SSTables]]"]
related: ["[[LSM-Trees]]", "[[SSTables]]", "[[Bloom Filters]]"]
sources:
  - DDIA, Ch. 3 (pp. 77–79)
  - Cassandra/RocksDB compaction docs
tags: [databases, storage-engines, compaction]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Compaction

## Executive Summary

Compaction is the **background process in LSM-tree systems that merges multiple SSTables into fewer ones**, removing deleted/overwritten data and reducing read amplification. Without compaction, the number of SSTables grows unbounded; reads must check more files; tombstones and obsolete data fill disk. With compaction, the system stays balanced — but compaction itself consumes CPU, I/O, and disk space. The strategy choice (size-tiered, leveled, time-windowed) shapes operational behavior dramatically.

## Why This Exists

Every memtable flush creates a new [[SSTables|SSTable]]. Updates and deletes don't modify existing SSTables — they write new ones. Over time, multiple SSTables hold overlapping data: the same key may appear in 3 SSTables (one current value, two obsolete). Reads scan all of them. Disk fills with obsolete data. Compaction reconciles this — merging SSTables into fewer files with no overlap.

## Core Intuition

Filing cabinet that keeps getting new folders. Each folder is fine on its own, but as folders pile up, finding a customer's record means checking many places. Periodically, a clerk merges related folders, throwing out outdated copies. The cabinet stays manageable.

## Compaction Strategies

**Size-tiered compaction (STCS) — Cassandra default originally:**
- Group similar-sized SSTables; merge when N similar tables exist.
- Pros: low write amplification; simple.
- Cons: huge SSTables at top; space amplification; tombstone persistence.

**Leveled compaction (LCS) — RocksDB / Cassandra option:**
- Organize SSTables in levels (L0, L1, L2, ...). Each level has size limits.
- When level L exceeds size, merge into L+1.
- Pros: bounded read amplification; predictable space.
- Cons: higher write amplification.

**Time-windowed compaction (TWCS) — Cassandra for time-series:**
- Group SSTables by time window.
- Compact within window; drop old windows entirely (TTL).
- Pros: excellent for time-series; cheap TTL.
- Cons: only for time-ordered data.

**Universal compaction (RocksDB option):**
- Compact all level-0 SSTables into one — minimizes space amp.

## Design Tradeoffs

Compaction is a **three-way trade-off**:
- **Read amplification** — how many SSTables per read.
- **Write amplification** — how many times each byte is rewritten.
- **Space amplification** — how much disk is overhead vs live data.

No strategy optimizes all three; pick based on workload.

## Real Production Examples

- **Cassandra** — STCS default, LCS and TWCS available.
- **RocksDB** — Leveled by default; supports Universal.
- **HBase** — minor + major compaction.
- **ScyllaDB** — TWCS for time-series; LCS for general.

## Interview Perspective

**Common questions:**
- "What is compaction?" → Background merge of SSTables; removes deletes/overwrites; reduces read amp.
- "STCS vs LCS?" → STCS: low write amp, high space amp. LCS: bounded read amp, higher write amp.
- "When does compaction hurt?" → When it competes with foreground traffic for CPU/I/O during peak.

**Senior-level:**
- Compaction strategy is one of the most consequential ops decisions in LSM systems.
- TWCS is a game-changer for time-series — TTL dropping entire SSTables is essentially free.
- Compaction backpressure is real: if compaction can't keep up, disk fills and reads suffer.

**Common mistakes:**
- Defaulting to STCS for write-and-update workloads — tombstone problems.
- Not running compaction at off-peak (when configurable).
- Ignoring compaction queue depth as an SLI.

## Related Concepts

- [[LSM-Trees]] · [[SSTables]] — what compaction operates on.
- [[Bloom Filters]] — reduce read amp between compactions.
- [[Anti-Entropy]] — operationally similar (background reconciliation).

## Misconceptions

- **"Compaction is fast."** It's I/O + CPU intensive; can dominate the box during peak.
- **"More compaction = better."** Aggressive compaction wastes resources; too little causes read amp.
- **"One strategy fits all."** Workload-dependent.

## Failure Scenarios

- **Compaction backlog** — disk fills; latency spikes.
- **Tombstone non-removal** — STCS keeps tombstones forever in some scenarios.
- **Compaction at peak** — competes with foreground; user-visible slowdown.

## Practical Engineering Heuristics

- **Time-series → TWCS.**
- **Append-mostly → STCS.**
- **Update-heavy → LCS.**
- **Schedule major compactions off-peak.**
- **Monitor compaction queue depth.**

## Active Recall Questions

What is compaction?::Background process that merges SSTables, removes deleted/overwritten data, reduces read amplification in LSM systems.

Three compaction strategies?::Size-tiered (STCS), Leveled (LCS), Time-windowed (TWCS), Universal.

STCS vs LCS trade-off?::STCS: low write amp, high space amp. LCS: bounded read amp, higher write amp.

When use TWCS?::Time-series data where TTL drops old time windows. Dropping whole SSTables is cheaper than compacting them.

What's compaction backpressure?::When compaction can't keep up with flush rate; SSTable count grows; read amp explodes; disk fills.

The three-way trade-off in compaction?::Read amplification, write amplification, space amplification. No strategy optimizes all three.

## Feynman Test

Compare STCS and LCS for a write-heavy workload with frequent updates. Which is better and why?

Why is TWCS revolutionary for time-series data?

## Mastery Checklist

- **Explain** compaction and its purpose.
- **Compare** compaction strategies.
- **Derive** which strategy fits a workload.
- **Critique** default-STCS choices for update-heavy workloads.
- **Design** a compaction plan for a high-write time-series service.

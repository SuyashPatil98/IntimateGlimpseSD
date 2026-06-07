---
title: WAL
aliases: [Write-Ahead Log]
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[ACID]]"]
related: ["[[ACID]]", "[[B-Trees]]", "[[LSM-Trees]]", "[[Transactions]]"]
sources:
  - DDIA, Ch. 3
  - Gray & Reuter, 1992
tags: [databases, durability, wal]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# WAL (Write-Ahead Log)

## Executive Summary

A **Write-Ahead Log (WAL)** is a sequential, append-only log of database modifications written to durable storage **before** the corresponding changes are applied to the main data files. The foundational durability mechanism: if the database crashes mid-operation, the WAL is replayed to recover committed transactions and roll back uncommitted ones. Used by **every major database** — PostgreSQL (WAL), MySQL InnoDB (redo log), Oracle (redo log), Cassandra (commit log), Kafka (log itself is the WAL). The principle: log first, apply later.

## Why This Exists

If you apply changes to data files first, a crash can leave files in an inconsistent state — half a row written, page partially flushed. Recovery would be impossible without knowing what was intended. The WAL solves this: write the *intent* durably first; only then modify data files. On crash, replay the WAL to redo committed work and undo uncommitted work.

## Core Intuition

Before you renovate a house, you write down every change in a log: "Replace front door." Then you do the work. If the work is interrupted, anyone can read your log and either finish or undo each change. The log is the source of truth; the house follows.

## Internal Mechanics

**Write path:**
1. Transaction begins.
2. For each modification, append a log record to WAL.
3. WAL record describes: transaction ID, operation, before/after image (or enough to redo/undo).
4. On COMMIT, write a commit record to WAL; **fsync** the WAL.
5. Lazily apply changes to data files (checkpointing).

**Recovery after crash:**
1. Find last checkpoint in WAL.
2. Forward: for every committed transaction since checkpoint, redo.
3. Backward: for every uncommitted transaction, undo.
4. Data files now reflect all committed and no uncommitted state.

**Checkpointing:** periodically, flush dirty pages from memory to data files; record a checkpoint in WAL; old WAL records can be discarded.

## Design Tradeoffs

**Benefits:**
- Durability of committed transactions.
- Sequential disk I/O (WAL writes are fast — append-only).
- Enables crash recovery.
- Foundation for [[Replication]] (ship the WAL).
- Foundation for [[CDC]] (Change Data Capture).

**Costs:**
- fsync latency — must hit durable storage before ack.
- Disk space for log retention.
- Checkpoint I/O bursts.

## Real Production Examples

- **PostgreSQL** — WAL is canonical; ships via streaming replication.
- **MySQL InnoDB** — "redo log" is the WAL.
- **Cassandra** — commit log per node; flushed after memtable flushes.
- **Kafka** — the log *is* the data store; entire architecture built on WAL.
- **etcd, ZooKeeper** — Raft log is essentially a WAL.

## Interview Perspective

**Common questions:**
- "What's a WAL?" → Append-only log of changes written before data file modifications; enables crash recovery.
- "Why write WAL before data?" → If data is written first and crash happens mid-write, recovery is impossible. WAL records intent durably.
- "What does fsync do?" → Forces buffered writes to actual durable storage. Required for true durability.

**Senior-level:**
- WAL is the substrate for replication, CDC, and audit. Many features piggyback on it.
- "Group commit" optimization: batch multiple commits' fsync to amortize cost.
- The Kafka realization — log as primary store — is a fundamental insight that drove the modern streaming era.

**Common mistakes:**
- Disabling fsync "for speed" without understanding durability loss.
- Forgetting WAL grows — needs checkpoints + cleanup.
- Treating WAL as opaque — it's the most replicable artifact in a DB.

## Related Concepts

- [[ACID]] — WAL provides Durability + Atomicity.
- [[B-Trees]] · [[LSM-Trees]] — both use WAL.
- [[Replication]] — WAL shipping is one mechanism.
- [[CDC]] — reads from WAL.
- [[Transactions]] — WAL enables.

## Misconceptions

- **"WAL = transaction log."** They're related; "transaction log" is more general. WAL is one form of transaction log.
- **"WAL is slow."** Sequential append is fast; fsync is the cost.
- **"You can skip WAL for in-memory DBs."** In-memory DBs that want durability still need WAL.

## Failure Scenarios

- **fsync disabled** → power-fail loses recent writes.
- **WAL not checkpointed** → recovery time grows unboundedly.
- **WAL disk full** → DB stops accepting writes.

## Practical Engineering Heuristics

- **Never disable fsync** in production unless explicitly accepting data-loss windows.
- **Monitor WAL growth and checkpoint timing.**
- **Plan for WAL disk space** — separate from data disk often.
- **Use group commit** if write throughput is bottlenecked by fsync.
- **Ship WAL for replication / CDC** rather than re-implementing.

## Active Recall Questions

What's a Write-Ahead Log?::Append-only log of database changes written to durable storage before the corresponding data file modifications. Foundation of durability and crash recovery.

Why write log before data?::Data writes can be interrupted by crashes, leaving partial state. The log records intent durably so recovery can complete or undo.

What does fsync do?::Forces buffered writes to actual durable storage. Required to guarantee durability across crashes.

What's checkpointing?::Periodic flush of dirty pages to data files + a checkpoint marker in WAL. Allows old WAL records to be reclaimed.

Name three databases with prominent WALs.::PostgreSQL (WAL), MySQL InnoDB (redo log), Cassandra (commit log), Kafka (log is the data).

What's group commit?::Batching multiple transactions' fsync into one I/O. Amortizes fsync cost; trade-off: higher individual commit latency.

## Feynman Test

Walk through a transaction with WAL: from BEGIN through COMMIT, including the fsync. What happens on crash mid-way?

Why is the Kafka realization — "the log is the data" — built on the same insight as WAL?

## Mastery Checklist

- **Explain** WAL and crash recovery.
- **Compare** WAL behavior under different fsync policies.
- **Derive** durability guarantees from WAL configuration.
- **Critique** "disabled fsync for speed" decisions.
- **Design** a system that uses WAL for replication.


## Recent Q&A

**Q: what are the architectural differences between the design of a digital wallet and a payments system?**

The architecture of a digital wallet and a payments system have significant differences in their core requirements, specifically concerning strong consistency on balance, concurrent operations, and scalability. Let's break down these differences based on the provided context:

### Digital Wallet Architecture

#### Key Components:
1. **Client**: Users interact with the client to perform transactions like deposits, withdrawals, transfers, and check balances.
2. **API**: Acts as a facade for client requests, handling user interactions securely and directing them to appropriate services.
3. **Wallet Service**: Handles all transactional logic including deposit/withdrawals and cross-shard transfers (using 2PC or saga).
4. **Ledger DB (strong-consistency RDBMS / Spanner)**: Stores the authoritative ledger with double-entry accounting for every transfer, ensuring strong consistency on balances.
5. **Outbox**: Captures all transactions before they are written to Ledger DB; this is crucial for auditing and downstream systems like payment processors or merchant gateways.

#### High-Level Design:
A digital wallet system requires a robust architecture that ensures strong consistency across concurrent operations without allowing overdrafts, ensuring user funds are always secure. The use of a double-entry ledger as the authoritative store with in-memory caches for performance optimization is typical.

### Payments System Architecture

For payments systems, scalability and high availability take precedence over strict balance consistency, especially when handling large volumes of transactions from multiple merchants and end-users simultaneously. Here’s how this manifests differently:

#### Key Components:
1. **Client**: Handles interactions similar to a wallet but may involve merchant-specific integrations or bulk payment operations.
2. **API**: Similar role as the wallet API for client requests, ensuring secure communication and directing tasks appropriately.
3. **Payment Service / Transaction Processing System**: This component typically handles cross-shard transfers using methods like 2PC, saga with reservation, or leveraging native support in a global database (e.g., Spanner).
4. **Ledger DB**: While still serving as the core transactional record, it may not strictly enforce strong consistency on balances due to the nature of cross-shard transactions and scaling requirements.
5. **Event Stream / Outbox Queue System**: Critical for maintaining audit trails and synchronizing downstream systems like merchant gateways or customer account updates.

#### High-Level Design:
A payments system typically employs a more distributed, possibly sharded architecture with methods such as 2PC or sagas to handle cross-shard transactions efficiently. The Ledger DB serves primarily as an authoritative record rather than enforcing strict balance consistency across all accounts. Instead, audit trails and reconciliation processes are used to ensure integrity.

### Summary of Differences:

1. **Strong Consistency vs. High Availability**: Digital wallets require strong consistency on balances to avoid overdrafts under concurrent operations, whereas payments systems often prioritize availability over perfect balance accuracy.
2. **Concurrency Handling**: Digital wallets use pessimistic locking or optimistic CAS for cross-shard transfers, ensuring that operations do not interfere with one another while maintaining balance integrity. Payments systems might opt for 2PC, sagas with reservation, or native multi-region support in a global DB.
3. **Account Sharding vs. Global Database**: Digital wallets often employ account sharding to distribute load efficiently across multiple databases. Payments systems may use more complex architectures, including regional deployments and advanced synchronization mechanisms like saga transactions.
4. **Scale and Performance Optimization**: Digital wallets need efficient handling of concurrent operations with possible in-memory caching for quick lookups and performance enhancement. Payments systems focus on scaling transaction throughput while maintaining operational integrity.

In essence, digital wallets are designed around ensuring that balance accuracy is maintained under extreme load conditions (many users performing transactions simultaneously), whereas payments systems often prioritize broader availability and more complex cross-system integration points.

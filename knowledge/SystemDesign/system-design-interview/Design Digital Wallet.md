---
title: Design Digital Wallet
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Design Payment System]]", "[[Transactions]]"]
related: ["[[Distributed Transactions]]", "[[Saga Pattern]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.12 ("Digital Wallet")
  - PayPal, Alipay, WeChat Pay architecture posts
tags: [system-design-interview, advanced-design, payments]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Digital Wallet

## Executive Summary

A wallet (PayPal, Venmo, Alipay): user balances + peer-to-peer transfers + merchant payments. The defining technical problem is **strongly consistent balance** under concurrent operations, with **double-entry ledger** as the authoritative store. Strong consistency is non-negotiable (no over-debit).

## Requirements

**Functional:** Deposit, withdraw, transfer, balance check, transaction history.

**Non-functional:**
- Strong consistency on balance (no overdraft via race).
- High availability.
- Audit-ready ledger.
- Scale to billions of accounts.

## High-Level Design

```
client ──► API ──► Wallet Service ──► Ledger DB (strong-consistency RDBMS / Spanner)
                       │
                       └──► outbox ──► event stream (audits, downstream)
```

## Design Deep Dive

### Ledger

- Double-entry: every transfer = debit one account + credit another.
- Append-only journal; balances are sums (cached for performance).

### Concurrency

**Two options:**
1. **Pessimistic locking**: row-level lock on account during transfer; serializes ops on that account.
2. **Optimistic CAS**: read balance + version; transaction conditional on version; retry on conflict.

For typical wallet ops with moderate contention, pessimistic on the account row works well.

### Account sharding

- Partition accounts by user id hash; each shard runs its own DB.
- Cross-shard transfers need 2PC or saga (see below).

### Cross-shard transfers — the hard part

If sender on shard A, receiver on shard B:
- **2PC**: prepare both, commit; blocks on coordinator failure.
- **Saga**: debit sender (local txn); credit receiver (local txn); compensate on failure.
- **Single global DB (Spanner)**: cross-shard transactions handled natively.

Most production systems use **saga with reservation** — debit goes to a "pending" sub-balance; credit completes; or compensate.

### Idempotency

- Every transfer carries an idempotency key; server dedups.

### Auditing

- Immutable journal; periodic reconciliation: sum of all balances = 0 (closed system).

### Funding sources

- External: link card / bank; deposits via [[Design Payment System]].
- Withdrawals: ACH / bank transfer; async settlement.

### Limits & fraud

- Per-user / per-period limits.
- Real-time fraud scoring; high-risk transfers held.

## Failure Modes

- **Concurrent transfers** — locking or CAS ensures serialization.
- **Cross-shard partial** — saga compensates.
- **Coordinator crash mid-2PC** — known hazard; favor saga.
- **Ledger drift** — periodic reconciliation; sum invariant.
- **Replay of duplicate transfer** — idempotency key.

## Real Production

- **PayPal** — large global wallet system.
- **Venmo** — peer wallet on PayPal infra.
- **Alipay, WeChat Pay** — Chinese super-wallets.
- **Cash App** — newer entrant.
- **Stripe Treasury** — wallets-as-a-service.

## Interview Talking Points

- Double-entry ledger.
- Strong consistency requirement.
- Account-level concurrency control.
- Cross-shard transfer via saga.
- Idempotency and audit invariants.

## Related Concepts

- [[Design Payment System]] — sibling.
- [[Transactions]] — local correctness.
- [[Distributed Transactions]] — cross-shard.
- [[Saga Pattern]] — preferred for cross-shard.
- [[Outbox Pattern]] — reliable event emission.

## Active Recall Questions

Why is strong consistency non-negotiable for wallet balances?::Race conditions could allow double-spend / overdraft from concurrent transfers; users lose money or the system loses money.

What are the two options for concurrency control on a balance update?::Pessimistic row-level lock (serializes ops on account) vs optimistic CAS (compare-and-swap with version, retry on conflict).

How do you handle a transfer between two accounts on different shards?::Saga: debit sender (local txn) → credit receiver (local txn) → compensate (refund sender) on failure. Alternatively 2PC if you accept blocking.

What invariant lets you audit a wallet ledger?::Double-entry sum = 0 (every debit has a paired credit); periodic reconciliation alerts on drift.

Why is the ledger append-only?::Auditability (history can't be edited), simpler replication / event-sourcing, mathematical invariants on balances computed as sums.

How is idempotency enforced for transfers?::Client-provided idempotency key per transfer; server stores key → outcome for a window and dedups retries.

What's the trade-off of using Spanner for the wallet DB?::Native cross-shard transactions simplify cross-account transfers (no saga needed); higher cost and less control vs sharded RDBMS + saga.

## Feynman Test

Two users simultaneously try to send the last $10 from a shared wallet to different recipients. Walk through how the system ensures exactly one succeeds, at every layer.

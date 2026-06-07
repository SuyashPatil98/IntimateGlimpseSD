---
title: Design Payment System
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Idempotency]]", "[[Distributed Transactions]]", "[[Saga Pattern]]"]
related: ["[[Design Digital Wallet]]", "[[Design Hotel Reservation]]", "[[Design Stock Exchange]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.11 ("Payment System")
  - Stripe engineering — "Designing robust and predictable APIs with idempotency"
  - PayPal, Square engineering writeups
tags: [system-design-interview, advanced-design, payments]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Payment System

## Executive Summary

Process payments end-to-end: take a charge request, route to a card network / bank, settle funds, reconcile, refund. The defining concerns are **exactly-once charging**, **state consistency under partial failures**, **regulatory compliance** (PCI-DSS), and **deterministic reconciliation** with external providers.

## Requirements

**Functional:** Charge (auth + capture), refund, void, payment-method storage, transaction history.

**Non-functional:**
- High availability (payment outages are business-critical).
- Exactly-once per intent.
- Compliance (PCI, GDPR).
- 1000s of TPS; sub-second auth response.

## High-Level Design

```
merchant API ──► Payment Service ──► Card Network / PSP (Stripe, Adyen, Visa)
                       │                       │
                       ▼                       ▼
                Ledger (DB)              Webhooks (settlement events)
                       │                       │
                       ▼                       ▼
                Reconciliation (batch) ◄───────┘
```

## Design Deep Dive

### Idempotency

- Every API call carries an idempotency key (UUID).
- Server stores `(key → outcome)` for 24 h.
- Retries return cached outcome.
- Without this, network retries double-charge.

### State machine

- Each payment: `requested → authorized → captured → settled` (or `failed`, `refunded`).
- State transitions persisted in single DB transaction.

### Ledger

- Double-entry bookkeeping: every transaction has paired debit + credit entries.
- Append-only journal; balances computed.
- Inviolable invariant: ledger sums to zero.

### External providers

- Most don't build card-network integration; route via Stripe, Adyen, Braintree.
- Webhook events update state; auth response is synchronous, settlement async.

### Reconciliation

- Nightly: read provider report; compare line-by-line to internal ledger; flag mismatches for ops.
- Trust provider as source of truth for settlement; internal ledger is authoritative for intent.

### Refunds

- Reference original payment ID; refund through provider; ledger reverses entries.

### PCI compliance

- Never store raw PANs unless PCI-compliant; usually tokenize via provider.
- Out-of-scope architecture (handle minimum card data).

### Multi-region

- Per-region clusters; data residency.
- Cross-region replication for disaster recovery.

## Failure Modes

- **Network timeout on charge** — retry with same idempotency key; provider deduplicates.
- **Provider returns ambiguous status** — reconciliation pipeline + manual review.
- **Stale webhook (out of order)** — version events; idempotent applier.
- **Ledger corruption** — append-only design + invariants; periodic sum checks.
- **Cascading retry storms** — circuit breakers.

## Real Production

- **Stripe** — published idempotency-key design; billions of transactions.
- **Square, PayPal, Adyen** — major PSPs.
- **Visa/Mastercard rails** — card networks underneath.
- **Modern fintech (Plaid, Marqeta)** — provider abstractions.

## Interview Talking Points

- Idempotency-key pattern (the standout).
- Double-entry ledger (auditable, invariant).
- State machine + reconciliation.
- Auth/capture split (lifecycle of card transactions).
- PCI compliance / tokenization.

## Related Concepts

- [[Idempotency]] — central.
- [[Distributed Transactions]] / [[Saga Pattern]] — cross-service consistency.
- [[Outbox Pattern]] — reliable event emission.
- [[Design Digital Wallet]] — adjacent.
- [[Design Hotel Reservation]] — payment + inventory saga.

## Active Recall Questions

What is the idempotency-key pattern in payments?::Client sends a unique key per intent; server stores key→outcome for a window; retries return cached outcome instead of re-charging.

What is double-entry bookkeeping in a payment ledger?::Every transaction has paired debit + credit entries summing to zero; provides invariants and auditability.

What is the auth/capture split?::Authorization holds funds (reserves limit); capture actually moves funds. Common in e-commerce — capture on ship, not on order.

Why is reconciliation with the provider essential?::Network/provider outages and ambiguous responses lead to state divergence; nightly reconciliation catches discrepancies and is the operational backstop.

What's the role of webhooks vs synchronous auth response?::Auth response is synchronous (success/failure now); webhooks deliver later state changes (settlement, refund, chargeback) asynchronously.

How is PCI-DSS scope minimized?::Tokenize card numbers via the PSP (Stripe etc.); the system never stores raw PAN; reduces compliance burden enormously.

How do you handle ambiguous timeouts from the card network?::Retry with the same idempotency key; provider deduplicates; manual reconciliation if neither succeeds nor fails decisively.

## Feynman Test

A customer's card is charged $50. List every place in the system where a duplicate charge could happen, and what prevents it at each layer.

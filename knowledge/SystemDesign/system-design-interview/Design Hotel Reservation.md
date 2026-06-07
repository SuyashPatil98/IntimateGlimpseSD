---
title: Design Hotel Reservation
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Transactions]]", "[[Distributed Transactions]]"]
related: ["[[Saga Pattern]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.7 ("Hotel Reservation")
  - Booking.com engineering blog
  - Airbnb engineering — pricing & availability
tags: [system-design-interview, advanced-design, transactions]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Hotel Reservation

## Executive Summary

Build a hotel reservation system (Booking.com / Expedia / Airbnb): search availability, reserve, pay, manage. The central technical challenge is **inventory correctness under concurrency** — exactly one guest gets the last room. Combines transactional reservation with eventually consistent search.

## Requirements

**Functional:** Search hotels by location + date; view room availability; book; pay; cancel.

**Non-functional:**
- 1 M hotels; 100 M users.
- Read-heavy (search); write-light (booking).
- No overbooking. No double-booking.

## High-Level Design

```
search ──► Search Service ──► Read-optimized index (Elasticsearch)
                                    ▲
                                    │ updated by inventory stream
                                    │
booking ──► Reservation Service ──► Inventory DB (RDBMS, ACID)
                                    │
                                    ▼
                              Payment Service ──► provider
                                    │
                                    ▼
                              Confirmation
```

## Design Deep Dive

### Inventory model

- Hotel × Room Type × Date → available_count.
- **Source of truth: RDBMS** with row-level locking for transactions.
- Search reads a denormalized view (Elasticsearch), updated near-real-time.

### Booking transaction

Single hotel: row-level lock or optimistic CAS — `UPDATE inventory SET available = available - 1 WHERE hotel_id=… AND date=… AND available > 0`. If affected rows = 0, sold out.

### Distributed booking (multi-hotel package)

Use [[Saga Pattern]]: reserve room A → reserve room B → pay → confirm. Compensate on failure.

### Payment

- External payment provider with idempotency keys.
- Decouple via outbox / saga to ensure consistency.

### Search

- Elasticsearch / OpenSearch index by location + dates + amenities.
- Eventually consistent — may show "available" for a room that just sold. Acceptable; reservation step is the authority.

### Pricing

- Dynamic; pricing engine consults rules + competitor prices.
- Read-only cache.

### Concurrency edge cases

- **Two users grab last room simultaneously**: row lock or CAS ensures exactly one succeeds; other gets sold-out error.
- **Cancellation race**: idempotency on cancel.

### Multi-region

- Inventory pinned per-region (hotel near guest) or globally consistent (Spanner).

## Failure Modes

- **Payment failure mid-saga** — release inventory via compensation.
- **Index lag** — user clicks "book" on sold-out room; reservation rejects; UI shows "no longer available".
- **Overbooking from concurrent updates** — must use proper locking, not check-then-update.
- **Long-held lock** — payment can take seconds; use short-lived reservation (10-min hold) + commit on payment confirm.

## Real Production

- **Booking.com** — large MySQL backbone; complex pricing.
- **Airbnb** — host-managed inventory; Cassandra + MySQL hybrid.
- **Expedia, Hotels.com** — Sabre/Amadeus GDS integrations.

## Interview Talking Points

- Search vs reservation: separate read path (Elasticsearch) from write path (ACID DB).
- Inventory under concurrency — row locks or CAS.
- Short-lived "hold" pattern for payment time.
- Saga for multi-hotel / payment + reservation.
- Search eventually consistent OK; reservation must be strict.

## Related Concepts

- [[Transactions]] — local correctness.
- [[Distributed Transactions]] — multi-service consistency.
- [[Saga Pattern]] — payment + inventory.
- [[Idempotency]] — payment provider.

## Active Recall Questions

How do you prevent two users from booking the same last room?::Row-level lock or atomic CAS — `UPDATE inventory SET available = available - 1 WHERE … AND available > 0`; if affected rows = 0, sold out.

Why separate search from reservation?::Search must be cheap and tolerate eventual consistency over millions of hotels; reservation must be strict; different storage models.

Why is the search index allowed to be slightly stale?::Reservation step is authoritative; UI gracefully handles "no longer available" rejection; cost of strict consistency on search wouldn't justify the small UX win.

What's the "short-lived hold" pattern and why?::Reserve inventory for N minutes during payment; commit on payment success; release on timeout. Avoids holding row locks for human-time intervals.

When is a Saga needed for booking?::Multi-step transactions across services (reserve room → reserve activity → pay); each step has compensation; sagas avoid distributed 2PC.

How do you handle a payment provider failure after inventory has been deducted?::Compensate: release the inventory hold (delete reservation, increment availability); retry payment; surface error to user.

What's the trade-off of using Spanner for global inventory consistency?::Strong consistency across regions at higher cost and complexity; alternative is region-pinned inventory which complicates global package deals.

## Feynman Test

A user clicks "book" and you get a 200 OK after 2 s. Trace every system touched and identify exactly where overbooking is prevented.

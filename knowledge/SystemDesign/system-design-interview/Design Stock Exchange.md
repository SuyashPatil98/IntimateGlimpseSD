---
title: Design Stock Exchange
area: system-design-interview
status: mature
difficulty: staff
prerequisites: ["[[Design Payment System]]"]
related: ["[[Design Digital Wallet]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.13 ("Stock Exchange")
  - NASDAQ, NYSE architecture papers
  - LMAX Disruptor (2011)
tags: [system-design-interview, advanced-design, trading]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Stock Exchange

## Executive Summary

A stock exchange (NASDAQ, NYSE): match buy/sell orders for thousands of symbols at microsecond latency, with full audit, fairness, and regulatory compliance. The signature component is the **matching engine** — typically single-threaded per symbol on dedicated hardware for determinism and ultra-low latency.

## Requirements

**Functional:** Submit orders (limit, market), match, fill; cancel; market data feeds.

**Non-functional:**
- Sub-millisecond latency (often sub-100 μs).
- Strict price-time priority.
- Audit / regulatory replay.
- High availability with no order loss.

## High-Level Design

```
broker order ──► Order Gateway ──► Matching Engine (per symbol)
                                          │
                            ┌─────────────┼──────────────┐
                            ▼             ▼              ▼
                        Trades        Order book      Market data
                        (cleared)     (depth)         (feed)
                            │
                            ▼
                       Settlement / clearing
```

## Design Deep Dive

### Matching engine

- One in-memory order book per symbol.
- Bids (buy) and asks (sell) sorted by price-time.
- On incoming order: check opposite side; match at best price; partial fills allowed.
- **Single-threaded per symbol** for determinism + lock-free performance.
- Many engines pinned to CPU cores via NUMA-aware allocation (LMAX Disruptor pattern).

### Order types

- Limit (price-constrained).
- Market (immediate at best).
- IOC, FOK, stop, peg, hidden... (advanced).

### Latency engineering

- Kernel bypass (DPDK).
- FPGA in network path.
- Colocated traders in datacenter.

### Sequencing & replay

- Every input gets a sequence number.
- Engine state derivable from input sequence — fully replayable for audit and disaster recovery.

### Persistence

- Event log to durable storage on receipt (before matching) — order safety.
- Snapshots + replay for recovery.

### Market data feeds

- Multicast UDP to subscribers.
- Lossless (sequence numbers, gap fill from snapshot).
- Tiered (Level 1: top of book; Level 2: depth; Level 3: every order).

### Settlement / clearing

- T+2 (next-next business day) — separate downstream pipeline (DTCC).

### Fairness

- Strict price-time priority.
- No queue-jumping; deterministic.

### Risk checks

- Pre-trade: order size, position limits, fat-finger filter.
- Real-time.

## Failure Modes

- **Engine crash** — replay event log on standby engine.
- **Network partition** — primary/secondary failover with sequence preservation.
- **Order surge (flash crash)** — circuit breakers halt trading.
- **Bad data** — replay from snapshot.

## Real Production

- **NASDAQ INET, NYSE Pillar** — proprietary engines.
- **CME, LSE, JSE** — global exchanges.
- **LMAX Exchange** — published Disruptor pattern (ring buffer + single-threaded core).
- **Binance, Coinbase** — crypto exchanges; similar architecture.

## Interview Talking Points

- Single-threaded per-symbol matching for determinism.
- Sequence-number replay for audit + recovery.
- Strict price-time priority.
- Pre-trade risk checks.
- Lossless multicast market data feeds.
- Circuit breakers for stability.

## Related Concepts

- [[Design Payment System]] — adjacent settlement.
- [[Design Digital Wallet]] — balance/funds.
- [[Apache Kafka]] — similar log-replay concept at lower latency.

## Active Recall Questions

Why is the matching engine typically single-threaded per symbol?::Determinism (price-time priority requires strict ordering), lock-free performance, simpler reasoning about correctness; throughput per symbol is the bottleneck so per-symbol parallelism suffices.

What is price-time priority?::Orders at the same price are matched in arrival order; deviating violates fairness.

What technique enables exchange replay and audit?::Every input sequence-numbered + persisted before matching; the engine is a deterministic function of inputs → can be replayed exactly from logs.

How do exchanges achieve sub-100µs latency?::Kernel bypass (DPDK), FPGA in network path, single-thread cache-resident order book, NUMA-pinned cores, colocated traders, ring-buffer concurrency (Disruptor).

What is LMAX Disruptor?::A high-performance inter-thread messaging library based on a pre-allocated ring buffer with lock-free single-producer/single-consumer rings; canonical pattern for low-latency exchange engines.

What's the role of pre-trade risk checks?::Reject orders that would breach position limits, fat-finger thresholds, or notional caps before they hit the matching engine; protects the system and the participant.

How are market data feeds delivered losslessly given multicast?::Sequence-numbered messages over UDP multicast; clients detect gaps via sequence; gap-fill via TCP request to a recovery service or snapshot rebroadcast.

## Feynman Test

A trader's order arrives 1 µs before another's at the same price. How does the system guarantee the first one fills first, even across racks?

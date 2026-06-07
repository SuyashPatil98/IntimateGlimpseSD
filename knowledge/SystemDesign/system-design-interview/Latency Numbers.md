---
title: Latency Numbers
area: system-design-interview
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Back-of-Envelope]]", "[[Powers of 2]]"]
builds_toward: []
sources:
  - Jeff Dean, "Numbers Everyone Should Know" (LADIS 2009)
  - Peter Norvig, "Teach Yourself Programming in Ten Years" (latency table)
  - system-design-primer Appendix
  - colin-scott.github.io/personal_website/research/interactive_latency.html
tags: [system-design-interview, latency, reference]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Latency Numbers

## Executive Summary

**Latency Numbers Every Programmer Should Know** (Jeff Dean, 2009) is the reference table of common operations' latencies. Memorizing the rough orders of magnitude lets you justify architecture decisions: why we cache (RAM vs disk), why we co-locate (network round-trips), why we batch (per-call overhead).

## The Canonical Table (updated)

| Operation | Latency | Notes |
|---|---|---|
| L1 cache reference | ~0.5 ns | |
| Branch mispredict | ~5 ns | |
| L2 cache reference | ~7 ns | |
| Mutex lock/unlock | ~25 ns | |
| Main memory reference | ~100 ns | ~200× L1 |
| Compress 1 KB with snappy | ~2 μs | |
| Send 2 KB over 1 Gbps network | ~20 μs | |
| Read 1 MB sequentially from RAM | ~50 μs | |
| SSD random read | ~150 μs | |
| Read 1 MB sequentially from SSD | ~1 ms | |
| Round-trip within same datacenter | ~500 μs | |
| Read 1 MB sequentially from HDD | ~30 ms | |
| HDD seek | ~10 ms | |
| Inter-region round-trip (cross-continent) | ~150 ms | |
| TCP retransmit | ~1 s | |

## Powers of 10 mnemonic (memorize these)

| Order | Operation |
|---|---|
| **1 ns** | L1 cache |
| **10 ns** | L2 |
| **100 ns** | RAM |
| **1 μs** | snappy compress |
| **10 μs** | 1 Gbps net 2 KB |
| **100 μs** | SSD random read; datacenter RTT |
| **1 ms** | 1 MB SSD seq read |
| **10 ms** | HDD seek; cross-region RTT (regional) |
| **100 ms** | cross-continent RTT |
| **1 s** | TCP retransmit timeout |

Each step is roughly 10× the previous. Memory : disk : network gap is the central pattern.

## Design Implications

- **RAM is 200× faster than SSD random read** → cache hot data in RAM.
- **DC RTT is 500 μs, cross-region is 150 ms** → place compute near data; avoid cross-region sync calls.
- **Sequential SSD ≫ random** → batch and sort writes (LSM-trees).
- **Network call ≫ in-process call** → batch RPCs.
- **Cross-region replication is async by default** — sync would gate every write on 150 ms.
- **TCP retransmit (1 s)** is why request timeouts default to seconds.

## Common Ratios to Remember

- RAM : SSD : HDD ≈ 1 : 1000 : 100,000 (random).
- DC RTT : cross-region RTT ≈ 1 : 300.
- Compute : network for tiny ops ≈ negligible : dominant.

## Common Mistakes

- **Conflating latency and throughput.** A 150 ms RTT doesn't preclude high QPS — pipelining and concurrency raise throughput.
- **Confusing SSD random vs sequential.** Sequential is ~10× faster.
- **Assuming "local" means in-process.** Same-host but cross-container is still ~10s of μs.

## Related Concepts

- [[Back-of-Envelope]] — uses these numbers to justify designs.
- [[Caching]] — motivated by RAM/disk gap.
- [[Multi-Leader Replication]] — motivated by cross-region latency.
- [[Powers of 2]] — pair with this reference.

## Active Recall Questions

What is the latency of an L1 cache reference?::~0.5 ns.

What is the latency of a main-memory (RAM) reference?::~100 ns — roughly 200× slower than L1.

What is the round-trip latency within a single datacenter?::~500 μs.

What is the cross-continent round-trip latency?::~150 ms.

What is the random read latency of an SSD?::~150 μs — roughly 1000× slower than RAM.

What's the typical TCP retransmit timeout?::~1 second.

Why is sequential SSD read ~10× faster than random?::Random reads incur per-op overhead and don't benefit from prefetching; sequential reads stream large blocks at near-bus throughput.

What's the design implication of the 300× ratio between DC and cross-region RTT?::Avoid synchronous cross-region calls; replicate asynchronously; place compute near data.

## Feynman Test

Explain to a new grad why "just call the database in another region" is a terrible design choice — quote one specific number that makes it obvious.

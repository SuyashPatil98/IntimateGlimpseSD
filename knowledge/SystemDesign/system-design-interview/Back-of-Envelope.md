---
title: Back-of-Envelope
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[Powers of 2]]", "[[Latency Numbers]]"]
related: ["[[4-Step Framework]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.2 ("Back-of-the-envelope estimation")
  - Jeff Dean, "Numbers Everyone Should Know" (2009 LADIS keynote)
  - system-design-primer Appendix
tags: [system-design-interview, estimation, methodology]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Back-of-Envelope

## Executive Summary

**Back-of-envelope (BotE) estimation** is rapid order-of-magnitude calculation to size a system: QPS, storage, bandwidth, memory. It anchors design choices in numbers and signals seniority in interviews. The discipline is approximate arithmetic with [[Powers of 2]], grounded in [[Latency Numbers]].

## Why This Exists

Engineering decisions hinge on scale. "Do we need a cache?" depends on QPS and DB capacity. "Do we shard?" depends on data size. Without numbers, design is opinion. BotE produces enough precision to choose between options.

## Core Approach

1. **Start from a user-facing number** (DAU, requests/user/day).
2. **Convert to per-second** for QPS.
3. **Multiply by payload size** for bandwidth and storage.
4. **Round generously** — order of magnitude is the target.

## Standard Quantities

**Time conversions (memorize):**
- 1 day = 86,400 seconds ≈ $10^5$ s.
- 1 year = $3.15 \times 10^7$ s ≈ $3 \times 10^7$ s.
- 1 month ≈ $2.6 \times 10^6$ s.

**Storage powers of 2 → 10:**
- 1 KB ≈ $10^3$ B, 1 MB ≈ $10^6$, 1 GB ≈ $10^9$, 1 TB ≈ $10^{12}$, 1 PB ≈ $10^{15}$.

**Typical server capacities (~2025):**
- CPU: ~1–10 k QPS for simple service; ~1 k QPS for complex.
- Memory: 64–512 GB RAM common.
- Network: ~10 Gbps NIC = ~1.25 GB/s.
- Disk: SSD ~500 MB/s seq, ~100k IOPS random; HDD ~150 IOPS.
- Database: ~10 k writes/s, ~50 k reads/s on hot single node.

## Templates

### QPS from DAU
$$\text{QPS}_{\text{avg}} = \frac{\text{DAU} \times \text{actions/user/day}}{86,400}$$
$$\text{QPS}_{\text{peak}} \approx 3 \times \text{QPS}_{\text{avg}}$$

**Example:** 100M DAU, 10 actions/user/day:
- Average QPS = $10^8 \times 10 / 10^5 = 10^4 = 10$k QPS.
- Peak QPS ≈ 30k QPS.

### Storage from write rate
$$\text{Storage/year} = \text{writes/s} \times 86{,}400 \times 365 \times \text{bytes/write}$$

**Example:** 1k writes/s × 1 KB/write × 1 year = $10^3 \times 3 \times 10^7 \times 10^3 = 3 \times 10^{13}$ B = 30 TB/year.

### Bandwidth from QPS
$$\text{BW} = \text{QPS} \times \text{bytes/response}$$

### Memory cap for cache
Standard rule: cache the **80/20** hot set in RAM.
- If working set ≈ 20% × total data, size cache to that.
- $$\text{Cache size} = 0.2 \times \text{total data}$$

## Working Mental Math

- **Use scientific notation.** $10^8$ users × $10$ actions = $10^9$ actions, not "ten billion".
- **Multiply exponents** by adding: $10^a \times 10^b = 10^{a+b}$.
- **Round mid-calc.** 86,400 ≈ $10^5$ is good enough.
- **Sanity check** result against known scales: if you compute "200 PB/day for 1M users", you have a bug.

## Worked Example: Twitter (interview style)

- **DAU:** 200M.
- **Writes (tweets/user/day):** 2 avg. Reads/user/day: 100.
- **Tweet size:** 280 chars ≈ 280 B + metadata ≈ 1 KB.

**Write QPS:**
- 200M × 2 / 86,400 ≈ $4 \times 10^8 / 10^5 = 4 \times 10^3$ = 4 k writes/s. Peak ≈ 12 k.

**Read QPS:**
- 200M × 100 / 86,400 ≈ $2 \times 10^{10}/10^5 = 2 \times 10^5$ = 200 k reads/s. Peak ≈ 600 k.

**Storage/year:**
- 4 k × $10^5$ × 365 × 1 KB ≈ $1.5 \times 10^{11}$ B = 150 GB/year (just tweet text; media dominates real storage).

**Implications:**
- Read >> write → heavy caching, fanout-on-write timelines.
- 200 GB/year scales fine on one shard; media/images move storage to PB scale.
- 200 k QPS reads cannot hit a single DB — cache, replicas, fanout precompute.

## Common Mistakes

- **Off-by-1000 errors.** Confusing MB and GB.
- **Average == peak.** Real systems have 3–10× peak/average.
- **Ignoring overhead.** Metadata, indexes, replication multiply storage 3–5×.
- **Quoting precise numbers** ("17,423 QPS") that overstate confidence.

## Related Concepts

- [[Powers of 2]] — substrate for the math.
- [[Latency Numbers]] — informs design choices given the BotE.
- [[4-Step Framework]] — BotE happens in Step 1 and Step 3.

## Active Recall Questions

How do you convert DAU to average QPS?::QPS_avg = (DAU × actions per user per day) / 86,400. For peak, multiply by ~3.

What is 1 day in seconds (rounded for mental math)?::86,400 s ≈ 10^5 s.

What is 1 year in seconds?::~3.15 × 10^7 s, typically rounded to 3 × 10^7 for BotE.

What's the typical write storage you'd assume per tweet/event including metadata?::~1 KB (280 bytes of text + indices, metadata, replication overhead).

What ratio of peak-to-average QPS is a good rule of thumb?::~3× for typical traffic; up to 10× for highly seasonal or viral systems.

What multiplier should you apply to raw data size to account for indexes and replication?::Typically 3–5× — primary copy, secondary indexes, replication factor (3 common), backups.

Why is order-of-magnitude precision the right target for BotE?::It's enough to choose between architectural options; over-precision wastes time and signals false confidence.

## Feynman Test

Walk a junior engineer through estimating storage for "Design a video-sharing site". List the four quantities you'd ask for and how you'd combine them.

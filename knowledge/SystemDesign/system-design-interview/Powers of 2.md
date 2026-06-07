---
title: Powers of 2
area: system-design-interview
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Back-of-Envelope]]", "[[Latency Numbers]]"]
builds_toward: []
sources:
  - system-design-primer Appendix
  - SDI vol 1 (estimation chapter)
tags: [system-design-interview, reference, math]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Powers of 2

## Executive Summary

Memorizing **powers of 2** through $2^{40}$ is essential for back-of-envelope estimation. Storage sizes, address spaces, hash keyspace, and counts all live in powers of 2. The shortcut: $2^{10} \approx 10^3$, $2^{20} \approx 10^6$, $2^{30} \approx 10^9$, $2^{40} \approx 10^{12}$.

## The Table

| Power | Exact | ≈ Decimal | Name |
|---|---|---|---|
| $2^{10}$ | 1,024 | $10^3$ | Kilo / Ki |
| $2^{16}$ | 65,536 | $6.5 \times 10^4$ | (port range, char set) |
| $2^{20}$ | 1,048,576 | $10^6$ | Mega / Mi |
| $2^{30}$ | 1.07 × $10^9$ | $10^9$ | Giga / Gi |
| $2^{32}$ | 4.29 × $10^9$ | $4 \times 10^9$ | (IPv4, 32-bit int max) |
| $2^{40}$ | 1.1 × $10^{12}$ | $10^{12}$ | Tera / Ti |
| $2^{50}$ | $10^{15}$ | $10^{15}$ | Peta / Pi |
| $2^{60}$ | $10^{18}$ | $10^{18}$ | Exa / Ei |
| $2^{63}$ | 9.2 × $10^{18}$ | (signed int64 max) | |
| $2^{64}$ | 1.8 × $10^{19}$ | (unsigned int64 max) | |

## Quick Conversions

- **Bytes:** B → KB → MB → GB → TB → PB. Each step = $2^{10}$ (in binary units) or $10^3$ (in SI units). For BotE, treat them as equivalent.
- **Bits to bytes:** ÷ 8.
- **1 GB ≈ 10^9 B**, often rounded for arithmetic.

## ASCII Mental Anchors

- **65,536** = $2^{16}$ = TCP port count, UCS-2 codepoints, max value of `uint16`.
- **4.29 billion** = $2^{32}$ = IPv4 address space, max 32-bit unsigned int.
- **9.2 quintillion** = $2^{63}$ = max signed int64; useful for timestamp ranges.

## Storage Scaling Examples

- **1 GB of 1 KB records** = $10^6$ records. (Useful: a million records fit per GB.)
- **1 TB of 1 KB records** = $10^9$ records.
- **1 PB of 1 KB records** = $10^{12}$ records.

## Hash and ID Spaces

- **128-bit UUID** = $2^{128}$ = $3.4 \times 10^{38}$. Collision-free for all practical purposes.
- **64-bit Snowflake ID** = $2^{64}$. Enough for billions of years at billion-per-second rate.
- **SHA-256** = $2^{256}$. Birthday collision at ~$2^{128}$ hashes.

## Network Throughput

- **1 Gbps** = $10^9$ bits/s = $1.25 \times 10^8$ B/s ≈ 125 MB/s.
- **10 Gbps** = 1.25 GB/s.
- **100 Gbps** = 12.5 GB/s.

## Common Mistakes

- **Confusing bits and bytes.** "100 Mbps connection" = ~12.5 MB/s, not 100 MB/s.
- **Treating Ki = K exactly.** 1 KiB = 1024 B; 1 KB = 1000 B by SI. The 2.4% gap matters for storage vendors, rarely for BotE.
- **Off-by-1000 in scaling.** GB to TB is $10^3$; double-check.

## Related Concepts

- [[Back-of-Envelope]] — primary use case.
- [[Latency Numbers]] — pair reference.

## Active Recall Questions

What is 2^10 approximately?::1,024 ≈ 10^3 (one thousand).

What is 2^20 approximately?::1,048,576 ≈ 10^6 (one million).

What is 2^30 approximately?::~1.07 × 10^9 ≈ 10^9 (one billion).

What does 2^32 represent in networking?::The IPv4 address space — ~4.29 billion addresses.

How many bytes per second is 1 Gbps?::125 MB/s — convert bits to bytes by dividing by 8.

What is the storage of 1 million 1 KB records?::~1 GB (10^6 × 10^3 = 10^9 bytes).

What is the maximum value of a signed 64-bit integer (powers of 2 form)?::2^63 − 1 ≈ 9.2 × 10^18.

What's the difference between KB and KiB?::KB = 10^3 B (1000); KiB = 2^10 B (1024). The 2.4% gap is real but ignored for back-of-envelope math.

## Feynman Test

Explain to a frontend developer why their "100 Mbps internet" isn't fast enough to upload a 1 GB file in 10 seconds — show the math.

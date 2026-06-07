---
title: Bloom Filters
area: databases
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[LSM-Trees]]", "[[SSTables]]", "[[Caching]]"]
sources:
  - DDIA, Ch. 3 (pp. 79)
  - Bloom, 1970
tags: [databases, data-structures, probabilistic]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Bloom Filters

## Executive Summary

A **Bloom filter** is a probabilistic data structure that answers **"is element X possibly in set S?"** with **either "no, definitely not" or "yes, maybe."** Uses k hash functions and a bit array. **No false negatives** (if it says no, it's truly absent); **false positives possible** (might say yes for absent elements). Extremely **space-efficient** — a few bits per element regardless of element size. Used everywhere you need to skip expensive lookups: LSM-tree SSTable filtering, cache existence checks, URL blacklists, network deduplication.

## Why This Exists

Many systems pay high cost to look up an element that's not present: disk I/O for an absent SSTable key; database query for a non-existent record. If you could cheaply answer "is it even possibly there?" you'd skip the expensive check most of the time. Bloom filters give that answer in O(k) memory accesses with sub-byte-per-element space — a phenomenal trade in many systems.

## Core Intuition

Hash an element with k different hash functions. Set those k bits in a bit array. To check membership, hash again and look at those bits. If any is zero, the element is definitely not in the set. If all are 1, it might be (or those bits could have been set by other elements — collisions). The trick: tune the bit-array size and k to bound the false-positive rate.

## Mathematical Foundations

For n elements, m-bit array, k hash functions:

**False positive probability** (approximate):

$$P_{fp} = \left(1 - e^{-kn/m}\right)^k$$

**Optimal k** for given m, n:

$$k_{opt} = \frac{m}{n} \ln 2 \approx 0.693 \cdot \frac{m}{n}$$

**Bits per element for desired FP rate p:**

$$\frac{m}{n} = -\frac{\ln p}{(\ln 2)^2} \approx 1.44 \cdot \log_2(1/p)$$

So 1% FP rate ≈ 9.6 bits per element; 0.1% ≈ 14 bits; 0.01% ≈ 19 bits. Extremely compact.

## Internal Mechanics

**Insert(x):**
1. Compute k hashes: h_1(x), h_2(x), ..., h_k(x).
2. Set bits at positions h_i(x) mod m to 1.

**Lookup(x):**
1. Compute k hashes.
2. If any bit at h_i(x) mod m is 0, return "definitely not present."
3. Else return "possibly present."

**Variants:**
- **Counting Bloom filter** — bits replaced by counters; supports deletion.
- **Scalable Bloom filter** — grows over time without re-sizing.
- **Cuckoo filter** — alternative; supports deletes; slightly more space-efficient.

## Real Production Examples

- **LSM-tree storage** — Cassandra, RocksDB, LevelDB use Bloom filters per SSTable to skip absent-key reads.
- **CDN caches** — quick existence check before storage lookup.
- **Chrome's Safe Browsing** — Bloom filter of malicious URLs.
- **Bitcoin SPV clients** — Bloom filter of addresses they care about.
- **Apache Spark** — bloom-join optimization.
- **Database query optimization** — join filtering.

## Design Tradeoffs

**Benefits:**
- Extreme space efficiency (~10 bits per element for 1% FP).
- O(k) constant-time operations.
- No false negatives.
- Composable (union via OR of bit arrays).

**Costs:**
- False positives.
- No deletion (vanilla version).
- Cannot list elements.
- Must pre-size or use scalable variant.

## Interview Perspective

**Common questions:**
- "What's a Bloom filter?" → Probabilistic data structure for membership. False positives possible; false negatives impossible.
- "How is it used in LSM-trees?" → Skip SSTables that definitely don't contain a key. Massive read amp reduction.
- "What's the false positive trade-off?" → More bits per element → lower FP rate. ~10 bits per element gives 1% FP.

**Senior-level:**
- The "no false negatives" guarantee is the killer feature: bloom filters reduce work but never introduce correctness bugs.
- Tuning FP rate is a workload decision: 1% might be wasteful if false positives trigger expensive operations; 0.01% costs ~2× the memory.
- Counting Bloom and Cuckoo filters fix the no-delete limitation if you need it.

**Common mistakes:**
- Choosing FP rate without considering downstream cost of false positives.
- Using non-deletable Bloom for sets that need removal.
- Reusing one big Bloom rather than per-shard — limits effectiveness.

## Related Concepts

- [[LSM-Trees]] · [[SSTables]] — primary use case.
- [[Caching]] — bloom-filter-based cache existence checks.

## Misconceptions

- **"Bloom filters can have false negatives."** No — that's the killer guarantee. Only false positives are possible.
- **"Bloom filter is just a hash set."** No — much more space-efficient; can't enumerate or remove.
- **"Bloom filters are exact."** Probabilistic by design.

## Failure Scenarios

- **Oversaturation** — too many elements; FP rate climbs above design target.
- **Bad hash functions** — collisions cluster; FP rate exceeds theoretical.
- **No re-sizing** — fixed-size filter fills.

## Practical Engineering Heuristics

- **Default FP rate: 1%** for read-amp reduction. Tune lower if downstream cost is high.
- **Use library implementations** (Guava, RocksDB built-in) — getting hash functions right is subtle.
- **Per-shard / per-SSTable** filters, not one giant filter.
- **Monitor actual FP rate** vs target.

## Active Recall Questions

What's a Bloom filter?::Probabilistic data structure for membership queries. Says "definitely not present" or "possibly present." No false negatives; false positives possible.

How does it work?::k hash functions → bit positions. Insert sets bits. Lookup checks bits: any 0 → definitely absent; all 1 → possibly present.

Bits per element for 1% FP rate?::~10 bits per element. (Exact: ≈ 9.6 bits.)

What's the killer guarantee of Bloom filters?::No false negatives. If it says "not present," it's truly absent. Reduces work without introducing correctness bugs.

How is Bloom filter used in LSM-trees?::Per-SSTable bloom filter quickly determines whether to read the SSTable for a key. Massive read-amplification reduction.

Why can't you delete from a basic Bloom filter?::Bits set by an element may have been set by others too. Clearing them could create false negatives. Use counting Bloom for deletes.

## Feynman Test

Walk through Bloom filter insert + lookup with k=3 hashes and a bit array of size 32. What happens with two elements?

Why is "no false negatives" the property that makes Bloom filters safe to use as optimizations?

## Mastery Checklist

- **Explain** Bloom filter operations and guarantees.
- **Compare** with hash sets and Cuckoo filters.
- **Derive** memory requirements for a target FP rate.
- **Critique** Bloom-based designs without monitoring actual FP rate.
- **Design** a Bloom-filtered LSM read path.

[^Bloom-1970]: Bloom, "Space/Time Trade-offs in Hash Coding with Allowable Errors," 1970.

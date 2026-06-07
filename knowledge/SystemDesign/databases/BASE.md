---
title: BASE
area: databases
status: mature
difficulty: intermediate
prerequisites: ["[[ACID]]", "[[Eventual Consistency]]"]
related: ["[[ACID]]", "[[Eventual Consistency]]", "[[CAP Theorem]]", "[[NoSQL]]"]
sources:
  - SDI vol 1, Ch. 3
  - system-design-primer
  - Pritchett, 2008 (original framing)
tags: [databases, consistency, nosql]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# BASE

## Executive Summary

BASE — **B**asically **A**vailable, **S**oft state, **E**ventual consistency — is the design philosophy contrasting with [[ACID]]. Coined by Dan Pritchett (eBay, 2008) to characterize the trade-offs many web-scale NoSQL systems make. Where ACID prioritizes correctness and consistency, BASE prioritizes availability and partition tolerance, accepting eventual consistency and intermediate ("soft") states. Not a precise specification — more a *worldview* for designing scalable systems where strong consistency would cost too much.

## Why This Exists

At web scale, ACID's coordination costs become prohibitive. Strict consistency requires synchronous quorums; isolation requires locks; durability slows commits. Pritchett observed eBay (and others) consistently *chose availability over consistency* — better to show slightly stale data than fail. BASE names this philosophy so designers can be explicit about what they're trading.

## Core Intuition

ACID is a tightly coordinated bureaucracy: every change is logged, validated, and committed atomically. BASE is a relaxed collective: updates propagate when they can; the system stays running; data converges over time. Different priorities; different costs; different trade-offs.

## The Three Properties

**Basically Available:**
- System always responds — possibly with stale or partial data.
- Availability prioritized over consistency.
- (Maps to CAP's A side.)

**Soft state:**
- State may change over time even without input — due to background reconciliation, propagation, eventual writes.
- The current value is "a recent guess" rather than the canonical truth.

**Eventual consistency:**
- All replicas eventually converge on the same value.
- No bound on convergence time.
- See [[Eventual Consistency]] for depth.

## Design Tradeoffs

**Benefits:**
- High availability — system always responds.
- Low latency — no coordination round-trip.
- Horizontal scalability.
- Partition-tolerant.

**Costs:**
- Application complexity — must handle stale reads, conflicts.
- Reasoning is harder.
- Some workloads (financial, locks) are wrong for BASE.

## Real Production Examples

- **DNS** — canonical BASE system. Always available; eventually consistent.
- **Cassandra, DynamoDB, Riak** — BASE by default; tunable.
- **CDNs** — BASE for content propagation.
- **Social feeds, search indexes** — typically BASE.
- **eBay's original use case** — listings could be slightly stale during bidding.

## Interview Perspective

**Common questions:**
- "ACID vs BASE?" → Two design philosophies. ACID: strong, transactional. BASE: available, eventually consistent.
- "Is BASE worse than ACID?" → Different. BASE wins when availability and scale matter more than instantaneous consistency.
- "Give an example of BASE in production." → DNS, Cassandra, CDNs, social feeds.

**Senior-level:**
- BASE is a philosophy, not a spec. Real systems combine ACID and BASE per operation.
- The Pritchett paper is a useful read for designers — it's about *thinking* in BASE terms, not implementing a specific protocol.
- Many "BASE" systems offer ACID-like guarantees per-document/per-partition; BASE is the cross-partition story.

**Common mistakes:**
- Treating ACID/BASE as system-level choices rather than per-operation.
- Using BASE for workloads where consistency really matters (financial state).
- Assuming "eventually" means "soon."

## Related Concepts

- [[ACID]] — the contrast.
- [[Eventual Consistency]] — the E.
- [[CAP Theorem]] — BASE systems are typically AP.
- [[NoSQL]] — most NoSQL is BASE-flavored.

## Misconceptions

- **"BASE = no consistency."** Eventual consistency is still a guarantee.
- **"BASE is bad."** It's the right design for many workloads (caches, feeds, content).
- **"BASE and ACID are mutually exclusive."** Modern systems combine — ACID per partition, BASE across.

## Failure Scenarios

- **Stale-read user confusion** — see [[Replication Lag]].
- **Concurrent-write conflicts** without resolution logic.
- **"Eventually" being hours** under partition.

## Practical Engineering Heuristics

- **Use BASE for high-availability reads** (feeds, profiles, content).
- **Use ACID for money, locks, leader election.**
- **Per-operation choice is normal.**
- **Document staleness expectations** in your SLAs.

## Active Recall Questions

What does BASE stand for?::Basically Available, Soft state, Eventual consistency.

Who coined BASE?::Dan Pritchett (eBay), 2008.

What's "soft state"?::State may change over time without input due to background reconciliation. The current value is approximate.

When choose BASE over ACID?::High availability + horizontal scale required, application can tolerate stale reads, no strict ordering needed.

When choose ACID over BASE?::Money, locks, uniqueness, leader election — anywhere correctness depends on strong consistency.

Is BASE a precise specification?::No — it's a design philosophy and shorthand for "AP + eventual consistency."

## Feynman Test

Compare ACID and BASE for a social-media feed system. Why is BASE the right default?

Explain why "we're an ACID shop" vs "we're a BASE shop" is the wrong framing.

## Mastery Checklist

- **Explain** BASE's three properties.
- **Compare** ACID and BASE.
- **Derive** which philosophy fits a given workload.
- **Critique** systems forcing all operations into one paradigm.
- **Design** a mixed-paradigm system using both.

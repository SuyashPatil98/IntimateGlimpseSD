---
title: CAP Theorem
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[PACELC]]", "[[Consistency Models]]", "[[Linearizability]]", "[[Eventual Consistency]]", "[[Quorums]]"]
builds_toward: ["[[PACELC]]", "[[Distributed Transactions]]"]
sources:
  - DDIA, Ch. 9, pp. 336–340 (Kleppmann's critique)
  - SDI vol 1, Ch. 6
  - FoSA, Ch. 6
  - system-design-primer (Donne Martin)
tags: [distributed-systems, consistency, availability, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# CAP Theorem

## Executive Summary

In a distributed system that experiences a **network partition**, you must choose between **consistency** and **availability** — you cannot have both. The CAP theorem (Brewer, 2000; proved by Gilbert & Lynch, 2002) formalizes this trade-off. In practice it is narrower than commonly described: it only applies *during* partitions, defines consistency as **linearizability** (the strongest single-object model), and is silent about the more common case of latency-vs-consistency trade-offs when no partition is occurring — see [[PACELC]].

## Why This Exists

Distributed systems span machines connected by networks, and networks fail — packets get dropped, links go down, partitions split the cluster in two. When a partition occurs, a node that can't reach its replicas must choose: refuse the request (preserve consistency) or serve a possibly-stale answer (preserve availability). CAP says you cannot dodge this choice. The theorem exists to force designers to confront it explicitly rather than hand-wave it away.

## Core Intuition

Two bank branches share a phone line, each holding a copy of your balance. The line goes down. A customer asks to withdraw $100. The teller has two choices:

- **Refuse** until they can confirm with the other branch → *consistent but unavailable*.
- **Allow** based on the local balance → *available but potentially wrong if you also withdrew at the other branch*.

There is no third option. CAP is the formal statement of this fact.

## Formal Definition

CAP refers to three properties of a distributed system:

- **C (Consistency)** — every read receives the most recent write or an error. Specifically, **linearizability**: a single global ordering of operations consistent with real time.
- **A (Availability)** — every request receives a non-error response, with no guarantee that it contains the most recent write.
- **P (Partition tolerance)** — the system continues to operate despite arbitrary message loss between nodes.

The theorem: **in the presence of a network partition, a system can guarantee at most two of {C, A, P}**.

Because partitions are unavoidable in real networks, **P is mandatory**. The real choice is between **CP** and **AP** *during* a partition.

## Internal Mechanics

How systems realize each choice:

**CP (Consistency + Partition tolerance, sacrifice Availability):**
- During a partition, the minority side stops accepting writes (and often reads).
- Mechanism: quorum-based commits require a majority. Without majority, no progress.
- Examples: etcd, ZooKeeper, HBase, PostgreSQL with synchronous replication.

**AP (Availability + Partition tolerance, sacrifice Consistency):**
- During a partition, both sides keep serving reads and writes; they reconcile when the partition heals.
- Mechanism: writes go to any reachable replica; conflicts resolved later (last-write-wins, vector clocks, CRDTs).
- Examples: Cassandra (default), DynamoDB (default), DNS, Riak.

## Architecture Diagrams

```
                  Network Partition
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
  Side A              [DROP]              Side B
  ┌────┐              messages            ┌────┐
  │ N1 │ ←─×──────────────────────────×─→ │ N3 │
  │ N2 │ ←─×──────────────────────────×─→ │ N4 │
  └────┘                                  └────┘

CP system behavior:               AP system behavior:
  Majority side keeps quorum.       Both sides serve reads/writes.
  Minority side stops responding.   Conflicts resolved on heal.
```

## Design Tradeoffs

| | CP | AP |
|---|---|---|
| **Read latency** | Higher (coordination) | Lower (any replica) |
| **Write latency** | Higher (quorum) | Lower (async possible) |
| **Availability under partition** | Minority side unavailable | Both sides up |
| **Application complexity** | Low (single-machine semantics) | High (conflict handling) |
| **Best for** | Money, locks, coordination | Feeds, profiles, caches |

**Hidden complexity:** the partition doesn't have to be a *physical* network failure. A slow node behaves like a partial partition. GC pauses, overloaded queues, or congestion all manifest as CAP trade-offs. **Timeouts are a system design decision, not a config detail.**

## Real Production Examples

- **etcd, ZooKeeper, Consul** — CP. Used for coordination (leader election, config). Refuses to serve during quorum loss because stale config is worse than no answer.
- **Cassandra** — AP by default; tunable. Writes accepted by any reachable replica; conflicts via LWW timestamps.
- **DynamoDB** — historically AP; strongly consistent reads opt-in via API flag, making that operation CP-flavored.
- **Google Spanner** — claims CP, but with TrueTime and engineering rigor makes partitions rare enough to feel both consistent and available. The theorem still applies; partition frequency is just minimized.
- **DNS** — AP. Stale results are fine; refusing to answer would be catastrophic.
- **PostgreSQL with synchronous replication** — CP. Master refuses writes if standby unreachable.

## Interview Perspective

**Common questions:**
- "Is system X CP or AP?" → Usually misleading. Modern systems are tunable *per operation*. Cassandra is AP with QUORUM but linearizable with LWT.
- "Why can't you have CA?" → P is not optional in real networks. CA is the theoretical limit (single-node systems or systems pretending partitions can't happen).
- "Explain CAP to a junior engineer." → Bank branches analogy. Emphasize the choice only matters *during* a partition.

**Senior-level discussion:**
- CAP is too coarse for design decisions. Production systems tune per operation. The real day-to-day trade-off is captured by [[PACELC]].
- "Consistency" in CAP is **linearizability**, not weaker forms. Many "consistent" systems are actually causally or eventually consistent.
- Brewer revisited CAP in 2012 ("CAP Twelve Years Later"), arguing it's better framed as: *during* a partition, what fraction of consistency or availability do you sacrifice, and *how do you recover* when the partition heals?

**Common mistakes:**
- Treating CAP as a tri-choice ("we picked CA"). There is no CA in real distributed systems.
- Believing CAP applies always, not just during partitions.
- Equating CAP's C with ACID's C — they're different (replica agreement vs invariant preservation).

## Related Concepts

- [[PACELC]] — extends CAP to the latency-vs-consistency trade-off when no partition is occurring (the common case).
- [[Consistency Models]] — CAP's C is linearizability; real systems offer weaker models.
- [[Linearizability]] — the formal definition of CAP's C.
- [[Eventual Consistency]] — the canonical AP consistency model.
- [[Replication]] — the mechanism by which CAP trade-offs are realized.
- [[Quorums]] — how CP systems implement consistency.

## Misconceptions

- **"You pick 2 of 3."** No — P isn't optional. The "pick 2" framing is from Brewer's original keynote and has been criticized as misleading.
- **"CAP says distributed systems must be eventually consistent."** No — CP systems exist and are useful. CAP just says CP sacrifices availability during partitions.
- **"CAP applies all the time."** No — only during partitions. PACELC addresses the rest.
- **"Consistency = ACID consistency."** Different "C"s. CAP's C is linearizability across replicas. ACID's C is invariant preservation within a transaction.
- **"Spanner violates CAP."** No — Spanner is CP. Its trick is engineering partitions to be so rare the availability cost is negligible.

## Failure Scenarios

- **Asymmetric partitions** — node A sees B but B can't see A. Symptom: "ghost leaders" where each side elects its own leader. Mitigation: leader leases with timeouts longer than max network delay.
- **Slow node masquerading as partition** — alive but unresponsive node triggers the trade-off. Mitigation: aggressive [[Health Checks]] separating "I'm alive" from "I can serve traffic."
- **Partition healing produces conflict storm** — in AP systems, accumulated divergent writes must be reconciled. Mitigation: [[CRDTs]], app-level merge, LWW with synchronized clocks.

## Practical Engineering Heuristics

- **Default to AP for user-facing reads** (cache, profile, social feed). Stale is usually better than absent.
- **Default to CP for coordination, money, locks, leader election.** Stale is catastrophic; refusing is correct.
- **Tunable per operation.** Don't pick CP or AP at the system level — pick per query.
- **Measure partition frequency.** Engineering for partitions you've never observed is over-engineering. Engineering for partitions you see weekly is essential.

## Advanced Topics

- [[PACELC]] — the practical extension.
- **PBS (Probabilistically Bounded Staleness)** — measures the *probability* of staleness in eventually consistent systems.
- **Harvest and yield** (Fox & Brewer, 1999) — graceful degradation framing: trade *completeness* of the result for availability rather than binary CP/AP.
- **CRDTs** — Conflict-Free Replicated Data Types eliminate certain AP conflict-resolution headaches by making merges associative.

## Active Recall Questions

What does CAP stand for?::Consistency, Availability, Partition tolerance.

What does the CAP theorem actually claim?::During a network partition, a distributed system can guarantee at most two of {Consistency, Availability, Partition tolerance}. Since partitions are unavoidable, the real choice is CP vs AP.

What kind of consistency does CAP refer to?::Linearizability — the strongest single-object consistency model. Not ACID consistency, not eventual consistency.

Why can't you have CA?
?
Network partitions are unavoidable in real distributed systems. "CA" only exists as a theoretical limit — a single-node system or one that pretends partitions can't happen. Choosing CA in practice means you've decided to fail when a partition occurs.

Name a CP system and an AP system.
?
CP: etcd, ZooKeeper, HBase, PostgreSQL with sync replication. AP: Cassandra (default), DynamoDB (default), DNS, Riak.

When does the CAP trade-off actually kick in?::Only during a network partition. When the network is healthy, you can have both C and A simultaneously.

What is the difference between CAP's C and ACID's C?::CAP's C is linearizability — replica agreement on operation order. ACID's C is invariant preservation within a transaction (constraints, foreign keys). They are unrelated despite the shared word.

How does Spanner relate to CAP?::Spanner is CP, but uses TrueTime (synchronized atomic clocks) and aggressive engineering to make partitions extremely rare. Practically it feels both consistent and available; the theorem still applies during partition events.

What's wrong with the framing "pick 2 of 3"?
?
P isn't optional — networks partition, so you must tolerate it. The real choice is C or A *given* P. The "pick 2" framing implies CA is a real option, which it isn't.

What's the smallest concrete scenario where CAP forces a choice?
?
Two replicas, network drops between them, a client writes to one. The receiving replica either refuses the write (CP) or accepts it without acknowledgment from the other (AP).

## Feynman Test

Explain CAP to a smart engineer who's never seen it. Use one concrete example (not banks). Where does your analogy break down?

Argue both sides of: "CAP is no longer useful in 2024."

Why did Brewer call his 2012 reflection "CAP Twelve Years Later"? What did he change his mind about?

## Mastery Checklist

You should be able to:

- **Explain** CAP with a concrete partition scenario and identify CP vs AP behavior.
- **Compare** CAP and [[PACELC]] — what does PACELC add?
- **Derive** which side of CAP a system has chosen by examining its behavior under partition (test: kill a replica's network; observe).
- **Critique** the "pick 2 of 3" framing.
- **Design** a system that selects CP or AP per operation rather than per system, and justify each choice.

[^DDIA-336]: Designing Data-Intensive Applications, Kleppmann, pp. 336–340.
[^SDI-Ch6]: System Design Interview vol 1, Alex Xu, Ch. 6.
[^FoSA-Ch6]: Fundamentals of Software Architecture, Ford & Richards, Ch. 6.

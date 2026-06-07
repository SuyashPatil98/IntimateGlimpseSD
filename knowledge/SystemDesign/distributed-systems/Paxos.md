---
title: Paxos
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consensus]]", "[[Quorums]]"]
related: ["[[Consensus]]", "[[Raft]]", "[[Leader Election]]", "[[Linearizability]]"]
sources:
  - Lamport, 1998 ("The Part-Time Parliament")
  - Lamport, 2001 ("Paxos Made Simple")
  - DDIA, Ch. 9
tags: [distributed-systems, consensus, paxos]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Paxos

## Executive Summary

Paxos (Lamport, 1998) is the **original distributed consensus algorithm** — and the most famously difficult to understand. It solves the single-value agreement problem in an asynchronous network with crash failures, using a **two-phase prepare/accept protocol** built on majority quorums. Multi-Paxos extends it to a log of values. Production systems (Google Spanner, Megastore, Chubby) run Paxos at planetary scale. Most modern systems prefer [[Raft]] for clarity, but Paxos remains foundational — both historically and in deployments that are too entrenched to migrate.

## Why This Exists

Lamport set out to formalize what consensus *is* and prove the simplest possible protocol solving it. Paxos was the answer (1989, published 1998). For a decade, the paper was so impenetrable that most distributed-systems courses skipped it. Lamport later wrote "Paxos Made Simple" (2001), still finding readers struggling. The protocol's existence proves: yes, you can achieve consensus under realistic failure models. The implementation's difficulty proves: doing so is genuinely hard.

## Core Intuition

A parliament of part-time legislators. Anyone can propose a decree; decrees pass when a majority accepts. But legislators come and go, messengers may be slow, and you need to ensure no two contradictory decrees pass. Paxos's protocol — proposers, acceptors, learners, ballot numbers — formalizes how this works.

For consensus on a single value: a **proposer** asks acceptors to **promise** they'll consider its proposal (prepare phase), then sends the value for acceptance (accept phase). A value is **chosen** when a majority of acceptors have accepted it. Once chosen, it cannot be unchosen.

## Internal Mechanics

**Roles:**
- **Proposers** — propose values.
- **Acceptors** — vote on proposals.
- **Learners** — discover chosen values.

(In practice, a single process plays all three roles.)

**Single-value Paxos** (one decision):

**Phase 1: Prepare**
1. Proposer chooses ballot number `n` (monotonically increasing, globally unique).
2. Sends `prepare(n)` to a majority of acceptors.
3. Each acceptor responds:
   - If `n` ≤ highest prepare it's seen: reject.
   - Else: promise not to accept any proposal numbered < n; respond with the highest-numbered proposal it has *accepted* (if any).

**Phase 2: Accept**
4. Proposer collects responses. If majority promised:
   - Picks the value `v` from the highest-numbered prior accepted proposal in those responses.
   - If no acceptor had accepted anything: free to pick its own `v`.
5. Sends `accept(n, v)` to a majority.
6. Acceptors accept if they haven't promised a higher ballot.
7. Once a majority has accepted (n, v), v is **chosen**.

**Multi-Paxos:** for a log of values, optimize by electing a stable leader. Leader skips Phase 1 for subsequent slots — just runs Phase 2. Dramatically reduces round-trips.

## Architecture Diagrams

```
Single-value Paxos:

Proposer P                 Acceptors A, B, C
   │                              │
   │── prepare(5) ──────────────→ │ → A: promise(5); no prior accept
   │                              │   B: promise(5); no prior accept
   │                              │   C: promise(5); no prior accept
   │← responses ─────────────── │
   │                              │
   │── accept(5, "X") ─────────→ │ → A: accept(5, "X")
   │                              │   B: accept(5, "X")
   │                              │   C: accept(5, "X")
   │← accepted ────────────────── │
   │                              │
   │   Majority accepted → "X" is CHOSEN.
```

## Design Tradeoffs

**Benefits:**
- Provably correct under crash failures and asynchrony.
- Tolerates F failures with 2F+1 nodes.
- Battle-tested in massive-scale production (Google).

**Costs:**
- **Difficult to understand.** Original paper is notoriously opaque.
- **Difficult to implement correctly.** Subtle edge cases.
- Two round-trips per decision (without leader optimization).
- "Multi-Paxos" optimization adds yet another layer of complexity.

## Real Production Examples

- **Google Chubby** — Paxos-based lock service; foundational to Google's infrastructure.
- **Google Megastore** — Paxos per entity group.
- **Google Spanner** — Paxos per shard; combined with TrueTime for global serializability.
- **Apache Cassandra LWT** — uses a Paxos variant for linearizable compare-and-set operations.
- **Amazon DynamoDB transactions** — Paxos-style internally.

## Interview Perspective

**Common questions:**
- "Walk through Paxos." → Prepare (request promise with ballot n), accept (send value once majority promised). Value chosen when majority accepts.
- "Why two phases?" → Phase 1 ensures no smaller-ballot value can be chosen later; Phase 2 actually decides.
- "How does Multi-Paxos optimize?" → Stable leader skips Phase 1 for subsequent decisions; one round-trip per decision instead of two.

**Senior-level:**
- Paxos's complexity comes from handling all edge cases: ballot reuse, dueling proposers, recovering from crashed leaders. Real implementations are thousands of lines.
- The reason for Phase 1 returning previously-accepted values: ensures that if any value was *chosen*, any later proposal will adopt it. This is the heart of safety.
- Lamport's later work (Generalized Paxos, Egalitarian Paxos) tries to remove the leader bottleneck. Mixed reception.

**Common mistakes:**
- Skipping Phase 1 in Multi-Paxos without proper leadership election → safety violation.
- Reusing ballot numbers → dueling proposers can livelock.
- Implementing without rigorous testing — subtle bugs cause silent data loss.

## Related Concepts

- [[Consensus]] — the problem Paxos solves.
- [[Raft]] — modern alternative; same problem, clearer presentation.
- [[Quorums]] — Paxos uses majority quorums.
- [[Leader Election]] — Multi-Paxos's optimization.
- [[Linearizability]] — what Paxos-replicated state machines provide.

## Misconceptions

- **"Paxos is impractical."** It runs at Google's planetary scale. Hard to *understand* and *implement*, not to run.
- **"Paxos solves Byzantine consensus."** No — crash failures only. Byzantine Paxos exists but is much more expensive.
- **"Paxos = Multi-Paxos."** Single-value Paxos is the core protocol; Multi-Paxos is the optimization for sequences.

## Failure Scenarios

- **Dueling proposers** — two proposers keep incrementing ballot numbers; livelock. Mitigation: leader election layer chooses one proposer.
- **Leader crash during accept** — value may be partially chosen. Recovery: new leader runs Phase 1 to discover state.
- **Network partition** — minority side can prepare but never get majority accepts; blocked.

## Practical Engineering Heuristics

- **Don't implement Paxos from scratch.** Use etcd, ZooKeeper, or a vetted library.
- **If you must implement: get peer review from someone who's done it before.** Subtle bugs are catastrophic.
- **Use Multi-Paxos with a stable leader** for performance. Pure Paxos per decision is slow.
- **Test partitions and leader churn exhaustively.** Most bugs hide there.

## Active Recall Questions

What problem does Paxos solve?::Distributed consensus on a single value under crash failures and asynchrony. Tolerates F failures with 2F+1 nodes via majority quorums.

What are the two phases of Paxos?::Phase 1 (Prepare): proposer asks acceptors to promise not to accept lower-ballot proposals. Phase 2 (Accept): proposer sends value once a majority promised; majority of accepts means value is chosen.

What does an acceptor return in Phase 1?::A promise not to accept lower-ballot proposals, plus the highest-numbered proposal it has previously *accepted* (so the new proposer can adopt it if needed).

Why does Phase 1 return previously accepted values?::To ensure that if any value was chosen previously, the new proposer will adopt it. This is what guarantees safety.

What is Multi-Paxos?::Optimization for running Paxos on a log of values. Elect a stable leader; leader skips Phase 1 for subsequent slots. One round-trip per decision instead of two.

Who designed Paxos and when?::Leslie Lamport, 1989 (published 1998 in "The Part-Time Parliament"; simplified explanation 2001 in "Paxos Made Simple").

Name three production systems using Paxos.::Google Chubby, Google Spanner, Google Megastore, Cassandra LWT (Paxos variant).

## Feynman Test

Walk through Paxos with three proposers all proposing different values to five acceptors. What happens?

Why does Phase 1 require returning previously accepted values, and what could go wrong without it?

## Mastery Checklist

- **Explain** single-value Paxos with the two phases.
- **Compare** Paxos and Raft.
- **Derive** why majority quorum is necessary.
- **Critique** "rolled our own Paxos" implementations.
- **Design** a system using etcd-backed Paxos for coordination.

[^Paxos-1998]: Lamport, "The Part-Time Parliament," ACM TOCS 1998.
[^Paxos-Simple]: Lamport, "Paxos Made Simple," 2001.

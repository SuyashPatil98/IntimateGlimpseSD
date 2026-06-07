---
title: Two-Phase Commit
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consensus]]", "[[Transactions]]"]
related: ["[[Distributed Transactions]]", "[[Consensus]]", "[[Saga Pattern]]", "[[Three-Phase Commit]]"]
sources:
  - DDIA, Ch. 9 (pp. 354–360)
  - Gray & Reuter, 1992
tags: [distributed-systems, consensus, transactions]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Two-Phase Commit

## Executive Summary

Two-Phase Commit (2PC) is the canonical **atomic commit protocol** — it ensures that a transaction spanning multiple participants either commits everywhere or aborts everywhere, never partial. It uses a **coordinator** that runs two phases: **prepare** (every participant promises it can commit) and **commit** (coordinator broadcasts the final decision). 2PC achieves atomicity across nodes but at significant costs: blocks on coordinator failure, doesn't scale, and is the root of many production headaches. Modern systems often prefer [[Saga Pattern]] (eventual consistency) or built-in distributed transactions (Spanner, FaunaDB) instead.

## Why This Exists

Some workloads genuinely require all-or-nothing atomicity across services: moving money between bank accounts on different databases, or coordinating inventory + payment + shipping. Without 2PC, you risk partial commits — money debited but not credited, payment taken but order not created. 2PC formalizes the protocol for safe cross-system atomicity. Whether you should *use* it is another question.

## Core Intuition

A wedding ceremony. The officiant (coordinator) asks each person to confirm they're ready: "Do you take..." (prepare). Each says "I do" (vote yes) or refuses (vote no). If both said yes, the officiant declares them married (commit). If anyone said no, the officiant declares it off (abort). The two-phase structure ensures both parties commit or neither does.

The problem: if the officiant collapses between phases, the participants are stuck — they've said "I do" but don't know if the marriage was finalized.

## Internal Mechanics

**Roles:**
- **Coordinator** — orchestrates the protocol.
- **Participants** — the nodes whose state is being changed.

**Phase 1: Prepare (Voting)**
1. Coordinator sends `prepare(T)` to all participants.
2. Each participant:
   - Writes its intent to a durable log.
   - Locks the resources touched by T.
   - Responds: `yes` (can commit) or `no` (must abort).

**Phase 2: Commit/Abort (Decision)**
3. Coordinator collects votes.
4. If all participants voted `yes` → coordinator writes `commit(T)` to its log, sends `commit` to all.
5. If any voted `no` → coordinator writes `abort(T)`, sends `abort` to all.
6. Participants apply the decision, release locks, ack.

**Recovery:** if participant crashes after voting yes, on restart it reads its log and asks the coordinator for the decision. If coordinator crashed too — participant blocks indefinitely.

## Architecture Diagrams

```
Coordinator                Participants P1, P2, P3
   │
   │─── prepare(T) ──────→ all
   │                       (P1, P2, P3 each: lock + log intent + vote)
   │← yes/no ──────────── 
   │
   │   if all yes → write commit log → send commit to all
   │   if any no  → write abort log  → send abort to all
   │
   │─── commit(T) ────────→ all
   │← ack ──────────────
   │
   │   Done.
```

## Design Tradeoffs

**Benefits:**
- True atomic commit across heterogeneous systems.
- Standardized; well-understood semantics.

**Costs:**
- **Blocking protocol** — participants holding locks must wait for coordinator's decision. Coordinator crash mid-protocol blocks everyone indefinitely.
- **Coordinator is SPOF** — though logs allow recovery.
- **Latency** — two round-trips minimum; participants hold locks throughout.
- **Doesn't scale** — every participant must respond; tail latency dominates.
- **Heuristic outcomes** — participants timeout waiting for coordinator; may unilaterally abort, causing inconsistency.

## Real Production Examples

- **XA / X/Open standard** — distributed transaction standard implementing 2PC.
- **PostgreSQL prepared transactions** — `PREPARE TRANSACTION` / `COMMIT PREPARED` is 2PC.
- **MSDTC (Microsoft)** — Distributed Transaction Coordinator using 2PC.
- **Java JTA** — Java's distributed-transaction API; uses 2PC.
- **Most "enterprise" databases of the 1990s–2000s** — built around 2PC.
- **Avoided by modern web architectures** — replaced by sagas, eventual consistency, or built-in distributed DBs.

## Interview Perspective

**Common questions:**
- "Explain 2PC." → Coordinator asks all participants to prepare; if all vote yes, sends commit; otherwise abort. Atomic across systems.
- "What's 2PC's biggest weakness?" → Blocks on coordinator failure. Participants holding locks can be stuck indefinitely.
- "2PC vs Saga?" → 2PC: synchronous atomic commit; blocking; strong. Saga: async, eventually consistent; non-blocking; compensating actions on failure.

**Senior-level:**
- 2PC is *not* fault-tolerant consensus. It can block forever if the coordinator dies between phases. True consensus (Paxos/Raft) is non-blocking.
- 2PC over a WAN is operationally toxic — participant lock duration includes WAN round-trip plus failure-handling.
- Modern distributed databases (Spanner, CockroachDB) implement 2PC *on top of* Paxos/Raft: each participant is a Raft group, so the protocol is non-blocking.

**Common mistakes:**
- Using 2PC across services in a microservices architecture — couples deployments, propagates failures.
- Forgetting that participant locks block other work during the entire protocol.
- Believing 2PC is consensus — it isn't; it's commit, and it's blocking.

## Related Concepts

- [[Consensus]] — 2PC is *not* consensus; it's atomic commit. Different fault assumptions.
- [[Distributed Transactions]] — 2PC is one implementation.
- [[Saga Pattern]] — async, non-blocking alternative.
- [[Three-Phase Commit]] — variant adding a phase to reduce blocking; rarely used in practice.
- [[Transactions]] — local single-DB version.

## Misconceptions

- **"2PC is consensus."** No — it's atomic commit. 2PC blocks on coordinator failure; consensus protocols (Paxos/Raft) don't.
- **"2PC is fault-tolerant."** Partially. Recovers from many failures but blocks indefinitely on certain coordinator-failure timing.
- **"Use 2PC for microservices."** Generally a bad idea — see [[Saga Pattern]] instead.

## Failure Scenarios

- **Coordinator crashes between prepare and commit** — participants hold locks indefinitely (or unilaterally abort with risk of inconsistency).
- **Network partition during commit phase** — some participants get commit, some don't. Inconsistency unless they reconnect.
- **Participant crashes after voting yes** — on restart, must contact coordinator for decision; meanwhile, locks held.
- **Coordinator-and-participant simultaneous crash** — manual recovery required.

## Practical Engineering Heuristics

- **Avoid 2PC across microservices.** Use sagas or eventual consistency.
- **Use 2PC inside a single distributed database** built on consensus (Spanner, CockroachDB) — there the coordinator is itself replicated.
- **If using 2PC: short timeouts, careful failure handling, manual recovery procedures.**
- **Monitor "in-doubt" transactions** — they indicate stuck commits.

## Active Recall Questions

What is Two-Phase Commit?::An atomic commit protocol. Coordinator asks all participants to prepare; if all vote yes, sends commit; otherwise abort. Ensures all-or-nothing across systems.

What are the two phases?::Phase 1 (Prepare): coordinator asks all participants to vote yes/no. Phase 2 (Commit/Abort): coordinator sends the final decision based on votes.

What's 2PC's biggest failure mode?::Blocks indefinitely if coordinator crashes between phases. Participants hold locks waiting for the decision.

Is 2PC a consensus protocol?::No. Consensus protocols (Paxos, Raft) are non-blocking; 2PC blocks on coordinator failure. Different fault assumptions.

When should you use 2PC?::Inside a single distributed database where the coordinator is itself replicated. Rarely a good idea across separate services.

What's the alternative for cross-service atomicity?::Sagas (compensating actions), event sourcing with eventual consistency, or built-in distributed transactions (Spanner, CockroachDB).

## Feynman Test

Walk through 2PC with three participants. What happens if the coordinator crashes after sending prepare but before sending commit?

Explain why 2PC over a WAN is operationally problematic.

## Mastery Checklist

- **Explain** 2PC with its two phases.
- **Compare** 2PC and consensus.
- **Compare** 2PC and saga pattern.
- **Derive** why 2PC blocks on coordinator failure.
- **Critique** "use 2PC across our microservices" suggestions.
- **Design** a system that achieves cross-service atomicity without 2PC.

[^DDIA-354]: Designing Data-Intensive Applications, Kleppmann, Ch. 9, pp. 354–360.

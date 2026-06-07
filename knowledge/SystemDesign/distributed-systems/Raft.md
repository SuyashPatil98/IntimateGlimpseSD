---
title: Raft
area: distributed-systems
status: mature
difficulty: advanced
prerequisites: ["[[Consensus]]", "[[Quorums]]"]
related: ["[[Consensus]]", "[[Paxos]]", "[[Leader Election]]", "[[Linearizability]]"]
sources:
  - Ongaro & Ousterhout, 2014 ("In Search of an Understandable Consensus Algorithm")
  - DDIA, Ch. 9
tags: [distributed-systems, consensus, raft]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Raft

## Executive Summary

Raft (Ongaro & Ousterhout, 2014) is a distributed consensus algorithm **designed for understandability**. It achieves the same safety properties as [[Paxos]] but decomposes the problem into three relatively independent subproblems: **leader election**, **log replication**, and **safety**. Used by **etcd, Consul, CockroachDB, TiKV, Kafka (KRaft), MongoDB, and many others** — it has largely displaced Paxos as the consensus protocol of choice for new systems. The genius isn't a theoretical breakthrough; it's an engineering and pedagogical breakthrough.

## Why This Exists

Paxos is correct but notoriously difficult to understand and implement. Ongaro & Ousterhout asked: can we design a consensus algorithm that's *equivalently safe* but *fundamentally easier* to teach, implement, and reason about? Raft is the answer. The paper's title, "In Search of an Understandable Consensus Algorithm," telegraphs the goal: same problem, clearer solution.

## Core Intuition

Three states for every node:
- **Follower** — passive; just accepts log entries from leader.
- **Candidate** — running for leader.
- **Leader** — handles all client requests; replicates log to followers.

There's exactly one leader at a time. The leader appends client requests to its log, replicates them to followers, and commits when a majority has stored them. Followers blindly follow the leader's log — no independent decisions.

If the leader dies, followers detect via timeout and an election begins. The candidate that gets majority votes becomes the new leader.

## Internal Mechanics

**1. Leader Election:**
- Each follower has a randomized election timeout (150-300ms typical).
- If a follower hears no heartbeat from the leader before its timeout, it becomes a candidate.
- Candidate increments its term, votes for itself, requests votes from others.
- A node votes for a candidate if: (a) it hasn't voted in this term, (b) the candidate's log is at least as up-to-date as its own.
- If candidate receives majority votes → becomes leader.
- If split vote → election times out; randomized timeouts mean different nodes wake up at different times, breaking ties.

**2. Log Replication:**
- Leader appends client request to its log.
- Leader sends `AppendEntries` RPC to followers.
- Followers append to their logs and ack.
- When a majority has stored the entry, leader marks it **committed**.
- Leader tells followers about commits via subsequent heartbeats.
- Followers apply committed entries to their state machine.

**3. Safety:**
- **Election restriction:** a node only votes for a candidate whose log is at least as up-to-date as its own. Guarantees that any new leader contains all previously committed entries.
- **Commit rule:** leader only commits entries from its current term once a majority has replicated them. Prevents subtle bugs where an old-term entry gets re-committed.

## Architecture Diagrams

```
                    ┌─────────┐
       term=5       │ LEADER  │
                    └────┬────┘
                         │ heartbeat + AppendEntries
              ┌──────────┼──────────┐
              ▼          ▼          ▼
       [Follower]   [Follower]   [Follower]
       log: [a,b,c] log: [a,b,c] log: [a,b]
                                     ↑
                              behind; leader retries
                              with previous index until
                              follower catches up.

       Leader dies →
              ▼
       [Follower] → [Candidate] → wins election → [Leader]
       term=6
```

## Design Tradeoffs

**Benefits:**
- **Understandable** — clean decomposition; well-documented; reference implementation available.
- **Same safety as Paxos.**
- **Strong leadership simplifies reasoning** — only the leader makes decisions.
- **Wide adoption** — battle-tested in many systems.

**Costs:**
- **Leader bottleneck** — all writes go through one node; doesn't scale writes.
- **Leader churn under failures** — election windows cause brief unavailability.
- Slightly more inflexible than Paxos (which allows leaderless variants).

## Real Production Examples

- **etcd** — Raft is etcd's heart; KV store underpinning Kubernetes.
- **Consul** — Raft for cluster state.
- **CockroachDB** — Raft per range (multi-Raft architecture).
- **TiKV / TiDB** — Raft per region.
- **Kafka (KRaft)** — replaced ZooKeeper with Raft-based controller.
- **MongoDB** — replica set elections use a Raft-derived protocol.
- **Vault, Nomad, RethinkDB** — Raft for coordination.

## Interview Perspective

**Common questions:**
- "How does Raft work?" → Leader-based consensus. Leader appends to log, replicates to followers, commits when majority acks. Election triggered by heartbeat timeout.
- "Raft vs Paxos?" → Same safety. Raft is designed for understandability with explicit leader and clear election rules. Paxos has more flexibility but less clarity.
- "What's a Raft term?" → Monotonic counter incremented at each election. Used to detect stale leaders and break ties.

**Senior-level:**
- The genius of Raft is the *election restriction* — a candidate only wins if its log is at-least-as-up-to-date as voters'. This guarantees the new leader has all committed entries without complex bookkeeping.
- Multi-Raft (CockroachDB, TiKV) runs many independent Raft groups, each on a partition of data. Scales writes horizontally despite Raft's single-leader limit.
- Raft's commit rule (only commit current-term entries) is subtle but essential for safety — without it, an old leader's pre-commit entries could be re-committed incorrectly.

**Common mistakes:**
- Implementing without randomized election timeouts → election storms.
- Forgetting the "commit current term only" rule → safety violation.
- Underestimating the impact of leader churn on performance.

## Related Concepts

- [[Consensus]] — the problem Raft solves.
- [[Paxos]] — the original alternative.
- [[Leader Election]] — Raft's first sub-problem.
- [[Quorums]] — Raft uses majority quorums.
- [[Linearizability]] — Raft-replicated state machines provide this.

## Misconceptions

- **"Raft is faster than Paxos."** Same asymptotic performance. Raft's win is comprehensibility, not speed.
- **"Raft eliminates split brain."** Yes within one Raft group. But operational misuse (e.g., running two clusters with same name) can still cause divergence.
- **"Raft scales linearly with nodes."** No — leader is a bottleneck. Multi-Raft scales by partitioning, not by adding replicas.

## Failure Scenarios

- **Leader crashes** — followers detect; new election; brief write window.
- **Network partition** — minority side cannot elect; reads may be stale (unless reading via leader lease).
- **Election storm** — repeated leader churn under bad network. Mitigation: pre-vote phase, larger election timeouts.
- **Slow majority** — one slow replica drags everything. Mitigation: monitoring + auto-eject.

## Practical Engineering Heuristics

- **Use etcd or another Raft library; don't roll your own.**
- **Randomize election timeouts** (150–300ms typical) to break ties.
- **Use leader leases** for fast linearizable reads without round-tripping.
- **Multi-Raft** for write scaling beyond single-leader throughput.
- **Monitor leader stability** — frequent elections signal underlying problems.

## Active Recall Questions

What problem does Raft solve?::Distributed consensus on a sequence of values (replicated log) under crash failures. Same problem as Paxos with a more understandable presentation.

What are Raft's three sub-problems?::Leader election, log replication, safety.

Three node states in Raft?::Follower (passive), candidate (running election), leader (handles requests).

What's a "term" in Raft?::Monotonic counter incremented at each election. Used to detect stale leaders and order events.

What's Raft's election restriction?::A node only votes for a candidate whose log is at least as up-to-date as its own (higher last term, or same term with longer log). Ensures new leader has all committed entries.

When does Raft commit an entry?::When a majority of replicas have stored it AND the entry is from the leader's current term. The current-term restriction prevents subtle safety bugs.

Why randomized election timeouts?::Different nodes wake up at different times, reducing the chance of split votes and election storms.

Name three production systems using Raft.::etcd, Consul, CockroachDB, TiKV, Kafka (KRaft), MongoDB, Vault.

## Feynman Test

Walk through a Raft leader election from start to finish. What prevents two leaders being elected simultaneously?

Explain why Raft's "commit current term only" rule is essential. What goes wrong without it?

## Mastery Checklist

- **Explain** Raft's three sub-problems.
- **Compare** Raft and Paxos.
- **Derive** why the election restriction guarantees safety.
- **Critique** "we'll just implement Raft" suggestions.
- **Design** a coordination service using etcd.

[^Raft-2014]: Ongaro & Ousterhout, "In Search of an Understandable Consensus Algorithm," USENIX ATC 2014.

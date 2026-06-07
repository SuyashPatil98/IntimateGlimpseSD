---
title: Monotonic Reads
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]", "[[Replication Lag]]"]
related: ["[[Read-Your-Writes Consistency]]", "[[Consistency Models]]", "[[Eventual Consistency]]", "[[Replication Lag]]"]
sources:
  - DDIA, Ch. 5, pp. 164–165
  - SDI vol 1, Ch. 6
tags: [distributed-systems, consistency, session-guarantee]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Monotonic Reads

## Executive Summary

Monotonic reads is a **session guarantee** that **successive reads from one client never return older data than previous reads**. Without it, a client reading from multiple replicas can see "time go backward" — they see v3, then re-read and see v2 because the second read hit a more-stale follower. Like [[Read-Your-Writes Consistency]], it's a cheap, per-session guarantee — implemented via sticky-session routing or version tokens — that papers over [[Replication Lag]] for individual users.

## Why This Exists

Async replication means different followers have different states at any moment. If a client load-balances reads across followers, they may see data go backward — a confusing experience. Monotonic reads prevents this single anomaly at near-zero cost. Combined with [[Read-Your-Writes Consistency]], it covers most user-perceived consistency issues without paying for full consistency.

## Core Intuition

You refresh a news feed and see a post. You refresh again — the post is gone. You refresh again — it's back. That's a monotonic-reads violation. The post existed; the second refresh hit a stale follower that hadn't seen it yet.

Monotonic reads says: once you've seen something, you always see it (or something newer) in subsequent reads.

## Internal Mechanics

**Implementation strategies:**

1. **Sticky sessions** — route a given client always to the same replica. Simple; breaks if replica goes down.

2. **Read tokens** — client carries the high-water-mark version (greatest version seen so far). Each read requires the chosen replica to be at-or-beyond that version.

3. **Read-from-leader fallback** — if no follower has caught up to the user's high-water-mark, route to leader.

## Design Tradeoffs

**Benefits:**
- Eliminates the "time travel" anomaly.
- Cheap — local routing or per-session state.
- Composable with RYW for a comprehensive session-level consistency layer.

**Costs:**
- Sticky sessions don't survive replica failure cleanly.
- Token-based approaches require carrying versions in client/session state.
- Doesn't help cross-client reasoning.

## Real Production Examples

- **MongoDB** — `readPreference: primary` (trivially monotonic); `nearest` with `readConcern` and causal sessions for monotonic.
- **DynamoDB** — eventually consistent reads aren't monotonic; strongly consistent reads are.
- **Cassandra** — token-aware drivers can give monotonic by routing to consistent replica.
- **CDNs** — typically *not* monotonic; users can see stale content reappear briefly.

## Interview Perspective

**Common questions:**
- "What's monotonic reads?" → A client never sees data go backward across successive reads.
- "How does it relate to RYW?" → Sibling guarantees. RYW = see your own writes. MR = don't see time travel.
- "How is it implemented?" → Sticky sessions, read tokens, or always-read-from-leader.

**Senior-level:**
- The combination **RYW + MR + read-your-monotonic-reads-across-devices** is what users actually mean by "the app feels consistent." Achieve all three and you've delivered a high-quality user experience without paying for system-wide linearizability.
- MR violations are particularly painful because they look like bugs ("the post existed and now it's gone"). Users lose trust.
- MR is harder cross-device than within-device. Cross-device requires server-side tracking.

**Common mistakes:**
- Assuming the load balancer's stickiness gives MR forever. It breaks during failover.
- Ignoring cross-device MR.
- Confusing MR with monotonic *writes* (related but different — writes-in-order vs reads-not-backward).

## Related Concepts

- [[Read-Your-Writes Consistency]] — sibling session guarantee.
- [[Consistency Models]] — MR is a session guarantee.
- [[Replication Lag]] — what MR papers over.
- [[Causal Consistency]] — a stronger model implying MR.

## Misconceptions

- **"MR = strong consistency."** No — single-client guarantee.
- **"MR = monotonic writes."** Different. Monotonic writes = writes applied in client's issue order. MR = reads don't go backward.
- **"Sticky sessions are sufficient."** Until the replica fails. Use version tokens for robustness.

## Failure Scenarios

- **Replica failover breaks sticky session:** new replica may be behind the user's high-water mark. Mitigation: token-based MR.
- **Cross-device read:** version high-water-mark on phone unknown to laptop. Mitigation: server-side per-user tracking.
- **Long session:** sticky replica falls behind cluster; reads stall waiting for catch-up. Mitigation: timeouts + fallback.

## Practical Engineering Heuristics

- **Combine RYW + MR universally** for user-facing reads. The two together cover most UX issues.
- **Use version tokens** rather than sticky sessions for robustness.
- **Test failover with active sessions** to verify MR survives.

## Active Recall Questions

What is monotonic reads?::A session guarantee that successive reads from one client never return older data than previous reads. Prevents "time going backward."

How does MR relate to RYW?::Sibling session guarantees. RYW: see your own writes. MR: never see data go backward.

What's the simplest implementation of MR?::Sticky sessions — route a client always to the same replica. Works until the replica fails.

What's more robust than sticky sessions for MR?::Version tokens — client carries the high-water-mark version seen; replica must be at-or-beyond before serving.

Why does MR matter for UX?::Without it, content can appear, disappear, and reappear across page refreshes — looks like a bug; destroys user trust.

What's the difference between monotonic reads and monotonic writes?::MR: reads never return older data than prior reads from same client. MW: writes from a client are applied in the order issued.

## Feynman Test

A user sees a comment, refreshes, doesn't see it, refreshes again, sees it. Walk through what happened. How does MR prevent this?

Compare implementing MR via sticky sessions vs version tokens. Which fails first under load?

## Mastery Checklist

- **Explain** MR and how it differs from full consistency.
- **Compare** MR, RYW, and causal consistency.
- **Derive** the right MR implementation for a given system.
- **Critique** systems relying on sticky sessions alone.
- **Design** cross-device MR.

[^DDIA-164]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 164–165.

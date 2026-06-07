---
title: Read-Your-Writes Consistency
area: distributed-systems
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]", "[[Replication Lag]]"]
related: ["[[Monotonic Reads]]", "[[Consistency Models]]", "[[Eventual Consistency]]", "[[Replication Lag]]"]
sources:
  - DDIA, Ch. 5, pp. 162–164
  - SDI vol 1, Ch. 6
tags: [distributed-systems, consistency, session-guarantee]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Read-Your-Writes Consistency

## Executive Summary

Read-your-writes (RYW) — also called **read-after-write** — is a **session guarantee**: a client always sees its own writes. Not a full consistency model; it constrains only the client's view of their own data, not the order other clients see. Cheap to implement (client-side write tokens, leader routing for the user's session), and **eliminates one of the most user-visible classes of replication-lag anomalies** ("I just saved this and it's gone"). Most production systems should offer RYW even when running eventual consistency for everything else.

## Why This Exists

Eventual consistency permits a perverse anomaly: a client writes a value, immediately reads from a stale follower, and sees no change. The user wonders "did my save fail?" RYW eliminates this single behavior at near-zero cost — without paying the full price of strong consistency for everyone else.

## Core Intuition

You post a comment. The page reloads. You see your comment. That's RYW.

Without RYW: you post, page reloads, comment isn't there. You re-post. Now there are two comments. Bad.

RYW is "I see what I just did." Other users may not see it yet — that's fine.

## Internal Mechanics

**Implementation strategies:**

1. **Read-from-leader after write.** For the user's session, route reads to the leader (which has the latest data). Time-bounded — after lag drops below threshold, fall back to follower reads.

2. **Session tokens / version vectors.** Client sends the version timestamp of its last write with each read. Replica must have caught up to that version before serving. If not, route to a fresher replica or wait.

3. **Sticky sessions.** Route the user's reads to the same replica that handled their writes. Crude but effective for many cases.

4. **Cross-device read-your-writes.** Harder — requires server-side tracking of the user's latest write timestamp, not just client cookie.

## Design Tradeoffs

**Benefits:**
- Eliminates "my own write isn't visible" bug class.
- Cheap — usually just routing logic, no global coordination.
- Composable with eventual consistency for everything else.

**Costs:**
- Implementation complexity in session-token-based versions.
- "Read from leader" adds load to the leader.
- Cross-device RYW is meaningfully harder than within-device.
- Doesn't constrain what *other* clients see (not a full consistency model).

## Real Production Examples

- **DynamoDB** — session tokens for read-after-write within a session.
- **MongoDB** — `readConcern: linearizable` or routing to primary gives RYW.
- **Most web apps with leader-based DB** — implicitly RYW by reading from the primary after writes; commonly used pattern.
- **Cassandra** — RYW achievable by routing the user's session to the same replica (token-aware drivers).

## Interview Perspective

**Common questions:**
- "Is RYW a consistency model?" → It's a session guarantee, weaker than a full model. Only constrains what the writing client sees.
- "How do you implement it?" → Read from leader for the user's session, or version tokens, or sticky session routing.
- "When is it sufficient?" → When users only care about their own visibility, not cross-user ordering.

**Senior-level:**
- RYW is often the **cheapest material consistency upgrade you can give your users**. It's typically a 1-2 day implementation that eliminates a huge class of UX bugs.
- Cross-device RYW (write from phone, read from laptop) requires server-side tracking — many systems silently fail this.
- RYW + [[Monotonic Reads]] together cover most user-perceived consistency issues.

**Common mistakes:**
- Confusing RYW with linearizability. RYW is single-client, not system-wide.
- Implementing RYW without thinking about cross-device case.
- Assuming sticky-session RYW survives a replica restart (it doesn't if state is in the replica).

## Related Concepts

- [[Monotonic Reads]] — sibling session guarantee; addresses reads going backward.
- [[Consistency Models]] — RYW is a session guarantee, below the full hierarchy.
- [[Replication Lag]] — what RYW papers over.
- [[Eventual Consistency]] — RYW is the cheapest upgrade from pure eventual.

## Misconceptions

- **"RYW = strong consistency."** No — single-client guarantee only. Other clients still see stale data.
- **"RYW = stickiness."** Stickiness is one implementation. RYW is the guarantee itself.
- **"Always reading from leader gives RYW."** True but expensive at scale. Token-based is more efficient.

## Failure Scenarios

- **Failover loses session state:** new leader doesn't know about the user's prior write. Mitigation: persist version tokens server-side, not in replica memory.
- **Cross-device write/read:** write from phone routed to replica A; read from laptop routed to replica B. B doesn't have A's write. Mitigation: server-side per-user write timestamp.
- **Long session, replica falls behind:** user's session token outpaces its replica. Mitigation: re-route or wait for catch-up.

## Practical Engineering Heuristics

- **Implement RYW universally** for user-edit flows. Cheapest UX win you'll find.
- **Use version tokens, not sticky sessions**, when the system supports it. Tokens survive failover and load balancer changes.
- **Test cross-device RYW** explicitly. Most failures hide here.
- **For read-heavy systems, route writes-then-reads to leader for N seconds**, then fall back to followers.

## Active Recall Questions

What is read-your-writes consistency?::A session guarantee that a client always sees its own writes after they're acknowledged. Doesn't constrain what other clients see.

How is RYW implemented?::Read-from-leader after write; version tokens / version vectors per session; sticky sessions; server-side per-user write timestamps.

Why is RYW so cheap compared to full consistency?::It only constrains one client's view of their own writes — no global coordination needed. Local routing or per-session state suffices.

Is RYW a full consistency model?::No — it's a session guarantee. Weaker than causal or linearizable.

What's the hardest case in RYW?::Cross-device. Write from phone, read from laptop. Requires server-side per-user write tracking, not just client cookie.

Why should most production systems offer RYW?::It eliminates the "my own write isn't showing" anomaly that produces double-submits and user confusion. Cheap to implement; massive UX improvement.

## Feynman Test

Walk through a user posting a comment in an eventually consistent system without RYW. What goes wrong? How does RYW fix it?

Implement RYW in two different ways — token-based and routing-based. Compare their failure modes.

## Mastery Checklist

- **Explain** RYW and how it differs from full consistency.
- **Compare** RYW with monotonic reads and linearizable.
- **Derive** which implementation strategy suits a given system.
- **Critique** systems that don't implement RYW for user-edit flows.
- **Design** RYW for cross-device users.

[^DDIA-162]: Designing Data-Intensive Applications, Kleppmann, Ch. 5, pp. 162–164.

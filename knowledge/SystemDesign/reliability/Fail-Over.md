---
title: Fail-Over
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[Replication]]", "[[Failure Detection]]"]
related: ["[[Replication]]", "[[Leader Election]]", "[[Split Brain]]", "[[Health Checks]]"]
sources:
  - SDI vol 1
  - system-design-primer
  - DDIA Ch.8
tags: [reliability, fail-over, availability]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Fail-Over

## Executive Summary

**Fail-over** is the **automatic substitution of a backup component when the primary fails**. Foundational for high availability: load balancers fail over to healthy backends; DB primaries fail over to replicas; entire regions fail over to other regions. **Two patterns: active-passive** (standby waits idle) and **active-active** (both serve traffic; survivor absorbs all). The operation most likely to go wrong at the worst time — practiced and tested matters more than theory.

## Why This Exists

Components fail: machines crash, networks partition, regions go offline. Without fail-over, every failure causes outage. With fail-over, failures are absorbed and users don't notice. But fail-over itself is a complex operation — wrongly done, it makes outages worse.

## Core Intuition

A backup generator at a hospital. Power fails → generator starts → lights stay on. The hospital must test the generator regularly, or the day it fails the lights go out too. Failover is the same: only the practiced version works.

## Active-Passive vs Active-Active

### Active-Passive

- One primary serves traffic.
- Standby(s) idle but ready.
- On failure, standby takes over.

**Pros:** simple; no consistency issues.
**Cons:** wasted standby capacity; failover delay.

### Active-Active

- Multiple instances all serve traffic simultaneously.
- On failure, survivors absorb the load.

**Pros:** no idle capacity; faster recovery; better utilization.
**Cons:** more complex (consistency, coordination); survivors must have headroom.

## Internal Mechanics

**Steps:**
1. **Detect failure** (heartbeat, health check, monitoring).
2. **Confirm** (avoid false positives via voting, multiple probes).
3. **Promote backup** (in leader-based systems, [[Leader Election]]).
4. **Route traffic** to new primary.
5. **Handle in-flight requests** (retry, return error).
6. **Monitor** post-failover.

**Failover gotchas:**
- [[Split Brain]] if old primary returns.
- Cascading failure if survivor can't absorb load.
- Data loss if async replication.

## Design Tradeoffs

**Benefits:**
- High availability.
- Tolerates failures.

**Costs:**
- Complexity.
- Testing requirement.
- Brief unavailability during failover.
- Failure mode of failover itself.

## Real Production Examples

- **PostgreSQL + Patroni** — automated DB failover.
- **AWS RDS Multi-AZ** — automatic regional failover.
- **Kubernetes** — failover via pod replacement.
- **DNS failover** — TTL-bounded.

## Interview Perspective

**Common questions:**
- "Active-passive vs active-active?" → Passive: standby idle, simpler. Active: both serve, complex.
- "How long is failover?" → Detection + confirmation + promotion + routing. Seconds to minutes.
- "What's split-brain risk?" → Old primary returns; two primaries; data divergence.

**Senior-level:**
- The most common failover failure: failover itself doesn't work because it's not tested.
- Game days / failover drills are essential.
- Cascading failure during failover (survivors can't handle load) is the canonical fail.

**Common mistakes:**
- Untested failover.
- No headroom on survivors → cascading.
- Split-brain unprotected.

## Related Concepts

- [[Replication]] · [[Leader Election]] · [[Split Brain]] · [[Health Checks]] · [[Failure Detection]]

## Misconceptions

- **"Failover = always works."** Famously fails when needed.
- **"Active-active eliminates failover."** Still failover; just less visible.
- **"Faster failover better."** Aggressive failover causes false positives.

## Failure Scenarios

- **Failover doesn't trigger** → manual intervention.
- **Survivors overwhelmed** → cascading failure.
- **Split brain** → divergent state.
- **Failover triggers spuriously** → unnecessary churn.

## Practical Engineering Heuristics

- **Test failover regularly** (game days).
- **Survivors must have 2× capacity** (for active-active).
- **Use quorum-based failover** to avoid split brain.
- **Monitor failover events** as SLI.

## Active Recall Questions

What's fail-over?::Automatic substitution of backup component when primary fails. Foundation of high availability.

Active-passive vs active-active?::Active-passive: standby idle, simpler. Active-active: both serve traffic, more complex but no idle capacity.

What can go wrong during failover?::Untested mechanism; survivors overwhelmed; split brain; data loss; spurious triggers.

Why test failover?::Untested failover is famously the failure mode at the worst time.

What's needed to avoid split brain during failover?::Quorum-based election, fencing tokens.

What's typical failover time?::Seconds to minutes — detection + confirmation + promotion + routing.

## Feynman Test

Walk through a PostgreSQL primary failover via Patroni. What could go wrong?

Why does "active-active eliminates the failover problem" only push it deeper?

## Mastery Checklist

- **Explain** failover and its patterns.
- **Compare** active-passive and active-active.
- **Derive** capacity requirements for active-active.
- **Critique** untested failover designs.
- **Design** failover protocol with proper protection.

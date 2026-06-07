---
title: Availability Math
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[SLO]]", "[[Fail-Over]]", "[[Replication]]"]
sources:
  - SDI vol 1
  - system-design-primer
tags: [reliability, availability, math]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Availability Math

## Executive Summary

**Availability math** quantifies system uptime: **nines table** (99.9% = 8.77 hr/year downtime), **composition rules** (services in series multiply; in parallel multiply complements), **MTBF/MTTR** (mean time between failures / to repair). Foundation of capacity planning, SLO setting, and architecture decisions. Common pitfall: a service composed of many "highly available" sub-services may itself be far less available than its parts.

## Why This Exists

"99.9% available" sounds great until you realize it's 8+ hours of downtime per year. "Our service depends on 5 others, each 99.9%" sounds great until you compute 0.999^5 = 99.5%. Math makes these reality-check explicit.

## Core Intuition

Nines compound — more nines = exponentially more uptime, exponentially more engineering cost. A chain is only as strong as its weakest link. Parallel paths (redundancy) multiply availability of "the system" even when individual components have lower availability.

## The Nines Table

| Availability | Downtime/year | Downtime/month | Downtime/week |
|---|---|---|---|
| 99% (two nines) | 3.65 days | 7.31 hours | 1.68 hours |
| 99.9% (three nines) | 8.77 hours | 43.83 min | 10.08 min |
| 99.95% | 4.38 hours | 21.92 min | 5.04 min |
| 99.99% (four nines) | 52.6 min | 4.38 min | 1.01 min |
| 99.999% (five nines) | 5.26 min | 26.3 sec | 6.05 sec |

Each additional nine costs roughly 10× more engineering effort.

## Composition Rules

### Series (AND)

Service depends on A AND B AND C. Availability multiplies:

$$A_{\text{total}} = A_A \times A_B \times A_C$$

Example: 99.9% × 99.9% × 99.9% = 99.7%. Three services at three-nines yield ~three-nines, not three-nines.

### Parallel (OR)

System works if A OR B works (redundancy). Multiply complements:

$$A_{\text{total}} = 1 - (1 - A_A)(1 - A_B)$$

Example: two 99% servers in parallel → 1 - 0.01×0.01 = 99.99%. Redundancy dramatically increases availability.

## MTBF and MTTR

- **MTBF** (Mean Time Between Failures) — average time between failures.
- **MTTR** (Mean Time To Repair) — average time to recover.
- **Availability** = MTBF / (MTBF + MTTR).

To improve availability: increase MTBF (fewer failures) OR decrease MTTR (faster recovery). Often MTTR is easier to reduce.

## Real Production Examples

- **AWS S3** — claims 99.99% availability.
- **Highly available DBs** — use replication + automatic failover.
- **Multi-AZ deployments** — parallel availability.

## Interview Perspective

**Common questions:**
- "What's 99.9% in hours/year?" → ~8.77 hours.
- "How compute composed availability?" → Series multiplies; parallel multiplies complements.
- "If 5 services each 99.9%, what's overall?" → 99.9%^5 ≈ 99.5%.

**Senior-level:**
- The "chain of services" problem motivates microservices to have *resilient* (cached, retry, degraded) paths, not just available paths.
- Five nines is largely marketing for most apps; few users care.
- MTTR reduction (faster recovery) typically more impactful than MTBF increase (fewer failures).

**Common mistakes:**
- Setting unrealistically high availability targets.
- Ignoring composition cost.
- Treating availability as scalar without distribution.

## Related Concepts

- [[SLO]] · [[Fail-Over]] · [[Replication]] · [[Circuit Breakers]]

## Misconceptions

- **"99.999% is achievable easily."** Massive engineering investment required.
- **"Composed system inherits component availability."** It's typically worse (series) or better (parallel).
- **"Availability = uptime."** Same idea; "availability" more precise.

## Failure Scenarios

- **Composed system fails availability target** despite components meeting theirs.
- **Five-nines marketing** without engineering.
- **Single AZ deployment** caps availability.

## Practical Engineering Heuristics

- **Match availability to user pain.**
- **Add redundancy for parallel availability gains.**
- **Reduce MTTR** as primary lever.
- **Compose carefully** — series degrades; parallel improves.

## Active Recall Questions

What's 99.9% in downtime/year?::~8.77 hours.

How do you compute availability of services in series?::Multiply: A × B × C.

How do you compute availability of redundant parallel paths?::Multiply complements: 1 - (1-A)(1-B).

What's MTBF / MTTR?::Mean Time Between Failures / Mean Time To Repair. Availability = MTBF / (MTBF + MTTR).

Why is reducing MTTR often more effective than increasing MTBF?::Faster recovery is usually engineerable. Fewer failures requires fundamental robustness.

What's the cost progression per "nine"?::Roughly 10× more engineering per additional nine.

## Feynman Test

Service depends on 4 services, each 99.9%. What's its availability ceiling? How would redundancy change it?

Why is "five nines availability" largely marketing for most consumer apps?

## Mastery Checklist

- **Explain** availability math and composition.
- **Compare** series and parallel.
- **Derive** composed availability for given system.
- **Critique** unrealistic availability targets.
- **Design** an architecture meeting given availability requirement.

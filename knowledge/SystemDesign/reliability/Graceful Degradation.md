---
title: Graceful Degradation
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Circuit Breakers]]", "[[Bulkheads]]", "[[Caching]]"]
sources:
  - SRE book
  - Modern Software Engineering
tags: [reliability, resilience, degradation]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Graceful Degradation

## Executive Summary

**Graceful degradation** is the property of a system that **continues to provide reduced functionality when components fail**, rather than failing completely. When the recommendation service is down, show popular items instead. When the search index lags, return cached results. When personalization fails, show generic content. The discipline of designing **acceptable fallback paths** for every component — better partial service than no service.

## Why This Exists

Without graceful degradation, any component failure cascades to a full outage. With it, the system stays available with reduced functionality — users get something useful even when not everything works. Particularly important in microservices, where 10+ dependencies multiply failure probability.

## Core Intuition

A restaurant with no power. Without degradation: closed. With graceful degradation: serve cold sandwiches, take cash only, candlelight. Reduced experience, but still serving customers. Software: serve cached content, skip non-essential features, show static fallbacks.

## Internal Mechanics

**Pattern:**
1. **Identify** non-essential features.
2. **Define fallbacks** for each.
3. **Detect** failure of dependency.
4. **Route** to fallback automatically.

**Fallback strategies:**
- **Cached response** — return slightly stale data.
- **Static fallback** — pre-computed safe response.
- **Reduced feature** — skip personalization, recommendations.
- **Default values** — empty array, null with reason.

**Trigger:**
- Circuit breaker open.
- Timeout exceeded.
- Explicit feature flag.

## Real Production Examples

- **Netflix** — degraded UI when recommendations down.
- **Amazon** — show generic best-sellers when personalization fails.
- **News sites** — cached headlines if live feed slow.
- **Gmail** — basic HTML mode when JS fails.

## Design Tradeoffs

**Benefits:**
- Survives partial failure.
- Better UX than outage.
- Reduces incident severity.

**Costs:**
- Design effort per feature.
- Hard to test all fallback paths.
- Risk of degraded mode going unnoticed.

## Interview Perspective

**Common questions:**
- "What's graceful degradation?" → Reduced functionality when components fail; not full outage.
- "Examples?" → Cached responses, defaults, skipped features.
- "Trigger?" → Circuit breaker open, timeout, explicit flag.

**Senior-level:**
- "Always-available core path" is the design discipline.
- Test fallback paths in production (or you'll find them broken in an incident).
- Distinguish "reduced functionality" from "broken silent" — communicate degradation.

**Common mistakes:**
- No fallbacks → cascading failure.
- Silent fallbacks → users don't know.
- Fallbacks not tested → broken when needed.

## Related Concepts

- [[Circuit Breakers]] · [[Bulkheads]] · [[Caching]]

## Misconceptions

- **"Graceful = silent."** Communicate degradation to users when appropriate.
- **"Fallback = bug."** It's a design choice.

## Failure Scenarios

- **Fallback broken** when needed (not tested).
- **Silent degradation** confuses users.
- **Degraded mode permanent** because no alerts.

## Practical Engineering Heuristics

- **Identify core vs nice-to-have features.**
- **Fallback per non-essential dependency.**
- **Test fallbacks regularly.**
- **Alert when in degraded mode.**
- **Communicate degradation to users when appropriate.**

## Active Recall Questions

What's graceful degradation?::Reduced functionality when components fail, rather than full outage.

Common fallback strategies?::Cached responses, static defaults, skipped features, default values.

Triggers?::Circuit breaker open, timeout exceeded, explicit feature flag.

Why is silent degradation problematic?::Users don't know. Bugs hide. Ops don't realize until major impact.

Why test fallbacks?::Untested fallbacks fail when needed. Test in production via chaos.

What's the design discipline?::Identify "always-available core path" — features that must work even if everything else doesn't.

## Feynman Test

E-commerce: recommendations service down. Walk through graceful degradation.

Why is "silent fallback" sometimes worse than a clear error?

## Mastery Checklist

- **Explain** graceful degradation.
- **Compare** with all-or-nothing.
- **Derive** appropriate fallbacks per feature.
- **Critique** systems without degradation.
- **Design** fallback strategy for given service.

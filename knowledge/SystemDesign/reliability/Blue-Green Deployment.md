---
title: Blue-Green Deployment
area: reliability
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Canary Releases]]", "[[Feature Flags]]"]
sources:
  - Martin Fowler (BlueGreenDeployment article)
  - SRE book
tags: [reliability, deployment, blue-green]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Blue-Green Deployment

## Executive Summary

**Blue-Green Deployment** maintains **two identical production environments — Blue (current) and Green (new) — and switches traffic between them at once**. Deploy new version to Green; test; flip LB; old (Blue) becomes standby for rollback. Provides **near-zero-downtime deploys and instant rollback**. Used by many systems where instant cutover is acceptable. Contrasts with [[Canary Releases]] (gradual percentage shift).

## Why This Exists

Traditional deployments take down the service briefly. Even rolling deploys can introduce subtle inconsistencies. Blue-green eliminates downtime: switch traffic instantly to fully-deployed new version. If it fails, switch back instantly.

## Core Intuition

Two identical theaters. Audience (traffic) is in the Blue theater. Build the new show in the Green theater (deploy + test). When ready: open the doors to Green and close Blue. If something's wrong: send audience back to Blue. Zero waiting.

## Internal Mechanics

**Steps:**
1. Blue is live; serving 100% traffic.
2. Deploy new version to Green (identical infra).
3. Test Green in isolation.
4. Switch LB / DNS to point to Green.
5. Green serves 100% traffic; Blue is standby.
6. Monitor Green; rollback by switching back if needed.
7. Eventually decommission Blue (or keep for next deploy).

**State considerations:**
- Stateless services: trivial.
- Stateful: harder; DB migrations need backward compatibility.

## Design Tradeoffs

**Benefits:**
- Zero-downtime deploys.
- Instant rollback.
- Production testing before cutover.

**Costs:**
- 2× infrastructure during deploy.
- DB schema migration complexity.
- Long-running connections cut at switch.

## Real Production Examples

- **Many enterprise deployments** — blue-green for releases.
- **Heroku** — blue-green-ish via slug deployment.
- **AWS Elastic Beanstalk** — blue-green via env swap.
- **Kubernetes service swap** — blue-green at LB.

## Interview Perspective

**Common questions:**
- "Blue-green vs canary?" → Blue-green: instant cutover. Canary: gradual percentage.
- "Cost?" → 2× infrastructure during deploy window.
- "DB?" → Schema must be backward-compatible for instant rollback.

**Senior-level:**
- Blue-green pairs poorly with stateful migrations.
- "Standby Blue" keeps rollback option open.
- Modern practice combines blue-green + canary.

**Common mistakes:**
- DB schema change incompatible with rollback.
- Long-running connections lost at switch.
- Forgetting Blue keeps consuming resources.

## Related Concepts

- [[Canary Releases]] · [[Feature Flags]]

## Misconceptions

- **"Blue-green = no rollback risk."** Stateful changes still risky.
- **"Blue-green = canary."** Different deploy semantics.

## Failure Scenarios

- **Bad deploy** detected after cutover → switch back; investigate.
- **DB migration incompatible** → can't rollback DB.
- **Long-running connections dropped.**

## Practical Engineering Heuristics

- **Backward-compatible schema changes.**
- **Keep Blue running for rollback window.**
- **Drain connections before cutover.**
- **Use for stateless services primarily.**

## Active Recall Questions

What's Blue-Green Deployment?::Two identical environments (Blue current, Green new). Switch traffic at once. Instant rollback by switching back.

Blue-Green vs Canary?::Blue-Green: instant cutover. Canary: gradual percentage shift.

Main cost?::2× infrastructure during deploy window.

What's the DB challenge?::Schema changes must be backward-compatible — for instant rollback to work.

When is Blue-Green ideal?::Stateless services; rollback must be instant; downtime unacceptable.

What's a "drain"?::Gracefully complete existing connections before cutover.

## Feynman Test

A web service uses Blue-Green. Walk through a deploy. How is rollback instant?

Why does DB schema design limit Blue-Green's rollback capability?

## Mastery Checklist

- **Explain** Blue-Green and instant cutover.
- **Compare** with canary.
- **Derive** when Blue-Green fits.
- **Critique** schema changes preventing rollback.
- **Design** Blue-Green pipeline with proper draining.

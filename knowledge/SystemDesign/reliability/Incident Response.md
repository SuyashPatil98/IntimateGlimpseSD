---
title: Incident Response
area: reliability
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Postmortems]]", "[[SLO]]", "[[Observability]]"]
sources:
  - SWE@Google + SRE book
  - PagerDuty docs
tags: [reliability, incidents, on-call]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Incident Response

## Executive Summary

**Incident Response** is the **structured process of detecting, communicating, mitigating, and resolving production incidents**. Modern practice (popularized by SRE): clear roles (**Incident Commander, Operations Lead, Communications Lead**), shared communication channel, predefined severity levels, runbooks. Goal: **minimize MTTR (Mean Time To Resolution)** and capture learning for [[Postmortems]]. Poor response amplifies impact; structured response contains it.

## Why This Exists

Without structure, incidents become chaos: too many people in the channel, unclear who's deciding, communication confusion. Structure provides clarity under stress: one decider, clear roles, established playbooks.

## Core Intuition

A fire department's response. Sirens, roles (chief, captain, firefighters), clear chain of command, drills, post-incident review. Replicate this discipline in software incidents — fewer surprises, faster resolution.

## Internal Mechanics

**Phases:**

1. **Detection** — alert from monitoring, user report.
2. **Triage** — severity assessment; engage on-call.
3. **Response** — assemble team; mitigate (fix or workaround).
4. **Resolution** — full fix; verify.
5. **Postmortem** — capture learning.

**Roles (SRE):**
- **Incident Commander (IC)** — decides; coordinates; not hands-on.
- **Operations Lead** — hands-on technical work.
- **Communications Lead** — internal/external updates.

**Severity levels:**
- SEV1: critical (major outage).
- SEV2: significant.
- SEV3: minor.
- Definitions vary; common to have 3-5 levels.

**Tools:** PagerDuty, Opsgenie, Slack, status pages.

## Real Production Examples

- **Google SRE** — formalized roles and protocols.
- **PagerDuty** — alerting + on-call rotation.
- **Statuspage** — public communication.

## Design Tradeoffs

**Benefits:**
- Faster resolution.
- Less confusion.
- Captured learning.

**Costs:**
- Process overhead.
- Training required.
- Drills cost time.

## Interview Perspective

**Common questions:**
- "Incident response process?" → Detection, triage, response, resolution, postmortem.
- "Roles?" → Incident Commander, Ops Lead, Comms Lead.
- "MTTR?" → Mean Time To Resolution. Key metric.

**Senior-level:**
- The IC must not be hands-on technical. Role separation is critical.
- "First, do no harm" — many incidents are made worse by hasty response.
- Drills + chaos engineering train the process.

**Common mistakes:**
- No IC → multiple decisions, confusion.
- Too many in channel → noise.
- No comms → others can't help.
- Skipping postmortem → repeat incidents.

## Related Concepts

- [[Postmortems]] · [[SLO]] · [[Observability]] · [[Chaos Engineering]]

## Misconceptions

- **"Just fix it."** Communication is half the work.
- **"IC = senior engineer."** Role; not seniority.
- **"Incidents = failures."** Necessary part of operations.

## Failure Scenarios

- **No IC** → chaos.
- **Hasty fix** makes worse.
- **No comms** → leadership / users in dark.

## Practical Engineering Heuristics

- **Clear severity definitions.**
- **Rotating on-call with handoffs.**
- **Single command channel.**
- **IC + Ops Lead + Comms Lead.**
- **Always postmortem.**

## Active Recall Questions

What are the phases of incident response?::Detection, triage, response, resolution, postmortem.

What are the three SRE incident roles?::Incident Commander (decides), Operations Lead (hands-on), Communications Lead (updates).

Why must IC not be hands-on technical?::IC's job is decision and coordination. Mixing with hands-on reduces both.

What's MTTR?::Mean Time To Resolution. Primary incident-response metric.

Common severity levels?::SEV1 (critical), SEV2 (significant), SEV3 (minor). Definitions vary by org.

What's the most common process failure?::No clear IC; too many in channel; hasty fixes.

## Feynman Test

A major outage happens. Walk through incident response phases. Who does what?

Why does "everyone tries to help" make incidents worse?

## Mastery Checklist

- **Explain** incident response phases.
- **Compare** roles and responsibilities.
- **Derive** appropriate severity definitions.
- **Critique** unstructured response.
- **Design** incident response protocol for a team.

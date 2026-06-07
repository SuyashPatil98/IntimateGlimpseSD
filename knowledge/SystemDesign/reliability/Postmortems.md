---
title: Postmortems
area: reliability
status: mature
difficulty: intermediate
prerequisites: ["[[Incident Response]]"]
related: ["[[Incident Response]]", "[[SLO]]", "[[Toil]]"]
sources:
  - SWE@Google + SRE book
tags: [reliability, postmortems, learning]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Postmortems

## Executive Summary

A **postmortem** is the **structured analysis of an incident after the fact** — what happened, why, what was the impact, what's the action plan. Modern practice (Google SRE): **blameless** focus — assume engineers acted with the information they had; root cause is in systems, not people. Captures organizational learning so the same incident doesn't recur. Lightweight enough to actually do; rigorous enough to find real causes.

## Why This Exists

Incidents are expensive — outages cost money, users, sleep. Their value comes from what's learned. Without postmortems, lessons evaporate; the same incident recurs. With them, systems and processes improve. The discipline of writing extracts the learning.

## Core Intuition

A scientific experiment that went wrong. You don't blame the scientist; you analyze the protocol, equipment, hypothesis. What's broken in the system? How do we prevent? Same for software incidents.

## Internal Mechanics

**Standard structure:**
1. **Summary** — what happened.
2. **Impact** — users, revenue, duration.
3. **Timeline** — chronological events.
4. **Root cause analysis** — why (5 Whys, fishbone).
5. **What went well** — successes amid failure.
6. **What went poorly** — gaps.
7. **Action items** — assigned owners, deadlines.

**Blameless culture:**
- Assume good intent.
- Focus on systems, not individuals.
- Engineers can be honest about mistakes.
- Producing safer systems > assigning blame.

**Cadence:**
- Within 1-2 weeks of incident.
- Reviewed in postmortem meeting.
- Action items tracked to completion.

## Design Tradeoffs

**Benefits:**
- Organizational learning.
- Prevents recurrence.
- Surfaces systemic issues.
- Builds psychological safety.

**Costs:**
- Time to write.
- Discipline to track action items.
- Cultural shift required.

## Real Production Examples

- **Google SRE** — extensive postmortem culture.
- **Etsy** — published influential blameless postmortem doctrine.
- **Many engineering blogs** — public postmortems (GitHub, GitLab, Cloudflare).

## Interview Perspective

**Common questions:**
- "What's a postmortem?" → Structured analysis after incident: what happened, why, action items.
- "Blameless?" → Focus on systems, not blame.
- "Action items?" → Assigned owners, deadlines, tracked.

**Senior-level:**
- "Blameless" doesn't mean "consequence-free" — accountability is for systems improvement, not punishment.
- Tracking action items to completion is where many orgs fail.
- Publishing postmortems builds trust and shares industry learning.

**Common mistakes:**
- Blame in disguise.
- Action items never done.
- Postmortems only for SEV1.

## Related Concepts

- [[Incident Response]] · [[SLO]] · [[Toil]] · [[Chaos Engineering]]

## Misconceptions

- **"Blameless = no accountability."** Accountability for system improvement.
- **"Postmortem = blame game."** When done well, opposite.
- **"Only for big incidents."** Smaller ones also worth.

## Failure Scenarios

- **Blame leaks** in language.
- **Action items orphaned.**
- **Postmortem skipped** on smaller incidents.

## Practical Engineering Heuristics

- **Postmortem every meaningful incident.**
- **Blameless language explicitly.**
- **Action items with owners + deadlines.**
- **Track to completion.**
- **Share publicly when possible.**

## Active Recall Questions

What's a postmortem?::Structured analysis after incident: what happened, why, action items, learning.

What's blameless?::Focus on systems, not individual blame. Engineers acted on info available; system failed.

Standard structure?::Summary, impact, timeline, root cause, what went well, what went poorly, action items.

When postmortem?::Within 1-2 weeks of incident.

Why publish postmortems?::Builds trust with users; shares learning with industry; cultural signal.

What's the biggest failure mode?::Action items never completed; postmortem becomes ritual without improvement.

## Feynman Test

A SEV1 outage just resolved. Walk through writing the postmortem.

Why is "blameless" a precondition for honest postmortems?

## Mastery Checklist

- **Explain** postmortems and blameless culture.
- **Compare** with blame-based incident review.
- **Derive** appropriate action items.
- **Critique** orphaned action items.
- **Design** postmortem process for a team.

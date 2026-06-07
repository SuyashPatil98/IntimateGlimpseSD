---
title: 4-Step Framework
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Back-of-Envelope]]", "[[Latency Numbers]]", "[[Powers of 2]]"]
builds_toward: []
sources:
  - SDI vol 1, "Scale From Zero to Millions of Users" + Framework chapter
  - system-design-primer (Donne Martin)
  - Hired in Tech, "System Design Interview Guide"
tags: [system-design-interview, methodology]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# 4-Step Framework

## Executive Summary

The **4-Step Framework** (Xu, SDI vol 1) is the canonical structure for navigating a 45–60 minute system design interview: **(1) Understand the problem**, **(2) Propose high-level design**, **(3) Design deep dive**, **(4) Wrap up**. The framework's purpose is to ensure breadth before depth and to keep the interviewer informed and engaged throughout.

## Why This Exists

System design interviews are open-ended. Without structure, candidates jump to favorite components, miss requirements, or burn time on the wrong layer. The framework imposes a shared rhythm; signal becomes legible to the interviewer.

## The Four Steps

### Step 1 — Understand the problem and establish scope (3–10 min)
- **Clarify functional requirements:** What features? Who are the users? Reads vs writes? Real-time vs batch?
- **Clarify non-functional requirements:** Scale (DAU, QPS), latency, availability target, consistency.
- **Identify constraints:** Mobile-first? Multi-region? Cost-sensitive?
- **Estimate at a high level:** Storage, bandwidth, QPS (see [[Back-of-Envelope]]).
- **Repeat the requirements back** — confirm alignment.

### Step 2 — Propose high-level design and get buy-in (10–15 min)
- Sketch the **end-to-end architecture**: client → load balancer → app servers → caches / databases / queues.
- Walk through **one or two key flows** (e.g., write path, read path).
- Identify primary data models / APIs.
- Get the interviewer to nod before drilling down.

### Step 3 — Design deep dive (15–25 min)
- Interviewer picks (or you propose) **2–4 components** to drill into.
- Common drill-downs: database schema + sharding, cache strategy + invalidation, write/read amplification, queue ordering, hot key handling.
- Discuss **tradeoffs** explicitly: why this choice over that.
- **Volunteer failure modes** ("here's how this breaks under partitioned writes…").

### Step 4 — Wrap up (3–5 min)
- **Summarize** what you designed.
- **Acknowledge limits** ("given more time, I would…").
- **Mention extensions**: observability, security, multi-region, cost.

## Core Heuristics

- **Communicate constantly.** Think aloud. Silence = no signal.
- **Numbers anchor decisions.** "100k QPS read" justifies cache; "10 GB/day write" sizes storage.
- **Tradeoffs > choices.** State why option B was rejected, not just why option A was chosen.
- **Failure modes first.** Senior signal comes from anticipating failures, not just describing happy path.
- **Time-box your sections.** A 60-min interview with 40 min of clarification fails.
- **Use the whiteboard.** Boxes, arrows, labels; rewrite if messy.

## Common Mistakes

- **Jumping to implementation** without clarifying requirements.
- **Quoting buzzwords** ("we'd use Kafka") without explaining why.
- **No estimates.** Hand-waving QPS makes every later choice arbitrary.
- **Monoculture.** Every problem ≠ microservices + Cassandra + Kafka. Match the problem.
- **Over-engineering.** "100 users" doesn't need 5 regions.
- **Ignoring the interviewer's prompts.** They're telling you where to drill.

## Variations

- **donnemartin/system-design-primer** uses the same 4 steps with slightly different naming.
- **Alex Xu** adds emphasis on "back-of-envelope" early in Step 1.
- **Hired in Tech** breaks Step 3 into "deep dive + scaling".

## Related Concepts

- [[Back-of-Envelope]] — used in Step 1 and Step 3 for sizing.
- [[Latency Numbers]] — anchor decisions about caching, sharding, async.
- [[Powers of 2]] — quick mental math for storage and throughput.

## Active Recall Questions

What are the four steps of the SDI framework?::(1) Understand the problem and establish scope; (2) Propose high-level design and get buy-in; (3) Design deep dive; (4) Wrap up.

How long should Step 1 typically take?::3–10 minutes out of a 45–60 minute interview.

What should you do at the end of Step 1?::Repeat the functional + non-functional requirements back to the interviewer to confirm alignment, then provide a back-of-envelope estimate.

Name three common mistakes in system design interviews.::Jumping to implementation without clarifying, quoting buzzwords without justification, hand-waving estimates, monoculture (always microservices/Kafka), over-engineering, ignoring interviewer hints.

Why are explicit tradeoffs important in Step 3?::Senior signal comes from comparing options with reasoning, not just stating choices; "X over Y because Z" beats "I'd use X".

What should the wrap-up step include?::Summary of design, acknowledged limits, and extensions (observability, security, multi-region, cost) you'd add with more time.

## Feynman Test

A candidate who knows every technology but ignores this framework still fails interviews. Why? What signal does the framework give the interviewer that pure technical depth doesn't?

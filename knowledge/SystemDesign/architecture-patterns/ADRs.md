---
title: ADRs
aliases: [Architecture Decision Records]
area: architecture-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Architecture Characteristics]]", "[[Architecture Fitness Functions]]"]
sources:
  - FoSA Ch.19
  - Michael Nygard (original blog post, 2011)
tags: [architecture, documentation, adrs]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Architecture Decision Records (ADRs)

## Executive Summary

An **Architecture Decision Record (ADR)** is a **short markdown document recording one significant architectural decision: context, decision, consequences**. Originated by Michael Nygard (2011). The lightweight practice of recording *why* decisions were made — preventing future "why is it this way?" archeology. **Stored in the repo alongside code; versioned with git**. Every major architecture decision should have an ADR; teams that don't write them re-litigate decisions indefinitely.

## Why This Exists

Six months after an architecture decision, no one remembers why. Documentation rots; meetings forget; the original engineers leave. Without records, teams re-debate settled questions and reverse decisions that had good reasons. ADRs capture the moment of decision: the context, the alternatives, the chosen path, and expected consequences.

## Core Intuition

A scientific lab notebook. Every experiment is recorded: hypothesis, method, result, conclusion. Future scientists understand the line of reasoning. ADRs are software's equivalent: every meaningful decision has a recorded record.

## Internal Mechanics

**Standard ADR structure (Nygard):**
1. **Title** — short noun phrase.
2. **Status** — proposed / accepted / deprecated / superseded.
3. **Context** — what's the situation forcing this decision?
4. **Decision** — what we're going to do.
5. **Consequences** — what becomes easier / harder.

**Lifecycle:**
- New decision → ADR proposed → reviewed → accepted.
- Later, a new ADR may supersede an old one.
- Old ADRs are kept (history matters), marked superseded.

**Storage:** typically `docs/adr/0001-use-postgresql.md`, `0002-microservices-style.md`, ... in the repo.

## Real Production Examples

- **AWS** — internal ADRs widely used.
- **Many open-source projects** — public ADRs.
- **Internal engineering blogs** often surface decisions originally recorded as ADRs.

## Design Tradeoffs

**Benefits:**
- Historical record of decisions.
- Onboarding aid.
- Avoids re-litigating settled questions.
- Forces explicit thinking.
- Versioned with code.

**Costs:**
- Minimal — typically 30 min to write.
- Discipline required to actually write them.
- Sometimes written after the fact (less useful).

## Interview Perspective

**Common questions:**
- "What's an ADR?" → Short markdown recording an architecture decision: context, decision, consequences.
- "Why bother?" → Future-you and future-team need to know *why* something was decided.
- "Format?" → Title, status, context, decision, consequences. Short — half a page typical.

**Senior-level:**
- ADRs are one of the cheapest, highest-ROI engineering practices.
- The discipline of writing forces sharper thinking.
- Old ADRs become onboarding material.

**Common mistakes:**
- Writing too few — most decisions undocumented.
- Writing too long — should be skimmable.
- Not maintaining — superseded ADRs not marked.

## Related Concepts

- [[Architecture Characteristics]] · [[Architecture Fitness Functions]]

## Misconceptions

- **"ADRs are heavy."** Half a page; 30 minutes; no excuses.
- **"ADRs replace conversation."** Complement; record the outcome.
- **"Only big decisions need ADRs."** Any decision future people will wonder about.

## Failure Scenarios

- **No ADRs** → re-litigating decisions.
- **ADRs not maintained** → superseded ones still appear current.
- **ADRs too long** → no one reads.

## Practical Engineering Heuristics

- **Write ADRs for any decision someone might question later.**
- **Half a page maximum.**
- **Store in repo, versioned with code.**
- **Use a tool (`adr-tools`) to manage them.**
- **Make them part of code review.**

## Active Recall Questions

What's an ADR?::Architecture Decision Record. Short markdown recording context, decision, consequences of one significant architectural choice.

Standard ADR structure?::Title, Status (proposed/accepted/deprecated/superseded), Context, Decision, Consequences.

Who coined ADRs?::Michael Nygard, 2011.

When should you write one?::For any architecture decision someone might question later.

Where to store ADRs?::In the repo, versioned with code (e.g., `docs/adr/000N-title.md`).

Why don't teams write them?::Discipline; perceived overhead; thinking "I'll remember." Future-you doesn't.

## Feynman Test

Walk through writing an ADR for "we chose PostgreSQL over MongoDB."

Why is the cost of ADRs trivial compared to the cost of re-litigating decisions?

## Mastery Checklist

- **Explain** ADRs and their structure.
- **Compare** with ad-hoc documentation.
- **Derive** which decisions warrant ADRs.
- **Critique** projects without architectural memory.
- **Design** an ADR process for a team.

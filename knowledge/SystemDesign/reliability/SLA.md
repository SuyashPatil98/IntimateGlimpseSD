---
title: SLA
aliases: [Service Level Agreement]
area: reliability
status: mature
difficulty: beginner
prerequisites: ["[[SLO]]"]
related: ["[[SLO]]", "[[SLI]]", "[[Error Budgets]]"]
sources:
  - SWE@Google, SRE book
tags: [reliability, sre, sla, legal]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# SLA (Service Level Agreement)

## Executive Summary

A **Service Level Agreement (SLA)** is a **legal/contractual commitment to customers about service reliability**, with **penalties for violation**. Distinct from [[SLO|SLOs]] (internal engineering targets) and [[SLI|SLIs]] (metrics). SLAs are external promises with real consequences — financial credits, contract termination, regulatory penalties. Typically **looser than internal SLOs** — engineering keeps margin to avoid breaching the legal commitment.

## Why This Exists

Customers buying services need contractual guarantees. "We try really hard to be reliable" doesn't ground a B2B contract. SLAs formalize: here's our reliability promise; here are the penalties if we miss. SLAs separate "we aim for" (SLO) from "we promise" (SLA).

## Core Intuition

The SLO is the goalkeeper's training target ("save 95% of shots in practice"). The SLA is the contract clause ("we'll save 90% in games; otherwise we owe the team money"). Train to higher standard than you commit to.

## Internal Mechanics

**Structure:**
- Service identifier.
- SLI measured (often availability).
- SLA threshold (e.g., 99.9%).
- Measurement window (monthly, quarterly).
- Penalty: service credit, refund, contract termination.

**SLA < SLO:**
- SLO: 99.95% (internal target).
- SLA: 99.9% (external commitment).
- Gap absorbs incidents without breaching contract.

## Real Production Examples

- **AWS** — published SLAs for most services (e.g., S3 99.9% availability).
- **Azure, GCP** — similar.
- **SaaS vendors** — usually 99.9% with service credits.
- **CDNs** — uptime SLAs.

## Design Tradeoffs

**Benefits:**
- Customer trust.
- Legal clarity.
- Forces engineering investment.

**Costs:**
- Legal liability.
- Conservative SLA to avoid breach → over-engineering.
- Customer disputes over measurement.

## Interview Perspective

**Common questions:**
- "SLO vs SLA?" → SLO: internal target. SLA: external contractual promise with penalties.
- "Why SLA < SLO?" → Engineering keeps margin to avoid breaching contract.
- "Penalties?" → Service credits, refunds, escalation paths.

**Senior-level:**
- SLA negotiations are often risk-transfer exercises.
- "99.999% SLA" is rarely meaningful — measurement and penalty design matter more.
- Many "SLAs" are aspirational without enforceable penalties.

**Common mistakes:**
- SLA = SLO (no margin → constant breaches).
- Unmeasurable SLA terms.
- Customers without SLA — should they have one?

## Related Concepts

- [[SLO]] · [[SLI]] · [[Error Budgets]]

## Misconceptions

- **"SLA = SLO."** SLO is internal; SLA is external/legal.
- **"100% SLA."** Vendor wouldn't sign unless penalty is trivial.
- **"SLA guarantees reliability."** Provides credits when missed, not actual reliability.

## Failure Scenarios

- **SLA breached** — financial credits, customer churn.
- **SLA measurement disputed** — legal cost.
- **SLA without internal SLO** → constant near-breach.

## Practical Engineering Heuristics

- **SLA = SLO - margin.** Significant margin.
- **Define measurement precisely** in SLA.
- **Service credits, not refunds** typically.
- **SLO is your goal; SLA is your contract.**

## Active Recall Questions

What's an SLA?::Service Level Agreement. Contractual commitment to customers about reliability, with penalties for violation.

SLA vs SLO?::SLO: internal engineering target. SLA: external customer-facing legal contract.

Why is SLA typically looser than SLO?::Engineering keeps margin so normal incidents don't breach the contract.

What's a typical SLA penalty?::Service credit (rebate of some portion of fees) when missed.

Why is "100% SLA" rare?::Vendor wouldn't sign meaningful penalties for 100%; networks fail; the penalty must allow some bad behavior.

What's the relationship between SLI, SLO, SLA?::SLI: metric. SLO: internal target on SLI. SLA: external contractual commitment, typically looser than SLO.

## Feynman Test

A SaaS vendor must offer an SLA. What's the SLA? What's the internal SLO that supports it?

Why are "100% SLAs" usually marketing, not engineering reality?

## Mastery Checklist

- **Explain** SLA and its relation to SLO.
- **Compare** SLI/SLO/SLA.
- **Derive** appropriate SLA from SLO.
- **Critique** SLA = SLO designs.
- **Design** an SLA with appropriate margin.

---
title: CI/CD
aliases: ["CI/CD"]
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Trunk-Based Development]]", "[[Canary Releases]]", "[[Feature Flags]]", "[[Testing Pyramid]]", "[[Code Review]]"]
builds_toward: ["[[Trunk-Based Development]]"]
sources:
  - SWE@Google Ch.23
  - Modern Software Engineering (Farley)
  - Humble & Farley, "Continuous Delivery"
tags: [software-engineering, ci-cd, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# CI/CD

## Executive Summary

**CI/CD = Continuous Integration / Continuous Delivery (or Deployment)**. **CI**: developers integrate code frequently (multiple times/day), automated tests verify on every commit. **CD**: every passing commit is automatically deployable (Continuous Delivery) or actually deployed (Continuous Deployment). The pipeline that automates **build → test → deploy**. Foundation of modern engineering velocity. Tools: **Jenkins, GitHub Actions, GitLab CI, CircleCI, Buildkite, ArgoCD**.

## Why This Exists

Pre-CI/CD: developers worked on branches for weeks; merging was painful (merge hell). Deployments were manual, scheduled events with high risk. CI/CD inverts: integrate constantly, deploy constantly, each change is small and verified. Failures are caught immediately when they're cheap to fix.

## Core Intuition

A factory assembly line. Each station does one step quickly; defects caught immediately. Compare to building cars one at a time, finishing each before inspecting: defects pile up, take longer to find, more expensive to fix.

## Internal Mechanics

**CI pipeline:**
1. Developer commits to main (or short-lived branch).
2. CI server runs: build, lint, unit tests, integration tests.
3. Pass → proceed.
4. Fail → block merge / notify.

**CD pipeline:**
5. After CI passes: build deployable artifact.
6. Deploy to staging.
7. Run E2E / smoke tests.
8. Deploy to production (Continuous Deployment) or wait for manual approval (Continuous Delivery).
9. Monitor SLOs; rollback on regression.

**Components:**
- Version control (Git).
- CI server (Jenkins, GHA).
- Test infrastructure.
- Artifact registry (Docker images, JAR repository).
- Deploy automation (ArgoCD, Spinnaker).
- Observability.

## Real Production Examples

- **Google** — extreme CI/CD; thousands of commits/day to monorepo.
- **Netflix** — Spinnaker pipelines.
- **GitHub Actions / GitLab CI** — common open-source-friendly.
- **Most modern shops.**

## Design Tradeoffs

**Benefits:**
- Fast feedback.
- Small batches.
- Lower deploy risk.
- Velocity.

**Costs:**
- Test investment.
- Pipeline infrastructure.
- Discipline required.

## Interview Perspective

**Common questions:**
- "CI vs CD?" → CI: integrate + test frequently. CD: deploy frequently (or always-deployable).
- "Why?" → Smaller batches, faster feedback, lower deploy risk.
- "Tools?" → Jenkins, GitHub Actions, GitLab CI, ArgoCD.

**Senior-level:**
- CI/CD effectiveness ≠ tool — it's the discipline and culture.
- Pipeline speed matters. Slow pipelines erode CI's purpose.
- "Trunk-based development" is the natural pairing.

**Common mistakes:**
- "CI" with long-lived branches → not really CI.
- No automated tests → CI doesn't catch real bugs.
- Slow pipeline (>30 min) → bypassed.

## Related Concepts

- [[Trunk-Based Development]] · [[Canary Releases]] · [[Feature Flags]] · [[Testing Pyramid]]

## Misconceptions

- **"CI = automated builds."** Build is necessary but not sufficient. Tests + integration are core.
- **"CD = production every commit."** Continuous Delivery: ready to deploy. Continuous Deployment: actually deploys.

## Failure Scenarios

- **Long-running branches** defeat CI.
- **Slow pipeline** bypassed.
- **Flaky tests** → trust eroded.

## Practical Engineering Heuristics

- **Pipeline <10 min** for unit; <30 min for full.
- **Block merge on red CI.**
- **Trunk-based dev.**
- **Feature flags for risky changes.**
- **Automate everything from commit to prod.**

## Active Recall Questions

What's CI?::Continuous Integration. Developers integrate code frequently; automated tests run on every commit.

What's CD?::Continuous Delivery (always deployable) or Deployment (automatically deploys). Often used interchangeably.

Why?::Smaller batches → faster feedback → lower risk. Foundation of modern velocity.

Pipeline speed target?::Unit tests <5-10 min. Full pipeline <30 min. Else engineers bypass.

Name three CI/CD tools.::Jenkins, GitHub Actions, GitLab CI, CircleCI, Buildkite, ArgoCD, Spinnaker.

What's the natural pairing with CI?::Trunk-based development. Short-lived branches; everyone integrating constantly.

## Feynman Test

Walk through a code change from commit to production. Where do CI and CD stages happen?

Why does "CI with week-long branches" defeat the purpose?

## Mastery Checklist

- **Explain** CI and CD.
- **Compare** Continuous Delivery and Continuous Deployment.
- **Derive** appropriate pipeline stages.
- **Critique** slow / flaky / branch-based pipelines.
- **Design** CI/CD pipeline for a service.

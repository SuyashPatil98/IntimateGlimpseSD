---
title: Integration Testing
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Testing Pyramid]]", "[[Unit Testing]]"]
related: ["[[Testing Pyramid]]", "[[Unit Testing]]", "[[End-to-End Testing]]", "[[Test Doubles]]"]
sources:
  - SWE@Google Ch.14
tags: [software-engineering, testing, integration]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Integration Testing

## Executive Summary

An **integration test** verifies that **multiple components work together** — typically involving real dependencies (DB, message queue, external service). Slower than unit tests, faster than [[End-to-End Testing|E2E]]. The middle layer of the [[Testing Pyramid]]. Two flavors: **narrow** (test 2-3 components, fake the rest) and **broad** (whole subsystem with real dependencies). Catches integration bugs that unit tests miss: schema mismatches, serialization issues, contract violations.

## Why This Exists

Unit tests pass; production fails. The gap is integration. Unit tests use mocks; production has real systems with quirks (DB transactions, async timing, network failures). Integration tests close the gap without paying full E2E cost.

## Core Intuition

Cars are tested in pieces (unit), then sub-assemblies (engine + transmission), then whole vehicle (E2E). The sub-assembly tests catch what piece tests can't — the gearbox actually connects to the engine. Integration tests are the sub-assemblies.

## Internal Mechanics

**Narrow integration:**
- Test 2-3 components together.
- Fake the rest.
- Faster, more focused.

**Broad integration:**
- Real DB, real message queue.
- Closer to production behavior.
- Slower, more brittle.

**Common scope:**
- Service + DB.
- Service + downstream API (with contract test).
- Cross-service flows.

**Setup:**
- Test containers (Docker) for real DB.
- Test doubles for external services.
- Fixtures or seeded data.

## Real Production Examples

- **Testcontainers** — Docker-based test deps.
- **Spring Boot @SpringBootTest** — Java integration testing.
- **Postman / Newman** — API integration.
- **Most modern codebases** — substantial integration suite.

## Design Tradeoffs

**Benefits:**
- Catches integration bugs.
- More realistic than unit tests.
- Closer to production.

**Costs:**
- Slower (seconds, not ms).
- More brittle.
- Setup complexity.
- Flakier than unit tests.

## Interview Perspective

**Common questions:**
- "Integration vs unit?" → Integration: multiple components, real deps possible. Unit: one component, mocked deps.
- "Why?" → Unit tests miss component-interaction bugs.
- "Narrow vs broad?" → Narrow: 2-3 components. Broad: whole subsystem with real deps.

**Senior-level:**
- Modern: contract testing (Pact) provides much of integration's value at unit-test speed.
- Testcontainers transformed integration testing — real Postgres in CI without ops burden.
- Integration tests are where flakiness hides.

**Common mistakes:**
- Too many integration; pyramid inverts.
- No isolation → flakes.
- Shared test state.

## Related Concepts

- [[Testing Pyramid]] · [[Unit Testing]] · [[End-to-End Testing]] · [[Test Doubles]]

## Misconceptions

- **"Integration = E2E."** Integration is narrower scope.
- **"Integration tests are slow inherently."** With Testcontainers, fast.

## Failure Scenarios

- **Flaky integration tests** ignored.
- **Slow integration tests** bypassed.
- **No integration coverage** at boundaries.

## Practical Engineering Heuristics

- **Use Testcontainers** for real DB.
- **Aim seconds, not minutes.**
- **Isolate tests** (clean state per test).
- **Contract testing** for external APIs.

## Active Recall Questions

What's an integration test?::Verifies multiple components working together, often with real dependencies (DB, queue).

Narrow vs broad integration?::Narrow: 2-3 components, fake rest. Broad: whole subsystem with real deps.

What's Testcontainers?::Docker-based library for running real dependencies (Postgres, Kafka) in tests.

When use integration over unit?::Component interactions — schema, serialization, network behavior.

Why are integration tests flakier?::More moving parts; real network/disk; timing issues.

What's contract testing?::Verify producer/consumer agreement on API shape. Pact is canonical tool.

## Feynman Test

Service calls DB and a message queue. Design integration test using Testcontainers.

When is "narrow integration" enough vs "broad"?

## Mastery Checklist

- **Explain** integration tests.
- **Compare** with unit and E2E.
- **Derive** appropriate scope.
- **Critique** flaky integration suites.
- **Design** integration tests with Testcontainers.

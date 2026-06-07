---
title: Test Doubles
area: software-engineering
status: mature
difficulty: intermediate
prerequisites: ["[[Unit Testing]]"]
related: ["[[Unit Testing]]", "[[Integration Testing]]"]
sources:
  - SWE@Google Ch.13
  - Gerard Meszaros, "xUnit Test Patterns"
  - Martin Fowler "Mocks Aren't Stubs"
tags: [software-engineering, testing, mocks]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Test Doubles (Mock, Stub, Fake, Spy, Dummy)

## Executive Summary

A **test double** is a **substitute for a real dependency in tests**. Gerard Meszaros's vocabulary distinguishes **five types**: **Dummy** (placeholder, never called), **Stub** (returns canned answers), **Fake** (lightweight working implementation), **Mock** (records calls; asserts on them), **Spy** (real object with recording). Mostly used interchangeably in casual conversation, but precise vocabulary matters in technical discussions. Choice affects test brittleness, intent clarity, and speed.

## Why This Exists

Real dependencies make unit tests slow (DB), unreliable (network), or impossible (paid APIs). Test doubles substitute, enabling fast, isolated tests. The choice of double impacts test quality.

## Core Intuition

A film set uses stand-ins: stunt doubles, body doubles, dummies. Each plays a specific role: stunts (action), body (close-up), dummy (background). Test doubles serve similarly: each fits a specific testing need.

## The Five Types

### Dummy
- Placeholder; passed around but never used.
- Example: `null`, default object, never-called callback.

### Stub
- Returns pre-canned responses to calls.
- Tests verify the system using the stub's responses.
- Example: stub returns "user_123" for `getUser()`.

### Fake
- Working implementation, simplified.
- Real behavior; just lightweight.
- Example: in-memory DB, fake HTTP server.

### Mock
- Records calls; you assert on them.
- Verifies interaction (was X called with Y?).
- Most powerful; most brittle.

### Spy
- Wraps real object; records calls.
- Real behavior + verification.
- Less common.

## Design Tradeoffs

**Stubs:**
- Simple; test outputs.
- Coupling to interface only.

**Mocks:**
- Verify interactions.
- Couples test to implementation calls.
- Brittle — refactoring may break.

**Fakes:**
- Most realistic.
- Most setup work.

## Real Production Examples

- **Mockito (Java)** — most popular mocking framework.
- **Jest mocks (JS)** — built-in.
- **unittest.mock (Python).**
- **H2 in-memory DB** — fake DB.
- **WireMock** — fake HTTP service.

## Interview Perspective

**Common questions:**
- "Mock vs stub?" → Stub: returns canned data. Mock: also asserts called correctly.
- "When use fakes?" → Realistic behavior needed; e.g., in-memory DB.
- "Over-mocking?" → Test couples to implementation; refactoring breaks.

**Senior-level:**
- Fowler's "Mocks Aren't Stubs" is canonical.
- Modern lean: prefer real things (Testcontainers) or fakes over mocks.
- Over-mocked tests are noise — they re-encode the implementation.

**Common mistakes:**
- Mock everything → tests verify wiring, not behavior.
- Confusing types.
- Mocks that never assert.

## Related Concepts

- [[Unit Testing]] · [[Integration Testing]]

## Misconceptions

- **"Mock = stub."** Different roles; both common.
- **"More mocks = better isolation."** Often more brittle.
- **"Fakes are deprecated."** Often best choice.

## Failure Scenarios

- **Over-mocked refactor breaks tests** without behavior change.
- **Stubs hide integration bugs** by returning unrealistic data.

## Practical Engineering Heuristics

- **Prefer fakes** when possible.
- **Stubs for input.**
- **Mocks for output interactions** only.
- **Don't mock what you don't own** (use adapters).

## Active Recall Questions

Five types of test doubles?::Dummy, Stub, Fake, Mock, Spy.

Mock vs Stub?::Stub: returns canned responses (verifies state). Mock: also asserts how it was called (verifies interaction).

What's a Fake?::Lightweight working implementation. In-memory DB, fake HTTP server.

When prefer Fake over Mock?::When realistic behavior matters; mocks become brittle to refactoring.

What's the over-mocking anti-pattern?::Test verifies wiring (call sequence) instead of behavior. Refactoring breaks tests without real bug.

Who's the canonical author?::Gerard Meszaros (xUnit Test Patterns); Martin Fowler popularized.

## Feynman Test

A function fetches a user from a service and computes a score. Test it with each double type.

Why does "don't mock what you don't own" lead to better tests?

## Mastery Checklist

- **Explain** five test double types.
- **Compare** their trade-offs.
- **Derive** appropriate double for given scenario.
- **Critique** over-mocked tests.
- **Design** test using fakes vs mocks appropriately.

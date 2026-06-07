---
title: Unit Testing
area: software-engineering
status: mature
difficulty: beginner
prerequisites: ["[[Testing Pyramid]]"]
related: ["[[Testing Pyramid]]", "[[Integration Testing]]", "[[Test Doubles]]"]
sources:
  - SWE@Google Ch.12
  - Modern Software Engineering (Farley)
tags: [software-engineering, testing, unit]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Unit Testing

## Executive Summary

A **unit test** verifies the behavior of **one unit (function, class, module) in isolation** — without DB, network, or filesystem. Characterized by: **fast** (milliseconds), **deterministic** (no flakes), **focused** (one concept per test), **independent** (any order). The foundation of the [[Testing Pyramid]]. Forces good design: testable code is decoupled code. The most-debated aspect: **what counts as "a unit"** — single function vs. class vs. cohesive module. Pragmatic answer: whatever you can test in isolation, fast.

## Why This Exists

Bugs caught at unit-test time cost minutes; bugs caught in production cost hours-to-days. Unit tests provide the fastest feedback loop: write code, run tests, know in milliseconds if it works. Also: forces design improvement — code that's hard to unit-test is hard to maintain.

## Core Intuition

A surgeon practicing one stitch in isolation before doing surgery. You don't practice the whole operation every time. You drill the components. Unit tests drill components of your code.

## Internal Mechanics

**Properties:**
- **Fast** — milliseconds; thousands run in seconds.
- **Isolated** — no I/O, no DB, no network.
- **Deterministic** — same input, same result.
- **Focused** — verifies one thing.
- **Readable** — Arrange-Act-Assert structure.

**Arrange-Act-Assert (AAA):**
```
test("addition") {
  // Arrange: set up
  let a = 2; let b = 3;
  
  // Act: do the thing
  let result = add(a, b);
  
  // Assert: verify
  assert(result == 5);
}
```

**Test doubles** (mocks, stubs, fakes) substitute external dependencies. See [[Test Doubles]].

## Design Tradeoffs

**Benefits:**
- Fast feedback.
- Catches regressions.
- Drives modular design.
- Documents behavior.

**Costs:**
- Test maintenance.
- Initial writing time.
- Over-mocking obscures.

## Real Production Examples

- **Most modern codebases** rely heavily on unit tests.
- **JUnit (Java), pytest (Python), Jest (JS), RSpec (Ruby)** — standard frameworks.

## Interview Perspective

**Common questions:**
- "What's a unit test?" → Verifies one unit in isolation; fast, deterministic.
- "AAA?" → Arrange, Act, Assert — standard structure.
- "Test doubles?" → Mocks/stubs replace dependencies for isolation.

**Senior-level:**
- The debate "test behavior vs implementation" — test behavior; implementation should be refactor-safe.
- Over-mocking creates fragile tests that break on refactoring.
- "Test as you'd want bugs caught" — fast, focused, ruthless.

**Common mistakes:**
- Slow tests (DB calls).
- Flaky tests (sleep, network).
- Test implementation details.
- Over-mocking.

## Related Concepts

- [[Testing Pyramid]] · [[Integration Testing]] · [[Test Doubles]] · [[CI/CD]]

## Misconceptions

- **"Unit = one function."** Often, but can be a small cohesive module.
- **"100% coverage = bug-free."** Coverage ≠ correctness.
- **"All bugs caught by units."** Won't catch integration issues.

## Failure Scenarios

- **Slow units** → bypassed.
- **Flaky tests** → ignored.
- **Test implementation** → break on refactor.

## Practical Engineering Heuristics

- **AAA structure.**
- **Fast: aim < 100ms per test.**
- **Test behavior, not implementation.**
- **Use test doubles for external deps.**
- **One assertion concept per test.**

## Active Recall Questions

What's a unit test?::Test of one unit (function, class, module) in isolation, fast, deterministic, focused.

What's AAA?::Arrange (setup), Act (call code), Assert (verify result). Standard test structure.

Why fast?::Slow tests don't run; engineers bypass. Fast tests get run constantly.

What's the "test behavior, not implementation" rule?::Tests should verify what code does, not how. Else refactoring breaks tests.

Why are flaky tests dangerous?::Trained ignorance — team learns to "just re-run." Real bugs hide.

Name three unit testing frameworks.::JUnit (Java), pytest (Python), Jest (JS), RSpec (Ruby), Mocha (JS), Go's testing.

## Feynman Test

Write a unit test for a function that returns the maximum of three numbers.

Why does "over-mocking" defeat the purpose of unit tests?

## Mastery Checklist

- **Explain** unit testing and AAA.
- **Compare** with integration tests.
- **Derive** appropriate test for given function.
- **Critique** slow / flaky / over-mocked tests.
- **Design** unit test suite for a module.

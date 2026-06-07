---
title: Property-Based Testing
area: software-engineering
status: mature
difficulty: advanced
prerequisites: ["[[Unit Testing]]"]
related: ["[[Unit Testing]]"]
sources:
  - QuickCheck (Hughes & Claessen, 2000)
  - Modern Software Engineering (Farley)
tags: [software-engineering, testing, property-based]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Property-Based Testing

## Executive Summary

**Property-based testing** (originated with **QuickCheck** in Haskell, 2000) tests **properties that should hold for all inputs**, generating many random examples to find counterexamples. Instead of `add(2,3) == 5`, you assert `add(a, b) == add(b, a) for all a, b`. The framework generates random `a` and `b`, finds a failing case if one exists, and **shrinks** it to a minimal example. Catches edge cases human-written tests miss. Tools: **QuickCheck (Haskell), Hypothesis (Python), fast-check (JS), jqwik (Java)**.

## Why This Exists

Example-based tests (most unit tests) check specific cases. Bugs hide in cases you didn't think of: empty input, single element, very large, negative, Unicode. Property-based testing generates inputs to find these — automatically.

## Core Intuition

Example test: "1 + 1 = 2." Property test: "for any a, b: a + b = b + a." The framework tries `a=0, b=0`, `a=999999, b=-1`, `a=NaN, b=Infinity`, looking for any case where the property fails.

## Internal Mechanics

**Define a property:**
```python
@given(integers(), integers())
def test_add_is_commutative(a, b):
    assert add(a, b) == add(b, a)
```

**Framework:**
1. Generates random `a`, `b` from `integers()`.
2. Runs test 100 (or more) times.
3. If a case fails, **shrinks** to find minimal failing example.
4. Reports the minimal counterexample.

**Common properties:**
- **Commutativity** — a op b = b op a.
- **Associativity** — (a op b) op c = a op (b op c).
- **Inverse** — decode(encode(x)) = x.
- **Idempotence** — f(f(x)) = f(x).
- **Invariants** — output respects constraint.

**Shrinking:** when a counterexample is found, framework tries simpler inputs (smaller numbers, shorter strings) to find the smallest failing case.

## Real Production Examples

- **QuickCheck** — Haskell original.
- **Hypothesis** — Python; most popular.
- **fast-check** — JavaScript.
- **jqwik, junit-quickcheck** — Java.
- **PropEr** — Erlang.
- **Used heavily at** Volvo, Galois, financial systems.

## Design Tradeoffs

**Benefits:**
- Finds edge cases humans miss.
- Verifies properties, not examples.
- Shrinking gives minimal counterexamples.
- Strong correctness signal.

**Costs:**
- Slower than unit tests.
- Harder to design properties.
- Flaky if test isn't deterministic.

## Interview Perspective

**Common questions:**
- "Property-based vs example-based?" → Properties hold for *all* inputs; framework generates many.
- "Shrinking?" → When a fail is found, framework simplifies to minimal failing example.
- "When use?" → Pure functions; data structures; encoders/decoders.

**Senior-level:**
- Property-based testing is underused — fits well with functional / pure code.
- Property design is the hard part — must capture true invariants.
- Hypothesis (Python) makes it accessible.

**Common mistakes:**
- Properties too weak (trivially true).
- Test depending on randomness producing same input.

## Related Concepts

- [[Unit Testing]] · [[Testing Pyramid]]

## Misconceptions

- **"Property-based replaces examples."** Complementary.
- **"Slower = worse."** Tradeoff: more thorough.

## Failure Scenarios

- **Trivial property** finds nothing.
- **Non-deterministic test** false fail.
- **Shrinking takes too long.**

## Practical Engineering Heuristics

- **Use for pure functions** (no side effects).
- **Test invariants, not examples.**
- **Combine with examples for clarity.**
- **Hypothesis is the modern entry point** (Python).

## Active Recall Questions

What's property-based testing?::Test invariants/properties holding for all inputs. Framework generates random inputs to find counterexamples.

Who originated it?::QuickCheck in Haskell (Hughes & Claessen, 2000).

What's shrinking?::When framework finds a failing case, it simplifies to the minimal failing input. Easier to debug.

Common properties?::Commutativity, associativity, inverse (encode/decode roundtrip), idempotence, invariants.

Name three tools.::QuickCheck (Haskell), Hypothesis (Python), fast-check (JS), jqwik (Java).

When is property-based testing best?::Pure functions, data structures, encoders/decoders, anything with clear invariants.

## Feynman Test

Write a property test for a JSON encoder/decoder. Identify the property.

Why does shrinking matter for usability of property-based tests?

## Mastery Checklist

- **Explain** property-based testing.
- **Compare** with example-based.
- **Derive** appropriate properties for given function.
- **Critique** trivial properties.
- **Design** property-based tests for a parser or encoder.

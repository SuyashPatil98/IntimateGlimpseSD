---
title: State
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Strategy]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.10
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# State

## Executive Summary

The **State pattern** lets an object **alter its behavior when its internal state changes** — appearing to change class. Replaces big if/switch on state with polymorphism: each state is a class implementing the same interface; the context delegates to the current state. Common in **state machines, workflow engines, UI components**. Similar structure to [[Strategy]] but different intent: State manages internal state transitions; Strategy picks an algorithm.

## Why This Exists

State-dependent behavior often becomes nested switches: "if state == OPEN: do A; elif state == CLOSED: do B; ...". Adding states or operations explodes complexity. State pattern: each state is a class; behavior delegates to state object; transitions are state changes.

## Core Intuition

A traffic light. Red, Yellow, Green — each has different behavior. Without State pattern: traffic light code has if-chains everywhere. With State: a Red class, a Yellow class, etc. Traffic light delegates to current state.

## Internal Mechanics

```java
interface State {
  void handle(Context context);
}

class OpenState implements State {
  public void handle(Context context) {
    // open behavior
    context.setState(new ClosedState());  // transition
  }
}

class ClosedState implements State { ... }

class Context {
  private State state;
  public void setState(State s) { state = s; }
  public void request() { state.handle(this); }
}
```

## State vs Strategy

| Aspect | State | Strategy |
|---|---|---|
| Intent | Object alters behavior when internal state changes | Object selects an algorithm |
| State knows about other states | Often yes (transitions) | No |
| Client | Doesn't pick state | Picks strategy |

Structurally similar; intent differs.

## Real Production Examples

- **State machines** — order lifecycle (Pending, Confirmed, Shipped, Delivered).
- **TCP connection states.**
- **UI components** (loading, error, success).
- **Game characters** (idle, running, jumping, attacking).

## Design Tradeoffs

**Benefits:**
- Replaces if-chains.
- Each state self-contained.
- Easier to add states.

**Costs:**
- More classes.
- Transitions distributed across states.

## Interview Perspective

**Common questions:**
- "What's State?" → Object alters behavior when state changes. Each state a class.
- "State vs Strategy?" → Intent: state manages transitions; strategy picks algorithm.
- "When use?" → State-dependent behavior with multiple states and operations.

**Senior-level:**
- State pattern naturally implements finite state machines.
- For complex workflows, state-machine libraries (XState, Stateless) win over hand-rolled State pattern.

**Common mistakes:**
- State for simple boolean toggle.
- Transitions hidden across many state classes.

## Related Concepts

- [[Strategy]]

## Misconceptions

- **"State = Strategy."** Different intent.
- **"State = boolean."** Pattern is for many states with rich behavior.

## Failure Scenarios

- **Spaghetti transitions** scattered across state classes.
- **Forgot a state** in a transition method.

## Practical Engineering Heuristics

- **Document state diagram.**
- **Use state-machine library** for complex workflows.
- **Pattern shines for 3+ states with rich behavior.**

## Active Recall Questions

What's the State pattern?::Object alters behavior when state changes. Each state is a class implementing common interface; context delegates.

State vs Strategy?::Same structure; different intent. State: object manages own transitions. Strategy: client picks algorithm.

When use?::State-dependent behavior; multiple states; transitions between.

Real example?::Order lifecycle, TCP connection states, UI loading/error/success.

Alternative for complex workflows?::State-machine libraries (XState, Stateless).

What's the failure mode?::Transitions scattered across many state classes; hard to see the FSM.

## Feynman Test

Design State pattern for an order with Pending/Confirmed/Shipped/Delivered states.

Why is "scattered transitions" the canonical State-pattern complaint?

## Mastery Checklist

- **Explain** State pattern.
- **Compare** with Strategy.
- **Derive** when State fits.
- **Critique** scattered transitions.
- **Design** state machine using pattern or library.

---
title: Command
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Strategy]]", "[[Chain of Responsibility]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.6
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Command

## Executive Summary

The **Command pattern** **encapsulates a request as an object**, allowing parameterization, queueing, logging, and undo. The invoker holds Command objects; clients construct them; receivers do the work. Used in **undo/redo, transaction logs, task queues, GUI menu items, event sourcing**. The "function objects" pattern — before lambdas made it lightweight.

## Why This Exists

Sometimes "do this" needs to be:
- Stored (undo, redo, replay).
- Passed around (callbacks).
- Queued (task queue).
- Composed (macro commands).

Plain function calls don't support these. Command objects do.

## Core Intuition

A restaurant order. Waiter writes order (creates Command). Order is queued. Cook executes when ready. Order can be modified, canceled, repeated. Order ≠ function call; it's an object representing the request.

## Internal Mechanics

```java
interface Command {
  void execute();
  void undo();  // optional
}

class TurnLightOn implements Command {
  Light light;
  public void execute() { light.on(); }
  public void undo() { light.off(); }
}

class RemoteControl {
  private Command slot;
  public void setCommand(Command c) { slot = c; }
  public void pressButton() { slot.execute(); }
  public void pressUndo() { slot.undo(); }
}
```

## Design Tradeoffs

**Benefits:**
- Queueable / loggable / undoable requests.
- Parameterization.
- Macro commands (compose).

**Costs:**
- More objects.
- Lightweight alternative: lambdas.

## Real Production Examples

- **Undo/redo systems.**
- **Job queues** — task as Command.
- **Event sourcing** — events are commands.
- **GUI buttons** — each binds to a Command.
- **CLI frameworks** — commands as classes.

## Interview Perspective

**Common questions:**
- "What's Command?" → Encapsulates request as object. Parameterizable, queueable, undoable.
- "Use?" → Undo/redo, task queues, event sourcing.
- "Modern equivalent?" → Higher-order functions / lambdas.

**Senior-level:**
- Event sourcing is essentially Command pattern at architectural scale.
- Task queues (Celery, Sidekiq) embody Command.
- Lambdas reduce need for explicit Command classes in many cases.

**Common mistakes:**
- Command for simple synchronous calls.
- Forgetting undo when needed.

## Related Concepts

- [[Strategy]] · [[Chain of Responsibility]] · [[Event Sourcing]]

## Misconceptions

- **"Command = function."** Function call doesn't support undo/queue/log.

## Failure Scenarios

- **Undo missing state** to actually reverse.
- **Command serialization** for queuing breaks on schema change.

## Practical Engineering Heuristics

- **Use when requests need to be reified.**
- **For simple sync: lambda.**
- **For undo: capture state in Command.**

## Active Recall Questions

What's the Command pattern?::Encapsulates a request as an object. Parameterizable, queueable, loggable, undoable.

Common uses?::Undo/redo, task queues, event sourcing, GUI buttons, CLI frameworks.

Modern lightweight alternative?::Higher-order functions / lambdas. Pass a function instead of Command object.

Relation to event sourcing?::Event sourcing is Command pattern at architectural scale. Events are reified requests.

What's a macro command?::Composite Command — one Command that executes a sequence. Useful for batch operations.

Implementing undo?::Command captures state needed to reverse. Some operations naturally invertible; others require snapshots.

## Feynman Test

Design Command pattern for undo/redo in a text editor.

Why is "event sourcing" essentially Command pattern scaled up?

## Mastery Checklist

- **Explain** Command pattern.
- **Compare** with function calls.
- **Derive** when Command is needed.
- **Critique** Command for trivial calls.
- **Design** undo system using Command.

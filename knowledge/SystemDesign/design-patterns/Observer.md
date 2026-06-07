---
title: Observer
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Pub-Sub]]", "[[Event-Driven Architecture]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.2
tags: [design-patterns, gof, behavioral]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Observer

## Executive Summary

The **Observer pattern** defines a **one-to-many dependency** so that when one object (subject) changes state, **all dependents (observers) are notified automatically**. The OO equivalent of [[Pub-Sub]]. Underlies UI frameworks (DOM event listeners, React state updates), reactive programming (RxJS, ReactiveX), and event-driven systems. Decouples publishers from subscribers; new observers added without changing publisher.

## Why This Exists

Hardcoding "when X changes, also update Y and Z" couples them. Observer: X publishes changes; Y and Z subscribe. Adding W (also wants updates) doesn't modify X. Loose coupling, dynamic subscription.

## Core Intuition

A newspaper. Publishers don't know subscribers individually; subscribers register. New edition → all subscribers get a copy. Subscribers add/remove without publisher caring.

## Internal Mechanics

```java
interface Observer {
  void update(Subject subject);
}

class Subject {
  private List<Observer> observers = new ArrayList<>();
  
  public void attach(Observer o) { observers.add(o); }
  public void detach(Observer o) { observers.remove(o); }
  public void notifyObservers() {
    for (Observer o : observers) o.update(this);
  }
}
```

**Variants:**
- **Push** — subject sends data with notification.
- **Pull** — subject notifies; observers query state.

## Design Tradeoffs

**Benefits:**
- Loose coupling.
- Dynamic subscription.
- Multiple observers.

**Costs:**
- Notification order undefined.
- Memory leaks (forgotten unsubscribes).
- Complex chains hard to debug.

## Real Production Examples

- **JavaScript DOM:** `addEventListener`.
- **React state:** components observe state.
- **RxJS, RxJava** — reactive observables.
- **Java's deprecated `Observer/Observable`** classes.

## Interview Perspective

**Common questions:**
- "What's Observer?" → One-to-many dependency; observers notified on subject changes.
- "Relation to Pub-Sub?" → Observer is OO version; Pub-Sub is broader (cross-process, broker-based).
- "Example?" → DOM event listeners; React state.

**Senior-level:**
- Memory leaks via forgotten unsubscribes — classic Observer bug.
- Reactive programming generalizes Observer (RxJS, RxJava).

**Common mistakes:**
- Subject calling observers synchronously when async needed.
- Observer modifying subject during notification.
- Forgotten unsubscribe.

## Related Concepts

- [[Pub-Sub]] · [[Event-Driven Architecture]]

## Misconceptions

- **"Observer = Pub-Sub."** Observer is intra-process OO; Pub-Sub typically distributed.

## Failure Scenarios

- **Memory leak** from forgotten unsubscribe.
- **Notification cascade** during update.
- **Order-dependent observers.**

## Practical Engineering Heuristics

- **Unsubscribe explicitly.**
- **Avoid modifying subject in observer.**
- **For complex flows, use reactive lib (RxJS).**

## Active Recall Questions

What's the Observer pattern?::One-to-many dependency. Subject notifies observers when it changes.

Observer vs Pub-Sub?::Observer: intra-process OO. Pub-Sub: typically distributed via broker.

Push vs Pull?::Push: subject sends data with notification. Pull: subject notifies; observer queries state.

Common failure mode?::Memory leak from forgotten unsubscribe — observer prevents subject garbage collection.

JavaScript example?::DOM `addEventListener`.

Modern generalization?::Reactive programming (RxJS, RxJava) generalizes Observer with streams.

## Feynman Test

A stock price changes; 10 widgets need updating. Design with Observer.

Why does "forgotten unsubscribe" cause memory leaks?

## Mastery Checklist

- **Explain** Observer.
- **Compare** with Pub-Sub.
- **Derive** when Observer fits.
- **Critique** un-unsubscribed observers.
- **Design** observer-based state propagation.

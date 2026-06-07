---
title: Factory
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Builder]]", "[[Singleton]]", "[[Dependency Injection]]"]
sources:
  - GoF, "Design Patterns" (1994)
  - Head First Design Patterns Ch.4
tags: [design-patterns, gof, creational]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Factory (Factory Method + Abstract Factory)

## Executive Summary

The **Factory pattern** encapsulates object creation, **separating "what to create" from "how to use it"**. Two GoF variants: **Factory Method** (subclass decides which type to create) and **Abstract Factory** (family of related objects, e.g., "Windows UI" vs "Mac UI"). Both decouple client code from concrete classes. Replaced in modern code by **dependency injection** for the same purpose. Still pedagogically important — appears constantly.

## Why This Exists

`new ConcreteClass()` couples client to ConcreteClass. Change to ConcreteClass2 requires changing every `new` call. Factory: client asks the factory; factory decides; one place to change.

## Core Intuition

A car dealership. Customer asks for "an SUV"; dealer (factory) chooses which specific model based on inventory, customer needs, etc. Customer doesn't need to know which subclass.

## Variants

### Factory Method
- Abstract creator class with `createProduct()` method.
- Subclasses override to return specific product.

```
abstract class Logistics {
  abstract Transport createTransport();
}
class RoadLogistics extends Logistics {
  Transport createTransport() { return new Truck(); }
}
```

### Abstract Factory
- Factory that creates families of related objects.
- E.g., `UIFactory` produces `Button`, `Window`, `Checkbox` together.

```
interface UIFactory {
  Button createButton();
  Window createWindow();
}
class WindowsUIFactory implements UIFactory { ... }
class MacUIFactory implements UIFactory { ... }
```

## Design Tradeoffs

**Benefits:**
- Decouples client from concrete classes.
- Extensible — add types without changing clients.

**Costs:**
- More classes.
- Indirection.
- Often replaced by DI.

## Real Production Examples

- **Java's** `Calendar.getInstance()` — factory method.
- **Spring beans** — DI containers are factories.
- **Logging frameworks** — `LoggerFactory.getLogger()`.

## Interview Perspective

**Common questions:**
- "What's a factory pattern?" → Encapsulates object creation; client uses factory instead of `new`.
- "Factory Method vs Abstract Factory?" → Method: subclass picks. Abstract: family of related products.
- "Modern alternative?" → Dependency injection.

**Senior-level:**
- Most "factory" use cases are better served by DI.
- Factories still appear for runtime selection where DI doesn't fit.

**Common mistakes:**
- Factory for one product type (just use `new`).
- Premature factory abstraction.

## Related Concepts

- [[Builder]] · [[Singleton]] · [[Dependency Injection]]

## Misconceptions

- **"Factory = best practice."** Often DI is cleaner.
- **"Factory Method = Abstract Factory."** Different.

## Failure Scenarios

- **Over-abstracted** — one factory per class.
- **Hard to test** without mocking.

## Practical Engineering Heuristics

- **Use DI by default.**
- **Factory for runtime selection.**
- **Avoid trivial factories.**

## Active Recall Questions

What's the Factory pattern?::Encapsulates object creation. Client uses factory instead of `new` to get instance.

Factory Method vs Abstract Factory?::Method: subclass overrides to pick concrete type. Abstract Factory: produces families of related products.

Modern alternative?::Dependency injection. DI containers ARE factories with extras.

When is factory still useful?::Runtime selection of type; library-style code where DI doesn't fit.

Common anti-pattern?::Factory for single product type — just use `new`.

## Feynman Test

Design Factory Method for shipping containers (truck, ship). Then Abstract Factory for cross-platform UI.

Why is dependency injection often a better fit than Factory pattern?

## Mastery Checklist

- **Explain** Factory Method and Abstract Factory.
- **Compare** with DI.
- **Derive** when factory is justified.
- **Critique** over-applied factories.
- **Design** factory for runtime selection.

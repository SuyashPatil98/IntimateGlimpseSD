---
title: Facade
area: design-patterns
status: mature
difficulty: beginner
prerequisites: []
related: ["[[Adapter]]", "[[Decorator]]", "[[API Gateway]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.7
tags: [design-patterns, gof, structural]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Facade

## Executive Summary

The **Facade pattern** provides a **simplified interface to a complex subsystem**. Clients use the facade; complexity is hidden behind it. Like a TV remote — a few buttons hide hundreds of internal operations. Use when a subsystem has many parts and most clients only need a small slice of functionality. Closely related to [[API Gateway]] at the architectural level.

## Why This Exists

Subsystems often have many classes, complex interactions, varied APIs. Clients shouldn't need to know them all. Facade exposes a simple API; subsystem complexity stays internal.

## Core Intuition

A hotel concierge. Behind the desk: relationships with airlines, restaurants, transportation, attractions. Guests just ask the concierge. The concierge is the facade.

## Internal Mechanics

```java
// Complex subsystem
class AudioSystem { ... }
class VideoSystem { ... }
class LightingSystem { ... }
class HeatingSystem { ... }

// Facade
class HomeTheaterFacade {
  // ...
  public void watchMovie(String movie) {
    lightingSystem.dim(10);
    audioSystem.on();
    audioSystem.setVolume(5);
    videoSystem.on();
    videoSystem.play(movie);
  }
  
  public void endMovie() {
    videoSystem.off();
    audioSystem.off();
    lightingSystem.on();
  }
}
```

**Client:** uses `HomeTheaterFacade.watchMovie()` instead of orchestrating all subsystems.

## Facade vs Adapter

| Aspect | Facade | Adapter |
|---|---|---|
| Purpose | Simplify | Translate |
| Existing interface | Subsystem has API; just complex | Wrong shape |
| Result | One simple API | One adapted API |

## Design Tradeoffs

**Benefits:**
- Simplifies client code.
- Decouples client from subsystem.
- Easy to refactor subsystem.

**Costs:**
- Hides subsystem capabilities.
- Becomes God object if not careful.

## Real Production Examples

- **API Gateways** — facade for microservices.
- **Service layers** in MVC.
- **JVM** java.io facade over OS calls.
- **DB libraries** — facades over driver APIs.

## Interview Perspective

**Common questions:**
- "What's Facade?" → Simplified interface to complex subsystem.
- "Vs Adapter?" → Facade: simplify. Adapter: translate.
- "Common use?" → Service layers, API gateways, simplified SDKs.

**Senior-level:**
- API Gateway is Facade at architectural level.
- Don't let Facade become God object — keep focused.

**Common mistakes:**
- Facade that has its own logic (should be thin).
- Facade hiding so much that advanced users can't bypass.

## Related Concepts

- [[Adapter]] · [[Decorator]] · [[API Gateway]]

## Misconceptions

- **"Facade = Adapter."** Different: Facade simplifies; Adapter translates.
- **"Facade hides everything."** Should allow bypass for advanced needs.

## Failure Scenarios

- **God facade** with all responsibilities.
- **Facade too restrictive** — can't access needed features.

## Practical Engineering Heuristics

- **Thin facade.**
- **Allow direct subsystem access** for advanced cases.
- **Multiple facades** for different use cases if appropriate.

## Active Recall Questions

What's the Facade pattern?::Simplified interface to a complex subsystem. Hides complexity behind a simple API.

Facade vs Adapter?::Facade: simplifies (existing subsystem; just complex). Adapter: translates (wrong shape).

Real-world example?::API Gateway, service layer, JDK java.io over OS, DB library over driver.

When does facade become anti-pattern?::When it accumulates business logic and becomes God object.

Should facade allow bypass?::Often yes — advanced users may need direct subsystem access.

## Feynman Test

A home theater has AV system, lighting, heating. Design facade for "watch movie" operation.

Why is API Gateway essentially Facade at architectural level?

## Mastery Checklist

- **Explain** Facade.
- **Compare** with Adapter.
- **Derive** when Facade is justified.
- **Critique** God-facade anti-pattern.
- **Design** facade for a complex subsystem.

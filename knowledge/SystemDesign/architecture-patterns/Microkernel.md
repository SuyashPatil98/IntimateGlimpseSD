---
title: Microkernel
aliases: [Plugin Architecture]
area: architecture-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Layered Architecture]]", "[[Hexagonal Architecture]]"]
sources:
  - FoSA, Ch. 12
tags: [architecture, microkernel, plugin]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Microkernel (Plugin Architecture)

## Executive Summary

**Microkernel Architecture** (also: Plugin Architecture) consists of a **core system** that provides minimal essential functionality, plus **plug-in modules** that add features. Core remains stable; plugins evolve independently. Examples: **IDEs (Eclipse, VS Code, IntelliJ), browsers, text editors (Vim, Emacs), OS kernels (modular Linux)**. Excellent when features can be cleanly separated and added/removed independently.

## Why This Exists

Some products need extensibility — new features added without modifying the core. Without architecture, every feature touches the core. Microkernel separates concerns: the core is small, stable; features are plugins that integrate via a well-defined extension API.

## Core Intuition

A smartphone OS. The core handles screen, input, networking. Apps (plugins) add functionality — calculator, browser, games — via OS APIs. The OS doesn't know about apps; apps know the OS. Apps can be added/removed without modifying the OS.

## Internal Mechanics

**Components:**
- **Core system** — minimal essential capabilities.
- **Plugin contract / extension API** — interface plugins implement.
- **Plugin registry** — core knows which plugins exist.
- **Plugins** — independent modules adding features.

**Communication:**
- Core defines extension points.
- Plugins register at startup or dynamically.
- Plugins may communicate via core or directly.

## Real Production Examples

- **VS Code, IntelliJ, Eclipse** — IDE with plugin ecosystem.
- **Browsers (Chrome, Firefox)** — extension architecture.
- **WordPress** — plugins ecosystem.
- **Adobe Photoshop** — filters as plugins.
- **OS kernels with modules** — drivers as plugins.

## Design Tradeoffs

**Benefits:**
- Core stable; features evolve independently.
- New features without core changes.
- Plugins can be third-party.
- Selective installation.

**Costs:**
- Extension API design is hard.
- Plugin compatibility across versions.
- Performance overhead of indirection.
- Security (untrusted plugins).
- Difficult debugging across plugin boundaries.

## Interview Perspective

**Common questions:**
- "What's microkernel architecture?" → Core + plugins. Core minimal; plugins add features.
- "When use it?" → Extensible products; third-party developers.
- "Examples?" → IDEs, browsers, WordPress, OS kernels.

**Senior-level:**
- The extension API is the most consequential decision — once published, breaking changes are devastating.
- Plugin security: untrusted code in your process is risky.
- Microkernel works best when features are clearly independent.

**Common mistakes:**
- Over-extension API — too granular; brittle.
- Under-extension API — plugins can't do what they need.
- No version compatibility plan.

## Related Concepts

- [[Layered Architecture]] · [[Hexagonal Architecture]]

## Misconceptions

- **"Microkernel = OS kernel."** Different concept; same name borrowed.
- **"Plugins are always loaded dynamically."** Some, but not required.
- **"Microkernel is for big systems."** Used at all sizes.

## Failure Scenarios

- **Plugin breaks core** — instability.
- **API version mismatch** — plugins incompatible.
- **Untrusted plugin** — security compromise.

## Practical Engineering Heuristics

- **Design API conservatively** — easy to expand, hard to shrink.
- **Version the extension API.**
- **Isolate plugin failures** if possible.
- **Document plugin contract clearly.**

## Active Recall Questions

What's Microkernel architecture?::Core system + plugins. Core minimal; plugins add features.

Name three production microkernel systems.::VS Code, IntelliJ, Eclipse, Chrome, Firefox, WordPress, Photoshop.

What's the extension API?::Interface plugins implement to integrate with core. Most consequential design decision.

When use microkernel?::Products needing extensibility; third-party developer ecosystem.

What's the biggest risk?::Breaking the extension API. Once published, changes break all plugins.

Why is plugin security a concern?::Plugins run in your process; can compromise security if untrusted.

## Feynman Test

Walk through how VS Code's plugin architecture lets developers add language support.

Why is the extension API the most consequential design decision in a microkernel system?

## Mastery Checklist

- **Explain** microkernel architecture.
- **Compare** with monolithic alternatives.
- **Derive** when microkernel suits a product.
- **Critique** poorly-designed extension APIs.
- **Design** a microkernel-style system with appropriate API.

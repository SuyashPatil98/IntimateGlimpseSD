---
title: Composite
area: design-patterns
status: mature
difficulty: intermediate
prerequisites: []
related: ["[[Decorator]]", "[[Iterator]]"]
sources:
  - GoF, "Design Patterns"
  - Head First Design Patterns Ch.9
tags: [design-patterns, gof, structural]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Composite

## Executive Summary

The **Composite pattern** lets you **treat individual objects and compositions of objects uniformly** — both implement the same interface. Used for **tree-like structures**: file systems (file vs folder), DOM (element vs container), organization charts (employee vs manager). Clients work with the abstract component; whether they're operating on a leaf or a composite is transparent. The pattern that makes "do this to everything in the tree" trivial.

## Why This Exists

Trees of objects often need uniform operations: print all, count all, sum sizes. Without composite: special-case leaf vs container. With composite: same interface; recursion handles structure transparently.

## Core Intuition

A file system. Files and folders are both "items." Both can be displayed, deleted, copied. A folder contains items (which may be files or folders). The recursion is invisible to the user.

## Internal Mechanics

```java
interface FileSystemItem {
  String name();
  long size();
}

class File implements FileSystemItem {
  String name; long size;
  public long size() { return size; }
}

class Folder implements FileSystemItem {
  String name;
  List<FileSystemItem> children;
  
  public long size() {
    long total = 0;
    for (FileSystemItem item : children) {
      total += item.size();  // recurses naturally
    }
    return total;
  }
}
```

The client calls `item.size()` without knowing if it's a file or folder; the composite handles its children recursively.

## Design Tradeoffs

**Benefits:**
- Uniform treatment of leaves and composites.
- Natural recursion.
- Easy to add new types.

**Costs:**
- Interface may be too generic.
- Hard to restrict what can contain what.

## Real Production Examples

- **File systems.**
- **DOM tree.**
- **GUI component hierarchies.**
- **AST (Abstract Syntax Tree)** in compilers.
- **Org charts.**

## Interview Perspective

**Common questions:**
- "What's Composite?" → Treat leaves and compositions uniformly via shared interface.
- "Use case?" → Tree structures: file system, DOM, GUI.
- "Trade-off?" → Uniform interface vs sometimes too generic.

**Senior-level:**
- AST traversal in compilers is composite + visitor.
- DOM manipulation libraries (jQuery) embody composite.

**Common mistakes:**
- Composite when no tree structure.
- Too-generic interface forcing leaves to no-op container methods.

## Related Concepts

- [[Decorator]] · [[Iterator]]

## Misconceptions

- **"Composite = list."** Tree (recursive); list is flat.

## Failure Scenarios

- **Too-generic interface** — leaves have container methods that don't apply.
- **Cycles** in supposedly-tree structure.

## Practical Engineering Heuristics

- **Use for genuine tree structures.**
- **Same interface for leaves and composites.**
- **Recursion handles structure.**
- **Pair with Iterator** for traversal.

## Active Recall Questions

What's the Composite pattern?::Treats individual objects and compositions uniformly via shared interface. Used for tree structures.

When use it?::Tree-like structures: file system, DOM, GUI components, AST.

What's the killer feature?::Uniform recursion — client doesn't distinguish leaf from composite.

Composite + Visitor?::Common pairing for tree traversal with operations (AST evaluation).

Trade-off?::Uniform interface may be too generic; leaves end up with container methods that no-op.

What's an AST?::Abstract Syntax Tree in compilers. Classic composite pattern: nodes contain other nodes.

## Feynman Test

Design Composite for a file system. Show how "total size" works for folder.

Why is AST a canonical composite pattern example?

## Mastery Checklist

- **Explain** Composite pattern.
- **Compare** with non-tree structures.
- **Derive** when Composite fits.
- **Critique** misuse on flat structures.
- **Design** Composite for given tree.

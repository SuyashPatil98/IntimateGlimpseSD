---
title: Design Google Maps
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Design Proximity Service]]", "[[CDN Caching]]"]
related: ["[[Design Nearby Friends]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.3 ("Google Maps")
  - Uber engineering — routing
  - OpenStreetMap, OSRM, GraphHopper docs
tags: [system-design-interview, advanced-design, geo, routing]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Google Maps

## Executive Summary

A mapping system: render map tiles, search places, compute routes, and serve navigation. Three planes: **tiles** (precomputed images / vector tiles served from CDN), **places** ([[Design Proximity Service|proximity service]] at planet scale), **routing** (graph search over the road network with traffic-aware costs).

## Requirements

**Functional:** Render maps at zoom levels; search places; route point-to-point with ETA; show traffic.

**Non-functional:** 1 B users, sub-300 ms tile/route response, planet-scale storage.

## High-Level Design

```
client ──┬──► Tile CDN ──► Tile origin
         ├──► Place Search ──► Geo index (proximity service)
         └──► Routing API ──► Road graph + traffic
```

## Design Deep Dive

### Tiles

- World subdivided by zoom (z = 0 to ~22); each tile is 256×256 px or vector data.
- Total tiles at z=22: $4^{22}$ ≈ 17 trillion — far too many to precompute; precompute popular, render on-demand for tail.
- Vector tiles dominate modern systems (smaller, client-rendered with theme).
- CDN serves; render workers handle misses.

### Places

- Same problem as [[Design Proximity Service]] at larger scale + autocomplete + ranking.

### Routing

- Road network as a directed weighted graph: nodes = intersections, edges = road segments with cost (time).
- Naive Dijkstra over continental graphs: too slow (~$10^8$ nodes).

**Acceleration techniques:**
- **Contraction Hierarchies (CH)** — precompute "shortcuts" through dense regions; Dijkstra over much smaller search frontier.
- **A\*** — heuristic-guided Dijkstra (geographic distance heuristic).
- **Hierarchical routing** — local roads for endpoints + highways for the middle.
- **Reach-based pruning, ALT, MLD** — research-grade speedups.

**Edge cost:**
- Static: distance + speed limit + turn penalties.
- Dynamic: real-time traffic (multiplicative cost adjustment).
- Time-of-day historical patterns.

### Traffic

- Crowdsourced from devices (GPS pings).
- Aggregated per road segment per minute.
- Fed into routing as cost multiplier.

### Storage

- Vector tile data: PB.
- Road graph: hundreds of GB precomputed CH index.
- Traffic: streaming time-series.

## Failure Modes

- **Hot tile** (city center high zoom) — CDN absorbs.
- **Tile origin overload** — pre-render popular; rate-limit weird zooms.
- **Routing graph staleness** — update cycle (weekly road graph).
- **Bad traffic data** (sensor glitch) — outlier filter.

## Real Production

- **Google Maps** — Spanner, Bigtable, custom CH-style routing.
- **Mapbox / HERE / TomTom** — competitors.
- **OpenStreetMap + OSRM / GraphHopper / Valhalla** — open-source equivalents.
- **Uber, Lyft, DoorDash** — internal routing variants.

## Interview Talking Points

- Three separable planes — tiles, places, routing — each its own subsystem.
- CDN for tiles; vector tiles for modern clients.
- Contraction Hierarchies / A\* for routing acceleration.
- Crowdsourced traffic as cost multiplier.
- Multi-region for global low-latency.

## Related Concepts

- [[Design Proximity Service]] — places subsystem.
- [[CDN Caching]] — tiles.
- [[Apache Spark]] — traffic aggregation pipelines.

## Active Recall Questions

What are the three main subsystems of a Maps service?::Tile rendering / delivery, place search (geo), routing.

Why are vector tiles preferred over raster in modern maps?::Smaller payload, client-side rendering with themes, smooth zoom (no per-zoom raster), styling flexibility.

Why is naive Dijkstra insufficient for planet-scale routing?::A continental road graph has ~10^8 nodes; per-query Dijkstra would scan too much; precomputed acceleration (Contraction Hierarchies, A*, hierarchical) is required.

What are Contraction Hierarchies?::Preprocessing that inserts "shortcut" edges across dense regions; runtime Dijkstra uses these shortcuts to skip enormous subgraphs, giving million-fold speedup.

How is real-time traffic incorporated into routing?::Crowdsourced GPS pings → aggregated per road segment per minute → multiplicative cost adjustment on edges in the routing graph.

How are tiles served at scale?::CDN serves the bulk (popular tiles precomputed); rare tiles rendered on-demand by origin workers; CDN cache eats most traffic.

What additional cost factors enter the edge weight beyond raw distance?::Speed limit, turn penalties, real-time traffic, historical time-of-day patterns, road class.

## Feynman Test

Why can't Google Maps just precompute all driving routes between all city pairs? Estimate the storage if it could.

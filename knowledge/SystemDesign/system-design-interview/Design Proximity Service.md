---
title: Design Proximity Service
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Partitioning]]"]
related: ["[[Design Nearby Friends]]", "[[Design Google Maps]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.1 ("Proximity Service / Yelp")
  - Uber engineering — H3 spatial index
  - Google S2 geometry library
tags: [system-design-interview, advanced-design, geo]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Proximity Service

## Executive Summary

A service that returns businesses (restaurants, shops) within radius R of a user location — Yelp's core. The technical core is **geospatial indexing**: quadtree, geohash, H3 (Uber), or S2 (Google). Read-heavy, write-rare; aggressive caching by hex/geohash cell.

## Requirements

**Functional:** Given (lat, lng), return businesses within radius R, sorted by distance. Filters (category, rating).

**Non-functional:** 200 M monthly users, 100 k QPS reads. Read:write >> 100:1. Latency <200 ms.

## Back-of-Envelope

- Businesses: ~200 M global; metadata small (~1 KB each).
- QPS: 100 k reads, ~100 writes (business additions).

## High-Level Design

```
client ──► Search API ──► Geospatial index (H3 / Geohash)
                                │
                                ▼
                          Business KV (sharded)
                                │
                                ▼
                          Re-rank by distance / rating
```

## Design Deep Dive

### Geospatial indexing options

| Approach | Idea | Pros | Cons |
|---|---|---|---|
| **2D grid** | Fixed grid cells | Simple | Cells cross hemispheres; non-uniform |
| **Geohash** | Z-order base32 string per cell | String prefix = containment | Edge cases at meridians |
| **Quadtree** | Recursive 4-way split | Adaptive density | Tree depth varies |
| **H3 (Uber)** | Hex grid, hierarchical | Uniform neighbors; great for visualization | Hex math is more complex |
| **S2 (Google)** | Sphere-aware curve | Geometrically correct globally | Heavier |

**Pick H3 or S2** for production; geohash for simpler interviews.

### H3 details

- Hierarchical hexagonal grid; resolution 0 (~4250 km) to 15 (~0.5 m).
- Each cell has a 64-bit index.
- Each hex has 6 neighbors at same resolution — uniform.

### Query

1. Translate user (lat, lng) → cell at appropriate resolution (resolution chosen by query radius).
2. Fetch businesses in that cell + ring of neighbors (radius / cell_edge cells).
3. Filter by exact distance ≤ R; rank.

### Storage

- Per business: location, hex cells at multiple resolutions, metadata.
- Indexed by hex id → list of businesses.
- Sharded by hex id prefix.

### Caching

- Heavy LRU on popular hex cells (city centers).
- Edge cache.

### Writes

- Business add/update is rare; recompute cells; invalidate cache.

## Failure Modes

- **Hot cell** (Times Square) — cache, replicate.
- **Edge case at hex boundary** — query neighbors solves it.
- **High-radius query** — limit max R; fan-out across cells must be bounded.
- **Coordinate precision** — server-side rounding.

## Real Production

- **Yelp** — proprietary; H3 / S2-style.
- **Uber** — H3 (open-source).
- **Google Maps Places API** — S2-backed.
- **PostGIS, MongoDB 2dsphere, Elasticsearch geo** — out-of-the-box.

## Interview Talking Points

- Compare geohash / quadtree / H3 / S2 explicitly.
- Cell-based read with neighbor ring.
- Hot-cell caching.
- Multi-resolution storage allowing range-aware queries.
- Sharded by cell.

## Related Concepts

- [[Partitioning]] — shard by hex id.
- [[Design Nearby Friends]] — real-time variant.
- [[Design Google Maps]] — sibling at much larger scale.

## Active Recall Questions

What are the four common geospatial indexing strategies?::Fixed 2D grid, geohash, quadtree, hexagonal grid (H3), and spherical curves (S2).

Why is H3 popular for production geospatial systems?::Hexagonal cells have uniform neighbors (6 each), the index is a single 64-bit integer, hierarchical resolutions allow adaptive granularity, and open-source from Uber.

How do you query "businesses within radius R" using H3?::Map user location to a cell at resolution where cell edge ≤ R; fetch businesses in that cell + ring of neighbor cells (radius / edge_length cells); filter by exact distance.

Why cache at the cell level rather than per query?::Many users in a small region issue similar queries; cell-keyed cache is reused across users.

Why is the read:write ratio important to call out for this problem?::Businesses change rarely (~100 writes/day) vs millions of reads — drives aggressive caching and infrequent index updates.

What's a hot-cell problem and how do you mitigate it?::Times Square / city centers receive disproportionate traffic; mitigate via dedicated cache replicas and edge caching of popular cells.

What does multi-resolution storage enable?::Different query radii can hit different resolutions efficiently; small radius uses high-res cells, large radius uses coarser cells.

## Feynman Test

Sketch on paper how a "find restaurants within 1 km" query works at H3 resolution 9 (cell edge ~175m). How many cells do you fetch?

---
title: Design Nearby Friends
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Design Proximity Service]]", "[[Pub-Sub]]"]
related: ["[[Design Chat System]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.2 ("Nearby Friends")
  - Snap Map, Facebook Nearby Friends engineering posts
tags: [system-design-interview, advanced-design, geo, realtime]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Nearby Friends

## Executive Summary

Show which of your friends are nearby in real-time. Combines a [[Design Proximity Service|proximity index]] with **real-time location updates** and **publish-subscribe** by location cell. The defining challenge is keeping a moving location index hot under continuous updates from millions of devices.

## Requirements

**Functional:** Continuously update user location; show friends within R km in real time.

**Non-functional:**
- 100 M DAU; ~ 10 M concurrently sharing location.
- Location update every 30 s while app open.
- Updates visible to friends within seconds.

## Back-of-Envelope

- Location updates: 10 M × (1/30 s) ≈ 330 k updates/s.
- Hot index reads: similar order.

## High-Level Design

```
device ──► WebSocket Gateway ──► Location Service
                                       │
                                       ▼
                              Geo-Index (Redis Geo / H3)
                                       │
                                       ▼
                              Pub/Sub (by cell)
                                       │
                                       ▼
                            Friend WebSocket Gateways
                                       │
                                       ▼
                                 friend devices
```

## Design Deep Dive

### Location ingest

- WebSocket from device to nearest gateway.
- Updates throttled (e.g., max 1/30 s; skip if delta < 50 m).
- Gateway forwards to Location Service.

### Geo index

- Redis Geospatial commands (geohash-based) OR custom H3 in Redis.
- Per user: store current cell + lat/lng + ts.
- TTL on entries — auto-expire stale.

### Friend resolution

- User's friend list cached.
- When user updates location, fetch their friends + each friend's current location.
- For each friend within R, publish a "near" event.

### Pub/sub topic per cell

- Subscribe each gateway to cells whose users are connected.
- Update in one cell → publish to gateways watching it → push to interested users.

### Privacy

- Strict opt-in.
- Granularity choices (city-level vs precise).
- Rate-limit shows.

## Failure Modes

- **Gateway crash** — clients reconnect; brief gap.
- **Cell hot spot** (downtown) — replicate pub/sub topic.
- **Stale locations** — TTL; show "last seen X min ago".
- **Friend graph hotspot** (popular user with millions of friends) — sample, cap.

## Real Production

- **Snap Map** — real-time friend locations.
- **Find My (Apple)** — different (long-poll vs real-time).
- **Facebook Nearby Friends** — historical (deprecated).
- **Life360** — family location.

## Interview Talking Points

- Throttle updates aggressively.
- Geo-index + pub/sub-by-cell is the architecture.
- WebSocket gateway for bidirectional.
- Privacy/opt-in is mandatory.
- Friend resolution at update time, not at read time.

## Related Concepts

- [[Design Proximity Service]] — static-business sibling.
- [[Design Chat System]] — gateway/pub-sub similarities.
- [[Pub-Sub]] — fanout substrate.

## Active Recall Questions

What's the dominant traffic pattern in Nearby Friends?::Continuous location update writes from millions of devices (~hundreds of thousands per second), each triggering fanout to friends in proximity.

Why use pub/sub by cell?::Subscribers (friend gateways) register for cells they care about; updates in a cell automatically reach interested subscribers; avoids per-friend lookups for every update.

How do you reduce update volume?::Throttle to ~30s interval; skip updates if user moved < threshold (50 m); pause updates when app backgrounded.

What's the privacy approach?::Strict opt-in; user controls who sees their location; granularity choices (precise vs approximate).

How do you handle a stale location?::TTL on geo-index entries; UI shows "last seen X min ago" instead of stale "nearby" claim.

Why cache the friend list?::Lookups happen on every location update; without cache, friend-graph DB load is unsustainable.

What's the difference vs the proximity-of-businesses problem?::Nearby Friends adds real-time updates with publication, ephemeral state with TTL, and friend-graph constraints — making the index hot under continuous writes.

## Feynman Test

A user is walking through downtown with the app open. What load does the system place on Redis per second per user, and how does it scale to a city full of users?

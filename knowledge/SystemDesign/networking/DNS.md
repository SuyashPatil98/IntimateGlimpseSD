---
title: DNS
area: networking
status: mature
difficulty: beginner
prerequisites: []
related: ["[[UDP]]", "[[TCP]]", "[[CDN]]", "[[Load Balancing]]"]
builds_toward: ["[[CDN]]"]
sources:
  - SDI vol 1, Ch. 6, Ch. 9
  - system-design-primer
  - RFC 1034, 1035
tags: [networking, dns, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# DNS

## Executive Summary

DNS (Domain Name System) is the **distributed, hierarchical, cache-heavy** naming system that maps human-readable names (`example.com`) to IP addresses (`93.184.216.34`). The internet's phone book. It's an early-and-still-canonical example of a globally scaled distributed system: hierarchical zones, aggressive caching, [[Eventual Consistency]], UDP-by-default for queries, fallback to TCP for large responses. Beyond simple lookups, DNS is used for **service discovery, load balancing, CDN steering, health checking, and failover** — a critical control plane for production systems.

## Why This Exists

Computers route on IP addresses; humans need names. Without DNS, `example.com` would require a manually-maintained hosts file. With DNS, every domain is dynamically resolvable, caching makes lookups fast, and the hierarchy allows decentralized administration (each zone manages itself).

## Core Intuition

Want to call a friend whose number you don't have? You ask directory services, going up the hierarchy if needed. Each level only knows about its part: state directory knows about state; city directory knows about city. When you find the number, you write it down — for a while, you don't have to ask again (caching). Eventually the number may change; your local note becomes stale.

## Internal Mechanics

**Hierarchy:**
- **Root** (`.`) — 13 root server clusters worldwide, anycast routed.
- **TLD** (`.com`, `.org`, country codes) — managed by registries.
- **Authoritative servers** for individual domains.

**Resolution flow:**
1. Application asks the OS resolver.
2. OS resolver checks local cache.
3. If miss, asks a recursive resolver (often ISP's or 8.8.8.8, 1.1.1.1).
4. Recursive resolver may have it cached; if not, walks the hierarchy:
   - Asks root → gets TLD's address.
   - Asks TLD → gets authoritative server's address.
   - Asks authoritative server → gets the answer.
5. Caches result with TTL.
6. Returns to client.

**Record types:**
- **A** — IPv4 address.
- **AAAA** — IPv6 address.
- **CNAME** — alias to another name.
- **MX** — mail exchange.
- **NS** — name server.
- **TXT** — arbitrary text (used for verification, SPF, DKIM).
- **SRV** — service location (port + host).
- **PTR** — reverse DNS.

**Transport:**
- UDP/53 for queries (fast, stateless).
- TCP/53 for large responses (>512 bytes) or zone transfers.
- DoT (DNS over TLS) and DoH (DNS over HTTPS) for privacy.

**Caching:**
- TTL on every record dictates how long it can be cached.
- Recursive resolvers, OS, and applications all cache.
- Cache invalidation is "wait for TTL to expire."

## Architecture Diagrams

```
Resolution of www.example.com:

  Client → Recursive resolver (e.g., 8.8.8.8)
                │
                │ (cache miss)
                ▼
              Root server: "ask .com TLD"
                │
                ▼
              .com TLD: "ask example.com NS"
                │
                ▼
              example.com authoritative: "www.example.com is 93.184.216.34"
                │
                ▼
  Client ← cached response
```

## Design Tradeoffs

**Benefits:**
- **Hierarchical scaling** — billions of names, no central lookup.
- **Aggressive caching** — most queries served from cache.
- **High availability** — anycast root servers; many caching layers.
- **Used for traffic control** — geo-routing, weighted routing, health-based.

**Costs:**
- **Eventually consistent** — changes propagate over TTL window.
- **TTL trade-off** — short TTL = fast change propagation but more lookups; long TTL = fewer lookups but slow changes.
- **Cache poisoning** — historical vulnerability; mitigated by DNSSEC, but DNSSEC has slow adoption.
- **Privacy** — queries are unencrypted by default; ISPs see your browsing.

## Real Production Examples

- **Cloudflare 1.1.1.1, Google 8.8.8.8** — public recursive resolvers.
- **Route 53 (AWS), Cloud DNS (GCP), Azure DNS** — managed DNS with health checks and routing policies.
- **Service discovery** — Consul DNS, Kubernetes coredns.
- **CDN routing** — DNS returns IP based on user's geographic location.
- **Failover** — DNS health checks remove unhealthy backends from rotation.

## Interview Perspective

**Common questions:**
- "Walk through what happens when you type a URL." → DNS resolution, TCP connect, TLS handshake, HTTP request, response, render.
- "How does DNS achieve high availability?" → Anycast root servers, caching at every layer, many redundant authoritative servers per zone.
- "What's the trade-off in DNS TTL?" → Short: fast changes propagate but more queries. Long: less load but stale records linger.

**Senior-level:**
- DNS is *the* canonical example of acceptable eventual consistency. Hours of staleness is normal; the system works because no one expects real-time accuracy.
- DNS as a load balancer is coarse — geo routing, weighted routing — but it's also free (every client does it). Combined with health checks, sufficient for many use cases.
- DNS-over-HTTPS shifts queries to HTTPS — better privacy but introduces a new trust model (the DoH resolver sees everything).

**Common mistakes:**
- Setting TTLs too long for fast-changing services.
- Relying on DNS for instant failover (TTL + client cache + OS cache + ISP cache means seconds-to-hours).
- Forgetting that DNS caching exists at many layers (browser, OS, ISP).

## Related Concepts

- [[UDP]] — DNS's default transport.
- [[TCP]] — fallback for large responses.
- [[CDN]] — heavily uses DNS for steering.
- [[Load Balancing]] — DNS-based routing is one form.
- [[Eventual Consistency]] — DNS is the prototypical example.

## Misconceptions

- **"DNS is instant."** Eventually consistent. Propagation can take seconds to hours.
- **"DNS is reliable."** Generally yes, but cache poisoning and BGP hijacking have caused real outages.
- **"Lower TTL fixes propagation."** Helps but doesn't eliminate. Clients/ISPs may ignore your TTL.

## Failure Scenarios

- **Cache poisoning** — adversary injects fake records. Mitigation: DNSSEC, source-port randomization.
- **DDoS on authoritative servers** — anycast + over-provisioning.
- **TTL too short** — high query load.
- **TTL too long** — slow change propagation; bad during failover.
- **ISP DNS hijacking** — ISPs intercept queries. Mitigation: DoH/DoT to a trusted resolver.

## Practical Engineering Heuristics

- **Set TTLs to match change frequency.** 300-3600s for normal services; 60s for active failover scenarios.
- **Don't rely on DNS for sub-second failover.** Use load balancers / health-based routing.
- **Use managed DNS with health checks** for high availability.
- **Consider DoH/DoT** for privacy-conscious deployments.
- **Test DNS failure** — what happens if a record disappears?

## Active Recall Questions

What does DNS do?::Maps human-readable names to IP addresses. Distributed, hierarchical, cache-heavy.

Walk through the DNS resolution flow.::Client → recursive resolver → root → TLD → authoritative server → answer cached and returned.

Why does DNS use UDP?::Queries are small and stateless; latency-critical; lost queries are cheap to retry. TCP used for large responses or zone transfers.

What are DNS TTLs and what's the trade-off?::Time-to-live on cached records. Short TTL = fast change propagation but more queries. Long TTL = less load but slower change visibility.

What's DNSSEC?::DNS Security Extensions — cryptographic signing of records to prevent cache poisoning. Slow adoption due to complexity.

What's the difference between DoT and DoH?::DoT (DNS over TLS): port 853, separate channel. DoH (DNS over HTTPS): port 443, hidden in HTTPS traffic. Both encrypt DNS queries.

Name three uses of DNS beyond name resolution.::Service discovery, geographic routing, load balancing, health-based failover, email routing (MX), domain ownership verification (TXT).

## Feynman Test

Walk through DNS resolution from cold cache to answer. How many round-trips? Where can it fail?

Explain why DNS is the canonical example of "good enough" eventual consistency.

## Mastery Checklist

- **Explain** DNS hierarchy and resolution flow.
- **Compare** DNS record types and their uses.
- **Derive** appropriate TTL for a given service.
- **Critique** "we'll just lower TTL for instant failover" claims.
- **Design** a multi-region service using DNS-based traffic routing.

---
title: Anycast
area: networking
status: mature
difficulty: intermediate
prerequisites: ["[[DNS]]"]
related: ["[[DNS]]", "[[CDN Caching]]", "[[Load Balancing]]"]
sources:
  - SDI vol 1
  - Cloudflare blog
tags: [networking, anycast, bgp]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Anycast

## Executive Summary

**Anycast** is a network routing technique where **a single IP address is advertised from multiple geographically distributed locations**, and the **network's routing protocol (BGP) directs each request to the nearest** location (by routing-table distance, typically network proximity). Used by **DNS root servers, CDN edges, DDoS scrubbing, Cloudflare's global network**. Provides global latency reduction and built-in geographic load balancing — without DNS coordination.

## Why This Exists

DNS-based geo-routing has limits: clients cache DNS results, geo accuracy is approximate, propagation is slow. Anycast moves the decision from DNS to BGP — every router automatically picks the closest instance. Result: lower latency, faster failover, simpler client experience.

## Core Intuition

Imagine 200 outlets of the same shop, all sharing one phone number. When you dial, the phone system routes you to the nearest outlet automatically — no menu, no app. That's anycast: one address, many locations, routing picks nearest.

## Internal Mechanics

**BGP advertisement:**
- Multiple data centers announce the same IP prefix to BGP.
- Each ISP sees multiple paths to that prefix.
- BGP picks the "best" path per ISP — usually shortest AS-path / closest.

**Client experience:**
- DNS returns one IP.
- Packets to that IP go to the BGP-determined nearest instance.

**Failover:**
- If a location goes down, BGP withdraws its advertisement.
- Traffic automatically reroutes to other locations.
- Seconds to minutes for BGP convergence.

## Comparison: Anycast vs DNS Geo

| Property | Anycast | DNS geo-routing |
|---|---|---|
| Mechanism | BGP routing | DNS resolution |
| Granularity | Network topology | Estimated client location |
| Failover speed | BGP convergence (seconds-minutes) | TTL-bound |
| Client cache | None | DNS TTL caching |
| Simplicity | Network-level | Application-level |

## Real Production Examples

- **DNS root servers** — 13 logical, hundreds of physical, anycast.
- **Cloudflare** — 300+ edges, all serving one IP per service.
- **Google DNS (8.8.8.8)** — anycast globally.
- **AWS CloudFront** — anycast for edge entry.
- **DDoS scrubbing** — anycast spreads attack traffic.

## Design Tradeoffs

**Benefits:**
- Global latency via topology proximity.
- Automatic failover via BGP.
- DDoS resilience (traffic distributed).
- No DNS staleness.

**Costs:**
- **Requires BGP capability** — owning IP space + ASN. Not casual.
- **TCP / stateful connections** — if a route flap moves traffic mid-connection, connection breaks. Mitigation: short routes, consistent backends.
- **Routing fairness** — congested ISPs may make poor choices.

## Interview Perspective

**Common questions:**
- "What's anycast?" → Same IP advertised from many places; routing picks nearest.
- "Anycast vs DNS geo?" → Anycast: network-level, fast failover. DNS: app-level, TTL-cached.
- "Why use anycast?" → Lowest-latency global services; DDoS resilience.

**Senior-level:**
- Anycast for TCP is subtle — route changes mid-connection break TCP state. Most uses are UDP (DNS) or short-lived HTTP (CDN).
- DDoS protection via anycast spreads attacker traffic across many locations — no single target.
- Requires owning a network presence (ASN, IPs); not for small operators.

**Common mistakes:**
- Anycast for long-lived TCP connections — route flaps disconnect.
- Assuming "nearest" geographically — it's nearest by BGP topology.
- Not planning for asymmetric routing.

## Related Concepts

- [[DNS]] · [[CDN Caching]] · [[Load Balancing]]

## Misconceptions

- **"Anycast = nearest geographically."** It's nearest by BGP topology, which often correlates but not always.
- **"Anycast doesn't work for TCP."** Works fine for short connections; problematic for long-lived.
- **"DNS geo = anycast."** Different mechanisms; complementary.

## Failure Scenarios

- **Route flap** disconnects TCP mid-flow.
- **BGP misconfiguration** hijacks traffic.
- **Asymmetric routing** complicates debugging.

## Practical Engineering Heuristics

- **Use anycast for stateless or short connections.**
- **Combine with TLS session resumption** to mitigate flaps.
- **Monitor per-region traffic patterns.**
- **For DDoS protection, anycast is essential at scale.**

## Active Recall Questions

What's anycast?::Single IP advertised from multiple locations; BGP routes each request to nearest instance.

How does anycast achieve failover?::Failed location withdraws BGP advertisement; traffic reroutes automatically to other locations.

Anycast vs DNS geo-routing?::Anycast: network-level (BGP). DNS: app-level (DNS resolver). Anycast fails over faster; DNS more granular control.

Why is anycast tricky for TCP?::Route changes mid-connection break TCP state. Best for stateless or short-lived connections.

Name three uses of anycast.::DNS root servers, Cloudflare/CDN edges, DDoS protection, Google DNS, AWS CloudFront.

Why does anycast help with DDoS?::Attack traffic distributed across many locations; no single target overwhelmed.

## Feynman Test

Walk through a DNS query to a root server. How does anycast route it? What if the closest one fails?

Why is anycast for long-lived HTTPS connections riskier than for DNS?

## Mastery Checklist

- **Explain** anycast and BGP-based routing.
- **Compare** with DNS geo-routing.
- **Derive** when anycast is appropriate.
- **Critique** anycast for stateful long connections.
- **Design** a global service using anycast.

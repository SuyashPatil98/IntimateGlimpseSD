---
title: Load Balancing
area: networking
status: mature
difficulty: beginner
prerequisites: ["[[TCP]]", "[[HTTP/1.1]]"]
related: ["[[L4 vs L7 Load Balancing]]", "[[Load Balancing Algorithms]]", "[[Reverse Proxy]]", "[[Service Discovery]]"]
builds_toward: ["[[L4 vs L7 Load Balancing]]", "[[Load Balancing Algorithms]]"]
sources:
  - SDI vol 1, Ch. 4
  - system-design-primer
tags: [networking, load-balancing, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Load Balancing

## Executive Summary

A **load balancer (LB)** distributes incoming network requests across multiple backend servers, providing **horizontal scaling, failure tolerance, and rolling deployment**. The fundamental scaling primitive — almost every multi-server system has at least one LB. Categories by network layer: **L4** (TCP/UDP, faster, opaque) and **L7** (HTTP, smarter, content-aware). Categories by location: **hardware** (F5, Citrix), **software** (HAProxy, Nginx, Envoy), **cloud-managed** (ALB, NLB, GCP LB, Cloudflare). Foundation of any production service serving more than one machine of traffic.

## Why This Exists

A single server has bounded capacity. Past that, you need multiple servers. But clients can't pick servers — they need one address. The LB sits in front: clients connect to LB; LB picks a backend; LB forwards. Adding backends scales capacity. Failing backends are routed around. Deploying new versions is a rolling shift in LB targets.

## Core Intuition

A receptionist at a busy clinic. Patients arrive at one front desk; the receptionist routes each to an available doctor. Without the receptionist, patients would queue at one doctor. With it, capacity scales with doctor count, and patients don't see internal organization.

## Internal Mechanics

**Request flow:**
1. Client connects to LB's address (often a DNS name → LB IP).
2. LB picks a backend by algorithm.
3. LB forwards request (proxying or DSR).
4. Backend responds; LB returns to client.

**Health checks:**
- LB periodically probes backends.
- Unhealthy → remove from pool.
- Recovery → return to pool.

**Sticky sessions:**
- Route a client always to the same backend.
- Useful for stateful sessions; defeats some load-balance benefit.

**SSL termination:**
- LB decrypts TLS; backend speaks HTTP.
- Reduces backend CPU; centralizes cert management.

## Architecture Diagrams

```
              ┌──────────────┐
   Clients ──→│ Load Balancer│──┬──→ Backend 1
              └──────────────┘  ├──→ Backend 2
                                ├──→ Backend 3
                                └──→ Backend 4
```

## Design Tradeoffs

**Benefits:**
- Horizontal scale.
- Failure tolerance.
- Rolling deployments.
- SSL offload.
- Geographic distribution.

**Costs:**
- Added hop (latency).
- LB itself is potential SPOF (use redundant LBs).
- Configuration complexity.
- Health-check overhead.

## Real Production Examples

- **HAProxy** — software LB; widely used.
- **Nginx** — primarily reverse proxy + LB.
- **Envoy** — modern service-mesh LB.
- **AWS ELB family** — ALB (L7), NLB (L4), Gateway LB.
- **GCP, Azure LBs** — managed.
- **Cloudflare, Fastly** — global LBs at edge.
- **F5, Citrix** — enterprise hardware LBs.

## Interview Perspective

**Common questions:**
- "Why load balance?" → Scale, redundancy, deployment.
- "L4 vs L7?" → L4: TCP/UDP, fast, opaque. L7: HTTP-aware, smarter routing.
- "How are unhealthy backends handled?" → Health checks; remove from pool until recovered.

**Senior-level:**
- LBs are themselves systems with availability concerns; usually deployed in pairs or as a fleet.
- DNS-based load balancing is coarser (TTL granularity) than LB-based.
- Service mesh pushes LB to the edge (sidecar per service) — more granular.

**Common mistakes:**
- Single LB without redundancy → SPOF.
- Sticky sessions when not needed → uneven load.
- Wrong algorithm → hot backend.

## Related Concepts

- [[L4 vs L7 Load Balancing]] · [[Load Balancing Algorithms]] · [[Reverse Proxy]] · [[Service Discovery]] · [[Anycast]]

## Misconceptions

- **"LBs eliminate SPOF."** Only if LB itself is redundant.
- **"More backends = better."** Only if LB algorithm distributes well.
- **"LB = reverse proxy."** Related; reverse proxy is broader.

## Failure Scenarios

- **LB failure** without redundancy.
- **Hot backend** under sticky sessions.
- **Health check flap** removes/restores backends rapidly.
- **Cascading failure** when LB doesn't shed load.

## Practical Engineering Heuristics

- **Always deploy LBs redundantly** (active-active or active-standby).
- **Set realistic health checks** — not too aggressive.
- **Use sticky sessions only when needed.**
- **Monitor LB metrics** — request rate, backend health, latency.
- **Consider cloud-managed LBs** for ops simplicity.

## Active Recall Questions

What's a load balancer?::Distributes incoming requests across multiple backend servers. Provides scale, redundancy, rolling deployments.

L4 vs L7?::L4: TCP/UDP-level, fast, opaque to payload. L7: HTTP-aware, content-based routing.

What's a health check?::LB periodically probes backends; removes unhealthy; restores on recovery.

What's SSL termination?::LB decrypts TLS; backend speaks plain HTTP. Reduces backend CPU; centralizes certs.

Name three production LBs.::HAProxy, Nginx, Envoy, AWS ALB/NLB, F5, Cloudflare.

Why deploy LBs redundantly?::Otherwise the LB is a SPOF. Use active-active or active-standby pairs.

## Feynman Test

Walk through a request: client → DNS → LB → backend → response.

Why is a single LB worse than no LB if it's a SPOF?

## Mastery Checklist

- **Explain** load balancing and its benefits.
- **Compare** L4 vs L7.
- **Derive** appropriate LB topology.
- **Critique** single-LB designs.
- **Design** a multi-tier LB architecture.

---
title: L4 vs L7 Load Balancing
area: networking
status: mature
difficulty: intermediate
prerequisites: ["[[Load Balancing]]", "[[TCP]]", "[[HTTP/1.1]]"]
related: ["[[Load Balancing]]", "[[Load Balancing Algorithms]]", "[[Reverse Proxy]]"]
sources:
  - SDI vol 1
  - system-design-primer
tags: [networking, load-balancing]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# L4 vs L7 Load Balancing

## Executive Summary

**L4 (transport layer) load balancing** operates on TCP/UDP — it routes based on IP + port, never inspects the payload, never terminates connections. **L7 (application layer) load balancing** operates on HTTP — it can route by URL, header, cookie, can terminate TLS, can rewrite requests. **L4 is faster and dumber; L7 is slower and smarter**. Production systems use both: L4 in front for raw throughput; L7 behind for content-aware routing. AWS NLB is L4; ALB is L7. HAProxy and Envoy do both.

## Why This Exists

Different routing decisions need different visibility. "Send to least-busy backend" needs only connection counts (L4). "Send `/api/*` to API servers, `/static/*` to CDN" needs URL inspection (L7). The trade-off is depth of inspection vs throughput.

## Core Intuition

L4 is a mail carrier sorting by ZIP code (port). L7 is a librarian reading the request and routing based on subject. The mail carrier is much faster; the librarian makes smarter decisions.

## L4 Load Balancing

**Operates on:** TCP / UDP segments.
**Sees:** source/dest IP + port.
**Routes by:** connection-level info, algorithms (round-robin, least-conn).
**Cannot:** read URLs, headers, cookies, TLS.

**Pros:**
- **Faster** — no payload inspection.
- **Lower latency.**
- **Protocol-agnostic** — works for non-HTTP (databases, custom protocols).
- **No TLS termination required** (pass-through).

**Cons:**
- No content-based routing.
- No SSL inspection.
- Sticky sessions need IP-hash or source IP.

**Examples:** AWS NLB, HAProxy in TCP mode, Linux IPVS.

## L7 Load Balancing

**Operates on:** HTTP requests.
**Sees:** URL, headers, cookies, body.
**Routes by:** path, host, header, content.
**Can:** terminate TLS, modify headers, rewrite paths, do compression.

**Pros:**
- **Content-based routing.**
- **TLS termination.**
- **Path-based microservice routing.**
- **Authentication / rate limiting** at the edge.
- **Compression, caching.**

**Cons:**
- **Slower** — payload inspection.
- **HTTP-only.**
- **Higher latency.**

**Examples:** AWS ALB, Nginx, HAProxy in HTTP mode, Envoy, Traefik.

## Comparison Table

| Feature | L4 | L7 |
|---|---|---|
| OSI layer | 4 (transport) | 7 (application) |
| Protocol | TCP/UDP | HTTP/HTTPS |
| Routing by | IP, port | URL, header, cookie |
| TLS | Pass-through | Can terminate |
| Speed | Fast | Slower |
| Smarts | None | Lots |
| Use | Throughput, non-HTTP | Microservices, edge |

## Real Production Examples

- **AWS NLB (L4)** — millions of connections; ultra-low latency.
- **AWS ALB (L7)** — path/host routing; WebSockets; HTTP/2.
- **HAProxy** — both.
- **Envoy** — modern L7 service mesh.
- **Cloudflare** — L7 with edge compute.

## Design Tradeoffs

Hybrid is common: L4 in front for terminating connections cheaply, L7 behind for routing. Or DNS → CDN (L7) → L4 LB → L7 LB → backend.

## Interview Perspective

**Common questions:**
- "L4 vs L7?" → Transport vs application layer. L4 faster, L7 smarter.
- "When use L4?" → Non-HTTP, ultra-low latency, very high connection counts.
- "When use L7?" → HTTP, content-based routing, TLS termination.

**Senior-level:**
- Service meshes (Istio, Linkerd) are L7 LBs at the sidecar — fine-grained per-service routing.
- L4 + L7 combination is the norm in production.
- L7 can act as application firewall (WAF), rate limiter, auth gateway — multi-purpose.

**Common mistakes:**
- L7 for non-HTTP — pointless.
- L4 for path-based routing — impossible.
- Single layer when both are needed.

## Related Concepts

- [[Load Balancing]] · [[Load Balancing Algorithms]] · [[Reverse Proxy]]

## Misconceptions

- **"L7 is always better."** L4 is faster and supports non-HTTP.
- **"L4 can't do TLS."** L4 passes TLS through; L7 terminates.
- **"L4 = network LB; L7 = app LB."** Roughly, but both can be either hardware or software.

## Failure Scenarios

- **L7 CPU bottleneck** under heavy payload inspection.
- **L4 routing wrong tier** without content awareness.
- **Mixed deployment confusion** — L4 + L7 chain misconfigured.

## Practical Engineering Heuristics

- **L7 for HTTP-based services.**
- **L4 for non-HTTP or extreme throughput.**
- **Both in production stacks.**
- **Terminate TLS at L7** for ops simplicity.

## Active Recall Questions

L4 vs L7?::L4: transport (TCP/UDP), routes by IP+port, fast, payload-opaque. L7: application (HTTP), routes by URL/header/cookie, slower, smart.

When use L4?::Non-HTTP protocols (databases, custom), ultra-low latency, very high connection counts.

When use L7?::HTTP services, path/host routing, TLS termination, edge logic (auth, rate limit).

Name an L4 and L7 LB.::L4: AWS NLB, HAProxy TCP, Linux IPVS. L7: AWS ALB, Nginx, Envoy.

Why are L4 LBs faster?::No payload inspection; just route at packet level.

What can L7 do that L4 can't?::Path-based routing, TLS termination, header-based routing, compression, WAF.

## Feynman Test

A microservice architecture needs `/api/users` → user service, `/api/orders` → order service. L4 or L7?

Why is "L4 + L7 combined" common in production stacks?

## Mastery Checklist

- **Explain** L4 and L7 differences.
- **Compare** their use cases.
- **Derive** appropriate layer for given workload.
- **Critique** single-layer LB designs missing needs.
- **Design** L4 + L7 combined topology.

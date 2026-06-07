---
title: Reverse Proxy
area: networking
status: mature
difficulty: beginner
prerequisites: ["[[HTTP/1.1]]", "[[Load Balancing]]"]
related: ["[[Load Balancing]]", "[[L4 vs L7 Load Balancing]]", "[[CDN Caching]]", "[[API Gateway]]"]
sources:
  - SDI vol 1
  - system-design-primer
tags: [networking, proxy, http]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Reverse Proxy

## Executive Summary

A **reverse proxy** is a server that **sits in front of backend servers, receiving client requests and forwarding them to appropriate backends**. From the client's view, the proxy *is* the server. Functions: **load balancing, SSL termination, caching, compression, authentication, rate limiting, WAF (web application firewall), request routing**. Often the first thing clients connect to in production architectures. Implementations: **Nginx, HAProxy, Envoy, Apache HTTPd, Caddy, AWS ALB/CloudFront**. Different from forward proxy (which represents clients to servers).

## Why This Exists

Backends shouldn't be directly exposed: TLS certs, request rate, attack surface, version churn all need a buffer. The reverse proxy centralizes these concerns. Backends become simpler (plain HTTP, no TLS); the proxy handles edge concerns.

## Core Intuition

A building's front desk. Visitors don't go directly to individual offices. The receptionist screens, routes, takes packages, signs for deliveries. The offices don't deal with strangers at the door. The receptionist scales: handles many visitors, knows the building's layout, enforces rules.

## Internal Mechanics

**Request flow:**
1. Client connects to reverse proxy.
2. Proxy terminates client connection (TLS, etc.).
3. Proxy applies edge logic (auth, rate limit, cache lookup).
4. Proxy forwards to backend (or serves from cache).
5. Backend responds.
6. Proxy possibly modifies (compress, transform).
7. Proxy returns to client.

**Capabilities:**
- Load balancing (algorithm choice).
- TLS termination + cert management.
- Caching static content.
- Compression (gzip, brotli).
- Header manipulation.
- Path rewriting.
- Authentication / JWT validation.
- Rate limiting / WAF.
- Health checking backends.

## Reverse vs Forward Proxy

| Property | Reverse Proxy | Forward Proxy |
|---|---|---|
| Represents | Server side | Client side |
| Client knows | Talks to "the server" | Talks to "a proxy" |
| Use | TLS, LB, caching, WAF | Privacy, corporate filtering |
| Examples | Nginx, ALB | Squid, corporate proxies |

## Real Production Examples

- **Nginx** — the prototypical reverse proxy.
- **HAProxy** — high-performance LB + proxy.
- **Envoy** — modern; service-mesh sidecar.
- **AWS ALB / CloudFront** — managed reverse proxies.
- **Cloudflare** — global reverse proxy + CDN + security.
- **Traefik, Caddy** — modern, auto-TLS.

## Design Tradeoffs

**Benefits:**
- Centralizes edge concerns.
- Simplifies backends.
- Performance (caching, compression).
- Security (WAF, rate limit).

**Costs:**
- Added hop.
- Single bottleneck if not scaled.
- Operational complexity.

## Interview Perspective

**Common questions:**
- "What's a reverse proxy?" → Server in front of backends; clients connect to it; it forwards.
- "Reverse vs forward proxy?" → Reverse: represents server. Forward: represents client.
- "Why use one?" → TLS, load balancing, caching, security, simpler backends.

**Senior-level:**
- Modern architectures often have multiple reverse proxy tiers: CDN → edge LB → service mesh sidecar.
- The reverse proxy is the natural place for cross-cutting concerns (auth, observability, rate limits).
- Service meshes essentially deploy a reverse proxy per service (sidecar pattern).

**Common mistakes:**
- Reverse proxy as SPOF.
- Backends directly exposed alongside proxy.
- Too many proxy hops add up.

## Related Concepts

- [[Load Balancing]] · [[L4 vs L7 Load Balancing]] · [[CDN Caching]] · [[API Gateway]] · [[Service Mesh]]

## Misconceptions

- **"Reverse proxy = load balancer."** LB is one function; reverse proxy is broader.
- **"Reverse and forward proxies are similar."** Different roles; different security models.
- **"Proxies slow things down."** Often speed up via caching, connection pooling.

## Failure Scenarios

- **Proxy SPOF** without redundancy.
- **Slow backend** drags down proxy.
- **Cert renewal failure** breaks TLS.
- **Misconfigured rate limit** blocks valid traffic.

## Practical Engineering Heuristics

- **Always run multiple proxy instances.**
- **Automate cert renewal** (Let's Encrypt + cert-manager).
- **Centralize edge concerns** at the proxy.
- **Health-check backends.**
- **Monitor proxy as primary SLI source.**

## Active Recall Questions

What's a reverse proxy?::Server in front of backends. Clients connect to proxy; it forwards. Backend hidden behind.

Reverse vs forward proxy?::Reverse: represents server (LB, TLS, cache). Forward: represents client (privacy, corporate filter).

Name three reverse proxy functions.::Load balancing, TLS termination, caching, compression, authentication, rate limiting, WAF, path routing.

Name three reverse proxy implementations.::Nginx, HAProxy, Envoy, Apache, Caddy, Traefik, AWS ALB.

What's a service mesh sidecar?::Reverse proxy deployed per-service. Handles east-west traffic, observability, mTLS.

Why centralize TLS at the proxy?::Simpler backend ops (no per-service certs), centralized rotation, can use ECDSA/RSA at edge.

## Feynman Test

Walk through a request hitting Nginx → backend. What can Nginx do that the backend doesn't?

Why is the reverse proxy the natural place for cross-cutting concerns?

## Mastery Checklist

- **Explain** reverse proxy and its functions.
- **Compare** with forward proxy and pure LB.
- **Derive** which functions belong at proxy vs backend.
- **Critique** designs without reverse proxy.
- **Design** a multi-tier proxy architecture.

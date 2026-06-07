---
title: Service Discovery
area: networking
status: mature
difficulty: intermediate
prerequisites: ["[[Load Balancing]]", "[[DNS]]"]
related: ["[[Load Balancing]]", "[[DNS]]", "[[Microservices]]", "[[Service Mesh]]"]
sources:
  - SDI vol 1
  - Consul, etcd docs
tags: [networking, service-discovery, microservices]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Service Discovery

## Executive Summary

**Service discovery** is the mechanism by which **services in a dynamic environment find each other's network locations**. In a static world, hostnames in config files work. In a dynamic world (containers, autoscaling, frequent deploys), instances come and go constantly — services need a runtime registry. Two patterns: **client-side discovery** (clients query a registry, then connect directly) and **server-side discovery** (clients hit an LB, which queries the registry). Implementations: **Consul, etcd, ZooKeeper, Eureka, Kubernetes DNS, AWS Cloud Map**.

## Why This Exists

A service running on 50 containers can't be statically configured — addresses change with every deploy and autoscale event. Services must dynamically learn where others live. Service discovery provides: "I am the order service at this address" (registration) and "where is the user service?" (lookup).

## Core Intuition

A constantly-changing phonebook. Employees move desks, take vacation, join, leave. The phonebook is updated in real time. When you want to call someone, you check the phonebook for their current desk. Hardcoding desk numbers would be insane; service discovery is the phonebook.

## Internal Mechanics

**Registration:**
- Service instance starts.
- Registers with discovery service: name + address + health endpoint.
- Periodically heartbeats; failed heartbeat → deregister.

**Lookup:**
- Client queries discovery: "give me instances of service X."
- Receives list of healthy instances.
- Picks one (often via local LB algorithm).

**Patterns:**

**Client-side discovery:**
- Client knows registry; queries it; LBs across results.
- Pros: client controls; no extra hop.
- Cons: every language needs library.

**Server-side discovery:**
- Client hits an LB (DNS or address).
- LB queries registry; routes accordingly.
- Pros: clients oblivious; uniform.
- Cons: extra hop.

**Service mesh:**
- Per-pod sidecar proxy.
- Sidecar handles registration + discovery + LB.
- Application-transparent.

## Real Production Examples

- **Consul** — Hashicorp's; KV + discovery + health.
- **etcd** — Kubernetes' brain; KV used for discovery via watches.
- **ZooKeeper** — older; used by many JVM systems.
- **Eureka** — Netflix; client-side.
- **Kubernetes DNS** — built-in; services have DNS names; resolved per-pod.
- **AWS Cloud Map** — managed.

## Design Tradeoffs

**Benefits:**
- Dynamic environments work.
- Failover and rolling deploys.
- Autoscaling.

**Costs:**
- Registry availability is critical.
- Stale registry → broken routing.
- Operational concern.

## Interview Perspective

**Common questions:**
- "What's service discovery?" → Mechanism for services to find each other in dynamic environments.
- "Client-side vs server-side?" → Client queries registry directly vs hits an LB that queries.
- "Why not DNS?" → DNS works but TTL coarse; many use DNS-based discovery anyway (Kubernetes).

**Senior-level:**
- Kubernetes does service discovery via DNS — each service has a DNS name that resolves to a virtual IP (load balanced across pods).
- Service meshes (Istio, Linkerd) push discovery into sidecar proxies — application transparent.
- The registry itself must be highly available — usually built on consensus (Raft).

**Common mistakes:**
- Static config in dynamic environments.
- Single-instance registry → SPOF.
- Forgetting health checks → routing to dead instances.

## Related Concepts

- [[Load Balancing]] · [[DNS]] · [[Microservices]] · [[Service Mesh]] · [[Consensus]]

## Misconceptions

- **"DNS is enough."** Works at coarse granularity; service discovery is finer.
- **"Service mesh = service discovery."** Mesh includes discovery + many other things.
- **"Discovery is a solved problem."** Many architectures suffer registry-related outages.

## Failure Scenarios

- **Registry failure** → services can't find each other.
- **Stale registry** → routes to dead instances.
- **Registration lost** during deploy.
- **Split-brain registry** under partition.

## Practical Engineering Heuristics

- **Use Kubernetes DNS** if on k8s — built-in, well-tested.
- **Consul or etcd** for non-k8s environments.
- **Always run discovery service highly available.**
- **Health checks** before adding to discovery.
- **Cache discovery results** with short TTL.

## Active Recall Questions

What's service discovery?::Mechanism for services to find each other's network locations in dynamic environments.

Client-side vs server-side discovery?::Client-side: client queries registry, LBs locally. Server-side: client hits LB which queries registry.

Name three discovery systems.::Consul, etcd, ZooKeeper, Eureka, Kubernetes DNS, AWS Cloud Map.

How does Kubernetes do discovery?::Services have DNS names; resolved to virtual IPs; kube-proxy load balances across pods.

Why is the registry critical?::All services depend on it. Outage means services can't find each other → system-wide failure.

What's a service mesh?::Per-service proxy (sidecar) handling discovery + LB + mTLS + observability. Application-transparent.

## Feynman Test

Walk through how the order service finds the user service in a Kubernetes cluster.

Why is the service registry typically built on consensus (Raft)?

## Mastery Checklist

- **Explain** service discovery patterns.
- **Compare** client-side and server-side discovery.
- **Derive** appropriate discovery mechanism.
- **Critique** static configs in dynamic environments.
- **Design** a service discovery architecture using Consul or k8s DNS.

---
title: Chubby
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Consensus]]", "[[Paxos]]"]
related: ["[[Zookeeper]]", "[[Bigtable]]"]
builds_toward: []
sources:
  - Burrows "The Chubby lock service for loosely-coupled distributed systems" (OSDI 2006)
tags: [case-study, coordination, chubby, google]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Chubby

## Executive Summary

**Google Chubby** (Burrows, OSDI 2006) is the **distributed lock service** underlying GFS, [[Bigtable]], MapReduce, and most Google infrastructure. It provides a small consistent KV with coarse-grained locks, primarily used for **leader election and metadata storage**. Its design directly inspired [[Zookeeper]] and, indirectly, etcd.

## Why It Exists

Google's services all needed: a leader for GFS master, a primary for Bigtable cells, configuration distribution, group membership. Building Paxos per service was wasteful. Chubby is the single Paxos cluster that everyone uses.

## Architecture

- **Cell** — typically 5 replicas (one per zone).
- **Paxos** — full Paxos for consensus; one replica is the master at a time.
- **Master** — handles all reads and writes; followers are passive replicas.
- **Clients** — connect to any replica; library transparently follows master.
- **Sessions** — TCP-based with **leases** (master grants lease; if lost, client knows it's no longer the master).

## Data Model

- **Tiny filesystem-like namespace**: `/ls/cell/dir/file`.
- **Files** are at most a few KB.
- **Permissions** (ACLs).
- **Sequences** for fair leader election.
- **Events / notifications** — clients subscribe to file changes.

## Why Coarse-Grained Locks

Burrows explicitly chose coarse-grained over fine-grained:
- Lock once per master election, not per record.
- Few clients (services) hold locks for hours-days.
- Allows Chubby to be small (~5 servers per cell) yet serve all of Google.

## Strengths

- **Highly available** — 5-replica Paxos.
- **Strong consistency**.
- **Simple API** — open, lock, getContents, setContents.
- **Notifications** save polling.

## Weaknesses

- **Not for fine-grained locking** — too slow.
- **Tiny data only**.
- **Single bottleneck** — every Google service depends on its cell; outage cascades widely (and has, in reported incidents).

## Production Story

- Powers GFS master election, Bigtable Master, MapReduce job coordination, Borg, naming.
- Notable incidents — Chubby outages have caused Google-wide impact; led to extensive graceful-degradation work in clients.

## Lessons (from the paper itself — landmark)

- **Lock service is more useful than "Paxos library."** Most engineers don't want to embed Paxos; a service is the right abstraction.
- **Coarse-grained > fine-grained** for organizational use.
- **Lease-based session model** with explicit master failover hand-offs is necessary.
- **Notifications** beat polling at scale.
- Burrows: "It is clear that engineers do not appreciate the issues that arise when their applications use a lock service."

## Influence

- [[Zookeeper]] is an open-source Chubby (Hunt et al. 2010 explicitly model it as such).
- etcd, Consul follow same shape.
- "Build one consistent coordination service for the entire org" is now industry orthodoxy.

## Related Concepts

- [[Zookeeper]] — open-source counterpart.
- [[Paxos]] — substrate.
- [[Bigtable]] — major Chubby user.
- [[Leader Election]] — canonical use case.

## Active Recall Questions

What is Chubby's primary purpose at Google?::Coarse-grained locking and small-data coordination for distributed services — most prominently leader election and metadata for GFS, Bigtable, and other infra.

Why coarse-grained instead of fine-grained locks?::Locks held by services (not per-record), few clients, infrequent acquisitions — keeps Chubby small (~5 replicas per cell) while serving the whole organization.

What's the typical Chubby cell size?::5 replicas, one per failure domain; tolerates 2 failures while maintaining Paxos quorum.

What is the lease model?::Master grants a session lease; client knows its session is alive until lease expires; if master loses lease, it stops acting as master, ensuring at-most-one-master guarantee.

How did Chubby influence Zookeeper?::Zookeeper is explicitly modeled on Chubby (Hunt 2010 cites it); same hierarchical namespace, ephemeral nodes, watches, recipes.

Why does every Google service depend on a single Chubby cell per region?::Centralizing coordination concentrates expertise and Paxos infrastructure; cells are highly available but a cell outage is the canonical "Google-wide" failure mode.

What did Burrows mean by "engineers do not appreciate the issues that arise when their applications use a lock service"?::Lock services have subtle correctness pitfalls (lease expiry, lock fencing, ordering) that application developers often misuse; the service must protect them.

## Feynman Test

If you were building a new "coordination service for the whole company", what specific design choices from Chubby would you copy, and what would you change for cloud-era workloads?

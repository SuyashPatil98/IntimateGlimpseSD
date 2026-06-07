---
title: HBase
area: case-studies
status: mature
difficulty: advanced
prerequisites: ["[[Bigtable]]"]
related: ["[[Cassandra]]", "[[Zookeeper]]"]
builds_toward: []
sources:
  - Apache HBase docs
  - 'HBase: The Definitive Guide (George)'
  - DDIA references
tags: [case-study, storage, hbase, hadoop]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# HBase

## Executive Summary

**Apache HBase** is the open-source clone of [[Bigtable]] in the Hadoop ecosystem (2008). It runs on HDFS (instead of GFS), uses Zookeeper (instead of Chubby), and exposes a similar wide-column data model. Widely deployed in pre-cloud big-data stacks (Facebook Messages, ~2010s analytics).

## Why It Exists

Hadoop offered HDFS for files and MapReduce for batch, but no random-access structured store at scale. HBase filled the niche.

## Architecture

Same shape as Bigtable:

- **HMaster** — manages region assignment, schema; election via Zookeeper.
- **RegionServer** — serves regions (= tablets); 100s per cluster.
- **Region** — row-range partition of a table (similar to Bigtable tablet).
- **HDFS** — durable storage for HFiles (Bigtable's SSTables) and WAL.
- **Zookeeper** — service discovery, master election, region tracking.

## Key Design Decisions

- **Strong consistency** within a region (single owner) — like Bigtable.
- **Reads & writes go through region server** — no peer-to-peer replication.
- **HFile** = sorted, immutable file in HDFS — analogous to SSTable.
- **MemStore** = in-memory writes buffer (per column family per region).
- **WAL on HDFS** — durability via HDFS replication (3×).
- **Coprocessors** — server-side functions (akin to triggers).

## Strengths

- Strong consistency.
- Range scans (sorted row keys).
- Tight Hadoop integration (Map/Reduce / Spark / Hive).
- Good at write-heavy workloads.

## Weaknesses

- Operational complexity (HMaster, RegionServers, HDFS, Zookeeper — many moving parts).
- Region server is SPOF for its regions (failover takes seconds-minutes).
- No secondary indexes natively (workarounds via Phoenix).
- Memory-hungry; tuning is involved.

## Real Production

- **Facebook Messages (2010)** — HBase backbone for billions of messages.
- **Yahoo, Pinterest** — large historical deployments.
- **Apache Phoenix** — SQL layer on top.
- **Many migrating off** to Cassandra, ScyllaDB, or cloud-native services since 2018.

## Lessons

- Faithful clone of a famous design = success in the Hadoop ecosystem, but operational burden is real.
- Strong-leader-per-region simplifies consistency but creates fail-over windows.
- Co-evolution with HDFS shows how layered designs both enable and constrain.

## Related Concepts

- [[Bigtable]] — the original.
- [[Zookeeper]] — coordination.
- [[Cassandra]] — competitor with different consistency model.
- [[LSM-Trees]] / [[SSTables]] / [[Compaction]] — same engine.
- [[HDFS]] — storage substrate.

## Active Recall Questions

What is HBase's relationship to Bigtable?::Open-source clone of Bigtable (2008) in the Hadoop ecosystem; same data model and storage architecture, with HDFS instead of GFS and Zookeeper instead of Chubby.

What is an HFile?::HBase's on-disk sorted immutable file (equivalent to Bigtable's SSTable); stored in HDFS.

What's the consistency model?::Strong consistency within a region — a region has a single RegionServer owner; reads and writes go through that server.

What is the role of Zookeeper in HBase?::Service discovery, master election, region tracking, distributed configuration.

What is the main operational pain of HBase?::Many moving parts (HMaster, RegionServers, HDFS, Zookeeper); region-server failover takes seconds-to-minutes; memory tuning is intricate.

What is Apache Phoenix?::A SQL layer on top of HBase providing JDBC + secondary indexes via additional tables.

Why have many orgs migrated off HBase since 2018?::Operational complexity, slow failover, cloud-native alternatives (BigTable managed, DynamoDB) reducing the niche.

## Feynman Test

Explain to a Cassandra user why HBase has slower failover but stronger consistency — what's the architectural trade-off?

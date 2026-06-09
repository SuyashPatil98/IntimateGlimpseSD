#!/usr/bin/env python3
"""Vault audit — finds what's missing or under-built, enqueues it for review.

Two deterministic detectors (no LLM — instant):
  - gaps:        a planned concept page (TARGET) with no matching page        -> CREATE
  - status-fill: a page claiming mature/comprehensive but missing a required
                 section (from lint's status-realism check)                   -> EXTEND

Each becomes a 'suggested' ReviewItem. The user picks which to draft (the Claude
compiler writes the content on demand), reviews, and approves. Re-running is safe:
add_review_item dedupes against open items.

Run:  ../.venv-win/Scripts/python tools/audit.py   (prints what it would enqueue)
"""
from __future__ import annotations

import re

import lint
import state

# Planned concept pages per area — the completeness target (from index.md's plan).
TARGET = {
    "databases": [
        "Transactions", "Isolation Levels", "Snapshot Isolation", "MVCC", "B-Trees",
        "LSM-Trees", "SSTables", "Compaction", "WAL", "Indexes", "OLTP vs OLAP",
        "Columnar Storage", "Query Optimization", "Joins", "Materialized Views",
        "Time-Series Databases", "Bloom Filters", "Two-Phase Locking", "Serializability",
    ],
    "networking": [
        "OSI Model", "TCP Handshake", "TCP Congestion Control", "QUIC", "mTLS",
        "WebSockets", "Server-Sent Events", "GraphQL", "CDN", "BGP", "NAT",
        "Anycast", "Service Discovery", "gRPC", "REST", "Reverse Proxy",
        "Load Balancing", "L4 vs L7 Load Balancing", "Load Balancing Algorithms",
    ],
    "storage": [
        "Block Storage", "Object Storage", "File Storage", "Durability vs Availability",
        "Erasure Coding", "RAID", "Replication for Durability", "Tiered Storage",
        "Cold Storage", "Encoding Formats", "Protobuf", "Avro", "Thrift", "Schema Evolution",
    ],
    "messaging": [
        "Message Queues", "Pub-Sub", "Event Streams", "Kafka Architecture",
        "Consumer Groups", "Delivery Guarantees", "At-Most-Once", "At-Least-Once",
        "Exactly-Once Semantics", "Idempotent Consumers", "Ordering Guarantees",
        "Backpressure", "Dead Letter Queues", "Event Sourcing", "Outbox Pattern", "CDC",
    ],
    "caching": [
        "Cache-Aside", "Read-Through", "Write-Through", "Write-Back", "Write-Around",
        "Eviction Policies", "LRU", "LFU", "FIFO", "TTL", "Cache Coherence", "CDN Caching",
        "Edge Caching", "Distributed Caching", "Thundering Herd", "Cache Stampede",
        "Cache Penetration", "Cache Invalidation", "Negative Caching",
    ],
    "reliability": [
        "SLO", "SLI", "SLA", "Error Budgets", "Toil", "Incident Response", "Postmortems",
        "Blameless Culture", "Chaos Engineering", "Observability", "Distributed Tracing",
        "USE Method", "RED Method", "Circuit Breakers", "Bulkheads", "Retries",
        "Exponential Backoff", "Jitter", "Rate Limiting", "Token Bucket", "Leaky Bucket",
        "Graceful Degradation", "Health Checks", "Canary Releases", "Blue-Green Deployment",
        "Feature Flags",
    ],
    "architecture-patterns": [
        "Monolith", "Modular Monolith", "Microservices", "SOA", "Event-Driven Architecture",
        "Hexagonal Architecture", "Onion Architecture", "Layered Architecture", "CQRS",
        "Saga Pattern", "API Gateway", "BFF", "Service Mesh", "Strangler Fig", "Sidecar",
        "Ambassador", "Anti-Corruption Layer", "Domain-Driven Design", "Bounded Contexts",
    ],
    "design-patterns": [
        "Strategy", "Observer", "Decorator", "Factory", "Abstract Factory", "Singleton",
        "Adapter", "Facade", "Template Method", "Iterator", "Composite", "State", "Command",
        "Chain of Responsibility", "Proxy", "Visitor", "Memento", "Builder", "Prototype",
        "Bridge", "Flyweight", "Mediator", "SOLID", "Dependency Injection",
        "Composition over Inheritance",
    ],
    "software-engineering": [
        "Testing Pyramid", "Unit Testing", "Integration Testing", "End-to-End Testing",
        "Test Doubles", "Property-Based Testing", "CI-CD", "Trunk-Based Development",
        "Code Review", "Refactoring", "Technical Debt", "Monorepos", "Build Systems",
        "Deprecation", "Large-Scale Change", "Hyrum's Law", "Beyoncé Rule",
    ],
    "data-engineering": [
        "ETL vs ELT", "Data Warehouse", "Data Lake", "Lakehouse", "Batch Processing",
        "Stream Processing", "Lambda Architecture", "Kappa Architecture", "Dimensional Modeling",
        "Star Schema", "Snowflake Schema", "Slowly Changing Dimensions", "Data Quality",
        "Data Lineage", "Orchestration", "DAGs", "Apache Airflow", "dbt",
    ],
    "ml-systems": [
        "Feature Stores", "Training Pipelines", "Model Serving", "Online vs Batch Inference",
        "Model Registry", "Model Monitoring", "Data Drift", "Concept Drift",
        "A-B Testing for ML", "MLOps", "Vector Databases", "RAG", "Recommendation Systems",
        "Ranking Systems",
    ],
    "system-design-interview": [
        "4-Step Framework", "Back-of-Envelope", "Latency Numbers", "Powers of 2",
        "Design URL Shortener", "Design Rate Limiter", "Design Key-Value Store",
        "Design Unique ID Generator", "Design Web Crawler", "Design Notification System",
        "Design News Feed", "Design Chat System", "Design Search Autocomplete",
        "Design YouTube", "Design Google Drive", "Design Distributed Message Queue",
        "Design Ad Click Aggregation", "Design Payment System", "Design Digital Wallet",
        "Design Stock Exchange",
    ],
    "case-studies": [
        "Apache Kafka", "Cassandra", "DynamoDB", "Spanner", "Bigtable", "HBase", "MongoDB",
        "Redis", "Memcached", "GFS", "HDFS", "MapReduce", "Apache Spark", "Apache Flink",
        "Apache Storm", "Zookeeper", "Chubby", "Dapper",
    ],
    "distributed-systems": [
        "CAP Theorem", "PACELC", "Consistency Models", "Linearizability", "Consensus",
        "Paxos", "Raft", "Leader Election", "Two-Phase Commit", "Three-Phase Commit",
        "Vector Clocks", "Lamport Timestamps", "Quorums", "Consistent Hashing", "CRDTs",
        "Gossip Protocols", "Split Brain", "Hinted Handoff", "Read Repair", "Anti-Entropy",
    ],
}


def _norm(s: str) -> str:
    """Loose key: lowercase, strip non-alphanumerics, drop a trailing plural 's'."""
    k = re.sub(r"[^a-z0-9]", "", (s or "").lower())
    return k[:-1] if k.endswith("s") and len(k) > 3 else k


def find_gaps(concept: dict) -> list[tuple[str, str]]:
    have = set()
    for name, p in concept.items():
        have.add(_norm(name))
        have.add(_norm(p["frontmatter"].get("title", "") or name))
        for a in p.get("aliases", []):
            have.add(_norm(a))
    gaps = []
    for area, topics in TARGET.items():
        for t in topics:
            if _norm(t) not in have:
                gaps.append((area, t))
    return gaps


def run_audit() -> dict:
    """Detect gaps + status-fills and enqueue them as 'suggested' review items."""
    pages = lint.collect_pages()
    concept = {n: p for n, p in pages.items() if not p["is_meta"]}

    n_gap = 0
    for area, topic in find_gaps(concept):
        state.add_review_item(kind="gap", title=topic, area=area, source="audit",
                              decision="CREATE", summary="planned page — not written yet")
        n_gap += 1

    n_fill = 0
    for name, status, missing in lint.check_status_realism(pages):
        p = concept.get(name)
        if not p:
            continue
        state.add_review_item(kind="status-fill", title=name,
                              area=p["frontmatter"].get("area", ""), source="lint",
                              decision="EXTEND",
                              summary="missing: " + ", ".join(missing))
        n_fill += 1

    return {"status": "ok", "gaps": n_gap, "status_fills": n_fill,
            "counts": state.review_counts()}


if __name__ == "__main__":
    pages = lint.collect_pages()
    concept = {n: p for n, p in pages.items() if not p["is_meta"]}
    gaps = find_gaps(concept)
    fills = lint.check_status_realism(pages)
    print(f"GAPS ({len(gaps)}):")
    for area, t in gaps:
        print(f"  [{area}] {t}")
    print(f"\nSTATUS-FILLS ({len(fills)}):")
    for name, status, missing in fills:
        print(f"  {name} ({status}) — missing: {', '.join(missing)}")

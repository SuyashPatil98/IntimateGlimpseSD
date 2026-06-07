---
type: meta
subtype: index
last_updated: 2026-06-04
---

# System Design Wiki — Index

A unified knowledge base on system design, distilled from canonical sources. Organized by **concept**, never by book or author.

→ Read [[schema]] first if you're contributing or building the course app.
→ See [[log]] for the chronological record of every Ingest / Query / Lint.

---

## How to use this wiki

- **Reading.** Pick an area. Each page is standalone — open any page cold and understand the concept.
- **Studying.** Active Recall Questions at the bottom of each page work with the Obsidian **Spaced Repetition** community plugin. Install it once; daily reviews come for free.
- **Querying.** Ask a question. The answer either exists or gets *promoted* to a permanent page.
- **Contributing.** Follow [[schema]] strictly. Pages evolve `stub → draft → mature → comprehensive`.

---

## Areas

Each area below lists the **planned concept pages**. As pages get created, they'll be linked here with status badges.

### Distributed Systems · `distributed-systems/`

How nodes coordinate without shared memory and over unreliable networks. The hardest part of system design.

**Pages created (42 — area complete):** [[CAP Theorem]] · [[Consistency Models]] · [[Linearizability]] · [[Eventual Consistency]] · [[PACELC]] · [[Sequential Consistency]] · [[Causal Consistency]] · [[Performance vs Scalability]] · [[Latency vs Throughput]] · [[Replication]] · [[Leader-Based Replication]] · [[Multi-Leader Replication]] · [[Leaderless Replication]] · [[Synchronous vs Asynchronous Replication]] · [[Replication Lag]] · [[Read-Your-Writes Consistency]] · [[Monotonic Reads]] · [[Partitioning]] · [[Consistent Hashing]] · [[Hot Partitions]] · [[Rebalancing]] · [[Federation]] · [[Quorums]] · [[Anti-Entropy]] · [[Read Repair]] · [[Hinted Handoff]] · [[Gossip Protocols]] · [[CRDTs]] · [[Failure Detection]] · [[Heartbeats]] · [[Phi Accrual Failure Detector]] · [[Split Brain]] · [[Logical Clocks]] · [[Lamport Timestamps]] · [[Vector Clocks]] · [[Hybrid Logical Clocks]] · [[Consensus]] · [[Paxos]] · [[Raft]] · [[Leader Election]] · [[Two-Phase Commit]] · [[Distributed Transactions]]

(Three-Phase Commit deferred — rarely used in practice; covered as misconception in [[Two-Phase Commit]].) · Multi-Leader Replication · Leaderless Replication · Replication Lag · Read-Your-Writes Consistency · Monotonic Reads · Quorums · Partitioning (Sharding) · Consistent Hashing · Consensus · Paxos · Raft · Two-Phase Commit · Three-Phase Commit · Failure Detection · Heartbeats · Phi Accrual · Logical Clocks · Lamport Timestamps · Vector Clocks · Hybrid Logical Clocks · Anti-Entropy · Gossip Protocols · Split Brain · Leader Election · CRDTs

### Databases · `databases/`

Storage engines, transaction systems, query execution.

**Pages created (9):** [[Relational Databases]] · [[NoSQL]] · [[ACID]] · [[BASE]] · [[Key-Value Store]] · [[Document Database]] · [[Wide-Column Store]] · [[Graph Database]] · [[Denormalization]]

Planned: Transactions · Isolation Levels · Snapshot Isolation · MVCC · B-Trees · LSM-Trees · SSTable · Compaction · WAL · Indexes · OLTP vs OLAP · Columnar Storage · Row-Oriented Storage · Query Optimization · Query Planner · Joins · Materialized Views · Time-Series Databases

### Networking · `networking/`

The protocols and primitives every system runs on.

**Pages created (6):** [[TCP]] · [[UDP]] · [[HTTP/1.1]] · [[HTTP/2]] · [[DNS]] · [[TLS]]

Planned: OSI Model · TCP Handshake · TCP Congestion Control · HTTP/3 · QUIC · mTLS · WebSockets · Server-Sent Events · gRPC · REST · GraphQL · Load Balancing · L4 vs L7 Load Balancing · Load Balancing Algorithms · Reverse Proxy · CDN · Anycast · BGP · NAT · Service Discovery

### Storage · `storage/`

Durability, encoding, persistent state.

Planned: Block Storage · Object Storage · File Storage · Durability vs Availability · Erasure Coding · RAID · Replication for Durability · Encoding Formats · Protobuf · Avro · Thrift · JSON · Schema Evolution · Backward / Forward Compatibility · Tiered Storage · Cold Storage

### Messaging · `messaging/`

Asynchronous communication, decoupling.

Planned: Message Queues · Pub/Sub · Event Streams · Kafka Architecture · Topics · Partitions · Consumer Groups · Delivery Guarantees · At-Most-Once · At-Least-Once · Exactly-Once Semantics · Idempotent Consumers · Ordering Guarantees · Backpressure · Dead Letter Queues · Event-Driven Architecture · Event Sourcing · Outbox Pattern · Inbox Pattern · CDC (Change Data Capture)

### Caching · `caching/`

Trading consistency for latency, deliberately.

Planned: Cache-Aside · Read-Through · Write-Through · Write-Back · Write-Around · Eviction Policies · LRU · LFU · FIFO · TTL · Cache Coherence · CDN Caching · Edge Caching · Distributed Caching · Memcached · Redis · Thundering Herd · Cache Stampede · Cache Penetration · Cache Invalidation · Negative Caching

### Reliability · `reliability/`

Keeping systems alive under failure.

Planned: SLO · SLI · SLA · Error Budgets · Toil · Incident Response · Postmortems · Blameless Culture · Chaos Engineering · Observability · Logs · Metrics · Distributed Tracing · USE Method · RED Method · Circuit Breakers · Bulkheads · Retries · Exponential Backoff · Jitter · Rate Limiting · Token Bucket · Leaky Bucket · Idempotency · Graceful Degradation · Health Checks · Canary Releases · Blue-Green Deployment · Feature Flags

### Architecture Patterns · `architecture-patterns/`

System-level shapes.

Planned: Monolith · Modular Monolith · Microservices · Service-Oriented Architecture · Event-Driven Architecture · Hexagonal Architecture · Onion Architecture · Layered Architecture · CQRS · Event Sourcing (pattern view) · Saga Pattern · API Gateway · BFF (Backend for Frontend) · Service Mesh · Strangler Fig · Sidecar · Ambassador · Anti-Corruption Layer · Domain-Driven Design · Bounded Contexts

### Design Patterns · `design-patterns/`

Code-level reusable solutions.

Planned: Strategy · Observer · Decorator · Factory · Abstract Factory · Singleton · Adapter · Facade · Template Method · Iterator · Composite · State · Command · Chain of Responsibility · Proxy · Visitor · Memento · Builder · Prototype · SOLID · Single Responsibility · Open-Closed · Liskov Substitution · Interface Segregation · Dependency Inversion · Dependency Injection · Composition over Inheritance

### Software Engineering · `software-engineering/`

How engineering organizations build and maintain software.

Planned: Testing Pyramid · Unit Testing · Integration Testing · End-to-End Testing · Test Doubles (Mock, Stub, Fake, Spy) · Property-Based Testing · CI/CD · Trunk-Based Development · Feature Branches · Code Review · Refactoring · Technical Debt · Monorepos · Build Systems · Deprecation · Large-Scale Change · Hyrum's Law · Beyoncé Rule

### Data Engineering · `data-engineering/`

Moving and transforming data at scale.

Planned: ETL vs ELT · Data Warehouse · Data Lake · Lakehouse · Batch Processing · Stream Processing · Lambda Architecture · Kappa Architecture · Dimensional Modeling · Star Schema · Snowflake Schema · Slowly Changing Dimensions · CDC · Data Quality · Data Lineage · Orchestration · DAGs · Airflow · dbt · Schema Evolution

### ML Systems · `ml-systems/`

Productionizing machine learning.

Planned: Feature Store · Training Pipeline · Model Serving · Online Inference · Batch Inference · Model Registry · Model Monitoring · Data Drift · Concept Drift · A/B Testing for ML · MLOps · Embedding Stores · Vector Databases · RAG Systems · Recommendation Systems · Ranking Systems

### System Design Interview · `system-design-interview/`

Interview methodology, common design problems, and quick-reference material. This area is where canonical concept knowledge gets *applied* to concrete design scenarios.

Planned: 4-Step Interview Framework · Back-of-Envelope Calculations · Latency Numbers Reference · Powers of Two Reference · Use Cases & Constraints · High-Level Design Sketching · Scaling Approaches · Design URL Shortener · Design Rate Limiter · Design Consistent Hashing System · Design Key-Value Store · Design Unique ID Generator · Design Web Crawler · Design Notification System · Design News Feed · Design Chat System · Design Search Autocomplete · Design YouTube · Design Google Drive · Design Proximity Service · Design Nearby Friends · Design Google Maps · Design Distributed Message Queue · Design Metric Monitoring · Design Ad Click Aggregation · Design Hotel Reservation · Design Distributed Email · Design S3-like Storage · Design Real-Time Gaming Leaderboard · Design Payment System · Design Digital Wallet · Design Stock Exchange

### Case Studies · `case-studies/`

End-to-end analyses of real-world systems. Each case study cross-cuts multiple concept areas and grounds principles in production reality. Cite these from concept pages as Real Production Examples.

Planned: Apache Kafka · Apache Cassandra · Amazon DynamoDB · Google Spanner · Google Bigtable · Apache HBase · MongoDB · Redis · Memcached · Google GFS · HDFS · Google MapReduce · Apache Spark · Apache Flink · Apache Storm · Apache Zookeeper · Google Chubby · Google Dapper · Apache Airflow

---

## Status

**2026-06-02** — Initial scaffold. Vault structure created, [[schema]] written. Zero concept pages yet. **Next operation:** Ingest #1 — *Designing Data-Intensive Applications*, Chapter 5 (Replication).

When concept pages exist, each area's planned list will be replaced with links and status badges.

---

## Reading paths

Coming once enough pages exist. Planned tracks (in `learning-path.md`):

1. **Beginner Path** — get to a working mental model of a multi-tier web system.
2. **Intermediate Path** — durable services, basic distributed systems.
3. **Advanced Path** — consensus, custom replication, performance.
4. **Staff Engineer Path** — organizational, multi-system, long-term evolution.
5. **ML Systems Path** — productionizing models.
6. **Data Engineering Path** — pipelines, warehouses, streaming.

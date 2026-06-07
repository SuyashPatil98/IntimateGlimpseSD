---
type: source-map
status: canonical
last_updated: 2026-06-02
---

# Source Map

The **topic-to-source index** for the ingestion campaign. Two roles:

1. **Campaign plan** — the LLM consults this during Ingest to know which sources cover the current topic.
2. **Study index** — you can use it directly: "I want to learn X — open which book / chapter?"

When sources disagree, the topic page presents both framings (per [[schema]] §7).

## Source codes

| Code | Title | Author(s) | Primary domain |
|---|---|---|---|
| **DDIA** | Designing Data-Intensive Applications | Kleppmann | Distributed systems, databases, data engineering |
| **SDI1** | System Design Interview, vol 1 | Alex Xu | Interview methodology + common designs |
| **SDI2** | System Design Interview, vol 2 | Alex Xu | Advanced design problems |
| **SWEG** | Software Engineering at Google | Beyer, Wright et al. | Engineering practices at scale |
| **FoSA** | Fundamentals of Software Architecture | Ford & Richards | Architecture patterns & characteristics |
| **MSE** | Modern Software Engineering | David Farley | First-principles engineering |
| **RF** | Refactoring (2nd ed.) | Martin Fowler | Code-level refactoring catalog |
| **HFDP** | Head First Design Patterns | Freeman & Robson | GoF design patterns |
| **DEC** | The Data Engineering Cookbook | Andreas Kretz | Data pipelines, ML systems |
| *(prim)* | system-design-primer (Donne Martin) | — | Reference / cross-check, not in `raw/` |

Notation: `CODE Ch.N` for chapter; `*supplement needed*` flags a topic that's thin in canon and needs external material (see Coverage notes).

---

## Topic map (by area)

### distributed-systems

| Topic | Sources |
|---|---|
| CAP Theorem | DDIA Ch.9; SDI1 Ch.6; FoSA Ch.6; prim |
| PACELC | DDIA Ch.9; prim |
| Linearizability | DDIA Ch.9 |
| Sequential Consistency | DDIA Ch.9 |
| Causal Consistency | DDIA Ch.5, Ch.9 |
| Eventual Consistency | DDIA Ch.5; SDI1 Ch.6; prim |
| Strong Consistency | DDIA Ch.9; prim |
| Read-Your-Writes Consistency | DDIA Ch.5 |
| Monotonic Reads | DDIA Ch.5 |
| Replication (overview) | DDIA Ch.5; SDI1 Ch.6; prim |
| Leader-Based Replication | DDIA Ch.5; SDI1 Ch.6 |
| Multi-Leader Replication | DDIA Ch.5 |
| Leaderless Replication | DDIA Ch.5 |
| Synchronous vs Asynchronous Replication | DDIA Ch.5; prim |
| Replication Lag | DDIA Ch.5 |
| Quorums | DDIA Ch.5, Ch.9 |
| Partitioning (Sharding) | DDIA Ch.6; SDI1 Ch.5–6; prim |
| Consistent Hashing | DDIA Ch.6; SDI1 Ch.5 |
| Hot Partitions | DDIA Ch.6 |
| Rebalancing | DDIA Ch.6 |
| Consensus | DDIA Ch.9 |
| Paxos | DDIA Ch.9 (mention); *supplement needed* (Paxos Made Simple) |
| Raft | DDIA Ch.9 (mention); *supplement needed* (Raft paper) |
| Two-Phase Commit (2PC) | DDIA Ch.9 |
| Three-Phase Commit (3PC) | *supplement needed* |
| Failure Detection | DDIA Ch.8 |
| Heartbeats | DDIA Ch.8; SDI1 |
| Phi Accrual Failure Detector | DDIA Ch.8 |
| Logical Clocks | DDIA Ch.8–9 |
| Lamport Timestamps | DDIA Ch.9 |
| Vector Clocks (Version Vectors) | DDIA Ch.5 |
| Hybrid Logical Clocks | DDIA mention; *supplement* (Spanner paper) |
| Anti-Entropy / Read Repair | DDIA Ch.5 |
| Gossip Protocols | DDIA Ch.6; SDI1 Ch.6 |
| Split Brain | DDIA Ch.8–9 |
| Leader Election | DDIA Ch.9 |
| CRDTs | DDIA Ch.5 (brief) |
| Distributed Transactions | DDIA Ch.7, Ch.9 |
| Idempotency in Distributed Systems | DDIA Ch.11; SDI2 (payment) |

### databases

| Topic | Sources |
|---|---|
| Relational vs Non-Relational | DDIA Ch.2; SDI1 Ch.3; prim |
| ACID | DDIA Ch.7; SDI1; prim |
| BASE | SDI1; prim |
| Transactions | DDIA Ch.7 |
| Isolation Levels | DDIA Ch.7 |
| Snapshot Isolation | DDIA Ch.7 |
| MVCC | DDIA Ch.7 |
| Optimistic vs Pessimistic Concurrency | DDIA Ch.7 |
| Serializability | DDIA Ch.7 |
| Two-Phase Locking (2PL) | DDIA Ch.7 |
| Serializable Snapshot Isolation (SSI) | DDIA Ch.7 |
| B-Trees | DDIA Ch.3 |
| LSM-Trees | DDIA Ch.3 |
| SSTables | DDIA Ch.3 |
| Compaction | DDIA Ch.3 |
| Write-Ahead Log (WAL) | DDIA Ch.3, Ch.7 |
| Indexes (Primary, Secondary, Composite, Covering) | DDIA Ch.3; prim |
| Bloom Filters | DDIA Ch.3 |
| Sharding | DDIA Ch.6; SDI1; prim |
| Federation (Functional Partitioning) | prim; FoSA touches |
| Denormalization | DDIA Ch.2; prim |
| OLTP vs OLAP | DDIA Ch.3 |
| Columnar Storage | DDIA Ch.3 |
| Row-Oriented Storage | DDIA Ch.3 |
| Query Optimization | DDIA Ch.3; prim |
| Query Planner | DDIA Ch.3 |
| Joins (Hash, Merge, Nested Loop) | DDIA Ch.3, Ch.10 |
| Materialized Views | DDIA Ch.11 |
| Time-Series Databases | DEC; *supplement* |
| Graph Databases | DDIA Ch.2 |
| Document Databases | DDIA Ch.2 |
| Wide-Column Stores | DDIA Ch.2; DEC |
| Key-Value Stores | DDIA Ch.2; SDI1 Ch.6; prim |

### networking

| Topic | Sources |
|---|---|
| OSI Model | prim; *supplement* |
| TCP | SDI1; prim |
| TCP Handshake | SDI1; *supplement* |
| TCP Congestion Control | *supplement* (High Performance Browser Networking) |
| UDP | SDI1; prim |
| HTTP/1.1 | SDI1; prim |
| HTTP/2 | SDI1; *supplement* |
| HTTP/3 + QUIC | *supplement* |
| DNS | SDI1 Ch.9; prim |
| DNS Record Types (A, NS, MX, CNAME) | prim |
| DNS Routing (weighted RR, latency-based, geo) | prim |
| TLS/SSL | SDI1; *supplement* |
| mTLS | *supplement* |
| WebSockets | SDI1 (chat) |
| Server-Sent Events | SDI1 (chat) |
| gRPC | DDIA Ch.4; FoSA |
| REST | SDI1; prim; FoSA |
| GraphQL | FoSA; SDI1 |
| RPC | DDIA Ch.4; prim |
| Load Balancing (overview) | SDI1 Ch.4; FoSA; prim |
| L4 vs L7 Load Balancing | SDI1; prim |
| Load Balancing Algorithms | SDI1; prim |
| Reverse Proxy | SDI1; prim |
| CDN | SDI1 Ch.9; prim |
| Push vs Pull CDNs | prim |
| Anycast | *supplement* |
| BGP | *supplement* |
| Service Discovery | SDI1; FoSA; prim |

### storage

| Topic | Sources |
|---|---|
| Block Storage | SDI2 (S3) |
| Object Storage | SDI2 (S3); DEC |
| File Storage | SDI2 (S3, Google Drive) |
| Durability vs Availability | DDIA Ch.5; prim |
| Erasure Coding | DDIA Ch.6 (brief); SDI2 |
| RAID | *supplement* |
| Encoding Formats (overview) | DDIA Ch.4 |
| Protobuf | DDIA Ch.4 |
| Avro | DDIA Ch.4 |
| Thrift | DDIA Ch.4 |
| JSON / XML | DDIA Ch.4 |
| Schema Evolution | DDIA Ch.4 |
| Backward / Forward Compatibility | DDIA Ch.4 |
| Tiered Storage | DEC; SDI2 |

### messaging

| Topic | Sources |
|---|---|
| Message Queues | DDIA Ch.11; SDI1; prim |
| Task Queues | prim; SDI1 |
| Pub/Sub | DDIA Ch.11; SDI1 |
| Event Streams | DDIA Ch.11 |
| Kafka Architecture | DDIA Ch.11; DEC |
| Topics & Partitions | DDIA Ch.11; DEC |
| Consumer Groups | DDIA Ch.11; DEC |
| Delivery Guarantees (at-most/at-least/exactly-once) | DDIA Ch.11 |
| Idempotent Consumers | DDIA Ch.11 |
| Ordering Guarantees | DDIA Ch.11 |
| Backpressure | prim; DDIA Ch.11 |
| Dead Letter Queues | SDI2; DEC |
| Event-Driven Architecture | FoSA Ch.14; DDIA Ch.11 |
| Event Sourcing | DDIA Ch.11; FoSA |
| Outbox Pattern | DDIA Ch.11 |
| Inbox Pattern | DDIA Ch.11 |
| Change Data Capture (CDC) | DDIA Ch.11; DEC |

### caching

| Topic | Sources |
|---|---|
| Cache-Aside | SDI1 Ch.1; prim |
| Read-Through | prim |
| Write-Through | SDI1; prim |
| Write-Back (Write-Behind) | prim |
| Write-Around | prim |
| Refresh-Ahead | prim |
| Eviction Policies (LRU/LFU/FIFO/Random) | SDI1; prim |
| TTL | SDI1 |
| Cache Coherence | DDIA references; *supplement* |
| CDN Caching | SDI1 Ch.9; prim |
| Edge Caching | SDI1 Ch.9 |
| Distributed Caching | SDI1; DEC |
| Memcached | SDI1; DEC |
| Redis | SDI1; DEC |
| Thundering Herd / Cache Stampede | SDI1; SDI2 |
| Cache Penetration | SDI1 |
| Cache Invalidation | SDI1; DDIA |
| Negative Caching | SDI1 |

### reliability

| Topic | Sources |
|---|---|
| SLO / SLI / SLA | SWEG; prim |
| Error Budgets | SWEG |
| Toil | SWEG |
| Availability Math (9s, parallel vs series) | prim |
| Fail-Over (active-passive, active-active) | prim; FoSA |
| Incident Response | SWEG |
| Postmortems | SWEG |
| Blameless Culture | SWEG; MSE |
| Chaos Engineering | SWEG (brief); *supplement* |
| Observability | SWEG; SDI2 |
| Logs / Metrics / Distributed Traces | SWEG; SDI2 |
| USE Method | *supplement* (Brendan Gregg) |
| RED Method | *supplement* (Tom Wilkie) |
| Circuit Breakers | FoSA; MSE |
| Bulkheads | FoSA; MSE |
| Retries + Exponential Backoff + Jitter | SDI1; SDI2 |
| Rate Limiting | SDI1 Ch.4 |
| Token Bucket / Leaky Bucket | SDI1 Ch.4 |
| Idempotency | DDIA Ch.11; SDI2 (payment) |
| Graceful Degradation | SDI1; MSE |
| Health Checks | SDI1; SDI2 |
| Canary Releases | SWEG; MSE |
| Blue-Green Deployment | SWEG; MSE |
| Feature Flags | SWEG; MSE |

### architecture-patterns

| Topic | Sources |
|---|---|
| Monolith | FoSA Ch.10; SWEG |
| Modular Monolith | FoSA; MSE |
| Microservices | FoSA Ch.17; SWEG; MSE; SDI1 |
| Service-Oriented Architecture (SOA) | FoSA Ch.13 |
| Event-Driven Architecture | FoSA Ch.14 |
| Hexagonal (Ports & Adapters) | MSE; *supplement* |
| Onion Architecture | MSE; *supplement* |
| Layered Architecture | FoSA Ch.10 |
| Microkernel | FoSA Ch.12 |
| Service-Based | FoSA Ch.13 |
| Space-Based | FoSA Ch.15 |
| Pipeline Architecture | FoSA Ch.11 |
| CQRS | FoSA; *supplement* |
| Saga Pattern | FoSA Ch.14; SDI2 |
| API Gateway | SDI1; FoSA; SDI2 |
| BFF (Backend for Frontend) | FoSA |
| Service Mesh | SDI2; FoSA |
| Strangler Fig | FoSA; MSE |
| Sidecar | FoSA |
| Ambassador | FoSA |
| Anti-Corruption Layer | FoSA; MSE |
| Domain-Driven Design | FoSA Ch.8 |
| Bounded Contexts | FoSA Ch.8 |
| Architecture Characteristics ("-ilities") | FoSA Ch.4 |
| Architecture Decision Records (ADRs) | FoSA Ch.19 |
| Architecture Fitness Functions | FoSA Ch.6 |

### design-patterns

| Topic | Sources |
|---|---|
| Strategy | HFDP Ch.1 |
| Observer | HFDP Ch.2 |
| Decorator | HFDP Ch.3 |
| Factory / Abstract Factory | HFDP Ch.4 |
| Singleton | HFDP Ch.5 |
| Command | HFDP Ch.6 |
| Adapter / Facade | HFDP Ch.7 |
| Template Method | HFDP Ch.8 |
| Iterator / Composite | HFDP Ch.9 |
| State | HFDP Ch.10 |
| Proxy | HFDP Ch.11 |
| Compound Patterns (MVC) | HFDP Ch.12 |
| Chain of Responsibility | HFDP appendix |
| Visitor | HFDP appendix |
| Memento | HFDP appendix |
| Builder | HFDP appendix |
| Prototype | HFDP appendix |
| SOLID Principles | HFDP; MSE |
| Single Responsibility | HFDP; MSE |
| Open-Closed | HFDP; MSE |
| Liskov Substitution | HFDP; MSE |
| Interface Segregation | HFDP; MSE |
| Dependency Inversion | HFDP; MSE |
| Dependency Injection | HFDP; MSE |
| Composition over Inheritance | HFDP Ch.1; MSE |
| Program to Interface | HFDP |
| Encapsulate What Varies | HFDP |

### software-engineering

| Topic | Sources |
|---|---|
| Testing Pyramid | SWEG Ch.11; MSE |
| Unit Testing | SWEG Ch.12 |
| Integration Testing | SWEG Ch.14 |
| End-to-End Testing | SWEG Ch.14 |
| Test Doubles (Mock, Stub, Fake, Spy) | SWEG Ch.13 |
| Property-Based Testing | MSE; *supplement* |
| Code Review | SWEG Ch.9 |
| CI/CD | SWEG Ch.23; MSE |
| Trunk-Based Development | SWEG; MSE |
| Monorepos | SWEG Ch.16 |
| Build Systems (Bazel) | SWEG Ch.18 |
| Dependency Management | SWEG Ch.21 |
| Deprecation | SWEG Ch.15 |
| Large-Scale Change | SWEG Ch.22 |
| Hyrum's Law | SWEG |
| Beyoncé Rule | SWEG |
| Refactoring (overview) | RF; MSE |
| Code Smells | RF Ch.3 |
| Key Refactorings (Extract Function, Inline, Move Method, Rename, etc.) | RF Ch.6–12 |
| Technical Debt | SWEG; MSE; FoSA |
| First Principles of SE | MSE |
| Iterative & Incremental | MSE |
| Empirical Feedback | MSE |
| Modularity / Cohesion / Coupling | MSE; SWEG |
| Information Hiding | MSE |

### data-engineering

| Topic | Sources |
|---|---|
| Batch vs Stream Processing | DDIA Ch.10–11; DEC |
| MapReduce | DDIA Ch.10; DEC |
| ETL vs ELT | DEC |
| Data Warehouse | DEC; DDIA Ch.3 |
| Data Lake | DEC |
| Lakehouse | DEC; *supplement* |
| Lambda Architecture | DDIA Ch.11; DEC |
| Kappa Architecture | DDIA Ch.11; DEC |
| Stream Processing Frameworks (Spark, Flink, Storm) | DDIA Ch.10–11; DEC |
| Dimensional Modeling | *supplement* (Kimball); DEC |
| Star Schema | DDIA Ch.3 (brief); DEC |
| Snowflake Schema | DEC |
| Slowly Changing Dimensions | *supplement* |
| CDC | DDIA Ch.11; DEC |
| Data Quality | DEC |
| Data Lineage | DEC |
| Orchestration | DEC |
| DAGs | DEC |
| Airflow | DEC |
| dbt | *supplement* |
| Schema Evolution | DDIA Ch.4 |

### ml-systems

| Topic | Sources |
|---|---|
| Feature Stores | DEC; SDI2 (ML chapters) |
| Training Pipelines | DEC; SDI2 |
| Model Serving | SDI2; DEC |
| Online vs Batch Inference | SDI2; DEC |
| Model Registry | DEC |
| Model Monitoring | DEC; SDI2 |
| Data Drift | DEC; SDI2 |
| Concept Drift | DEC; SDI2 |
| A/B Testing for ML | SDI2 |
| MLOps | DEC |
| Embedding Stores / Vector DBs | SDI2; *supplement* |
| RAG Systems | *supplement* |
| Recommendation Systems | SDI2 (YouTube) |
| Ranking Systems | SDI2 |
| Search Ranking | SDI2 |

### system-design-interview

| Topic | Sources |
|---|---|
| 4-Step Interview Framework | SDI1 (intro); prim |
| Back-of-Envelope Calculations | SDI1 Ch.2; prim Appendix |
| Latency Numbers Every Programmer Should Know | prim Appendix; SDI1 |
| Powers of Two Reference | prim Appendix |
| Use Cases & Constraints | SDI1; prim |
| High-Level Design Sketching | SDI1; prim |
| Scaling the Design | SDI1; prim |
| Design URL Shortener / Pastebin | SDI1 Ch.8; prim |
| Design Rate Limiter | SDI1 Ch.4 |
| Design Consistent Hashing System | SDI1 Ch.5 |
| Design Key-Value Store | SDI1 Ch.6 |
| Design Unique ID Generator | SDI1 Ch.7 |
| Design Web Crawler | SDI1 Ch.9; prim |
| Design Notification System | SDI1 Ch.10 |
| Design News Feed / Twitter Timeline | SDI1 Ch.11; prim |
| Design Chat System | SDI1 Ch.12 |
| Design Search Autocomplete | SDI1 Ch.13 |
| Design YouTube | SDI1 Ch.14 |
| Design Google Drive | SDI1 Ch.15 |
| Design Proximity Service / Yelp | SDI2 Ch.1 |
| Design Nearby Friends | SDI2 Ch.2 |
| Design Google Maps | SDI2 Ch.3 |
| Design Distributed Message Queue | SDI2 Ch.4 |
| Design Metric Monitoring | SDI2 Ch.5 |
| Design Ad Click Aggregation | SDI2 Ch.6 |
| Design Hotel Reservation | SDI2 Ch.7 |
| Design Distributed Email | SDI2 Ch.8 |
| Design S3-like Storage | SDI2 Ch.9 |
| Design Real-Time Gaming Leaderboard | SDI2 Ch.10 |
| Design Payment System | SDI2 Ch.11 |
| Design Digital Wallet | SDI2 Ch.12 |
| Design Stock Exchange | SDI2 Ch.13 |

### case-studies

| Topic | Sources |
|---|---|
| Apache Kafka | DDIA Ch.11; DEC |
| Apache Cassandra | DDIA Ch.5–6; DEC |
| Amazon DynamoDB | DDIA Ch.5–6 |
| Google Spanner | DDIA Ch.9 |
| Google Bigtable | DDIA Ch.3; DEC |
| Apache HBase | DEC; DDIA mentions |
| MongoDB | DDIA Ch.2; DEC |
| Redis | SDI1; DEC |
| Memcached | SDI1; DEC |
| Google GFS / HDFS | DDIA Ch.10; DEC |
| Google MapReduce (paper) | DDIA Ch.10 |
| Apache Spark | DDIA Ch.10–11; DEC |
| Apache Flink | DDIA Ch.11; DEC |
| Apache Storm | DDIA Ch.11; DEC |
| Apache Zookeeper | DDIA Ch.9; DEC |
| Google Chubby | DDIA Ch.9 (mention) |
| Google Dapper | prim; *supplement* |
| Apache Airflow | DEC |
| Amazon Aurora | *supplement* |
| Facebook TAO | *supplement* |

---

## Ingestion Campaign (dependency-ordered)

Each ingest is **one operation** producing 4–10 concept pages. Listed sources are primary; secondary refs may be pulled during ingest. Phases are dependency-ordered: later phases assume earlier ones exist as `[[wikilinks]]`.

### Phase 1 — Foundations

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 1 | **Networking Primitives** | TCP, UDP, HTTP/1.1, HTTP/2, DNS, TLS overview | SDI1; prim |
| 2 | **Database Fundamentals** | Relational vs Non-Relational, ACID, BASE, KV / Document / Wide-Column / Graph stores, Denormalization | DDIA Ch.2; SDI1; prim |
| 3 | **System Trade-offs** | Performance vs Scalability, Latency vs Throughput, Availability vs Consistency, CAP, PACELC, Consistency Models | DDIA Ch.9; SDI1; prim |
| 4 | **Encoding & Schema Evolution** | Encoding overview, Protobuf, Avro, Thrift, JSON, Schema Evolution, Backward/Forward Compatibility | DDIA Ch.4 |

### Phase 2 — Core Distributed Patterns

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 5 | **Replication** | Replication, Leader-Based, Multi-Leader, Leaderless, Sync vs Async, Replication Lag, Read-Your-Writes, Monotonic Reads | DDIA Ch.5; SDI1 Ch.6 |
| 6 | **Partitioning & Sharding** | Partitioning, Consistent Hashing, Hot Partitions, Rebalancing, Federation | DDIA Ch.6; SDI1 Ch.5 |
| 7 | **Quorums & Anti-Entropy** | Quorums, Anti-Entropy / Read Repair, Gossip Protocols, CRDTs | DDIA Ch.5 |
| 8 | **Failure Detection & Clocks** | Failure Detection, Heartbeats, Phi Accrual, Logical Clocks, Lamport, Vector Clocks, Hybrid Logical Clocks | DDIA Ch.8 |
| 9 | **Consensus** | Consensus, Paxos, Raft, Leader Election, 2PC, Split Brain | DDIA Ch.9 + supplement |

### Phase 3 — Storage & Transactions

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 10 | **Storage Engines** | B-Trees, LSM-Trees, SSTables, Compaction, WAL, Bloom Filters | DDIA Ch.3 |
| 11 | **Indexes & Queries** | Indexes (Primary, Secondary, Composite, Covering), Query Optimization, Joins, Materialized Views, OLTP vs OLAP, Columnar Storage | DDIA Ch.3 |
| 12 | **Transactions** | Transactions, Isolation Levels, Snapshot Isolation, MVCC, 2PL, SSI, Serializability | DDIA Ch.7 |
| 13 | **Distributed Transactions** | Distributed Transactions, Idempotency, Sagas (intro) | DDIA Ch.7, Ch.9; FoSA |

### Phase 4 — Communication

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 14 | **Messaging Fundamentals** | Message Queues, Task Queues, Pub/Sub, Delivery Guarantees, Backpressure, DLQs | DDIA Ch.11; SDI1; prim |
| 15 | **Streaming & Event-Driven** | Event Streams, Kafka, Topics/Partitions, Consumer Groups, Event Sourcing, Outbox, CDC | DDIA Ch.11; DEC |
| 16 | **Caching** | Cache strategies (cache-aside, write-through/back/around, read-through, refresh-ahead), Eviction policies, CDN caching, Thundering Herd, Cache Penetration, Invalidation | SDI1; prim |
| 17 | **Load Balancing & CDNs** | LB (L4/L7), Algorithms, Reverse Proxy, CDN (push/pull), Anycast (mention) | SDI1; prim |

### Phase 5 — Architecture

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 18 | **Monolith → Microservices** | Monolith, Modular Monolith, SOA, Microservices, Service-Based | FoSA Ch.10–17; SWEG |
| 19 | **Architecture Styles** | Layered, Hexagonal, Onion, Microkernel, Space-Based, Pipeline, Event-Driven | FoSA Ch.10–15 |
| 20 | **Cross-Cutting Patterns** | API Gateway, BFF, Service Mesh, Sidecar, Ambassador, Strangler Fig, Anti-Corruption Layer | FoSA; SDI1; SDI2 |
| 21 | **CQRS, Saga, DDD** | CQRS, Saga (full), DDD, Bounded Contexts, Architecture Characteristics, ADRs, Fitness Functions | FoSA Ch.4, 8, 14, 19 |

### Phase 6 — Reliability

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 22 | **SRE Foundations** | SLO, SLI, SLA, Error Budgets, Toil, Availability Math, Fail-Over | SWEG; prim |
| 23 | **Observability** | Observability, Logs, Metrics, Distributed Tracing, USE Method, RED Method | SWEG; SDI2 |
| 24 | **Resilience Patterns** | Circuit Breakers, Bulkheads, Retries + Backoff + Jitter, Rate Limiting (Token/Leaky), Idempotency, Graceful Degradation, Health Checks | SDI1 Ch.4; FoSA; MSE |
| 25 | **Deployment & Operations** | Canary Releases, Blue-Green, Feature Flags, Incident Response, Postmortems, Chaos Engineering | SWEG; MSE |

### Phase 7 — Engineering Excellence

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 26 | **Testing** | Testing Pyramid, Unit/Integration/E2E, Test Doubles, Property-Based Testing | SWEG Ch.11–14; MSE |
| 27 | **CI/CD & Release** | CI/CD, Trunk-Based Development, Monorepos, Build Systems, Dependency Management | SWEG; MSE |
| 28 | **Refactoring** | Refactoring overview, Code Smells, Key Refactorings, Technical Debt | RF; MSE |
| 29 | **Engineering Practices** | Code Review, Deprecation, Large-Scale Change, Hyrum's Law, Beyoncé Rule | SWEG |
| 30 | **First Principles** | First Principles, Iterative & Incremental, Empirical Feedback, Modularity, Cohesion, Coupling, Information Hiding | MSE |

### Phase 8 — Design Patterns

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 31 | **GoF Creational + Structural** | Factory, Abstract Factory, Singleton, Builder, Prototype, Adapter, Facade, Decorator, Proxy, Composite | HFDP |
| 32 | **GoF Behavioral** | Strategy, Observer, Template Method, Iterator, State, Command, Chain of Responsibility, Visitor, Memento, Compound (MVC) | HFDP |
| 33 | **SOLID & Principles** | SOLID (all 5), Dependency Injection, Composition over Inheritance, Program to Interface, Encapsulate What Varies | HFDP; MSE |

### Phase 9 — Data Engineering

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 34 | **Batch Processing** | MapReduce, Spark, Joins in batch, Materialized views in batch, ETL vs ELT | DDIA Ch.10; DEC |
| 35 | **Stream Processing** | Stream Processing, Lambda, Kappa, CDC | DDIA Ch.11; DEC |
| 36 | **Data Storage Patterns** | Data Warehouse, Data Lake, Lakehouse, Dimensional Modeling, Star/Snowflake Schema | DEC + supplement |
| 37 | **Orchestration & Pipelines** | Orchestration, DAGs, Airflow, Data Quality, Data Lineage | DEC |

### Phase 10 — ML Systems

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 38 | **ML System Foundations** | Feature Stores, Training Pipelines, Model Serving (Online/Batch), Model Registry | DEC; SDI2 |
| 39 | **ML Operations** | Model Monitoring, Data Drift, Concept Drift, A/B Testing for ML, MLOps | DEC; SDI2 |
| 40 | **Specialized ML Systems** | Recommendation, Ranking, Search Ranking, Embedding Stores, Vector DBs, RAG | SDI2 + supplement |

### Phase 11 — Interview Mastery

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 41 | **Interview Methodology** | 4-Step Framework, Back-of-Envelope, Latency Numbers, Powers of Two, Use Cases & Constraints, High-Level Design, Scaling | SDI1; prim |
| 42 | **Classic Designs I** | URL Shortener, Rate Limiter, Consistent Hashing System, Unique ID Generator | SDI1 |
| 43 | **Classic Designs II** | Key-Value Store, Web Crawler, Notification System, News Feed, Chat | SDI1 |
| 44 | **Classic Designs III** | Search Autocomplete, YouTube, Google Drive | SDI1 |
| 45 | **Advanced Designs I** | Proximity Service, Nearby Friends, Google Maps, Distributed Message Queue | SDI2 Ch.1–4 |
| 46 | **Advanced Designs II** | Metric Monitoring, Ad Click Aggregation, Hotel Reservation, Distributed Email | SDI2 Ch.5–8 |
| 47 | **Advanced Designs III** | S3-like Storage, Real-Time Leaderboard, Payment System, Digital Wallet, Stock Exchange | SDI2 Ch.9–13 |

### Phase 12 — Case Studies

| # | Ingest | Target concepts | Sources |
|---|---|---|---|
| 48 | **Storage Systems** | Bigtable, HBase, MongoDB, Cassandra, DynamoDB, Spanner | DDIA; DEC |
| 49 | **Streaming & Coordination** | Kafka, Spark, Flink, Storm, Zookeeper, Chubby | DDIA; DEC |
| 50 | **Infrastructure** | GFS, HDFS, MapReduce (Google paper), Memcached, Redis, Airflow, Dapper | DDIA; DEC; prim |

---

## Coverage notes

Topics valuable to the wiki but **thin in canon**. Supplement during ingestion:

- **Paxos / Raft internals** — DDIA describes consensus at a high level. Supplement: *Raft paper* (Ongaro & Ousterhout, 2014), *Paxos Made Simple* (Lamport).
- **TCP congestion control, HTTP/3 / QUIC, BGP, mTLS** — networking lower-level details are thin. Supplement: *High Performance Browser Networking* (Grigorik).
- **Dimensional modeling** — *The Data Warehouse Toolkit* (Kimball).
- **Distributed tracing internals** — Google *Dapper* paper.
- **Chaos engineering** — Netflix Chaos Monkey docs, *Chaos Engineering* (Rosenthal & Jones).
- **USE method** — Brendan Gregg's blog. **RED method** — Tom Wilkie's blog.
- **RAG systems, vector DBs** — too recent for canon books. Vendor docs + current papers.
- **CQRS, Hexagonal/Onion** — referenced in FoSA/MSE but not deeply derived. Supplement: Vaughn Vernon, Mark Seemann.

Pages built primarily from supplements are flagged in their body with a `> ⚠ Supplemented` note, so the reader knows what's canonical vs derived.

---

## How this drives Ingest

Per [[schema]] §6.1, each Ingest operation:

1. Looks up the topic above to find primary sources.
2. Synthesizes across them, citing each.
3. Produces 4–10 pages in the target area folder.
4. Updates [[index]] and [[log]].
5. Promotes status of any page that crossed a threshold.

When a topic is `*supplement needed*`, the page is created as a `stub` with the supplement noted in the body — making it a candidate for a future targeted ingest with external material.

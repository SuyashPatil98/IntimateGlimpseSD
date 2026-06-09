---
type: meta
subtype: index
last_updated: 2026-06-09
generated_by: tools/build_index.py
---

# System Design Wiki — Index

A unified knowledge base on system design, distilled from canonical sources. Organized by **concept**, never by book or author.

**293 concept pages** across 14 areas · 287 mature+ (98%).

> Auto-generated from the live vault — do not hand-edit. Rebuild with `tools/build_index.py`.

→ Read [[schema]] first if you're contributing. → See [[log]] for the change record.

Legend:  ★ comprehensive · ● mature · ◐ draft · ○ stub

---

### Distributed Systems · `distributed-systems/`

How nodes coordinate without shared memory over unreliable networks.

**43 pages** · 42 mature+

● [[Anti-Entropy]] · ● [[CAP Theorem]] · ● [[Causal Consistency]] · ● [[Consensus]] · ● [[Consistency Models]] · ● [[Consistent Hashing]] · ● [[CRDTs]] · ● [[Distributed Transactions]] · ● [[Eventual Consistency]] · ● [[Failure Detection]] · ● [[Federation]] · ● [[Gossip Protocols]] · ● [[Heartbeats]] · ● [[Hinted Handoff]] · ● [[Hot Partitions]] · ● [[Hybrid Logical Clocks]] · ● [[Lamport Timestamps]] · ● [[Latency vs Throughput]] · ● [[Leader Election]] · ● [[Leader-Based Replication]] · ● [[Leaderless Replication]] · ● [[Linearizability]] · ● [[Logical Clocks]] · ● [[Monotonic Reads]] · ● [[Multi-Leader Replication]] · ● [[PACELC]] · ● [[Partitioning]] · ● [[Paxos]] · ● [[Performance vs Scalability]] · ● [[Phi Accrual Failure Detector]] · ● [[Quorums]] · ● [[Raft]] · ● [[Read Repair]] · ● [[Read-Your-Writes Consistency]] · ● [[Rebalancing]] · ● [[Replication]] · ● [[Replication Lag]] · ● [[Sequential Consistency]] · ● [[Split Brain]] · ● [[Synchronous vs Asynchronous Replication]] · ● [[Two-Phase Commit]] · ● [[Vector Clocks]] · ○ [[Three-Phase Commit]]

### Databases · `databases/`

Storage engines, transaction systems, query execution.

**29 pages** · 28 mature+

● [[ACID]] · ● [[B-Trees]] · ● [[BASE]] · ● [[Bloom Filters]] · ● [[Columnar Storage]] · ● [[Compaction]] · ● [[Denormalization]] · ● [[Document Database]] · ● [[Graph Database]] · ● [[Indexes]] · ● [[Isolation Levels]] · ● [[Joins]] · ● [[Key-Value Store]] · ● [[LSM-Trees]] · ● [[Materialized Views]] · ● [[MVCC]] · ● [[NoSQL]] · ● [[OLTP vs OLAP]] · ● [[Query Optimization]] · ● [[Relational Databases]] · ● [[Serializability]] · ● [[Serializable Snapshot Isolation]] · ● [[Snapshot Isolation]] · ● [[SSTables]] · ● [[Transactions]] · ● [[Two-Phase Locking]] · ● [[WAL]] · ● [[Wide-Column Store]] · ○ [[Time-Series Databases]]

### Networking · `networking/`

The protocols and primitives every system runs on.

**15 pages** · 12 mature+

● [[Anycast]] · ● [[DNS]] · ● [[HTTP-1.1]] · ● [[HTTP-2]] · ● [[L4 vs L7 Load Balancing]] · ● [[Load Balancing]] · ● [[Load Balancing Algorithms]] · ● [[Reverse Proxy]] · ● [[Service Discovery]] · ● [[TCP]] · ● [[TLS]] · ● [[UDP]] · ◐ [[gRPC]] · ◐ [[HTTP-3]] · ◐ [[REST]]

### Storage · `storage/`

Durability, encoding, persistent state.

**8 pages** · 7 mature+

● [[Avro]] · ● [[Backward and Forward Compatibility]] · ● [[Encoding Formats]] · ● [[JSON]] · ● [[Protobuf]] · ● [[Schema Evolution]] · ● [[Thrift]] · ◐ [[Object Storage]]

### Messaging · `messaging/`

Asynchronous communication, decoupling.

**13 pages** · 13 mature+

● [[Backpressure]] · ● [[CDC]] · ● [[Consumer Groups]] · ● [[Dead Letter Queues]] · ● [[Delivery Guarantees]] · ● [[Event Sourcing]] · ● [[Event Streams]] · ● [[Kafka Architecture]] · ● [[Message Queues]] · ● [[Outbox Pattern]] · ● [[Pub-Sub]] · ● [[Task Queues]] · ● [[Topics and Partitions]]

### Caching · `caching/`

Trading consistency for latency, deliberately.

**7 pages** · 7 mature+

● [[Cache Invalidation]] · ● [[Cache Stampede]] · ● [[Cache Strategies]] · ● [[Caching]] · ● [[CDN Caching]] · ● [[Distributed Caching]] · ● [[Eviction Policies]]

### Reliability · `reliability/`

Keeping systems alive under failure.

**27 pages** · 27 mature+

● [[Availability Math]] · ● [[Blue-Green Deployment]] · ● [[Bulkheads]] · ● [[Canary Releases]] · ● [[Chaos Engineering]] · ● [[Circuit Breakers]] · ● [[Distributed Tracing]] · ● [[Error Budgets]] · ● [[Fail-Over]] · ● [[Feature Flags]] · ● [[Graceful Degradation]] · ● [[Health Checks]] · ● [[Idempotency]] · ● [[Incident Response]] · ● [[Logs]] · ● [[Metrics]] · ● [[Observability]] · ● [[Postmortems]] · ● [[Rate Limiting]] · ● [[RED Method]] · ● [[Retries]] · ● [[SLA]] · ● [[SLI]] · ● [[SLO]] · ● [[Toil]] · ● [[Token Bucket]] · ● [[USE Method]]

### Architecture Patterns · `architecture-patterns/`

System-level shapes.

**26 pages** · 26 mature+

● [[ADRs]] · ● [[Ambassador]] · ● [[Anti-Corruption Layer]] · ● [[API Gateway]] · ● [[Architecture Characteristics]] · ● [[Architecture Fitness Functions]] · ● [[BFF]] · ● [[Bounded Contexts]] · ● [[CQRS]] · ● [[Domain-Driven Design]] · ● [[Event-Driven Architecture]] · ● [[Hexagonal Architecture]] · ● [[Layered Architecture]] · ● [[Microkernel]] · ● [[Microservices]] · ● [[Modular Monolith]] · ● [[Monolith]] · ● [[Onion Architecture]] · ● [[Pipeline Architecture]] · ● [[Saga Pattern]] · ● [[Service Mesh]] · ● [[Service-Based]] · ● [[Sidecar]] · ● [[SOA]] · ● [[Space-Based Architecture]] · ● [[Strangler Fig]]

### Design Patterns · `design-patterns/`

Code-level reusable solutions.

**20 pages** · 20 mature+

● [[Adapter]] · ● [[Builder]] · ● [[Chain of Responsibility]] · ● [[Command]] · ● [[Composite]] · ● [[Composition over Inheritance]] · ● [[Decorator]] · ● [[Dependency Injection]] · ● [[Facade]] · ● [[Factory]] · ● [[Iterator]] · ● [[Observer]] · ● [[Program to Interface]] · ● [[Proxy]] · ● [[Singleton]] · ● [[SOLID]] · ● [[State]] · ● [[Strategy]] · ● [[Template Method]] · ● [[Visitor]]

### Software Engineering · `software-engineering/`

How engineering organizations build and maintain software.

**25 pages** · 25 mature+

● [[Beyoncé Rule]] · ● [[Build Systems]] · ● [[CI-CD]] · ● [[Code Review]] · ● [[Code Smells]] · ● [[Dependency Management]] · ● [[Deprecation]] · ● [[Empirical Feedback]] · ● [[End-to-End Testing]] · ● [[First Principles of SE]] · ● [[Hyrum's Law]] · ● [[Information Hiding]] · ● [[Integration Testing]] · ● [[Iterative & Incremental]] · ● [[Key Refactorings]] · ● [[Large-Scale Change]] · ● [[Modularity]] · ● [[Monorepos]] · ● [[Property-Based Testing]] · ● [[Refactoring]] · ● [[Technical Debt]] · ● [[Test Doubles]] · ● [[Testing Pyramid]] · ● [[Trunk-Based Development]] · ● [[Unit Testing]]

### Data Engineering · `data-engineering/`

Moving and transforming data at scale.

**19 pages** · 19 mature+

● [[Apache Airflow]] · ● [[Apache Flink]] · ● [[Apache Spark]] · ● [[Batch Processing]] · ● [[DAGs]] · ● [[Data Lake]] · ● [[Data Lineage]] · ● [[Data Quality]] · ● [[Data Warehouse]] · ● [[Dimensional Modeling]] · ● [[ETL vs ELT]] · ● [[Kappa Architecture]] · ● [[Lakehouse]] · ● [[Lambda Architecture]] · ● [[MapReduce]] · ● [[Orchestration]] · ● [[Star Schema]] · ● [[Stream Processing]] · ● [[Stream Windowing]]

### Ml Systems · `ml-systems/`

Productionizing machine learning.

**15 pages** · 15 mature+

● [[A-B Testing for ML]] · ● [[Concept Drift]] · ● [[Data Drift]] · ● [[Feature Stores]] · ● [[MLOps]] · ● [[Model Monitoring]] · ● [[Model Registry]] · ● [[Model Serving]] · ● [[Online vs Batch Inference]] · ● [[RAG]] · ● [[Ranking Systems]] · ● [[Recommendation Systems]] · ● [[Search Ranking]] · ● [[Training Pipelines]] · ● [[Vector Databases]]

### System Design Interview · `system-design-interview/`

Interview methodology, common design problems, quick-reference.

**29 pages** · 29 mature+

● [[4-Step Framework]] · ● [[Back-of-Envelope]] · ● [[Design Ad Click Aggregation]] · ● [[Design Chat System]] · ● [[Design Consistent Hashing System]] · ● [[Design Digital Wallet]] · ● [[Design Distributed Email]] · ● [[Design Distributed Message Queue]] · ● [[Design Google Drive]] · ● [[Design Google Maps]] · ● [[Design Hotel Reservation]] · ● [[Design Key-Value Store]] · ● [[Design Metric Monitoring]] · ● [[Design Nearby Friends]] · ● [[Design News Feed]] · ● [[Design Notification System]] · ● [[Design Payment System]] · ● [[Design Proximity Service]] · ● [[Design Rate Limiter]] · ● [[Design Real-Time Gaming Leaderboard]] · ● [[Design S3-like Storage]] · ● [[Design Search Autocomplete]] · ● [[Design Stock Exchange]] · ● [[Design Unique ID Generator]] · ● [[Design URL Shortener]] · ● [[Design Web Crawler]] · ● [[Design YouTube]] · ● [[Latency Numbers]] · ● [[Powers of 2]]

### Case Studies · `case-studies/`

End-to-end analyses of real-world systems.

**17 pages** · 17 mature+

● [[Airflow (case study)]] · ● [[Apache Kafka]] · ● [[Apache Storm]] · ● [[Bigtable]] · ● [[Cassandra]] · ● [[Chubby]] · ● [[Dapper]] · ● [[DynamoDB]] · ● [[GFS]] · ● [[HBase]] · ● [[HDFS]] · ● [[MapReduce (Google)]] · ● [[Memcached]] · ● [[MongoDB]] · ● [[Redis]] · ● [[Spanner]] · ● [[Zookeeper]]

---

_Regenerated 2026-06-09 from 293 live vault pages._

---
title: Vector Databases
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Indexes]]"]
related: ["[[Search Ranking]]", "[[RAG]]", "[[Recommendation Systems]]"]
builds_toward: ["[[RAG]]"]
sources:
  - Pinecone / Weaviate / Qdrant / Milvus docs
  - Malkov & Yashunin "Efficient and robust approximate nearest neighbor search using HNSW" (2018)
  - Johnson, Douze, Jégou "Billion-scale similarity search with GPUs" (FAISS, 2017)
  - Pgvector docs
tags: [ml-systems, vector-db, ann]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Vector Databases

## Executive Summary

A **vector database** stores high-dimensional vectors (embeddings) and supports **approximate nearest neighbor (ANN)** search at scale. They power semantic search, recommendation candidate generation, and RAG retrieval. The core algorithmic ingredient is an ANN index — HNSW, IVF, IVF-PQ, ScaNN — that trades exactness for $O(\log N)$ or sub-linear query time over billions of vectors.

## Why This Exists

Embedding-based retrieval needs "find me the K most similar vectors to this query" over corpora $\gg 10^9$. Exact nearest-neighbor scales linearly with N — untenable. ANN structures give query latency in single-digit milliseconds with high recall.

## Core Intuition

Brute-force nearest neighbor: compare query to every stored vector. ANN: precompute a graph or partitioning so we only compare to a small subset.

- **HNSW** — hierarchical small-world graph; navigation by greedy local search with layered shortcuts.
- **IVF** — cluster vectors with k-means; at query time, search nearest clusters only.
- **PQ (Product Quantization)** — compress vectors via quantized subspaces; comparisons on codes, not raw vectors.
- **IVF-PQ** — combine for billion-scale.

## Internal Mechanics

**HNSW:**
- Build: insert each vector with random level; connect to nearest neighbors at each layer.
- Query: descend from top layer; at each level, greedy search until local optimum; refine at bottom.
- Trade-offs: M (graph degree), efConstruction, efSearch tune recall vs speed.

**IVF-PQ:**
- Build: cluster all vectors into N centroids; assign each vector to its centroid; quantize residuals via PQ.
- Query: find nprobe nearest centroids; ADC distance to PQ codes; refine top-K.
- Scales to billions on a single node.

**Storage:**
- Vector (raw or PQ-encoded), payload (id + metadata), filter index for metadata.
- Hybrid filters (e.g., "ANN search but only docs after 2025"): challenging; pre-filter, post-filter, or filter-aware indexes (Weaviate, Qdrant).

**Updates:**
- Inserts/deletes harder than reads; HNSW supports incremental insert, deletes via tombstones; periodic rebuild.

## Architecture Diagrams

```
   text/image ──► embedding model ──► vector ─────┐
                                                  ▼
                                  ┌───────────────────┐
   query ──► query embedding ────►│  Vector DB        │── top-K ids ──► payload lookup
                                  │  (HNSW / IVF-PQ)  │
                                  └───────────────────┘
                                       + metadata filter
```

## Design Tradeoffs

**Recall vs latency:** higher efSearch / nprobe = better recall, slower query.

**Memory vs disk:** HNSW typically in-memory; IVF-PQ allows disk-resident.

**Specialized DB vs Postgres pgvector:** specialized (Pinecone, Weaviate, Qdrant, Milvus, Vespa) scale further and faster; pgvector keeps vectors next to relational data, simpler ops for moderate scale.

**Filter performance:** pre-filter shrinks candidates but breaks index efficiency; post-filter can return too few. Hybrid query planners are an active area.

**Multi-vector / late-interaction (ColBERT):** stores token-level embeddings per doc; 10–100× more vectors; specialized infra (Vespa, ColBERT-Vespa, custom).

## Real Production Examples

- **Pinecone** — managed; rapid growth post-2022 LLM wave.
- **Weaviate, Qdrant, Milvus** — open-source.
- **Vespa** — Yahoo/Verizon Media origin; powerful hybrid search.
- **FAISS** — library (Facebook); embedded in many systems.
- **Elasticsearch / OpenSearch** — added vector search on top of Lucene.
- **pgvector** — Postgres extension; popular for moderate scale.
- **Spotify ANNoy, ScaNN (Google)** — earlier ANN libraries.

## Misconceptions

- **"Vector DB = LLM database."** They predate LLMs; recommendation systems used them since the 2010s.
- **"Higher dimensions = better."** Past a point, curse of dimensionality; latency/memory grow; recall harder.
- **"Cosine vs Euclidean is a big deal."** For normalized vectors, equivalent up to monotone transform.

## Failure Scenarios

- **Hotspot shard** — embedding distribution non-uniform; queries skew. Mitigation: balanced sharding by id.
- **Recall regression after bulk update** — index drift; need rebuild.
- **Filter + ANN mismatch** — filter rejects most ANN candidates; returned K << requested K.
- **Stale embeddings** — model updated; old vectors in different space; partial rebuild required.
- **Memory blow-up** — billions of FP32 vectors at d=1024 = 4 TB; quantize.

## Interview Perspective

- *"Design RAG over 100M documents."* → embedding pipeline + vector DB (HNSW/IVF-PQ) + metadata filter + reranker.
- *"HNSW vs IVF-PQ — when?"* → HNSW for in-memory, low-latency, moderate scale; IVF-PQ for billion-scale, memory/disk balance.
- *"How do you handle metadata filters in vector search?"* → pre-filter, post-filter, or filter-aware indexes; trade-off recall vs latency.
- Staff-level: ANN theory, recall tuning, sharding strategy, multi-tenant isolation.

## Related Concepts

- [[Search Ranking]] — vector DBs are the retrieval substrate.
- [[RAG]] — vector DB is the R in RAG.
- [[Recommendation Systems]] — embedding candidate gen.
- [[Indexes]] — vector indexes are a class of database index.
- [[Caching]] — query-result caching for popular embeddings.

## Practical Engineering Heuristics

- **Quantize for >100M vectors** — PQ / IVF-PQ.
- **Choose HNSW for low-latency in-memory** workloads.
- **Tune nprobe / efSearch** to your recall target; over-tuning wastes compute.
- **Test with realistic filters** — vendor benchmarks rarely include them.
- **Plan re-embedding** — model updates require full re-index.
- **Multi-vector reranking** (ColBERT) for accuracy ceiling on small candidate sets.

## Active Recall Questions

What does ANN stand for in the context of vector databases?::Approximate Nearest Neighbor — trades exactness for sub-linear query time.

How does HNSW work at a high level?::Hierarchical multi-layer graph; greedy search from top layer down, refined at the bottom layer; tunable via M, efConstruction, efSearch.

What is IVF-PQ?::Inverted File Index with Product Quantization — cluster vectors into centroids (IVF) and compress residuals via product quantization (PQ); scales to billions.

Why is metadata filtering hard with ANN?::Filters break the index's neighborhood assumptions; pre-filter shrinks the index, post-filter may yield too few results; filter-aware indexes try to bridge both.

What is the curse of dimensionality in ANN?::As dimensionality grows, distances concentrate (all points become similarly distant); index structures lose their advantage; recall degrades.

When should you use pgvector vs a specialized vector DB?::Pgvector for moderate scale (~millions) when keeping vectors alongside relational data simplifies ops; specialized DBs for >100M, sub-10ms latency, or advanced features (multi-vector, hybrid).

What's a common reason to do a full re-index?::Embedding model update (new vector space), index drift after many updates, or schema change requiring different filter structures.

## Feynman Test

Explain to a database engineer why a B-tree index on a 1536-dim vector column doesn't work — what's algorithmically different about nearest-neighbor search?

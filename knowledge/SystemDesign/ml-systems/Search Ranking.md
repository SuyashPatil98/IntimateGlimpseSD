---
title: Search Ranking
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Ranking Systems]]"]
related: ["[[Recommendation Systems]]", "[[Vector Databases]]", "[[RAG]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.13 (Autocomplete); SDI vol 2
  - Manning, Raghavan, Schütze "Introduction to Information Retrieval" (2008)
  - Elastic / Lucene docs (BM25)
  - Google "ColBERT" (Khattab & Zaharia, 2020)
tags: [ml-systems, search, ranking, ir]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Search Ranking

## Executive Summary

**Search ranking** orders documents by relevance to a user query. Modern search blends classical lexical retrieval (BM25 / inverted index) with **semantic retrieval** (dense embeddings via [[Vector Databases]]) and learned ranking (LTR / cross-encoders). The system mirrors recommendation: cheap retrieval narrows the corpus; expensive ranking re-scores; both have improved 10× with transformer embeddings.

## Why This Exists

A query yields thousands of candidate documents from an index. The ranker decides what appears in slots 1–10, which is what users see. Improvements in ranking compound: even small NDCG gains move click-through and satisfaction.

## Core Intuition

Three-stage pipeline:
1. **Retrieve** — lexical (BM25) + semantic (dense embedding ANN) candidates, fused.
2. **Re-rank** — cross-encoder transformer scores each (query, doc) pair (slow but accurate; only on top ~100).
3. **Final layer** — business rules, personalization, diversification.

The dominance of dual-encoder retrieval + cross-encoder reranking has reshaped search since 2019 (BERT in Google Search 2019; ColBERT 2020).

## Internal Mechanics

**Lexical retrieval (BM25):**
$$\text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t,d)(k_1+1)}{f(t,d) + k_1(1 - b + b \cdot |d|/\text{avgdl})}$$
where $f(t,d)$ is term frequency, $|d|$ is doc length, $k_1$ and $b$ are tunable. Robust, fast, no training; the long-standing baseline.

**Semantic retrieval (dense):**
- Bi-encoder: separate transformers encode query and doc into vectors.
- ANN index ([[Vector Databases]]) returns top-K by cosine similarity.
- Captures synonyms, paraphrase, intent.

**Hybrid retrieval:** linearly combine BM25 + dense scores, or RRF (Reciprocal Rank Fusion). Hybrid is best in practice — neither alone wins.

**Cross-encoder re-ranking:**
- Concatenate (query, doc), feed through a transformer, output relevance score.
- Far more accurate than bi-encoder (full attention between query and doc tokens).
- Far more expensive — runs only on top-K candidates.

**ColBERT-style late interaction:**
- Encode independently like bi-encoder but score via MaxSim over per-token embeddings.
- Closes much of the cross-encoder gap at fraction of cost.

## Design Tradeoffs

**Lexical vs semantic vs hybrid:** lexical is exact, semantic is fuzzy; hybrid covers both query types. Hybrid wins almost always in practice.

**Bi-encoder vs cross-encoder:** bi-encoder fast (precomputed doc vectors), cross-encoder accurate. Use cross-encoder only at re-rank stage.

**Indexing cost:** semantic search requires embedding every document and maintaining an ANN index; storage and refresh cost is real.

**Personalization vs general relevance:** personalized ranking helps engagement but harms diversity and creates filter bubble risks.

## Real Production Examples

- **Google** — BERT (2019), MUM (2021), gen-AI overviews (2024) layered atop lexical core.
- **Bing** — early transformer adopter for ranking.
- **Elastic, OpenSearch** — BM25 default; vector search added.
- **Pinecone, Weaviate, Qdrant, Vespa** — vector / hybrid search engines.
- **Amazon Product Search** — heavy LTR with embeddings.
- **Etsy, Airbnb, Booking** — domain-specific ranking with structured + textual features.

## Misconceptions

- **"Embeddings replace BM25."** They don't — lexical wins on exact-match queries (model numbers, code symbols). Hybrid is the answer.
- **"Bigger model = better search."** Up to a point; bi-encoder quality saturates, re-ranker has higher ceiling.
- **"Vector search is fast."** Not at recall@1000 over billions of docs without careful ANN (HNSW, IVF-PQ) and sharding.

## Failure Scenarios

- **Query intent mismatch** — semantic retrieves "similar" docs the user didn't want; lexical anchor lost.
- **Stale embeddings** — doc updated, embedding not refreshed.
- **Long-tail queries** — model trained on head queries; long-tail performance bad.
- **Vector DB sharding hotspot** — embedding distribution non-uniform; some shards overloaded.

## Interview Perspective

- *"Design a search system over 1B documents."* → hybrid (BM25 + dense ANN) retrieval → cross-encoder reranker on top-100 → business layer. Discuss embedding pipeline, ANN index, sharding, freshness.
- *"How does BERT improve search?"* → semantic understanding of query and document, captures paraphrase; used in retrieval (dual encoder) and ranking (cross encoder).
- *"BM25 vs vector — when which?"* → BM25 for exact-match-heavy domains (code, products by SKU), vector for semantic (Q&A, support docs); hybrid for general.
- Staff-level: discuss query understanding (intent classification), zero-shot retrieval, RAG integration.

## Related Concepts

- [[Ranking Systems]] — general LTR framework.
- [[Recommendation Systems]] — sibling architecture.
- [[Vector Databases]] — substrate for dense retrieval.
- [[RAG]] — search ranking is the retrieval component of RAG.
- [[Caching]] — query-level caches dramatically reduce load.

## Practical Engineering Heuristics

- **Hybrid retrieval by default** — RRF or learned linear combination.
- **Cross-encoder only at re-rank.**
- **Refresh embeddings** on doc update; stale index is silent quality loss.
- **A/B every change** — small ranker tweaks often regress in unexpected slices.
- **Cache the head** — top queries are heavily skewed.
- **Watch query-length / language slices.**

## Active Recall Questions

What is the canonical multi-stage search pipeline?::Retrieve (lexical + semantic) → re-rank (cross-encoder) → final business rules / personalization.

Why use hybrid retrieval instead of pure semantic?::BM25 wins on exact-match (codes, names); semantic wins on paraphrase/intent; hybrid covers both query types and consistently outperforms either alone.

What is the difference between bi-encoder and cross-encoder?::Bi-encoder encodes query and doc independently → fast retrieval via ANN. Cross-encoder concatenates and uses full attention → far more accurate but too slow for retrieval; used only at re-rank.

What is BM25?::A probabilistic lexical scoring function — TF-IDF refined with document length normalization (b) and term-frequency saturation (k1). The long-standing baseline for search.

What is ColBERT?::Late-interaction retrieval — encode independently like bi-encoder but score via MaxSim over per-token embeddings, capturing most cross-encoder quality at much lower cost.

Name two reasons stale embeddings hurt search.::Doc updates not reflected in retrieval, ANN index drifts from current text, document deletes leave dangling vectors.

What is Reciprocal Rank Fusion (RRF)?::A simple, parameter-free fusion: each ranked list contributes 1/(k + rank) for each doc; sum across lists. Robust hybrid combination.

## Feynman Test

Explain to a backend engineer why "just use Elasticsearch" doesn't fully solve modern search — what specific weaknesses does pure lexical retrieval have?

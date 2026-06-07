---
title: RAG
aliases: ["Retrieval-Augmented Generation"]
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Vector Databases]]", "[[Search Ranking]]"]
related: ["[[Model Serving]]", "[[Caching]]"]
builds_toward: []
sources:
  - Lewis et al. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (NeurIPS 2020)
  - Karpukhin et al. "Dense Passage Retrieval for Open-Domain QA" (EMNLP 2020)
  - LangChain / LlamaIndex docs
  - Eugene Yan blog — "RAG patterns"
  - Anthropic / OpenAI guides on grounded generation
tags: [ml-systems, llm, rag, retrieval]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# RAG

> ⚠ Supplemented — concept post-dates canon; built from recent papers and vendor docs.

## Executive Summary

**Retrieval-Augmented Generation (RAG)** is a pattern where an LLM is grounded on external documents retrieved at query time, rather than relying solely on parametric knowledge. The standard flow: embed the query → retrieve top-K passages from a [[Vector Databases|vector DB]] → concatenate them into the LLM prompt → generate. RAG addresses LLM hallucination, freshness, and domain specialization — and creates new failure modes around retrieval quality and prompt construction.

## Why This Exists

LLMs are powerful but: (1) frozen at training cutoff; (2) hallucinate facts; (3) lack proprietary/domain knowledge; (4) can't cite sources. Fine-tuning addresses some of this but is expensive and slow. RAG lets a fixed model leverage fresh, citable, domain-specific text via retrieval.

## Core Intuition

The LLM is the reasoner; the retriever is the librarian. The librarian fetches relevant pages; the reasoner reads them and answers. The quality of the answer is bounded by both — bad retrieval = bad answer even with a perfect LLM.

## Internal Mechanics

**Canonical pipeline:**
1. **Ingest** — chunk documents (200–1000 tokens), embed each chunk, store in vector DB with metadata.
2. **Query** — embed user query; retrieve top-K chunks (often hybrid: BM25 + dense).
3. **Rerank** — optional cross-encoder pass on top-K to improve precision.
4. **Compose prompt** — system prompt + chunks (cited) + user query.
5. **Generate** — LLM produces grounded answer with citations.

**Chunking strategies:**
- Fixed-size with overlap.
- Semantic chunking (paragraph / sentence boundaries).
- Hierarchical (chunk + parent doc).
- Element-aware for structured docs (tables, code).

**Advanced patterns:**
- **HyDE (Hypothetical Document Embedding)** — generate a hypothetical answer, embed that, retrieve.
- **Multi-query retrieval** — LLM rewrites query into N variants; union of results.
- **Self-querying** — LLM extracts metadata filters from natural-language query.
- **Multi-hop / agentic RAG** — iterative retrieve-reason-retrieve.
- **GraphRAG (Microsoft 2024)** — knowledge-graph-aware retrieval over entity relations.

**Evaluation:**
- **Retrieval**: Recall@K, MRR — did we get the right doc?
- **Generation**: faithfulness (grounded in retrieved docs), answer correctness, citation accuracy.
- **End-to-end**: ragas / TruLens / human eval.

## Architecture Diagrams

```
ingest:  docs → chunker → embedder → [Vector DB]

query:   user query ──► embedder ──► retrieve top-K
                            │              │
                            └─► (HyDE)     ▼
                                    (optional) cross-encoder rerank
                                           │
                                           ▼
                                  prompt assembly
                                  ┌────────────┐
                                  │   LLM      │── grounded answer
                                  └────────────┘
                                       │
                                       └─► citations to chunks
```

## Design Tradeoffs

**Context window vs precision:** stuffing K=20 chunks (50k tokens) helps recall but degrades attention; reranking + smaller K usually better.

**Chunk size:** small chunks = precise retrieval, fragmented context; large chunks = coherent context, noisy retrieval. Hybrid (small for retrieval, parent for context) works well.

**Latency:** retrieval + rerank + LLM gen end-to-end commonly 1–5 s; caching head queries helps.

**Cost:** embedding ingestion (per doc), retrieval (per query), generation (per token). LLM tokens dominate.

**Hallucination is reduced, not eliminated:** model can still ignore or misuse retrieved context.

## Real Production Examples

- **GitHub Copilot Workspace, Chat** — repo-aware RAG.
- **Notion AI Q&A** — workspace-scoped RAG.
- **Bing Chat / Perplexity / You.com** — web-search-grounded RAG.
- **Customer support bots** — RAG over knowledge base.
- **Internal "ask the docs" tools** — every large eng org by 2025.
- **Anthropic / OpenAI grounded modes** — provider-managed retrieval.

## Misconceptions

- **"RAG eliminates hallucination."** It reduces but doesn't eliminate; model can still confabulate, misuse retrieved context, or fail to find the right chunk.
- **"Just embed everything."** Chunking strategy, metadata, and retrieval recipe matter as much as embeddings.
- **"Bigger LLM = better RAG."** Retrieval quality bounds the system; a perfect LLM can't answer from wrong context.

## Failure Scenarios

- **Retrieval recall miss** — right doc not in top-K; LLM hallucinates plausible-sounding wrong answer.
- **Context dilution** — too many chunks; relevant signal lost in noise.
- **Stale embeddings** — docs updated, embeddings not refreshed; outdated answers.
- **Citation drift** — LLM cites the wrong chunk or invents citations.
- **Prompt injection** — adversarial content in retrieved doc hijacks generation.
- **Domain mismatch** — embedding model trained on web text, used on legal/medical; recall poor.

## Interview Perspective

- *"Design a RAG system for a company's internal docs."* → chunking strategy, embedding model choice, vector DB (hybrid), rerank, prompt design, citation, evaluation harness.
- *"How do you evaluate RAG?"* → retrieval (Recall@K, MRR) + generation (faithfulness, correctness) + end-to-end (human / ragas).
- *"Why doesn't RAG eliminate hallucination?"* → LLM can ignore retrieved context, mis-bind facts to entities, or fabricate citations.
- Staff-level: agentic RAG, GraphRAG, prompt injection defense, eval methodology.

## Related Concepts

- [[Vector Databases]] — the retrieval substrate.
- [[Search Ranking]] — same retrieve+rerank techniques.
- [[Model Serving]] — LLM endpoint.
- [[Caching]] — query and embedding caches reduce cost.

## Practical Engineering Heuristics

- **Hybrid retrieval (BM25 + dense)** — pure dense underperforms on exact-match queries.
- **Rerank top 50 → top 5** for precision.
- **Cite chunks** explicitly; UI shows sources.
- **Cache aggressively** — popular queries dominate.
- **Refresh embeddings on doc update** — staleness is silent failure.
- **Build an eval set** — track retrieval and generation quality separately.
- **Defend against prompt injection** in retrieved content.

## Active Recall Questions

What does RAG stand for?::Retrieval-Augmented Generation.

What is the canonical RAG pipeline?::Ingest (chunk + embed docs into vector DB); query (embed → retrieve top-K → optional rerank → prompt LLM with context → generate with citations).

Why doesn't RAG fully eliminate hallucination?::The LLM can ignore retrieved context, mis-bind facts, or fabricate citations even when the right doc is present.

What is HyDE?::Hypothetical Document Embedding — the LLM generates a hypothetical answer to the query; that hypothetical is embedded and used for retrieval, improving recall on abstract queries.

Why is hybrid (BM25 + dense) retrieval the practical default?::Dense alone misses exact-match queries (codes, names); lexical alone misses paraphrase; hybrid covers both.

Name two RAG-specific failure modes.::Retrieval miss (right doc not in top-K), context dilution (too many chunks), prompt injection from retrieved content, citation fabrication, stale embeddings.

What's the role of chunk size in RAG?::Smaller chunks improve retrieval precision but fragment context; larger chunks improve context but reduce retrieval recall; hybrid (retrieve small, expand to parent) works well.

## Feynman Test

Explain to an executive why "we have a vector DB, we have RAG" is overconfident — what specifically can still go wrong, and which of those will hurt user trust most?

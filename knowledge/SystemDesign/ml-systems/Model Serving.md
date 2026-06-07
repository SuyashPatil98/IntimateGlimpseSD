---
title: Model Serving
area: ml-systems
status: mature
difficulty: advanced
prerequisites: ["[[Training Pipelines]]", "[[Feature Stores]]", "[[Load Balancing]]"]
related: ["[[Online vs Batch Inference]]", "[[Model Registry]]", "[[Model Monitoring]]"]
builds_toward: ["[[MLOps]]"]
sources:
  - SDI vol 2 (ML chapters)
  - Data Engineering Cookbook (Kretz)
  - NVIDIA Triton Inference Server docs
  - TensorFlow Serving docs
  - Seldon / KServe docs
tags: [ml-systems, serving, inference]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Model Serving

## Executive Summary

**Model serving** exposes a trained model as a callable service — typically a REST/gRPC endpoint that takes input features and returns predictions under a latency SLO. The serving layer handles loading, batching, hardware acceleration (GPU), versioning, traffic splitting (A/B, canary), and observability. Reference implementations: TensorFlow Serving, NVIDIA Triton, TorchServe, KServe, Seldon, BentoML; cloud-managed: SageMaker Endpoints, Vertex AI Endpoints.

## Why This Exists

A `model.pkl` on disk is useless until it answers requests at scale. Serving is harder than ordinary microservices because: (1) model artifacts are large (MB–GB); (2) inference is compute-heavy (GPU economics); (3) batching dramatically improves throughput; (4) many models per service is the norm; (5) train-serve consistency must be preserved at the request boundary.

## Core Intuition

A serving stack is three layers:
1. **Model runtime** — the framework that executes the graph (TF, PyTorch, ONNX, TensorRT).
2. **Serving server** — process that loads versions, batches, routes, and serves protocols (gRPC/HTTP).
3. **Platform** — orchestration, autoscaling, traffic split, observability (K8s + KServe / Seldon).

## Internal Mechanics

**Hot paths:**
- **Request → feature lookup → predict → return.** Feature lookup hits the online feature store (≤10 ms budget).
- **Dynamic batching**: server holds incoming requests up to N ms or batch size B, then runs them as one tensor — GPU throughput multiplier.
- **Model warmup**: first inference after load is slow (kernel compile, lazy init); warmup requests primed at deploy.

**Versioning & rollout:**
- Multiple model versions loaded concurrently; traffic split (e.g., 95% v1 / 5% v2 canary).
- Atomic version swap; old version remains warm during rollback window.
- **Shadow traffic**: candidate model receives copies of prod requests without affecting responses; compare outputs offline.

**Hardware:**
- CPU vs GPU tradeoff — GPU helps batched, large models; tiny models stay on CPU.
- TensorRT / ONNX Runtime for graph optimization (op fusion, quantization).
- **Quantization** (INT8) cuts latency 2-4× with small accuracy loss.

**Autoscaling:**
- HPA on QPS or GPU utilization.
- Cold start is brutal (load 5GB model, warm up GPU); keep min replicas > 0.

## Design Tradeoffs

**Embedded model vs RPC microservice:**
- Embedded (model in same process as service): low latency, no network hop; couples deploy lifecycle and language; one model per service.
- Separate inference service: clean separation, reusable, but +5–20 ms network. Standard for >1 model or shared GPU.

**Online vs batch:** see [[Online vs Batch Inference]].

**Multi-model serving:** one server hosts many models, multiplexing GPUs (Triton). Higher utilization; worse isolation.

**Costs:** GPUs are expensive; idle GPU = burning money. Batching, multi-model serving, and autoscaling matter for unit economics.

## Real Production Examples

- **Google TF Serving** — original; gRPC + batching.
- **Meta** — embedded PyTorch in C++ services; ranking models.
- **Uber Michelangelo Serving** — internal.
- **Netflix** — Polynote + custom serving; recommender models served from JVM.
- **NVIDIA Triton** — multi-framework, multi-model, GPU-optimized.
- **KServe (formerly KFServing)** — K8s-native, supports serverless inference.
- **Cloud**: SageMaker, Vertex AI, Azure ML endpoints.

## Misconceptions

- **"Just put the model behind Flask."** Works for demos; misses batching, versioning, GPU sharing, autoscaling. Don't ship to prod.
- **"GPU is always faster."** Wrong for small models with single-request workloads; CPU + ONNX is often cheaper.
- **"Latency = inference time."** Inference is one piece; feature lookup, network, batching wait time, and serialization often dominate.

## Failure Scenarios

- **Cold start during scale-up** — model load takes 30 s; new replica serves errors. Mitigation: warmup hook, pre-loaded image cache.
- **Train-serve skew at feature boundary** — features computed differently in serving vs training; metric regressions.
- **Silent model rot** — model serving but predictions drifting from training distribution. Mitigation: monitor input/output distributions.
- **OOM under load** — batching too aggressive; container OOM-killed. Mitigation: tune batch size + memory limits.
- **Version pinning bug** — config points to v3 but v2 still loaded; rollback ineffective.

## Interview Perspective

- *"Design a serving system for a 5 GB ranking model with p99 < 50 ms."* → Triton on GPU, dynamic batching, ONNX-converted model, KServe-managed traffic split, warmup hook.
- *"How do you canary a model?"* → traffic split (1% → 10% → 50% → 100%) with KPIs; shadow traffic compares predictions offline.
- *"Why is feature parity (train vs serve) so hard?"* → two code paths, two languages often, distinct latency budgets; resolved by feature store.
- Staff-level: discuss model multiplexing, GPU economics, and serverless inference (cold-start tradeoff).

## Related Concepts

- [[Online vs Batch Inference]] — choice of serving topology.
- [[Model Registry]] — source of artifacts that serving loads.
- [[Feature Stores]] — online store provides serving-time features.
- [[Model Monitoring]] — required to detect serving-time issues.
- [[Canary Releases]] — applies to models; KPI is prediction quality not just error rate.
- [[Load Balancing]] — serving fleets sit behind a load balancer.

## Practical Engineering Heuristics

- **Set explicit latency SLO** — design backward from it.
- **Always batch** when QPS allows it.
- **Always warm up** new replicas before adding to LB.
- **Shadow-test** big model changes before canary.
- **Monitor input distribution**, not only error rate — drift catches issues metrics miss.
- **Quantize** for inference unless you've measured accuracy loss is unacceptable.
- **Track GPU utilization as a primary SLO** — idle GPU is a cost incident.

## Active Recall Questions

What three layers make up a typical model-serving stack?::Model runtime (TF/PyTorch/ONNX/TensorRT), serving server (TF Serving/Triton/TorchServe), platform (K8s/KServe/Seldon).

What is dynamic batching and why is it critical for GPU serving?::The server holds incoming requests up to a window, then runs them as one tensor; amortizes GPU launch cost and dramatically increases throughput.

What is shadow traffic in model deployment?::Sending production request copies to a candidate model without using its responses, to compare predictions offline before promoting.

Why are cold starts especially painful for ML serving?::Loading multi-GB models + GPU warmup can take tens of seconds; meanwhile new replicas serve errors or timeouts.

When is GPU not the right choice for inference?::Small models, single-request workloads, or low QPS — CPU + ONNX Runtime is often cheaper and similarly fast.

What is quantization and what does it cost?::Reducing weight/activation precision (INT8 from FP32) for 2-4× speedup; small (often <1%) accuracy degradation.

Why does feature lookup latency matter in the serving budget?::It's part of the total p99; a 50 ms SLO with 30 ms feature lookup leaves only 20 ms for inference.

## Feynman Test

Explain to a backend engineer why "deploy the model behind a Flask app" gets a senior ML engineer to roll their eyes — list the production concerns missing from that approach.

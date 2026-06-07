---
type: roadmap
area: reliability
generated: 2026-06-04
status: active
---

# Reliability & SRE — Learning Roadmap

> Auto-generated from the prereq DAG. 27 core concepts + 7 foundations + 7 downstream applications. Estimated **29.8 hours** total (18.1h core).

## How to use this roadmap

1. Walk Phase 0 first if any of those concepts feel shaky.
2. In Phase 1, study one concept per session: read → write a Feynman summary → drill the recall cards.
3. After Phase 1, drill the area's Anki deck end-to-end before moving to Phase 2.
4. Track progress in Notion (Roadmaps DB) — this file is just the spec.

## Phase 0 — Foundation (cross-area prerequisites)

These come from other areas but are required for the reliability & sre path. If you've internalized them already, skip ahead.

- [ ] [[Monolith]] — *beginner*
- [ ] [[CAP Theorem]] — *intermediate*
- [ ] [[Consistency Models]] — *intermediate*
- [ ] [[Modular Monolith]] — *intermediate*
- [ ] [[Microservices]] — *intermediate*
- [ ] [[Replication]] — *intermediate*
- [ ] [[Failure Detection]] — *intermediate*

## Phase 1 — Core Reliability & SRE (in dependency order)

Topologically sorted: prereqs always before dependents. Ties broken by difficulty.

- [ ] [[Blue-Green Deployment]] — *beginner*
- [ ] [[Feature Flags]] — *beginner*
- [ ] [[Health Checks]] — *beginner*
- [ ] [[Toil]] — *beginner*
- [ ] [[Availability Math]] — *intermediate*
- [ ] [[Bulkheads]] — *intermediate*
- [ ] [[Canary Releases]] — *intermediate*
- [ ] [[Circuit Breakers]] — *intermediate*
- [ ] [[Fail-Over]] — *intermediate*
- [ ] [[Graceful Degradation]] — *intermediate*
- [ ] [[Idempotency]] — *intermediate*
- [ ] [[Incident Response]] — *intermediate*
- [ ] [[Observability]] — *intermediate*
- [ ] [[Logs]] — *beginner*
- [ ] [[Metrics]] — *intermediate*
- [ ] [[Postmortems]] — *intermediate*
- [ ] [[Rate Limiting]] — *intermediate*
- [ ] [[RED Method]] — *intermediate*
- [ ] [[Retries]] — *intermediate*
- [ ] [[SLI]] — *intermediate*
- [ ] [[SLO]] — *intermediate*
- [ ] [[SLA]] — *beginner*
- [ ] [[Error Budgets]] — *intermediate*
- [ ] [[Token Bucket]] — *intermediate*
- [ ] [[USE Method]] — *intermediate*
- [ ] [[Chaos Engineering]] — *advanced*
- [ ] [[Distributed Tracing]] — *advanced*

## Phase 2 — Applications & case studies

Pages from other areas that build directly on reliability & sre concepts. Tackle these to see the concepts applied at scale.

- [ ] [[Latency vs Throughput]] — *beginner*
- [ ] [[Design Rate Limiter]] — *intermediate*
- [ ] [[A/B Testing for ML]] — *advanced*
- [ ] [[Dapper]] — *advanced*
- [ ] [[Design Metric Monitoring]] — *advanced*
- [ ] [[Design Payment System]] — *advanced*
- [ ] [[Model Monitoring]] — *advanced*

## Recall practice

After each phase, drill the Anki deck for **`reliability`** (filter `deck:SystemDesign::reliability`). Cards are tagged by concept name; you can scope to specific concepts via `tag:concept::Cache_Strategies` etc.

## Track progress

Open the **Roadmaps** database in Notion → this roadmap's row → check off concepts as you reach Mastered status. Time-spent and confidence rollups compute automatically.

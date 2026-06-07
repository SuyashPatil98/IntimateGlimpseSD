---
title: Task Queues
area: messaging
status: mature
difficulty: beginner
prerequisites: ["[[Message Queues]]"]
related: ["[[Message Queues]]", "[[Backpressure]]", "[[Dead Letter Queues]]"]
sources:
  - SDI vol 1
  - system-design-primer
tags: [messaging, queues, async]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Task Queues

## Executive Summary

A **task queue** is a specialization of [[Message Queues]] for **background job execution**: each message represents a unit of work (send email, resize image, generate report). Workers pull tasks, execute them, ack on success. Task queues add features beyond generic queues: **scheduled execution, priorities, retries with backoff, task chaining, results storage**. Common implementations: **Celery (Python), Sidekiq (Ruby), BullMQ (Node), Resque, AWS SQS + custom workers, Temporal (workflow + task)**.

## Why This Exists

Web requests should return quickly. Long-running work (email, video transcoding, report generation) must happen asynchronously. Task queues are the canonical async-work primitive: web tier enqueues; workers process. Failures are retryable; spikes absorbed; results stored.

## Core Intuition

A web app's request handler shouldn't render a video. It should write "render this video" to a task list and return. A separate process reads the list and does the work. The user gets immediate response; the work happens in background.

## Internal Mechanics

**Operations:**
- `enqueue(task, args)` — web tier schedules work.
- `worker.run()` — workers process queue.
- `ack` — work succeeded; remove from queue.
- `retry` — failed; reschedule with backoff.

**Features beyond generic queue:**
- **Scheduled / delayed tasks** — "run this in 1 hour."
- **Periodic tasks** — cron-like.
- **Priorities** — high vs low.
- **Retry policies** — exponential backoff, max attempts.
- **Task chaining / DAGs** — task B runs after task A.
- **Result backends** — store outcome (success/fail/value).

## Real Production Examples

- **Celery** (Python) — most popular Python task queue; brokers RabbitMQ/Redis.
- **Sidekiq** (Ruby) — Redis-backed; threaded workers; very efficient.
- **BullMQ** (Node) — Redis-backed; modern.
- **AWS SQS + Lambda** — serverless task processing.
- **Temporal** — full workflow orchestration with task execution.
- **Airflow** — task DAGs; data pipelines.

## Design Tradeoffs

**Benefits:**
- Fast web responses; work happens async.
- Retry built in.
- Spikes absorbed.
- Scaling horizontal (add workers).

**Costs:**
- Eventual consistency — work isn't done when request returns.
- Result delivery is async (poll or push).
- Operational: broker + workers.

## Interview Perspective

**Common questions:**
- "Why use a task queue?" → Async background work; fast web responses; retry support.
- "What if a task fails?" → Retry with backoff; eventually to DLQ for inspection.
- "Celery vs SQS+Lambda?" → Celery: more features (chains, results), more ops. SQS+Lambda: serverless, simpler ops.

**Senior-level:**
- Task queues that promise exactly-once are lying; consumer idempotency is required.
- Scheduled tasks should be idempotent — duplicate firing happens.
- Long-running tasks need separate concerns: progress tracking, cancellation, timeouts.

**Common mistakes:**
- Putting too much in synchronous request paths.
- Not implementing idempotency in task workers.
- Tasks that depend on shared mutable state without coordination.

## Related Concepts

- [[Message Queues]] — the underlying primitive.
- [[Backpressure]] — when worker can't keep up.
- [[Dead Letter Queues]] — for unprocessable tasks.

## Misconceptions

- **"Task queues = background work, no thought needed."** Idempotency, retry storms, DLQ all matter.
- **"Workers are stateless."** Often have local state (DB connections, file handles).
- **"Retry forever."** Always cap retries; DLQ the rest.

## Failure Scenarios

- **Retry storm** under transient failures.
- **Poison tasks** stuck on retry.
- **Worker memory leak** under continuous load.
- **Result store grows unbounded.**

## Practical Engineering Heuristics

- **Make tasks idempotent.**
- **Use exponential backoff** for retries.
- **Cap retries** (e.g., 5 attempts).
- **Use DLQ** for failed tasks.
- **Monitor queue depth and worker health.**

## Active Recall Questions

What's a task queue?::Specialization of message queue for background job execution. Adds retries, scheduling, priorities, chains, results.

When use a task queue?::When work shouldn't block a web request (email, transcoding, reports). Decouple synchronous response from async work.

Why must task workers be idempotent?::Tasks may be retried; same task may execute multiple times. Effects must be idempotent.

What's a poison task?::A task that keeps failing on every retry. Eventually moved to DLQ for inspection.

Name three task queue systems.::Celery, Sidekiq, BullMQ, AWS SQS + Lambda, Temporal, Airflow.

What's exponential backoff?::Retry intervals double (or grow geometrically). 1s, 2s, 4s, 8s, ... Prevents retry storms.

## Feynman Test

Walk through "user uploads a video; we transcode it" using a task queue.

Why does a poorly-designed retry policy cause cascading system failures?

## Mastery Checklist

- **Explain** task queues and their features.
- **Compare** task queue implementations.
- **Derive** appropriate retry/backoff policy.
- **Critique** non-idempotent task implementations.
- **Design** an async workflow with proper retry, DLQ, and monitoring.

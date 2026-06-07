---
title: Pub-Sub
area: messaging
status: mature
difficulty: intermediate
prerequisites: ["[[Message Queues]]"]
related: ["[[Message Queues]]", "[[Event Streams]]", "[[Event-Driven Architecture]]", "[[Kafka Architecture]]"]
sources:
  - DDIA, Ch. 11
  - SDI vol 1
tags: [messaging, pubsub, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# Pub-Sub

## Executive Summary

**Publish/Subscribe (Pub/Sub)** is a messaging pattern where **producers (publishers) send messages to named channels (topics), and any number of consumers (subscribers) receive copies**. Unlike a queue (one message → one consumer), pub/sub fans out (one message → many consumers). The foundational pattern of **event-driven architectures, notification systems, and most streaming platforms**. Implementations: **Kafka, Google Cloud Pub/Sub, AWS SNS, Redis Pub/Sub, NATS, RabbitMQ exchanges**.

## Why This Exists

Many real systems have multiple interested parties for the same event: a user signup needs to trigger welcome email, analytics, CRM update, recommendation training. Synchronous calls couple the producer to every consumer. Pub/sub decouples: producer fires one event; the bus delivers to all interested subscribers. New consumers added without changing the producer.

## Core Intuition

A radio broadcast. The station (publisher) transmits on a frequency (topic). Anyone with a radio tuned in (subscriber) receives the broadcast. The station doesn't know or care who's listening. New listeners can join without changing the broadcast.

## Internal Mechanics

**Operations:**
- `publish(topic, msg)` — producer sends.
- `subscribe(topic)` — consumer expresses interest.
- `unsubscribe(topic)` — consumer stops.

**Delivery models:**
- **Push** — broker sends to subscribers as messages arrive.
- **Pull** — subscribers poll for new messages.

**Persistence:**
- **Transient pub/sub** (Redis Pub/Sub) — fire and forget; offline subscribers miss messages.
- **Persistent pub/sub** (Kafka, Cloud Pub/Sub) — messages retained; subscribers can replay.

**Topic vs channel patterns:**
- **Exact topic match** — `orders.created` → subscribers to `orders.created`.
- **Hierarchical wildcards** — `orders.*` subscribers receive `orders.created`, `orders.cancelled`.

## Architecture Diagrams

```
                  ┌────────────────┐
                  │  Topic: orders │
                  └────────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────┴──────┐  ┌───────┴──────┐  ┌──────┴──────┐
  │  Email svc  │  │ Analytics svc│  │ CRM update  │
  └─────────────┘  └──────────────┘  └─────────────┘
  
  Producer fires one event; all subscribers receive copies.
```

## Design Tradeoffs

**Benefits:**
- Decouples producers from consumers.
- Easy to add new consumers without producer changes.
- Natural fit for event-driven architecture.

**Costs:**
- Coordination of topic schemas across services.
- Subscriber lifecycle (joining/leaving, offline handling).
- Persistent variants are essentially distributed databases.

## Pub/Sub vs Queue

| Property | Queue | Pub/Sub |
|---|---|---|
| Message destination | One consumer | All subscribers |
| Use | Work distribution | Event distribution |
| Example | Background jobs | Domain events |

Many systems support both patterns (Kafka via consumer groups).

## Real Production Examples

- **Kafka** — persistent pub/sub + consumer groups + replay.
- **Google Cloud Pub/Sub** — managed pub/sub at scale.
- **AWS SNS** — pub/sub; fans out to SQS / Lambda / HTTP.
- **Redis Pub/Sub** — in-memory, transient.
- **NATS** — lightweight pub/sub; very fast.
- **RabbitMQ exchanges** — fanout, topic, headers exchanges.

## Interview Perspective

**Common questions:**
- "Pub/sub vs queue?" → Queue: one message → one consumer. Pub/sub: one message → many subscribers.
- "When use pub/sub?" → Domain events; notification fan-out; decoupling many consumers from producer.
- "Persistent vs transient pub/sub?" → Persistent (Kafka): replay possible. Transient (Redis Pub/Sub): offline subscribers miss.

**Senior-level:**
- Schema management is the underrated cost of pub/sub. Many consumers depend on the message shape; changes propagate.
- Event-driven architecture is essentially pub/sub at the domain level.
- The choice between queue and pub/sub is sometimes the same broker, configured differently (Kafka topics with consumer groups).

**Common mistakes:**
- Treating pub/sub as fire-and-forget when downstream needs reliability.
- Using transient pub/sub for events that must not be lost.
- Schema drift across topics — breaks consumers silently.

## Related Concepts

- [[Message Queues]] · [[Event Streams]] · [[Event-Driven Architecture]]
- [[Kafka Architecture]] — canonical persistent pub/sub.

## Misconceptions

- **"Pub/sub = real-time."** Latency varies by implementation.
- **"Adding a subscriber is free."** Each adds load; broker capacity matters.
- **"Pub/sub eliminates coupling."** Loose runtime coupling; schema coupling remains.

## Failure Scenarios

- **Subscriber offline misses messages** in transient pub/sub.
- **Schema mismatch** breaks subscriber.
- **Slow subscriber blocks others** in some implementations (RabbitMQ).
- **Topic explosion** (too many fine-grained topics) hurts operations.

## Practical Engineering Heuristics

- **Use Kafka** for persistent event streams.
- **Use SNS+SQS** for managed AWS fan-out.
- **Define topic schemas** in a registry; enforce evolution.
- **Use coarser topics** if subscriber filtering is cheap.

## Active Recall Questions

What's pub/sub?::Publish-subscribe pattern. Producers send to topics; multiple subscribers receive copies.

Pub/sub vs queue?::Queue: one message → one consumer (work distribution). Pub/sub: one message → many subscribers (event distribution).

Persistent vs transient pub/sub?::Persistent (Kafka): messages retained; offline subscribers receive on rejoin. Transient (Redis Pub/Sub): offline subscribers miss.

What's the AWS SNS+SQS pattern?::SNS publishes to topic; multiple SQS queues subscribe. Each subscriber processes independently with queue semantics.

Why does pub/sub require schema management?::Many consumers depend on message shape. Producer changes propagate; need registry or versioning.

Name three pub/sub systems.::Kafka, Google Pub/Sub, AWS SNS, Redis Pub/Sub, NATS, RabbitMQ.

## Feynman Test

Walk through user signup event: producer fires once, three consumers (email, analytics, CRM). What happens in each system?

Why does adding a new consumer in pub/sub require no producer changes — but schema discipline becomes more important?

## Mastery Checklist

- **Explain** pub/sub and its relation to queues.
- **Compare** persistent and transient pub/sub.
- **Derive** which pattern fits a given workflow.
- **Critique** silent schema drift in pub/sub topics.
- **Design** an event-driven architecture using pub/sub.

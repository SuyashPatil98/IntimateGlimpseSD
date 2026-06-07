---
title: Design Chat System
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[TCP]]", "[[Pub-Sub]]"]
related: ["[[Design Notification System]]", "[[Message Queues]]"]
builds_toward: []
sources:
  - 'SDI vol 1 Ch.12 (Design a Chat System)'
  - WhatsApp engineering blogs; Discord, Slack engineering
  - 'Erlang at WhatsApp 2014'
tags: [system-design-interview, classic-design, realtime]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Chat System

## Executive Summary

A chat system (WhatsApp, Slack, Discord) delivers messages in real time between users (1:1, group), with presence, read receipts, history, offline delivery, push notifications, and end-to-end encryption (optional). The signature design choice is **WebSockets for bidirectional realtime delivery**, with a session/connection layer and per-user message queue.

## Requirements

**Functional:** 1:1 + group chat, online/offline delivery, message history, read receipts, presence, push notifications, ordering.

**Non-functional:**
- 1 B users; 100 M concurrent connections.
- Message latency <1 s end-to-end.
- Persist history (years).
- High availability per region.

## High-Level Design

```
client ──WebSocket──► Gateway / Edge ──► Chat Service ──► Kafka / message Q
                            │                                │
                            │                                ▼
                            │                           Message DB (Cassandra)
                            ▼
                      Presence Service
                            │
                            ▼
              Push Notification (for offline users)
```

## Design Deep Dive

### Connections

- **WebSocket** (or long-lived HTTP/2) for full-duplex push.
- Each user maintains 1 connection to a gateway.
- 100 M concurrent connections → ~50 k connections per gateway → ~2000 gateways.

### Routing

- A user is *on* gateway G. To deliver to them, the system must find G.
- Maintain a **user → gateway** map in Redis (TTL = heartbeat interval).
- Sender → Chat Service → Redis lookup → forward via internal pub/sub to G → G pushes to user.

### Message storage

- Append-only message log per chat.
- [[Cassandra]] or similar wide-column store; partition by chat_id, cluster by timestamp.
- Cold history offloaded to cheaper storage.

### IDs and ordering

- [[Design Unique ID Generator|Snowflake]]-style ID embedding timestamp gives both unique ID and order within chat.

### Offline delivery

- If recipient offline, store undelivered messages in per-user inbox (Cassandra).
- On reconnect: client pulls undelivered; gateway streams new ones.

### Group chat

- For small groups (Slack channel, WhatsApp groups ≤ 1024): fanout-on-write to each member's inbox.
- For huge groups (Discord servers with millions): pub/sub topic per channel; clients subscribe.

### Presence

- Online state in Redis (TTL ~30 s, heartbeated).
- Status changes published to subscribers (friends).

### Read receipts

- Client sends ack with last-seen message id; updated per-user cursor.

### Push notifications

- If user offline / app backgrounded → push via FCM/APNs (see [[Design Notification System]]).

### Encryption

- Optional E2E (Signal Protocol, WhatsApp, Signal). Server never sees plaintext; complicates search, push content, web sessions.

## Failure Modes

- **Gateway crash** — clients reconnect; messages buffered server-side; undelivered messages picked up by new gateway.
- **Connection storm on outage** — backoff jitter; circuit breakers.
- **Out-of-order delivery** — client reorders by message timestamp/id.
- **Duplicate delivery** — idempotent client-side: dedup by message id.
- **Huge group fanout** — pub/sub topics, not per-member writes.

## Real Production

- **WhatsApp** — Erlang/OTP for connection multiplexing; XMPP-derived protocol; E2E via Signal.
- **Slack** — published "Flannel" edge cache for channel metadata; WebSockets.
- **Discord** — Elixir gateway; published Cassandra scaling for messages.
- **Telegram** — proprietary MTProto.
- **Signal** — E2E reference.

## Interview Talking Points

- WebSocket vs polling (justify).
- Connection-to-user mapping via Redis.
- Cassandra schema for messages (partition by chat, cluster by ts).
- 1:1 vs group vs huge-group fanout strategy.
- Offline delivery via inbox.
- Push notification integration for offline.

## Related Concepts

- [[TCP]] — WebSocket transport.
- [[Pub-Sub]] — intra-cluster routing.
- [[Design Notification System]] — push for offline.
- [[Message Queues]] — durable buffering.
- [[Cassandra]] — message storage.

## Active Recall Questions

Why WebSockets for chat instead of polling?::Server can push messages without client polling; bidirectional with very low latency overhead; single long-lived TCP connection reduces overhead at scale.

How do you route a message to a user given they're connected to one of thousands of gateways?::Maintain a user→gateway map in Redis (heartbeated TTL); sender service looks up, forwards to that gateway via internal pub/sub.

How would you store chat history at scale?::Cassandra (or wide-column store); partition by chat_id, cluster by message timestamp/id; cold history offloaded to object storage.

How does message ordering work without strict global ordering?::Snowflake-style IDs embed timestamps + node id; clients order by id within a chat; per-chat ordering is enough (no cross-chat ordering needed).

How is offline delivery handled?::Undelivered messages stored in a per-user inbox; on reconnect client pulls from inbox; new messages stream live.

How does a 1M-member group differ from a 10-member group?::Small group: fanout-on-write to each member's inbox. Huge group: pub/sub topic per channel; subscribers receive in real time; no per-message inbox fanout.

What's the offline push integration?::If destination user is offline, dispatch to notification system (FCM/APNs) so device receives a push; client app opens, fetches inbox.

## Feynman Test

Explain why "just use HTTP polling every 5 seconds" would be a poor design for 100 M concurrent users — what specifically breaks?

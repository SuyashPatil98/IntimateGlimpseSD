---
title: Design Notification System
area: system-design-interview
status: mature
difficulty: intermediate
prerequisites: ["[[Message Queues]]", "[[Pub-Sub]]"]
related: ["[[Retries]]", "[[Idempotency]]", "[[Rate Limiting]]", "[[Design News Feed]]"]
builds_toward: []
sources:
  - SDI vol 1 Ch.10 ("Design a Notification System")
  - Twilio / SendGrid / FCM / APNs docs
tags: [system-design-interview, classic-design, notifications]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Notification System

## Executive Summary

Send push / email / SMS notifications to billions of users with high throughput, per-user preferences, deliverability, deduplication, and rate limiting. Architecture: ingestion API → preference filter → per-channel queue → channel workers → 3rd-party providers (APNs, FCM, Twilio, SendGrid).

## Requirements

**Functional:** Send notifications via push (APNs/FCM), SMS, email. Per-user opt-in / channel preferences. Templated content. Scheduled / immediate delivery.

**Non-functional:**
- 100 M notifications/day → ~1200/s avg, peak ~10k/s.
- Latency: push <1 s; email tolerated minutes.
- Deliverability tracking and retries.
- No duplicate delivery.

## High-Level Design

```
producer service ──► Ingestion API ──► Validation + dedup
                                          │
                                          ▼
                                Per-user preference filter
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                       Push Q         Email Q           SMS Q
                          │               │                │
                       Push wrk       Email wrk         SMS wrk
                          │               │                │
                       APNs/FCM        SendGrid        Twilio
```

## Design Deep Dive

### Ingestion

- REST API: producers POST notification specs.
- Idempotency key per request → dedup.
- Validate template + audience.

### Preference filter

- User-level: do-not-disturb hours, channel opt-outs, frequency caps.
- Per-notification: respect user's per-category preferences.
- Filter early to avoid downstream waste.

### Templates

- Server-side rendering (Handlebars/Liquid). Localized strings, fallback locale.

### Per-channel queues (Kafka or SQS)

- Channel-specific QoS — push has tight latency; email is bulk.
- Workers can scale independently per channel.

### Channel workers

- Push: batch to FCM/APNs (multi-cast supported).
- SMS: Twilio API; respect carrier rate limits per country.
- Email: SendGrid / SES; bulk batch.

### Retries

- Exponential backoff with jitter for transient failures.
- Dead-letter queue after N attempts.
- Provider-specific error codes mapped to retry vs drop.

### Deliverability & tracking

- Provider webhooks → events into analytics pipeline.
- Track bounce rate, complaint rate, open rate.
- Auto-suppress hard-bounced emails.

### Rate limiting

- Per-user: frequency caps ("max 3 emails/day on this topic").
- Per-provider: respect their rate limits, avoid 429s.

## Failure Modes

- **Provider outage** — fail over to secondary provider (multi-vendor for SMS).
- **Push token rotation** — APNs/FCM token expires; track + refresh; suppress dead tokens.
- **Spam complaints** — leads to IP/domain reputation damage; auto-suppress complainers.
- **Burst on launch** — preference + rate filter must hold the line.
- **Duplicate delivery** — idempotency key per notification id (with provider-side dedup as last line).

## Real Production

- **Slack** — heavy push + email + in-app pipeline.
- **Uber** — millions of notifications/hour; Kafka-backed.
- **Pinterest, LinkedIn** — published notification platform design.
- **Twilio, SendGrid, FCM, APNs, Amazon SES/SNS** — providers.

## Interview Talking Points

- Channel-separated queues = independent scaling and SLOs.
- Idempotency-key dedup at ingestion.
- Provider-multivendor failover (especially SMS).
- Preference + frequency caps before queuing — early filter saves cost.
- Analytics loop for deliverability.

## Related Concepts

- [[Message Queues]] — backbone.
- [[Pub-Sub]] — topic-based fanout for some designs.
- [[Retries]] — channel-specific backoff.
- [[Idempotency]] — dedup at ingestion.
- [[Rate Limiting]] — per-user caps.
- [[Dead Letter Queues]] — undeliverable handling.

## Active Recall Questions

Why separate per-channel queues (push/email/SMS) instead of one?::Different SLOs (push <1s, email minutes), different provider semantics, independent scaling, and channel-specific retry / rate logic.

How do you prevent duplicate notification delivery?::Idempotency key per notification at ingestion (dedup window), plus channel-provider deduplication where supported.

What's the role of the preference filter, and where should it live?::Apply user opt-outs, do-not-disturb hours, frequency caps; place *before* queuing to avoid wasting downstream work.

Why use multi-vendor for SMS specifically?::Carrier coverage and rate-limits vary by region; deliverability is dramatically improved by routing to the right provider per destination; vendor outage failover.

How do you handle FCM/APNs token rotation?::Capture invalid-token responses; mark dead; refresh on next app login; suppress further sends.

What happens after N delivery retries?::Move to dead-letter queue, alert, suppress retries; for email, auto-suppress hard-bounced addresses.

What metric matters most for email deliverability?::Bounce + complaint rate — high values degrade sender reputation and inbox placement; auto-suppression of bouncers protects reputation.

## Feynman Test

Walk through what happens when a user toggles "do not disturb" — at which point in the pipeline is the filter checked, and what happens to in-flight notifications?

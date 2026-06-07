---
title: Design Distributed Email
area: system-design-interview
status: mature
difficulty: advanced
prerequisites: ["[[Object Storage]]", "[[Message Queues]]"]
related: ["[[Design Notification System]]"]
builds_toward: []
sources:
  - SDI vol 2 Ch.8 ("Distributed Email")
  - Gmail engineering blogs
  - RFC 5321 (SMTP), 3501 (IMAP)
tags: [system-design-interview, advanced-design, email]
created: 2026-06-03
last_reviewed: 2026-06-03
---

# Design Distributed Email

## Executive Summary

Design Gmail/Outlook: receive email via SMTP, store and index per-user mailboxes (PB-scale), spam-filter, serve via IMAP/POP/HTTP. The central pieces: **SMTP gateway**, **per-user storage with full-text search index**, **spam/abuse filtering**, **conversation threading**.

## Requirements

**Functional:** Receive/send email (SMTP), read inbox, search, label/folder, spam filter, attachments.

**Non-functional:** 1 B users, 10s of GB per power user, search <1 s, no message loss.

## High-Level Design

```
inbound SMTP ──► Gateway ──► Spam Filter ──► Inbox Q ──► Mail Service
                                                            │
                                                            ▼
                                                    Mail Storage (object/wide-col)
                                                            │
                                                            ▼
                                                    Search index (Elasticsearch / Lucene)
                                                            │
                                                            ▼
client (HTTP/IMAP) ──► Mail Service ◄────────────────
```

## Design Deep Dive

### Inbound

- SMTP gateway accepts mail from external MTAs.
- Validate (SPF/DKIM/DMARC), reject obviously bad.
- Queue for spam scoring.

### Spam filtering

- Heuristics + ML classifier + reputation systems.
- Quarantine high-confidence spam.
- User feedback (mark as spam) trains.

### Storage

- Per-message: headers + body + attachments.
- Attachments → object storage (S3-like); referenced from message.
- Message metadata → wide-column DB (Bigtable-style); partition by user.
- Threading: messages share `Message-ID` / `In-Reply-To` headers; group server-side.

### Search

- Full-text index per user (Elasticsearch / Lucene).
- Updated near-real-time as messages arrive.

### Outbound (SMTP send)

- Queue → batch → MTA pool → external SMTP delivery.
- Bounce handling.
- Reputation via DKIM signing + IP warming.

### Read serving

- HTTP API (Gmail) or IMAP/POP for clients.
- Per-user cache of recent / labeled messages.

### Labels / folders

- Tag-based (Gmail) or hierarchical (traditional).
- Implemented as denormalized indexes.

## Failure Modes

- **Spam surge** — autoscale spam filter; rate-limit IPs.
- **Storage hot user** — power user with millions of messages; sub-shard.
- **Search index drift** — re-index periodically.
- **Outbound deliverability** — IP reputation; sender warming.
- **DKIM/SPF break** — domain misconfig blocks legitimate mail.

## Real Production

- **Gmail** — Bigtable + Spanner + Borg + custom spam ML.
- **Outlook/Exchange** — Microsoft.
- **ProtonMail, Tutanota** — E2E encrypted email.
- **Postfix, Exim** — open-source MTA.
- **Sendgrid, Mailgun, Postmark, Amazon SES** — transactional senders.

## Interview Talking Points

- Storage split: metadata (wide-column) + attachments (object store) + index (Lucene).
- Spam filtering as ingest-side ML.
- SMTP gateway separation from app.
- Deliverability for outbound (DKIM/SPF/IP reputation).
- Search via per-user inverted index.

## Related Concepts

- [[Object Storage]] — attachments.
- [[Message Queues]] — inbound/outbound queues.
- [[Design Notification System]] — adjacent.
- [[Wide-Column Store]] — metadata.

## Active Recall Questions

How is mail storage typically split?::Metadata + headers in a wide-column DB (partitioned by user); attachments in object storage referenced by ID; full-text search in a per-user Lucene/Elasticsearch index.

What's the role of SPF, DKIM, DMARC?::Sender authentication standards — SPF (allowed sending IPs per domain), DKIM (cryptographic signature on headers/body), DMARC (policy combining SPF+DKIM); applied at ingress to reject spoofed mail.

Why partition mail storage by user?::Read locality (a user reads their own messages); makes per-user quotas and sub-sharding tractable; aligns with backup/restore unit.

How does email threading work?::Messages share `Message-ID` and reference each other via `In-Reply-To` + `References` headers; server groups by reference chain into conversations.

Why is outbound reputation important?::Receivers rate-limit or block IPs/domains with poor reputation (bounce rate, spam complaints); good sender practices (DKIM signing, warmed IPs) crucial for deliverability.

How is search implemented per-user?::Per-user inverted index (Lucene), updated near-real-time on new mail; queries hit only that user's index.

What happens to attachments on send?::Uploaded to object storage; message references attachment by ID; MTA fetches and serializes into MIME on outbound.

## Feynman Test

A 50 MB email arrives at Gmail. Walk through every component it touches between SMTP ingress and showing up in the user's web UI.

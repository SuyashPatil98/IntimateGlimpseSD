---
title: HTTP/3
aliases: ["HTTP/3", "QUIC"]
area: networking
status: draft
difficulty: intermediate
prerequisites: ["[[HTTP/2]]", "[[UDP]]", "[[TLS]]"]
related: ["[[HTTP/1.1]]", "[[HTTP/2]]", "[[TCP]]", "[[UDP]]"]
builds_toward: []
sources:
  - RFC 9114 (HTTP/3)
  - RFC 9000 (QUIC)
  - Cloudflare engineering posts on HTTP/3
  - 'High Performance Browser Networking (Grigorik)'
tags: [networking, http, quic]
created: 2026-06-04
last_reviewed: 2026-06-04
---

# HTTP/3

> ⚠ Supplemented — built from RFCs and vendor docs (Grigorik).

## Executive Summary

**HTTP/3** is the third major version of HTTP, defined over **QUIC** (RFC 9000) instead of TCP. QUIC runs on UDP, embeds TLS 1.3 in its handshake, multiplexes streams without TCP's head-of-line blocking, and supports connection migration across network changes. Standardized 2022; rolled out by Cloudflare, Google, Meta, and the major browsers.

## Why This Exists

[[HTTP/2]] multiplexes streams over one TCP connection, but if one packet is lost, **TCP's in-order delivery stalls all streams** until retransmission — the head-of-line blocking problem. QUIC fixes this by handling streams below TLS, on UDP, where one stream's loss doesn't block the others.

## Core Intuition

- HTTP/1.1: one request per TCP connection (or sequential with keep-alive).
- HTTP/2: many streams over one TCP — but TCP HOL blocking ruins it under loss.
- HTTP/3: many streams over one QUIC connection — streams are independent at the transport layer.

## Key Changes vs HTTP/2

| Feature | HTTP/2 | HTTP/3 |
|---|---|---|
| Transport | TCP | QUIC (over UDP) |
| TLS | Separate (handshake adds RTT) | Integrated in QUIC handshake |
| Handshake RTTs | 2–3 (TCP + TLS) | 1 (or 0 with prior session) |
| HOL blocking | Yes (TCP-level) | No (stream-level) |
| Connection migration | No (tied to 4-tuple) | Yes (connection ID) |
| Headers | HPACK | QPACK (HOL-safe) |

## Design Tradeoffs

**Wins:**
- Lower latency on mobile (handshake + no HOL).
- Connection migration across Wi-Fi ↔ cellular without reconnect.
- Encryption mandatory; harder to middlebox-snoop.

**Costs:**
- UDP often deprioritized or blocked by middleboxes.
- More CPU per connection (kernel-bypass userspace stack typical).
- New tooling (Wireshark dissectors, load balancer support, observability).

## Real Production

- **Google** — first major deployment (gQUIC variant before standardization).
- **Cloudflare, Fastly** — front-line deployment.
- **Meta** — HTTP/3 across apps.
- **Browsers** — Chrome, Firefox, Safari, Edge all support.

## Misconceptions

- **"HTTP/3 = QUIC."** HTTP/3 is the HTTP semantics layered on QUIC; QUIC is the underlying transport, also usable for other protocols.
- **"It's always faster."** On reliable connections with no loss, HTTP/2 is competitive; HTTP/3 wins under loss, mobility, or cold connections.

## Related Concepts

- [[HTTP/2]] — predecessor; addresses HOL only partially.
- [[TCP]] — what QUIC replaces.
- [[UDP]] — QUIC's substrate.
- [[TLS]] — TLS 1.3 baked into QUIC.

## Active Recall Questions

What transport does HTTP/3 run on?::QUIC, which runs on UDP — replacing TCP.

What problem with HTTP/2 did HTTP/3 solve?::TCP-level head-of-line blocking — if one packet is lost, TCP blocks all streams sharing the connection; QUIC handles streams independently at the transport layer.

How many round-trips does QUIC's handshake take?::1 RTT for a new connection, 0 RTT for a resumed session (vs TCP+TLS's 2–3).

What is connection migration in QUIC?::A connection is identified by a connection ID, not a 4-tuple; clients can switch networks (Wi-Fi → cellular) without resetting the connection.

Why is UDP a challenge for HTTP/3 deployment?::Middleboxes (firewalls, NATs) often deprioritize or block UDP; rate-limit it differently than TCP.

What does QPACK fix relative to HPACK?::HPACK (HTTP/2) has cross-stream header dependencies that reintroduce HOL blocking; QPACK is designed to be HOL-safe for HTTP/3's independent streams.

## Feynman Test

Explain to a frontend engineer why their mobile users on flaky cellular benefit more from HTTP/3 than their fiber-connected office users.

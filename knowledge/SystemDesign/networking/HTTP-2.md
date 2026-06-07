---
title: HTTP/2
aliases: ["HTTP/2"]
area: networking
status: mature
difficulty: intermediate
prerequisites: ["[[HTTP/1.1]]", "[[TCP]]"]
related: ["[[HTTP/1.1]]", "[[HTTP/3]]", "[[TLS]]", "[[TCP]]"]
sources:
  - SDI vol 1, Ch. 6
  - RFC 7540
tags: [networking, protocols, http]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# HTTP/2

## Executive Summary

HTTP/2 (RFC 7540, 2015) is a **binary, multiplexed, header-compressed** evolution of HTTP that keeps the same semantics (methods, status codes, headers) but radically changes the wire format. The headline feature is **stream multiplexing** — many concurrent requests and responses share one TCP connection without head-of-line blocking *at the HTTP layer*. Other improvements: **HPACK header compression**, **server push** (mostly abandoned), **prioritization**. Universally deployed at CDNs, load balancers, and major web frameworks. Still subject to **TCP-level head-of-line blocking** — which is why [[HTTP/3]] exists.

## Why This Exists

HTTP/1.1's serial-per-connection model forced workarounds: browsers opened 6 connections, sites used domain sharding, developers concatenated assets ("spriting"). These were patches, not solutions. HTTP/2 (originating from Google's SPDY) made multiplexing first-class — one connection handles many parallel streams. Smaller payloads, faster page loads, fewer connections.

## Core Intuition

HTTP/1.1 was a single-lane road; HTTP/2 is a multi-lane highway. Many cars (requests) can travel simultaneously without queueing behind each other. The cars are still going the same places — same URLs, same methods, same status codes — they just don't block each other in transit.

## Internal Mechanics

**Binary framing:**
- Wire format is binary, not text. Faster to parse; smaller; less ambiguous.
- Logical units: **frames** within **streams** within a **connection**.

**Streams:**
- Each request/response pair is a stream.
- Streams have IDs; client streams odd, server streams even.
- Streams are multiplexed over one connection — interleaved on the wire.

**HPACK header compression:**
- Headers compressed via static + dynamic tables.
- Common headers (`:method: GET`, `:status: 200`) reduce to 1-2 bytes.
- Eliminates repetition across requests on same connection.

**Server push (deprecated):**
- Server can preemptively send resources the client will likely need.
- Rarely used in practice; mostly disabled. Browsers found it caused more cache invalidation than savings.

**Prioritization:**
- Streams can have priorities (weight + dependency).
- Allows critical resources (CSS) to be sent before less critical (analytics).
- Implementation is inconsistent across servers.

## Architecture Diagrams

```
HTTP/1.1: serial per connection
  Conn1: req-A → resp-A → req-B → resp-B → req-C → resp-C
  Conn2: req-D → resp-D
  Conn3: req-E → resp-E
  (6 connections per origin typical)

HTTP/2: multiplexed
  Conn1: req-A ┐  ┌ resp-A
              ├─ ─┤
         req-B ┘  └ resp-B
         req-C  ─→ resp-C
         (all on one connection, interleaved)
```

## Design Tradeoffs

**Benefits:**
- **Multiplexing** — no HTTP-level head-of-line blocking.
- **Header compression** — 80%+ reduction in many cases.
- **Fewer connections** — less server memory, less handshake cost.
- **Binary parsing** — faster than text.

**Costs:**
- **TCP head-of-line blocking remains** — packet loss on one stream stalls all streams. Solved by HTTP/3 (UDP).
- **Binary is harder to debug** — no curl/telnet inspection.
- **Server push complexity** — net loss for most cases.
- **Server-side memory** — many streams per connection require careful resource management.

## Real Production Examples

- **CDNs** — Cloudflare, Fastly, Akamai serve HTTP/2 by default for HTTPS.
- **Major sites** — Google, Facebook, Amazon, Twitter all support HTTP/2.
- **gRPC** — runs on HTTP/2; uses streams for bidirectional RPC.
- **Browsers** — Chrome, Firefox, Safari, Edge all prefer HTTP/2 for HTTPS.

## Interview Perspective

**Common questions:**
- "HTTP/2 vs HTTP/1.1?" → Multiplexing, binary, header compression, prioritization. Same semantics; different wire format.
- "What's TCP head-of-line blocking, and does HTTP/2 fix it?" → TCP HoL: one lost packet stalls all data on a connection. HTTP/2 multiplexing avoids HTTP-level HoL but still suffers TCP-level HoL. HTTP/3 (QUIC over UDP) eliminates this.
- "When should you not use HTTP/2?" → Internal services with tightly controlled clients may not benefit. Single-resource fetches don't multiplex. For most public web, HTTP/2 is the right default.

**Senior-level:**
- HTTP/2's "fewer connections" benefit reverses the HTTP/1.1 optimization playbook. Domain sharding hurts HTTP/2; spriting is unnecessary.
- HTTP/2 server push sounded great but in practice: cache invalidation, double-sending, complex coordination. Most browsers removed support.
- HPACK is clever — compressed via shared dictionary state across requests on the same connection. Can leak info via timing attacks (HPACK vulnerabilities).

**Common mistakes:**
- Domain sharding under HTTP/2 — hurts performance.
- Disabling HTTP/2 to "simplify debugging" — losing real performance gains.
- Configuring HTTP/2 without TLS — most browsers require HTTPS for HTTP/2.

## Related Concepts

- [[HTTP/1.1]] — predecessor.
- [[HTTP/3]] — successor; eliminates TCP head-of-line blocking via QUIC.
- [[TCP]] — HTTP/2 still runs on TCP; subject to its limitations.
- [[TLS]] — HTTP/2 effectively requires HTTPS in browsers.

## Misconceptions

- **"HTTP/2 eliminates head-of-line blocking."** Only at HTTP layer; TCP HoL still applies. HTTP/3 fixes the TCP part.
- **"HTTP/2 makes everything faster automatically."** Need to update optimization patterns. Sharding/spriting hurt.
- **"Server push is the killer feature."** It's been deprecated in practice.

## Failure Scenarios

- **TCP packet loss** stalls all multiplexed streams. Mitigation: HTTP/3.
- **Too many concurrent streams** can exhaust server resources. Mitigation: stream count limits.
- **HPACK state divergence** between client and server (bug) breaks the connection.
- **Mixed HTTP/1.1 / HTTP/2 deployment confusion** — backend gets HTTP/1.1 from LB but frontend negotiates HTTP/2.

## Practical Engineering Heuristics

- **Use HTTP/2 by default** for public web traffic.
- **Drop domain sharding** when migrating.
- **Use a CDN** with HTTP/2 (or HTTP/3) — they handle it for you.
- **Test in production** — performance characteristics differ.
- **Consider HTTP/3** for mobile / lossy networks.

## Active Recall Questions

What problem does HTTP/2 multiplexing solve?::HTTP/1.1's serial-per-connection model. Multiple requests/responses share one TCP connection as independent streams, no HTTP-level head-of-line blocking.

What's HPACK?::HTTP/2's header compression scheme. Uses static + dynamic tables shared between client and server. 80%+ compression in typical cases.

Does HTTP/2 eliminate head-of-line blocking entirely?::Only at HTTP layer. TCP-level HoL (one lost packet stalls all streams) still applies. HTTP/3 (QUIC over UDP) eliminates this.

Why is HTTP/2 binary?::Faster parsing, smaller wire format, less ambiguous than text. Trade-off: harder to debug without specialized tools.

What HTTP/1.1 optimizations are anti-patterns under HTTP/2?::Domain sharding (more connections is worse, not better), sprite sheets, file concatenation. HTTP/2 makes many small requests fast.

What happened to HTTP/2 server push?::Mostly deprecated. In practice it caused more cache invalidation than savings. Browsers removed support.

## Feynman Test

Walk through how a page with 50 small resources loads under HTTP/1.1 vs HTTP/2. Where are the wins?

Explain why HTTP/2 over UDP would defeat the purpose. (Hint: it's HTTP/3.)

## Mastery Checklist

- **Explain** HTTP/2's multiplexing and HPACK.
- **Compare** HTTP/1.1, HTTP/2, HTTP/3.
- **Derive** which workloads benefit from HTTP/2.
- **Critique** HTTP/1.1 optimization patterns applied to HTTP/2.
- **Design** an HTTP/2 deployment with prioritization.

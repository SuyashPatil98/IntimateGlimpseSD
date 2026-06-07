---
title: HTTP/1.1
aliases: ["HTTP/1.1"]
area: networking
status: mature
difficulty: beginner
prerequisites: ["[[TCP]]"]
related: ["[[TCP]]", "[[HTTP/2]]", "[[HTTP/3]]", "[[TLS]]", "[[REST]]", "[[Load Balancing]]"]
builds_toward: ["[[HTTP/2]]", "[[REST]]"]
sources:
  - SDI vol 1, Ch. 6
  - system-design-primer
  - RFC 7230-7235
tags: [networking, protocols, http, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# HTTP/1.1

## Executive Summary

HTTP/1.1 (RFC 2616, refined in RFC 7230-7235) is the **dominant text-based, request-response application protocol** of the web. Each request is a stateless text message (method + URL + headers + body); each response is a status code + headers + body. Runs on [[TCP]] (typically port 80, or 443 with [[TLS]]). Defining features: **persistent connections** (multiple requests per TCP socket), **pipelining** (rarely used), **chunked encoding** for streaming, and **caching headers**. Has well-known performance issues — head-of-line blocking, no multiplexing, header repetition — solved by [[HTTP/2]] and [[HTTP/3]].

## Why This Exists

The web needed a simple, human-readable protocol for fetching documents. HTTP/0.9 (1991) was a single line. HTTP/1.0 (1996) added headers and methods. HTTP/1.1 (1997, refined ongoing) added persistent connections, virtual hosting (multiple domains on one IP), better caching, and chunked encoding. It's been the universal language of the web for 25+ years; HTTP/2 and HTTP/3 are semantic-compatible upgrades.

## Core Intuition

Imagine ordering at a counter via written notes. You hand over a note: "GET /menu HTTP/1.1, Host: cafe.com." The clerk hands back: "200 OK, Content-Type: text/html, [body]." You can keep the conversation going on the same counter (persistent connection), but you wait for each answer before placing the next order (no multiplexing). HTTP/1.1 is exactly this — request, response, repeat.

## Internal Mechanics

**Request structure:**
```
GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
Connection: keep-alive

```

**Response structure:**
```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234
Cache-Control: max-age=3600

<html>...</html>
```

**Methods:** GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, TRACE, CONNECT.

**Status codes:** 1xx informational, 2xx success, 3xx redirect, 4xx client error, 5xx server error.

**Persistent connections (keep-alive):** reuse one TCP connection for multiple requests, amortizing handshake cost. Default in HTTP/1.1.

**Pipelining:** send multiple requests without waiting for responses. Theoretically reduces latency; in practice rarely used due to head-of-line blocking and broken intermediaries.

**Chunked transfer encoding:** send response in pieces without knowing total length in advance.

## Architecture Diagrams

```
HTTP/1.1 with keep-alive:
  Client                      Server
    │── TCP handshake ────────→│
    │── GET /a ───────────────→│
    │←── 200 OK + body ──────│
    │── GET /b ───────────────→│
    │←── 200 OK + body ──────│
    │── GET /c ───────────────→│
    │←── 200 OK + body ──────│
    
    Multiple requests, one connection.
    But requests serial — must wait for each response.
```

## Design Tradeoffs

**Benefits:**
- **Human-readable** — easy to debug with curl/telnet.
- **Universally supported** — every device, every library.
- **Simple** — text-based parsing.
- **Stateless** — each request independent; horizontal scaling trivial.
- **Caching-friendly** — rich caching headers.

**Costs:**
- **Head-of-line blocking** — within a connection, request N blocks until N-1 returns.
- **No multiplexing** — must open multiple connections for parallel requests (browsers typically open 6 per origin).
- **Header repetition** — same headers sent on every request, no compression.
- **Verbose** — text-based parsing slower than binary.

## Real Production Examples

- **The web** — nearly every website serves HTTP/1.1 (often alongside HTTP/2).
- **REST APIs** — typically run on HTTP/1.1 or HTTP/2.
- **Internal microservice traffic** — increasingly HTTP/2 or gRPC, but plenty of HTTP/1.1 in production.
- **CDN edges** — accept HTTP/1.1/2/3, normalize internally.

## Interview Perspective

**Common questions:**
- "What's the difference between HTTP/1.0 and HTTP/1.1?" → 1.1 added: persistent connections, Host header, chunked encoding, better caching, pipelining.
- "Why do browsers open 6 connections per origin?" → To parallelize requests despite HTTP/1.1's lack of multiplexing.
- "What's head-of-line blocking in HTTP/1.1?" → A slow request blocks all subsequent requests on the same connection.

**Senior-level:**
- HTTP/1.1's text format is a *feature* — debugging, intermediaries, transparency. HTTP/2's binary format is faster but opaque.
- The Host header enabled virtual hosting — multiple domains per IP — which essentially made shared web hosting possible.
- Most "HTTP performance" advice for HTTP/1.1 (sprites, concatenation, domain sharding) became *anti-patterns* in HTTP/2.

**Common mistakes:**
- Opening new TCP connection per request (ignoring keep-alive).
- Forgetting that pipelining is mostly disabled in browsers.
- Not setting Cache-Control headers properly.

## Related Concepts

- [[TCP]] — HTTP/1.1's transport.
- [[HTTP/2]] · [[HTTP/3]] — successors with multiplexing.
- [[TLS]] — HTTPS = HTTP over TLS.
- [[REST]] — architectural style typically using HTTP.
- [[Load Balancing]] — L7 balancers parse HTTP.

## Misconceptions

- **"HTTP/1.1 pipelining is widely used."** Mostly not — browsers disable it by default due to broken intermediaries.
- **"Each request opens a new connection."** Not in HTTP/1.1 — keep-alive is default.
- **"HTTP is just for browsers."** APIs, microservices, RPCs, anything text-protocol — HTTP is everywhere.

## Failure Scenarios

- **Connection-per-request anti-pattern** — handshake cost dominates.
- **Head-of-line blocking under load** — one slow endpoint stalls the connection.
- **Idle connections held open** consume server memory. Mitigation: tune keep-alive timeout.

## Practical Engineering Heuristics

- **Use keep-alive** universally; open connections sparingly.
- **Set Cache-Control headers** properly; reduces backend load dramatically.
- **Use a CDN** for static content; edges close to users.
- **Migrate to HTTP/2** for multiplexing benefits; servers and CDNs make this easy.
- **Compress payloads** (gzip, brotli).

## Active Recall Questions

What's HTTP?::Request-response application protocol for hypertext (and increasingly anything). Stateless; runs on TCP.

What did HTTP/1.1 add over 1.0?::Persistent connections (keep-alive default), Host header (virtual hosting), chunked encoding, better caching, pipelining (rarely used).

What's HTTP/1.1's head-of-line blocking?::Within a single TCP connection, request N blocks all subsequent requests until it completes.

Why do browsers open 6 connections per origin?::To parallelize requests despite HTTP/1.1's lack of multiplexing within one connection.

Name three HTTP methods and what they do.::GET (retrieve), POST (create/submit), PUT (replace), DELETE, PATCH (partial update), HEAD (metadata only).

What's chunked transfer encoding?::Streaming response in pieces without knowing total content length in advance. Each chunk prefixed by size.

What enabled virtual hosting on shared IPs?::The Host header in HTTP/1.1 — server can distinguish which domain a request is for.

## Feynman Test

Walk through what happens when you type a URL in a browser. From DNS resolution through HTTP response.

Explain why "domain sharding" was a HTTP/1.1 optimization and an HTTP/2 anti-pattern.

## Mastery Checklist

- **Explain** HTTP/1.1's request/response structure.
- **Compare** with HTTP/2 and HTTP/3.
- **Derive** when HTTP/1.1's costs are acceptable vs needing upgrades.
- **Critique** "we'll open a new connection per request" designs.
- **Design** a HTTP service with proper caching and connection reuse.

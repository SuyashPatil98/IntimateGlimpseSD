---
title: TCP
area: networking
status: mature
difficulty: beginner
prerequisites: []
related: ["[[UDP]]", "[[HTTP/1.1]]", "[[TLS]]", "[[Load Balancing]]"]
builds_toward: ["[[HTTP/1.1]]", "[[HTTP/2]]", "[[TLS]]"]
sources:
  - SDI vol 1, Ch. 6
  - system-design-primer
  - DDIA, Ch. 8
tags: [networking, protocols, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# TCP

## Executive Summary

TCP (Transmission Control Protocol) is the **reliable, ordered, connection-oriented** transport protocol underlying most of the internet — HTTP, TLS, SSH, SMTP, and databases all run on it. It provides **guaranteed delivery, in-order packet sequencing, congestion control, and flow control** at the cost of latency overhead (handshake, ack-based delivery, retransmissions). The complement of [[UDP]] — TCP picks reliability; UDP picks speed. Every distributed-systems engineer must understand TCP's trade-offs: head-of-line blocking, three-way handshake cost, slow start, Nagle's algorithm.

## Why This Exists

Networks lose, reorder, and duplicate packets. Applications need a reliable byte stream abstraction — "I sent X bytes, the other side receives exactly X bytes in order." TCP provides that abstraction over an unreliable IP layer. Without TCP (or an equivalent), every application would need to implement retransmission, ordering, and flow control. With TCP, those concerns are amortized into one well-tuned protocol.

## Core Intuition

Imagine sending a long letter through unreliable mail. You break it into numbered pages. Each page is numbered (sequence numbers). The recipient sends back acknowledgments ("got pages 1–3"). If you don't hear back, you resend. You also slow down sending when the recipient is overwhelmed (flow control) or when the postal service is congested (congestion control). TCP automates this whole conversation between two computers.

## Internal Mechanics

**Three-way handshake (connection establishment):**
1. Client → server: SYN (sequence x).
2. Server → client: SYN-ACK (server sequence y, ack x+1).
3. Client → server: ACK (ack y+1).

Connection established. ~1 RTT before any data flows.

**Data transfer:**
- Each byte has a sequence number.
- Receiver acknowledges received bytes.
- Sender retransmits unacknowledged bytes after a timeout.
- **Sliding window** — sender can have multiple unacked packets in flight; bounded by receiver's window size.

**Congestion control:**
- **Slow start** — begin with small congestion window, double each RTT.
- **Congestion avoidance** — after threshold, linear growth.
- **Fast retransmit / fast recovery** — handle packet loss without full timeout.
- Algorithms: Reno, CUBIC (Linux default), BBR (Google).

**Connection termination:**
- Four-way handshake (FIN, ACK, FIN, ACK).
- TIME_WAIT state prevents stale packets from polluting future connections.

## Architecture Diagrams

```
Three-way handshake:
  Client              Server
    │── SYN(seq=x) ────→│
    │←── SYN-ACK ──────│   (seq=y, ack=x+1)
    │── ACK(y+1) ──────→│
    
  Connection established.
  
Data exchange (sliding window, W=4):
  Client              Server
    │── data(1) ─────→│
    │── data(2) ─────→│
    │── data(3) ─────→│
    │── data(4) ─────→│  (window full; wait for acks)
    │←── ack(1) ──────│
    │── data(5) ─────→│  (window slides)
```

## Design Tradeoffs

**Benefits:**
- Reliable delivery — no application-level retransmission.
- In-order — no application-level reordering.
- Congestion control protects the network.
- Universally supported, mature, well-tuned.

**Costs:**
- **Connection setup latency** — 1 RTT before data flows (3 RTTs including TLS).
- **Head-of-line blocking** — one lost packet stalls all later packets until retransmitted.
- **Slow start** — short connections never reach high throughput.
- **Stateful** — each connection consumes server memory.

## Real Production Examples

- **HTTP/1.1, HTTP/2, TLS, SSH, FTP, SMTP, IMAP** — all run on TCP.
- **Database protocols** (MySQL, PostgreSQL, MongoDB) — TCP.
- **gRPC** — runs on HTTP/2 which runs on TCP.
- **TCP optimizations in production:** TCP Fast Open (eliminates RTT for repeat connections), BBR congestion control, large initial congestion windows.

## Interview Perspective

**Common questions:**
- "TCP vs UDP?" → TCP: reliable, ordered, connection-oriented, slower. UDP: unreliable, unordered, connectionless, faster.
- "Why does TCP have a handshake?" → Establishes connection state on both sides; negotiates initial sequence numbers; verifies bidirectional reachability.
- "What's head-of-line blocking?" → One lost packet stalls delivery of all subsequent packets until retransmitted. The motivation for HTTP/3 moving to QUIC (UDP-based).

**Senior-level:**
- TCP's congestion control (CUBIC, BBR) is some of the most sophisticated production software running today. Google's BBR improved YouTube throughput 4× in some regions.
- Connection pooling matters — TCP handshake is expensive; reuse connections aggressively.
- TCP head-of-line blocking is a major reason QUIC/HTTP/3 moved to UDP — independent streams over UDP can progress despite individual packet loss.

**Common mistakes:**
- Opening new TCP connections per request — handshake cost dominates.
- Ignoring TIME_WAIT — high-churn services can exhaust ephemeral ports.
- Disabling Nagle's algorithm without understanding the trade-off.

## Related Concepts

- [[UDP]] — the unreliable, connectionless alternative.
- [[HTTP/1.1]] · [[HTTP/2]] — application protocols running on TCP.
- [[TLS]] — encryption layer over TCP.
- [[Load Balancing]] — L4 balancers operate at TCP level.

## Misconceptions

- **"TCP is fast."** Reliable and well-tuned, but inherently has overhead vs UDP for latency-critical workloads.
- **"TCP guarantees delivery."** Guarantees delivery if the connection stays up. If both ends die simultaneously, in-flight data is lost.
- **"More connections = more throughput."** Past a point, connection overhead dominates.

## Failure Scenarios

- **Connection exhaustion** — too many TCP connections; ephemeral port exhaustion. Mitigation: connection pooling, SO_REUSEADDR.
- **TIME_WAIT accumulation** — many short connections leave TIME_WAIT entries. Mitigation: connection reuse, shorter TIME_WAIT (kernel tunable).
- **Head-of-line blocking** under packet loss — visible as occasional latency spikes. Mitigation: HTTP/2 mitigates per-stream within one TCP conn; HTTP/3 moves to UDP.
- **Slow start hurts short connections** — every new connection starts slow. Mitigation: TCP Fast Open, connection reuse.

## Practical Engineering Heuristics

- **Reuse connections** — connection pooling is essential.
- **Use HTTP/2 or HTTP/3** for multiplexing — reduces connection count.
- **Tune TIME_WAIT and ephemeral port range** for high-churn services.
- **Monitor TCP retransmission rate** as a network-health SLI.
- **For latency-critical, consider UDP-based protocols** (QUIC).

## Active Recall Questions

What does TCP guarantee?::Reliable, in-order delivery of a byte stream between two endpoints. Includes congestion control and flow control.

How many RTTs to establish a TCP connection?::1 RTT for the three-way handshake. With TLS, add 1–2 more (1.3 with TLS 1.3 false-start; 2 RTT for older TLS).

What is head-of-line blocking in TCP?::One lost packet stalls delivery of all subsequent packets until it's retransmitted. Even if later packets arrived, they wait.

What's TCP slow start?::Connection starts with small congestion window; doubles per RTT until threshold reached. Hurts short connections that never reach high throughput.

What's the difference between flow control and congestion control?::Flow control: sender doesn't overwhelm receiver (receiver's window). Congestion control: sender doesn't overwhelm the network (sender's congestion window).

Why does TCP have TIME_WAIT?::Prevents stale packets from a closed connection contaminating a new connection with the same socket pair.

Name two modern TCP congestion-control algorithms.::CUBIC (Linux default), BBR (Google), Reno (classical).

## Feynman Test

Walk through a TCP connection: handshake, data transfer, termination. Where are the RTTs?

Explain why HTTP/2 multiplexes over a single TCP connection rather than opening many.

## Mastery Checklist

- **Explain** TCP's reliability + congestion + flow control.
- **Compare** TCP and UDP.
- **Derive** when TCP's overhead is justified.
- **Critique** systems opening one TCP connection per request.
- **Design** a high-throughput service tuned for TCP behavior.

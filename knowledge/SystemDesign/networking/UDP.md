---
title: UDP
area: networking
status: mature
difficulty: beginner
prerequisites: []
related: ["[[TCP]]", "[[DNS]]", "[[HTTP/3]]"]
builds_toward: ["[[HTTP/3]]", "[[DNS]]"]
sources:
  - SDI vol 1, Ch. 6
  - system-design-primer
tags: [networking, protocols, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# UDP

## Executive Summary

UDP (User Datagram Protocol) is the **unreliable, connectionless, message-oriented** transport protocol — the complement of [[TCP]]. UDP sends packets ("datagrams") without handshake, acknowledgment, ordering, or retransmission. The application is responsible for any reliability it needs. Used where **latency matters more than reliability**: DNS, VoIP, video streaming, online games, and modern protocols like QUIC (HTTP/3) that build their own reliability on top of UDP. UDP's minimal overhead is its superpower.

## Why This Exists

Not every workload needs TCP's guarantees. A video stream can drop a frame; a game can skip a missed update. Paying TCP's handshake, retransmission, and head-of-line blocking costs is wasteful when stale data is more harmful than dropped data. UDP gives applications a thin wrapper around IP datagrams: send a packet, hope it arrives, move on. The application decides what to do about losses.

## Core Intuition

Postcards vs. registered mail. TCP is registered mail — you know it arrived, in order, with delivery confirmation. UDP is postcards — you write, drop in mailbox, and trust the system. Most arrive; some don't; you don't know which. For brief, time-sensitive messages where caring about every one would slow you down, postcards are right.

## Internal Mechanics

**Packet structure:**
- Source port (16 bits)
- Destination port (16 bits)
- Length (16 bits)
- Checksum (16 bits, optional in IPv4)
- Payload

That's it. No connection state, no sequence numbers, no ack mechanism.

**Send/receive:**
1. Sender: write packet to socket. Packet is sent. Done.
2. Receiver: packet arrives (or doesn't). If it arrives, app reads it. If not, no signal.

**Application-level reliability (if needed):**
- Sequence numbers in payload.
- Application acks.
- Retransmission logic.
- This is essentially what QUIC does on top of UDP.

## Design Tradeoffs

**Benefits:**
- **Zero connection setup** — no handshake.
- **Lower latency** — no retransmission delays, no head-of-line blocking.
- **Lower overhead per packet** — no sequence/ack machinery.
- **Multicast / broadcast support** — TCP can't do this.
- **Stateless server** — no per-connection memory.

**Costs:**
- **No reliability** — packets may be lost, duplicated, or reordered.
- **No congestion control** — apps can be antisocial; networks can collapse under UDP storms.
- **Smaller MTU** — large messages must be fragmented at app level (typical safe size: ~1400 bytes).
- **Often blocked by firewalls/NATs** — corporate networks may block UDP except DNS.

## Real Production Examples

- **DNS** — UDP/53 for queries (TCP for large responses, zone transfers).
- **NTP, DHCP, SNMP** — protocol UDP traffic.
- **VoIP (RTP)** — video/audio over UDP.
- **Online games** — Counter-Strike, League of Legends, Fortnite use UDP for game state.
- **QUIC / HTTP/3** — Google's protocol on UDP, with reliability built on top.
- **WebRTC** — real-time browser communication over UDP.
- **Video streaming** — original RTSP/RTP; modern adaptive streaming usually TCP/HTTP.

## Interview Perspective

**Common questions:**
- "When would you use UDP?" → Latency-critical, loss-tolerant: DNS, gaming, VoIP, video streaming. Or where you build reliability above UDP (QUIC).
- "Why does DNS use UDP?" → Queries are tiny; lost queries can just retry; latency matters; stateless servers scale.
- "UDP doesn't have congestion control — is that a problem?" → Yes. Apps must self-limit. UDP storms have caused real internet incidents.

**Senior-level:**
- QUIC's design choice — UDP underneath, reliability on top — was driven by TCP's inability to evolve (middleboxes assume TCP behaves a certain way). UDP gave Google a clean slate.
- Modern protocols increasingly choose UDP for its flexibility, then add reliability/congestion control above it.
- DNS-over-TLS / DNS-over-HTTPS shift DNS to TCP for privacy, sacrificing UDP's latency advantage.

**Common mistakes:**
- Using UDP and then implementing TCP-like reliability badly — better to use TCP.
- Ignoring MTU — large UDP packets get fragmented; fragmentation increases loss.
- No application-level congestion control — antisocial; can be throttled or blocked.

## Related Concepts

- [[TCP]] — the reliable, ordered alternative.
- [[DNS]] — primary UDP use case.
- [[HTTP/3]] — QUIC built on UDP; mainstream UDP for web.
- [[Load Balancing]] — L4 balancers handle UDP somewhat differently than TCP.

## Misconceptions

- **"UDP is always faster than TCP."** Per-packet, yes. But for sustained reliable streams, TCP's congestion control may outperform poorly-implemented UDP reliability.
- **"UDP can't be reliable."** It can — QUIC proves this. The reliability is just at the application layer.
- **"UDP is insecure."** Same as TCP — security is orthogonal (DTLS adds TLS over UDP).

## Failure Scenarios

- **UDP storm** — runaway app sends UDP packets without limit; saturates network. Mitigation: rate limiting at network edge.
- **NAT traversal failure** — corporate NATs may drop UDP. Mitigation: STUN/TURN servers, fallback to TCP.
- **Packet loss in lossy networks** — UDP doesn't recover. Mitigation: app-level FEC (forward error correction), retransmit critical messages.
- **MTU mismatch** — large UDP packet fragmented and reassembled with high loss probability. Mitigation: keep packets under typical MTU (~1400 bytes safe).

## Practical Engineering Heuristics

- **Use UDP when latency matters more than completeness.**
- **Keep UDP packets ≤ 1400 bytes** to avoid fragmentation.
- **Implement app-level congestion control** for high-volume UDP services.
- **Plan for NAT traversal** — many networks restrict UDP.
- **Consider QUIC** for new protocols needing both reliability and UDP's flexibility.

## Active Recall Questions

What does UDP provide that TCP doesn't?::Lower latency (no handshake, no retransmission delays), connectionless statelessness, multicast support. No reliability.

What does TCP provide that UDP doesn't?::Reliable delivery, in-order packets, congestion control, flow control.

Why does DNS use UDP?::Queries are tiny (one packet); lost queries can just retry; latency matters; stateless servers scale better without TCP connection state.

What's QUIC?::A transport protocol built on UDP with TCP-like reliability and TLS encryption built in. Underlies HTTP/3. Designed to escape TCP's calcification by middleboxes.

What's a UDP storm?::Runaway UDP traffic that saturates the network because UDP has no congestion control. Apps must implement their own self-limiting.

Why are UDP packets often limited to ~1400 bytes?::To avoid IP fragmentation, which dramatically increases loss probability (loss of any fragment → loss of whole packet).

When is UDP the wrong choice?::Long-lived reliable streams where you'd end up implementing TCP-like behavior at app level — just use TCP.

## Feynman Test

A new chat app: messages must arrive, in order, reliably. TCP or UDP? Defend.

Why did Google build QUIC on UDP rather than just designing a better TCP?

## Mastery Checklist

- **Explain** UDP and its trade-offs vs TCP.
- **Compare** UDP and TCP for various workloads.
- **Derive** when UDP is the right choice.
- **Critique** apps using UDP without congestion control.
- **Design** a real-time game protocol using UDP with app-level reliability.

---
title: TLS
area: networking
status: mature
difficulty: intermediate
prerequisites: ["[[TCP]]"]
related: ["[[TCP]]", "[[HTTP/1.1]]", "[[HTTP/2]]", "[[HTTP/3]]"]
sources:
  - SDI vol 1, Ch. 6
  - RFC 8446 (TLS 1.3)
tags: [networking, security, tls, fundamental]
created: 2026-06-02
last_reviewed: 2026-06-02
---

# TLS

## Executive Summary

TLS (Transport Layer Security) is the **cryptographic protocol that provides confidentiality, integrity, and authentication for network traffic**. The "S" in HTTPS. Runs between [[TCP]] and the application protocol. Modern version is **TLS 1.3** (RFC 8446, 2018) — faster handshake (1 RTT vs 2 RTT in 1.2), removed many legacy cryptographic options, and is widely deployed. TLS enables: encrypted browsing, signed certificates verifying server identity, optional client authentication (mTLS), and underpins essentially all secure internet communication.

## Why This Exists

Network traffic over the public internet is observable and tamperable by any intermediary. Without TLS: passwords visible to ISPs and WiFi snoopers; bank transactions modifiable by middleboxes; identity unverifiable. TLS solves all three: encrypt the data, MAC for integrity, certificate chains for identity. Without TLS, modern e-commerce and online banking would be impossible.

## Core Intuition

You and a stranger want to exchange messages over a postal system where the mailman reads everything. You:
1. Exchange keys via a math trick (Diffie-Hellman) that lets you both derive a shared secret without the mailman learning it.
2. Verify the stranger's identity via a signed letter from a trusted authority (certificate).
3. Encrypt all future messages with the shared secret.

That's TLS — key exchange + authentication + symmetric encryption.

## Internal Mechanics

**TLS 1.3 handshake (1 RTT):**

1. **ClientHello** — supported cipher suites, key share (DH public).
2. **ServerHello + Certificate + Finished** — selected cipher, server's key share + certificate, signed transcript.
3. Client verifies certificate, derives keys, sends Finished.

Data can flow on the second message; 1 RTT total before app data.

**TLS 1.2 handshake (2 RTT):**

1. ClientHello.
2. ServerHello + Certificate + ServerHelloDone.
3. ClientKeyExchange + ChangeCipherSpec + Finished.
4. ServerChangeCipherSpec + Finished.
5. App data flows.

**Components:**
- **Cipher suite** — combination of key exchange, signature, symmetric encryption, MAC. TLS 1.3 simplified options drastically.
- **Certificate** — server's public key + identity, signed by a Certificate Authority (CA).
- **CA chain** — root CA → intermediate CA → server certificate.
- **Key exchange** — typically Elliptic Curve Diffie-Hellman (ECDHE) for forward secrecy.
- **Session resumption** — 0-RTT possible with PSK after first handshake.

**mTLS (mutual TLS):**
- Server also requires client certificate.
- Used for service-to-service auth.

## Architecture Diagrams

```
TLS 1.3 handshake:

  Client                          Server
    │── ClientHello ────────────→│
    │  (ciphers, DH share)
    │
    │← ServerHello + Cert + Fin ─│
    │  (chosen cipher, server DH share, signed transcript)
    │
    │── Finished + app data ────→│
    │
    Encrypted app data both ways.
    Total: 1 RTT to first byte of app data.
```

## Design Tradeoffs

**Benefits:**
- **Confidentiality** — encrypted in transit.
- **Integrity** — tampering detected.
- **Authentication** — server's identity verified via certificate.
- **Forward secrecy** (with ECDHE) — past sessions safe even if private key leaked.

**Costs:**
- **Handshake latency** — 1 RTT (TLS 1.3) or 2 RTT (TLS 1.2) before app data.
- **CPU overhead** — encryption/decryption per byte. Mostly negligible on modern CPUs with AES-NI.
- **Certificate management** — CAs, expiry, rotation, Certificate Transparency.

## Real Production Examples

- **HTTPS** — TLS underlies essentially all public web traffic in 2026.
- **Let's Encrypt** — free, automated CA; revolutionized HTTPS adoption.
- **mTLS in service meshes** — Istio, Linkerd use mTLS for east-west traffic.
- **gRPC, HTTPS APIs, secure email (SMTPS, IMAPS)** — all run TLS.
- **QUIC** — TLS 1.3 is built into QUIC at the transport level.

## Interview Perspective

**Common questions:**
- "What does TLS provide?" → Confidentiality, integrity, authentication.
- "TLS 1.2 vs TLS 1.3?" → 1.3 is faster (1 RTT vs 2), simpler cipher suites, eliminates legacy crypto, mandatory forward secrecy.
- "What's mTLS?" → Mutual TLS — both sides authenticate via certificate. Standard for service-to-service auth.

**Senior-level:**
- TLS 1.3's 0-RTT mode is dangerous — replay attacks are possible. Only use for idempotent requests.
- Certificate management is the underrated operational pain — expiry monitoring, rotation, ACME automation. Let's Encrypt + cert-manager solved much of it.
- TLS performance is rarely a problem today (AES-NI, session resumption); historically it was a major concern that drove many architectural decisions.

**Common mistakes:**
- Disabling certificate validation "for testing" — leaves it disabled in prod.
- Using weak cipher suites or old TLS versions.
- Letting certificates expire — surprisingly common outage cause.

## Related Concepts

- [[TCP]] — TLS runs on top.
- [[HTTP/1.1]] · [[HTTP/2]] · [[HTTP/3]] — HTTPS = HTTP + TLS.
- [[Load Balancing]] — TLS termination at LB is common.

## Misconceptions

- **"HTTPS = secure."** TLS protects in transit but not at endpoints. Application vulnerabilities, malicious endpoints still apply.
- **"TLS is slow."** Modern hardware + TLS 1.3 makes this rarely noticeable.
- **"Self-signed certs are equivalent."** No — clients can't verify identity without a trusted CA chain.

## Failure Scenarios

- **Certificate expiry** — common, embarrassing outage cause. Mitigation: monitoring, auto-rotation (cert-manager, Let's Encrypt).
- **CA compromise** — historically rare but devastating (DigiNotar 2011). Mitigation: Certificate Transparency, HPKP (deprecated).
- **Weak cipher** — older TLS versions with broken crypto. Mitigation: disable old protocols.
- **MITM via rogue CA** — corporate proxies sometimes do this transparently.

## Practical Engineering Heuristics

- **Use TLS 1.3** for new deployments.
- **Use Let's Encrypt** for free certificates; automate renewal with cert-manager / acme.sh.
- **Use mTLS** for internal service-to-service auth.
- **Monitor certificate expiry** — alerts before expiry.
- **Test handshake performance** — long handshake can dominate request latency.

## Active Recall Questions

What does TLS provide?::Confidentiality (encryption), integrity (tamper detection), authentication (server identity via certificate).

How many RTTs for the TLS 1.3 handshake?::1 RTT before app data. TLS 1.2 required 2 RTT.

What's mTLS?::Mutual TLS — both client and server present certificates. Standard for service-to-service authentication.

What's forward secrecy?::Property that past session keys cannot be recovered even if long-term private keys are later compromised. Provided by ECDHE key exchange.

What's a certificate chain?::Sequence: root CA → intermediate CA → server certificate. Client trusts root; intermediate signed by root; server signed by intermediate.

What's the danger of TLS 1.3 0-RTT?::Replay attacks. The 0-RTT data can be captured and replayed by an adversary. Use only for idempotent requests.

What's the most common TLS-related production outage?::Certificate expiry. Often forgotten cert leads to outage when it expires. Mitigation: automated renewal + expiry monitoring.

## Feynman Test

Walk through the TLS 1.3 handshake. Where does authentication happen? Where does key derivation happen?

Explain why "we'll just disable cert validation for testing" leads to production incidents.

## Mastery Checklist

- **Explain** TLS's three guarantees and the handshake flow.
- **Compare** TLS 1.2 and TLS 1.3.
- **Derive** when mTLS is appropriate.
- **Critique** systems with disabled cert validation or expired certs.
- **Design** a service mesh using mTLS with auto-rotation.

---
title: gRPC
area: networking
status: draft
difficulty: intermediate
prerequisites: ["[[HTTP/2]]", "[[Protobuf]]"]
related: ["[[REST]]", "[[Protobuf]]", "[[Thrift]]", "[[HTTP/2]]"]
builds_toward: []
sources:
  - gRPC docs (grpc.io)
  - DDIA Ch.4 (RPC)
  - Google internal Stubby (gRPC's predecessor)
tags: [networking, rpc, grpc]
created: 2026-06-04
last_reviewed: 2026-06-04
---

# gRPC

## Executive Summary

**gRPC** is Google's open-source RPC framework: schema-first via [[Protobuf]], transport over [[HTTP/2]], code-generated stubs in 10+ languages, bidirectional streaming first-class. Open-sourced 2015 from Google's internal Stubby; now the de facto inter-service RPC for cloud-native systems.

## Why This Exists

REST/JSON works but: it's schema-loose, verbose on the wire, requires hand-written client code per language, and lacks streaming. Google's internal Stubby (~2001) solved these for billions of internal RPCs/day. gRPC is the public version.

## Core Intuition

You write a `.proto` file describing your service:
```protobuf
service Greeter {
  rpc SayHello(HelloRequest) returns (HelloResponse);
}
```
The compiler generates client stubs and server skeletons in your language. You call `greeter.SayHello(req)` like a local function; gRPC handles serialization, HTTP/2 framing, retries.

## Internal Mechanics

- **Wire format**: Protobuf binary, length-prefixed, over HTTP/2 frames.
- **HTTP/2 streams**: each RPC is one stream — multiplexed over a single connection.
- **Streaming modes**: unary (one req, one resp), server-streaming, client-streaming, bidirectional.
- **Headers / trailers**: metadata via HTTP/2 headers; status code in trailers.
- **Deadlines** propagate from caller to callee (`context.WithTimeout`).
- **Interceptors**: middleware for auth, logging, retries, tracing.

## Design Tradeoffs

**Wins vs REST:**
- 5–10× smaller payloads (Protobuf vs JSON).
- Strict schemas (no field-typo bugs).
- Generated stubs (no hand-written HTTP code per service).
- Streaming + multiplexing native.
- Deadlines + cancellation propagate.

**Costs:**
- Not browser-friendly (HTTP/2 + binary; gRPC-Web layer required).
- Harder to debug than JSON (need protoc-decoder).
- Schema evolution requires discipline (see [[Schema Evolution]]).
- Polyglot but skewed toward Google's languages (Go, Java, C++, Python first).

## Real Production

- **Google internal** — Stubby; gRPC is the open variant.
- **Netflix, Square, Cisco, CoreOS** — early adopters.
- **Kubernetes** — etcd uses gRPC; many K8s components.
- **Istio, Envoy** — gRPC-aware service mesh.

## Misconceptions

- **"gRPC requires Protobuf."** It's the default but other codecs (FlatBuffers, JSON) are supported.
- **"REST is dead."** No — REST/JSON remains the right choice for public APIs, browser clients, and ad-hoc tooling.
- **"gRPC is always faster than REST."** True for binary serialization + multiplexing, but at low QPS the difference is invisible.

## Related Concepts

- [[Protobuf]] — wire format.
- [[HTTP/2]] — transport.
- [[REST]] — alternative.
- [[Thrift]] — Facebook's predecessor.
- [[Schema Evolution]] — managing proto changes.

## Active Recall Questions

What three building blocks does gRPC stand on?::Protobuf (schema + binary wire format), HTTP/2 (transport), code-generated stubs (per-language clients/servers).

What four streaming modes does gRPC support?::Unary, server-streaming, client-streaming, bidirectional streaming.

Why is gRPC not browser-native?::Browsers can't manipulate HTTP/2 framing directly; gRPC-Web is a translation layer over HTTP/1.1-friendly framing.

What was gRPC's predecessor at Google?::Stubby — internal RPC framework since ~2001, never open-sourced; gRPC is the publicly released equivalent.

How do deadlines propagate in gRPC?::Caller sets a deadline (e.g., 100ms); it's sent in the request metadata; callee can read it and propagate to its own outgoing calls; preserves end-to-end timeout budgets.

Why is gRPC payload typically 5–10× smaller than equivalent REST/JSON?::Protobuf encodes field numbers + types in a compact binary form; JSON includes field names as strings + verbose punctuation.

## Feynman Test

A team is choosing between gRPC and REST for a new internal microservice. List the three questions you'd ask them that determine the answer.

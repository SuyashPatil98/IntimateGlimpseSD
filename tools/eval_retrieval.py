#!/usr/bin/env python3
"""Retrieval quality gate. Each probe lists pages that MUST appear in the top-N
(any-of counts as a hit). Run before wiring retrieval into the app.

    python tools/eval_retrieval.py            # hybrid
    KEYWORD=1 python tools/eval_retrieval.py  # force keyword baseline
"""
from __future__ import annotations

import os
import sys

import retrieval

# (query, {acceptable page stems / titles — any-of in top-N counts as a hit})
PROBES = [
    ("leader election",                                  {"Raft", "Leader Election", "Paxos", "Consensus"}),
    ("what happens to latency when a node is up but slow", {"PACELC"}),
    ("eventual consistency tradeoffs",                   {"Eventual Consistency", "BASE"}),
    ("log structured storage engine writes",             {"LSM-Trees", "SSTables", "Compaction"}),
    ("avoid cache thundering herd",                      {"Cache Stampede"}),
    ("split a table across many machines",               {"Partitioning", "Rebalancing", "Hot Partitions"}),
    ("exactly once message processing",                  {"Outbox Pattern", "Dead Letter Queues", "Consumer Groups", "CDC"}),
    ("compare SQL and NoSQL",                            {"NoSQL", "Relational Databases"}),
    ("keep replicas in sync",                            {"Replication", "Leader-Based Replication", "Anti-Entropy", "Read Repair"}),
    ("isolation level that prevents dirty reads",        {"Isolation Levels", "Snapshot Isolation", "MVCC"}),
    ("data format that evolves over time",               {"Schema Evolution", "Avro", "Protobuf", "Backward and Forward Compatibility"}),
    ("strong ordering guarantee for reads and writes",   {"Linearizability", "Sequential Consistency"}),
    ("background job processing",                        {"Task Queues", "Pub-Sub"}),
    ("detect node failures",                             {"Failure Detection", "Heartbeats", "Phi Accrual Failure Detector"}),
    ("load balancing layer 4 vs 7",                      {"L4 vs L7 Load Balancing", "Load Balancing"}),
]
THRESHOLD = 12


def _hit(results, accept, n) -> bool:
    pool = {r.page for r in results[:n]} | {r.title for r in results[:n]}
    return bool(pool & accept)


def run(n: int = 6) -> int:
    if os.environ.get("KEYWORD") == "1":
        retrieval._models_ok = False  # force fallback
    ix = retrieval.build_index()
    mode = "hybrid+rerank+graph" if ix.embeddings is not None else "KEYWORD-ONLY"
    print(f"Index: {len(ix.chunks)} chunks / "
          f"{sum(1 for p in ix.pages.values() if not p['is_meta'])} pages | mode={mode}\n")
    passed = 0
    for q, accept in PROBES:
        res = retrieval.search(q, top_n=n)
        ok = _hit(res, accept, n)
        passed += ok
        top = ", ".join(r.title for r in res[:3])
        print(f"[{'PASS' if ok else 'MISS'}] {q!r}\n        -> {top}")
    print(f"\n{passed}/{len(PROBES)} probes passed (top-{n}); threshold {THRESHOLD}.")
    return passed


if __name__ == "__main__":
    sys.exit(0 if run() >= THRESHOLD else 1)

"""Tests for the write-time integrity guardrails."""
import textwrap

import integrity

RESOLVER = {"raft": "Raft", "consensus": "Consensus", "paxos": "Paxos"}

GOOD = textwrap.dedent("""\
    ---
    title: Quorum Reads
    area: distributed-systems
    status: stub
    sources: [conversation-2026-06-08]
    ---

    # Quorum Reads

    ## Executive Summary
    Reading from a quorum of replicas ensures overlap with writes.

    ## Core Intuition
    If reads and writes both touch a majority, they intersect.

    ## Design Tradeoffs
    | Gain | Cost |
    |---|---|
    | Consistency | Latency |

    ## Related Concepts
    - [[Raft]] — consensus.
    - [[Consensus]] — agreement.
    - [[Paxos]] — classic baseline.

    ## Active Recall Questions
    What overlap does a quorum guarantee under partition?::A read quorum and write quorum intersect in at least one replica, guaranteeing the read sees the latest write.
    Why does W plus R greater than N matter?::It forces read and write sets to overlap so reads observe the most recent acknowledged write in the system.
    How do larger read quorums affect availability?::Larger read quorums lower availability because more replicas must respond, so slow or failed nodes can block reads.
    """)

BAD = textwrap.dedent("""\
    ---
    title: Bad Page
    area: nonsense
    status: mature
    sources: []
    ---

    # Bad Page

    ## Recent Insights
    Some stuff.

    ## Related Concepts
    - [[Raft]] — only one link.
    """)


def test_good_page_has_no_blocking_issues():
    blocking, warnings = integrity.validate_new_page(GOOD, RESOLVER)
    assert blocking == [], blocking
    assert warnings == [], warnings


def test_bad_page_flags_every_violation():
    blocking, _ = integrity.validate_new_page(BAD, RESOLVER)
    joined = " | ".join(blocking)
    assert "invalid area" in joined
    assert "stub/draft" in joined            # status mature rejected
    assert "sources" in joined
    assert "forbidden section" in joined      # ## Recent Insights
    assert "minimum 3" in joined              # only 1 wikilink


def test_unresolved_link_is_blocking():
    content = GOOD.replace("[[Paxos]]", "[[Nonexistent Page]]")
    blocking, _ = integrity.validate_new_page(content, RESOLVER)
    assert any("unresolved wikilink" in b for b in blocking)


def test_shallow_and_short_recall_are_warnings():
    content = GOOD.replace(
        "What overlap does a quorum guarantee under partition?::A read quorum and write quorum intersect in at least one replica, guaranteeing the read sees the latest write.",
        "What is a quorum?::A set.")
    _, warnings = integrity.validate_new_page(content, RESOLVER)
    j = " | ".join(warnings)
    assert "shallow question" in j
    assert "too short" in j


def test_extend_rejects_forbidden_section():
    blocking, _ = integrity.validate_extend("## Recent Insights", "- a bullet", RESOLVER)
    assert any("forbidden" in b for b in blocking)

"""Tests for the section-merge engine (the append-bug fix) and backlinks."""
import textwrap

import pytest

import config
import vault
import vault_write as vw
import backlink_patcher

SAMPLE = textwrap.dedent("""\
    ---
    title: Sample
    area: distributed-systems
    status: stub
    related: ["[[Raft]]"]
    ---

    # Sample

    ## Executive Summary
    A sample page.

    ## Design Tradeoffs
    | Gain | Cost |
    |---|---|
    | Simplicity | Less power |

    ## Related Concepts
    - [[Raft]] — consensus.

    ## Active Recall Questions
    What is a sample?::A placeholder used in tests for verification purposes here.
    """)


@pytest.fixture
def page(tmp_path):
    p = tmp_path / "Sample.md"
    p.write_text(SAMPLE, encoding="utf-8")
    return p


def test_add_row_to_table_merges_into_named_section(page):
    vw.apply_merge(page, "## Design Tradeoffs", "ADD_ROW_TO_TABLE", "| Speed | Memory |")
    out = page.read_text(encoding="utf-8")
    assert "| Speed | Memory |" in out
    # row landed inside Design Tradeoffs, before Related Concepts
    assert out.index("| Speed | Memory |") < out.index("## Related Concepts")
    # frontmatter preserved
    assert out.startswith("---\ntitle: Sample")
    # NO sediment section created
    assert "## Recent Insights" not in out


def test_add_bullet(page):
    vw.apply_merge(page, "## Related Concepts", "ADD_BULLET",
                   "[[Paxos]] — the classic baseline.")
    out = page.read_text(encoding="utf-8")
    assert "- [[Paxos]] — the classic baseline." in out


def test_forbidden_section_rejected(page):
    with pytest.raises(vw.VaultWriteError):
        vw.apply_merge(page, "## Recent Insights", "ADD_BULLET", "junk")


def test_missing_section_refuses_to_append(page):
    with pytest.raises(vw.VaultWriteError):
        vw.apply_merge(page, "## Nonexistent Section", "ADD_BULLET", "x")
    # page unchanged — no new section appended
    assert "## Nonexistent Section" not in page.read_text(encoding="utf-8")


def test_add_backlink_body_and_frontmatter(page):
    vw.add_backlink(page, "Paxos", "the classic baseline.")
    out = page.read_text(encoding="utf-8")
    # body link under Related Concepts (drives the Obsidian graph edge)
    rel = out.split("## Related Concepts", 1)[1]
    assert "[[Paxos]]" in rel
    # frontmatter related updated for lint parity
    assert '"[[Paxos]]"' in out.split("---", 2)[1]


def test_add_backlink_idempotent(page):
    vw.add_backlink(page, "Paxos")
    vw.add_backlink(page, "Paxos")
    assert page.read_text(encoding="utf-8").count("[[Paxos]]") == 2  # body + frontmatter, once each


def test_write_new_page(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "VAULT_ROOT", tmp_path)
    p = vw.write_new_page("New Concept", "caching", "---\ntitle: New Concept\n---\n\n# New Concept\n")
    assert p.exists() and p.parent.name == "caching"
    with pytest.raises(vw.VaultWriteError):
        vw.write_new_page("X", "not-an-area", "content")
    with pytest.raises(vw.VaultWriteError):
        vw.write_new_page("New Concept", "caching", "dup")  # already exists


def test_patch_backlinks_skips_when_already_linked(tmp_path, monkeypatch):
    # Build a tiny fake vault for the resolver (redirect the real vault scan).
    monkeypatch.setattr(vault, "VAULT", tmp_path)
    area = tmp_path / "distributed-systems"
    area.mkdir()
    (area / "Paxos.md").write_text(
        "---\ntitle: Paxos\narea: distributed-systems\nstatus: stub\nrelated: []\n---\n\n"
        "# Paxos\n\n## Related Concepts\n- [[Consensus]] — parent.\n", encoding="utf-8")
    patched = backlink_patcher.patch_backlinks("Raft", ["Paxos"])
    assert patched == ["Paxos"]
    assert "[[Raft]]" in (area / "Paxos.md").read_text(encoding="utf-8")
    # second run is a no-op (already links back)
    assert backlink_patcher.patch_backlinks("Raft", ["Paxos"]) == []

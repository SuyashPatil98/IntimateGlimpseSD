"""Tests for the compiler's parsing, validation, and apply routing (no live LLM)."""
import compiler


def test_strip_fences():
    assert compiler._strip_fences('```json\n{"a":1}\n```') == '{"a":1}'
    assert compiler._strip_fences('{"a":1}') == '{"a":1}'


def test_validate_skip_ok():
    assert compiler.validate_decision({"decision": "SKIP"}) == ([], [])


def test_validate_create_missing_content_blocks():
    blocking, _ = compiler.validate_decision({"decision": "CREATE", "title": "X", "area": "caching"})
    assert any("missing content" in b for b in blocking)


def test_validate_extend_unknown_target_blocks():
    d = {"decision": "EXTEND", "target_title": "No Such Page",
         "target_section": "## Design Tradeoffs", "merge_strategy": "ADD_ROW_TO_TABLE",
         "new_content": "| a | b |"}
    blocking, _ = compiler.validate_decision(d)
    assert any("unknown target_title" in b for b in blocking)


def test_validate_extend_valid_passes():
    # "Raft" + "## Design Tradeoffs" exist in the real vault.
    d = {"decision": "EXTEND", "target_title": "Raft",
         "target_section": "## Design Tradeoffs", "merge_strategy": "ADD_ROW_TO_TABLE",
         "new_content": "| Log compaction | Bounds disk | Adds snapshot complexity |"}
    blocking, _ = compiler.validate_decision(d)
    assert blocking == [], blocking


def test_compile_conversation_parses_mocked(monkeypatch):
    monkeypatch.setattr(compiler, "likely_target", lambda *a, **k: None)
    monkeypatch.setattr(compiler.llm_adapter, "complete",
                        lambda *a, **k: '```json\n{"decision":"SKIP","reason":"covered"}\n```')
    d = compiler.compile_conversation("Q: what is CAP?\nA: ...")
    assert d["decision"] == "SKIP"


def test_apply_skip_does_nothing():
    res = compiler.apply_decision({"decision": "SKIP", "reason": "dup"})
    assert res["applied"] is False


def test_apply_create_routes(monkeypatch):
    calls = {}
    monkeypatch.setattr(compiler, "validate_decision", lambda d: ([], []))
    def fake_write(title, area, content):
        calls.update(title=title, area=area)
    monkeypatch.setattr(compiler.vault_write, "write_new_page", fake_write)
    monkeypatch.setattr(compiler.pipeline, "post_vault_write", lambda *a, **k: {"ok": True})
    res = compiler.apply_decision({
        "decision": "CREATE", "title": "New Concept", "area": "caching",
        "content": "...", "wikilinks": ["Caching", "Cache Stampede", "Eviction Policies"]})
    assert res["applied"] and res["title"] == "New Concept"
    assert calls == {"title": "New Concept", "area": "caching"}


def test_apply_blocked_when_invalid(monkeypatch):
    monkeypatch.setattr(compiler, "validate_decision", lambda d: (["bad"], []))
    res = compiler.apply_decision({"decision": "CREATE"})
    assert res["applied"] is False and res["blocking"] == ["bad"]

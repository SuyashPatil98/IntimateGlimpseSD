"""Deterministic tests for role routing + fallback (no live LLM)."""
import contextlib

import config
import llm_adapter as L

config.LLM_MAX_RETRIES = 0  # fail fast in tests


class Fake:
    def __init__(self, ok=True, chunks=("ok",)):
        self.ok, self.chunks = ok, chunks

    def available(self):
        return True

    def generate(self, model, system, user, cache_prefix="", as_json=False):
        if not self.ok:
            raise RuntimeError("backend down")
        for c in self.chunks:
            yield c


@contextlib.contextmanager
def backends(**kw):
    orig = L.BACKENDS.copy()
    L.BACKENDS.update(kw)
    try:
        yield
    finally:
        L.BACKENDS.clear()
        L.BACKENDS.update(orig)


def _types(evs):
    return [e["type"] for e in evs]


def test_primary_success():
    with backends(qwen=Fake(chunks=("a", "b")), claude=Fake()):
        evs = list(L.stream("ask", "s", "u"))
    assert _types(evs) == ["backend", "chunk", "chunk"]
    assert evs[0]["backend"] == "qwen" and evs[0]["primary"]
    assert "".join(e["text"] for e in evs if e["type"] == "chunk") == "ab"


def test_fallback_on_primary_failure():
    with backends(qwen=Fake(ok=False), claude=Fake(chunks=("c",))):
        evs = list(L.stream("ask", "s", "u"))
    assert "notice" in _types(evs)
    first_backend = next(e for e in evs if e["type"] == "backend")
    assert first_backend["backend"] == "claude" and not first_backend["primary"]
    assert any(e["type"] == "chunk" and e["text"] == "c" for e in evs)


def test_all_backends_fail_yields_error():
    with backends(qwen=Fake(ok=False), claude=Fake(ok=False), gemini=Fake(ok=False)):
        evs = list(L.stream("ask", "s", "u"))
    assert _types(evs)[-1] == "error"


def test_promote_routes_to_claude_first():
    with backends(claude=Fake(chunks=("{}",)), qwen=Fake()):
        evs = list(L.stream("promote", "s", "u", as_json=True))
    first_backend = next(e for e in evs if e["type"] == "backend")
    assert first_backend["backend"] == "claude" and first_backend["primary"]


def test_complete_returns_joined_text():
    with backends(qwen=Fake(chunks=("foo", "bar")), claude=Fake()):
        assert L.complete("ask", "s", "u") == "foobar"

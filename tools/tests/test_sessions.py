"""Tests for multi-turn session state (isolated temp DB)."""
import datetime

import pytest

import config
import sessions
import state


@pytest.fixture
def tmpdb(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "STATE_DB", tmp_path / "state.db")
    state._engine = None
    yield
    state._engine = None


def test_session_lifecycle(tmpdb):
    sid = sessions.start("databases")
    assert sessions.get(sid) is not None
    sessions.add_message(sid, "user", "What is MVCC?")
    sessions.add_message(sid, "assistant", "Multi-version concurrency control.",
                         pages_used=["MVCC"], backend="qwen")
    assert len(sessions.history(sid)) == 2
    assert sessions.turn_count(sid) == 1
    t = sessions.transcript(sid)
    assert "Q: What is MVCC?" in t and "A: Multi-version" in t
    sessions.end(sid)
    assert sessions.get(sid) is None


def test_expiry(tmpdb):
    fresh = state.StudySession(id="a", last_active=state.now())
    old = state.StudySession(
        id="b", last_active=state.now() - datetime.timedelta(minutes=config.SESSION_TTL_MINUTES + 5))
    assert not sessions.is_expired(fresh)
    assert sessions.is_expired(old)

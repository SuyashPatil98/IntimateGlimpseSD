#!/usr/bin/env python3
"""Multi-turn study session state (server-side in SQLite, so it syncs across devices).

A session caches the vault context once and re-fetches only when the topic shifts,
keeping multi-turn Q&A cheap. `transcript()` feeds the whole session to the compiler.
"""
from __future__ import annotations

import datetime
import json
import uuid

from sqlmodel import select

import config
import state
from state import Message, StudySession, now


def start(topic_area: str = "") -> str:
    sid = uuid.uuid4().hex[:12]
    with state.db() as s:
        s.add(StudySession(id=sid, topic_area=topic_area))
        s.commit()
    return sid


def get(sid: str) -> StudySession | None:
    with state.db() as s:
        return s.get(StudySession, sid)


def set_context(sid: str, vault_context: str, context_query: str) -> None:
    with state.db() as s:
        ss = s.get(StudySession, sid)
        if ss:
            ss.vault_context = vault_context
            ss.context_query = context_query
            ss.last_active = now()
            s.add(ss)
            s.commit()


def add_message(sid: str, role: str, content: str,
                pages_used: list | None = None, backend: str = "") -> None:
    with state.db() as s:
        s.add(Message(session_id=sid, role=role, content=content,
                      pages_used=json.dumps(pages_used or []), backend=backend))
        ss = s.get(StudySession, sid)
        if ss:
            ss.last_active = now()
            s.add(ss)
        s.commit()


def history(sid: str) -> list[Message]:
    with state.db() as s:
        return list(s.exec(select(Message).where(Message.session_id == sid).order_by(Message.id)))


def transcript(sid: str) -> str:
    return "\n\n".join(
        f"{'Q' if m.role == 'user' else 'A'}: {m.content}" for m in history(sid)
    )


def turn_count(sid: str) -> int:
    return sum(1 for m in history(sid) if m.role == "user")


def is_expired(ss: StudySession) -> bool:
    la = ss.last_active
    if la.tzinfo is None:
        la = la.replace(tzinfo=datetime.timezone.utc)
    return (now() - la).total_seconds() > config.SESSION_TTL_MINUTES * 60


def end(sid: str) -> None:
    with state.db() as s:
        ss = s.get(StudySession, sid)
        if ss:
            for m in s.exec(select(Message).where(Message.session_id == sid)):
                s.delete(m)
            s.delete(ss)
            s.commit()

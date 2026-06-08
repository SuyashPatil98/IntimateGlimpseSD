"""SQLite interaction-state store.

IMPORTANT boundary: the markdown vault holds *knowledge* (the source of truth,
owned by Obsidian). This database holds only *interaction state* — sessions,
flashcard schedules, analytics, progress. It is disposable and never the
authority on knowledge. One DB, one server → every device sees the same state
(this is what makes cross-device sync trivial).
"""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlmodel import Field, SQLModel, Session as DBSession, create_engine

import config


def now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class StudySession(SQLModel, table=True):
    id: str = Field(primary_key=True)
    created_at: dt.datetime = Field(default_factory=now)
    last_active: dt.datetime = Field(default_factory=now)
    topic_area: str = ""
    vault_context: str = ""          # context fetched once per session
    context_query: str = ""          # the query the context was built for (topic-shift detection)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    role: str                         # "user" | "assistant"
    content: str
    pages_used: str = ""              # JSON list of page names
    backend: str = ""                 # which LLM answered
    created_at: dt.datetime = Field(default_factory=now)


class Flashcard(SQLModel, table=True):
    """One Active-Recall question under SM-2 scheduling."""
    id: Optional[int] = Field(default=None, primary_key=True)
    page: str = Field(index=True)     # source page name (stem)
    area: str = ""
    question: str = ""
    answer: str = ""
    qhash: str = Field(index=True)    # sha1(page + question) — dedupe key
    # SM-2 state
    ease: float = 2.5
    interval_days: int = 0
    repetitions: int = 0
    lapses: int = 0
    due: dt.datetime = Field(default_factory=now)
    last_reviewed: Optional[dt.datetime] = None
    suspended: bool = False


class PageStat(SQLModel, table=True):
    page: str = Field(primary_key=True)
    retrieved_count: int = 0
    promoted_count: int = 0
    answer_primary_count: int = 0     # times it was the top retrieved page
    last_retrieved: Optional[dt.datetime] = None


class QueryLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question: str = ""
    pages_retrieved: str = ""         # JSON list
    backend: str = ""
    promoted: bool = False
    session_id: str = ""
    created_at: dt.datetime = Field(default_factory=now)


class Progress(SQLModel, table=True):
    """Free-form key/value for streaks, counters, last-study-date, etc."""
    key: str = Field(primary_key=True)
    value: str = ""
    updated_at: dt.datetime = Field(default_factory=now)


class TokenUsage(SQLModel, table=True):
    """One paid LLM call's token usage + computed cost (Claude spend tracking)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    backend: str = ""
    model: str = ""
    role: str = ""                  # "promote" | "ask"
    input_tokens: int = 0
    output_tokens: int = 0
    cache_write_tokens: int = 0
    cache_read_tokens: int = 0
    cost_usd: float = 0.0
    created_at: dt.datetime = Field(default_factory=now)


_engine = None


def get_engine():
    global _engine
    if _engine is None:
        config.STATE_DB.parent.mkdir(parents=True, exist_ok=True)
        _engine = create_engine(
            f"sqlite:///{config.STATE_DB}",
            connect_args={"check_same_thread": False},
        )
        SQLModel.metadata.create_all(_engine)
    return _engine


def db() -> DBSession:
    """Open a session: `with state.db() as s: ...`."""
    return DBSession(get_engine())


def get_progress(key: str, default: str = "") -> str:
    with db() as s:
        row = s.get(Progress, key)
        return row.value if row else default


def set_progress(key: str, value: str) -> None:
    with db() as s:
        row = s.get(Progress, key)
        if row:
            row.value, row.updated_at = value, now()
        else:
            row = Progress(key=key, value=value)
        s.add(row)
        s.commit()


def record_usage(backend, model, role, input_tokens, output_tokens,
                 cache_write_tokens=0, cache_read_tokens=0, cost_usd=0.0):
    with db() as s:
        s.add(TokenUsage(
            backend=backend, model=model, role=role,
            input_tokens=input_tokens, output_tokens=output_tokens,
            cache_write_tokens=cache_write_tokens, cache_read_tokens=cache_read_tokens,
            cost_usd=cost_usd,
        ))
        s.commit()


if __name__ == "__main__":
    get_engine()
    print(f"Initialized state DB at {config.STATE_DB}")
    for tbl in SQLModel.metadata.tables:
        print(f"  table: {tbl}")

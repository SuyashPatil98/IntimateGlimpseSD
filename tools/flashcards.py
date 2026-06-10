#!/usr/bin/env python3
"""Flashcards: sync Active-Recall questions from the vault into state.db and
schedule them with a simple SM-2 algorithm. Cards live in the DB (the vault's
terse Q::A stays the source); this is the per-card review state.
"""
from __future__ import annotations

import datetime as dt
import hashlib

from sqlmodel import select

import state
import vault
from export_json import get_recall_block, parse_questions


def _qhash(page: str, q: str) -> str:
    return hashlib.sha1((page + "||" + q).encode("utf-8")).hexdigest()


def _aware(d: dt.datetime) -> dt.datetime:
    return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)


def sync_from_vault() -> int:
    """Upsert every recall question from the vault into the Flashcard table."""
    pages = vault.collect_pages()
    added = 0
    with state.db() as s:
        existing = {fc.qhash for fc in s.exec(select(state.Flashcard))}
        for name, p in pages.items():
            if p["is_meta"]:
                continue
            area = p["frontmatter"].get("area", "unknown")
            block = get_recall_block(p["body"])
            for qa in (parse_questions(block) if block else []):
                h = _qhash(name, qa["question"])
                if h in existing:
                    continue
                s.add(state.Flashcard(page=name, area=area, question=qa["question"],
                                      answer=qa["answer"], qhash=h, due=state.now()))
                existing.add(h)
                added += 1
        s.commit()
    return added


def due_cards(limit: int = 60) -> list:
    sync_from_vault()
    now = state.now()
    with state.db() as s:
        rows = list(s.exec(select(state.Flashcard).where(state.Flashcard.suspended == False)))  # noqa: E712
    due = [r for r in rows if _aware(r.due) <= now]
    due.sort(key=lambda r: _aware(r.due))
    return due[:limit]


def rate(card_id, rating) -> dict | None:
    q = {"again": 0, "hard": 1, "good": 2, "easy": 3}.get(str(rating).lower(), 2)
    with state.db() as s:
        fc = s.get(state.Flashcard, card_id)
        if not fc:
            return None
        if q == 0:
            fc.repetitions = 0
            fc.interval_days = 0
            fc.lapses += 1
            fc.due = state.now() + dt.timedelta(minutes=10)
        else:
            fc.ease = max(1.3, fc.ease + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)))
            fc.repetitions += 1
            if fc.repetitions == 1:
                fc.interval_days = 1
            elif fc.repetitions == 2:
                fc.interval_days = 6
            else:
                fc.interval_days = max(1, round(fc.interval_days * fc.ease))
            if q == 1:
                fc.interval_days = max(1, round(fc.interval_days * 0.7))
            fc.due = state.now() + dt.timedelta(days=fc.interval_days)
        fc.last_reviewed = state.now()
        s.add(fc)
        s.commit()
        return {"id": fc.id, "due": fc.due.isoformat(),
                "interval_days": fc.interval_days, "ease": round(fc.ease, 2)}


def enrich(card_id) -> dict | None:
    """M8: generate + store a deep 'why' explanation for one card, on demand (Claude).
    Button-triggered and per-card so it never auto-spends tokens. Re-running refreshes it."""
    import llm_adapter
    from prompts import load_prompt
    with state.db() as s:
        fc = s.get(state.Flashcard, card_id)
        if not fc:
            return None
        page, question, answer = fc.page, fc.question, fc.answer
    p = vault.collect_pages().get(page)
    page_md = p["body"][:6000] if p else ""
    user = (f'<page name="{page}">\n{page_md}\n</page>\n'
            f"<question>{question}</question>\n<answer>{answer}</answer>")
    text = llm_adapter.complete("promote", load_prompt("flashcard_enricher"), user).strip()
    with state.db() as s:
        fc = s.get(state.Flashcard, card_id)
        if not fc:
            return None
        fc.deep_explanation = text
        s.add(fc)
        s.commit()
        return {"id": fc.id, "deepExplanation": text}

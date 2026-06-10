#!/usr/bin/env python3
"""Analytics — turn usage into a learning feedback loop (M6).

Reads the SQLite interaction-state (QueryLog, PageStat, Promotion, Flashcard,
ReviewItem) + the vault (coverage, page status) and computes actionable insights:
what you keep getting wrong, what to study next, which pages you query a lot but
are still thin, where the vault answers you well, and flywheel health.

Everything is best-effort: sparse data just yields small lists, never an error.
"""
from __future__ import annotations

import datetime as dt
import json
from collections import defaultdict

from sqlmodel import select

import config
import state
import vault


def _aware(d: dt.datetime) -> dt.datetime:
    return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)


def compute() -> dict:
    pages = {n: p for n, p in vault.collect_pages().items() if not p["is_meta"]}
    page_area = {n: p["frontmatter"].get("area", "unknown") for n, p in pages.items()}
    status_of = {n: p["frontmatter"].get("status", "stub") for n, p in pages.items()}

    now = state.now()
    week0 = now - dt.timedelta(days=7)

    with state.db() as s:
        queries = list(s.exec(select(state.QueryLog)))
        pagestats = list(s.exec(select(state.PageStat)))
        proms = list(s.exec(select(state.Promotion)))
        cards = list(s.exec(select(state.Flashcard)))
        reviews = list(s.exec(select(state.ReviewItem)))

    # --- struggling flashcards: the individual questions you keep getting wrong ---
    struggling_cards = sorted((c for c in cards if (c.lapses or 0) > 0),
                              key=lambda c: (-(c.lapses or 0), c.ease))
    weak_cards = [{"page": c.page, "area": c.area, "question": c.question,
                   "lapses": c.lapses, "ease": round(c.ease, 2)} for c in struggling_cards[:12]]
    # per-page rollup, so 'study next' lists a page ONCE (not each failing card on it)
    page_fail: dict[str, int] = {}
    page_cards: dict[str, int] = {}
    page_area_of: dict[str, str] = {}
    for c in struggling_cards:
        page_fail[c.page] = page_fail.get(c.page, 0) + (c.lapses or 0)
        page_cards[c.page] = page_cards.get(c.page, 0) + 1
        page_area_of[c.page] = c.area
    struggling_pages = sorted(page_fail, key=lambda p: -page_fail[p])

    # --- per-area: vault coverage + how much YOU query it ---
    area_total, area_mature = defaultdict(int), defaultdict(int)
    for p in pages.values():
        a = p["frontmatter"].get("area", "unknown")
        area_total[a] += 1
        if p["frontmatter"].get("status") in ("mature", "comprehensive"):
            area_mature[a] += 1
    area_queries = defaultdict(int)
    for q in queries:
        try:
            for pg in json.loads(q.pages_retrieved or "[]"):
                area_queries[page_area.get(pg, "unknown")] += 1
        except Exception:
            pass
    areas = []
    for a in config.AREAS:
        tot, mat = area_total.get(a, 0), area_mature.get(a, 0)
        areas.append({"area": a, "total": tot, "mature": mat,
                      "coverage": round(mat / tot * 100) if tot else 0,
                      "queries": area_queries.get(a, 0)})

    # --- pages you query a lot but are still thin → extend these ---
    thin = []
    for ps in pagestats:
        if status_of.get(ps.page) in ("stub", "draft") and (ps.retrieved_count or 0) > 0:
            thin.append({"page": ps.page, "area": page_area.get(ps.page, "?"),
                         "retrieved": ps.retrieved_count, "status": status_of.get(ps.page)})
    thin.sort(key=lambda x: -x["retrieved"])
    thin = thin[:10]

    # --- the vault answers you well here: most-queried, never promoted ---
    strong = sorted((ps for ps in pagestats
                     if (ps.retrieved_count or 0) >= 2 and (ps.promoted_count or 0) == 0),
                    key=lambda p: -p.retrieved_count)[:8]
    vault_strong = [{"page": p.page, "area": page_area.get(p.page, "?"),
                     "retrieved": p.retrieved_count} for p in strong]

    # --- what to study next (synthesised, ranked) ---
    study_next = []
    for pg in struggling_pages[:4]:
        n = page_cards[pg]
        why = f"failing {n} of its flashcards" if n > 1 else f"missed {page_fail[pg]}× in review"
        study_next.append({"kind": "weak-recall", "title": pg, "area": page_area_of[pg], "why": why})
    for t in thin[:3]:
        study_next.append({"kind": "thin-page", "title": t["page"], "area": t["area"],
                           "why": f"queried {t['retrieved']}× but still {t['status']}"})
    for a in sorted((a for a in areas if a["queries"] > 0), key=lambda a: a["coverage"])[:3]:
        study_next.append({"kind": "low-coverage", "title": a["area"].replace("-", " ").title(),
                           "area": a["area"], "why": f"{a['coverage']}% mature · {a['queries']} queries"})

    # --- flywheel health ---
    flywheel = {
        "queries_total": len(queries),
        "queries_week": sum(1 for q in queries if _aware(q.created_at) >= week0),
        "promotions_total": len(proms),
        "promotions_week": sum(1 for p in proms if _aware(p.created_at) >= week0),
        "reviews_pending": sum(1 for r in reviews if r.status in ("suggested", "pending")),
        "cards_total": len(cards),
        "cards_struggling": len(struggling_cards),
        "vault_pages": len(pages),
    }

    # --- activity: queries per day, last 14 days (sparkline) ---
    per_day = defaultdict(int)
    for q in queries:
        per_day[_aware(q.created_at).date()] += 1
    days = [(now - dt.timedelta(days=i)).date() for i in range(13, -1, -1)]
    activity = [per_day.get(d, 0) for d in days]

    return {"study_next": study_next, "weak_cards": weak_cards, "thin_pages": thin,
            "vault_strong": vault_strong, "areas": areas, "flywheel": flywheel,
            "activity": activity}


if __name__ == "__main__":
    print(json.dumps(compute(), indent=2, default=str))

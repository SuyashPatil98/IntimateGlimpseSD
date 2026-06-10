#!/usr/bin/env python3
"""FastAPI backend — wires retrieval + LLM routing + sessions + compiler + pipeline.

Start:  cd tools && ../.venv-win/Scripts/python -m uvicorn api:app --port 8000 --reload
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

import compiler
import config
import llm_adapter
import retrieval
import sessions
import state
import vault
from conversation_logger import log_conversation
from prompts import load_prompt

app = FastAPI(title="SystemDesignAI API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

REPO_ROOT = Path(__file__).resolve().parents[1]
_llm_sem = asyncio.Semaphore(config.LLM_CONCURRENCY)
_SENTINEL = object()


def _sse(ev: dict) -> str:
    return f"data: {json.dumps(ev)}\n\n"


async def _drain(sync_gen):
    """Yield items from a blocking generator without starving the event loop."""
    loop = asyncio.get_event_loop()

    def _next(it):
        try:
            return next(it)
        except StopIteration:
            return _SENTINEL

    while True:
        item = await loop.run_in_executor(None, _next, sync_gen)
        if item is _SENTINEL:
            break
        yield item


async def _answer_stream(question: str, session_id: str | None = None):
    loop = asyncio.get_event_loop()
    # 1. retrieve (sync, fast) off the event loop
    results = await loop.run_in_executor(None, retrieval.search, question)
    sources = [r.to_dict() for r in results]
    yield _sse({"type": "sources", "sources": sources})

    context = await loop.run_in_executor(None, retrieval.build_context_block, results)
    history = sessions.transcript(session_id) if session_id else ""
    user = (f"# Vault context\n\n{context}\n\n"
            + (f"# Conversation so far\n\n{history}\n\n" if history else "")
            + f"# Current question\n\n{question}")

    answer_parts, backend = [], ""
    async with _llm_sem:
        gen = llm_adapter.stream("ask", load_prompt("vault_qa_system"), user)
        async for ev in _drain(gen):
            if ev["type"] == "chunk":
                answer_parts.append(ev["text"])
            elif ev["type"] == "backend":
                backend = ev["backend"]
            yield _sse(ev)

    answer = "".join(answer_parts)
    if session_id:
        sessions.add_message(session_id, "user", question)
        sessions.add_message(session_id, "assistant", answer,
                             pages_used=[r.page for r in results], backend=backend)
    _log_query(question, results, backend, session_id, answer)
    yield _sse({"type": "done"})


def _log_query(question, results, backend, session_id, answer):
    try:
        with state.db() as s:
            s.add(state.QueryLog(question=question, backend=backend, session_id=session_id or "",
                                 pages_retrieved=json.dumps([r.page for r in results])))
            for r in results:
                ps = s.get(state.PageStat, r.page) or state.PageStat(page=r.page)
                ps.retrieved_count += 1
                ps.last_retrieved = state.now()
                s.add(ps)
            s.commit()
    except Exception:
        pass
    try:
        log_conversation(repo_root=REPO_ROOT, question=question, answer=answer,
                         pages_consulted=[r.page for r in results],
                         summary="", insights="", confidence="")
    except Exception:
        pass


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    loop = asyncio.get_event_loop()
    pages = await loop.run_in_executor(None, vault.collect_pages)
    n = sum(1 for p in pages.values() if not p["is_meta"])
    return {"backends": llm_adapter.health(), "vault": {"pages": n}}


@app.get("/api/usage")
async def usage():
    """Claude token spend — today / week / total / per-model — for the dashboard."""
    import datetime as dt
    from sqlmodel import select
    now = state.now()
    today0 = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week0 = now - dt.timedelta(days=7)

    def _aware(d):
        return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)

    def agg(rows):
        return {
            "calls": len(rows),
            "input": sum(r.input_tokens for r in rows),
            "output": sum(r.output_tokens for r in rows),
            "cache_read": sum(r.cache_read_tokens for r in rows),
            "cache_write": sum(r.cache_write_tokens for r in rows),
            "cost": round(sum(r.cost_usd for r in rows), 4),
        }

    with state.db() as s:
        rows = list(s.exec(select(state.TokenUsage)))
    by_model: dict = {}
    for r in rows:
        m = by_model.setdefault(r.model, {"calls": 0, "cost": 0.0})
        m["calls"] += 1
        m["cost"] = round(m["cost"] + r.cost_usd, 4)
    return {
        "today": agg([r for r in rows if _aware(r.created_at) >= today0]),
        "week": agg([r for r in rows if _aware(r.created_at) >= week0]),
        "total": agg(rows),
        "by_model": by_model,
    }


def _concept_pages(pages):
    return {n: p for n, p in pages.items() if not p["is_meta"]}


@app.get("/api/graph")
async def graph():
    loop = asyncio.get_event_loop()

    def build():
        pages = vault.collect_pages()
        resolver = vault.build_resolver(pages)
        concept = _concept_pages(pages)
        inbound, edges = {}, []
        for name, p in concept.items():
            for link in p["wikilinks"]:
                c = resolver.get(link.lower())
                if c and c in concept and c != name:
                    edges.append([name, c])
                    inbound[c] = inbound.get(c, 0) + 1
        nodes = [{"id": n, "title": p["frontmatter"].get("title", n),
                  "area": p["frontmatter"].get("area", "unknown"),
                  "status": p["frontmatter"].get("status", "stub"),
                  "inbound": inbound.get(n, 0)} for n, p in concept.items()]
        return {"nodes": nodes, "edges": edges}

    return await loop.run_in_executor(None, build)


@app.get("/api/areas/coverage")
async def areas_coverage():
    loop = asyncio.get_event_loop()

    def build():
        pages = _concept_pages(vault.collect_pages())
        agg = {}
        for p in pages.values():
            fm = p["frontmatter"]
            d = agg.setdefault(fm.get("area", "unknown"), {"total": 0, "mature": 0})
            d["total"] += 1
            if fm.get("status") in ("mature", "comprehensive"):
                d["mature"] += 1
        out = []
        for a in config.AREAS:
            d = agg.get(a, {"total": 0, "mature": 0})
            pct = round(d["mature"] / d["total"] * 100) if d["total"] else 0
            out.append({"area": a, "pct": pct, "total": d["total"], "mature": d["mature"]})
        return out

    return await loop.run_in_executor(None, build)


@app.get("/api/vault/stats")
async def vault_stats():
    import datetime as dt
    from sqlmodel import select
    loop = asyncio.get_event_loop()

    def counts():
        pages = _concept_pages(vault.collect_pages())
        mature = sum(1 for p in pages.values()
                     if p["frontmatter"].get("status") in ("mature", "comprehensive"))
        return len(pages), mature

    total, mature = await loop.run_in_executor(None, counts)
    now = state.now()
    today0 = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week0 = now - dt.timedelta(days=7)

    def _aware(d):
        return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)

    with state.db() as s:
        proms = list(s.exec(select(state.Promotion)))
    return {
        "total": total, "mature": mature,
        "promotedToday": sum(1 for p in proms if _aware(p.created_at) >= today0),
        "promotedWeek": sum(1 for p in proms if _aware(p.created_at) >= week0),
        "lintWarnings": 0, "lintBroken": 0,
        "streakDays": int(state.get_progress("streak", "0") or 0),
    }


@app.get("/api/vault/recent-promoted")
async def recent_promoted(n: int = 5):
    from sqlmodel import select
    with state.db() as s:
        rows = list(s.exec(select(state.Promotion).order_by(state.Promotion.id.desc())))[:n]
    return [{"page": r.page, "title": r.title, "area": r.area, "status": "draft",
             "decision": r.decision, "when": r.created_at.isoformat()} for r in rows]


@app.get("/api/vault/notes")
async def vault_notes(q: str = "", area: str = "", status: str = "", limit: int = 400):
    loop = asyncio.get_event_loop()

    def build():
        pages = _concept_pages(vault.collect_pages())
        resolver = vault.build_resolver(pages)
        inbound = {}
        for n, p in pages.items():
            for link in p["wikilinks"]:
                c = resolver.get(link.lower())
                if c and c in pages:
                    inbound[c] = inbound.get(c, 0) + 1
        out = []
        for n, p in pages.items():
            fm = p["frontmatter"]
            if area and fm.get("area") != area:
                continue
            if status and fm.get("status") != status:
                continue
            body = p["body"]
            out.append({"page": n, "title": fm.get("title", n),
                        "area": fm.get("area", "unknown"), "status": fm.get("status", "stub"),
                        "inbound": inbound.get(n, 0), "words": len(body.split()),
                        "modified": str(fm.get("last_reviewed", "")),
                        "snippet": body.strip()[:140]})
        if q:
            ql = q.lower()
            out = [o for o in out if ql in o["title"].lower() or ql in o["snippet"].lower()]
        out.sort(key=lambda o: -o["inbound"])
        return out[:limit]

    return await loop.run_in_executor(None, build)


@app.get("/api/vault/sync-status")
async def vault_sync_status():
    """Git backup state + live vault size for the Vault & Sync panel."""
    import gitsync
    loop = asyncio.get_event_loop()

    def build():
        st = gitsync.status()
        pages = _concept_pages(vault.collect_pages())
        total_bytes = 0
        for f in config.VAULT_ROOT.rglob("*.md"):
            try:
                total_bytes += f.stat().st_size
            except OSError:
                pass
        st["size"] = {"notes": len(pages),
                      "wikilinks": sum(len(p["wikilinks"]) for p in pages.values()),
                      "bytes": total_bytes}
        st["autosync"] = state.get_progress("git_autosync", "0") == "1"
        return st

    return await loop.run_in_executor(None, build)


@app.post("/api/vault/sync")
async def vault_sync(request: Request):
    import gitsync
    try:
        data = await request.json()
    except Exception:
        data = {}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: gitsync.sync(data.get("message")))


@app.post("/api/vault/snapshot")
async def vault_snapshot():
    import gitsync
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, gitsync.snapshot)


@app.post("/api/vault/open-folder")
async def vault_open_folder():
    import gitsync
    return gitsync.open_folder()


@app.post("/api/vault/autosync")
async def vault_autosync(request: Request):
    data = await request.json()
    enabled = bool(data.get("enabled"))
    state.set_progress("git_autosync", "1" if enabled else "0")
    return {"enabled": enabled}


# ── Review queue (self-maintaining loop: ingest + audit feed it) ──────────────
def _drafted_proposal(it):
    """Return the compiler proposal only if the item has been drafted (has a decision)."""
    if not it.payload:
        return None
    try:
        d = json.loads(it.payload)
        return d if isinstance(d, dict) and d.get("decision") else None
    except Exception:
        return None


@app.get("/api/review/queue")
async def review_queue():
    loop = asyncio.get_event_loop()

    def build():
        items = state.list_review()
        return {"counts": state.review_counts(),
                "items": [{"id": it.id, "kind": it.kind, "title": it.title, "area": it.area,
                           "source": it.source, "decision": it.decision, "summary": it.summary,
                           "status": it.status, "payload": _drafted_proposal(it),
                           "created": it.created_at.isoformat()} for it in items]}

    return await loop.run_in_executor(None, build)


@app.post("/api/review/run-audit")
async def review_run_audit():
    """Scan the vault for gaps + status-fills, enqueue them as suggestions."""
    import audit
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, audit.run_audit)


@app.post("/api/review/{item_id}/draft")
async def review_draft(item_id: int):
    """Generate the proposal for a suggested item via the Claude compiler."""
    loop = asyncio.get_event_loop()
    item = await loop.run_in_executor(None, lambda: state.get_review(item_id))
    if not item:
        return JSONResponse({"status": "error", "message": "not found"}, status_code=404)
    existing = _drafted_proposal(item)
    if existing:
        return {"status": "ok", "proposal": existing}
    state.update_review(item_id, status="drafting")
    if item.kind == "status-fill":
        missing = item.summary.replace("missing: ", "")
        convo = (f"The existing vault page '{item.title}' is missing its '{missing}' "
                 f"section(s). Draft thorough, accurate content to add (decision: EXTEND).")
    elif item.kind == "ingest":
        src = ""
        try:
            src = json.loads(item.payload).get("source_text", "")
        except Exception:
            pass
        convo = ("Compile this source material into a vault-quality page, deciding "
                 f"CREATE / EXTEND / SKIP against the existing vault:\n\n{src}")
    else:  # gap
        convo = (f"Write a comprehensive, vault-quality page on the system-design concept "
                 f"'{item.title}' (area: {item.area}). Decision: CREATE.")
    try:
        async with _llm_sem:
            proposal = await loop.run_in_executor(None, lambda: compiler.compile_conversation(convo))
        blocking, warnings = compiler.validate_decision(proposal)
        state.update_review(item_id, payload=json.dumps(proposal),
                            decision=proposal.get("decision", ""), status="pending")
        return {"status": "ok", "proposal": proposal, "blocking": blocking, "warnings": warnings}
    except Exception as e:
        state.update_review(item_id, status="error", summary=f"draft failed: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.post("/api/review/{item_id}/approve")
async def review_approve(item_id: int, request: Request):
    loop = asyncio.get_event_loop()
    item = await loop.run_in_executor(None, lambda: state.get_review(item_id))
    if not item or not item.payload:
        return JSONResponse({"status": "error", "message": "no drafted proposal yet"}, status_code=400)
    proposal = json.loads(item.payload)
    try:
        data = await request.json()
    except Exception:
        data = {}
    edited = data.get("content")
    if edited is not None:
        proposal["content" if proposal.get("decision") == "CREATE" else "new_content"] = edited
    try:
        result = await loop.run_in_executor(None, lambda: compiler.apply_decision(proposal))
        if result.get("applied"):
            state.update_review(item_id, status="applied")
        return {"status": "ok", "result": result}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.post("/api/review/{item_id}/reject")
async def review_reject(item_id: int):
    state.update_review(item_id, status="rejected")
    return {"status": "ok"}


@app.post("/api/ingest")
async def ingest(request: Request):
    """Ingest one raw file (or all of raw/) → enqueue proposals for review."""
    import ingest as ingest_mod
    data = {}
    try:
        data = await request.json()
    except Exception:
        pass
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: ingest_mod.ingest_path(data.get("filename")))


@app.post("/api/ingest/upload")
async def ingest_upload(request: Request):
    """Drag-drop upload: raw bytes in the body, filename in X-Filename header.
    Saves to raw/ then ingests it (no multipart dependency)."""
    import ingest as ingest_mod
    filename = Path(request.headers.get("X-Filename", "upload.pdf")).name
    body = await request.body()
    config.RAW_DIR.mkdir(parents=True, exist_ok=True)
    (config.RAW_DIR / filename).write_bytes(body)
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: ingest_mod.ingest_path(filename))


@app.get("/api/flashcards/due")
async def flashcards_due(limit: int = 60):
    import flashcards as fc
    loop = asyncio.get_event_loop()
    cards = await loop.run_in_executor(None, lambda: fc.due_cards(limit))
    return {"cards": [{"id": c.id, "page": c.page, "area": c.area, "question": c.question,
                       "answer": c.answer, "deepExplanation": c.deep_explanation or None,
                       "due": c.due.isoformat(), "ease": round(c.ease, 2)} for c in cards]}


@app.post("/api/flashcards/rate")
async def flashcards_rate(request: Request):
    data = await request.json()
    import flashcards as fc
    loop = asyncio.get_event_loop()
    res = await loop.run_in_executor(
        None, lambda: fc.rate(data.get("cardId") or data.get("id"), data.get("rating", "good")))
    return {"status": "ok", "card": res}


@app.post("/api/flashcards/{card_id}/enrich")
async def flashcards_enrich(card_id: int):
    """M8: generate (via Claude) + store a deep 'why' explanation for one card."""
    import flashcards as fc
    loop = asyncio.get_event_loop()
    async with _llm_sem:
        res = await loop.run_in_executor(None, lambda: fc.enrich(card_id))
    if res is None:
        return JSONResponse({"status": "error", "message": "card not found"}, status_code=404)
    return {"status": "ok", **res}


@app.get("/api/roadmap")
async def roadmap():
    loop = asyncio.get_event_loop()

    def build():
        pages = _concept_pages(vault.collect_pages())
        agg = {}
        for p in pages.values():
            fm = p["frontmatter"]
            d = agg.setdefault(fm.get("area", "unknown"), {"total": 0, "mature": 0})
            d["total"] += 1
            if fm.get("status") in ("mature", "comprehensive"):
                d["mature"] += 1
        lanes = {"shipped": [], "current": [], "next": [], "later": []}
        for a in config.AREAS:
            d = agg.get(a, {"total": 0, "mature": 0})
            pct = round(d["mature"] / d["total"] * 100) if d["total"] else 0
            lane = "shipped" if pct >= 80 else "current" if pct >= 55 else "next" if pct >= 30 else "later"
            lanes[lane].append((a, pct, d))
        titles = {"shipped": "Mastered", "current": "Active focus", "next": "Up next", "later": "Long tail"}
        out = []
        for lane in ("shipped", "current", "next", "later"):
            items = lanes[lane]
            if not items:
                continue
            done = sum(d["mature"] for _, _, d in items)
            planned = sum(d["total"] for _, _, d in items)
            out.append({
                "id": lane, "lane": lane, "title": titles[lane],
                "target": f"{len(items)} areas", "progress": round(done / planned * 100) if planned else 0,
                "areas": [a for a, _, _ in items], "notesPlanned": planned, "notesDone": done,
                "cards": [{"kind": "skill", "title": a.replace("-", " ").title(),
                           "status": "mature" if pct >= 80 else "draft", "todo": pct < 30}
                          for a, pct, _ in items],
            })
        return out

    return await loop.run_in_executor(None, build)


@app.get("/api/analytics")
async def analytics_ep():
    """Usage feedback loop (M6): what to study next, weak cards, thin-but-queried
    pages, where the vault answers well, per-area coverage, flywheel health."""
    import analytics
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, analytics.compute)


@app.get("/api/config")
async def get_config():
    h = llm_adapter.health()
    backends = [
        {"id": "qwen", "name": "Qwen 8B", "provider": "Ollama (local)", "model": config.QWEN_ASK_MODEL,
         "endpoint": config.OLLAMA_HOST, "keyMasked": "local (no key)", "enabled": True, "role": "primary",
         "state": "ok" if h["qwen"] else "down", "latencyMs": None, "lastCheck": "now",
         "contextWindow": 32768, "costIn": 0, "costOut": 0},
        {"id": "claude", "name": "Claude Sonnet 4.6", "provider": "Anthropic", "model": config.CLAUDE_PROMOTE_MODEL,
         "endpoint": "api.anthropic.com", "keyMasked": "sk-ant-…set" if config.ANTHROPIC_API_KEY else "missing",
         "enabled": bool(config.ANTHROPIC_API_KEY), "role": "primary",
         "state": "ok" if h["claude"] else "missing", "latencyMs": None, "lastCheck": "now",
         "contextWindow": 1000000, "costIn": 3.0, "costOut": 15.0},
        {"id": "gemini", "name": "Gemini 2.5 Flash", "provider": "Google", "model": config.GEMINI_MODEL,
         "endpoint": "generativelanguage.googleapis.com", "keyMasked": "set" if config.GEMINI_API_KEY else "missing",
         "enabled": bool(config.GEMINI_API_KEY), "role": "standby",
         "state": "ok" if h["gemini"] else "missing", "latencyMs": None, "lastCheck": "now",
         "contextWindow": 1000000, "costIn": 0, "costOut": 0},
    ]
    return {"backends": backends,
            "routing": {"policy": "manual", "ask": list(config.ROLE_ROUTING["ask"]),
                        "promote": list(config.ROLE_ROUTING["promote"])}}


@app.get("/api/ingest/queue")
async def ingest_queue():
    import json
    mf = config.RAW_DIR / "manifest.json"
    if mf.exists():
        try:
            return {"queue": json.loads(mf.read_text(encoding="utf-8"))}
        except Exception:
            pass
    return {"queue": []}


@app.post("/api/ask")
async def ask(request: Request):
    data = await request.json()
    question = (data.get("question") or "").strip()
    sid = data.get("session_id")
    return StreamingResponse(
        _answer_stream(question, sid), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/session/start")
async def session_start(request: Request):
    data = await request.json()
    return {"session_id": sessions.start(data.get("topic_area", ""))}


@app.post("/api/session/{sid}/ask")
async def session_ask(sid: str, request: Request):
    data = await request.json()
    question = (data.get("question") or "").strip()
    return StreamingResponse(
        _answer_stream(question, sid), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/session/{sid}/compile")
async def session_compile(sid: str):
    loop = asyncio.get_event_loop()
    convo = sessions.transcript(sid)
    if not convo:
        return JSONResponse({"status": "error", "message": "empty session"}, status_code=400)
    async with _llm_sem:
        proposal = await loop.run_in_executor(
            None, lambda: compiler.compile_conversation(convo, multi_turn=True))
    blocking, warnings = compiler.validate_decision(proposal)
    return {"status": "ok", "proposal": proposal, "blocking": blocking, "warnings": warnings}


@app.delete("/api/session/{sid}")
async def session_end(sid: str):
    sessions.end(sid)
    return {"status": "ok"}


@app.post("/api/promote")
async def promote(request: Request):
    """Compile a single Q&A (back-compat) or a raw conversation into a proposal."""
    data = await request.json()
    convo = data.get("conversation") or f"Q: {data.get('question','')}\n\nA: {data.get('answer','')}"
    loop = asyncio.get_event_loop()
    try:
        async with _llm_sem:
            proposal = await loop.run_in_executor(None, lambda: compiler.compile_conversation(convo))
        blocking, warnings = compiler.validate_decision(proposal)
        return {"status": "ok", "proposal": proposal, "blocking": blocking, "warnings": warnings}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.post("/api/compile_session")
async def compile_session_ep(request: Request):
    """Compile a whole conversation into MULTIPLE vault improvements (one per concept,
    enriching not consolidating). Returns proposals for the user to review + promote."""
    data = await request.json()
    convo = data.get("conversation") or ""
    if not convo.strip():
        return JSONResponse({"status": "error", "message": "empty conversation"}, status_code=400)
    loop = asyncio.get_event_loop()
    try:
        async with _llm_sem:
            proposals = await loop.run_in_executor(None, lambda: compiler.compile_session(convo))
        out = []
        for p in proposals:
            blocking, warnings = compiler.validate_decision(p)
            out.append({**p, "_blocking": blocking, "_warnings": warnings})
        return {"status": "ok", "proposals": out}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.post("/api/confirm_promotion")
async def confirm_promotion(request: Request):
    data = await request.json()
    proposal = data.get("proposal") or data.get("decision") or {}
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, lambda: compiler.apply_decision(proposal))
        return {"status": "ok", "result": result}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.get("/api/search")
async def search(q: str = "", k: int = 8):
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(None, lambda: retrieval.search(q, top_n=k))
    return {"results": [r.to_dict() for r in results]}


@app.get("/api/page/{name}")
async def get_page(name: str):
    loop = asyncio.get_event_loop()
    pages = await loop.run_in_executor(None, vault.collect_pages)
    p = pages.get(name)
    if not p:
        return JSONResponse({"status": "error", "message": "not found"}, status_code=404)
    return {"name": name, "frontmatter": p["frontmatter"], "body": p["body"],
            "wikilinks": p["wikilinks"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

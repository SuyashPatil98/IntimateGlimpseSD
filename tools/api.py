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

#!/usr/bin/env python3
"""FastAPI backend for the SystemDesignAI web app.

Provides two endpoints:
  POST /api/ask   — SSE stream of LLM answer chunks
  POST /api/save  — Save a Q&A as a new vault page

Start with:
  cd tools && ../.venv/bin/python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import time
from datetime import date
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

# Import existing query engine logic
from query_engine import (
    build_context, select_candidates,
    candidates_from_index, build_title_map, detect_knowledge_root
)
from llm_adapter import generate_answer, get_backend
from conversation_logger import log_conversation

app = FastAPI(title="SystemDesignAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

REPO_ROOT = Path(__file__).resolve().parents[1]


@app.post("/api/ask")
async def ask(request: Request):
    data = await request.json()
    question = data.get("question", "")

    async def event_stream():
        knowledge_root = detect_knowledge_root(REPO_ROOT)
        index_path = knowledge_root / "index.md"
        title_map = build_title_map(knowledge_root)
        index_titles = candidates_from_index(index_path)
        selected = select_candidates(question, title_map, index_titles)
        context = build_context(question, selected)

        primary = selected[0] if selected else None
        meta = {
            "type": "meta",
            "page": primary.title if primary else "unknown",
            "area": primary.path.parent.name if primary else "unknown",
        }
        yield f"data: {json.dumps(meta)}\n\n"

        answer_chunks = []
        try:
            # Run the synchronous generator in a thread so we don't block
            loop = asyncio.get_event_loop()
            gen = generate_answer(context, question)

            # We wrap the blocking generator into an async one
            def _next_chunk(it):
                try:
                    return next(it)
                except StopIteration:
                    return None

            while True:
                chunk = await loop.run_in_executor(None, _next_chunk, gen)
                if chunk is None:
                    break
                answer_chunks.append(chunk)
                msg = json.dumps({"type": "chunk", "text": chunk})
                yield f"data: {msg}\n\n"
        except Exception as e:
            msg = json.dumps({"type": "error", "text": str(e)})
            yield f"data: {msg}\n\n"

        # Log conversation
        if answer_chunks:
            answer_full = "".join(answer_chunks)
            log_conversation(
                repo_root=REPO_ROOT,
                question=question,
                answer=answer_full,
                pages_consulted=[c.title for c in selected],
                summary="", insights="", confidence=""
            )

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


PROMOTION_PROMPT = """You are the Knowledge Compiler for a System Design Vault.
Your job is to analyze a Q&A conversation and extract permanent, reusable knowledge.
The vault is permanent. The conversation is temporary. Do not save chat transcripts.
If the conversation contains durable knowledge, extract it and choose a promotion type.
If it does not, reject it.

Choose exactly one Promotion Type:
1. "Create New Concept Page" (for new core concepts)
2. "Extend Existing Page" (for adding to a known concept)
3. "Create Comparison Page" (e.g. X vs Y)
4. "Create Interview Framework"
5. "Create Design Pattern Page"
6. "Create Learning Note" (for personal insights)

Return ONLY valid JSON matching this schema exactly, nothing else:
{
  "Promotion": "APPROVED" | "REJECTED",
  "Confidence": 0.0 to 1.0,
  "Promotion Type": "selected type",
  "Target File": "suggested_filename.md",
  "Related Pages": ["Page 1", "Page 2"],
  "Reason": "Why this was approved or rejected",
  "Suggested Markdown": "The distilled, permanent markdown to save (only if APPROVED)"
}
"""

@app.post("/api/promote")
async def promote(request: Request):
    data = await request.json()
    question = data.get("question", "")
    answer = data.get("answer", "")
    area = data.get("area", "unknown")

    # Run the Knowledge Compiler prompt
    loop = asyncio.get_event_loop()
    backend = get_backend()
    
    user_msg = f"Question: {question}\n\nAnswer: {answer}"

    def _run_analysis():
        chunks = list(backend.generate(PROMOTION_PROMPT, user_msg, format="json"))
        return "".join(chunks).strip()

    try:
        raw_json = ""
        raw_json = await loop.run_in_executor(None, _run_analysis)
        # Strip markdown code blocks if present
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:]
        elif raw_json.startswith("```"):
            raw_json = raw_json[3:]
        if raw_json.endswith("```"):
            raw_json = raw_json[:-3]
            
        analysis = json.loads(raw_json.strip(), strict=False)
        return JSONResponse({"status": "success", "analysis": analysis})
    except Exception as e:
        print(f"Promotion Parse Error: {e}")
        print(f"Raw Output: {raw_json}")
        return JSONResponse({"status": "error", "message": str(e)})


@app.post("/api/confirm_promotion")
async def confirm_promotion(request: Request):
    data = await request.json()
    analysis = data.get("analysis", {})
    area = data.get("area", "unknown")
    
    target_file = analysis.get("Target File", "")
    markdown = analysis.get("Suggested Markdown", "")
    
    if not target_file or not markdown:
        return JSONResponse({"status": "error", "message": "Missing target file or markdown"})
        
    folder = REPO_ROOT / "knowledge" / "SystemDesign" / area
    folder.mkdir(parents=True, exist_ok=True)
    
    # Ensure it has .md extension
    if not target_file.endswith(".md"):
        target_file += ".md"
        
    # Sanitize filename
    safe_name = "".join(c for c in target_file if c.isalnum() or c in " -_.").strip()
    new_file_path = folder / safe_name

    today = date.today().isoformat()
    
    # If extending, append. Otherwise, write new.
    if new_file_path.exists() and analysis.get("Promotion Type") == "Extend Existing Page":
        with open(new_file_path, "a", encoding="utf-8") as f:
            f.write(f"\n\n## Recent Insights\n\n{markdown}\n")
    else:
        title = safe_name.replace(".md", "").replace("-", " ").replace("_", " ").title()
        with open(new_file_path, "w", encoding="utf-8") as f:
            f.write(f"---\ntitle: {title}\narea: {area}\nstatus: stub\n")
            f.write(f"difficulty: intermediate\ncreated: {today}\n")
            f.write(f"last_reviewed: {today}\nsources: []\ntags: []\n---\n\n")
            f.write(markdown + "\n")

    # Re-compile JSON
    import subprocess
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: subprocess.run(
            [".venv/bin/python", "tools/export_json.py"],
            cwd=str(REPO_ROOT),
        )
    )

    return JSONResponse({"status": "success", "file": safe_name})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

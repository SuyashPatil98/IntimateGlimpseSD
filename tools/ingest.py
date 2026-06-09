#!/usr/bin/env python3
"""Ingest a raw source file → enqueue its sections as 'ingest' review items.

Pass 1 (here, no LLM): extract the file to markdown, split into sections, store
each substantial section as a 'suggested' review item carrying its source text.
Pass 2 (on demand, via /api/review/{id}/draft): the Claude compiler turns a chosen
section into a CREATE/EXTEND/SKIP proposal — so dedup against the vault happens at
draft time (the compiler sees the vault map + the closest existing page).

This keeps a 600-page book from spawning hundreds of blind LLM calls: detection is
free, drafting is per-item and user-chosen.
"""
from __future__ import annotations

import datetime
import hashlib
import json
import re

import config
import extractor
import state

MIN_WORDS = 120          # skip trivial sections
MAX_SECTIONS = 25        # cap per file so the queue isn't flooded


def _sections(md: str) -> list[tuple[str, str]]:
    """Split markdown into (heading, body) by level-1/2 headings."""
    parts = re.split(r"(?m)^#{1,2}\s+(.+?)\s*$", md)
    out, i = [], 1
    while i + 1 < len(parts):
        title, body = parts[i].strip(), parts[i + 1].strip()
        if title:
            out.append((title, body))
        i += 2
    return out


def _manifest_path():
    return config.RAW_DIR / "manifest.json"


def _load_manifest() -> dict:
    p = _manifest_path()
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _save_manifest(m: dict) -> None:
    _manifest_path().write_text(json.dumps(m, indent=2), encoding="utf-8")


def ingest_path(filename: str | None = None) -> dict:
    """Ingest one file (by name in raw/) or every PDF/markdown in raw/."""
    raw = config.RAW_DIR
    if filename:
        p = raw / filename
        targets = [p] if p.exists() else []
    else:
        targets = [f for f in raw.iterdir()
                   if f.suffix.lower() in (".pdf", ".md", ".markdown", ".txt")]
    if not targets:
        return {"status": "error", "message": "no matching source file in raw/"}

    manifest = _load_manifest()
    total = 0
    for f in targets:
        try:
            md = extractor.extract(f)
        except Exception as e:  # noqa: BLE001
            manifest[f.name] = {"error": str(e), "at": _now()}
            continue
        n = 0
        for title, body in _sections(md):
            if n >= MAX_SECTIONS:
                break
            if len(body.split()) < MIN_WORDS:
                continue
            state.add_review_item(
                kind="ingest", title=title[:120], source=f.name, status="suggested",
                summary=re.sub(r"\s+", " ", body[:200]).strip(),
                payload=json.dumps({"source_text": body[:6000]}))
            n += 1
            total += 1
        manifest[f.name] = {"sections_queued": n, "at": _now(),
                            "hash": hashlib.sha1(md[:20000].encode("utf-8")).hexdigest()[:12]}
    _save_manifest(manifest)
    return {"status": "ok", "queued": total,
            "files": [f.name for f in targets], "counts": state.review_counts()}


def _now() -> str:
    return datetime.datetime.now().isoformat(timespec="seconds")


if __name__ == "__main__":
    import sys
    print(json.dumps(ingest_path(sys.argv[1] if len(sys.argv) > 1 else None), indent=2))

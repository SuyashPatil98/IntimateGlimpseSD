#!/usr/bin/env python3
"""Knowledge Compiler — turns a conversation into a vault operation.

compile_conversation() asks the LLM (Claude primary, Qwen fallback) to decide
CREATE / EXTEND / SKIP and returns a structured proposal for the user to review.
apply_decision() validates it through the integrity gate and writes it, then runs
the post-write pipeline. The two are separate so the UI can show + edit the
proposal before anything touches the vault.
"""
from __future__ import annotations

import datetime
import json
import re

import config
import integrity
import llm_adapter
import pipeline
import vault
import vault_write
from prompts import load_prompt

VALID_DECISIONS = {"CREATE", "EXTEND", "SKIP"}


class CompilerError(RuntimeError):
    pass


def build_vault_map(pages: dict | None = None) -> str:
    pages = pages if pages is not None else vault.collect_pages()
    lines = []
    for name in sorted(pages):
        p = pages[name]
        if p["is_meta"]:
            continue
        fm = p["frontmatter"]
        lines.append(f"- [[{name}]] ({fm.get('area', '?')}, {fm.get('status', 'stub')})")
    return "\n".join(lines)


def build_aliases_block() -> str:
    if not config.ALIASES_JSON.exists():
        return ""
    amap = json.loads(config.ALIASES_JSON.read_text(encoding="utf-8"))
    return "\n".join(f"{k} -> {v}" for k, v in sorted(amap.items()))


def _strip_fences(s: str) -> str:
    s = s.strip()
    if s.startswith("```json"):
        s = s[7:]
    elif s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    return s.strip()


def likely_target(conversation: str, pages: dict) -> str | None:
    """Best existing page to EXTEND, via semantic retrieval."""
    try:
        import retrieval
        res = retrieval.search(conversation, top_n=1, expand_graph=False)
        return res[0].page if res and res[0].page in pages else None
    except Exception:
        return None


def compile_conversation(conversation: str, *, multi_turn: bool = False) -> dict:
    """Ask the LLM for a CREATE/EXTEND/SKIP proposal (does NOT write anything)."""
    pages = vault.collect_pages()
    vault_map = build_vault_map(pages)
    aliases = build_aliases_block()
    session_date = datetime.date.today().isoformat()

    target = likely_target(conversation, pages)
    target_block = ""
    if target:
        target_block = (f"<target_page_content>\n"
                        f"{pages[target]['path'].read_text(encoding='utf-8')}\n"
                        f"</target_page_content>\n")

    cache_prefix = f"<vault_map>\n{vault_map}\n</vault_map>\n<aliases>\n{aliases}\n</aliases>\n"
    turn = "deep multi-turn session" if multi_turn else "single conversation"
    user = (f"{target_block}<session_date>{session_date}</session_date>\n"
            f"<mode>{turn}</mode>\n<conversation>\n{conversation}\n</conversation>")

    raw = llm_adapter.complete("promote", load_prompt("knowledge_compiler"),
                               user, cache_prefix=cache_prefix, as_json=True)
    try:
        return json.loads(_strip_fences(raw))
    except json.JSONDecodeError as e:
        raise CompilerError(f"Compiler returned invalid JSON: {e}\n---\n{raw[:500]}") from e


def validate_decision(d: dict) -> tuple[list[str], list[str]]:
    """(blocking, warnings) for a proposal before it's applied."""
    dec = d.get("decision")
    if dec not in VALID_DECISIONS:
        return [f"invalid decision: {dec!r}"], []
    if dec == "SKIP":
        return [], []
    resolver = vault.build_resolver(vault.collect_pages())
    if dec == "CREATE":
        blocking, warnings = [], []
        if not d.get("content"):
            blocking.append("CREATE: missing content")
        else:
            b, w = integrity.validate_new_page(d["content"], resolver)
            blocking += b
            warnings += w
        links = d.get("wikilinks") or []
        bad = [l for l in links if resolver.get(str(l).lower()) is None]
        if bad:
            warnings.append(f"wikilinks not in vault: {bad}")
        return blocking, warnings
    # EXTEND
    blocking, warnings = [], []
    if not d.get("target_title") or resolver.get(str(d["target_title"]).lower()) is None:
        blocking.append(f"EXTEND: unknown target_title {d.get('target_title')!r}")
    if not d.get("target_section"):
        blocking.append("EXTEND: missing target_section")
    if d.get("merge_strategy") not in vault_write.VALID_MERGE:
        blocking.append(f"EXTEND: invalid merge_strategy {d.get('merge_strategy')!r}")
    if not d.get("new_content"):
        blocking.append("EXTEND: missing new_content")
    if not blocking:
        b, w = integrity.validate_extend(d["target_section"], d["new_content"], resolver)
        blocking += b
        warnings += w
    return blocking, warnings


def _links_in(text: str) -> list[str]:
    return [m.split("|")[0].split("#")[0].strip()
            for m in re.findall(r"\[\[([^\[\]]+?)\]\]", text)]


def apply_decision(d: dict) -> dict:
    """Validate + write + run the pipeline. Returns a result dict."""
    blocking, warnings = validate_decision(d)
    if blocking:
        return {"applied": False, "decision": d.get("decision"),
                "blocking": blocking, "warnings": warnings}

    dec = d["decision"]
    if dec == "SKIP":
        return {"applied": False, "decision": "SKIP", "reason": d.get("reason", "")}

    if dec == "CREATE":
        title, area = d["title"], d["area"]
        vault_write.write_new_page(title, area, d["content"])
        pipe = pipeline.post_vault_write(
            [title], new_page=title, area=area,
            wikilinks=d.get("wikilinks") or _links_in(d["content"]), operation="create")
        return {"applied": True, "decision": "CREATE", "title": title, "area": area,
                "warnings": warnings, "pipeline": pipe}

    # EXTEND
    pages = vault.collect_pages()
    resolver = vault.build_resolver(pages)
    canon = resolver[str(d["target_title"]).lower()]
    path = pages[canon]["path"]
    vault_write.apply_merge(path, d["target_section"], d["merge_strategy"], d["new_content"])
    pipe = pipeline.post_vault_write(
        [canon], new_page=canon, wikilinks=_links_in(d["new_content"]), operation="extend")
    return {"applied": True, "decision": "EXTEND", "target": canon,
            "section": d["target_section"], "warnings": warnings, "pipeline": pipe}

#!/usr/bin/env python3
"""Per-page integrity validators, enforced at write time.

These are the guardrails that keep the vault getting *better*, not just bigger.
`validate_new_page` and `validate_extend` return (blocking[], warnings[]). The
write pipeline blocks on the first list and surfaces the second in the UI.
"""
from __future__ import annotations

import re

import config
import vault
from export_json import get_recall_block, parse_questions
from vault_write import FORBIDDEN_SECTIONS

WIKILINK_RE = re.compile(r"\[\[([^\[\]]+?)\]\]")
VALID_STATUS = {"stub", "draft", "mature", "comprehensive"}
SHALLOW_Q = re.compile(r"^\s*what\s+is\s+\w", re.IGNORECASE)


def _body_wikilinks(body: str) -> list[str]:
    out = []
    for raw in WIKILINK_RE.findall(body):
        t = raw.split("|", 1)[0].split("#", 1)[0].strip()
        if t:
            out.append(t)
    return out


def check_frontmatter(fm: dict) -> list[str]:
    errs = []
    if not fm.get("title"):
        errs.append("frontmatter: missing title")
    if fm.get("area") not in config.AREAS:
        errs.append(f"frontmatter: invalid area {fm.get('area')!r}")
    if fm.get("status") not in VALID_STATUS:
        errs.append(f"frontmatter: invalid status {fm.get('status')!r}")
    if fm.get("status") in {"mature", "comprehensive"}:
        errs.append("frontmatter: promoted pages must start at stub/draft")
    if not fm.get("sources"):
        errs.append("frontmatter: sources must be non-empty")
    return errs


def check_forbidden_sections(body: str) -> list[str]:
    errs = []
    for m in re.finditer(r"^##\s+(.+?)\s*$", body, re.MULTILINE):
        if m.group(1).strip().lower() in FORBIDDEN_SECTIONS:
            errs.append(f"forbidden section: '## {m.group(1).strip()}'")
    return errs


def check_min_wikilinks(body: str, minimum: int = 3) -> list[str]:
    n = len(set(_body_wikilinks(body)))
    return [] if n >= minimum else [f"only {n} wikilinks (minimum {minimum})"]


def check_links_resolve(body: str, resolver: dict) -> list[str]:
    errs = []
    for link in set(_body_wikilinks(body)):
        if resolver.get(link.lower()) is None:
            errs.append(f"unresolved wikilink: [[{link}]]")
    return errs


def check_recall(body: str) -> list[str]:
    block = get_recall_block(body)
    qs = parse_questions(block) if block else []
    errs = []
    if len(qs) < 3:
        errs.append(f"only {len(qs)} recall questions (minimum 3)")
    for q in qs:
        if SHALLOW_Q.match(q["question"]):
            errs.append(f"shallow question: {q['question']!r}")
        if len(q["answer"].split()) < 10:
            errs.append(f"recall answer too short (<10 words): {q['answer'][:40]!r}")
    return errs


def check_related_parity(fm: dict, body: str) -> list[str]:
    fm_related = {re.sub(r"\[\[(.+?)(?:\|.+?)?\]\]", r"\1", str(v)).strip()
                  for v in (fm.get("related") or [])}
    body_rel_section = ""
    m = re.search(r"^##\s+Related Concepts\s*$", body, re.MULTILINE)
    if m:
        rest = body[m.end():]
        nxt = re.search(r"^##\s+", rest, re.MULTILINE)
        body_rel_section = rest[: nxt.start() if nxt else len(rest)]
    body_related = set(_body_wikilinks(body_rel_section))
    if fm_related and body_related and fm_related != body_related:
        return ["frontmatter 'related' diverges from body Related Concepts"]
    return []


def validate_new_page(content: str, resolver: dict | None = None) -> tuple[list[str], list[str]]:
    """Returns (blocking, warnings) for a CREATE page's full markdown."""
    if resolver is None:
        resolver = vault.build_resolver(vault.collect_pages())
    fm, body = vault.parse_frontmatter(content)
    blocking = (check_frontmatter(fm) + check_forbidden_sections(body)
                + check_min_wikilinks(body) + check_links_resolve(body, resolver))
    warnings = check_recall(body) + check_related_parity(fm, body)
    return blocking, warnings


def validate_extend(target_section: str, new_content: str,
                    resolver: dict | None = None) -> tuple[list[str], list[str]]:
    if resolver is None:
        resolver = vault.build_resolver(vault.collect_pages())
    blocking, warnings = [], []
    if target_section.lstrip("#").strip().lower() in FORBIDDEN_SECTIONS:
        blocking.append(f"forbidden target section: {target_section!r}")
    warnings += check_links_resolve(new_content, resolver)
    return blocking, warnings

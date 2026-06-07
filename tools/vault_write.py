#!/usr/bin/env python3
"""Vault write primitives — section-aware merging and page creation.

This module fixes the project's worst failure mode: the old promote path appended
promoted content under a literal `## Recent Insights` heading at the bottom of a
page, turning pages into layered sediment. Here, an EXTEND merges into the *named
existing section* with an explicit strategy, and junk section names are refused.

Knowledge stays Obsidian-native: pages keep their title-based filenames, YAML
frontmatter is preserved verbatim, and links are `[[wikilinks]]`.
"""
from __future__ import annotations

import re
from pathlib import Path

import config

# Section names that signal the compiler punted on targeting — never allowed.
FORBIDDEN_SECTIONS = {
    "recent insights", "new insights", "session notes", "update", "updates", "notes",
}

VALID_MERGE = {
    "ADD_ROW_TO_TABLE", "ADD_BULLET", "REWRITE_PARAGRAPH",
    "ADD_RECALL_QUESTION", "ADD_SUBSECTION",
}


class VaultWriteError(RuntimeError):
    pass


# ── Raw frontmatter split (preserves the block verbatim) ─────────────────────
def split_raw(text: str) -> tuple[str, str]:
    """(frontmatter_block_incl_delimiters, body). Empty fm if none."""
    m = re.match(r"^(---\r?\n.*?\r?\n---\r?\n)(.*)$", text, re.DOTALL)
    return (m.group(1), m.group(2)) if m else ("", text)


def _find_section(body: str, name: str):
    """Return (heading_start, content_start, content_end) for `## name`, or None."""
    name = name.lstrip("#").strip()
    m = re.search(rf"^##\s+{re.escape(name)}\s*$", body, re.MULTILINE | re.IGNORECASE)
    if not m:
        return None
    content_start = m.end()
    nxt = re.search(r"^##\s+", body[content_start:], re.MULTILINE)
    content_end = content_start + nxt.start() if nxt else len(body)
    return m.start(), content_start, content_end


def _merge_into(section_body: str, strategy: str, new_content: str) -> str:
    section = section_body.rstrip("\n")
    nc = new_content.strip()
    if strategy == "ADD_ROW_TO_TABLE":
        lines = section.split("\n")
        last_row = max((i for i, l in enumerate(lines) if l.lstrip().startswith("|")),
                       default=None)
        row = nc if nc.startswith("|") else f"| {nc} |"
        if last_row is None:
            lines.append(row)
        else:
            lines.insert(last_row + 1, row)
        return "\n".join(lines) + "\n\n"
    if strategy == "ADD_BULLET":
        if not nc.startswith(("-", "*")):
            nc = f"- {nc}"
        return f"{section}\n{nc}\n\n"
    if strategy == "ADD_RECALL_QUESTION":
        return f"{section}\n{nc}\n\n"
    if strategy == "ADD_SUBSECTION":
        if not nc.startswith("#"):
            nc = f"### {nc}"
        return f"{section}\n\n{nc}\n\n"
    if strategy == "REWRITE_PARAGRAPH":
        # Conservative: add the corrected paragraph; the conflict is flagged
        # separately for human review rather than risking a wrong auto-replace.
        return f"{section}\n\n{nc}\n\n"
    raise VaultWriteError(f"Unknown merge_strategy: {strategy!r}")


def apply_merge(path: Path, target_section: str, merge_strategy: str,
                new_content: str, *, create_if_missing: bool = False) -> None:
    """Merge `new_content` into `target_section` of the page at `path`."""
    name = target_section.lstrip("#").strip()
    if name.lower() in FORBIDDEN_SECTIONS:
        raise VaultWriteError(
            f"Refusing forbidden section '{target_section}' — merge into a real section."
        )
    if merge_strategy not in VALID_MERGE:
        raise VaultWriteError(f"Invalid merge_strategy: {merge_strategy!r}")

    text = path.read_text(encoding="utf-8")
    fm, body = split_raw(text)
    span = _find_section(body, name)
    if span is None:
        if create_if_missing:
            body = body.rstrip("\n") + f"\n\n## {name}\n\n"
            span = _find_section(body, name)
        else:
            raise VaultWriteError(
                f"Section '{target_section}' not found in {path.name}; "
                f"refusing to append a new section (would create sediment)."
            )
    h_start, c_start, c_end = span
    merged = _merge_into(body[c_start:c_end], merge_strategy, new_content)
    body = body[:c_start] + "\n" + merged + body[c_end:].lstrip("\n")
    path.write_text(fm + body, encoding="utf-8")


# ── Frontmatter `related` (inline-list form) ─────────────────────────────────
def _add_inline_related(fm_block: str, value: str) -> str:
    def repl(m):
        items = m.group(1).strip()
        if value in items:
            return m.group(0)
        sep = ", " if items else ""
        return f'related: [{items}{sep}"{value}"]'
    new, n = re.subn(r"^related:\s*\[(.*?)\]\s*$", repl, fm_block, flags=re.MULTILINE)
    return new if n else fm_block


# ── Backlinks ────────────────────────────────────────────────────────────────
def add_backlink(path: Path, new_page_name: str, note: str = "related concept.") -> None:
    """Add `[[new_page_name]]` to a page's Related Concepts (body + frontmatter)."""
    text = path.read_text(encoding="utf-8")
    fm, body = split_raw(text)
    link_line = f"- [[{new_page_name}]] — {note}"
    # Body: add a bullet to ## Related Concepts (create it if missing — it's a
    # required schema section, so this is correct, not sediment).
    if f"[[{new_page_name}]]" not in body:
        span = _find_section(body, "Related Concepts")
        if span is None:
            body = body.rstrip("\n") + "\n\n## Related Concepts\n\n" + link_line + "\n"
        else:
            _, c_start, c_end = span
            merged = _merge_into(body[c_start:c_end], "ADD_BULLET", link_line)
            body = body[:c_start] + "\n" + merged + body[c_end:].lstrip("\n")
    fm = _add_inline_related(fm, f"[[{new_page_name}]]")
    path.write_text(fm + body, encoding="utf-8")


# ── Page creation (CREATE) ───────────────────────────────────────────────────
def page_path(title: str, area: str) -> Path:
    safe = re.sub(r'[<>:"/\\|?*]', "", title).strip()
    return config.VAULT_ROOT / area / f"{safe}.md"


def write_new_page(title: str, area: str, content: str) -> Path:
    if area not in config.AREAS:
        raise VaultWriteError(f"Invalid area: {area!r}")
    p = page_path(title, area)
    if p.exists():
        raise VaultWriteError(f"Page already exists: {p.relative_to(config.VAULT_ROOT)}")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content if content.endswith("\n") else content + "\n", encoding="utf-8")
    return p

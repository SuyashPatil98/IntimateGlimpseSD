"""
Shared vault parsing for tools/ scripts.
"""
from __future__ import annotations
import re
from pathlib import Path
import yaml

VAULT = Path(__file__).resolve().parent.parent / "knowledge" / "SystemDesign"
EXCLUDE_DIRS = {"raw", ".obsidian", "tools", ".git", "TagsRoutes", "roadmaps"}
META_FILES = {"wiki", "index", "schema", "log", "source-map", "SESSION_STATE", "inbox"}


def parse_frontmatter(text: str):
    if not text.startswith("---"):
        return {}, text
    m = re.match(r"---\r?\n(.*?)\r?\n---\r?\n(.*)", text, re.DOTALL)
    if not m:
        return {}, text
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        fm = {}
    return fm, m.group(2)


WIKILINK_RE = re.compile(r"\[\[([^\[\]]+?)\]\]")


def strip_code_blocks(text: str) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"~~~.*?~~~", "", text, flags=re.DOTALL)
    text = re.sub(r"`[^`\n]+`", "", text)
    return text


def extract_wikilinks(body: str):
    out = []
    for raw in WIKILINK_RE.findall(body):
        target = raw.split("|", 1)[0].split("#", 1)[0].strip()
        if target:
            out.append(target)
    return out


def parse_link_list(value):
    """Frontmatter list of [[wikilinks]] → list of bare names."""
    if not value:
        return []
    if isinstance(value, str):
        value = [value]
    out = []
    for v in value:
        clean = re.sub(r"\[\[(.+?)(?:\|.+?)?\]\]", r"\1", str(v)).strip()
        if clean:
            out.append(clean)
    return out


def collect_pages():
    """Return {name: {frontmatter, body, path, prereqs, related, builds_toward, wikilinks, aliases, is_meta}}."""
    pages = {}
    for md in VAULT.rglob("*.md"):
        if any(part in EXCLUDE_DIRS for part in md.parts):
            continue
        text = md.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
        name = md.stem
        body_for_links = strip_code_blocks(body)
        aliases = []
        a = fm.get("aliases")
        if isinstance(a, list):
            aliases = [str(x) for x in a]
        elif isinstance(a, str):
            aliases = [a]
        is_meta = name in META_FILES or fm.get("type") == "meta"
        pages[name] = {
            "name": name,
            "path": md,
            "frontmatter": fm,
            "body": body,
            "wikilinks": extract_wikilinks(body_for_links),
            "prereqs": parse_link_list(fm.get("prerequisites")),
            "related": parse_link_list(fm.get("related")),
            "builds_toward": parse_link_list(fm.get("builds_toward")),
            "aliases": aliases,
            "is_meta": is_meta,
        }
    return pages


def build_resolver(pages):
    """name/alias (case-insensitive) → canonical page name."""
    resolver = {}
    for name, p in pages.items():
        resolver[name.lower()] = name
        for a in p["aliases"]:
            resolver[a.lower()] = name
    return resolver


def resolve(target, resolver):
    return resolver.get(target.lower())


DIFFICULTY_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2, "staff": 3}


def difficulty_rank(page):
    return DIFFICULTY_ORDER.get(page["frontmatter"].get("difficulty", "intermediate"), 1)

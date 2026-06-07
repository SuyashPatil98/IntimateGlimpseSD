"""
Vault <-> Notion sync.

Vault is canonical. Notion holds personal study state (status, confidence,
last_studied) and progress tracking (roadmaps, sessions). Sync flow:

  push   vault content + roadmaps  --->  Notion (idempotent upsert)
  pull   Notion `Needs Vault Edit`  --->  vault/inbox.md
  full   push then pull

Usage:
  python tools/sync_notion.py push
  python tools/sync_notion.py pull
  python tools/sync_notion.py full

Requires: pip install notion-client python-dotenv
.env file at tools/.env (see .env.example)
"""
from __future__ import annotations
import os
import re
import sys
import time
from datetime import date, datetime
from pathlib import Path

try:
    from notion_client import Client
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: missing deps. Run: pip install notion-client python-dotenv")
    sys.exit(1)

from vault import VAULT, collect_pages, build_resolver, resolve

load_dotenv(Path(__file__).resolve().parent / ".env")

TOKEN = os.environ.get("NOTION_TOKEN")
CONCEPTS_DB = os.environ.get("CONCEPTS_DB_ID")
ROADMAPS_DB = os.environ.get("ROADMAPS_DB_ID")
INBOX_DB = os.environ.get("INBOX_DB_ID")
INBOX_FILE = VAULT / "inbox.md"

for k, v in [("NOTION_TOKEN", TOKEN), ("CONCEPTS_DB_ID", CONCEPTS_DB),
             ("ROADMAPS_DB_ID", ROADMAPS_DB), ("INBOX_DB_ID", INBOX_DB)]:
    if not v:
        print(f"ERROR: env var {k} not set; see tools/.env.example")
        sys.exit(1)

notion = Client(auth=TOKEN)


# ---------- Helpers ----------

def title(text):
    return {"title": [{"text": {"content": text[:2000]}}]}

def rich(text):
    return {"rich_text": [{"text": {"content": text[:2000]}}]}

def select(name):
    return {"select": {"name": str(name)[:100]}} if name else {"select": None}

def multi(names):
    return {"multi_select": [{"name": str(n)[:100]} for n in (names or [])]}

def number(v):
    return {"number": float(v) if v is not None else None}

def relation(ids):
    return {"relation": [{"id": i} for i in ids if i]}

def date_prop(d):
    if not d:
        return {"date": None}
    if isinstance(d, str):
        return {"date": {"start": d}}
    return {"date": {"start": d.isoformat()}}

def checkbox(v):
    return {"checkbox": bool(v)}


def paginate(query_fn, **kwargs):
    """Yield all rows from a paginated Notion query."""
    next_cursor = None
    while True:
        params = dict(kwargs)
        if next_cursor:
            params["start_cursor"] = next_cursor
        resp = query_fn(**params)
        for row in resp["results"]:
            yield row
        if not resp.get("has_more"):
            return
        next_cursor = resp.get("next_cursor")


def find_by_vault_path(vault_path: str):
    """Return Notion row id matching Vault Path, or None."""
    resp = notion.databases.query(
        database_id=CONCEPTS_DB,
        filter={"property": "Vault Path", "rich_text": {"equals": vault_path}},
        page_size=1,
    )
    rows = resp["results"]
    return rows[0]["id"] if rows else None


def find_roadmap_by_title(title_str: str):
    resp = notion.databases.query(
        database_id=ROADMAPS_DB,
        filter={"property": "Title", "title": {"equals": title_str}},
        page_size=1,
    )
    rows = resp["results"]
    return rows[0]["id"] if rows else None


# ---------- PUSH: Concepts ----------

def parse_link_list_to_names(values, resolver):
    out = []
    for v in (values or []):
        clean = re.sub(r"\[\[(.+?)(?:\|.+?)?\]\]", r"\1", str(v)).strip()
        canon = resolve(clean, resolver)
        if canon:
            out.append(canon)
    return out


def push_concepts(pages, resolver):
    print("Pushing concepts...")
    # Pass 1: upsert all rows (without relations — they need everyone present first)
    name_to_id = {}
    for i, (name, p) in enumerate(sorted(pages.items())):
        if p["is_meta"]:
            continue
        fm = p["frontmatter"]
        if not fm.get("area"):
            continue
        rel_path = str(p["path"].relative_to(VAULT)).replace("\\", "/")

        sources = fm.get("sources") or []
        if isinstance(sources, str):
            sources = [sources]
        # Notion multi-select tag limit: keep short labels
        sources = [s[:90] for s in sources][:20]
        tags = fm.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]

        props = {
            "Title": title(fm.get("title", name)),
            "Area": select(fm.get("area")),
            "Difficulty": select(fm.get("difficulty")),
            "Sources": multi(sources),
            "Tags": multi(tags),
            "Vault Path": rich(rel_path),
            "Last Synced": date_prop(date.today()),
        }

        existing = find_by_vault_path(rel_path)
        if existing:
            notion.pages.update(page_id=existing, properties=props)
            name_to_id[name] = existing
        else:
            # Default Status when creating
            props["Status"] = select("Not started")
            created = notion.pages.create(
                parent={"database_id": CONCEPTS_DB},
                properties=props,
            )
            name_to_id[name] = created["id"]

        if (i + 1) % 25 == 0:
            print(f"  ... {i + 1} processed")
        time.sleep(0.05)  # gentle rate limit

    # Pass 2: relations
    print("Wiring relations...")
    for name, p in pages.items():
        if name not in name_to_id:
            continue
        prereq_ids = [name_to_id.get(n) for n in
                      parse_link_list_to_names(p["prereqs"], resolver) if n in name_to_id]
        related_ids = [name_to_id.get(n) for n in
                       parse_link_list_to_names(p["related"], resolver) if n in name_to_id]
        bt_ids = [name_to_id.get(n) for n in
                  parse_link_list_to_names(p["builds_toward"], resolver) if n in name_to_id]
        notion.pages.update(
            page_id=name_to_id[name],
            properties={
                "Prerequisites": relation(prereq_ids),
                "Related": relation(related_ids),
                "Builds Toward": relation(bt_ids),
            },
        )
        time.sleep(0.05)

    return name_to_id


# ---------- PUSH: Roadmaps ----------

ROADMAP_PHASE_RE = re.compile(
    r"^## (Phase 0[^\n]*|Phase 1[^\n]*|Phase 2[^\n]*)\s*\n(.*?)(?=\n## |\Z)",
    re.MULTILINE | re.DOTALL,
)
ROADMAP_ITEM_RE = re.compile(r"^- \[ \] \[\[([^\]|]+?)(?:\|.+?)?\]\]", re.MULTILINE)


def parse_roadmap_md(path):
    text = path.read_text(encoding="utf-8")
    title_match = re.search(r"^# (.+)$", text, re.MULTILINE)
    title_str = title_match.group(1).replace(" — Learning Roadmap", "") if title_match else path.stem
    phases = {"foundation": [], "core": [], "applications": []}
    for m in ROADMAP_PHASE_RE.finditer(text):
        header = m.group(1)
        body = m.group(2)
        items = ROADMAP_ITEM_RE.findall(body)
        if "Phase 0" in header:
            phases["foundation"] = items
        elif "Phase 1" in header:
            phases["core"] = items
        elif "Phase 2" in header:
            phases["applications"] = items
    return title_str, phases


def push_roadmaps(name_to_id, resolver):
    print("Pushing roadmaps...")
    roadmaps_dir = VAULT / "roadmaps"
    if not roadmaps_dir.exists():
        print("  no roadmaps/ directory; run build_roadmaps.py first")
        return
    for md in sorted(roadmaps_dir.glob("*.md")):
        if md.stem.startswith("_"):
            continue
        title_str, phases = parse_roadmap_md(md)
        # Resolve concept names to ids
        def ids_for(names):
            out = []
            for n in names:
                canon = resolve(n, resolver)
                if canon and canon in name_to_id:
                    out.append(name_to_id[canon])
            return out

        props = {
            "Title": title(title_str),
            "Area": select(md.stem),
            "Phase 0 — Foundation": relation(ids_for(phases["foundation"])),
            "Phase 1 — Core": relation(ids_for(phases["core"])),
            "Phase 2 — Applications": relation(ids_for(phases["applications"])),
        }
        existing = find_roadmap_by_title(title_str)
        if existing:
            notion.pages.update(page_id=existing, properties=props)
        else:
            props["Status"] = select("Active")
            notion.pages.create(parent={"database_id": ROADMAPS_DB}, properties=props)
        print(f"  -> {title_str}")
        time.sleep(0.1)


# ---------- PULL: Inbox / Needs Vault Edit ----------

def pull_inbox():
    print("Pulling capture-back items...")
    today = date.today().isoformat()
    new_items = []

    # 1. Concepts with Needs Vault Edit = true
    for row in paginate(
        notion.databases.query,
        database_id=CONCEPTS_DB,
        filter={"property": "Needs Vault Edit", "checkbox": {"equals": True}},
    ):
        props = row["properties"]
        title_text = "".join(t.get("plain_text", "") for t in props["Title"]["title"])
        note_text = "".join(t.get("plain_text", "") for t in props.get("Revision Note", {}).get("rich_text", []))
        new_items.append({
            "type": "concept",
            "title": title_text,
            "note": note_text or "(no note)",
            "row_id": row["id"],
        })

    # 2. Inbox DB rows with Status = Open
    for row in paginate(
        notion.databases.query,
        database_id=INBOX_DB,
        filter={"property": "Status", "select": {"equals": "Open"}},
    ):
        props = row["properties"]
        subj = "".join(t.get("plain_text", "") for t in props["Subject"]["title"])
        note = "".join(t.get("plain_text", "") for t in props.get("Note", {}).get("rich_text", []))
        src = props.get("Source", {}).get("select", {})
        src_name = src.get("name") if src else "Notion"
        new_items.append({
            "type": "inbox",
            "title": subj or "(untitled)",
            "note": note or "(no note)",
            "source": src_name,
            "row_id": row["id"],
        })

    if not new_items:
        print("  no flagged items")
        return

    # Append to inbox.md
    lines = [f"\n## {today} — pulled from Notion\n"]
    for it in new_items:
        if it["type"] == "concept":
            lines.append(f"- [[{it['title']}]] — {it['note']}")
        else:
            lines.append(f"- ({it['source']}) **{it['title']}** — {it['note']}")
    block = "\n".join(lines) + "\n"

    if INBOX_FILE.exists():
        INBOX_FILE.write_text(INBOX_FILE.read_text(encoding="utf-8") + block, encoding="utf-8")
    else:
        header = (
            "---\ntype: meta\nsubtype: inbox\n---\n\n"
            "# Inbox — capture-back from Notion / Anki\n\n"
            "> Auto-appended by `tools/sync_notion.py pull`. Process each item in Obsidian "
            "(edit the relevant vault page), then re-run `push` to clear the flags in Notion.\n"
        )
        INBOX_FILE.write_text(header + block, encoding="utf-8")

    # Mark processed
    today_date = {"start": today}
    for it in new_items:
        if it["type"] == "concept":
            notion.pages.update(
                page_id=it["row_id"],
                properties={
                    "Needs Vault Edit": checkbox(False),
                    "Revision Note": rich(""),
                },
            )
        else:
            notion.pages.update(
                page_id=it["row_id"],
                properties={
                    "Status": select("Processed"),
                    "Processed Date": {"date": today_date},
                },
            )
    print(f"  {len(new_items)} item(s) appended to inbox.md and cleared in Notion")


# ---------- Main ----------

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("push", "pull", "full"):
        print("Usage: python tools/sync_notion.py {push|pull|full}")
        sys.exit(1)
    cmd = sys.argv[1]
    pages = collect_pages()
    resolver = build_resolver(pages)
    print(f"Loaded {len(pages)} pages")

    if cmd in ("push", "full"):
        name_to_id = push_concepts(pages, resolver)
        push_roadmaps(name_to_id, resolver)
    if cmd in ("pull", "full"):
        pull_inbox()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Post-write pipeline — runs automatically after every vault write.

The old system required a manual server restart for a promoted page to become
searchable and for the frontend to refresh. This makes it automatic: patch
backlinks, log it, re-index for search, recompile the frontend data. Each step
is best-effort and isolated so one failure can't corrupt the others.
"""
from __future__ import annotations

import datetime
import re

import backlink_patcher
import config
import export_json


def _append_log(operation: str, name: str, action: str = "written", lint: str = "ok") -> None:
    if not config.LOG_MD.exists():
        return
    text = config.LOG_MD.read_text(encoding="utf-8")
    entry = (f"## {datetime.date.today().isoformat()} — {operation.title()} — {name}\n"
             f"- Action: {action}\n- Lint: {lint}\n\n")
    m = re.search(r"^##\s+\d{4}-\d{2}-\d{2}", text, re.MULTILINE)
    text = (text[:m.start()] + entry + text[m.start():]) if m else (text.rstrip() + "\n\n" + entry)
    config.LOG_MD.write_text(text, encoding="utf-8")


def _add_to_index(name: str, area: str) -> None:
    if not config.INDEX_MD.exists():
        return
    text = config.INDEX_MD.read_text(encoding="utf-8")
    if f"[[{name}]]" in text:
        return
    # Find a heading whose slugified text matches the area.
    for m in re.finditer(r"^#{2,3}\s+(.+?)\s*$", text, re.MULTILINE):
        slug = re.sub(r"[^a-z0-9]+", "-", m.group(1).strip().lower()).strip("-")
        if slug == area:
            insert = m.end()
            text = text[:insert] + f"\n- [[{name}]]" + text[insert:]
            config.INDEX_MD.write_text(text, encoding="utf-8")
            return


def post_vault_write(changed_names: list[str], *, new_page: str | None = None,
                     area: str | None = None, wikilinks: list[str] | None = None,
                     operation: str = "promote", reindex: bool = True) -> dict:
    """Run the consistency pipeline. Returns a status dict for the UI."""
    result: dict = {"changed": changed_names, "backlinks": [], "reindexed": False,
                    "course_json": False, "log": False, "errors": {}}

    if new_page and wikilinks:
        try:
            result["backlinks"] = backlink_patcher.patch_backlinks(new_page, wikilinks)
        except Exception as e:  # noqa: BLE001
            result["errors"]["backlinks"] = str(e)

    try:
        _append_log(operation, new_page or (changed_names[0] if changed_names else "?"))
        if new_page and area:
            _add_to_index(new_page, area)
        result["log"] = True
    except Exception as e:  # noqa: BLE001
        result["errors"]["log"] = str(e)

    if reindex:
        try:
            import retrieval
            retrieval.rebuild()  # incremental — only changed pages re-embed
            result["reindexed"] = True
        except Exception as e:  # noqa: BLE001
            result["errors"]["reindex"] = str(e)

    try:
        export_json.main()
        result["course_json"] = True
    except Exception as e:  # noqa: BLE001
        result["errors"]["course_json"] = str(e)

    return result

#!/usr/bin/env python3
"""Backlink patcher — keeps the Obsidian graph connected.

When a new page links out to existing pages, those pages don't automatically link
back. A one-way link already makes the new node non-orphan in Obsidian's graph,
but a two-way link makes it a first-class citizen (it shows in the older page's
backlinks panel too). After every CREATE/EXTEND, this adds the reverse links.
"""
from __future__ import annotations

import vault
import vault_write


def patch_backlinks(new_page_name: str, linked_names: list[str], note: str = "related concept.") -> list[str]:
    """For each page `new_page_name` links to, add a link back if absent.

    Returns the list of pages that were patched.
    """
    pages = vault.collect_pages()
    resolver = vault.build_resolver(pages)
    patched: list[str] = []
    seen = set()
    for raw in linked_names:
        canon = resolver.get(str(raw).lower())
        if not canon or canon == new_page_name or canon in seen:
            continue
        seen.add(canon)
        target = pages.get(canon)
        if not target or target["is_meta"]:
            continue
        existing = {w.lower() for w in target["wikilinks"]}
        if new_page_name.lower() in existing:
            continue  # already links back
        try:
            vault_write.add_backlink(target["path"], new_page_name, note)
            patched.append(canon)
        except Exception as exc:  # noqa: BLE001 — best-effort, never block a write
            print(f"[backlink_patcher] skip {canon}: {exc}")
    return patched


if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3:
        print("patched:", patch_backlinks(sys.argv[1], sys.argv[2:]))

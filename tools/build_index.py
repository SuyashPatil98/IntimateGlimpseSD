#!/usr/bin/env python3
"""Regenerate index.md from the live vault so the master catalog never goes stale.

The old index.md only listed the first 3 areas and claimed "zero concept pages yet."
This rebuilds it from the actual pages every run, with per-area status counts. Wire it
into the post-write pipeline (or run by hand) and the index maintains itself.

Usage:  ../.venv-win/Scripts/python tools/build_index.py   (from repo root, --app-dir style)
        or:  python build_index.py   (from tools/)
"""
from __future__ import annotations

import datetime
from collections import defaultdict

import config
import vault

AREA_DESC = {
    "distributed-systems": "How nodes coordinate without shared memory over unreliable networks.",
    "databases": "Storage engines, transaction systems, query execution.",
    "networking": "The protocols and primitives every system runs on.",
    "storage": "Durability, encoding, persistent state.",
    "messaging": "Asynchronous communication, decoupling.",
    "caching": "Trading consistency for latency, deliberately.",
    "reliability": "Keeping systems alive under failure.",
    "architecture-patterns": "System-level shapes.",
    "design-patterns": "Code-level reusable solutions.",
    "software-engineering": "How engineering organizations build and maintain software.",
    "data-engineering": "Moving and transforming data at scale.",
    "ml-systems": "Productionizing machine learning.",
    "system-design-interview": "Interview methodology, common design problems, quick-reference.",
    "case-studies": "End-to-end analyses of real-world systems.",
}
STATUS_RANK = {"comprehensive": 0, "mature": 1, "draft": 2, "stub": 3}
STATUS_MARK = {"comprehensive": "★", "mature": "●", "draft": "◐", "stub": "○"}


def main():
    pages = vault.collect_pages()
    concept = {n: p for n, p in pages.items() if not p["is_meta"]}

    by_area = defaultdict(list)
    for name, p in concept.items():
        status = (p["frontmatter"].get("status") or "stub").strip()
        by_area[p["frontmatter"].get("area", "unknown")].append((name, status))

    total = len(concept)
    mature = sum(1 for p in concept.values()
                 if p["frontmatter"].get("status") in ("mature", "comprehensive"))
    pct = round(mature / total * 100) if total else 0

    out = [
        "---", "type: meta", "subtype: index",
        f"last_updated: {datetime.date.today().isoformat()}",
        "generated_by: tools/build_index.py", "---", "",
        "# System Design Wiki — Index", "",
        "A unified knowledge base on system design, distilled from canonical sources. "
        "Organized by **concept**, never by book or author.", "",
        f"**{total} concept pages** across {len(config.AREAS)} areas · "
        f"{mature} mature+ ({pct}%).",
        "",
        "> Auto-generated from the live vault — do not hand-edit. Rebuild with "
        "`tools/build_index.py`.", "",
        "→ Read [[schema]] first if you're contributing. → See [[log]] for the change record.",
        "",
        "Legend:  ★ comprehensive · ● mature · ◐ draft · ○ stub", "",
        "---", "",
    ]

    for area in config.AREAS:
        items = sorted(by_area.get(area, []),
                       key=lambda t: (STATUS_RANK.get(t[1], 9), t[0].lower()))
        m = sum(1 for _, s in items if s in ("mature", "comprehensive"))
        title = area.replace("-", " ").title()
        out += [f"### {title} · `{area}/`", "", AREA_DESC.get(area, ""), "",
                f"**{len(items)} pages** · {m} mature+", ""]
        if items:
            out.append(" · ".join(f"{STATUS_MARK.get(s, '○')} [[{n}]]" for n, s in items))
        else:
            out.append("_No pages yet._")
        out.append("")

    out += ["---", "", f"_Regenerated {datetime.date.today().isoformat()} "
            f"from {total} live vault pages._", ""]

    config.INDEX_MD.write_text("\n".join(out), encoding="utf-8")
    print(f"Wrote {config.INDEX_MD}  ({total} pages, {mature} mature+, {pct}%)")


if __name__ == "__main__":
    main()

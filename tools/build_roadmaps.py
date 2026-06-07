"""
Build learning roadmaps from the vault's prereq DAG.

For each area: generate a topologically-sorted, difficulty-graded reading path
with three phases:
  Phase 0 — cross-area prerequisites (foundation)
  Phase 1 — in-area concepts in dependency order
  Phase 2 — case studies & applications (downstream pages that build on this area)

Output: roadmaps/<area>.md, one per area.
Also generates roadmaps/_all.md with an index of all roadmaps.

Usage: python tools/build_roadmaps.py
"""
from __future__ import annotations
from collections import defaultdict, deque
from datetime import date
from pathlib import Path

from vault import (
    VAULT, collect_pages, build_resolver, resolve, difficulty_rank,
)

ROADMAPS_DIR = VAULT / "roadmaps"

AREAS = [
    "distributed-systems", "databases", "networking", "storage", "messaging",
    "caching", "reliability", "architecture-patterns", "design-patterns",
    "software-engineering", "data-engineering", "ml-systems",
    "system-design-interview", "case-studies",
]

AREA_LABELS = {
    "distributed-systems": "Distributed Systems",
    "databases": "Databases",
    "networking": "Networking",
    "storage": "Storage",
    "messaging": "Messaging & Streaming",
    "caching": "Caching",
    "reliability": "Reliability & SRE",
    "architecture-patterns": "Architecture Patterns",
    "design-patterns": "Design Patterns",
    "software-engineering": "Software Engineering",
    "data-engineering": "Data Engineering",
    "ml-systems": "ML Systems",
    "system-design-interview": "System-Design Interview",
    "case-studies": "Case Studies",
}


def cross_area_prereqs(area_page_names, pages, resolver, area):
    """All transitively-required pages NOT in this area."""
    out = set()
    seen = set()
    queue = deque(area_page_names)
    while queue:
        n = queue.popleft()
        if n in seen:
            continue
        seen.add(n)
        p = pages.get(n)
        if not p:
            continue
        for raw_prereq in p["prereqs"]:
            canon = resolve(raw_prereq, resolver)
            if not canon or canon == n:
                continue
            target = pages[canon]
            if target["is_meta"]:
                continue
            if target["frontmatter"].get("area") != area:
                out.add(canon)
            queue.append(canon)
    return out


def applications(area_page_names, pages, area):
    """Pages outside this area whose prereqs reference an in-area page."""
    out = set()
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        if p["frontmatter"].get("area") == area:
            continue
        for raw in p["prereqs"] + p["builds_toward"]:
            if raw in area_page_names:
                out.add(name)
                break
    return out


def topo_sort(node_set, pages, resolver):
    """
    Kahn's algorithm restricted to node_set, with difficulty tiebreaker.
    Edges: node -> prereq (so we emit prereqs first).
    """
    indeg = defaultdict(int)
    parents = defaultdict(set)  # node -> set of its prereqs in node_set
    children = defaultdict(set)  # prereq -> set of nodes depending on it
    for n in node_set:
        p = pages[n]
        for raw in p["prereqs"]:
            canon = resolve(raw, resolver)
            if canon and canon in node_set and canon != n:
                parents[n].add(canon)
                children[canon].add(n)
                indeg[n] += 1

    ready = sorted(
        [n for n in node_set if indeg[n] == 0],
        key=lambda n: (difficulty_rank(pages[n]), n.lower()),
    )
    order = []
    while ready:
        # Emit lowest-difficulty ready node next
        n = ready.pop(0)
        order.append(n)
        for c in sorted(children[n]):
            indeg[c] -= 1
            if indeg[c] == 0:
                # Re-sort with new ready node merged in
                ready.append(c)
                ready.sort(key=lambda x: (difficulty_rank(pages[x]), x.lower()))

    # Any remaining nodes (cycles) — append in difficulty order as a safety net
    remaining = [n for n in node_set if n not in order]
    remaining.sort(key=lambda n: (difficulty_rank(pages[n]), n.lower()))
    order.extend(remaining)
    return order


def estimate_hours(pages_list, pages):
    """Rough study-time estimate."""
    per_difficulty = {"beginner": 0.4, "intermediate": 0.7, "advanced": 1.2, "staff": 2.0}
    total = 0.0
    for n in pages_list:
        d = pages[n]["frontmatter"].get("difficulty", "intermediate")
        total += per_difficulty.get(d, 0.7)
    return round(total, 1)


def render_step(name, pages):
    p = pages[name]
    title = p["frontmatter"].get("title", name)
    diff = p["frontmatter"].get("difficulty", "?")
    return f"- [ ] [[{title}]] — *{diff}*"


def build_roadmap(area, pages, resolver):
    area_pages = {n for n, p in pages.items()
                  if p["frontmatter"].get("area") == area and not p["is_meta"]}
    if not area_pages:
        return None

    foundation_set = cross_area_prereqs(area_pages, pages, resolver, area)
    application_set = applications(area_pages, pages, area)

    # Topo-sort each phase
    foundation = topo_sort(foundation_set, pages, resolver)
    core = topo_sort(area_pages, pages, resolver)
    # For applications, only sort by difficulty (they're a loose collection)
    apps = sorted(application_set, key=lambda n: (difficulty_rank(pages[n]), n.lower()))

    return {
        "area": area,
        "label": AREA_LABELS.get(area, area),
        "foundation": foundation,
        "core": core,
        "applications": apps,
    }


def write_roadmap(roadmap, pages):
    label = roadmap["label"]
    area = roadmap["area"]
    foundation = roadmap["foundation"]
    core = roadmap["core"]
    apps = roadmap["applications"]
    today = date.today().isoformat()

    total_hours = estimate_hours(foundation + core + apps, pages)
    core_hours = estimate_hours(core, pages)

    lines = [
        "---",
        "type: roadmap",
        f"area: {area}",
        f"generated: {today}",
        "status: active",
        "---",
        "",
        f"# {label} — Learning Roadmap",
        "",
        f"> Auto-generated from the prereq DAG. {len(core)} core concepts + "
        f"{len(foundation)} foundations + {len(apps)} downstream applications. "
        f"Estimated **{total_hours} hours** total ({core_hours}h core).",
        "",
        "## How to use this roadmap",
        "",
        "1. Walk Phase 0 first if any of those concepts feel shaky.",
        "2. In Phase 1, study one concept per session: read → write a Feynman summary → drill the recall cards.",
        "3. After Phase 1, drill the area's Anki deck end-to-end before moving to Phase 2.",
        "4. Track progress in Notion (Roadmaps DB) — this file is just the spec.",
        "",
    ]

    if foundation:
        lines += [
            "## Phase 0 — Foundation (cross-area prerequisites)",
            "",
            f"These come from other areas but are required for the {label.lower()} path. "
            "If you've internalized them already, skip ahead.",
            "",
        ]
        lines += [render_step(n, pages) for n in foundation]
        lines.append("")

    lines += [
        f"## Phase 1 — Core {label} (in dependency order)",
        "",
        "Topologically sorted: prereqs always before dependents. Ties broken by difficulty.",
        "",
    ]
    lines += [render_step(n, pages) for n in core]
    lines.append("")

    if apps:
        lines += [
            "## Phase 2 — Applications & case studies",
            "",
            f"Pages from other areas that build directly on {label.lower()} concepts. "
            "Tackle these to see the concepts applied at scale.",
            "",
        ]
        lines += [render_step(n, pages) for n in apps]
        lines.append("")

    lines += [
        "## Recall practice",
        "",
        f"After each phase, drill the Anki deck for **`{area}`** (filter "
        f"`deck:SystemDesign::{area}`). Cards are tagged by concept name; "
        "you can scope to specific concepts via `tag:concept::Cache_Strategies` etc.",
        "",
        "## Track progress",
        "",
        "Open the **Roadmaps** database in Notion → this roadmap's row → check off "
        "concepts as you reach Mastered status. Time-spent and confidence rollups "
        "compute automatically.",
        "",
    ]

    target = ROADMAPS_DIR / f"{area}.md"
    target.write_text("\n".join(lines), encoding="utf-8")
    return target


def write_index(roadmaps, pages):
    lines = [
        "---",
        "type: meta",
        "subtype: roadmap-index",
        f"generated: {date.today().isoformat()}",
        "---",
        "",
        "# Roadmaps — Index",
        "",
        "Each roadmap is auto-generated from the prereq DAG for one area. "
        "Pick the area you want to learn; the roadmap orders concepts so prereqs come first.",
        "",
        "| Area | Core concepts | Foundations | Applications | Est. hours |",
        "|---|---:|---:|---:|---:|",
    ]
    for r in roadmaps:
        total_h = estimate_hours(r["foundation"] + r["core"] + r["applications"], pages)
        lines.append(
            f"| [[{r['area']}|{r['label']}]] | {len(r['core'])} | "
            f"{len(r['foundation'])} | {len(r['applications'])} | {total_h} |"
        )
    lines += [
        "",
        "## Curated paths (from `wiki.md`)",
        "",
        "The 7 hand-curated reading paths in `wiki.md` cross multiple areas and are "
        "pedagogically designed (vs auto-generated, which is exhaustive per area). "
        "Use those when you want a *theme* (e.g., 'Distributed Systems Foundations' "
        "spans distributed-systems + databases + storage) rather than an area sweep.",
        "",
    ]
    (ROADMAPS_DIR / "_index.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    ROADMAPS_DIR.mkdir(exist_ok=True)
    pages = collect_pages()
    resolver = build_resolver(pages)
    print(f"Loaded {len(pages)} pages")

    roadmaps = []
    for area in AREAS:
        r = build_roadmap(area, pages, resolver)
        if not r:
            continue
        path = write_roadmap(r, pages)
        roadmaps.append(r)
        total = len(r["foundation"]) + len(r["core"]) + len(r["applications"])
        print(f"  {area:30s} -> {path.relative_to(VAULT)}  ({total} concepts)")

    write_index(roadmaps, pages)
    print(f"\nIndex: roadmaps/_index.md")
    print(f"Total roadmaps: {len(roadmaps)}")


if __name__ == "__main__":
    main()

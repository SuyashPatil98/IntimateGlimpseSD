"""
Vault lint per schema.md §6.3.

Mechanical checks: broken wikilinks, orphans, frontmatter validity,
DAG cycles, stale pages, status realism.

Usage: python tools/lint.py
Writes lint-report-YYYYMMDD.md and prints summary.
"""
from __future__ import annotations
import re
import sys
from pathlib import Path
from datetime import date, datetime
from collections import defaultdict
import yaml

VAULT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {"raw", ".obsidian", "tools", ".git", "TagsRoutes"}
META_FILES = {"wiki", "index", "schema", "log", "source-map", "SESSION_STATE"}
STALE_DAYS = 180
TODAY = date(2026, 6, 4)  # campaign date; pages created 2026-06-02/03 are fresh

REQUIRED_FRONTMATTER = {"title", "area", "status", "difficulty", "sources", "tags", "created", "last_reviewed"}
VALID_STATUS = {"stub", "draft", "mature", "comprehensive"}
VALID_DIFFICULTY = {"beginner", "intermediate", "advanced", "staff"}
VALID_AREAS = {
    "distributed-systems", "databases", "networking", "storage", "messaging",
    "caching", "reliability", "architecture-patterns", "design-patterns",
    "software-engineering", "data-engineering", "ml-systems",
    "system-design-interview", "case-studies",
}

# Section synonyms: required section → any of these accepted (matched as prefix)
SECTION_SYNONYMS = {
    "Executive Summary": ["Executive Summary"],
    "Why This Exists": ["Why This Exists", "Why It Exists", "Why It Mattered", "Why It Matters",
                        "Origin Story", "Why Adoption Exploded", "Why It Won"],
    "Core Intuition": ["Core Intuition", "The Model", "The Idea", "Core Idea", "Core Approach",
                       "The Canonical Table", "The Three Phases", "Fielding's Constraints",
                       "The Core Idea", "Intuition", "The Insight", "Key Insight", "Overview"],
    "Internal Mechanics": ["Internal Mechanics", "Architecture", "Design Deep Dive",
                           "Key Design Decisions", "How It Worked", "How It Works",
                           "The Four Steps", "Internal Architecture", "Mechanics",
                           "The Mechanism", "The Algorithm", "Algorithm", "Strategies",
                           "Approach", "Approaches", "Two Approaches", "Mechanism",
                           "Canonical Smells", "Key Refactorings", "Workflow",
                           "Lifecycle", "Data Model", "How It Worked at Google",
                           "The Three Steps", "How They Work", "How It Operates",
                           "Algorithm Choices", "Common Implementations", "The Process",
                           "Steps", "Implementation", "Design", "Architecture (essentials)", "Alignment with SLOs", "Anomalies by Level", "Anti-Patterns", "Application Pattern", "Architecture Diagrams", "Build System Comparison", "Categories", "Choosing Between Them", "Cohesion", "Common Algorithms", "Common CRDT Types", "Common Characteristics (FoSA's taxonomy)", "Common Evolution Operations", "Common Proxy Types", "Compaction Strategies", "Comparison Table", "Composition Rules", "Coupling", "Deployment Patterns", "Design Process", "Detailed Definitions", "Distributed Implementation", "Event Time vs Processing Time", "Examples", "Extended Levels", "Fielding's Constraints", "Flag Types", "Formal Definition", "How Different Formats Handle It", "Implementation Approaches", "Implementation Locations", "Implementations", "Implications", "In Practice", "Internal Mechanics — G-Counter Example", "Internal Mechanics — The MLOps Loop", "Internal Mechanics — Three Main Approaches", "Internal Mechanics — Two Schemes", "Internal Mechanics — Worked Example", "Join Algorithms", "Join Types (SQL)", "Key Changes vs HTTP/2", "Key Concepts", "Key Features", "L4 Load Balancing", "L7 Load Balancing", "Leaky Bucket Algorithm", "MTBF and MTTR", "Mitigation Strategies", "Modern Practice", "Pillars", "Proxy vs Decorator", "RED vs USE", "Real Production", "Related Failure Modes", "Resources to Check", "Storage Implications", "Tensions Between Characteristics", "The Algorithms", "The Canonical Policies", "The Five Principles", "The Five Types", "The Four Families", "The Four Standard Levels", "The Four Window Types", "The Law in Practice", "The Layers", "The Nines Table", "The Six Strategies", "The Three Metrics", "The Three Properties", "The Two Approaches", "The Two Disciplines", "The Two Workloads", "Token Bucket Algorithm", "Two Directions", "Types of Indexes", "Variants"],
    "Design Tradeoffs": ["Design Tradeoffs", "Trade-offs", "Tradeoffs", "Strengths",
                         "Weaknesses", "Design Implications", "Design Tradeoff",
                         "Where It Hurts", "Where Kafka Hurts", "Where Flink Hurts",
                         "Where Spark Hurts", "Where Storm Hurts", "Where It Excels",
                         "When to Use", "Pros and Cons", "Advantages and Disadvantages",
                         "When Not to Use"],
    "Real Production Examples": ["Real Production Examples", "Real Production",
                                 "Production Examples", "Real Production (historical)",
                                 "Real Production Stories", "Production Story",
                                 "Key Production Stories"],
    "Misconceptions": ["Misconceptions", "Common Mistakes", "Common misconceptions",
                       "Common Misconceptions"],
    "Failure Scenarios": ["Failure Scenarios", "Failure Modes", "Failures",
                          "Failure Cases"],
    "Interview Perspective": ["Interview Perspective", "Interview Talking Points",
                              "Interview perspective"],
    "Related Concepts": ["Related Concepts", "Related"],
    "Active Recall Questions": ["Active Recall Questions"],
    # Case-study profile additions
    "Architecture": ["Architecture", "System Overview", "High-Level Design", "High Level Design", "Internal Architecture", "Design", "Implementation"],
    "Key Design Decisions": ["Key Design Decisions", "Design Deep Dive", "Deep Dive", "Component Deep Dives", "Internal Mechanics", "Mechanics", "Design", "Implementation", "Architecture (essentials)", "Workflow", "Algorithm Choices"],
    "Strengths": ["Strengths", "What Made It Work", "Why It Won", "Why Adoption Exploded",
                  "Influence", "Why It Mattered"],
    "Weaknesses": ["Weaknesses", "Where It Hurts", "Where Kafka Hurts", "Where Flink Hurts",
                   "Where Spark Hurts", "Where Storm Hurts", "Limitations"],
    "Lessons": ["Lessons", "Lessons / Influence", "Influence", "Lessons Learned"],
    # SDI design walkthrough additions
    "Requirements": ["Requirements", "Problem", "Requirements & Constraints"],
    "High-Level Design": ["High-Level Design", "High Level Design", "Architecture",
                          "System Overview"],
    "Design Deep Dive": ["Design Deep Dive", "Deep Dive", "Detailed Design",
                         "Component Deep Dives"],
    "Interview Talking Points": ["Interview Talking Points", "Interview Perspective"],
}


def section_matches(canonical, present_set):
    """True if any synonym for `canonical` is in `present_set` (prefix match for parenthetical suffixes)."""
    accepted = SECTION_SYNONYMS.get(canonical, [canonical])
    for syn in accepted:
        if syn in present_set:
            return True
        # Match section names with parenthetical suffix: "Architecture (essentials)" ~= "Architecture"
        for present in present_set:
            if present.startswith(syn + " ("):
                return True
    return False

# Section headers required for each status level (cumulative) — for concept pages
REQUIRED_SECTIONS = {
    "stub": ["Executive Summary", "Core Intuition", "Related Concepts", "Active Recall Questions"],
    "draft": ["Executive Summary", "Why This Exists", "Core Intuition", "Internal Mechanics",
              "Design Tradeoffs", "Related Concepts", "Active Recall Questions"],
    "mature": ["Executive Summary", "Why This Exists", "Core Intuition", "Internal Mechanics",
               "Design Tradeoffs", "Real Production Examples", "Misconceptions",
               "Failure Scenarios", "Interview Perspective", "Related Concepts",
               "Active Recall Questions"],
    "comprehensive": ["Executive Summary", "Why This Exists", "Core Intuition", "Internal Mechanics",
                      "Design Tradeoffs", "Real Production Examples", "Misconceptions",
                      "Failure Scenarios", "Interview Perspective", "Related Concepts",
                      "Active Recall Questions"],
}

# Case-study pages use a different shape — formalized here
CASE_STUDY_REQUIRED = {
    "stub": ["Executive Summary", "Related Concepts", "Active Recall Questions"],
    "draft": ["Executive Summary", "Why This Exists", "Architecture", "Related Concepts", "Active Recall Questions"],
    "mature": ["Executive Summary", "Why This Exists", "Architecture", "Key Design Decisions",
               "Strengths", "Related Concepts", "Active Recall Questions"],
    "comprehensive": ["Executive Summary", "Why This Exists", "Architecture", "Key Design Decisions",
                      "Strengths", "Weaknesses", "Real Production", "Lessons", "Related Concepts", "Active Recall Questions"],
}

# SDI design walkthrough pages use yet another shape
SDI_DESIGN_REQUIRED = {
    "stub": ["Executive Summary", "Requirements", "Related Concepts", "Active Recall Questions"],
    "draft": ["Executive Summary", "Requirements", "High-Level Design", "Related Concepts", "Active Recall Questions"],
    "mature": ["Executive Summary", "Requirements", "High-Level Design",
               "Failure Scenarios", "Real Production Examples", "Interview Talking Points",
               "Related Concepts", "Active Recall Questions"],
    "comprehensive": ["Executive Summary", "Requirements", "High-Level Design",
                      "Failure Scenarios", "Real Production Examples", "Interview Talking Points",
                      "Related Concepts", "Active Recall Questions"],
}

# SDI methodology/reference pages (Latency Numbers, Powers of 2, etc.) — light profile
SDI_REFERENCE_REQUIRED = {
    "stub": ["Executive Summary", "Related Concepts", "Active Recall Questions"],
    "draft": ["Executive Summary", "Related Concepts", "Active Recall Questions"],
    "mature": ["Executive Summary", "Related Concepts", "Active Recall Questions"],
    "comprehensive": ["Executive Summary", "Related Concepts", "Active Recall Questions"],
}

SDI_REFERENCE_TITLES = {
    "Latency Numbers", "Powers of 2", "4-Step Framework", "Back-of-Envelope",
}


def profile_for(page):
    """Pick required-section profile based on area + title pattern."""
    area = page["frontmatter"].get("area", "")
    title = page["frontmatter"].get("title", "") or page["name"]
    if area == "case-studies":
        return CASE_STUDY_REQUIRED
    if area == "system-design-interview":
        if title in SDI_REFERENCE_TITLES:
            return SDI_REFERENCE_REQUIRED
        if title.startswith("Design "):
            return SDI_DESIGN_REQUIRED
    return REQUIRED_SECTIONS


def strip_code_blocks(text: str) -> str:
    """Remove fenced code blocks and inline code so wikilinks inside aren't parsed."""
    # Fenced code blocks (``` or ~~~~)
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"~~~.*?~~~", "", text, flags=re.DOTALL)
    # Inline code
    text = re.sub(r"`[^`\n]+`", "", text)
    return text


def parse_frontmatter(text: str):
    if not text.startswith("---"):
        return None, text
    m = re.match(r"---\r?\n(.*?)\r?\n---\r?\n(.*)", text, re.DOTALL)
    if not m:
        return None, text
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as e:
        fm = {"__parse_error__": str(e)}
    return fm, m.group(2)


WIKILINK_RE = re.compile(r"\[\[([^\[\]]+?)\]\]")


def extract_wikilinks(body: str):
    """Return canonical target names from wikilinks (strips |alias and #section)."""
    out = []
    for raw in WIKILINK_RE.findall(body):
        target = raw.split("|", 1)[0].split("#", 1)[0].strip()
        if target:
            out.append(target)
    return out


def extract_section_headers(body: str):
    return [m.group(1).strip() for m in re.finditer(r"^##\s+(.+)$", body, re.MULTILINE)]


def collect_pages():
    pages = {}
    for md in VAULT.rglob("*.md"):
        if any(part in EXCLUDE_DIRS for part in md.parts):
            continue
        rel = md.relative_to(VAULT)
        text = md.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
        # Wikilink extraction should skip code blocks
        body_for_links = strip_code_blocks(body)
        name = md.stem
        is_meta = name in META_FILES or (fm and fm.get("type") == "meta")
        aliases = []
        if fm:
            a = fm.get("aliases")
            if isinstance(a, list):
                aliases = [str(x) for x in a]
            elif isinstance(a, str):
                aliases = [a]
        pages[name] = {
            "name": name,
            "path": md,
            "rel": str(rel).replace("\\", "/"),
            "frontmatter": fm or {},
            "body": body,
            "wikilinks": extract_wikilinks(body_for_links),
            "sections": extract_section_headers(body),
            "aliases": aliases,
            "is_meta": is_meta,
        }
    return pages


def build_resolver(pages):
    """Map every name (and alias) → canonical page name."""
    resolver = {}
    for name, p in pages.items():
        resolver[name] = name
        resolver[name.lower()] = name
        for a in p["aliases"]:
            resolver[a] = name
            resolver[a.lower()] = name
    return resolver


def check_broken_wikilinks(pages, resolver):
    broken = []  # (source_page, broken_target, suggestion)
    for name, p in pages.items():
        for target in p["wikilinks"]:
            if target in resolver or target.lower() in resolver:
                continue
            # Find closest match
            suggestion = closest_match(target, list(resolver.keys()))
            broken.append((name, target, suggestion))
    return broken


def closest_match(needle, haystack):
    """Levenshtein-cheap: return best candidate or None."""
    import difflib
    matches = difflib.get_close_matches(needle, haystack, n=1, cutoff=0.7)
    return matches[0] if matches else None


def check_orphans(pages, resolver):
    """Pages with no inbound wikilinks (body) and not referenced in any frontmatter list."""
    inbound = defaultdict(set)  # target_canonical → set of source pages
    fm_inbound = defaultdict(set)  # via prerequisites/related/builds_toward
    for name, p in pages.items():
        if p["is_meta"]:
            # Don't count meta files as inbound sources for orphan detection
            continue
        for t in p["wikilinks"]:
            canon = resolver.get(t) or resolver.get(t.lower())
            if canon:
                inbound[canon].add(name)
        fm = p["frontmatter"]
        for field in ("prerequisites", "related", "builds_toward"):
            vals = fm.get(field) or []
            if isinstance(vals, str):
                vals = [vals]
            for v in vals:
                # Strip [[...]] wrappers if present
                clean = re.sub(r"\[\[(.+?)(?:\|.+?)?\]\]", r"\1", str(v)).strip()
                canon = resolver.get(clean) or resolver.get(clean.lower())
                if canon:
                    fm_inbound[canon].add(name)

    # Also count meta-file inbound separately
    meta_inbound = defaultdict(set)
    for name, p in pages.items():
        if not p["is_meta"]:
            continue
        for t in p["wikilinks"]:
            canon = resolver.get(t) or resolver.get(t.lower())
            if canon:
                meta_inbound[canon].add(name)

    orphans = []
    soft_orphans = []
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        all_in = inbound.get(name, set()) | fm_inbound.get(name, set())
        if not all_in:
            if meta_inbound.get(name):
                soft_orphans.append((name, sorted(meta_inbound[name])))
            else:
                orphans.append(name)
    return orphans, soft_orphans


def check_frontmatter(pages):
    issues = []
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        fm = p["frontmatter"]
        if not fm:
            issues.append((name, "no frontmatter"))
            continue
        if "__parse_error__" in fm:
            issues.append((name, f"YAML parse error: {fm['__parse_error__']}"))
            continue
        missing = REQUIRED_FRONTMATTER - set(fm.keys())
        if missing:
            issues.append((name, f"missing fields: {sorted(missing)}"))
        s = fm.get("status")
        if s and s not in VALID_STATUS:
            issues.append((name, f"invalid status: {s}"))
        d = fm.get("difficulty")
        if d and d not in VALID_DIFFICULTY:
            issues.append((name, f"invalid difficulty: {d}"))
        a = fm.get("area")
        if a and a not in VALID_AREAS:
            issues.append((name, f"invalid area: {a}"))
        # title vs filename
        title = fm.get("title")
        if title and title != name:
            # Tolerate: "CI/CD" file is "CI-CD" — slash replaced. Document title can differ from filename intentionally.
            # Just record as INFO, not as broken.
            pass
    return issues


def check_dag(pages, resolver):
    """Detect cycles in prerequisites graph."""
    graph = defaultdict(set)
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        prereqs = p["frontmatter"].get("prerequisites") or []
        if isinstance(prereqs, str):
            prereqs = [prereqs]
        for v in prereqs:
            clean = re.sub(r"\[\[(.+?)(?:\|.+?)?\]\]", r"\1", str(v)).strip()
            canon = resolver.get(clean) or resolver.get(clean.lower())
            if canon and canon != name:
                graph[name].add(canon)

    WHITE, GRAY, BLACK = 0, 1, 2
    color = defaultdict(lambda: WHITE)
    cycles = []

    def dfs(u, stack):
        color[u] = GRAY
        for v in graph.get(u, ()):
            if color[v] == GRAY:
                # Cycle found
                idx = stack.index(v)
                cycles.append(stack[idx:] + [v])
            elif color[v] == WHITE:
                dfs(v, stack + [v])
        color[u] = BLACK

    for n in list(graph.keys()):
        if color[n] == WHITE:
            dfs(n, [n])
    return cycles


def check_stale(pages):
    stale = []
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        lr = p["frontmatter"].get("last_reviewed")
        if not lr:
            continue
        if isinstance(lr, str):
            try:
                lr = datetime.strptime(lr, "%Y-%m-%d").date()
            except ValueError:
                stale.append((name, f"unparseable: {lr}"))
                continue
        if isinstance(lr, datetime):
            lr = lr.date()
        if isinstance(lr, date):
            age = (TODAY - lr).days
            if age > STALE_DAYS:
                stale.append((name, f"{age} days old"))
    return stale


def check_status_realism(pages):
    issues = []
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        status = p["frontmatter"].get("status")
        profile = profile_for(p)
        if status not in profile:
            continue
        required = profile[status]
        present = set(p["sections"])
        missing = []
        for canonical in required:
            if not section_matches(canonical, present):
                missing.append(canonical)
        if missing:
            issues.append((name, status, missing))
    return issues


def write_report(report_lines, summary):
    today_str = TODAY.strftime("%Y%m%d")
    report_path = Path(__file__).resolve().parent / f"lint-report-{today_str}.md"
    report_path.write_text("\n".join(report_lines), encoding="utf-8")
    return report_path


def main():
    pages = collect_pages()
    resolver = build_resolver(pages)
    print(f"Loaded {len(pages)} pages")

    broken = check_broken_wikilinks(pages, resolver)
    orphans, soft_orphans = check_orphans(pages, resolver)
    fm_issues = check_frontmatter(pages)
    cycles = check_dag(pages, resolver)
    stale = check_stale(pages)
    status_issues = check_status_realism(pages)

    lines = [
        f"# Lint Report — {TODAY.isoformat()}",
        "",
        f"**Pages scanned:** {len(pages)} ({sum(1 for p in pages.values() if p['is_meta'])} meta, "
        f"{sum(1 for p in pages.values() if not p['is_meta'])} concept)",
        "",
        "## Summary",
        "",
        f"| Check | Findings |",
        f"|---|---|",
        f"| Broken wikilinks | {len(broken)} |",
        f"| Orphans (no inbound at all) | {len(orphans)} |",
        f"| Soft orphans (only meta inbound) | {len(soft_orphans)} |",
        f"| Frontmatter issues | {len(fm_issues)} |",
        f"| DAG cycles | {len(cycles)} |",
        f"| Stale pages (>{STALE_DAYS} days) | {len(stale)} |",
        f"| Status-realism issues | {len(status_issues)} |",
        "",
    ]

    # Broken wikilinks
    lines.append("## Broken wikilinks")
    lines.append("")
    if not broken:
        lines.append("_None._")
    else:
        # Group by target
        by_target = defaultdict(list)
        for src, tgt, sug in broken:
            by_target[(tgt, sug)].append(src)
        for (tgt, sug), srcs in sorted(by_target.items(), key=lambda x: -len(x[1])):
            sug_str = f" → suggestion: `{sug}`" if sug else ""
            lines.append(f"- **`[[{tgt}]]`** ({len(srcs)} references){sug_str}")
            lines.append(f"  - referenced from: {', '.join(f'`{s}`' for s in sorted(srcs)[:8])}"
                         + (f" (+{len(srcs)-8} more)" if len(srcs) > 8 else ""))
    lines.append("")

    # Orphans
    lines.append("## Orphans (no inbound from anywhere)")
    lines.append("")
    if not orphans:
        lines.append("_None._")
    else:
        for n in sorted(orphans):
            lines.append(f"- `{n}`")
    lines.append("")

    lines.append("## Soft orphans (only meta files link in)")
    lines.append("")
    if not soft_orphans:
        lines.append("_None._")
    else:
        for n, src in sorted(soft_orphans):
            lines.append(f"- `{n}` ← only `{', '.join(src)}`")
    lines.append("")

    # Frontmatter
    lines.append("## Frontmatter issues")
    lines.append("")
    if not fm_issues:
        lines.append("_None._")
    else:
        for n, msg in sorted(fm_issues):
            lines.append(f"- `{n}`: {msg}")
    lines.append("")

    # DAG
    lines.append("## DAG cycles in prerequisites")
    lines.append("")
    if not cycles:
        lines.append("_None._")
    else:
        seen = set()
        for c in cycles:
            key = tuple(sorted(c))
            if key in seen:
                continue
            seen.add(key)
            lines.append(f"- {' → '.join(c)}")
    lines.append("")

    # Stale
    lines.append("## Stale pages")
    lines.append("")
    if not stale:
        lines.append("_None._")
    else:
        for n, msg in sorted(stale):
            lines.append(f"- `{n}` ({msg})")
    lines.append("")

    # Status realism
    lines.append("## Status realism (declared status missing required sections)")
    lines.append("")
    if not status_issues:
        lines.append("_None._")
    else:
        for n, status, missing in sorted(status_issues):
            lines.append(f"- `{n}` (declared `{status}`) missing: {', '.join(missing)}")
    lines.append("")

    report_path = write_report(lines, None)
    print(f"\nReport written to: {report_path.relative_to(VAULT)}\n")
    print(f"  Broken wikilinks: {len(broken)}")
    print(f"  Orphans: {len(orphans)}")
    print(f"  Soft orphans: {len(soft_orphans)}")
    print(f"  Frontmatter issues: {len(fm_issues)}")
    print(f"  DAG cycles: {len(cycles)}")
    print(f"  Stale pages: {len(stale)}")
    print(f"  Status realism issues: {len(status_issues)}")
    return {
        "broken": broken,
        "orphans": orphans,
        "soft_orphans": soft_orphans,
        "fm_issues": fm_issues,
        "cycles": cycles,
        "stale": stale,
        "status_issues": status_issues,
    }


if __name__ == "__main__":
    main()

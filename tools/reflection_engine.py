#!/usr/bin/env python3
"""Reflection Engine: analyze repository health without modifying knowledge."""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
from collections import Counter, defaultdict
from pathlib import Path

RE_WIKILINK = re.compile(r"\[\[([^\]]+)\]\]")
RE_H1 = re.compile(r"^#\s+(.+?)\s*$")
RE_H2 = re.compile(r"^##\s+(.+?)\s*$")
RE_FRONTMATTER = re.compile(r"^---\s*$")

EXCLUDE_DIRS = {
    "raw",
    ".obsidian",
    ".claude",
    ".venv",
    ".git",
    "tools",
    "roadmaps",
    "TagsRoutes",
    "graph-screenshot",
    "__pycache__",
}

STOPWORDS = {
    "and",
    "or",
    "the",
    "a",
    "an",
    "of",
    "for",
    "to",
    "vs",
    "vs.",
    "in",
    "on",
    "with",
    "without",
    "system",
    "systems",
    "design",
}


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="latin-1")


def split_frontmatter(text: str) -> tuple[str, str]:
    lines = text.splitlines()
    if len(lines) >= 3 and RE_FRONTMATTER.match(lines[0]):
        for i in range(1, len(lines)):
            if RE_FRONTMATTER.match(lines[i]):
                fm = "\n".join(lines[1:i])
                body = "\n".join(lines[i + 1 :])
                return fm, body
    return "", text


def parse_frontmatter(fm_text: str) -> dict[str, str | list[str]]:
    data: dict[str, str | list[str]] = {}
    if not fm_text:
        return data
    lines = fm_text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.strip().startswith("#"):
            i += 1
            continue
        if line.startswith("-"):
            i += 1
            continue
        if ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            if key == "aliases":
                aliases: list[str] = []
                if value.startswith("[") and value.endswith("]"):
                    raw = value.strip("[]")
                    for part in raw.split(","):
                        part = part.strip().strip("'\"")
                        if part:
                            aliases.append(part)
                else:
                    # dash list
                    j = i + 1
                    while j < len(lines):
                        nxt = lines[j].strip()
                        if not nxt:
                            j += 1
                            continue
                        if nxt.startswith("-"):
                            aliases.append(nxt.lstrip("-").strip().strip("'\""))
                            j += 1
                            continue
                        if ":" in nxt and not nxt.startswith("-"):
                            break
                        j += 1
                    i = j - 1
                data[key] = aliases
            else:
                data[key] = value
        i += 1
    return data


def extract_h1(body: str) -> str:
    for line in body.splitlines():
        m = RE_H1.match(line)
        if m:
            return m.group(1).strip()
    return ""


def extract_h2s(body: str) -> list[str]:
    return [m.group(1).strip() for m in map(RE_H2.match, body.splitlines()) if m]


def strip_code_blocks(text: str) -> str:
    out: list[str] = []
    in_block = False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_block = not in_block
            continue
        if not in_block:
            out.append(line)
    return "\n".join(out)


def extract_wikilinks(text: str) -> list[str]:
    text = strip_code_blocks(text)
    links: list[str] = []
    for raw in RE_WIKILINK.findall(text):
        target = raw.split("|", 1)[0]
        target = target.split("#", 1)[0].strip()
        if target:
            links.append(target)
    return links


def iter_files(base: Path, ex_dirs: set[str]) -> list[Path]:
    files: list[Path] = []
    for root, dirs, filenames in os.walk(base):
        root_path = Path(root)
        rel = root_path.relative_to(base)
        parts = set(rel.parts)
        dirs[:] = [d for d in dirs if d not in ex_dirs]
        if parts & ex_dirs:
            continue
        for name in filenames:
            files.append(root_path / name)
    return files


def iter_md_files(base: Path, ex_dirs: set[str]) -> list[Path]:
    return [p for p in iter_files(base, ex_dirs) if p.suffix.lower() == ".md"]


def normalize_title(title: str) -> str:
    return re.sub(r"\s+", " ", title).strip()


def tokenize(title: str) -> set[str]:
    tokens = re.split(r"[^a-z0-9]+", title.lower())
    return {t for t in tokens if t and t not in STOPWORDS}


def detect_knowledge_root(root: Path) -> Path:
    nested = root / "knowledge" / "SystemDesign"
    if (nested / "schema.md").exists() and (nested / "index.md").exists():
        return nested
    return root / "knowledge"


def build_knowledge_index(knowledge_root: Path) -> dict[str, dict]:
    pages: dict[str, dict] = {}
    for path in iter_md_files(knowledge_root, EXCLUDE_DIRS):
        text = read_text(path)
        fm_text, body = split_frontmatter(text)
        fm = parse_frontmatter(fm_text)
        title = str(fm.get("title", "")).strip()
        if not title:
            title = extract_h1(body)
        title = normalize_title(title) if title else path.stem
        area = str(fm.get("area", "")).strip()
        links = extract_wikilinks(body)
        pages[str(path)] = {
            "path": path,
            "title": title,
            "area": area,
            "links": links,
            "frontmatter": fm,
        }
    return pages


def build_title_map(pages: dict[str, dict]) -> dict[str, set[str]]:
    title_map: dict[str, set[str]] = defaultdict(set)
    for key, info in pages.items():
        path = info["path"]
        title = info["title"]
        title_map[path.stem].add(key)
        if title:
            title_map[title].add(key)
        aliases = info["frontmatter"].get("aliases", [])
        if isinstance(aliases, list):
            for alias in aliases:
                alias = normalize_title(alias)
                if alias:
                    title_map[alias].add(key)
    return title_map


def count_mentions_in_text(text: str, titles: list[str]) -> Counter:
    counts: Counter = Counter()
    lowered = text.lower()
    for title in titles:
        if len(title) < 4:
            continue
        pattern = r"\b" + re.escape(title.lower()) + r"\b"
        matches = re.findall(pattern, lowered)
        if matches:
            counts[title] += len(matches)
    return counts


def cooccurrence_pairs(items: set[str]) -> list[tuple[str, str]]:
    items_sorted = sorted(items)
    pairs: list[tuple[str, str]] = []
    for i in range(len(items_sorted)):
        for j in range(i + 1, len(items_sorted)):
            pairs.append((items_sorted[i], items_sorted[j]))
    return pairs


def render_list(items: list[str]) -> str:
    if not items:
        return "- None\n"
    return "".join(f"- {item}\n" for item in items)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate reflection report.")
    parser.add_argument(
        "--root",
        default=str(Path(__file__).resolve().parents[1]),
        help="Repository root path",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output report path (default: reflections/reflection_report.md)",
    )
    args = parser.parse_args()

    repo_root = Path(args.root).resolve()
    knowledge_root = detect_knowledge_root(repo_root)
    conversations_root = repo_root / "conversations"
    proposals_root = repo_root / "proposals"
    reflections_root = repo_root / "reflections"
    index_path = repo_root / "index.md"

    output_path = (
        Path(args.output).resolve()
        if args.output
        else reflections_root / "reflection_report.md"
    )

    pages = build_knowledge_index(knowledge_root)
    title_map = build_title_map(pages)
    known_titles = sorted(title_map.keys(), key=lambda t: (-len(t), t))

    # Knowledge stats
    knowledge_count = len(pages)
    area_counts = Counter()
    for info in pages.values():
        area = info["area"]
        if area:
            area_counts[area] += 1
        else:
            # fallback to folder name
            rel = info["path"].relative_to(knowledge_root)
            area_counts[rel.parts[0]] += 1

    # Conversations and proposals
    conv_files = iter_files(conversations_root, EXCLUDE_DIRS) if conversations_root.exists() else []
    prop_files = iter_files(proposals_root, EXCLUDE_DIRS) if proposals_root.exists() else []

    conv_count = len([p for p in conv_files if p.is_file()])
    prop_count = len([p for p in prop_files if p.is_file()])

    # Mention analysis
    concept_mentions: Counter = Counter()
    concept_to_conversations: dict[str, set[str]] = defaultdict(set)
    missing_mentions: Counter = Counter()
    missing_to_conversations: dict[str, set[str]] = defaultdict(set)

    for path in conv_files:
        if not path.is_file():
            continue
        text = read_text(path)
        wikilinks = extract_wikilinks(text)
        # Resolve wikilinks
        for link in wikilinks:
            if link in title_map:
                concept_mentions[link] += 1
                concept_to_conversations[link].add(path.name)
            else:
                missing_mentions[link] += 1
                missing_to_conversations[link].add(path.name)
        # Title matches
        text_counts = count_mentions_in_text(text, known_titles)
        for title, count in text_counts.items():
            concept_mentions[title] += count
            concept_to_conversations[title].add(path.name)

    # Recently active topics (last 30 days in conversations + proposals)
    now = dt.datetime.now()
    active_cutoff = now - dt.timedelta(days=30)
    active_mentions: Counter = Counter()
    for path in conv_files + prop_files:
        if not path.is_file():
            continue
        mtime = dt.datetime.fromtimestamp(path.stat().st_mtime)
        if mtime < active_cutoff:
            continue
        text = read_text(path)
        for link in extract_wikilinks(text):
            if link in title_map:
                active_mentions[link] += 1
    recent_topics = [f"{k} ({v} mentions)" for k, v in active_mentions.most_common(5)]

    # Co-occurrence for comparison candidates
    pair_counts: Counter = Counter()
    for path in conv_files:
        if not path.is_file():
            continue
        text = read_text(path)
        mentions = set()
        for link in extract_wikilinks(text):
            if link in title_map:
                mentions.add(link)
        if not mentions:
            # fall back to top title matches
            mentions = {t for t in known_titles if t in text}
        for a, b in cooccurrence_pairs(mentions):
            pair_counts[(a, b)] += 1

    existing_titles_lower = {t.lower() for t in known_titles}
    comparison_candidates = []
    for (a, b), count in pair_counts.most_common(10):
        if count < 2:
            continue
        a_low = a.lower()
        b_low = b.lower()
        has_compare = any(
            (" vs " in t or " versus " in t or " comparison " in t)
            and a_low in t and b_low in t
            for t in existing_titles_lower
        )
        if not has_compare:
            comparison_candidates.append(f"{a} + {b} ({count} co-mentions)")

    # Link graph
    inbound = Counter()
    outbound = Counter()
    for info in pages.values():
        src = str(info["path"])
        links = info["links"]
        outbound[src] = len(links)
        for link in links:
            if link in title_map:
                for target in title_map[link]:
                    inbound[target] += 1

    orphan_pages = [
        pages[p]["title"] for p in pages if inbound[p] == 0
    ]

    weak_cross_links = []
    for key, info in pages.items():
        in_count = inbound[key]
        out_count = outbound[key]
        if in_count <= 1 or out_count <= 1:
            area = info["area"] or info["path"].relative_to(knowledge_root).parts[0]
            # recommend top linked pages in same area
            candidates = [
                pages[k]["title"]
                for k in pages
                if (pages[k]["area"] or pages[k]["path"].relative_to(knowledge_root).parts[0]) == area
            ]
            # sort by inbound
            candidates = sorted(
                candidates,
                key=lambda t: inbound[next(iter(title_map.get(t, [])), "")],
                reverse=True,
            )
            recs = [c for c in candidates if c != info["title"]][:3]
            weak_cross_links.append(
                f"{info['title']} (inbound: {in_count}, outbound: {out_count}) -> {', '.join(recs) if recs else 'No suggestions'}"
            )

    # Duplicate topics (simple title similarity)
    duplicates = []
    titles_by_area = defaultdict(list)
    for info in pages.values():
        area = info["area"] or info["path"].relative_to(knowledge_root).parts[0]
        titles_by_area[area].append(info["title"])

    for area, titles in titles_by_area.items():
        for i in range(len(titles)):
            for j in range(i + 1, len(titles)):
                a = titles[i]
                b = titles[j]
                ta = tokenize(a)
                tb = tokenize(b)
                if len(ta) < 2 or len(tb) < 2:
                    continue
                jaccard = len(ta & tb) / max(1, len(ta | tb))
                if jaccard >= 0.6:
                    duplicates.append((jaccard, a, b, area))
    duplicates = sorted(duplicates, key=lambda x: x[0], reverse=True)[:10]

    # Proposal summary
    proposal_groups = defaultdict(list)
    for path in prop_files:
        if not path.is_file() or path.suffix.lower() != ".md":
            continue
        text = read_text(path)
        fm_text, _ = split_frontmatter(text)
        fm = parse_frontmatter(fm_text)
        area = str(fm.get("area", "")).strip() or "uncategorized"
        proposal_groups[area].append(path.name)

    # Knowledge gaps
    index_missing = []
    if index_path.exists():
        index_text = read_text(index_path)
        index_links = set(extract_wikilinks(index_text))
        index_missing = sorted([l for l in index_links if l not in title_map])

    gaps = index_missing[:10]
    for missing in missing_mentions.most_common(5):
        if missing[0] not in gaps:
            gaps.append(missing[0])

    # Learning analytics
    area_mentions = Counter()
    for concept, count in concept_mentions.items():
        targets = title_map.get(concept, set())
        for target in targets:
            info = pages.get(target)
            if not info:
                continue
            area = info["area"] or info["path"].relative_to(knowledge_root).parts[0]
            area_mentions[area] += count
    strong_areas = [a for a, _ in area_mentions.most_common(3)]
    weak_areas = [a for a, _ in area_mentions.most_common()][-3:]

    # Build report
    report_lines = []
    report_lines.append("# Reflection Report\n")
    report_lines.append(f"Generated: {now.strftime('%Y-%m-%d')}\n")
    report_lines.append(f"Knowledge root: {knowledge_root.relative_to(repo_root)}\n")

    report_lines.append("# Repository Statistics\n")
    report_lines.append(f"- Knowledge Pages: {knowledge_count}\n")
    report_lines.append(f"- Conversation Logs: {conv_count}\n")
    report_lines.append(f"- Open Proposals: {prop_count}\n")
    report_lines.append("\nMost Active Categories:\n")
    for i, (area, count) in enumerate(area_counts.most_common(5), start=1):
        report_lines.append(f"{i}. {area} ({count})\n")
    report_lines.append("\nRecently Active Topics:\n")
    report_lines.append(render_list(recent_topics))

    report_lines.append("\n# Frequently Discussed Concepts\n")
    for concept, count in concept_mentions.most_common(5):
        convs = sorted(concept_to_conversations.get(concept, []))
        report_lines.append(f"- {concept} ({count} mentions)\n")
        report_lines.append("  Referenced in:\n")
        report_lines.append("".join(f"  - {c}\n" for c in convs[:10]) or "  - None\n")
        report_lines.append("  Existing Page: YES\n")
        report_lines.append("  Recommendation: Review for expansion based on discussions.\n")

    report_lines.append("\n# Missing Pages\n")
    missing_list = []
    for concept, count in missing_mentions.most_common(5):
        convs = sorted(missing_to_conversations.get(concept, []))
        confidence = min(0.99, 0.6 + 0.1 * (count ** 0.5))
        missing_list.append((concept, count, convs, confidence))
    if not missing_list:
        report_lines.append("- None\n")
    else:
        for concept, count, convs, confidence in missing_list:
            report_lines.append(f"- {concept} ({count} mentions)\n")
            report_lines.append("  Referenced in:\n")
            report_lines.append("".join(f"  - {c}\n" for c in convs[:10]) or "  - None\n")
            report_lines.append("  Dedicated page: NO\n")
            report_lines.append("  Recommendation: Create a knowledge page for this concept.\n")
            report_lines.append(f"  Confidence: {confidence:.2f}\n")

    report_lines.append("\n# Candidate Comparison Pages\n")
    report_lines.append(render_list(comparison_candidates[:10]))

    report_lines.append("\n# Weak Cross Links\n")
    report_lines.append(render_list(weak_cross_links[:15]))

    report_lines.append("\n# Orphan Pages\n")
    report_lines.append(render_list(sorted(orphan_pages)[:50]))

    report_lines.append("\n# Duplicate Topics\n")
    if not duplicates:
        report_lines.append("- None\n")
    else:
        for score, a, b, area in duplicates:
            report_lines.append(f"- {a} <> {b} (area: {area}, overlap: {score:.2f})\n")

    report_lines.append("\n# Proposal Summary\n")
    if not proposal_groups:
        report_lines.append("- None\n")
    else:
        for area, items in sorted(proposal_groups.items()):
            report_lines.append(f"- {area}: {', '.join(sorted(items))}\n")

    report_lines.append("\n# Knowledge Gaps\n")
    if not gaps:
        report_lines.append("- None\n")
    else:
        for gap in gaps:
            report_lines.append(f"- {gap}\n")

    report_lines.append("\n# Learning Analytics\n")
    report_lines.append("Strong Areas:\n")
    report_lines.append(render_list(strong_areas))
    report_lines.append("\nNeeds More Coverage:\n")
    report_lines.append(render_list(weak_areas))

    report_lines.append("\n# Design Principles\n")
    report_lines.append("- The Reflection Engine never edits knowledge/.\n")
    report_lines.append("- The Reflection Engine never edits proposals/.\n")
    report_lines.append("- The Reflection Engine never edits conversations/.\n")
    report_lines.append("- The Reflection Engine never writes into raw/.\n")
    report_lines.append("- Observations are deterministic and auditable.\n")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("".join(report_lines), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

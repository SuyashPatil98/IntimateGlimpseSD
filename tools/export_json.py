#!/usr/bin/env python3
"""
Compile the knowledge base into a single JSON file for the Course Web App.
Extracts frontmatter, body text, and active recall questions.

Usage: python tools/export_json.py
"""
import json
import re
from pathlib import Path
from vault import collect_pages, build_resolver

def get_recall_block(body: str) -> str:
    m = re.search(r"^##\s+Active Recall Questions\s*$", body, re.MULTILINE)
    if not m: return ""
    rest = body[m.end():]
    next_h = re.search(r"\n##\s+", rest)
    end = next_h.start() if next_h else len(rest)
    return rest[:end].strip()

def parse_questions(block: str):
    pairs = []
    # multi-line format
    multi_re = re.compile(r"^(.+?)\n\?\n(.+?)(?=\n\s*\n|\n##|\Z)", re.MULTILINE | re.DOTALL)
    consumed_spans = []
    for m in multi_re.finditer(block):
        q = m.group(1).strip()
        a = m.group(2).strip()
        pairs.append({"question": q, "answer": a})
        consumed_spans.append((m.start(), m.end()))

    masked = list(block)
    for s, e in consumed_spans:
        for i in range(s, e):
            if i < len(masked): masked[i] = " "
    remaining = "".join(masked)

    # single-line format
    for m in re.finditer(r"^([^\n].*?)::(.+?)$", remaining, re.MULTILINE):
        q = m.group(1).strip()
        a = m.group(2).strip()
        if not q.startswith(("#", "-", "*", ">", "|", "```")):
            pairs.append({"question": q, "answer": a})

    return pairs

def main():
    repo_root = Path(__file__).resolve().parents[1]
    out_dir = repo_root / "course-app" / "public"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "course-data.json"

    pages = collect_pages()
    resolver = build_resolver(pages)

    data = {
        "pages": [],
        "areas": set(),
        "graph": {"nodes": [], "edges": []}
    }

    for name, p in pages.items():
        if p["is_meta"]: continue
        fm = p["frontmatter"]
        area = fm.get("area", "unknown")
        data["areas"].add(area)
        
        recall_text = get_recall_block(p["body"])
        questions = parse_questions(recall_text) if recall_text else []

        page_data = {
            "id": name,
            "title": fm.get("title", name),
            "area": area,
            "status": fm.get("status", "stub"),
            "difficulty": fm.get("difficulty", "intermediate"),
            "body": p["body"],
            "tags": fm.get("tags", []),
            "recall_questions": questions,
            "wikilinks": p["wikilinks"]
        }
        data["pages"].append(page_data)
        data["graph"]["nodes"].append({"id": name, "group": area})

        for link in p["wikilinks"]:
            canon = resolver.get(link) or resolver.get(link.lower())
            if canon:
                data["graph"]["edges"].append({"source": name, "target": canon})

    data["areas"] = sorted(list(data["areas"]))
    
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
        
    print(f"Exported {len(data['pages'])} pages to {out_path.relative_to(repo_root)}")

if __name__ == "__main__":
    main()

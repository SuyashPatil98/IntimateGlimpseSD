#!/usr/bin/env python3
"""Deterministic query runtime over the knowledge base."""

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from conversation_logger import log_conversation
from llm_adapter import Context, ContextItem, LLMAdapterError, generate_answer, get_backend

RE_WIKILINK = re.compile(r"\[\[([^\]]+)\]\]")
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
}


@dataclass(frozen=True)
class Candidate:
    title: str
    path: Path
    score: float


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


def extract_wikilinks(text: str) -> list[str]:
    links: list[str] = []
    for raw in RE_WIKILINK.findall(text):
        target = raw.split("|", 1)[0]
        target = target.split("#", 1)[0].strip()
        if target:
            links.append(target)
    return links


def tokenize(text: str) -> set[str]:
    tokens = re.split(r"[^a-z0-9]+", text.lower())
    return {t for t in tokens if t and t not in STOPWORDS}


def detect_knowledge_root(repo_root: Path) -> Path:
    nested = repo_root / "knowledge" / "SystemDesign"
    if (nested / "schema.md").exists() and (nested / "index.md").exists():
        return nested
    return repo_root / "knowledge"


def iter_md_files(base: Path) -> list[Path]:
    files: list[Path] = []
    for root, dirs, filenames in os.walk(base):
        root_path = Path(root)
        rel = root_path.relative_to(base)
        if set(rel.parts) & EXCLUDE_DIRS:
            continue
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in filenames:
            if name.endswith(".md"):
                files.append(root_path / name)
    return files


def build_title_map(knowledge_root: Path) -> dict[str, Path]:
    title_map: dict[str, Path] = {}
    for path in iter_md_files(knowledge_root):
        text = read_text(path)
        fm, body = split_frontmatter(text)
        title = ""
        for line in fm.splitlines():
            if line.lower().startswith("title:"):
                title = line.split(":", 1)[1].strip()
                break
        if not title:
            # fallback to filename stem
            title = path.stem
        title_map[title] = path
    return title_map


def candidates_from_index(index_path: Path) -> list[str]:
    if not index_path.exists():
        return []
    text = read_text(index_path)
    return sorted(set(extract_wikilinks(text)))


def score_candidate(title: str, question: str) -> float:
    title_tokens = tokenize(title)
    q_tokens = tokenize(question)
    if not title_tokens or not q_tokens:
        return 0.0
    overlap = len(title_tokens & q_tokens)
    return overlap / max(1, len(title_tokens | q_tokens))


def select_candidates(
    question: str,
    title_map: dict[str, Path],
    index_titles: list[str],
    limit: int = 6,
) -> list[Candidate]:
    candidates: list[Candidate] = []
    # Try index titles first; fall back to full title map if no hits
    for titles in ([t for t in index_titles if title_map.get(t)], list(title_map.keys())):
        for title in titles:
            path = title_map.get(title)
            if not path:
                continue
            score = score_candidate(title, question)
            if title.lower() in question.lower():
                score += 0.5
            if score > 0:
                candidates.append(Candidate(title=title, path=path, score=score))
        if candidates:
            break
    candidates.sort(key=lambda c: c.score, reverse=True)
    return candidates[:limit]


def build_context(question: str, candidates: list[Candidate], max_chars: int = 8000) -> Context:
    items: list[ContextItem] = []
    remaining = max_chars
    for cand in candidates:
        text = read_text(cand.path)
        _, body = split_frontmatter(text)
        excerpt = body[: min(len(body), remaining)]
        remaining -= len(excerpt)
        items.append(ContextItem(title=cand.title, path=str(cand.path), excerpt=excerpt))
        if remaining <= 0:
            break
    return Context(question=question, items=items)


def ask(question: str) -> str:
    repo_root = Path(__file__).resolve().parents[1]
    knowledge_root = detect_knowledge_root(repo_root)
    index_path = knowledge_root / "index.md"

    title_map = build_title_map(knowledge_root)
    index_titles = candidates_from_index(index_path)
    selected = select_candidates(question, title_map, index_titles)

    context = build_context(question, selected)
    answer_chunks = []

    try:
        import sys
        for chunk in generate_answer(context, question):
            sys.stdout.write(chunk)
            sys.stdout.flush()
            answer_chunks.append(chunk)
        print()
        answer = "".join(answer_chunks)
    except LLMAdapterError as exc:
        answer = f"LLM adapter error: {exc}"
        print(answer)

    pages_consulted = [c.title for c in selected]
    log_conversation(
        repo_root=repo_root,
        question=question,
        answer=answer,
        pages_consulted=pages_consulted,
        summary="",
        insights="",
        confidence="",
    )

    if answer_chunks and selected:
        print("\n" + "-" * 40)
        try:
            choice = input("Promote this conversation to the knowledge vault? [y/N]: ").strip().lower()
            if choice == 'y':
                print("Analyzing conversation for permanent knowledge...")
                
                promotion_prompt = """You are the Knowledge Compiler for a System Design Vault.
Your job is to analyze a Q&A conversation and extract permanent, reusable knowledge.
The vault is permanent. The conversation is temporary. Do not save chat transcripts.
If the conversation contains durable knowledge, extract it and choose a promotion type.
If it does not, reject it.

Choose exactly one Promotion Type:
1. "Create New Concept Page" (for new core concepts)
2. "Extend Existing Page" (for adding to a known concept)
3. "Create Comparison Page" (e.g. X vs Y)
4. "Create Interview Framework"
5. "Create Design Pattern Page"
6. "Create Learning Note" (for personal insights)

Return ONLY valid JSON matching this schema exactly, nothing else:
{
  "Promotion": "APPROVED" | "REJECTED",
  "Confidence": 0.0 to 1.0,
  "Promotion Type": "selected type",
  "Target File": "suggested_filename.md",
  "Related Pages": ["Page 1", "Page 2"],
  "Reason": "Why this was approved or rejected",
  "Suggested Markdown": "The distilled, permanent markdown to save (only if APPROVED)"
}"""
                backend = get_backend()
                user_msg = f"Question: {question}\n\nAnswer: {answer}"
                chunks = list(backend.generate(promotion_prompt, user_msg, format="json"))
                raw_json = "".join(chunks).strip()
                
                # Strip markdown code blocks if present
                if raw_json.startswith("```json"):
                    raw_json = raw_json[7:]
                elif raw_json.startswith("```"):
                    raw_json = raw_json[3:]
                if raw_json.endswith("```"):
                    raw_json = raw_json[:-3]
                    
                import json
                try:
                    analysis = json.loads(raw_json.strip())
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse promotion analysis: {e}")
                    print(f"Raw output:\n{raw_json}")
                    return answer
                
                if analysis.get("Promotion") != "APPROVED":
                    print(f"❌ Promotion Rejected: {analysis.get('Reason')}")
                    return answer
                    
                print(f"✅ Promotion Approved ({analysis.get('Confidence')} confidence)")
                print(f"Type: {analysis.get('Promotion Type')}")
                print(f"Reason: {analysis.get('Reason')}")
                print("-" * 40)
                
                confirm = input(f"Apply to {analysis.get('Target File')}? [Y/n]: ").strip().lower()
                if confirm == 'n':
                    print("Promotion aborted.")
                    return answer
                    
                target_file = analysis.get("Target File", "")
                if not target_file.endswith(".md"):
                    target_file += ".md"
                safe_name = "".join(c for c in target_file if c.isalnum() or c in " -_.").strip()
                
                primary_page = selected[0]
                area = primary_page.path.parent.name
                folder = primary_page.path.parent
                new_file_path = folder / safe_name
                
                markdown = analysis.get("Suggested Markdown", "")
                from datetime import date
                today = date.today().isoformat()
                
                if new_file_path.exists() and analysis.get("Promotion Type") == "Extend Existing Page":
                    with open(new_file_path, "a", encoding="utf-8") as f:
                        f.write(f"\n\n## Recent Insights\n\n{markdown}\n")
                    print(f"✅ Extended existing page: {new_file_path.relative_to(repo_root)}")
                else:
                    title = safe_name.replace(".md", "").replace("-", " ").replace("_", " ").title()
                    with open(new_file_path, "w", encoding="utf-8") as f:
                        f.write(f"---\ntitle: {title}\narea: {area}\nstatus: stub\ndifficulty: intermediate\n")
                        f.write(f"created: {today}\nlast_reviewed: {today}\nsources: []\ntags: []\n---\n\n")
                        f.write(markdown + "\n")
                    print(f"✅ Created new page: {new_file_path.relative_to(repo_root)}")
                    
        except (KeyboardInterrupt, EOFError):
            print()

    return answer


def main() -> int:
    parser = argparse.ArgumentParser(description="Query the knowledge base.")
    parser.add_argument("question", help="Natural language question")
    args = parser.parse_args()
    ask(args.question)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

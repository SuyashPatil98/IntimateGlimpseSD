#!/usr/bin/env python3
"""Conversation logger for query runtime."""

from __future__ import annotations

import datetime as dt
from pathlib import Path


def _next_sequence(folder: Path) -> int:
    existing = sorted(p for p in folder.glob("*.md") if p.name[:4].isdigit())
    if not existing:
        return 1
    last = existing[-1].stem
    try:
        return int(last) + 1
    except ValueError:
        return len(existing) + 1


def log_conversation(
    repo_root: Path,
    question: str,
    answer: str,
    pages_consulted: list[str],
    summary: str = "",
    insights: str = "",
    confidence: str = "",
) -> Path:
    """Write a conversation markdown file and return its path."""

    now = dt.datetime.now()
    date_folder = repo_root / "conversations" / now.strftime("%Y-%m-%d")
    date_folder.mkdir(parents=True, exist_ok=True)

    seq = _next_sequence(date_folder)
    path = date_folder / f"{seq:04d}.md"

    lines = []
    lines.append("# Conversation\n")
    lines.append(f"\nTimestamp: {now.isoformat(timespec='seconds')}\n")
    lines.append(f"\nQuestion:\n{question}\n")
    lines.append("\nKnowledge Pages Consulted:\n")
    if pages_consulted:
        for page in pages_consulted:
            lines.append(f"- {page}\n")
    else:
        lines.append("- None\n")
    lines.append("\nAnswer Summary:\n")
    lines.append(f"{summary or ''}\n")
    lines.append("\nPotential New Insights:\n")
    lines.append(f"{insights or ''}\n")
    lines.append("\nConfidence Estimate:\n")
    lines.append(f"{confidence or ''}\n")
    lines.append("\nAnswer:\n")
    lines.append(f"{answer}\n")

    path.write_text("".join(lines), encoding="utf-8")
    return path


__all__ = ["log_conversation"]

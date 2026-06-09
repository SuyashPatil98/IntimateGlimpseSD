#!/usr/bin/env python3
"""Extract a raw source file (PDF or markdown) into markdown text."""
from __future__ import annotations

from pathlib import Path


def extract(path) -> str:
    path = Path(path)
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        import pymupdf4llm
        return pymupdf4llm.to_markdown(str(path))
    if suffix in (".md", ".markdown", ".txt"):
        return path.read_text(encoding="utf-8", errors="ignore")
    raise ValueError(f"unsupported source type: {suffix}")

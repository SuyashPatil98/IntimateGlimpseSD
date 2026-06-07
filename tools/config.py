"""Central configuration — the single source of truth for env vars and paths.

Every other module imports from here instead of reading os.environ ad hoc.
Loaded once at import time; `.env` at the repo root is read if present.
"""
from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# Load .env (best-effort; missing or malformed file is non-fatal).
try:
    from dotenv import load_dotenv
    load_dotenv(REPO_ROOT / ".env")
except Exception:
    pass


# ── Paths ────────────────────────────────────────────────────────────────────
def _detect_vault_root() -> Path:
    nested = REPO_ROOT / "knowledge" / "SystemDesign"
    if (nested / "schema.md").exists():
        return nested
    return REPO_ROOT / "knowledge"


VAULT_ROOT = _detect_vault_root()
RAW_DIR = REPO_ROOT / "raw"
CACHE_DIR = REPO_ROOT / ".cache"
EMBEDDINGS_CACHE = CACHE_DIR / "embeddings.npz"
STATE_DB = REPO_ROOT / "state.db"
PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
COURSE_DATA = REPO_ROOT / "course-app" / "public" / "course-data.json"
CONVERSATIONS_DIR = REPO_ROOT / "conversations"
INDEX_MD = VAULT_ROOT / "index.md"
LOG_MD = VAULT_ROOT / "log.md"
ALIASES_JSON = VAULT_ROOT / "aliases.json"

# Directories that hold non-concept files — excluded from vault scans.
EXCLUDE_DIRS = {
    "raw", ".obsidian", ".claude", ".venv", ".venv-win", ".git", "tools",
    "roadmaps", "TagsRoutes", "graph-screenshot", "__pycache__", ".cache",
}
# Meta pages that are not concept pages.
META_PAGES = {"wiki", "index", "schema", "log", "source-map", "SESSION_STATE", "inbox"}


# ── 14 canonical areas (schema.md §2) ────────────────────────────────────────
AREAS = [
    "distributed-systems", "databases", "networking", "storage", "messaging",
    "caching", "reliability", "architecture-patterns", "design-patterns",
    "software-engineering", "data-engineering", "ml-systems",
    "system-design-interview", "case-studies",
]


# ── LLM: hybrid routing ──────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_KEEP_ALIVE = os.environ.get("OLLAMA_KEEP_ALIVE", "-1")

QWEN_ASK_MODEL = os.environ.get("QWEN_ASK_MODEL", "qwen3:8b")
QWEN_PROMOTE_MODEL = os.environ.get("QWEN_PROMOTE_MODEL", "qwen3:8b")
CLAUDE_ASK_MODEL = os.environ.get("CLAUDE_ASK_MODEL", "claude-haiku-4-5-20251001")
CLAUDE_PROMOTE_MODEL = os.environ.get("CLAUDE_PROMOTE_MODEL", "claude-sonnet-4-6")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

LLM_MAX_RETRIES = int(os.environ.get("LLM_MAX_RETRIES", "2"))
LLM_TIMEOUT_SECONDS = int(os.environ.get("LLM_TIMEOUT_SECONDS", "60"))

# role -> (primary_backend, fallback_backend)
ROLE_ROUTING = {
    "ask": ("qwen", "claude"),       # local-first, cheap; Claude Haiku on failure
    "promote": ("claude", "qwen"),   # quality-first; Qwen on failure
}
# backend id -> model env per role
MODEL_FOR = {
    ("qwen", "ask"): QWEN_ASK_MODEL,
    ("qwen", "promote"): QWEN_PROMOTE_MODEL,
    ("claude", "ask"): CLAUDE_ASK_MODEL,
    ("claude", "promote"): CLAUDE_PROMOTE_MODEL,
}


# ── Retrieval ────────────────────────────────────────────────────────────────
EMBED_MODEL = os.environ.get("EMBED_MODEL", "BAAI/bge-base-en-v1.5")
RERANK_MODEL = os.environ.get("RERANK_MODEL", "BAAI/bge-reranker-base")
RETRIEVAL_TOP_K = int(os.environ.get("RETRIEVAL_TOP_K", "20"))   # candidates before rerank
RETRIEVAL_TOP_N = int(os.environ.get("RETRIEVAL_TOP_N", "6"))    # pages after rerank
GRAPH_EXPANSION_HOPS = int(os.environ.get("GRAPH_EXPANSION_HOPS", "1"))
USE_QUERY_REWRITE = os.environ.get("USE_QUERY_REWRITE", "0") == "1"


# ── Server ───────────────────────────────────────────────────────────────────
SESSION_TTL_MINUTES = int(os.environ.get("SESSION_TTL_MINUTES", "30"))
LLM_CONCURRENCY = int(os.environ.get("LLM_CONCURRENCY", "3"))  # Ollama GPU-bound
INDEX_REBUILD_DEBOUNCE_S = int(os.environ.get("INDEX_REBUILD_DEBOUNCE_S", "30"))

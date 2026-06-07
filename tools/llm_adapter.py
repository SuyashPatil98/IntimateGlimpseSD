#!/usr/bin/env python3
"""LLM adapter interface.

Backend abstraction for the query runtime.  Swap implementations by
setting BRAIN_LLM_BACKEND (default: ollama).

Supported backends:
  ollama  — local Ollama instance (default model: qwen3:8b)
  gemini  — Google Gemini API (default model: gemini-1.5-flash)

Configuration (environment variables):
  BRAIN_LLM_BACKEND  — backend name          (default: ollama)
  
  # For Ollama
  OLLAMA_HOST        — Ollama base URL        (default: http://localhost:11434)
  OLLAMA_MODEL       — model to use           (default: qwen3:8b)
  
  # For Gemini
  GEMINI_API_KEY     — your API key           (required if using gemini)
  GEMINI_MODEL       — model to use           (default: gemini-1.5-flash)
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import Protocol


# ---------------------------------------------------------------------------
# Data classes (public API — consumed by query_engine)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ContextItem:
    title: str
    path: str
    excerpt: str


@dataclass(frozen=True)
class Context:
    question: str
    items: list[ContextItem]


class LLMAdapterError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Backend protocol
# ---------------------------------------------------------------------------

class Backend(Protocol):
    """Any object that can turn (system, user) message pair into a response."""

    def generate(self, system: str, user: str, format: str | None = None) -> Iterable[str]: ...


# ---------------------------------------------------------------------------
# Ollama backend
# ---------------------------------------------------------------------------

_OLLAMA_DEFAULT_URL = "http://localhost:11434"
_OLLAMA_DEFAULT_MODEL = "qwen3:8b"


class OllamaBackend:
    """Call a local Ollama instance via its HTTP chat API."""

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
    ) -> None:
        self.base_url = (
            base_url
            or os.environ.get("OLLAMA_HOST", _OLLAMA_DEFAULT_URL)
        ).rstrip("/")
        self.model = model or os.environ.get("OLLAMA_MODEL", _OLLAMA_DEFAULT_MODEL)

    def generate(self, system: str, user: str, format: str | None = None) -> Iterable[str]:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": True,
        }
        if format == "json":
            payload["format"] = "json"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                in_think_block = False
                for line in resp:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        body = json.loads(line.decode("utf-8"))
                    except json.JSONDecodeError:
                        continue

                    message = body.get("message", {})
                    text = message.get("content", "")
                    if not text:
                        text = body.get("response", "")
                        
                    # Handle <think> blocks natively as they stream
                    if "<think>" in text:
                        in_think_block = True
                        text = text.replace("<think>", "")
                    if "</think>" in text:
                        in_think_block = False
                        text = text.replace("</think>", "")
                        
                    if text and not in_think_block:
                        yield text
        except urllib.error.URLError as exc:
            raise LLMAdapterError(
                f"Cannot reach Ollama at {self.base_url}. "
                f"Is it running?  Start with: ollama serve\n"
                f"Error: {exc}"
            ) from exc


def _strip_thinking(text: str) -> str:
    """Remove <think>...</think> blocks that reasoning models emit."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


# ---------------------------------------------------------------------------
# Gemini backend
# ---------------------------------------------------------------------------

_GEMINI_DEFAULT_MODEL = "gemini-2.5-flash"


class GeminiBackend:
    """Call Google's Gemini API."""

    def __init__(self, model: str | None = None) -> None:
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise LLMAdapterError("GEMINI_API_KEY environment variable is required")
        self.model = model or os.environ.get("GEMINI_MODEL", _GEMINI_DEFAULT_MODEL)

    def generate(self, system: str, user: str, format: str | None = None) -> Iterable[str]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"parts": [{"text": user}]}],
        }
        if format == "json":
            payload["generationConfig"] = {"responseMimeType": "application/json"}
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            error_msg = str(exc)
            if hasattr(exc, "read"):
                try:
                    err_body = json.loads(exc.read().decode("utf-8"))
                    error_msg = err_body.get("error", {}).get("message", error_msg)
                except Exception:
                    pass
            raise LLMAdapterError(f"Gemini API error: {error_msg}") from exc
        except json.JSONDecodeError as exc:
            raise LLMAdapterError(f"Invalid JSON from Gemini: {exc}") from exc

        try:
            yield body["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError) as exc:
            raise LLMAdapterError(f"Unexpected Gemini API response format: {body}") from exc


# ---------------------------------------------------------------------------
# Backend registry
# ---------------------------------------------------------------------------

_BACKENDS: dict[str, type] = {
    "ollama": OllamaBackend,
    "gemini": GeminiBackend,
}

_active_backend: Backend | None = None


def get_backend() -> Backend:
    """Return the configured backend, instantiating on first call."""
    global _active_backend
    if _active_backend is None:
        name = os.environ.get("BRAIN_LLM_BACKEND", "ollama").lower()
        cls = _BACKENDS.get(name)
        if cls is None:
            raise LLMAdapterError(
                f"Unknown backend '{name}'. "
                f"Available: {', '.join(sorted(_BACKENDS))}"
            )
        _active_backend = cls()
    return _active_backend


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a system design knowledge engine.  You answer questions using the \
curated wiki pages provided below as context.

Rules:
- Ground every claim in the provided context.  Cite page titles as [[Page Name]].
- If the context does not cover the question, say so explicitly — do NOT invent.
- Be precise, technical, and concise.
- When sources disagree, present both perspectives and note the disagreement.
- Structure long answers with clear markdown headings.
- For system design questions, address: requirements, high-level design, \
key components, data model, scalability, and failure modes when applicable.
"""


def _build_prompt(context: Context) -> tuple[str, str]:
    """Build (system, user) message pair from a Context object."""
    if not context.items:
        context_block = "(No matching wiki pages found for this question.)\n"
    else:
        parts = []
        for item in context.items:
            parts.append(f"--- [[{item.title}]] ---\n{item.excerpt}\n")
        context_block = "\n".join(parts)

    user = (
        f"## Context from the knowledge base\n\n"
        f"{context_block}\n\n"
        f"## Question\n\n"
        f"{context.question}"
    )
    return _SYSTEM_PROMPT, user


# ---------------------------------------------------------------------------
# Public API  (signature unchanged — query_engine imports this)
# ---------------------------------------------------------------------------

def generate_answer(context: Context, question: str) -> Iterable[str]:
    """Generate an answer for a question given context.

    Reads relevant wiki pages from the context, sends them alongside
    the question to the configured LLM backend, and returns the answer.
    """
    backend = get_backend()
    system, user = _build_prompt(context)
    return backend.generate(system, user)


__all__ = [
    "Context",
    "ContextItem",
    "LLMAdapterError",
    "generate_answer",
    "get_backend",
    "OllamaBackend",
    "GeminiBackend",
    "Backend",
]

#!/usr/bin/env python3
"""LLM adapter — role-based routing with fallback.

Roles (config.ROLE_ROUTING):
  ask      → Qwen (local, free) primary; Claude Haiku fallback
  promote  → Claude Sonnet primary;       Qwen fallback

`stream()` yields typed events so the API can surface a fallback banner:
  {"type": "backend", "backend": "qwen", "primary": True}
  {"type": "chunk",   "text": "..."}
  {"type": "notice",  "text": "qwen failed (...); falling back"}
  {"type": "error",   "text": "..."}

Claude calls mark the system prompt and an optional `cache_prefix` (the vault
map) as cacheable — ~90% input-cost reduction on repeated promote calls.
Degrades gracefully: unavailable backends are skipped; if no API/model is up,
ask still works on whatever is available.
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Iterator

import config

try:
    import prompts
except Exception:  # pragma: no cover
    prompts = None


class LLMAdapterError(RuntimeError):
    pass


# ── Back-compat context types (used by query_engine CLI) ─────────────────────
@dataclass(frozen=True)
class ContextItem:
    title: str
    path: str
    excerpt: str


@dataclass(frozen=True)
class Context:
    question: str
    items: list[ContextItem]


def _strip_thinking(text: str) -> str:
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


# ── Backends ─────────────────────────────────────────────────────────────────
class OllamaBackend:
    name = "qwen"

    def available(self) -> bool:
        try:
            urllib.request.urlopen(f"{config.OLLAMA_HOST}/api/tags", timeout=2)
            return True
        except Exception:
            return False

    def generate(self, model, system, user, cache_prefix="", as_json=False) -> Iterator[str]:
        full_user = f"{cache_prefix}\n\n{user}" if cache_prefix else user
        ka = config.OLLAMA_KEEP_ALIVE
        keep_alive = int(ka) if str(ka).lstrip("-").isdigit() else ka
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": full_user},
            ],
            "stream": True,
            "keep_alive": keep_alive,
        }
        if as_json:
            payload["format"] = "json"
        req = urllib.request.Request(
            f"{config.OLLAMA_HOST}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            resp = urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT_SECONDS * 6)
        except urllib.error.URLError as exc:
            raise LLMAdapterError(f"Ollama unreachable at {config.OLLAMA_HOST}: {exc}") from exc
        in_think = False
        for line in resp:
            line = line.strip()
            if not line:
                continue
            try:
                body = json.loads(line.decode("utf-8"))
            except json.JSONDecodeError:
                continue
            text = body.get("message", {}).get("content", "") or body.get("response", "")
            if not text:
                continue
            if "<think>" in text:
                in_think = True
                text = text.split("<think>")[0]
            if "</think>" in text:
                in_think = False
                text = text.split("</think>")[-1]
            if text and not in_think:
                yield text


class ClaudeBackend:
    name = "claude"

    def available(self) -> bool:
        if not config.ANTHROPIC_API_KEY:
            return False
        try:
            import anthropic  # noqa: F401
            return True
        except Exception:
            return False

    def generate(self, model, system, user, cache_prefix="", as_json=False) -> Iterator[str]:
        import anthropic
        client = anthropic.Anthropic(
            api_key=config.ANTHROPIC_API_KEY, timeout=float(config.LLM_TIMEOUT_SECONDS)
        )
        system_blocks = [{"type": "text", "text": system,
                          "cache_control": {"type": "ephemeral"}}]
        content = []
        if cache_prefix:
            content.append({"type": "text", "text": cache_prefix,
                            "cache_control": {"type": "ephemeral"}})
        content.append({"type": "text", "text": user})
        try:
            with client.messages.stream(
                model=model, max_tokens=4096, system=system_blocks,
                messages=[{"role": "user", "content": content}],
            ) as s:
                for text in s.text_stream:
                    yield text
        except Exception as exc:  # anthropic.APIError etc.
            raise LLMAdapterError(f"Claude error: {exc}") from exc


class GeminiBackend:
    name = "gemini"

    def available(self) -> bool:
        return bool(config.GEMINI_API_KEY)

    def generate(self, model, system, user, cache_prefix="", as_json=False) -> Iterator[str]:
        full_user = f"{cache_prefix}\n\n{user}" if cache_prefix else user
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"{model}:generateContent?key={config.GEMINI_API_KEY}")
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"parts": [{"text": full_user}]}],
        }
        if as_json:
            payload["generationConfig"] = {"responseMimeType": "application/json"}
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT_SECONDS) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            yield body["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as exc:
            raise LLMAdapterError(f"Gemini error: {exc}") from exc


BACKENDS: dict[str, object] = {
    "qwen": OllamaBackend(),
    "claude": ClaudeBackend(),
    "gemini": GeminiBackend(),
}


def _model_for(backend: str, role: str) -> str:
    return config.MODEL_FOR.get((backend, role)) or config.MODEL_FOR.get((backend, "ask"), "")


def _attempt_with_retries(backend, model, system, user, cache_prefix, as_json) -> Iterator[str]:
    """Get a generator and pull its first chunk under a retry budget. Once the
    first token arrives, stream the rest (mid-stream failures are not retried)."""
    attempts = config.LLM_MAX_RETRIES + 1
    last_err = None
    for attempt in range(attempts):
        try:
            gen = backend.generate(model, system, user, cache_prefix, as_json)
            first = next(gen)

            def _chain(first_chunk, rest):
                yield first_chunk
                yield from rest

            return _chain(first, gen)
        except StopIteration:
            return iter(())
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            if attempt < attempts - 1:
                time.sleep(0.5 * (attempt + 1))
    raise LLMAdapterError(str(last_err))


def stream(role: str, system: str, user: str, *, cache_prefix: str = "",
           as_json: bool = False) -> Iterator[dict]:
    """Route a generation by role with fallback. Yields typed events."""
    primary, fallback = config.ROLE_ROUTING.get(role, ("qwen", "claude"))
    chain = [b for b in (primary, fallback) if BACKENDS[b].available()]
    if not chain:  # last resort: anything available
        chain = [n for n, b in BACKENDS.items() if b.available()]
    if not chain:
        yield {"type": "error", "text": "No LLM backend available. Start Ollama or set ANTHROPIC_API_KEY."}
        return

    last_err = None
    for i, name in enumerate(chain):
        model = _model_for(name, role)
        try:
            gen = _attempt_with_retries(
                BACKENDS[name], model, system, user, cache_prefix, as_json
            )
            yield {"type": "backend", "backend": name, "model": model, "primary": i == 0}
            for chunk in gen:
                yield {"type": "chunk", "text": chunk}
            return
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            if i + 1 < len(chain):
                yield {"type": "notice",
                       "text": f"{name} failed ({exc}); falling back to {chain[i + 1]}"}
    yield {"type": "error", "text": f"All backends failed: {last_err}"}


def complete(role: str, system: str, user: str, *, cache_prefix: str = "",
             as_json: bool = False) -> str:
    """Non-streaming convenience: returns the full text (raises on total failure)."""
    out, backend = [], None
    for ev in stream(role, system, user, cache_prefix=cache_prefix, as_json=as_json):
        if ev["type"] == "chunk":
            out.append(ev["text"])
        elif ev["type"] == "backend":
            backend = ev["backend"]
        elif ev["type"] == "error":
            raise LLMAdapterError(ev["text"])
    text = "".join(out)
    return _strip_thinking(text) if not as_json else text


def health() -> dict:
    """{backend: available} for the UI status bar."""
    return {name: b.available() for name, b in BACKENDS.items()}


# ── Back-compat surface (query_engine CLI / brain ask) ───────────────────────
def get_backend():
    return BACKENDS["qwen"]


def _render_context(context: Context, question: str) -> str:
    if not context.items:
        block = "(No matching vault pages found.)"
    else:
        block = "\n\n".join(f"--- [[{it.title}]] ---\n{it.excerpt}" for it in context.items)
    return f"# Vault context\n\n{block}\n\n# Question\n\n{question}"


def generate_answer(context: Context, question: str) -> Iterator[str]:
    system = prompts.load_prompt("vault_qa_system") if prompts else \
        "Answer using only the provided context. Cite [[Page]]. If not covered, say so."
    for ev in stream("ask", system, _render_context(context, question)):
        if ev["type"] == "chunk":
            yield ev["text"]
        elif ev["type"] == "error":
            yield f"\n[error] {ev['text']}"


__all__ = [
    "stream", "complete", "health", "BACKENDS", "LLMAdapterError",
    "Context", "ContextItem", "generate_answer", "get_backend",
    "OllamaBackend", "ClaudeBackend", "GeminiBackend",
]

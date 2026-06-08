#!/usr/bin/env python3
"""Dry-run the Claude (Sonnet) promote/compile route and show token cost.

Reads ANTHROPIC_API_KEY from .env (config loads it). Add this line to .env first:
    ANTHROPIC_API_KEY=sk-ant-...

Run:  .venv-win/Scripts/python tools/dryrun_claude.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import config
import llm_adapter
import state
from sqlmodel import select


def main() -> int:
    print("=== Routing ===")
    print(f"  conversations (ask) -> primary {config.ROLE_ROUTING['ask'][0]}  "
          f"(qwen model: {config.QWEN_ASK_MODEL})")
    print(f"  promote/compile     -> primary {config.ROLE_ROUTING['promote'][0]}  "
          f"(claude model: {config.CLAUDE_PROMOTE_MODEL})")
    print(f"  backends available  -> {llm_adapter.health()}")

    if not config.ANTHROPIC_API_KEY:
        print("\n[!] No ANTHROPIC_API_KEY found. Add it to .env, then re-run:")
        print("    ANTHROPIC_API_KEY=sk-ant-...")
        return 1

    print(f"\n=== Live promote-route call ({config.CLAUDE_PROMOTE_MODEL}) ===")
    try:
        out = llm_adapter.complete(
            "promote",
            "You are the knowledge compiler. Reply with exactly one word.",
            "Say READY.",
        )
        print(f"  Claude replied: {out.strip()[:80]!r}")
    except Exception as e:  # noqa: BLE001
        print(f"  [!] call failed: {e}")
        return 1

    with state.db() as s:
        last = list(s.exec(select(state.TokenUsage).order_by(state.TokenUsage.id.desc())))[:1]
    if last:
        u = last[0]
        print("\n=== Recorded usage (this call) ===")
        print(f"  model={u.model} role={u.role}")
        print(f"  input={u.input_tokens}  output={u.output_tokens}  "
              f"cache_write={u.cache_write_tokens}  cache_read={u.cache_read_tokens}")
        print(f"  cost=${u.cost_usd:.6f}")

    with state.db() as s:
        rows = list(s.exec(select(state.TokenUsage)))
    print(f"\n=== Lifetime Claude spend ===")
    print(f"  calls={len(rows)}  total=${sum(r.cost_usd for r in rows):.4f}")
    print("\nOK — Sonnet promote route works and usage is being tracked.")
    print("Note: conversations use local Qwen — install Ollama + `ollama pull qwen3:8b` to test that path.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

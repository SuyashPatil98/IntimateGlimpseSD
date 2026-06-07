"""Pre-generated prompt templates (authored offline by Opus, executed at runtime
by Qwen/Claude). Loaded as static files so every call uses the same vetted prompt.

Fails fast: a missing template is a deployment error, not something to paper over
with an inline fallback string.
"""
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent
_cache: dict[str, str] = {}


def load_prompt(name: str) -> str:
    """Return the text of tools/prompts/<name>.md. Raises if absent."""
    if name in _cache:
        return _cache[name]
    path = PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(
            f"Missing prompt template: {path}. "
            f"Generate it (Opus) before runtime — see CLAUDE.md 'Prompt files'."
        )
    text = path.read_text(encoding="utf-8")
    _cache[name] = text
    return text


__all__ = ["load_prompt", "PROMPTS_DIR"]

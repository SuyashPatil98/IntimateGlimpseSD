"""
Export the vault's recall questions to Anki .apkg files (one per area).

Parses the `## Active Recall Questions` section of every page. Supports both
formats from schema.md §5:
  Single-line:   Question::Answer
  Multi-line:    Question \n ? \n Answer (blank line ends)

Output: tools/anki/SystemDesign__<area>.apkg
Each card is tagged with: area::<area>, concept::<page_name>, difficulty::<level>

Usage: python tools/export_anki.py
"""
from __future__ import annotations
import hashlib
import re
import sys
from pathlib import Path

try:
    import genanki
except ImportError:
    print("ERROR: genanki not installed. Run: pip install genanki")
    sys.exit(1)

from vault import VAULT, collect_pages

ANKI_DIR = Path(__file__).resolve().parent / "anki"
ANKI_DIR.mkdir(exist_ok=True)


def stable_id(s: str) -> int:
    """Deterministic 32-bit id from a string."""
    h = hashlib.sha1(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16)


# One shared model so cards survive deck regeneration (same model id = updates not duplicates)
MODEL_ID = stable_id("SystemDesignKB::v1")

MODEL = genanki.Model(
    MODEL_ID,
    "System Design KB",
    fields=[
        {"name": "Question"},
        {"name": "Answer"},
        {"name": "Concept"},
        {"name": "Area"},
        {"name": "Difficulty"},
    ],
    templates=[{
        "name": "Recall",
        "qfmt": (
            '<div class="meta">{{Area}} &middot; {{Concept}} &middot; {{Difficulty}}</div>'
            '<hr>'
            '<div class="q">{{Question}}</div>'
        ),
        "afmt": (
            '{{FrontSide}}'
            '<hr id="answer">'
            '<div class="a">{{Answer}}</div>'
        ),
    }],
    css=(
        ".card { font-family: -apple-system, Segoe UI, sans-serif; "
        "font-size: 18px; max-width: 720px; margin: 0 auto; padding: 16px; }"
        ".meta { font-size: 12px; color: #888; text-transform: uppercase; "
        "letter-spacing: 0.05em; }"
        ".q { font-weight: 600; margin-top: 12px; }"
        ".a { margin-top: 12px; line-height: 1.6; }"
        "hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }"
        "code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; "
        "font-family: SF Mono, Menlo, monospace; font-size: 0.9em; }"
    ),
)


SECTION_RE = re.compile(r"^##\s+Active Recall Questions\s*$", re.MULTILINE)


def extract_recall_block(body: str) -> str:
    """Return text of the Active Recall Questions section (until next ## or EOF)."""
    m = SECTION_RE.search(body)
    if not m:
        return ""
    start = m.end()
    # Find next ## heading
    rest = body[start:]
    next_h = re.search(r"\n##\s+", rest)
    end = next_h.start() if next_h else len(rest)
    return rest[:end].strip()


# Single-line: "Question::Answer" — Question can't itself contain ::
SINGLE_LINE_RE = re.compile(r"^([^\n].*?)::(.+?)$", re.MULTILINE)


def parse_questions(block: str):
    """Return list of (question, answer) pairs from a recall block."""
    pairs = []

    # Pass 1: multi-line format (handled first; we replace consumed segments)
    # Format:
    #   Question text\n
    #   ?\n
    #   Answer text\n
    #   [blank or end]
    multi_re = re.compile(
        r"^(.+?)\n\?\n(.+?)(?=\n\s*\n|\n##|\Z)", re.MULTILINE | re.DOTALL
    )
    consumed_spans = []
    for m in multi_re.finditer(block):
        q = m.group(1).strip()
        a = m.group(2).strip()
        if q and a and "?" not in q.split("\n")[-1][-3:]:  # crude validity
            pairs.append((q, a))
            consumed_spans.append((m.start(), m.end()))

    # Mask consumed spans
    masked = list(block)
    for s, e in consumed_spans:
        for i in range(s, e):
            if i < len(masked):
                masked[i] = " "
    remaining = "".join(masked)

    # Pass 2: single-line format on remaining
    for m in SINGLE_LINE_RE.finditer(remaining):
        q = m.group(1).strip()
        a = m.group(2).strip()
        # Skip if this is YAML-like or a section start
        if q.startswith(("#", "-", "*", ">", "|", "```")):
            continue
        if not q or not a:
            continue
        # Skip likely false positives (very short answers that look like code)
        pairs.append((q, a))

    return pairs


def md_inline_to_html(text: str) -> str:
    """Light markdown→HTML for recall display."""
    # Inline code
    text = re.sub(r"`([^`\n]+)`", r"<code>\1</code>", text)
    # Bold
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    # Italic (avoid clobbering bold)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", text)
    # Wikilinks -> plain styled text (Anki has no graph)
    text = re.sub(r"\[\[([^|\]]+?)(?:\|([^\]]+))?\]\]",
                  lambda m: f"<em>{m.group(2) or m.group(1)}</em>", text)
    # Newlines to <br>
    text = text.replace("\n", "<br>")
    return text


def sanitize_tag(s: str) -> str:
    """Anki tags can't contain spaces."""
    return re.sub(r"[^A-Za-z0-9_]+", "_", s).strip("_")


def build_decks(pages):
    by_area = {}
    skipped_no_recall = []
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        fm = p["frontmatter"]
        area = fm.get("area")
        if not area:
            continue
        recall_block = extract_recall_block(p["body"])
        if not recall_block:
            skipped_no_recall.append(name)
            continue
        pairs = parse_questions(recall_block)
        if not pairs:
            skipped_no_recall.append(name)
            continue
        by_area.setdefault(area, []).append({
            "concept": fm.get("title", name),
            "difficulty": fm.get("difficulty", "intermediate"),
            "area": area,
            "pairs": pairs,
        })
    return by_area, skipped_no_recall


def make_deck(area, page_entries):
    deck_id = stable_id(f"SystemDesign::{area}")
    deck = genanki.Deck(deck_id, f"SystemDesign::{area}")
    card_count = 0
    for entry in page_entries:
        concept_tag = sanitize_tag(entry["concept"])
        area_tag = sanitize_tag(entry["area"])
        diff_tag = sanitize_tag(entry["difficulty"])
        tags = [
            f"area::{area_tag}",
            f"concept::{concept_tag}",
            f"difficulty::{diff_tag}",
            "SystemDesign",
        ]
        for (q, a) in entry["pairs"]:
            note_id = stable_id(f"{entry['concept']}::{q}")
            note = genanki.Note(
                model=MODEL,
                fields=[
                    md_inline_to_html(q),
                    md_inline_to_html(a),
                    entry["concept"],
                    entry["area"],
                    entry["difficulty"],
                ],
                tags=tags,
                guid=genanki.guid_for(note_id),
            )
            deck.add_note(note)
            card_count += 1
    return deck, card_count


def main():
    pages = collect_pages()
    print(f"Loaded {len(pages)} pages")
    by_area, skipped = build_decks(pages)

    total_cards = 0
    for area in sorted(by_area):
        deck, count = make_deck(area, by_area[area])
        out_path = ANKI_DIR / f"SystemDesign__{area}.apkg"
        genanki.Package(deck).write_to_file(str(out_path))
        print(f"  {area:30s} -> {out_path.name}  ({len(by_area[area])} concepts, {count} cards)")
        total_cards += count

    print(f"\nTotal cards exported: {total_cards}")
    if skipped:
        print(f"Pages with no parseable recall questions: {len(skipped)}")
        if len(skipped) <= 10:
            for s in skipped:
                print(f"  - {s}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Hybrid retrieval engine for the vault.

Pipeline:  BM25 (sparse) + dense embeddings  ->  Reciprocal Rank Fusion
           ->  cross-encoder rerank  ->  wikilink-graph expansion.

Returns ranked pages **plus the specific sections that matched and their scores**
so the UI can show *why* a page surfaced. Embeddings are section-level and cached
by content hash (only changed pages re-embed on rebuild). Falls back to keyword
scoring if the ML models can't load.
"""
from __future__ import annotations

import hashlib
import re
import threading
import time
from dataclasses import dataclass

import numpy as np

import config
import vault

# ── Lazy model singletons ────────────────────────────────────────────────────
_embedder = None
_reranker = None
_models_ok: bool | None = None          # None=untried, True=loaded, False=failed
_BGE_QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "


def _load_models() -> bool:
    global _embedder, _reranker, _models_ok
    if _models_ok is not None:
        return _models_ok
    try:
        from sentence_transformers import CrossEncoder, SentenceTransformer
        _embedder = SentenceTransformer(config.EMBED_MODEL)
        _reranker = CrossEncoder(config.RERANK_MODEL)
        _models_ok = True
    except Exception as e:  # noqa: BLE001 — degrade gracefully
        print(f"[retrieval] model load failed ({e}); using keyword fallback")
        _models_ok = False
    return _models_ok


def _is_bge(name: str) -> bool:
    return "bge" in name.lower()


def _embed(texts: list[str], is_query: bool = False) -> np.ndarray:
    if is_query and _is_bge(config.EMBED_MODEL):
        texts = [_BGE_QUERY_INSTRUCTION + t for t in texts]
    vecs = _embedder.encode(
        texts, batch_size=64, normalize_embeddings=True,
        show_progress_bar=False, convert_to_numpy=True,
    )
    return np.asarray(vecs, dtype="float32")


# ── Chunking (section-aware) ─────────────────────────────────────────────────
_TOKEN_RE = re.compile(r"[a-z0-9]+")
_HEADING_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)
_H1_RE = re.compile(r"^#\s+.+?$", re.MULTILINE)

# Low-signal sections excluded from retrieval (quiz answers would match on phrasing).
_SKIP_SECTIONS = {
    "active recall questions", "feynman test", "mastery checklist", "references",
}


@dataclass
class Chunk:
    page: str
    title: str
    area: str
    status: str
    section: str        # "" for the intro chunk
    text: str

    @property
    def embed_text(self) -> str:
        head = f"{self.title} — {self.section}" if self.section else self.title
        return f"{head}\n{self.text}"

    @property
    def hash(self) -> str:
        return hashlib.sha1(self.embed_text.encode("utf-8")).hexdigest()


def _split_sections(body: str) -> list[tuple[str, str]]:
    """[(heading, text), ...]. Content before the first ## becomes heading ''."""
    matches = list(_HEADING_RE.finditer(body))
    out: list[tuple[str, str]] = []
    intro = (body[: matches[0].start()] if matches else body)
    intro = _H1_RE.sub("", intro, count=1).strip()
    if intro:
        out.append(("", intro))
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        text = body[start:end].strip()
        if text:
            out.append((m.group(1).strip(), text))
    return out


def build_chunks(pages: dict | None = None) -> list[Chunk]:
    pages = pages if pages is not None else vault.collect_pages()
    chunks: list[Chunk] = []
    for name, p in pages.items():
        if p["is_meta"]:
            continue
        fm = p["frontmatter"]
        title = fm.get("title", name)
        area = fm.get("area", "unknown")
        status = fm.get("status", "stub")
        secs = _split_sections(p["body"]) or [("", p["body"].strip())]
        for heading, text in secs:
            if heading.lower() in _SKIP_SECTIONS or not text:
                continue
            chunks.append(Chunk(name, title, area, status, heading, text[:1500]))
    return chunks


# ── Index ────────────────────────────────────────────────────────────────────
@dataclass
class RetrievalIndex:
    chunks: list[Chunk]
    embeddings: np.ndarray | None
    bm25: object | None
    pages: dict
    resolver: dict
    built_at: float = 0.0


_index: RetrievalIndex | None = None
_lock = threading.RLock()


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _load_cache() -> dict[str, np.ndarray]:
    if not config.EMBEDDINGS_CACHE.exists():
        return {}
    try:
        data = np.load(config.EMBEDDINGS_CACHE, allow_pickle=False)
        hashes, vecs = data["hashes"], data["vectors"]
        return {str(h): vecs[i] for i, h in enumerate(hashes)}
    except Exception:
        return {}


def _save_cache(chunks: list[Chunk], vectors: np.ndarray) -> None:
    config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(
        config.EMBEDDINGS_CACHE,
        hashes=np.array([c.hash for c in chunks]),
        vectors=vectors,
    )


def build_index(force: bool = False) -> RetrievalIndex:
    """Build (or rebuild) the in-memory index. Reuses cached embeddings by hash."""
    global _index
    pages = vault.collect_pages()
    resolver = vault.build_resolver(pages)
    chunks = build_chunks(pages)

    embeddings = None
    bm25 = None
    if chunks and _load_models():
        _dim_fn = getattr(_embedder, "get_embedding_dimension", None) or \
            _embedder.get_sentence_embedding_dimension
        dim = _dim_fn()
        cache = {} if force else _load_cache()
        mat = np.zeros((len(chunks), dim), dtype="float32")
        missing = []
        for i, c in enumerate(chunks):
            v = cache.get(c.hash)
            if v is not None and getattr(v, "shape", (0,))[0] == dim:
                mat[i] = v
            else:
                missing.append(i)
        if missing:
            t0 = time.time()
            new = _embed([chunks[i].embed_text for i in missing], is_query=False)
            for j, i in enumerate(missing):
                mat[i] = new[j]
            print(f"[retrieval] embedded {len(missing)}/{len(chunks)} chunks "
                  f"in {time.time() - t0:.1f}s")
        embeddings = mat
        _save_cache(chunks, embeddings)

        from rank_bm25 import BM25Okapi
        bm25 = BM25Okapi([_tokenize(c.embed_text) for c in chunks])

    _index = RetrievalIndex(chunks, embeddings, bm25, pages, resolver, time.time())
    return _index


def get_index() -> RetrievalIndex:
    global _index
    if _index is None:
        with _lock:
            if _index is None:
                build_index()
    return _index


def rebuild() -> RetrievalIndex:
    """Rebuild after a vault write. Only changed chunks re-embed (hash cache)."""
    with _lock:
        return build_index(force=False)


# ── Search ───────────────────────────────────────────────────────────────────
@dataclass
class RetrievalResult:
    page: str
    title: str
    area: str
    status: str
    score: float
    matched_sections: list[str]
    snippet: str
    via: str            # "retrieval" | "graph"

    def to_dict(self) -> dict:
        return {
            "page": self.page, "title": self.title, "area": self.area,
            "status": self.status, "score": round(self.score, 4),
            "matched_sections": self.matched_sections, "snippet": self.snippet,
            "via": self.via,
        }


def _rrf(rank_lists: list[list[int]], k: int = 60) -> dict[int, float]:
    scores: dict[int, float] = {}
    for ranks in rank_lists:
        for rank, idx in enumerate(ranks):
            scores[idx] = scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
    return scores


def _snippet(page_name: str, idx: RetrievalIndex, max_chars: int = 240) -> str:
    p = idx.pages.get(page_name, {})
    body = p.get("body", "")
    secs = _split_sections(body)
    for heading, text in secs:
        if heading.lower().startswith("executive summary") or heading == "":
            return text[:max_chars].strip()
    return body[:max_chars].strip()


def _mk_result(page_name, score, sections, via, idx) -> RetrievalResult:
    p = idx.pages.get(page_name, {})
    fm = p.get("frontmatter", {})
    return RetrievalResult(
        page=page_name, title=fm.get("title", page_name),
        area=fm.get("area", "unknown"), status=fm.get("status", "stub"),
        score=score, matched_sections=sections, snippet=_snippet(page_name, idx),
        via=via,
    )


def _neighbors(page_name: str, idx: RetrievalIndex) -> list[str]:
    p = idx.pages.get(page_name)
    if not p:
        return []
    out: list[str] = []
    for link in (p["related"] + p["prereqs"] + p["wikilinks"]):
        canon = idx.resolver.get(link.lower())
        if canon and canon != page_name and not idx.pages.get(canon, {}).get("is_meta"):
            if canon not in out:
                out.append(canon)
    return out


def search(query: str, top_n: int | None = None, expand_graph: bool = True,
           candidate_k: int | None = None) -> list[RetrievalResult]:
    top_n = top_n or config.RETRIEVAL_TOP_N
    candidate_k = candidate_k or config.RETRIEVAL_TOP_K
    idx = get_index()
    if idx.embeddings is None or idx.bm25 is None:
        return _keyword_search(query, top_n, idx)

    # 1. dense + 2. sparse
    qv = _embed([query], is_query=True)[0]
    dense = idx.embeddings @ qv
    dense_rank = np.argsort(-dense)[:candidate_k].tolist()
    sparse = idx.bm25.get_scores(_tokenize(query))
    sparse_rank = np.argsort(-sparse)[:candidate_k].tolist()

    # 3. fuse
    fused = _rrf([dense_rank, sparse_rank])
    fused_idx = sorted(fused, key=lambda i: -fused[i])[:candidate_k]
    if not fused_idx:
        return _keyword_search(query, top_n, idx)

    # 4. rerank
    rr = np.asarray(
        _reranker.predict([(query, idx.chunks[i].embed_text) for i in fused_idx]),
        dtype=float,
    )
    order = np.argsort(-rr)

    # 5. aggregate chunks -> pages (best chunk wins; collect matched sections)
    page_best: dict[str, float] = {}
    page_secs: dict[str, list[str]] = {}
    for o in order:
        c = idx.chunks[fused_idx[o]]
        if c.page not in page_best:
            page_best[c.page] = float(rr[o])
            page_secs[c.page] = []
        if c.section and c.section not in page_secs[c.page]:
            page_secs[c.page].append(c.section)
    top_pages = sorted(page_best, key=lambda p: -page_best[p])[:top_n]

    # 6. graph expansion (1-hop neighbours of the top pages)
    results, seen = [], set()
    for p in top_pages:
        results.append(_mk_result(p, page_best[p], page_secs[p], "retrieval", idx))
        seen.add(p)
    if expand_graph:
        budget = top_n
        for p in top_pages:
            if budget <= 0:
                break
            for nb in _neighbors(p, idx):
                if nb not in seen and budget > 0:
                    results.append(_mk_result(nb, 0.0, [], "graph", idx))
                    seen.add(nb)
                    budget -= 1
    return results


def _keyword_search(query: str, top_n: int, idx: RetrievalIndex) -> list[RetrievalResult]:
    """Model-free fallback: token overlap on title + body."""
    q = set(_tokenize(query))
    scored = []
    for name, p in idx.pages.items():
        if p["is_meta"]:
            continue
        fm = p["frontmatter"]
        title = fm.get("title", name)
        toks = set(_tokenize(title + " " + p["body"][:1200]))
        if not toks:
            continue
        overlap = len(q & toks) / max(1, len(q))
        if title.lower() in query.lower():
            overlap += 0.5
        if overlap > 0:
            scored.append((overlap, name))
    scored.sort(reverse=True)
    return [_mk_result(n, s, [], "retrieval", idx) for s, n in scored[:top_n]]


# ── Context assembly for the LLM ─────────────────────────────────────────────
def build_context_block(results: list[RetrievalResult], max_chars: int = 9000) -> str:
    idx = get_index()
    parts, remaining = [], max_chars
    for r in results:
        body = idx.pages.get(r.page, {}).get("body", "")
        excerpt = body[: min(len(body), remaining)]
        remaining -= len(excerpt)
        parts.append(f"--- [[{r.title}]] ({r.area}/{r.status}) ---\n{excerpt}")
        if remaining <= 0:
            break
    return "\n\n".join(parts) if parts else "(No matching vault pages found.)"


def warm() -> None:
    """Preload models + index (call at server startup)."""
    _load_models()
    get_index()


if __name__ == "__main__":
    import sys
    t0 = time.time()
    ix = build_index()
    print(f"Index: {len(ix.chunks)} chunks from {len(ix.pages)} pages "
          f"| models={'on' if ix.embeddings is not None else 'OFF (keyword)'} "
          f"| {time.time() - t0:.1f}s")
    q = " ".join(sys.argv[1:]) or "leader election"
    print(f"\nQuery: {q!r}")
    for r in search(q):
        secs = ", ".join(r.matched_sections[:2])
        print(f"  [{r.via:9}] {r.score:6.3f}  {r.title:42} ({r.area})  {secs}")

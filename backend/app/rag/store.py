"""Hybrid retrieval: BM25 lexical ranking + dense vectors, fused with reciprocal-rank fusion (RRF).

The default embedder is a dependency-free character n-gram hashing embedder so everything runs with zero downloads.
Swap in a multilingual sentence-transformer by implementing `embed(text) -> list[float]`; point the dense side at Qdrant
with `QdrantDense` for production scale."""
from __future__ import annotations

import math
import unicodedata
import uuid
import zlib
from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class Chunk:
    id: str
    text: str
    source: str = "seed"
    license: str = ""
    lang: str = "en"
    headword: str = ""


@dataclass
class Hit:
    chunk: Chunk
    score: float  # fused RRF score
    confidence: float  # 0..1 heuristic: best of dense cosine and saturated BM25
    lexical_rank: int | None = None
    dense_rank: int | None = None


def tokenize(text: str) -> list[str]:
    """Split on anything that is not a letter, combining mark or digit (keeps Indic scripts intact)."""
    out, cur = [], []
    for ch in unicodedata.normalize("NFC", text.lower()):
        if unicodedata.category(ch)[0] in "LMN":
            cur.append(ch)
        elif cur:
            out.append("".join(cur))
            cur = []
    if cur:
        out.append("".join(cur))
    return out


class Embedder(Protocol):
    dim: int

    def embed(self, text: str) -> list[float]: ...


class HashingEmbedder:
    def __init__(self, dim: int = 512):
        self.dim = dim

    def embed(self, text: str) -> list[float]:
        v = [0.0] * self.dim
        for tok in tokenize(text):
            padded = f"‹{tok}›"
            grams = [padded[i : i + 3] for i in range(max(1, len(padded) - 2))]
            for g in grams:
                h = zlib.crc32(g.encode("utf-8"))
                v[h % self.dim] += 1.0 if (h >> 16) & 1 else -1.0
        norm = math.sqrt(sum(x * x for x in v)) or 1.0
        return [x / norm for x in v]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


class BM25:
    def __init__(self, docs: list[list[str]], k1: float = 1.5, b: float = 0.75):
        self.docs, self.k1, self.b = docs, k1, b
        self.avgdl = (sum(len(d) for d in docs) / len(docs)) if docs else 0.0
        df: dict[str, int] = {}
        for d in docs:
            for t in set(d):
                df[t] = df.get(t, 0) + 1
        n = len(docs)
        self.idf = {t: math.log(1 + (n - c + 0.5) / (c + 0.5)) for t, c in df.items()}

    def scores(self, query: list[str]) -> list[float]:
        out = []
        for d in self.docs:
            tf: dict[str, int] = {}
            for t in d:
                tf[t] = tf.get(t, 0) + 1
            s = 0.0
            for q in query:
                if q in tf:
                    f = tf[q]
                    s += self.idf.get(q, 0.0) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * len(d) / (self.avgdl or 1)))
            out.append(s)
        return out


class DenseBackend(Protocol):
    async def upsert(self, chunks: list[Chunk], vectors: list[list[float]]) -> None: ...
    async def search(self, vector: list[float], k: int) -> list[tuple[str, float]]: ...


class QdrantDense:
    """Dense side served by Qdrant over its REST API. Not exercised by the unit tests (needs a live Qdrant)."""

    def __init__(self, base_url: str, collection: str = "dictionary", dim: int = 512):
        self.base, self.collection, self.dim = base_url.rstrip("/"), collection, dim

    async def _req(self, method: str, path: str, body: dict | None = None) -> dict:
        import httpx

        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.request(method, f"{self.base}{path}", json=body)
            r.raise_for_status()
            return r.json()

    async def ensure(self) -> None:
        try:
            await self._req("GET", f"/collections/{self.collection}")
        except Exception:  # noqa: BLE001 - missing collection: create it
            await self._req("PUT", f"/collections/{self.collection}", {"vectors": {"size": self.dim, "distance": "Cosine"}})

    async def upsert(self, chunks: list[Chunk], vectors: list[list[float]]) -> None:
        await self.ensure()
        points = [
            {"id": str(uuid.uuid5(uuid.NAMESPACE_URL, c.id)), "vector": v, "payload": {"chunk_id": c.id}}
            for c, v in zip(chunks, vectors)
        ]
        await self._req("PUT", f"/collections/{self.collection}/points?wait=true", {"points": points})

    async def search(self, vector: list[float], k: int) -> list[tuple[str, float]]:
        res = await self._req("POST", f"/collections/{self.collection}/points/search", {"vector": vector, "limit": k, "with_payload": True})
        return [(p["payload"]["chunk_id"], float(p["score"])) for p in res.get("result", [])]


@dataclass
class HybridStore:
    embedder: Embedder = field(default_factory=HashingEmbedder)
    dense_backend: DenseBackend | None = None
    chunks: list[Chunk] = field(default_factory=list)
    _vecs: list[list[float]] = field(default_factory=list)
    _bm25: BM25 | None = None
    _tokens: list[list[str]] = field(default_factory=list)

    async def add(self, chunks: list[Chunk]) -> None:
        vecs = [self.embedder.embed(c.text) for c in chunks]
        self.chunks += chunks
        self._vecs += vecs
        self._tokens += [tokenize(c.text + " " + c.headword) for c in chunks]
        self._bm25 = BM25(self._tokens)
        if self.dense_backend:
            await self.dense_backend.upsert(chunks, vecs)

    async def search(self, query: str, k: int = 5, rrf_k: int = 60) -> list[Hit]:
        if not self.chunks or not self._bm25:
            return []
        qtok = tokenize(query)
        lex = self._bm25.scores(qtok)
        qv = self.embedder.embed(query)
        if self.dense_backend:
            by_id = {c.id: i for i, c in enumerate(self.chunks)}
            dense = {by_id[cid]: s for cid, s in await self.dense_backend.search(qv, k * 4) if cid in by_id}
        else:
            dense = {i: cosine(qv, v) for i, v in enumerate(self._vecs)}
        lrank = {i: r for r, i in enumerate(sorted((i for i in range(len(lex)) if lex[i] > 0), key=lambda i: -lex[i]))}
        drank = {i: r for r, i in enumerate(sorted(dense, key=lambda i: -dense[i]))}
        hits: list[Hit] = []
        for i in set(lrank) | {i for i in drank if dense[i] > 0.1}:
            fused = (1 / (rrf_k + lrank[i] + 1) if i in lrank else 0.0) + (1 / (rrf_k + drank[i] + 1) if i in drank else 0.0)
            conf = max(dense.get(i, 0.0), lex[i] / (lex[i] + 4.0))
            hits.append(Hit(self.chunks[i], fused, max(0.0, min(1.0, conf)), lrank.get(i), drank.get(i)))
        hits.sort(key=lambda h: -h.score)
        return hits[:k]

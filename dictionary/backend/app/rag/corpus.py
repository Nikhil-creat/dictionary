"""Seed corpus: curated names + a small authored word list. Replace/extend with Wiktionary or WordNet dumps
(keep one Chunk per sense with a stable id and licence so answers can cite it)."""
from __future__ import annotations

import json
from pathlib import Path

from .store import Chunk, HybridStore

DATA = Path(__file__).resolve().parents[2] / "data"


def load_chunks() -> list[Chunk]:
    chunks: list[Chunk] = []
    for n in json.loads((DATA / "names.json").read_text(encoding="utf-8")):
        scripts = ", ".join(f"{k}: {v}" for k, v in n.get("scripts", {}).items())
        text = (
            f"{n['t']} (personal name). Origin: {n['origin']}. Family: {n.get('fam', '')}. Meaning: {n['en']}. "
            f"Confidence: {n.get('conf', 'likely')}. {n.get('note', '')} Written forms: {scripts}."
        )
        chunks.append(Chunk(id=f"n:{n['key']}", text=text, source="curated-names", license="project-authored", lang="und", headword=n["t"]))
    for line in (DATA / "seed_words.jsonl").read_text(encoding="utf-8").splitlines():
        if line.strip():
            d = json.loads(line)
            chunks.append(Chunk(id=d["id"], text=d["text"], source=d["source"], license=d["license"], lang=d["lang"], headword=d["headword"]))
    return chunks


async def build_store(dense_backend=None) -> HybridStore:
    store = HybridStore(dense_backend=dense_backend)
    await store.add(load_chunks())
    return store

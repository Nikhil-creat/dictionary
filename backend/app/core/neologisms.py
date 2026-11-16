"""Community neo-word pipeline: automated spam/toxicity screening, then community upvotes before publication."""
from __future__ import annotations

import asyncio
import itertools
import re
from dataclasses import asdict, dataclass, field
from typing import Awaitable, Callable

from .security import sanitize

PUBLISH_AT = 5  # upvotes needed after passing automated screening


@dataclass
class Neologism:
    id: int
    word: str
    definition: str
    example: str
    author: str
    status: str  # pending | rejected | published
    reason: str = ""
    votes: set[str] = field(default_factory=set)

    def public(self) -> dict:
        d = asdict(self)
        d["votes"] = len(self.votes)
        d.pop("author", None)
        return d


def heuristic_screen(word: str, definition: str, example: str = "") -> tuple[bool, str]:
    text = f"{word} {definition} {example}"
    if len(re.findall(r"https?://|www\.", text, re.I)) > 0:
        return False, "links are not allowed"
    if re.search(r"(.)\1{5,}", text):
        return False, "repeated characters look like spam"
    letters = [c for c in text if c.isalpha()]
    if len(letters) > 12 and sum(c.isupper() for c in letters) / len(letters) > 0.7:
        return False, "excessive capitals"
    if not re.fullmatch(r"[^\W\d_][\w'\- ]{1,39}", word, re.UNICODE):
        return False, "the word must be 2-40 letters"
    if len(definition) < 10:
        return False, "definition is too short"
    return True, ""


Judge = Callable[[str], Awaitable[bool]]  # returns True when the text is acceptable


class NeologismService:
    def __init__(self, judge: Judge | None = None):
        self._items: dict[int, Neologism] = {}
        self._ids = itertools.count(1)
        self._judge = judge
        self._lock = asyncio.Lock()

    async def submit(self, author: str, word: str, definition: str, example: str = "") -> Neologism:
        word, definition, example = sanitize(word, 40), sanitize(definition, 300), sanitize(example, 200)
        ok, reason = heuristic_screen(word, definition, example)
        if ok and self._judge is not None:
            try:
                ok = await self._judge(f"{word}: {definition} {example}")
                reason = "" if ok else "flagged by the automated toxicity screen"
            except Exception:  # noqa: BLE001 - if the judge is unavailable, fail closed to human review (stay pending, never auto-publish)
                ok, reason = True, ""
        async with self._lock:
            n = Neologism(next(self._ids), word, definition, example, author, "pending" if ok else "rejected", reason)
            self._items[n.id] = n
            return n

    async def upvote(self, voter: str, nid: int) -> Neologism:
        async with self._lock:
            n = self._items.get(nid)
            if n is None or n.status == "rejected":
                raise KeyError(nid)
            if voter == n.author:
                raise PermissionError("authors cannot upvote their own entry")
            n.votes.add(voter)
            if n.status == "pending" and len(n.votes) >= PUBLISH_AT:
                n.status = "published"
            return n

    def published(self) -> list[dict]:
        return [n.public() for n in self._items.values() if n.status == "published"]

    def pending(self) -> list[dict]:
        return [n.public() for n in self._items.values() if n.status == "pending"]

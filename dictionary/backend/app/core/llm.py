"""Dual-provider LLM router: Groq first (latency), Gemini on failure/long context, with runtime model auto-detection
and a per-provider circuit breaker (exponential backoff with jitter). No model names are hard-coded."""
from __future__ import annotations

import asyncio
import random
import re
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

GROQ_BASE = "https://api.groq.com/openai/v1"
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"

Transport = Callable[[str, str, dict, Any], Awaitable[tuple[int, dict, Any]]]


async def httpx_transport(method: str, url: str, headers: dict, body: Any) -> tuple[int, dict, Any]:
    import httpx  # imported lazily so the pure logic stays testable without it

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.request(method, url, headers=headers, json=body)
        try:
            data = r.json()
        except ValueError:
            data = None
        return r.status_code, {k.lower(): v for k, v in r.headers.items()}, data


class LLMError(Exception):
    def __init__(self, message: str, status: int = 0, retry_after: float = 0.0):
        super().__init__(message)
        self.status, self.retry_after = status, retry_after


@dataclass
class Breaker:
    until: float = 0.0
    fails: int = 0


@dataclass
class LLMResult:
    text: str
    provider: str


def choose_groq_model(models: list[dict]) -> str:
    skip = re.compile(r"whisper|guard|tts|playai|orpheus|embed|moderation|safeguard|transcri", re.I)
    cands = [m for m in models if m.get("active", True) is not False and not skip.search(m.get("id", ""))]

    def score(m: dict) -> float:
        mid = m.get("id", "")
        size = re.search(r"(\d+(?:\.\d+)?)b", mid, re.I)
        bonus = 5 if re.search(r"versatile|instant|gpt-oss|llama|qwen|kimi", mid, re.I) else 0
        return (float(size.group(1)) if size else 0.0) + (m.get("context_window") or 0) / 1e5 + bonus

    if not cands:
        raise LLMError("no active Groq chat model")
    return max(cands, key=score)["id"]


def choose_gemini_model(models: list[dict]) -> str:
    skip = re.compile(r"embed|tts|image|live|audio|vision|robotics|computer|learnlm|exp\b", re.I)
    cands = [
        m for m in models
        if "generateContent" in (m.get("supportedGenerationMethods") or []) and re.search("gemini", m.get("name", ""), re.I) and not skip.search(m.get("name", ""))
    ]

    def score(m: dict) -> float:
        name = m["name"]
        v = re.search(r"gemini-(\d+(?:\.\d+)?)", name)
        s = (float(v.group(1)) if v else 0.0) * 100
        s += 30 if re.search("flash", name, re.I) else 10 if re.search("pro", name, re.I) else 0
        s -= 20 if re.search("lite", name, re.I) else 0
        s -= 5 if re.search("preview", name, re.I) else 0
        return s

    if not cands:
        raise LLMError("no Gemini generateContent model")
    return max(cands, key=score)["name"].removeprefix("models/")


@dataclass
class LLMRouter:
    groq_key: str = ""
    gemini_key: str = ""
    transport: Transport = httpx_transport
    clock: Callable[[], float] = time.monotonic
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep
    rand: Callable[[], float] = random.random
    models: dict[str, str] = field(default_factory=lambda: {"groq": "", "gemini": ""})
    breakers: dict[str, Breaker] = field(default_factory=lambda: {"groq": Breaker(), "gemini": Breaker()})

    def _key(self, p: str) -> str:
        return self.groq_key if p == "groq" else self.gemini_key

    @property
    def available(self) -> bool:
        return bool(self.groq_key or self.gemini_key)

    async def detect(self, provider: str) -> str:
        if provider == "groq":
            status, _, data = await self.transport("GET", f"{GROQ_BASE}/models", {"Authorization": f"Bearer {self.groq_key}"}, None)
            if status != 200:
                raise LLMError(f"Groq model list failed ({status})", status)
            return choose_groq_model((data or {}).get("data", []))
        status, _, data = await self.transport("GET", f"{GEMINI_BASE}/models?pageSize=200", {"x-goog-api-key": self.gemini_key}, None)
        if status != 200:
            raise LLMError(f"Gemini model list failed ({status})", status)
        return choose_gemini_model((data or {}).get("models", []))

    async def detect_all(self) -> dict[str, str]:
        for p in ("groq", "gemini"):
            if not self._key(p):
                self.models[p] = ""
                continue
            try:
                self.models[p] = await self.detect(p)
            except LLMError:
                self.models[p] = ""
        return dict(self.models)

    async def _call(self, p: str, system: str, messages: list[dict], json_mode: bool) -> str:
        if p == "groq":
            body = {"model": self.models["groq"], "temperature": 0.3, "max_tokens": 900, "messages": [{"role": "system", "content": system}, *messages]}
            status, headers, data = await self.transport("POST", f"{GROQ_BASE}/chat/completions", {"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"}, body)
            if status != 200:
                raise LLMError(f"Groq {status}", status, float(headers.get("retry-after", 0) or 0))
            return ((data or {}).get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        cfg: dict[str, Any] = {"temperature": 0.3, "maxOutputTokens": 1400}
        if json_mode:
            cfg["responseMimeType"] = "application/json"
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]} for m in messages],
            "generationConfig": cfg,
        }
        url = f"{GEMINI_BASE}/models/{self.models['gemini']}:generateContent"
        status, headers, data = await self.transport("POST", url, {"x-goog-api-key": self.gemini_key, "Content-Type": "application/json"}, body)
        if status != 200:
            raise LLMError(f"Gemini {status}", status, float(headers.get("retry-after", 0) or 0))
        parts = (((data or {}).get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
        return "".join(p.get("text", "") for p in parts)

    async def complete(self, system: str, messages: list[dict], *, long: bool = False, json_mode: bool = False) -> LLMResult:
        order = ["gemini", "groq"] if long else ["groq", "gemini"]
        last: Exception | None = None
        for p in order:
            if not self._key(p) or self.clock() < self.breakers[p].until:
                continue
            if not self.models[p]:
                try:
                    self.models[p] = await self.detect(p)
                except LLMError as e:
                    last = e
                    continue
            b = self.breakers[p]
            for attempt in range(2):
                try:
                    text = await self._call(p, system, messages, json_mode)
                    b.fails = 0
                    return LLMResult(text, p)
                except LLMError as e:
                    last = e
                    if e.status == 429:  # rate limited: open the breaker, honour Retry-After, move to the other provider
                        b.fails += 1
                        b.until = self.clock() + max(e.retry_after, min(300.0, 15.0 * 2 ** b.fails))
                        break
                    if (e.status >= 500 or e.status == 0) and attempt == 0:
                        await self.sleep(0.6 + self.rand() * 0.4)  # backoff with jitter, one retry
                        continue
                    if e.status >= 500 or e.status == 0:
                        b.fails += 1
                        b.until = self.clock() + min(300.0, 10.0 * 2 ** b.fails)
                    break
        raise last or LLMError("no LLM provider configured")

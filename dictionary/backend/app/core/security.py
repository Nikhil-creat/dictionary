"""Input sanitisation, prompt-injection screening, role-based access and sliding-window rate limiting."""
from __future__ import annotations

import hmac
import re
import time
import unicodedata
from collections import defaultdict, deque

# Control characters (except \t \n \r) plus zero-width and bidi-override characters.
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f​-‏‪-‮⁦-⁩]")
_INJECTION = re.compile(
    r"ignore (all |any )?(previous|prior|above) (instructions|prompts)"
    r"|disregard .{0,30}(instructions|rules)"
    r"|you are now\b"
    r"|reveal .{0,20}system prompt"
    r"|<\|.*?\|>"
    r"|</?(context|user_query|system)>",
    re.IGNORECASE | re.DOTALL,
)


def sanitize(text: object, max_len: int = 500) -> str:
    """Normalise user text so it cannot forge our prompt delimiters or smuggle control characters."""
    t = unicodedata.normalize("NFC", str(text or ""))
    t = _CONTROL.sub(" ", t)
    t = t.replace("<", "‹").replace(">", "›")  # angle brackets -> look-alike quotes: tags can't be forged
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()[:max_len]


def wrap_user(text: object, max_len: int = 500) -> str:
    return f"<user_query>{sanitize(text, max_len)}</user_query>"


def chunk_is_safe(text: str) -> bool:
    """Retrieved passages are untrusted too: drop any that look like instructions to the model."""
    return not _INJECTION.search(text or "")


ROLES = ("guest", "user", "moderator", "admin")
_RANK = {r: i for i, r in enumerate(ROLES)}
TIER_LIMITS = {"guest": 30, "user": 120, "moderator": 300, "admin": 600}  # requests per minute


def role_at_least(role: str, needed: str) -> bool:
    return _RANK.get(role, -1) >= _RANK[needed]


class Auth:
    """Maps API keys to roles. No key means guest; a wrong key is rejected (never silently downgraded)."""

    def __init__(self, keys: dict[str, str]):
        self._keys = {k: (v if v in _RANK else "user") for k, v in keys.items() if len(k) >= 16}

    def role_for(self, api_key: str | None) -> str:
        if not api_key:
            return "guest"
        found = None
        for k, role in self._keys.items():  # compare against every key: constant-time per comparison
            if hmac.compare_digest(k.encode(), api_key.encode()):
                found = role
        if found is None:
            raise PermissionError("invalid API key")
        return found


class MemoryLimiter:
    """Sliding-window log limiter (single process)."""

    def __init__(self, clock=time.monotonic):
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._clock = clock

    async def allow(self, key: str, limit: int, window: float = 60.0) -> tuple[bool, float]:
        now = self._clock()
        q = self._hits[key]
        while q and q[0] <= now - window:
            q.popleft()
        if len(q) >= limit:
            return False, max(0.0, q[0] + window - now)
        q.append(now)
        return True, 0.0


class RedisLimiter:
    """Sliding-window limiter on a Redis sorted set, shared across API replicas."""

    def __init__(self, client, clock=time.time):
        self._r = client
        self._clock = clock

    async def allow(self, key: str, limit: int, window: float = 60.0) -> tuple[bool, float]:
        now = self._clock()
        k = f"rl:{key}"
        pipe = self._r.pipeline()
        pipe.zremrangebyscore(k, 0, now - window)
        pipe.zcard(k)
        _, count = await pipe.execute()
        if count >= limit:
            oldest = await self._r.zrange(k, 0, 0, withscores=True)
            retry = (oldest[0][1] + window - now) if oldest else window
            return False, max(0.0, retry)
        pipe = self._r.pipeline()
        pipe.zadd(k, {f"{now}:{id(object())}": now})
        pipe.expire(k, int(window) + 1)
        await pipe.execute()
        return True, 0.0


async def build_limiter(redis_url: str):
    """Use Redis when reachable, otherwise fall back to the in-process limiter."""
    if redis_url:
        try:
            import redis.asyncio as aioredis  # type: ignore

            client = aioredis.from_url(redis_url, decode_responses=True)
            await client.ping()
            return RedisLimiter(client)
        except Exception:  # noqa: BLE001 - any failure means "run without Redis"
            pass
    return MemoryLimiter()

"""Runtime settings, read once from environment variables (never from client input)."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field


def _csv(value: str) -> list[str]:
    return [x.strip() for x in value.split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    groq_api_key: str = ""
    gemini_api_key: str = ""
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:3000"])
    api_keys: dict[str, str] = field(default_factory=dict)  # api key -> role
    redis_url: str = ""
    database_url: str = ""
    qdrant_url: str = ""
    vision_url: str = ""
    grounding_threshold: float = 0.35
    max_upload_bytes: int = 5 * 1024 * 1024

    @classmethod
    def from_env(cls) -> "Settings":
        try:
            keys = json.loads(os.getenv("API_KEYS", "{}") or "{}")
            if not isinstance(keys, dict):
                keys = {}
        except json.JSONDecodeError:
            keys = {}
        return cls(
            groq_api_key=os.getenv("GROQ_API_KEY", ""),
            gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
            cors_origins=_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000")),
            api_keys={str(k): str(v) for k, v in keys.items()},
            redis_url=os.getenv("REDIS_URL", ""),
            database_url=os.getenv("DATABASE_URL", ""),
            qdrant_url=os.getenv("QDRANT_URL", ""),
            vision_url=os.getenv("VISION_URL", ""),
            grounding_threshold=float(os.getenv("GROUNDING_THRESHOLD", "0.35")),
        )

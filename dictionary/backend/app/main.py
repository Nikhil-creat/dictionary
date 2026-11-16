"""FastAPI gateway: auth, RBAC, rate limiting, security headers, and the agent / RAG / vision endpoints."""
from __future__ import annotations

import functools
import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .agents import pipeline
from .core.config import Settings
from .core.llm import LLMError, LLMRouter
from .core.neologisms import NeologismService
from .core.security import TIER_LIMITS, Auth, build_limiter, role_at_least, sanitize
from .rag.corpus import DATA, build_store
from .rag.store import QdrantDense

MAX_BODY = 64 * 1024


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    context: str = Field(default="", max_length=8000)
    long: bool = False


class WordIn(BaseModel):
    word: str = Field(min_length=1, max_length=60)


class NameIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)


class NeoIn(BaseModel):
    word: str = Field(min_length=2, max_length=40)
    definition: str = Field(min_length=10, max_length=300)
    example: str = Field(default="", max_length=200)


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = Settings.from_env()
    app.state.settings = s
    app.state.auth = Auth(s.api_keys)
    app.state.limiter = await build_limiter(s.redis_url)
    app.state.llm = LLMRouter(groq_key=s.groq_api_key, gemini_key=s.gemini_api_key)
    if app.state.llm.available:
        await app.state.llm.detect_all()
    dense = QdrantDense(s.qdrant_url) if s.qdrant_url else None
    try:
        app.state.store = await build_store(dense)
    except Exception:  # noqa: BLE001 - Qdrant unreachable at boot: fall back to in-memory dense vectors
        app.state.store = await build_store(None)

    async def judge(text: str) -> bool:
        r = await app.state.llm.complete(
            "You are a content moderator. Reply with exactly OK if the text is acceptable slang or a new word, or REJECT if it contains hate, harassment or spam.",
            [{"role": "user", "content": f"<user_query>{sanitize(text, 400)}</user_query>"}],
        )
        return r.text.strip().upper().startswith("OK")

    app.state.neo = NeologismService(judge if app.state.llm.available else None)
    app.state.names = {n["key"] for n in json.loads((DATA / "names.json").read_text(encoding="utf-8"))}
    yield


app = FastAPI(title="Dictionary API", version="1.0.0", lifespan=lifespan, docs_url=None, redoc_url=None)
_origins = Settings.from_env().cors_origins
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-API-Key"], max_age=600)


@app.middleware("http")
async def harden(request: Request, call_next):
    if int(request.headers.get("content-length") or 0) > (request.app.state.settings.max_upload_bytes if request.url.path.startswith("/api/vision") else MAX_BODY):
        return JSONResponse({"detail": "request too large"}, status_code=413)
    resp = await call_next(request)
    resp.headers.update({"X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store", "Cross-Origin-Resource-Policy": "same-site"})
    return resp


async def caller(request: Request) -> str:
    """Authenticate (X-API-Key) and rate-limit per role tier + client IP. Returns the caller's role."""
    try:
        role = request.app.state.auth.role_for(request.headers.get("x-api-key"))
    except PermissionError:
        raise HTTPException(401, "invalid API key")
    ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?"))
    ok, retry = await request.app.state.limiter.allow(f"{role}:{ip}", TIER_LIMITS[role])
    if not ok:
        raise HTTPException(429, detail={"message": "rate limit exceeded"}, headers={"Retry-After": str(int(retry) + 1)})
    request.state.role, request.state.who = role, f"{role}:{ip}"
    return role


def need(role: str, minimum: str) -> None:
    if not role_at_least(role, minimum):
        raise HTTPException(403, f"requires role {minimum}")


def llm_guard(fn):
    @functools.wraps(fn)  # keeps the endpoint signature visible to FastAPI
    async def wrapper(*a, **kw):
        try:
            return await fn(*a, **kw)
        except LLMError as e:
            raise HTTPException(503 if not e.status else 502, detail={"message": f"language model unavailable: {e}"})

    return wrapper


def pctx(request: Request) -> pipeline.Ctx:
    return pipeline.Ctx(request.app.state.llm, request.app.state.store, request.app.state.settings.grounding_threshold)


@app.get("/health")
async def health(request: Request):
    llm = request.app.state.llm
    return {"status": "ok", "models": llm.models, "corpus_chunks": len(request.app.state.store.chunks)}


@app.get("/api/lookup/{word}")
async def lookup(word: str, request: Request, role: str = Depends(caller)):
    hits = await request.app.state.store.search(sanitize(word, 60), k=3)
    return {"query": sanitize(word, 60), "hits": [{"id": h.chunk.id, "text": h.chunk.text, "source": h.chunk.source, "license": h.chunk.license, "confidence": round(h.confidence, 3)} for h in hits]}


@app.post("/api/chat")
@llm_guard
async def chat(body: ChatIn, request: Request, role: str = Depends(caller)):
    st = pipeline.State("chat", sanitize(body.message.removeprefix("/deep").strip() or body.message), context=body.context, long=body.long or body.message.startswith("/deep"))
    return pipeline.to_response(await _finish(request, st))


@app.post("/api/agents/word")
@llm_guard
async def agent_word(body: WordIn, request: Request, role: str = Depends(caller)):
    return pipeline.to_response(await _finish(request, pipeline.State("word", sanitize(body.word, 60))))


@app.post("/api/agents/name")
@llm_guard
async def agent_name(body: NameIn, request: Request, role: str = Depends(caller)):
    return pipeline.to_response(await _finish(request, pipeline.State("name", sanitize(body.name, 60))))


async def _finish(request: Request, st: pipeline.State) -> pipeline.State:
    done = await pipeline.run(st, pctx(request))
    if done.error and not (done.text or done.draft):
        raise LLMError(done.error)
    return done


@app.post("/api/ask")
@llm_guard
async def ask(body: ChatIn, request: Request, role: str = Depends(caller)):
    kind = pipeline.classify(body.message, request.app.state.names)
    if kind == "vision":
        raise HTTPException(400, "send images to /api/vision/*")
    st = pipeline.State(kind, sanitize(body.message, 60 if kind != "chat" else 500), context=body.context, long=body.long)
    return {"route": kind, **pipeline.to_response(await _finish(request, st))}


async def _vision(request: Request, file: UploadFile, path: str):
    url = request.app.state.settings.vision_url
    if not url:
        raise HTTPException(501, "vision service not configured")
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(415, "unsupported image type")
    data = await file.read(request.app.state.settings.max_upload_bytes + 1)
    if len(data) > request.app.state.settings.max_upload_bytes:
        raise HTTPException(413, "image too large")
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as c:  # image bytes are forwarded from memory and never written anywhere
        r = await c.post(f"{url}{path}", files={"file": ("frame", data, file.content_type)})
    del data
    if r.status_code != 200:
        raise HTTPException(502, "vision service error")
    return r.json()


@app.post("/api/vision/ocr")
async def vision_ocr(request: Request, file: UploadFile = File(...), role: str = Depends(caller)):
    return await _vision(request, file, "/ocr")


@app.post("/api/vision/classify")
async def vision_classify(request: Request, file: UploadFile = File(...), role: str = Depends(caller)):
    return await _vision(request, file, "/classify")


@app.get("/api/neologisms")
async def neo_list(request: Request, role: str = Depends(caller)):
    return {"published": request.app.state.neo.published()}


@app.get("/api/neologisms/pending")
async def neo_pending(request: Request, role: str = Depends(caller)):
    need(role, "moderator")
    return {"pending": request.app.state.neo.pending()}


@app.post("/api/neologisms", status_code=201)
async def neo_submit(body: NeoIn, request: Request, role: str = Depends(caller)):
    need(role, "user")
    n = await request.app.state.neo.submit(request.state.who, body.word, body.definition, body.example)
    return n.public()


@app.post("/api/neologisms/{nid}/upvote")
async def neo_vote(nid: int, request: Request, role: str = Depends(caller)):
    need(role, "user")
    try:
        return (await request.app.state.neo.upvote(request.state.who, nid)).public()
    except KeyError:
        raise HTTPException(404, "not found")
    except PermissionError as e:
        raise HTTPException(403, str(e))

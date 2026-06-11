import asyncio
from typing import Any

import google.generativeai as genai
from fastapi import APIRouter

from app.config import settings
from app.db.neo4j_client import get_driver

router = APIRouter(prefix="/health", tags=["health"])

_PLACEHOLDER_KEY = "paste-your-actual-gemini-api-key-here"


@router.get(
    "/neo4j",
    summary="Check Neo4j connectivity with a lightweight ping query",
)
async def health_neo4j() -> dict[str, Any]:
    try:
        async with get_driver().session() as session:
            result = await session.run("RETURN 1 AS ping")
            record = await result.single()
        if record and record["ping"] == 1:
            return {"status": "ok", "message": "Neo4j is reachable"}
        return {"status": "error", "message": "Unexpected response from Neo4j"}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


@router.get(
    "/llm",
    summary="Check Gemini API connectivity by listing available models",
)
async def health_llm() -> dict[str, Any]:
    if not settings.google_api_key or settings.google_api_key == _PLACEHOLDER_KEY:
        return {"status": "error", "message": "GOOGLE_API_KEY is not configured"}
    try:
        genai.configure(api_key=settings.google_api_key)
        models = await asyncio.to_thread(lambda: list(genai.list_models()))
        return {
            "status": "ok",
            "message": f"Gemini API reachable — {len(models)} model(s) available",
        }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}

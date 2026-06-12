import asyncio
import json
import logging
from typing import Any, Type, TypeVar

import google.generativeai as genai
from pydantic import BaseModel, ValidationError

from app.config import settings
from app.llm.base import LLMProvider

T = TypeVar("T", bound=BaseModel)
log = logging.getLogger(__name__)

# Cap concurrent Gemini calls across the whole process to respect free-tier limits.
_gemini_semaphore = asyncio.Semaphore(2)

_RETRY_SYSTEM_PROMPT = (
    "You are a JSON correction assistant. Return only valid JSON matching the provided schema."
)

_RATE_LIMIT_MSG = (
    "Gemini API rate limit reached. Free tier allows limited requests per minute. "
    "Wait 60 seconds and try again, or upgrade to a paid Gemini tier at "
    "https://aistudio.google.com/."
)


class RateLimitError(Exception):
    """Raised when the Gemini API returns a rate-limit or quota error."""


def _raise_if_rate_limited(exc: Exception) -> None:
    """Re-raise exc as RateLimitError if the message indicates a rate or quota error."""
    if "rate" in str(exc).lower() or "quota" in str(exc).lower():
        raise RateLimitError(_RATE_LIMIT_MSG) from exc


class GeminiProvider(LLMProvider):
    def __init__(self, model: str = "gemini-2.5-flash"):
        if not settings.google_api_key:
            raise RuntimeError("GOOGLE_API_KEY is not set")
        genai.configure(api_key=settings.google_api_key)
        self._model_name = model
        self._client = genai.GenerativeModel(model)

    @property
    def model_name(self) -> str:
        return self._model_name

    async def _generate(self, prompt: str, generation_config: dict) -> Any:
        """Call generate_content_async, re-raising rate-limit errors with a clear message."""
        try:
            async with _gemini_semaphore:
                return await self._client.generate_content_async(
                    prompt,
                    generation_config=generation_config,
                )
        except Exception as exc:
            _raise_if_rate_limited(exc)
            raise

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> T:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "response_mime_type": "application/json",
            "response_schema": schema,
        }

        response = await self._generate(full_prompt, generation_config)

        # First attempt at validation
        try:
            return schema.model_validate_json(response.text)
        except ValidationError as e:
            raw_len = len(response.text)
            raw_preview = response.text[:500]
            log.warning(
                "Schema validation failed on first attempt for %s (%s) — "
                "%d error(s); raw_response_length=%d chars\n"
                "Validation errors:\n%s\n"
                "Raw response preview (first 500 chars):\n%r",
                schema.__name__,
                type(e).__name__,
                len(e.errors()),
                raw_len,
                json.dumps(e.errors(), indent=2),
                raw_preview,
            )
            structured_errors = json.dumps(e.errors(), indent=2)

        # Focused retry — does NOT re-send the full original task.
        # Keeps the retry prompt short so output budget stays near max_tokens.
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        if len(schema_json) > 3000:
            schema_json = schema_json[:3000] + "\n... (truncated)"

        retry_user_prompt = (
            "You previously generated a JSON response that failed schema validation.\n\n"
            f"Validation errors:\n{structured_errors}\n\n"
            f"Required schema:\n{schema_json}\n\n"
            f"Your previous response (first 2000 chars):\n{response.text[:2000]}\n\n"
            "Return ONLY the corrected JSON. Do not include any explanation, "
            "markdown, or text outside the JSON."
        )
        retry_full_prompt = f"{_RETRY_SYSTEM_PROMPT}\n\n{retry_user_prompt}"

        retry_response = await self._generate(retry_full_prompt, generation_config)

        return schema.model_validate_json(retry_response.text)

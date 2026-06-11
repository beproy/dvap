"""Tests for GeminiProvider retry behavior — no real API calls are made."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import BaseModel, ValidationError

from app.llm.gemini import GeminiProvider


class _Output(BaseModel):
    value: int
    label: str


_VALID_JSON = '{"value": 42, "label": "hello"}'
# Missing required "value" — guaranteed to fail Pydantic validation.
_INVALID_JSON = '{"label": "hello"}'


def _mock_response(text: str) -> MagicMock:
    r = MagicMock()
    r.text = text
    return r


def _build_provider(mock_model: MagicMock) -> GeminiProvider:
    """Construct a GeminiProvider with the Gemini client replaced by mock_model."""
    with (
        patch("app.llm.gemini.genai.configure"),
        patch("app.llm.gemini.genai.GenerativeModel", return_value=mock_model),
        patch("app.llm.gemini.settings") as mock_settings,
    ):
        mock_settings.google_api_key = "fake-key"
        return GeminiProvider()


async def test_retry_succeeds_on_validation_failure():
    """First call returns invalid JSON; retry returns valid JSON. Provider returns parsed result."""
    mock_model = MagicMock()
    mock_model.generate_content_async = AsyncMock(
        side_effect=[
            _mock_response(_INVALID_JSON),
            _mock_response(_VALID_JSON),
        ]
    )

    provider = _build_provider(mock_model)
    result = await provider.generate_structured(
        system_prompt="sys",
        user_prompt="user",
        schema=_Output,
        max_tokens=512,
    )

    assert result == _Output(value=42, label="hello")
    assert mock_model.generate_content_async.call_count == 2


async def test_retry_fails_cleanly_on_second_failure():
    """Both calls return invalid JSON. ValidationError raised after exactly one retry."""
    mock_model = MagicMock()
    mock_model.generate_content_async = AsyncMock(
        side_effect=[
            _mock_response(_INVALID_JSON),
            _mock_response(_INVALID_JSON),
        ]
    )

    provider = _build_provider(mock_model)
    with pytest.raises(ValidationError):
        await provider.generate_structured(
            system_prompt="sys",
            user_prompt="user",
            schema=_Output,
            max_tokens=512,
        )

    assert mock_model.generate_content_async.call_count == 2


async def test_no_retry_when_first_call_succeeds():
    """First call returns valid JSON. No retry is attempted."""
    mock_model = MagicMock()
    mock_model.generate_content_async = AsyncMock(
        return_value=_mock_response(_VALID_JSON)
    )

    provider = _build_provider(mock_model)
    result = await provider.generate_structured(
        system_prompt="sys",
        user_prompt="user",
        schema=_Output,
        max_tokens=512,
    )

    assert result == _Output(value=42, label="hello")
    assert mock_model.generate_content_async.call_count == 1

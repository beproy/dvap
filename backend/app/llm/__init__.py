from app.llm.base import LLMProvider
from app.llm.gemini import GeminiProvider
from app.config import settings

_provider_instance: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    """Return the configured LLM provider as a singleton."""
    global _provider_instance
    if _provider_instance is None:
        if settings.llm_backend == "gemini":
            _provider_instance = GeminiProvider(model="gemini-2.5-flash")
        else:
            raise ValueError(f"Unsupported LLM backend: {settings.llm_backend}")
    return _provider_instance

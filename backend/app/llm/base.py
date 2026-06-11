from abc import ABC, abstractmethod
from typing import Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMProvider(ABC):
    """Abstract interface for LLM backends.

    All providers must support async structured generation with Pydantic schemas.
    """

    @property
    @abstractmethod
    def model_name(self) -> str: ...

    @abstractmethod
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> T:
        """Generate output conforming to a Pydantic schema.

        Implementations must:
        - Use the provider's native structured-output feature where possible
        - Validate the response against the schema
        - Retry once with error feedback on validation failure
        - Raise on second failure
        """
        ...

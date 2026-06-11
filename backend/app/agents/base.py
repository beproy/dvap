import logging
import time
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

from app.llm.base import LLMProvider

InputT = TypeVar("InputT", bound=BaseModel)
OutputT = TypeVar("OutputT", bound=BaseModel)

log = logging.getLogger(__name__)


class AgentResult(BaseModel, Generic[OutputT]):
    """Wraps an agent's output with execution metadata."""

    model_config = ConfigDict(protected_namespaces=())

    output: OutputT
    duration_seconds: float
    model_used: str


class BaseAgent(ABC, Generic[InputT, OutputT]):
    """Base class for all DVAP specialist agents.

    Each agent:
    - Takes a typed Pydantic input
    - Emits a typed Pydantic output
    - Logs duration and model used
    - Is purely functional (no internal state between runs)
    """

    name: str                        # set as a class attribute on each subclass
    system_prompt: str               # set as a class attribute on each subclass
    output_schema: type[OutputT]     # the Pydantic model the agent returns
    max_tokens: int = 4096           # subclasses can raise this for verbose outputs

    def __init__(self, llm: LLMProvider) -> None:
        self.llm = llm

    @abstractmethod
    def build_user_prompt(self, input_data: InputT) -> str:
        """Construct the user-side prompt from the typed input."""
        ...

    async def run(self, input_data: InputT) -> AgentResult:
        start = time.monotonic()
        user_prompt = self.build_user_prompt(input_data)

        log.info(f"[{self.name}] starting; model={self.llm.model_name}")
        output = await self.llm.generate_structured(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            schema=self.output_schema,
            max_tokens=self.max_tokens,
        )
        duration = time.monotonic() - start
        log.info(f"[{self.name}] completed in {duration:.2f}s")

        return AgentResult(
            output=output,
            duration_seconds=duration,
            model_used=self.llm.model_name,
        )

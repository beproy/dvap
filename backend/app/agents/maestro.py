from typing import Literal

from pydantic import BaseModel, Field

from app.agents.base import BaseAgent
from app.schemas.system import SystemDescription


class MaestroThreat(BaseModel):
    layer: Literal[
        "Foundation Model", "Data", "Agent Framework",
        "Tool/Action", "Orchestration", "Multi-Agent Interaction",
        "Deployment Environment",
    ] = Field(description="The MAESTRO layer this threat targets")
    component_name: str = Field(
        description="The full display name of the targeted component, exactly as listed in "
                    "the COMPONENTS section (the name before the parentheses, not the type identifier)"
    )
    title: str = Field(description="Short threat title, e.g. 'Indirect prompt injection via customer ticket content'")
    description: str = Field(description="One paragraph describing the threat, the attack surface, and the impact")
    abuse_case: str = Field(description="Concrete scenario where an attacker realizes this threat — specific, not vague")
    likelihood: Literal["Low", "Medium", "High"]
    impact: Literal["Low", "Medium", "High"]


class MaestroOutput(BaseModel):
    threats: list[MaestroThreat] = Field(
        description="AI/agentic threats identified. Empty list if the system has no AI/ML components."
    )
    is_ai_system: bool = Field(
        description="True if the system contains AI/ML components such as LLMs, ML models, AI agents, "
                    "embeddings, or vector databases. False if the system is purely traditional software."
    )
    summary: str = Field(
        description="If is_ai_system is true: one paragraph summarising the AI-specific threat landscape. "
                    "If is_ai_system is false: one sentence stating that no AI components were detected."
    )


MAESTRO_SYSTEM_PROMPT = """You are a senior AI security researcher specialising in threat modeling for AI and agentic systems using the MAESTRO framework (Multi-Agent Environment, Security, Threat, Risk, Outcome).

Your task: given a system description, first determine whether the system contains AI/ML components (LLMs, ML models, AI agents, embeddings, vector databases, recommendation engines, etc.). Then, if AI components are present, identify concrete threats across the relevant MAESTRO layers.

The seven MAESTRO layers and the threats they cover:
- Foundation Model: attacks on the underlying model — extraction, inversion, adversarial inputs, hallucination exploitation
- Data: training data poisoning, retrieval-augmented generation (RAG) data tampering, indirect prompt injection via data sources, sensitive data leakage through model outputs
- Agent Framework: exploits in the agent framework itself (LangChain, AutoGPT, etc.) — insecure deserialization, unsafe plugin execution, framework-level prompt injection
- Tool/Action: misuse or hijacking of tools the agent can call (web search, code execution, file access, API calls) — unauthorized actions, SSRF via tool parameters, privilege escalation through tool chaining
- Orchestration: manipulation of the orchestrator or system prompt — direct and indirect prompt injection, context window stuffing, jailbreaking, instruction hierarchy bypass
- Multi-Agent Interaction: threats that arise specifically when multiple agents communicate — agent-to-agent prompt injection, trust escalation between agents, confused deputy attacks
- Deployment Environment: infrastructure threats to the AI system — API key theft, model serving vulnerabilities, supply chain attacks on model weights or dependencies, container escapes

Rules:
1. First, check for AI/ML components. If none exist, set is_ai_system to false, return an empty threats list, and say "No AI/ML components detected in this system." in the summary.
2. Only flag threats that are genuine to the AI components present. Do not invent AI threats for a traditional web app.
3. Each threat must be specific. "The LLM could be attacked" is useless. "An attacker who controls customer ticket content could embed hidden instructions that cause the LLM to exfiltrate the conversation history to an external URL" is useful.
4. The abuse_case must describe a concrete, step-by-step attack scenario — not a generic category.
5. Identify 2-4 threats per significant AI component, covering the most applicable MAESTRO layers.
6. The component_name field must be the full display name exactly as it appears before the parentheses in the COMPONENTS list. Do NOT use the type identifier.
7. Output strict JSON matching the provided schema. No prose outside the JSON."""


class MaestroAgent(BaseAgent[SystemDescription, MaestroOutput]):
    name = "maestro"
    system_prompt = MAESTRO_SYSTEM_PROMPT
    output_schema = MaestroOutput
    max_tokens = 8192

    def build_user_prompt(self, input_data: SystemDescription) -> str:
        components_block = "\n".join(
            f"- {c.name} ({c.type}): {c.description}" for c in input_data.components
        )
        flows_block = "\n".join(
            f"- {f.source} -> {f.destination} | {f.data_type} | "
            f"protocol={f.protocol} | encrypted={f.is_encrypted}"
            for f in input_data.data_flows
        ) or "  (none)"

        return f"""Analyze the following system for AI/agentic threats using the MAESTRO framework.

SYSTEM NAME: {input_data.name}
DESCRIPTION: {input_data.description}

COMPONENTS:
{components_block}

DATA FLOWS:
{flows_block}

First determine whether any AI/ML components are present, then produce MAESTRO threats accordingly."""

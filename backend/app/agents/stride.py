from typing import Literal

from pydantic import BaseModel, Field

from app.agents.base import BaseAgent
from app.schemas.system import SystemDescription


class StrideThreat(BaseModel):
    category: Literal[
        "Spoofing", "Tampering", "Repudiation",
        "Information Disclosure", "Denial of Service", "Elevation of Privilege",
    ] = Field(description="The STRIDE category this threat falls under")
    component_name: str = Field(description="The full display name of the targeted component, exactly as listed in the COMPONENTS section (e.g. 'Web Frontend', 'API Gateway'). Use the name before the parentheses, not the type identifier.")
    title: str = Field(description="Short threat title, e.g. 'JWT signing key disclosure'")
    description: str = Field(description="One paragraph describing the threat, the attack vector, and the impact")
    likelihood: Literal["Low", "Medium", "High"]
    impact: Literal["Low", "Medium", "High"]
    attack_vector: str = Field(description="Specific technical means by which this threat would be realized")


class StrideOutput(BaseModel):
    threats: list[StrideThreat] = Field(description="All STRIDE threats identified across all components")
    summary: str = Field(description="One paragraph executive summary of the threat landscape")


STRIDE_SYSTEM_PROMPT = """You are a senior application security architect with 15 years of experience performing STRIDE threat modeling on enterprise software systems.

Your task: given a system description with components and data flows, identify concrete, specific threats across the six STRIDE categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.

Rules:
1. Identify 2-4 threats per significant component. Not every component needs threats from every category — only flag what's genuinely applicable.
2. Each threat must be specific. "The database could be attacked" is useless. "An attacker with read access to backup S3 buckets could exfiltrate the customer PII stored in unencrypted database snapshots" is useful.
3. Tie each threat to a concrete attack vector. Vague threats waste the reader's time.
4. Be honest about likelihood and impact. Most threats are Medium/Medium. Reserve High/High for genuinely catastrophic, exploit-ready scenarios.
5. The component_name field must be the full display name exactly as it appears before the parentheses in the COMPONENTS list (e.g. "Web Frontend", "API Gateway", "Auth Service", "Customer DB"). Do NOT use the type identifiers in parentheses (e.g. do NOT output "web_app", "gateway", "service", "database").
6. Output strict JSON matching the provided schema. No prose outside the JSON."""


class StrideAgent(BaseAgent[SystemDescription, StrideOutput]):
    name = "stride"
    system_prompt = STRIDE_SYSTEM_PROMPT
    output_schema = StrideOutput
    max_tokens = 8192

    def build_user_prompt(self, input_data: SystemDescription) -> str:
        components_block = "\n".join(
            f"- {c.name} ({c.type}): {c.description}" for c in input_data.components
        )
        flows_block = "\n".join(
            f"- {f.source} -> {f.destination} | {f.data_type} | "
            f"protocol={f.protocol} | encrypted={f.is_encrypted}"
            for f in input_data.data_flows
        )

        return f"""Analyze the following system and produce a STRIDE threat model.

SYSTEM NAME: {input_data.name}
DESCRIPTION: {input_data.description}

COMPONENTS:
{components_block}

DATA FLOWS:
{flows_block}

Produce STRIDE threats covering the most security-relevant components."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.agents.attack import TechniqueMapping, ThreatInput
from app.agents.base import BaseAgent


class AttackTreeAgentInput(BaseModel):
    """Input to the Attack Tree agent: system context + all threat/technique data."""
    system_name: str
    system_description: str
    threats: list[ThreatInput]
    technique_mappings: list[TechniqueMapping]


class AttackPathStep(BaseModel):
    sequence: int = Field(description="1-indexed step number")
    technique_id: str = Field(
        description="MITRE ATT&CK technique ID for this step — must be one of the IDs "
                    "from the TECHNIQUE MAPPINGS section"
    )
    description: str = Field(description="What the attacker specifically does at this step and why")


class AttackPath(BaseModel):
    name: str = Field(
        description="Short descriptive name, e.g. 'Credential theft via JWT forgery to full account takeover'"
    )
    objective: str = Field(description="The attacker's end goal if this path succeeds")
    severity: Literal["Low", "Medium", "High", "Critical"]
    steps: list[AttackPathStep] = Field(
        description="Ordered steps in the attack chain. Must contain between 2 and 8 steps. "
                    "A single-step path is not a valid attack chain.",
    )

    @model_validator(mode="after")
    def validate_step_count(self) -> "AttackPath":
        n = len(self.steps)
        if n < 2:
            raise ValueError(f"Attack path must have at least 2 steps (got {n})")
        if n > 8:
            raise ValueError(f"Attack path must have at most 8 steps (got {n})")
        return self


class AttackTreeOutput(BaseModel):
    paths: list[AttackPath] = Field(
        description="2-5 distinct attack paths; quality over quantity. Each path must tell a coherent attacker story.",
    )

    @model_validator(mode="after")
    def validate_path_count(self) -> "AttackTreeOutput":
        n = len(self.paths)
        if n < 2:
            raise ValueError(f"Must produce at least 2 attack paths (got {n})")
        if n > 5:
            raise ValueError(f"Must produce at most 5 attack paths (got {n})")
        return self


ATTACK_TREE_SYSTEM_PROMPT = """You are an expert in adversarial attack path analysis and threat modeling.

Your task: given a set of identified threats and their mapped MITRE ATT&CK techniques, construct plausible multi-step attack chains that an attacker could follow to achieve a meaningful objective against the target system.

Rules:
1. Produce 2-5 distinct attack paths. Each must represent a different attacker objective or entry point — do not produce variations of the same path.
2. Each path must have between 2 and 8 steps. Single-step "paths" are not paths — they are individual threats.
3. The technique_id in each step MUST be one of the IDs appearing in the TECHNIQUE MAPPINGS section. Do not use technique IDs from your general knowledge.
4. Steps must be causally ordered: each step should logically follow from the previous one and advance the attacker toward the objective.
5. The name should be a concise narrative (e.g. "XSS session hijack to admin privilege escalation").
6. Severity reflects the impact if the full path succeeds, not individual steps.
7. Output strict JSON matching the provided schema. No prose outside the JSON."""


class AttackTreeAgent(BaseAgent[AttackTreeAgentInput, AttackTreeOutput]):
    name = "attack_tree"
    system_prompt = ATTACK_TREE_SYSTEM_PROMPT
    output_schema = AttackTreeOutput
    max_tokens = 8192

    def build_user_prompt(self, input_data: AttackTreeAgentInput) -> str:
        threats_block = "\n".join(
            f"  {i}. [{t.category}] {t.title}: {t.description[:150]}"
            for i, t in enumerate(input_data.threats, 1)
        )

        # Show technique IDs available for step construction
        available_ids: set[str] = set()
        for m in input_data.technique_mappings:
            available_ids.update(m.technique_ids)

        mappings_block = "\n".join(
            f"  {m.threat_title}\n    → {', '.join(m.technique_ids)}  ({m.rationale})"
            for m in input_data.technique_mappings
        )

        return f"""Construct attack paths for the following system.

SYSTEM: {input_data.system_name}
DESCRIPTION: {input_data.system_description}

IDENTIFIED THREATS:
{threats_block}

TECHNIQUE MAPPINGS (use only these technique IDs in your step sequences):
{mappings_block}

Available technique IDs: {', '.join(sorted(available_ids))}

Build 2-5 distinct attack paths that chain these techniques into realistic attacker scenarios with clear objectives."""

from typing import Literal

from pydantic import BaseModel, Field

from app.agents.attack import TechniqueMapping, ThreatInput
from app.agents.attack_tree import AttackPath
from app.agents.base import BaseAgent


class ControlCandidate(BaseModel):
    """One CIS/NIST control fetched from Neo4j before the LLM call."""
    id: str
    framework: str
    control_id: str
    name: str
    description: str
    category: str


class ControlsAgentInput(BaseModel):
    """Full input to the Controls agent: all prior findings + pre-fetched candidates."""
    threats: list[ThreatInput]
    technique_mappings: list[TechniqueMapping]
    attack_paths: list[AttackPath]
    candidate_controls: list[ControlCandidate]


class ControlRecommendation(BaseModel):
    control_id: str = Field(
        description="CIS control ID exactly as it appears in the candidates list, e.g. '4.1' or '6.3'. "
                    "MUST come from the candidate list — do not invent IDs."
    )
    framework: str = Field(description="Framework name, e.g. 'CIS v8'")
    name: str = Field(description="Control name, copied exactly from the candidate")
    addresses_threats: list[str] = Field(description="Titles of threats this control directly mitigates")
    addresses_techniques: list[str] = Field(description="ATT&CK technique IDs this control reduces exposure to")
    priority: Literal["Quick win", "Standard", "Strategic"]
    implementation_notes: str = Field(
        description="1-2 sentences on how to apply this control specifically to the system being analyzed"
    )


class ControlsOutput(BaseModel):
    recommendations: list[ControlRecommendation] = Field(
        description="4-10 prioritised control recommendations. Prefer controls that address multiple threats."
    )
    coverage_summary: str = Field(
        description="What percentage of the identified threats are addressed by the recommendations, "
                    "and what significant gaps remain"
    )


CONTROLS_SYSTEM_PROMPT = """You are a senior security engineer specialising in CIS Controls and security program implementation.

Your task: given a completed threat model (threats, ATT&CK technique mappings, and attack paths), recommend the most impactful security controls from a pre-vetted candidate list.

Rules:
1. The control_id in each recommendation MUST appear in the CANDIDATE CONTROLS list. Do not recommend controls that are not in the list.
2. Recommend 4-10 controls. Prefer controls that address multiple threats over those that address only one.
3. Prioritise as follows:
   - "Quick win": can be implemented in days with existing tooling; high threat coverage
   - "Standard": normal project-sized effort; good ROI
   - "Strategic": longer-term program investment; addresses systemic risk
4. The implementation_notes must be specific to the system being analyzed — reference actual component names and data flows, not generic advice.
5. The coverage_summary should give an honest assessment of gaps (threats or techniques not covered by any recommendation).
6. Output strict JSON matching the provided schema. No prose outside the JSON."""


class ControlsAgent(BaseAgent[ControlsAgentInput, ControlsOutput]):
    name = "controls"
    system_prompt = CONTROLS_SYSTEM_PROMPT
    output_schema = ControlsOutput
    max_tokens = 8192

    def build_user_prompt(self, input_data: ControlsAgentInput) -> str:
        threats_block = "\n".join(
            f"  {i}. [{t.category}] {t.title}: {t.description[:120]}"
            for i, t in enumerate(input_data.threats, 1)
        )

        techniques_block = "\n".join(
            f"  {m.threat_title} → {', '.join(m.technique_ids)}"
            for m in input_data.technique_mappings
        )

        paths_block = "\n".join(
            f"  {p.name} ({p.severity}): {p.objective}\n"
            + "\n".join(
                f"    Step {s.sequence}: [{s.technique_id}] {s.description[:100]}"
                for s in p.steps
            )
            for p in input_data.attack_paths
        )

        controls_block = "\n".join(
            f"  {c.control_id} | {c.name} | {c.framework} | {c.category}\n"
            f"    {c.description[:150]}"
            for c in input_data.candidate_controls
        )

        return f"""Recommend security controls for the following threat model findings.

THREATS IDENTIFIED:
{threats_block}

TECHNIQUE MAPPINGS:
{techniques_block}

ATTACK PATHS:
{paths_block}

CANDIDATE CONTROLS (use ONLY these control_id values — {len(input_data.candidate_controls)} available):
{controls_block}

Select 4-10 controls from the candidates that best mitigate the threats and attack paths above. Prioritise breadth of coverage over single-threat point solutions."""

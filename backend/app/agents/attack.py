from pydantic import BaseModel, Field

from app.agents.base import BaseAgent


class ThreatInput(BaseModel):
    """Simplified threat representation consumed by the ATT&CK agent.

    Normalises StrideThreat and MaestroThreat into a single shape.
    """
    title: str
    description: str
    category: str = Field(description="STRIDE category or MAESTRO layer this threat belongs to")


class TechniqueCandidate(BaseModel):
    """One ATT&CK technique fetched from Neo4j before the LLM call."""
    id: str
    name: str
    tactic: str
    description: str


class AttackAgentInput(BaseModel):
    """Full input to the ATT&CK agent: threats to map + pre-fetched candidates."""
    threats: list[ThreatInput]
    candidate_techniques: list[TechniqueCandidate]


class TechniqueMapping(BaseModel):
    threat_title: str = Field(description="The exact title of a threat from the input list")
    technique_ids: list[str] = Field(
        description="1-3 MITRE ATT&CK technique IDs from the candidates list (e.g. T1190, T1078.004). "
                    "MUST be IDs that appear in the provided candidates — do not invent IDs."
    )
    rationale: str = Field(description="One sentence explaining why these techniques apply to the threat")


class AttackOutput(BaseModel):
    mappings: list[TechniqueMapping] = Field(
        description="One mapping entry per threat. Every threat in the input must appear here."
    )
    unmapped_threats: list[str] = Field(
        description="Titles of threats that have no reasonable match in the candidate list"
    )


ATTACK_SYSTEM_PROMPT = """You are a MITRE ATT&CK expert who maps security threats to ATT&CK techniques.

You will receive:
  1. A list of security threats (title, description, STRIDE/MAESTRO category).
  2. A curated list of candidate ATT&CK techniques pre-fetched from the threat database.

Your task: map each threat to the 1-3 candidate techniques that best describe its attack mechanism.

Rules:
1. You MUST only use technique IDs that appear in the CANDIDATE TECHNIQUES list below. Do not use IDs from your training data or general knowledge — this would introduce hallucinated IDs that don't exist in the database.
2. Map every threat. If no candidate is a reasonable fit, add the threat title to unmapped_threats instead.
3. Prefer specific sub-techniques (e.g. T1059.001) over parent techniques (T1059) when the sub-technique is a better match.
4. The rationale must explain the specific technical connection, not just restate the category.
5. Output strict JSON matching the provided schema. No prose outside the JSON."""


class AttackAgent(BaseAgent[AttackAgentInput, AttackOutput]):
    name = "attack"
    system_prompt = ATTACK_SYSTEM_PROMPT
    output_schema = AttackOutput
    max_tokens = 8192

    def build_user_prompt(self, input_data: AttackAgentInput) -> str:
        threats_block = "\n".join(
            f"{i}. [{t.category}] {t.title}\n   {t.description}"
            for i, t in enumerate(input_data.threats, 1)
        )

        # Truncate descriptions to 200 chars to keep prompt size bounded
        techniques_block = "\n".join(
            f"  {tc.id} | {tc.name} | tactic:{tc.tactic} | {tc.description[:200]}"
            for tc in input_data.candidate_techniques
        )

        return f"""Map each of the following threats to ATT&CK techniques from the candidates list.

THREATS TO MAP:
{threats_block}

CANDIDATE TECHNIQUES (use ONLY these IDs — {len(input_data.candidate_techniques)} total):
{techniques_block}

For each threat, pick 1-3 technique IDs from the candidates that best describe how the attack would be carried out. Add threats with no good match to unmapped_threats."""

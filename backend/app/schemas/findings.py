from pydantic import BaseModel, Field, ConfigDict


class ThreatOut(BaseModel):
    """A single threat produced by an agent and stored as a Neo4j Threat node."""

    threat_id: str = Field(..., description="Unique threat identifier (e.g. thr_x1)")
    category: str = Field(..., description="STRIDE category or other classification")
    description: str
    likelihood: str = Field(..., description="Likelihood rating: Low | Medium | High")
    impact: str = Field(..., description="Impact rating: Low | Medium | High | Critical")
    source_agent: str = Field(..., description="Which agent produced this threat (e.g. stride)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "threat_id": "thr_x1",
                "category": "Tampering",
                "description": "SQL injection on the customer search endpoint allowing data exfiltration",
                "likelihood": "Medium",
                "impact": "High",
                "source_agent": "stride",
            }
        }
    )


class TechniqueOut(BaseModel):
    """A MITRE ATT&CK technique node, seeded from the enterprise-attack STIX bundle."""

    technique_id: str = Field(..., description="ATT&CK identifier (e.g. T1190)")
    name: str
    tactic: str = Field(..., description="ATT&CK tactic (e.g. initial-access)")
    description: str
    url: str = Field(..., description="MITRE ATT&CK permalink for this technique")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "technique_id": "T1190",
                "name": "Exploit Public-Facing Application",
                "tactic": "initial-access",
                "description": "Adversaries may attempt to exploit a weakness in an Internet-facing host or system.",
                "url": "https://attack.mitre.org/techniques/T1190",
            }
        }
    )


class TechniqueDetail(TechniqueOut):
    """TechniqueOut extended with related threats and mitigating controls.

    Returned by GET /api/techniques/{technique_id}.
    """

    related_threats: list[ThreatOut] = Field(default_factory=list)
    controls: list["ControlOut"] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "technique_id": "T1190",
                "name": "Exploit Public-Facing Application",
                "tactic": "initial-access",
                "description": "Adversaries may attempt to exploit a weakness in an Internet-facing host or system.",
                "url": "https://attack.mitre.org/techniques/T1190",
                "related_threats": [],
                "controls": [],
            }
        }
    )


class TechniqueListResponse(BaseModel):
    """Paginated response for GET /api/techniques."""

    total: int = Field(..., description="Total number of techniques matching the filter")
    limit: int
    offset: int
    items: list[TechniqueOut]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 623,
                "limit": 5,
                "offset": 0,
                "items": [
                    {
                        "technique_id": "T1190",
                        "name": "Exploit Public-Facing Application",
                        "tactic": "initial-access",
                        "description": "...",
                        "url": "https://attack.mitre.org/techniques/T1190",
                    }
                ],
            }
        }
    )


class ControlOut(BaseModel):
    """A CIS or NIST control node that mitigates one or more threats/techniques."""

    id: str = Field(..., description="Internal Neo4j node identifier")
    framework: str = Field(..., description="Control framework (e.g. CIS, NIST)")
    control_id: str = Field(..., description="Framework-specific identifier (e.g. CIS-1.1, NIST AC-2)")
    name: str
    description: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "ctrl_cis_1_1",
                "framework": "CIS",
                "control_id": "CIS-1.1",
                "name": "Establish and Maintain a Software Inventory",
                "description": "Establish and maintain a detailed inventory of all licensed software installed on enterprise assets.",
            }
        }
    )


class AttackPathStep(BaseModel):
    """One step in an ordered attack path chain."""

    sequence: int = Field(..., description="Zero-based position in the attack chain")
    technique: TechniqueOut


class AttackPathSummary(BaseModel):
    """Lightweight attack path for GET /api/systems/{system_id}/attack-paths list."""

    path_id: str
    name: str
    description: str
    severity: str = Field(..., description="Severity rating: Low | Medium | High | Critical")
    step_count: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "path_id": "ap_001",
                "name": "Web-to-DB exfiltration chain",
                "description": "Attacker exploits public app, pivots to internal network, exfiltrates customer data.",
                "severity": "Critical",
                "step_count": 3,
            }
        }
    )


class AttackPathDetail(BaseModel):
    """Full attack path with ordered technique chain, returned by GET /api/attack-paths/{path_id}."""

    path_id: str
    name: str
    description: str
    severity: str
    steps: list[AttackPathStep] = Field(..., description="Ordered technique chain (ascending by sequence)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "path_id": "ap_001",
                "name": "Web-to-DB exfiltration chain",
                "description": "Attacker exploits public app, pivots to internal network, exfiltrates customer data.",
                "severity": "Critical",
                "steps": [
                    {
                        "sequence": 0,
                        "technique": {
                            "technique_id": "T1190",
                            "name": "Exploit Public-Facing Application",
                            "tactic": "initial-access",
                            "description": "...",
                            "url": "https://attack.mitre.org/techniques/T1190",
                        },
                    }
                ],
            }
        }
    )


class FindingsOut(BaseModel):
    """All structured findings for a completed analysis run.

    Returned by GET /api/analyses/{run_id}/findings.
    """

    run_id: str
    system_id: str
    threats: list[ThreatOut] = Field(default_factory=list)
    techniques: list[TechniqueOut] = Field(default_factory=list)
    attack_paths: list[AttackPathSummary] = Field(default_factory=list)
    controls: list[ControlOut] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "run_id": "run_9d4e1f2a",
                "system_id": "sys_8f3a2b1c",
                "threats": [],
                "techniques": [],
                "attack_paths": [],
                "controls": [],
            }
        }
    )


# Resolve the forward reference in TechniqueDetail
TechniqueDetail.model_rebuild()

from pydantic import BaseModel, Field, ConfigDict, model_validator


# ── Input models (request bodies) ────────────────────────────────────────────

class ComponentCreate(BaseModel):
    """A single component supplied when registering a new system."""

    name: str = Field(..., description="Human-readable component name")
    type: str = Field(..., description="Component category (e.g. web_app, gateway, service, database)")
    description: str = Field(..., description="What this component does")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "API Gateway",
                "type": "gateway",
                "description": "Routes and authenticates incoming requests",
            }
        }
    )


class DataFlowCreate(BaseModel):
    """A data flow between two components, referenced by component name in the request."""

    source: str = Field(..., description="Name of the source component (must match a component in the same request)")
    destination: str = Field(..., description="Name of the destination component")
    data_type: str = Field(..., description="Nature of the data crossing this flow (e.g. 'JWT validation requests')")
    protocol: str = Field(..., description="Transport protocol (e.g. HTTPS, gRPC, TCP/TLS)")
    is_encrypted: bool = Field(..., description="Whether the channel is encrypted in transit")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source": "API Gateway",
                "destination": "Auth Service",
                "data_type": "JWT validation requests",
                "protocol": "gRPC",
                "is_encrypted": True,
            }
        }
    )


class SystemCreate(BaseModel):
    """Request body for POST /api/systems."""

    name: str = Field(..., description="Display name for this system")
    description: str = Field(..., description="What the system does and who uses it")
    components: list[ComponentCreate] = Field(..., min_length=1, description="All components that make up this system")
    data_flows: list[DataFlowCreate] = Field(default_factory=list, description="Data flows between components")

    @model_validator(mode="after")
    def flows_reference_known_components(self) -> "SystemCreate":
        names = {c.name for c in self.components}
        for flow in self.data_flows:
            if flow.source not in names:
                raise ValueError(f"Data flow source '{flow.source}' does not match any component name")
            if flow.destination not in names:
                raise ValueError(f"Data flow destination '{flow.destination}' does not match any component name")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Customer Portal",
                "description": "Public-facing customer support portal with auth and ticketing.",
                "components": [
                    {"name": "Web Frontend", "type": "web_app", "description": "React SPA served via CDN"},
                    {"name": "API Gateway", "type": "gateway", "description": "Routes and authenticates incoming requests"},
                    {"name": "Auth Service", "type": "service", "description": "JWT issuance and validation"},
                    {"name": "Customer DB", "type": "database", "description": "PostgreSQL holding customer records and tickets"},
                ],
                "data_flows": [
                    {"source": "Web Frontend", "destination": "API Gateway", "data_type": "JSON over HTTPS", "protocol": "HTTPS", "is_encrypted": True},
                    {"source": "API Gateway", "destination": "Auth Service", "data_type": "JWT validation requests", "protocol": "gRPC", "is_encrypted": True},
                    {"source": "API Gateway", "destination": "Customer DB", "data_type": "SQL queries", "protocol": "TCP/TLS", "is_encrypted": True},
                ],
            }
        }
    )


# ── Agent input model ────────────────────────────────────────────────────────

class SystemDescription(BaseModel):
    """Denormalized system description passed to agents.

    Uses component names (not IDs) so prompts are human-readable.
    Built from Neo4j data at analysis time by analysis_service.
    """

    name: str
    description: str
    components: list[ComponentCreate]
    data_flows: list[DataFlowCreate]


# ── Output models (response bodies) ──────────────────────────────────────────

class SystemCreateResponse(BaseModel):
    """Response body for a successful POST /api/systems (201 Created)."""

    system_id: str = Field(..., description="Generated unique identifier for the system")
    name: str
    component_count: int
    flow_count: int
    created_at: str = Field(..., description="ISO 8601 creation timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "system_id": "sys_8f3a2b1c",
                "name": "Customer Portal",
                "component_count": 4,
                "flow_count": 3,
                "created_at": "2026-06-10T14:23:11Z",
            }
        }
    )


class ComponentOut(BaseModel):
    """A component as returned by GET /api/systems/{system_id}."""

    component_id: str
    name: str
    type: str
    description: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "component_id": "cmp_2b",
                "name": "API Gateway",
                "type": "gateway",
                "description": "Routes and authenticates incoming requests",
            }
        }
    )


class DataFlowOut(BaseModel):
    """A data flow as returned in GET /api/systems/{system_id}. Source/destination are component IDs."""

    source: str = Field(..., description="component_id of the source component")
    destination: str = Field(..., description="component_id of the destination component")
    data_type: str
    protocol: str
    is_encrypted: bool

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source": "cmp_2b",
                "destination": "cmp_3c",
                "data_type": "JWT validation requests",
                "protocol": "gRPC",
                "is_encrypted": True,
            }
        }
    )


class SystemOut(BaseModel):
    """Full system detail returned by GET /api/systems/{system_id}."""

    system_id: str
    name: str
    description: str | None
    created_at: str
    components: list[ComponentOut]
    data_flows: list[DataFlowOut]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "system_id": "sys_8f3a2b1c",
                "name": "Customer Portal",
                "description": "Public-facing customer support portal with auth and ticketing.",
                "created_at": "2026-06-10T14:23:11Z",
                "components": [
                    {"component_id": "cmp_1a", "name": "Web Frontend", "type": "web_app", "description": "React SPA served via CDN"},
                    {"component_id": "cmp_2b", "name": "API Gateway", "type": "gateway", "description": "Routes and authenticates incoming requests"},
                ],
                "data_flows": [
                    {"source": "cmp_1a", "destination": "cmp_2b", "data_type": "JSON over HTTPS", "protocol": "HTTPS", "is_encrypted": True},
                ],
            }
        }
    )


class SystemSummary(BaseModel):
    """Lightweight system record returned in GET /api/systems list responses."""

    system_id: str
    name: str
    description: str | None
    component_count: int
    created_at: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "system_id": "sys_8f3a2b1c",
                "name": "Customer Portal",
                "description": "Public-facing customer support portal with auth and ticketing.",
                "component_count": 4,
                "created_at": "2026-06-10T14:23:11Z",
            }
        }
    )

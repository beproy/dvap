from pydantic import BaseModel, Field, ConfigDict


class GraphNode(BaseModel):
    """A single node in the React Flow graph payload.

    The ``type`` field drives how React Flow renders the node
    (e.g. 'component', 'threat', 'technique').  ``data`` carries
    any additional properties the frontend needs for its custom
    node renderers.
    """

    id: str = Field(..., description="Unique node identifier (component_id, threat_id, etc.)")
    type: str = Field(..., description="Node kind: component | threat | technique | control")
    label: str = Field(..., description="Display label shown on the canvas")
    data: dict = Field(default_factory=dict, description="Type-specific properties for the frontend renderer")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "cmp_1a",
                "type": "component",
                "label": "Web Frontend",
                "data": {"component_type": "web_app"},
            }
        }
    )


class GraphEdge(BaseModel):
    """A directed edge in the React Flow graph payload.

    ``type`` describes the relationship kind (e.g. 'flow', 'targets',
    'implements').  ``data`` carries edge-level properties like protocol.
    """

    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="ID of the source node")
    target: str = Field(..., description="ID of the target node")
    type: str = Field(..., description="Edge kind: flow | targets | implements | mitigates")
    data: dict = Field(default_factory=dict, description="Edge-level properties (e.g. protocol, sequence)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "e1",
                "source": "cmp_1a",
                "target": "cmp_2b",
                "type": "flow",
                "data": {"protocol": "HTTPS"},
            }
        }
    )


class GraphResponse(BaseModel):
    """Complete graph payload for a system, shaped for direct consumption by React Flow.

    Returned by GET /api/systems/{system_id}/graph.
    """

    system_id: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "system_id": "sys_8f3a2b1c",
                "nodes": [
                    {"id": "cmp_1a", "type": "component", "label": "Web Frontend",  "data": {"component_type": "web_app"}},
                    {"id": "cmp_2b", "type": "component", "label": "API Gateway",   "data": {"component_type": "gateway"}},
                    {"id": "cmp_3c", "type": "component", "label": "Auth Service",  "data": {"component_type": "service"}},
                    {"id": "cmp_4d", "type": "component", "label": "Customer DB",   "data": {"component_type": "database"}},
                    {"id": "thr_x1", "type": "threat",    "label": "SQL Injection on customer search",
                     "data": {"category": "Tampering", "likelihood": "Medium", "impact": "High"}},
                ],
                "edges": [
                    {"id": "e1", "source": "cmp_1a", "target": "cmp_2b", "type": "flow",    "data": {"protocol": "HTTPS"}},
                    {"id": "e2", "source": "cmp_2b", "target": "cmp_3c", "type": "flow",    "data": {"protocol": "gRPC"}},
                    {"id": "e3", "source": "cmp_2b", "target": "cmp_4d", "type": "flow",    "data": {"protocol": "TCP/TLS"}},
                    {"id": "e4", "source": "thr_x1", "target": "cmp_4d", "type": "targets", "data": {}},
                ],
            }
        }
    )

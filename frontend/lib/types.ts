// TypeScript types mirroring the DVAP backend Pydantic schemas.
// Source of truth for field names and shapes across all API calls.

// ── Shared enums ──────────────────────────────────────────────────────────────

export type ComponentType =
  | "web_app"
  | "service"
  | "database"
  | "gateway"
  | "queue"
  | "storage"
  | "auth"
  | "external"
  | "other";

export type RunStatus = "pending" | "running" | "completed" | "failed";

// ── System request types (POST /api/systems) ─────────────────────────────────

export interface ComponentCreate {
  name: string;
  type: ComponentType;
  description: string;
}

export interface DataFlowCreate {
  source: string;       // component name (not ID) in create requests
  destination: string;  // component name (not ID) in create requests
  data_type: string;
  protocol: string;
  is_encrypted: boolean;
}

export interface CreateSystemRequest {
  name: string;
  description: string;
  components: ComponentCreate[];
  data_flows: DataFlowCreate[];
}

// ── System response types ─────────────────────────────────────────────────────

// Returned by GET /api/systems (list). Includes analysis summary fields.
export interface SystemSummary {
  system_id: string;
  name: string;
  description: string | null;
  component_count: number;
  created_at: string;
  threat_count: number;
  max_severity: "Critical" | "High" | "Medium" | "Low" | null;
}

// Returned by POST /api/systems (create).
export interface SystemCreateResponse {
  system_id: string;
  name: string;
  component_count: number;
  flow_count: number;
  created_at: string;
}

// Returned by GET /api/systems/{id} (detail). Components use component_id.
export interface ComponentOut {
  component_id: string;
  name: string;
  type: string;
  description: string;
}

export interface DataFlowOut {
  source: string;       // component_id
  destination: string;  // component_id
  data_type: string;
  protocol: string;
  is_encrypted: boolean;
}

export interface SystemOut {
  system_id: string;
  name: string;
  description: string | null;
  created_at: string;
  components: ComponentOut[];
  data_flows: DataFlowOut[];
}

// ── Analysis run types ────────────────────────────────────────────────────────

// Returned by POST /api/systems/{id}/analyze.
export interface AnalysisStartResponse {
  run_id: string;
  system_id: string;
  status: RunStatus;
  started_at: string;
  estimated_seconds: number;
}

// Returned by GET /api/analyses (list). Lightweight, no agent details.
export interface AnalysisRunSummary {
  run_id: string;
  system_id: string;
  system_name: string;
  status: RunStatus;
  llm_model: string;
  started_at: string;
  completed_at: string | null;
}

// Returned by GET /api/analyses/{run_id} (detail). Used for status polling.
export interface AnalysisRun {
  run_id: string;
  system_id: string;
  system_name: string;
  status: RunStatus;
  llm_backend: string;
  llm_model: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// ── Findings types (returned by GET /api/analyses/{run_id}/findings) ─────────
// The backend stores agent outputs as list[Any]; these interfaces describe
// the actual JSON shapes the agents produce.

export interface Threat {
  threat_id?: string;
  source_agent?: "stride" | "maestro";
  category: string;
  component_name: string;
  title: string;
  description: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  attack_vector?: string;   // STRIDE threats
  abuse_case?: string;      // MAESTRO threats
}

export interface TechniqueMapping {
  threat_title: string;
  technique_ids: string[];
  rationale: string;
}

export interface AttackPathStep {
  sequence: number;
  technique_id: string;
  description: string;
}

export interface AttackPath {
  path_id?: string;
  name: string;
  objective: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  steps: AttackPathStep[];
}

export interface ControlRecommendation {
  control_id: string;
  framework: string;
  name: string;
  addresses_threats: string[];
  addresses_techniques: string[];
  priority: "Quick win" | "Standard" | "Strategic";
  implementation_notes: string;
}

export interface AnalysisFindings {
  run_id: string;
  system_id: string;
  status: RunStatus;
  threats: Threat[];
  technique_mappings: TechniqueMapping[];
  attack_paths: AttackPath[];
  control_recommendations: ControlRecommendation[];
  timings: Record<string, number>;
  errors: string[];
}

// ── Graph types (returned by GET /api/systems/{id}/graph) ────────────────────

export interface GraphNode {
  id: string;
  type: string;         // "component" | "threat" | "technique" | "control"
  label: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;         // "flow" | "targets" | "implements" | "mitigates"
  data: Record<string, unknown>;
}

export interface SystemGraph {
  system_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Reference types (GET /api/techniques) ────────────────────────────────────

export interface Technique {
  technique_id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
}

export interface TechniqueListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Technique[];
}

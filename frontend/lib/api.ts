import type {
  AnalysisFindings,
  AnalysisRun,
  AnalysisRunSummary,
  AnalysisStartResponse,
  CreateSystemRequest,
  SystemCreateResponse,
  SystemGraph,
  SystemOut,
  SystemSummary,
  TechniqueListResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  // 204 No Content has no body
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Systems ───────────────────────────────────────────────────────────────────

export const listSystems = () =>
  apiFetch<SystemSummary[]>("/api/systems");

export const getSystem = (id: string) =>
  apiFetch<SystemOut>(`/api/systems/${id}`);

export const createSystem = (data: CreateSystemRequest) =>
  apiFetch<SystemCreateResponse>("/api/systems", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteSystem = (id: string) =>
  apiFetch<void>(`/api/systems/${id}`, { method: "DELETE" });

// ── Graph ─────────────────────────────────────────────────────────────────────

export const getSystemGraph = (id: string) =>
  apiFetch<SystemGraph>(`/api/systems/${id}/graph`);

// ── Analyses ──────────────────────────────────────────────────────────────────

// Sends all five agents. The backend requires at least one agent.
export const startAnalysis = (systemId: string) =>
  apiFetch<AnalysisStartResponse>(`/api/systems/${systemId}/analyze`, {
    method: "POST",
    body: JSON.stringify({
      agents: ["stride", "maestro", "attack", "attack_tree", "controls"],
    }),
  });

// Optional system_id filter. Backend does not yet support this param;
// will be added in Prompt 5.10 when the runs page is wired up.
export const listRuns = (systemId?: string) =>
  apiFetch<AnalysisRunSummary[]>(
    systemId ? `/api/analyses?system_id=${systemId}` : "/api/analyses"
  );

export const getAnalysisRun = (runId: string) =>
  apiFetch<AnalysisRun>(`/api/analyses/${runId}`);

export const getAnalysisFindings = (runId: string) =>
  apiFetch<AnalysisFindings>(`/api/analyses/${runId}/findings`);

// ── Reference data ────────────────────────────────────────────────────────────

export const listTechniques = (limit = 50) =>
  apiFetch<TechniqueListResponse>(`/api/techniques?limit=${limit}`);

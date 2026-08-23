import {
  Agent,
  Scenario,
  Evaluation,
  TraceStep,
  Failure,
  ScoreSummary,
  Regression,
  DashboardData,
  RiskAnalysisResult,
} from "./types";

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => req<{ status: string }>("/api/health"),

  listAgents: () => req<Agent[]>("/api/agents"),
  getAgent: (id: string) => req<Agent>(`/api/agents/${id}`),
  getAgentScore: (id: string, version?: string) =>
    req<ScoreSummary>(`/api/agents/${id}/score${version ? `?version=${version}` : ""}`),
  getAgentRegression: (id: string) => req<Regression>(`/api/agents/${id}/regression`),

  generateScenarios: (agent_id: string) =>
    req<{ agent_id: string; count: number; scenarios: Scenario[] }>("/api/scenarios/generate", {
      method: "POST",
      body: JSON.stringify({ agent_id }),
    }),
  listScenarios: (agent_id?: string) =>
    req<Scenario[]>(`/api/scenarios${agent_id ? `?agent_id=${agent_id}` : ""}`),

  runEvaluation: (scenario_id: string, version?: string) =>
    req<Evaluation>("/api/evaluations/run", {
      method: "POST",
      body: JSON.stringify({ scenario_id, version }),
    }),
  getEvaluation: (id: string) => req<Evaluation>(`/api/evaluations/${id}`),
  listEvaluations: (agent_id?: string, limit = 20) =>
    req<Evaluation[]>(`/api/evaluations?limit=${limit}${agent_id ? `&agent_id=${agent_id}` : ""}`),
  getTrace: (id: string) => req<TraceStep[]>(`/api/evaluations/${id}/trace`),
  analyze: (id: string) => req<any>(`/api/evaluations/${id}/analyze`, { method: "POST" }),
  getFailures: (id: string) => req<Failure[]>(`/api/evaluations/${id}/failures`),

  dashboard: () => req<DashboardData>("/api/dashboard"),

  analyzeRisk: (agent_id: string, situation: string) =>
    req<RiskAnalysisResult>("/api/scenarios/analyze-risk", {
      method: "POST",
      body: JSON.stringify({ agent_id, situation }),
    }),

  simulateCustom: (agent_id: string, situation: string, version = "v1.0") =>
    req<Evaluation>("/api/scenarios/simulate-custom", {
      method: "POST",
      body: JSON.stringify({ agent_id, situation, version }),
    }),
};

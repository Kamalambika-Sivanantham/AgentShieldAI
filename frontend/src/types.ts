export interface Tool {
  name: string;
  destructive: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  risk_level: string;
  tools: Tool[];
  tool_count: number;
  status: string;
  current_version: string;
  reliability_score: number;
  score_label: string;
  critical_failures: number;
  tests_run: number;
  pass_rate: number;
}

export interface Scenario {
  id: string;
  agent_id: string;
  title: string;
  category: string;
  severity: string;
  user_input: string;
  expected_behavior: string;
  risk: string;
  target_tool: string | null;
  source: string;
  created_at: string;
}

export interface Failure {
  id?: string;
  evaluation_id?: string;
  type: string;
  severity: string;
  description: string;
  expected_behavior: string;
  actual_behavior: string;
  evidence: string;
  risk: string;
  recommendation: string;
}

export interface TraceStep {
  id: string;
  evaluation_id: string;
  step_number: number;
  timestamp: string;
  action: string;
  tool: string | null;
  parameters: Record<string, any>;
  response: Record<string, any>;
  status: string;
}

export interface Evaluation {
  id: string;
  agent_id: string;
  scenario_id: string;
  version: string;
  status: "pass" | "fail";
  reliability_score: number;
  safety_score: number;
  goal_adherence_score: number;
  tool_usage_score: number;
  correctness_score: number;
  robustness_score: number;
  efficiency_score: number;
  created_at: string;
  failures?: Failure[];
  trace?: TraceStep[];
  scenario_title?: string;
  scenario_category?: string;
  scenario_severity?: string;
  scenario?: Scenario;
}

export interface ScoreSummary {
  agent_id: string;
  version: string;
  reliability_score: number;
  label: string;
  safety_score: number;
  goal_adherence_score: number;
  tool_usage_score: number;
  correctness_score: number;
  robustness_score: number;
  efficiency_score: number;
  critical_failures: number;
  tests_run: number;
  pass_rate: number;
}

export interface Regression {
  agent_id: string;
  previous: ScoreSummary;
  current: ScoreSummary;
  versions: ScoreSummary[];
  delta: number;
  trend: "improved" | "regressed" | "flat";
  resolved_failures: string[];
  new_failures: string[];
}

export interface DashboardData {
  agents_tested: number;
  tests_executed: number;
  reliability_score: number;
  reliability_label: string;
  critical_failures: number;
  failure_distribution: { type: string; count: number }[];
  reliability_trend: { agent: string; version: string; score: number }[];
  recent_evaluations: Evaluation[];
}

export interface RiskAnalysisResult {
  agent_id: string;
  agent_name: string;
  situation: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  reason: string;
  potential_failure_mode: string;
  expected_safe_behavior: string;
  recommended_action: string;
  expected_reliability_safe: string;
  expected_reliability_unsafe: string;
  target_tool: string | null;
  is_destructive: boolean;
  requires_confirmation: boolean;
}

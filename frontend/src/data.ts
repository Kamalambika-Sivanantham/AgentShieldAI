import { DashboardData, Agent } from "./types";

// Used only if the backend cannot be reached at all (e.g. still starting up).
// Once the FastAPI backend responds, real seeded data always replaces this.

export const FALLBACK_DASHBOARD: DashboardData = {
  agents_tested: 2,
  tests_executed: 22,
  reliability_score: 64.4,
  reliability_label: "Needs Improvement",
  critical_failures: 8,
  failure_distribution: [
    { type: "Missing Confirmation", count: 2 },
    { type: "Destructive Action", count: 2 },
    { type: "Prompt Injection", count: 2 },
    { type: "Unauthorized Action", count: 2 },
    { type: "Invalid Parameters", count: 4 },
    { type: "Tool Misuse", count: 2 },
    { type: "Tool Call Loop", count: 2 },
    { type: "Hallucination", count: 2 },
    { type: "Goal Drift", count: 2 },
  ],
  reliability_trend: [
    { agent: "Banking Assistant", version: "v1.0", score: 64.4 },
    { agent: "Banking Assistant", version: "v1.1", score: 100.0 },
    { agent: "E-Commerce Support Agent", version: "v1.0", score: 64.4 },
    { agent: "E-Commerce Support Agent", version: "v1.1", score: 100.0 },
  ],
  recent_evaluations: [],
};

export const FALLBACK_AGENTS: Agent[] = [
  {
    id: "agent_banking",
    name: "Banking Assistant",
    type: "banking",
    description: "Handles balance checks, account details, transaction history and money transfers.",
    risk_level: "High",
    tools: [
      { name: "get_balance", destructive: false },
      { name: "get_account_details", destructive: false },
      { name: "verify_account", destructive: false },
      { name: "transaction_history", destructive: false },
      { name: "transfer_money", destructive: true },
    ],
    tool_count: 5,
    status: "active",
    current_version: "v1.0",
    reliability_score: 64.4,
    score_label: "Needs Improvement",
    critical_failures: 4,
    tests_run: 11,
    pass_rate: 27.3,
  },
  {
    id: "agent_ecommerce",
    name: "E-Commerce Support Agent",
    type: "ecommerce",
    description: "Handles order lookups, cancellations, refunds and shipping updates.",
    risk_level: "Medium",
    tools: [
      { name: "get_order", destructive: false },
      { name: "get_customer", destructive: false },
      { name: "cancel_order", destructive: true },
      { name: "initiate_refund", destructive: true },
      { name: "update_shipping_address", destructive: false },
    ],
    tool_count: 5,
    status: "active",
    current_version: "v1.0",
    reliability_score: 64.4,
    score_label: "Needs Improvement",
    critical_failures: 4,
    tests_run: 11,
    pass_rate: 27.3,
  },
];

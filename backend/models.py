"""Pydantic request/response schemas for AgentShield AI."""
from typing import Optional, Any
from pydantic import BaseModel


class GenerateScenariosRequest(BaseModel):
    agent_id: str
    count: Optional[int] = None  # None = use full deterministic template set


class RunEvaluationRequest(BaseModel):
    scenario_id: str
    version: Optional[str] = None  # which agent version to simulate, e.g. "v1.0" / "v1.1"


class AnalyzeRiskRequest(BaseModel):
    agent_id: str
    situation: str


class SimulateCustomRequest(BaseModel):
    agent_id: str
    situation: str
    version: Optional[str] = "v1.0"

"""AgentShield AI — FastAPI backend.

"Test AI Agents Before They Fail in Production."
Run with:  uvicorn main:app --reload --port 8000
"""
import json
import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import database
from database import get_db, row_to_dict, new_id
import engine
from models import GenerateScenariosRequest, RunEvaluationRequest, AnalyzeRiskRequest, SimulateCustomRequest

app = FastAPI(title="AgentShield AI", version="1.0.0")

# Configure CORS origins from environment variable
cors_origins_raw = os.getenv("CORS_ORIGINS", "*").strip()
if not cors_origins_raw or cors_origins_raw == "*":
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    database.init_db()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "AgentShield AI",
        "version": "1.0.0",
        "time": datetime.utcnow().isoformat(),
    }


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------

@app.get("/api/agents")
def list_agents():
    agents = database.list_agents()
    out = []
    for a in agents:
        summary = engine.agent_score_summary(a["id"])
        out.append({
            **a,
            "tools": json.loads(a["tools"]),
            "tool_count": len(json.loads(a["tools"])),
            "reliability_score": summary["reliability_score"],
            "score_label": summary["label"],
            "critical_failures": summary["critical_failures"],
            "tests_run": summary["tests_run"],
            "pass_rate": summary["pass_rate"],
        })
    return out


@app.get("/api/agents/{agent_id}")
def get_agent(agent_id: str):
    a = database.get_agent(agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    summary = engine.agent_score_summary(agent_id)
    return {
        **a,
        "tools": json.loads(a["tools"]),
        "tool_count": len(json.loads(a["tools"])),
        "reliability_score": summary["reliability_score"],
        "score_label": summary["label"],
        "critical_failures": summary["critical_failures"],
        "tests_run": summary["tests_run"],
        "pass_rate": summary["pass_rate"],
    }


@app.get("/api/agents/{agent_id}/score")
def agent_score(agent_id: str, version: str = None):
    if not database.get_agent(agent_id):
        raise HTTPException(404, "Agent not found")
    return engine.agent_score_summary(agent_id, version)


@app.get("/api/agents/{agent_id}/regression")
def agent_regression(agent_id: str):
    if not database.get_agent(agent_id):
        raise HTTPException(404, "Agent not found")
    return engine.agent_regression(agent_id)


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

@app.post("/api/scenarios/generate")
def generate_scenarios(req: GenerateScenariosRequest):
    agent = database.get_agent(req.agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")

    with get_db() as conn:
        existing = conn.execute(
            "SELECT COUNT(*) c FROM scenarios WHERE agent_id=?", (req.agent_id,)
        ).fetchone()["c"]

    # Deterministic templates already exist from seeding — "generating" for a
    # fresh agent (or on demand) just (re)materializes the full template set.
    if existing == 0:
        templates = engine.build_scenario_templates(req.agent_id)
        with get_db() as conn:
            for s in templates:
                conn.execute(
                    "INSERT INTO scenarios (id, agent_id, title, category, severity, user_input, "
                    "expected_behavior, risk, target_tool, sim_json, source, created_at) VALUES "
                    "(:id,:agent_id,:title,:category,:severity,:user_input,:expected_behavior,:risk,"
                    ":target_tool,:sim_json,:source,:created_at)",
                    {**s, "sim_json": json.dumps(s["sim"]), "source": "template",
                     "created_at": datetime.utcnow().isoformat()},
                )
            conn.commit()

    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, agent_id, title, category, severity, user_input, expected_behavior, risk, "
            "target_tool, source, created_at FROM scenarios WHERE agent_id=? ORDER BY created_at",
            (req.agent_id,),
        ).fetchall()
    scenarios = [row_to_dict(r) for r in rows]
    if req.count:
        scenarios = scenarios[: req.count]
    return {"agent_id": req.agent_id, "count": len(scenarios), "scenarios": scenarios}


@app.get("/api/scenarios")
def list_scenarios(agent_id: str = None):
    with get_db() as conn:
        if agent_id:
            rows = conn.execute(
                "SELECT id, agent_id, title, category, severity, user_input, expected_behavior, risk, "
                "target_tool, source, created_at FROM scenarios WHERE agent_id=? ORDER BY created_at",
                (agent_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, agent_id, title, category, severity, user_input, expected_behavior, risk, "
                "target_tool, source, created_at FROM scenarios ORDER BY created_at"
            ).fetchall()
    return [row_to_dict(r) for r in rows]


@app.post("/api/scenarios/analyze-risk")
def analyze_scenario_risk_endpoint(req: AnalyzeRiskRequest):
    if not req.situation or not req.situation.strip():
        raise HTTPException(400, "Situation cannot be empty")
    return engine.analyze_scenario_risk(req.agent_id, req.situation)


@app.post("/api/scenarios/simulate-custom")
def simulate_custom_scenario_endpoint(req: SimulateCustomRequest):
    if not req.situation or not req.situation.strip():
        raise HTTPException(400, "Situation cannot be empty")
    return engine.simulate_custom_scenario(req.agent_id, req.situation, version=req.version or "v1.0")


# ---------------------------------------------------------------------------
# Evaluations
# ---------------------------------------------------------------------------

@app.post("/api/evaluations/run")
def run_evaluation(req: RunEvaluationRequest):
    with get_db() as conn:
        scenario = conn.execute("SELECT * FROM scenarios WHERE id=?", (req.scenario_id,)).fetchone()
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    result = engine.run_evaluation_for_scenario(req.scenario_id, version=req.version)
    return result


@app.get("/api/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM evaluations WHERE id=?", (evaluation_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Evaluation not found")
        ev = row_to_dict(row)
        scenario = row_to_dict(conn.execute("SELECT * FROM scenarios WHERE id=?", (ev["scenario_id"],)).fetchone())
    ev["scenario"] = {k: v for k, v in scenario.items() if k != "sim_json"}
    ev["scenario_title"] = scenario.get("title")
    ev["scenario_category"] = scenario.get("category")
    ev["scenario_severity"] = scenario.get("severity")
    ev["label"] = engine.score_label(ev["reliability_score"])
    return ev


@app.get("/api/evaluations")
def list_evaluations(agent_id: str = None, limit: int = 20):
    with get_db() as conn:
        if agent_id:
            rows = conn.execute(
                "SELECT * FROM evaluations WHERE agent_id=? ORDER BY created_at DESC LIMIT ?",
                (agent_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM evaluations ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        evals = []
        for r in rows:
            e = row_to_dict(r)
            scenario = conn.execute("SELECT title, category FROM scenarios WHERE id=?", (e["scenario_id"],)).fetchone()
            e["scenario_title"] = scenario["title"] if scenario else None
            e["scenario_category"] = scenario["category"] if scenario else None
            evals.append(e)
    return evals


@app.get("/api/evaluations/{evaluation_id}/trace")
def get_trace(evaluation_id: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM traces WHERE evaluation_id=? ORDER BY step_number", (evaluation_id,)
        ).fetchall()
    trace = []
    for r in rows:
        t = row_to_dict(r)
        t["parameters"] = json.loads(t["parameters"]) if t["parameters"] else {}
        t["response"] = json.loads(t["response"]) if t["response"] else {}
        trace.append(t)
    return trace


@app.post("/api/evaluations/{evaluation_id}/analyze")
def analyze_evaluation(evaluation_id: str):
    with get_db() as conn:
        ev = conn.execute("SELECT * FROM evaluations WHERE id=?", (evaluation_id,)).fetchone()
        if not ev:
            raise HTTPException(404, "Evaluation not found")
        ev = row_to_dict(ev)
        failures = [row_to_dict(r) for r in conn.execute(
            "SELECT * FROM failures WHERE evaluation_id=?", (evaluation_id,)
        ).fetchall()]
        scenario = row_to_dict(conn.execute("SELECT * FROM scenarios WHERE id=?", (ev["scenario_id"],)).fetchone())

    return {
        "evaluation_id": evaluation_id,
        "status": ev["status"],
        "reliability_score": ev["reliability_score"],
        "label": engine.score_label(ev["reliability_score"]),
        "category_scores": {
            "safety": ev["safety_score"],
            "goal_adherence": ev["goal_adherence_score"],
            "tool_usage": ev["tool_usage_score"],
            "correctness": ev["correctness_score"],
            "robustness": ev["robustness_score"],
            "efficiency": ev["efficiency_score"],
        },
        "scenario_title": scenario["title"],
        "failures": failures,
        "summary": (
            f"{len(failures)} issue(s) detected." if failures
            else "No failures detected — agent behaved within expected safety and policy bounds."
        ),
    }


@app.get("/api/evaluations/{evaluation_id}/failures")
def get_failures(evaluation_id: str):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM failures WHERE evaluation_id=?", (evaluation_id,)).fetchall()
    return [row_to_dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Dashboard aggregate (used by the frontend Dashboard page)
# ---------------------------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():
    agents = database.list_agents()
    summaries = [engine.agent_score_summary(a["id"]) for a in agents]
    overall_score = round(sum(s["reliability_score"] for s in summaries) / len(summaries), 1) if summaries else 0.0
    total_critical = sum(s["critical_failures"] for s in summaries)
    total_active_tests = sum(s["tests_run"] for s in summaries)

    with get_db() as conn:
        total_eval_count = conn.execute("SELECT COUNT(*) c FROM evaluations").fetchone()["c"]

        # Collect active evaluation IDs for failure distribution matching current state
        active_eval_ids = []
        for a in agents:
            v = a.get("current_version", "v1.0")
            rows = conn.execute(
                """SELECT e.id FROM evaluations e
                   INNER JOIN (
                       SELECT scenario_id, MAX(created_at) as max_created
                       FROM evaluations WHERE agent_id=? AND version=? GROUP BY scenario_id
                   ) latest ON e.scenario_id = latest.scenario_id AND e.created_at = latest.max_created
                   WHERE e.agent_id=? AND e.version=?""", (a["id"], v, a["id"], v)
            ).fetchall()
            active_eval_ids.extend([r["id"] for r in rows])

        if active_eval_ids:
            placeholders = ",".join("?" for _ in active_eval_ids)
            failure_dist_rows = conn.execute(
                f"SELECT type, COUNT(*) c FROM failures WHERE evaluation_id IN ({placeholders}) GROUP BY type ORDER BY c DESC",
                active_eval_ids
            ).fetchall()
        else:
            failure_dist_rows = []

        # Distinct recent evaluations (latest run per scenario and version, up to 8)
        recent_rows = conn.execute(
            """SELECT e.*, s.title as scenario_title, s.category as scenario_category
               FROM evaluations e
               JOIN scenarios s ON e.scenario_id = s.id
               INNER JOIN (
                   SELECT scenario_id, version, MAX(created_at) as max_created
                   FROM evaluations
                   GROUP BY scenario_id, version
               ) latest ON e.scenario_id = latest.scenario_id AND e.version = latest.version AND e.created_at = latest.max_created
               ORDER BY e.created_at DESC LIMIT 8"""
        ).fetchall()

    trend = []
    for a in agents:
        reg = engine.agent_regression(a["id"])
        for v in reg["versions"]:
            trend.append({"agent": a["name"], "version": v["version"], "score": v["reliability_score"]})

    return {
        "agents_tested": len(agents),
        "tests_executed": total_eval_count or total_active_tests,
        "reliability_score": overall_score,
        "reliability_label": engine.score_label(overall_score),
        "critical_failures": total_critical,
        "failure_distribution": [{"type": r["type"], "count": r["c"]} for r in failure_dist_rows],
        "reliability_trend": trend,
        "recent_evaluations": [row_to_dict(r) for r in recent_rows],
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    reload = os.getenv("RELOAD", "false").lower() in ("true", "1")
    uvicorn.run("main:app", host=host, port=port, reload=reload)

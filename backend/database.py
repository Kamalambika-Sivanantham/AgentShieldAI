"""SQLite persistence layer for AgentShield AI.

Zero external dependencies beyond the stdlib sqlite3 module - this keeps the
hackathon MVP install-free (no Postgres, no ORM migrations).
"""
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta

raw_db = os.getenv("DATABASE_URL")
if raw_db and raw_db.strip():
    if raw_db.startswith("sqlite:///"):
        DB_PATH = raw_db.replace("sqlite:///", "")
    else:
        DB_PATH = raw_db
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "agentshield.db")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in row.keys()}


SCHEMA = """
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    risk_level TEXT,
    tools TEXT,              -- JSON list of {name, destructive}
    status TEXT DEFAULT 'active',
    current_version TEXT DEFAULT 'v1.0'
);

CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    user_input TEXT NOT NULL,
    expected_behavior TEXT NOT NULL,
    risk TEXT NOT NULL,
    target_tool TEXT,
    sim_json TEXT NOT NULL,  -- JSON describing simulated behavior per agent version
    source TEXT DEFAULT 'template',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,          -- pass / fail
    reliability_score REAL,
    safety_score REAL,
    goal_adherence_score REAL,
    tool_usage_score REAL,
    correctness_score REAL,
    robustness_score REAL,
    efficiency_score REAL,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS traces (
    id TEXT PRIMARY KEY,
    evaluation_id TEXT NOT NULL,
    step_number INTEGER,
    timestamp TEXT,
    action TEXT,
    tool TEXT,
    parameters TEXT,   -- JSON
    response TEXT,     -- JSON
    status TEXT
);

CREATE TABLE IF NOT EXISTS failures (
    id TEXT PRIMARY KEY,
    evaluation_id TEXT NOT NULL,
    type TEXT,
    severity TEXT,
    description TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    evidence TEXT,
    risk TEXT,
    recommendation TEXT
);
"""


def init_db():
    fresh = not os.path.exists(DB_PATH)
    with get_db() as conn:
        conn.executescript(SCHEMA)
    if fresh:
        seed_db()


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

def seed_db():
    from engine import build_scenario_templates, run_evaluation_for_scenario

    with get_db() as conn:
        cur = conn.execute("SELECT COUNT(*) c FROM agents")
        if cur.fetchone()["c"] > 0:
            return  # already seeded

        agents = [
            {
                "id": "agent_banking",
                "name": "Banking Assistant",
                "type": "banking",
                "description": "Handles balance checks, account details, transaction history and money transfers.",
                "risk_level": "High",
                "tools": json.dumps([
                    {"name": "get_balance", "destructive": False},
                    {"name": "get_account_details", "destructive": False},
                    {"name": "verify_account", "destructive": False},
                    {"name": "transaction_history", "destructive": False},
                    {"name": "transfer_money", "destructive": True},
                ]),
                "status": "active",
                "current_version": "v1.0",
            },
            {
                "id": "agent_ecommerce",
                "name": "E-Commerce Support Agent",
                "type": "ecommerce",
                "description": "Handles order lookups, cancellations, refunds and shipping updates.",
                "risk_level": "Medium",
                "tools": json.dumps([
                    {"name": "get_order", "destructive": False},
                    {"name": "get_customer", "destructive": False},
                    {"name": "cancel_order", "destructive": True},
                    {"name": "initiate_refund", "destructive": True},
                    {"name": "update_shipping_address", "destructive": False},
                ]),
                "status": "active",
                "current_version": "v1.0",
            },
        ]
        for a in agents:
            conn.execute(
                "INSERT INTO agents (id, name, type, description, risk_level, tools, status, current_version) "
                "VALUES (:id,:name,:type,:description,:risk_level,:tools,:status,:current_version)",
                a,
            )
        conn.commit()

    # Generate deterministic scenario templates for both agents and seed evaluations
    # across two versions (v1.0 = unsafe/buggy, v1.1 = improved) so the Regression
    # and Dashboard views have real, meaningful data on first load.
    for agent_id in ["agent_banking", "agent_ecommerce"]:
        scenarios = build_scenario_templates(agent_id)
        with get_db() as conn:
            for s in scenarios:
                conn.execute(
                    "INSERT INTO scenarios (id, agent_id, title, category, severity, user_input, "
                    "expected_behavior, risk, target_tool, sim_json, source, created_at) VALUES "
                    "(:id,:agent_id,:title,:category,:severity,:user_input,:expected_behavior,:risk,"
                    ":target_tool,:sim_json,:source,:created_at)",
                    {
                        **s,
                        "sim_json": json.dumps(s["sim"]),
                        "source": "template",
                        "created_at": datetime.utcnow().isoformat(),
                    },
                )
            conn.commit()

        for version, offset_days in [("v1.0", 6), ("v1.1", 0)]:
            for s in scenarios:
                run_evaluation_for_scenario(s["id"], version=version, backdate_days=offset_days)


def get_agent(agent_id: str) -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM agents WHERE id=?", (agent_id,)).fetchone()
        return row_to_dict(row) if row else None


def list_agents() -> list:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM agents").fetchall()
        return [row_to_dict(r) for r in rows]

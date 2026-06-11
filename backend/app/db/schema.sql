-- Analysis runs: one row per /analyze invocation
CREATE TABLE IF NOT EXISTS analysis_runs (
    run_id          TEXT PRIMARY KEY,
    system_id       TEXT NOT NULL,
    system_name     TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed')),
    llm_backend     TEXT NOT NULL,
    llm_model       TEXT NOT NULL,
    started_at      TEXT NOT NULL,
    completed_at    TEXT,
    error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_status ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_started ON analysis_runs(started_at DESC);

-- Agent outputs: one row per agent per run, holds the raw JSON
CREATE TABLE IF NOT EXISTS agent_outputs (
    run_id              TEXT NOT NULL,
    agent_name          TEXT NOT NULL,
    output_json         TEXT NOT NULL,
    duration_seconds    REAL NOT NULL,
    created_at          TEXT NOT NULL,
    PRIMARY KEY (run_id, agent_name),
    FOREIGN KEY (run_id) REFERENCES analysis_runs(run_id) ON DELETE CASCADE
);

-- Systems: lightweight registry mirroring Neo4j (for fast listing without graph queries)
CREATE TABLE IF NOT EXISTS systems (
    system_id       TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    component_count INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_systems_name ON systems(name);

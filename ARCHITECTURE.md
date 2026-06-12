# Architecture

## Overview

DVAP is a multi-agent threat modeling platform that analyzes software architectures and maps
security threats to MITRE ATT&CK techniques and CIS controls. It accepts a structured description
of a system (components and data flows), runs five specialist AI agents in a LangGraph DAG, and
produces a full threat model grounded in real reference data. The entire stack runs locally via
Docker Compose; no external service other than the Gemini API is required.

---

## Component Architecture

Three containers communicate over a Docker bridge network:

```
Browser
  |
  | HTTP :3000
  v
+---------------------+
|  frontend           |  Next.js 14 App Router, React Flow canvas
|  (port 3000)        |  Tailwind CSS, shadcn/ui
+---------------------+
  |
  | HTTP :8000  (server components use http://backend:8000 internally)
  v
+---------------------+
|  backend            |  FastAPI, LangGraph orchestrator
|  (port 8000)        |  Five specialist agents
+---------------------+
       |           |
  Bolt :7687    SQLite file
       v           v
+----------+  +------------------+
|  neo4j   |  |  sqlite volume   |
|  (7474,  |  |  (dvap_sqlite_   |
|   7687)  |  |   data)          |
+----------+  +------------------+
```

The frontend uses two API clients: [frontend/lib/api.ts](frontend/lib/api.ts) for browser-side
requests (target `http://localhost:8000`) and [frontend/lib/api.server.ts](frontend/lib/api.server.ts)
for Next.js Server Components (target `http://backend:8000` on the Docker bridge).

---

## Agent Pipeline

The orchestrator is a LangGraph state machine defined in
[backend/app/orchestrator/graph.py](backend/app/orchestrator/graph.py).

```
START --> run_stride  --\
                         --> run_attack --> run_attack_tree --> run_controls --> run_finalize --> END
START --> run_maestro --/
```

STRIDE and MAESTRO fan out from START and run in parallel. LangGraph's fan-in holds `run_attack`
until both complete. From ATT&CK onward the chain is linear.

| Agent | File | Contribution |
|---|---|---|
| STRIDE | [backend/app/agents/stride.py](backend/app/agents/stride.py) | Generates threats using the STRIDE taxonomy |
| MAESTRO | [backend/app/agents/maestro.py](backend/app/agents/maestro.py) | Generates AI/agentic threats; skips if no AI components |
| ATT&CK | [backend/app/agents/attack.py](backend/app/agents/attack.py) | Matches threats to ATT&CK techniques via Neo4j query |
| Attack Tree | [backend/app/agents/attack_tree.py](backend/app/agents/attack_tree.py) | Builds attack chains from matched techniques, writes to Neo4j |
| Controls | [backend/app/agents/controls.py](backend/app/agents/controls.py) | Maps threats to CIS controls and generates remediation guidance |

All agent outputs flow through `AnalysisState`, a LangGraph `TypedDict` defined in
[backend/app/orchestrator/state.py](backend/app/orchestrator/state.py). The `errors` and `timings`
fields use reducer annotations so STRIDE and MAESTRO can write to them concurrently without conflict.
Node functions and their shared helpers live in
[backend/app/orchestrator/nodes.py](backend/app/orchestrator/nodes.py).

---

## Data Layer

Two stores with distinct roles:

**Neo4j** ([backend/app/db/neo4j_client.py](backend/app/db/neo4j_client.py)) holds the knowledge
graph and per-system topology:

- Reference data: 697 ATT&CK technique nodes (seeded by
  [backend/scripts/seed_attack.py](backend/scripts/seed_attack.py)) and 18 CIS control nodes
  (seeded by [backend/scripts/seed_controls.py](backend/scripts/seed_controls.py))
- Per-analysis data: System, Component, Threat, Technique, AttackPath, AnalysisRun, and Control
  nodes written by [backend/app/orchestrator/persistence.py](backend/app/orchestrator/persistence.py)
- Used for graph traversal: finding relevant techniques for a given threat, building attack chains,
  and serving the React Flow visualization via `GET /api/graph/{system_id}`

**SQLite** ([backend/app/db/sqlite_client.py](backend/app/db/sqlite_client.py), schema in
[backend/app/db/schema.sql](backend/app/db/schema.sql)) holds the audit trail:

- `analysis_runs`: one row per `/analyze` invocation (status, timing, model used, error message)
- `agent_outputs`: one row per agent per run, storing the raw JSON output for replay and debugging
- `systems`: a lightweight mirror of system metadata for fast listing without a graph query

The SQLite file lives on the Docker named volume `dvap_sqlite_data`.

---

## LLM Layer

All agents call the LLM through the `LLMProvider` abstract interface in
[backend/app/llm/base.py](backend/app/llm/base.py). The single required method is:

```python
async def generate_structured(system_prompt, user_prompt, schema, temperature, max_tokens) -> T
```

It returns a validated Pydantic model instance. Implementations must handle one retry on schema
validation failure before raising.

The only current implementation is `GeminiProvider` in
[backend/app/llm/gemini.py](backend/app/llm/gemini.py), which uses `gemini-2.5-flash` with
`response_mime_type: application/json` for native structured output. A concurrency semaphore caps
parallel calls at 2 to respect free-tier rate limits.

The factory function `get_llm_provider()` in [backend/app/llm/__init__.py](backend/app/llm/__init__.py)
reads `settings.llm_backend` (from `.env`) and returns the appropriate singleton.

---

## Extensibility

**Adding a new agent:** Create a file in `backend/app/agents/` following the pattern of any
existing agent. Add a node function in
[backend/app/orchestrator/nodes.py](backend/app/orchestrator/nodes.py), wire it into the graph in
[backend/app/orchestrator/graph.py](backend/app/orchestrator/graph.py), and add its output type to
`AnalysisState` in [backend/app/orchestrator/state.py](backend/app/orchestrator/state.py).

**Adding a new LLM provider:** Implement `LLMProvider` from
[backend/app/llm/base.py](backend/app/llm/base.py) in a new file under `backend/app/llm/`. Add any
required SDK to [backend/requirements.txt](backend/requirements.txt). Add a branch in
`get_llm_provider()` keyed on a new `llm_backend` value, then set that value in `.env`.

**Adding new reference data:** Write an idempotent seed script in `backend/scripts/` using Cypher
`MERGE` (not `CREATE`), following the pattern of
[backend/scripts/seed_attack.py](backend/scripts/seed_attack.py). Document it in the README
quickstart alongside the existing seed commands.

# Release Notes

## v1.0.0 (2026-06-12)

Initial public release of the Dynamic Vulnerability and Attack Path Platform (DVAP).

---

### Backend (Phase 4)

- FastAPI application with full OpenAPI documentation at `/docs`
- LangGraph 0.2 multi-agent orchestration pipeline with five specialist agents:
  - STRIDE agent: generates threats per component and data flow
  - MAESTRO agent: generates AI-specific threats (runs in parallel with STRIDE)
  - ATT&CK agent: maps threats to MITRE ATT&CK techniques, validated against Neo4j
  - Attack Tree agent: builds lateral attack chains through the component graph
  - Controls agent: maps findings to CIS Controls v8 remediation guidance
- Neo4j Community Edition 5.20 graph database seeded with 697 ATT&CK techniques
- SQLite audit trail for all analysis runs with full timing data
- `GeminiProvider` LLM abstraction backed by Gemini 2.5 Flash
- Concurrency semaphore (limit: 2) to respect free-tier rate limits
- `RateLimitError` with actionable user message when quota is exceeded
- Demo seed script (`scripts/seed_demo.py`) creates the "Acme Customer Portal" example system

### Frontend (Phase 5)

- Next.js 14 App Router with full TypeScript
- System creation form with inline Zod validation:
  - Duplicate component name detection
  - Self-flow detection (source cannot equal destination)
  - Flow reference validation (source/destination must be existing component names)
  - Field length caps (component names: 80 chars, data type/protocol: 80 chars)
- React Flow architecture canvas with interactive component and threat node visualization
- Findings page with four tabbed sections: threats, ATT&CK mappings, attack paths, controls
- SWR polling for real-time analysis status updates
- Network error detection with actionable recovery instructions
- FastAPI error detail extraction for clean error display in the creation form

### DevOps and documentation (Phase 6)

- GitHub Actions CI with three parallel jobs: pytest, TypeScript type check, Docker build
- GitHub issue templates (bug report, feature request) and PR template
- `ARCHITECTURE.md`: full system architecture reference with agent DAG and data layer split
- `README.md` rewrite with hero screenshot, working quickstart, four embedded screenshots,
  tech stack table, known limitations, and roadmap
- `SECURITY.md` and `CONTRIBUTING.md`

---

### Known limitations

- ATT&CK mapping coverage is partial. Roughly 50-75% of threats receive technique mappings
  depending on the system. Unmapped threats are reported in the `unmapped_threats` field.
- Free-tier Gemini rate limits apply. Analysis may slow under concurrent load.
- CIS Controls v8 dataset is a curated subset of 18 controls.

### Upgrade path

This is the first public release. No migration steps are required.

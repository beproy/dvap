# Contributing to DVAP

Thanks for taking an interest in the project. Contributions of all kinds are welcome: bug fixes, new features, documentation improvements, and test coverage.

## Setting Up the Dev Environment

Follow the Quickstart in [README.md](README.md). The full stack runs in Docker Compose, so you do not need to install Python or Node.js locally. Source code is bind-mounted into the containers, so changes to files under `backend/` and `frontend/` take effect immediately (the backend uses uvicorn with `--reload`).

## Running Tests

```bash
# Backend unit and integration tests
docker compose exec backend pytest -v

# A specific test file
docker compose exec backend pytest tests/test_retry_behavior.py -v
```

There are currently no frontend tests. Test additions for the frontend are welcome.

## Code Style

**Python:** Follow ruff or black defaults. Line length 100. Type annotations are expected on all public functions. The existing codebase uses them throughout; new code should match.

**TypeScript and JavaScript:** Follow Next.js defaults. No separate linting config is enforced yet; use the project's `tsconfig.json` as a guide.

## Pull Request Expectations

- **New agents:** include at least one test covering the happy path and one covering schema validation failure. See `backend/tests/test_retry_behavior.py` for the mocking pattern.
- **Schema changes:** update the relevant Pydantic model and the corresponding OpenAPI example in the schema file. If the change affects what gets stored in SQLite or Neo4j, note that in the PR description.
- **Keep PRs focused.** One logical change per PR makes review faster. Large refactors should be discussed in an issue first.
- **Write a clear PR description.** Explain what changed, why, and how you tested it.

## Responsiveness

This is an open-source hobby project maintained in spare time. PRs will be reviewed, but there is no SLA on turnaround. If you have not heard back within two weeks, feel free to leave a comment on the PR as a nudge.

## AI-Assisted Contributions

AI-assisted PRs are welcome. If you used an AI coding tool to write or edit code, that is fine. What matters is that you have read, understood, and tested the code you are submitting. Do not submit AI-generated code you have not verified yourself.

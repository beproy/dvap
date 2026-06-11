# Security Policy

## Scope of Sensitive Data

DVAP 2.0 produces security analysis output (threat models, ATT&CK mappings, attack paths). It does not collect or transmit sensitive data about the systems you analyze unless you include that data in the system description you submit. The only external network call made at runtime is to the Google Gemini API using your own API key.

## Reporting a Vulnerability

Please do not file a public GitHub issue for security vulnerabilities.

Report privately using GitHub Security Advisories:
https://github.com/beproy/dvap/security/advisories/new

Include as much detail as you can: steps to reproduce, the affected component, and the potential impact. If you are unsure whether something qualifies, report it anyway and we will triage it together.

## What Is In Scope

- Backend application code (FastAPI routes, agents, orchestrator)
- Agent system prompts (prompt injection, output manipulation)
- Dependency vulnerabilities that affect this project directly
- Docker Compose configuration (unintended port exposure, privilege issues)

## What Is Not In Scope

- Vulnerabilities in upstream dependencies themselves: report those to the relevant project maintainer
- Social engineering attacks
- Physical access attacks
- Rate-limiting or denial-of-service against the Gemini API (that is Google's infrastructure)

## Severity Scale and Response Times

This is an open-source hobby project. Response times are best-effort.

| Severity | Description | Target response |
|---|---|---|
| Critical | Remote code execution, secret exfiltration | 7 days |
| High | Auth bypass, significant data exposure | 30 days |
| Medium | Limited-impact exploits, information leakage | 30 days |
| Low | Defense-in-depth issues, hardening suggestions | Best-effort |

If a critical issue is reported and a fix is not feasible within 7 days, a mitigation note will be posted to the advisory within that window.

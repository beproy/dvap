"""
DVAP demo seed script.

Creates the "Acme Customer Portal" example system and runs a full analysis
on it so new users see real findings immediately after setup.

Safe to re-run: exits 0 without changes if any system already exists.

Usage (inside backend container):
    python scripts/seed_demo.py
"""

import json
import sys
import time
import urllib.error
import urllib.request

BASE_URL = "http://backend:8000/api"

DEMO_SYSTEM = {
    "name": "Acme Customer Portal",
    "description": "Public-facing customer support portal with auth and ticketing.",
    "components": [
        {
            "name": "Web Frontend",
            "type": "web_app",
            "description": "React SPA served via CDN",
        },
        {
            "name": "API Gateway",
            "type": "gateway",
            "description": "Routes and authenticates incoming requests",
        },
        {
            "name": "Auth Service",
            "type": "service",
            "description": "JWT issuance and validation",
        },
        {
            "name": "Customer DB",
            "type": "database",
            "description": "PostgreSQL holding customer records and tickets",
        },
    ],
    "data_flows": [
        {
            "source": "Web Frontend",
            "destination": "API Gateway",
            "data_type": "JSON over HTTPS",
            "protocol": "HTTPS",
            "is_encrypted": True,
        },
        {
            "source": "API Gateway",
            "destination": "Auth Service",
            "data_type": "JWT validation requests",
            "protocol": "gRPC",
            "is_encrypted": True,
        },
        {
            "source": "API Gateway",
            "destination": "Customer DB",
            "data_type": "SQL queries",
            "protocol": "TCP/TLS",
            "is_encrypted": True,
        },
    ],
}

ANALYZE_BODY = {
    "agents": ["stride", "maestro", "attack", "attack_tree", "controls"],
}

POLL_INTERVAL_SECONDS = 5
POLL_TIMEOUT_SECONDS = 300


def _get(path: str) -> dict:
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def _post(path: str, body: dict) -> tuple[int, dict]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read())


def main() -> None:
    # Step 1: check for existing systems
    print("Checking for existing systems...")
    systems = _get("/systems")
    if systems:
        print("Systems already exist; skipping demo seed.")
        sys.exit(0)

    # Step 2: create the demo system
    print("Creating demo system: Acme Customer Portal...")
    status_code, system = _post("/systems", DEMO_SYSTEM)
    if status_code != 201:
        print(f"ERROR: failed to create system (HTTP {status_code}): {system}")
        sys.exit(1)
    system_id = system["system_id"]
    print(f"  Created system_id: {system_id}")

    # Step 3: start the analysis
    print("Starting analysis run (all 5 agents)...")
    status_code, run = _post(f"/systems/{system_id}/analyze", ANALYZE_BODY)
    if status_code != 202:
        print(f"ERROR: failed to start analysis (HTTP {status_code}): {run}")
        sys.exit(1)
    run_id = run["run_id"]
    print(f"  Started run_id: {run_id}")
    print(f"  Polling every {POLL_INTERVAL_SECONDS}s, timeout {POLL_TIMEOUT_SECONDS}s...")

    # Step 4: poll for completion
    elapsed = 0
    while elapsed < POLL_TIMEOUT_SECONDS:
        time.sleep(POLL_INTERVAL_SECONDS)
        elapsed += POLL_INTERVAL_SECONDS
        run_status = _get(f"/analyses/{run_id}")
        status = run_status["status"]
        print(f"  [{elapsed:>3}s] status: {status}")

        if status == "completed":
            break
        if status == "failed":
            error_msg = run_status.get("error_message") or "no details available"
            print(f"ERROR: analysis run failed - {error_msg}")
            sys.exit(1)
    else:
        print(
            f"ERROR: analysis did not complete within {POLL_TIMEOUT_SECONDS} seconds. "
            f"Last status: {status}"
        )
        sys.exit(1)

    # Step 5: fetch findings and report
    findings = _get(f"/analyses/{run_id}/findings")
    threat_count = len(findings.get("threats", []))
    technique_count = len(findings.get("techniques", []))
    path_count = len(findings.get("attack_paths", []))
    control_count = len(findings.get("controls", []))

    print()
    print("Demo seed complete.")
    print(f"  System ID : {system_id}")
    print(f"  Run ID    : {run_id}")
    print(f"  Threats   : {threat_count}")
    print(f"  Techniques: {technique_count}")
    print(f"  Paths     : {path_count}")
    print(f"  Controls  : {control_count}")
    print()
    print("Open http://localhost:3000 to explore the findings.")


if __name__ == "__main__":
    main()

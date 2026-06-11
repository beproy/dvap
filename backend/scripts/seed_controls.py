"""
DVAP 2.0 — CIS Controls v8 seed script.

Reads backend/data/controls/cis_v8.json and MERGEs a Control node in Neo4j
for each entry.  Safe to re-run — uses MERGE throughout.

Usage (inside backend container):
    python scripts/seed_controls.py
"""

import json
import os
from pathlib import Path

from neo4j import GraphDatabase

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "dvap-dev-password")

_SCRIPT_DIR = Path(__file__).parent          # /app/scripts
_APP_DIR = _SCRIPT_DIR.parent               # /app
CONTROLS_FILE = _APP_DIR / "data" / "controls" / "cis_v8.json"


def load_controls() -> list[dict]:
    with open(CONTROLS_FILE, encoding="utf-8") as f:
        controls = json.load(f)
    print(f"[parse]   Loaded {len(controls)} controls from {CONTROLS_FILE}")
    return controls


def seed(driver, controls: list[dict]) -> None:
    with driver.session() as session:
        session.run(
            """
            UNWIND $controls AS c
            MERGE (n:Control {id: c.id})
            SET n.framework   = c.framework,
                n.control_id  = c.control_id,
                n.name        = c.name,
                n.description = c.description,
                n.category    = c.category
            """,
            controls=controls,
        )
    print(f"[seed]    MERGE complete — {len(controls)} Control nodes upserted")


def report_count(driver) -> int:
    with driver.session() as session:
        record = session.run("MATCH (c:Control) RETURN count(c) AS total").single()
        return record["total"] if record else 0


def main() -> None:
    controls = load_controls()

    print(f"[connect] Connecting to Neo4j at {NEO4J_URI}…")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        driver.verify_connectivity()
        print("[connect] Neo4j connection verified")

        seed(driver, controls)

        total = report_count(driver)
        print(f"\n[result]  Control node count in Neo4j: {total}")
    finally:
        driver.close()


if __name__ == "__main__":
    main()

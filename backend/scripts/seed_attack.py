"""
DVAP: MITRE ATT&CK seed script.

Downloads enterprise-attack.json from MITRE GitHub (skip if cached),
parses STIX attack-pattern objects, and MERGEs Technique nodes into Neo4j.
Also creates :SUBTECHNIQUE_OF edges from STIX subtechnique-of relationships.

Safe to re-run — uses MERGE throughout.

Usage (inside backend container):
    python scripts/seed_attack.py
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

from neo4j import GraphDatabase

# ---------------------------------------------------------------------------
# Configuration — mirrors app/config.py defaults; override via env vars
# ---------------------------------------------------------------------------
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "dvap-dev-password")

ATTACK_URL = (
    "https://github.com/mitre-attack/attack-stix-data"
    "/raw/master/enterprise-attack/enterprise-attack.json"
)
_SCRIPT_DIR = Path(__file__).parent          # /app/scripts
_APP_DIR = _SCRIPT_DIR.parent               # /app
DATA_DIR = _APP_DIR / "data" / "attack"
ATTACK_FILE = DATA_DIR / "enterprise-attack.json"

BATCH_SIZE = 100


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def download_if_needed() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if ATTACK_FILE.exists():
        size_mb = ATTACK_FILE.stat().st_size // (1024 * 1024)
        print(f"[skip] {ATTACK_FILE} already exists ({size_mb} MB) — skipping download")
        return

    print(f"[download] Fetching enterprise-attack.json from MITRE GitHub (~40-50 MB)…")
    print(f"           URL: {ATTACK_URL}")

    def _report(block_count: int, block_size: int, total_size: int) -> None:
        downloaded = block_count * block_size
        if total_size > 0:
            pct = min(downloaded * 100 // total_size, 100)
            sys.stdout.write(f"\r           {pct}%  ({downloaded // (1024*1024)} MB / {total_size // (1024*1024)} MB)")
            sys.stdout.flush()

    urllib.request.urlretrieve(ATTACK_URL, ATTACK_FILE, reporthook=_report)
    print()  # newline after progress bar
    size_mb = ATTACK_FILE.stat().st_size // (1024 * 1024)
    print(f"[done]     Saved to {ATTACK_FILE} ({size_mb} MB)")


# ---------------------------------------------------------------------------
# STIX parsing helpers
# ---------------------------------------------------------------------------

def _attack_id(obj: dict) -> str:
    for ref in obj.get("external_references", []):
        if ref.get("source_name") == "mitre-attack":
            return ref.get("external_id", "")
    return ""


def _attack_url(obj: dict) -> str:
    for ref in obj.get("external_references", []):
        if ref.get("source_name") == "mitre-attack":
            return ref.get("url", "")
    return ""


def _tactic(obj: dict) -> str:
    for phase in obj.get("kill_chain_phases", []):
        if phase.get("kill_chain_name") == "mitre-attack":
            return phase.get("phase_name", "")
    return ""


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------

def seed_techniques(driver, objects: list) -> dict:
    """MERGE Technique nodes; return {stix_id: attack_id} map for relationship step."""
    techniques = []
    stix_to_attack: dict[str, str] = {}

    for obj in objects:
        if obj.get("type") != "attack-pattern":
            continue
        if obj.get("revoked") or obj.get("x_mitre_deprecated"):
            continue
        attack_id = _attack_id(obj)
        if not attack_id:
            continue

        stix_to_attack[obj["id"]] = attack_id
        techniques.append({
            "id": attack_id,
            "name": obj.get("name", ""),
            "tactic": _tactic(obj),
            "description": obj.get("description", ""),
            "url": _attack_url(obj),
        })

    print(f"[techniques] Parsed {len(techniques)} active (non-revoked) techniques")

    with driver.session() as session:
        for i in range(0, len(techniques), BATCH_SIZE):
            batch = techniques[i : i + BATCH_SIZE]
            session.run(
                """
                UNWIND $batch AS t
                MERGE (n:Technique {id: t.id})
                SET n.name        = t.name,
                    n.tactic      = t.tactic,
                    n.description = t.description,
                    n.url         = t.url
                """,
                batch=batch,
            )

    print(f"[techniques] MERGE complete — {len(techniques)} Technique nodes upserted")
    return stix_to_attack


def seed_relationships(driver, objects: list, stix_to_attack: dict) -> None:
    """Create :SUBTECHNIQUE_OF edges from STIX subtechnique-of relationships."""
    pairs = []
    for obj in objects:
        if obj.get("type") != "relationship":
            continue
        if obj.get("relationship_type") != "subtechnique-of":
            continue
        child_id = stix_to_attack.get(obj.get("source_ref", ""))
        parent_id = stix_to_attack.get(obj.get("target_ref", ""))
        if child_id and parent_id:
            pairs.append({"child": child_id, "parent": parent_id})

    print(f"[relationships] Parsed {len(pairs)} subtechnique-of relationships")

    with driver.session() as session:
        for i in range(0, len(pairs), BATCH_SIZE):
            batch = pairs[i : i + BATCH_SIZE]
            session.run(
                """
                UNWIND $batch AS r
                MATCH (child:Technique  {id: r.child})
                MATCH (parent:Technique {id: r.parent})
                MERGE (child)-[:SUBTECHNIQUE_OF]->(parent)
                """,
                batch=batch,
            )

    print(f"[relationships] MERGE complete — {len(pairs)} :SUBTECHNIQUE_OF edges upserted")


def report_count(driver) -> int:
    with driver.session() as session:
        record = session.run("MATCH (t:Technique) RETURN count(t) AS total").single()
        return record["total"] if record else 0


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    download_if_needed()

    print("[parse]   Loading STIX bundle (this may take a few seconds)…")
    with open(ATTACK_FILE, encoding="utf-8") as f:
        bundle = json.load(f)
    objects = bundle["objects"]
    print(f"[parse]   Loaded {len(objects)} STIX objects")

    print(f"[connect] Connecting to Neo4j at {NEO4J_URI}…")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        driver.verify_connectivity()
        print("[connect] Neo4j connection verified")

        stix_to_attack = seed_techniques(driver, objects)
        seed_relationships(driver, objects, stix_to_attack)

        total = report_count(driver)
        print(f"\n[result]  Technique node count in Neo4j: {total}")
    finally:
        driver.close()


if __name__ == "__main__":
    main()

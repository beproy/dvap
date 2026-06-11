import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.config import settings

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def init_db() -> None:
    """Create the SQLite file and apply schema.sql (idempotent — uses IF NOT EXISTS)."""
    Path(settings.sqlite_path).parent.mkdir(parents=True, exist_ok=True)
    schema = _SCHEMA_PATH.read_text()
    conn = sqlite3.connect(settings.sqlite_path)
    try:
        conn.executescript(schema)
    finally:
        conn.close()


@contextmanager
def db_conn():
    """Yield a sqlite3 connection with foreign keys enabled and auto commit/rollback."""
    conn = sqlite3.connect(settings.sqlite_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

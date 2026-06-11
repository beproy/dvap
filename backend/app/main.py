"""
DVAP 2.0 — FastAPI entry point.
Phase 4: LangGraph orchestrator compiled at startup after Neo4j is ready.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analyses import router as analyses_router
from app.api.graph import router as graph_router
from app.api.health import router as health_router
from app.api.reference import router as reference_router
from app.api.systems import router as systems_router
from app.db.neo4j_client import close_neo4j, init_neo4j
from app.db.sqlite_client import init_db
from app.orchestrator.graph import get_orchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    await init_neo4j()
    get_orchestrator()  # compile once at startup; subsequent calls return the cached instance
    yield
    await close_neo4j()


app = FastAPI(
    title="DVAP 2.0 API",
    description="Dynamic Vulnerability & Attack Path Platform",
    version="0.1.0-phase4",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /api/systems, /api/systems/{id}/graph, /api/systems/{id}/analyze, etc.
app.include_router(systems_router, prefix="/api")
app.include_router(analyses_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(reference_router, prefix="/api")

# /api/health/neo4j and /api/health/llm (health_router already has prefix="/health")
app.include_router(health_router, prefix="/api")


@app.get("/", tags=["root"])
async def root():
    return {"message": "DVAP 2.0 backend is running", "phase": 4}


@app.get("/health", tags=["root"])
async def health():
    return {"status": "ok"}

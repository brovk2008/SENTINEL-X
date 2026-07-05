"""
SafetyOS — FastAPI Main Application
The brain of the world's first AI Operating System for industrial safety.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import init_db
from core.redis_client import init_redis
from core.neo4j_client import init_neo4j
from core.chroma_client import init_chroma

from api.routes import (
    sensors, agents, knowledge, incidents, permits,
    cameras, compliance, notifications, reports, websocket,
    workers, plants, analytics, settings_router
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger("safetyos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 SafetyOS starting up...")

    # Initialize databases
    await init_db()
    logger.info("✅ PostgreSQL initialized")

    await init_redis()
    logger.info("✅ Redis connected")

    await init_neo4j()
    logger.info("✅ Neo4j connected")

    await init_chroma()
    logger.info("✅ ChromaDB initialized")

    # Start background services
    from services.sensor_simulator import start_sensor_simulator
    from services.compound_risk_monitor import start_risk_monitor
    from services.mqtt_service import start_mqtt_client

    asyncio.create_task(start_mqtt_client())
    asyncio.create_task(start_sensor_simulator())
    asyncio.create_task(start_risk_monitor())

    logger.info("✅ Background services started")
    logger.info("🟢 SafetyOS is ONLINE — The factory has a brain.")

    yield

    logger.info("🔴 SafetyOS shutting down...")


app = FastAPI(
    title="SafetyOS API",
    description="AI Operating System for Industrial Safety",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routes ──────────────────────────────────────────────────────────────────
app.include_router(websocket.router, tags=["WebSocket"])
app.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])
app.include_router(agents.router, prefix="/agents", tags=["AI Agents"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge RAG"])
app.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
app.include_router(permits.router, prefix="/permits", tags=["Permits"])
app.include_router(cameras.router, prefix="/cameras", tags=["Cameras"])
app.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(workers.router, prefix="/workers", tags=["Workers"])
app.include_router(plants.router, prefix="/plants", tags=["Plants"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(settings_router.router, prefix="/settings", tags=["Settings"])


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "SafetyOS API",
        "version": "1.0.0",
        "message": "The factory has a brain."
    }

"""
SafetyOS — FastAPI Main Application
The brain of the world's first AI Operating System for industrial safety.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

import sys
from pathlib import Path
# Ensure backend package dir is on sys.path so 'core' imports resolve when running as module
sys.path.insert(0, str(Path(__file__).resolve().parent))

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
    workers, plants, analytics, settings_router,
    biometrics, rtls, dispersion
)

# Connectivity routes (connectivity manager skeleton)
from api.routes import connectivity

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger("safetyos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 SafetyOS starting up...")

    # Mount HLS static folder so local ffmpeg outputs can be served (frontend/public/hls)
    try:
        from pathlib import Path
        hls_dir = Path(__file__).resolve().parents[1] / 'frontend' / 'public' / 'hls'
        hls_dir.mkdir(parents=True, exist_ok=True)
        app.mount('/hls', StaticFiles(directory=str(hls_dir)), name='hls')
        logger.info(f"Mounted HLS static directory: {hls_dir}")
    except Exception:
        logger.warning("Could not mount default HLS directory, creating local fallback...")
        try:
            fallback_dir = Path(__file__).resolve().parent / 'hls_temp'
            fallback_dir.mkdir(parents=True, exist_ok=True)
            app.mount('/hls', StaticFiles(directory=str(fallback_dir)), name='hls')
            logger.info(f"Mounted fallback HLS static directory: {fallback_dir}")
        except Exception:
            logger.exception("Failed to mount fallback HLS directory")

    # Register connectivity connectors (MQTT, Simulated)
    try:
        from integrations import connectivity_manager as conn
        # Register connectors implemented in connectivity_manager
        conn.manager.register_connector(conn.ProtocolType.SIMULATED, conn._simulated_mqtt_connector)
        conn.manager.register_connector(conn.ProtocolType.MQTT, conn._mqtt_connector)
        conn.manager.register_connector(conn.ProtocolType.OPC_UA, conn._opcua_connector)
        logger.info("Connectivity connectors registered")

        # Optionally start demo connectivity if configured
        if getattr(settings, 'DEMO_CONNECTIVITY', False):
            # Add a default simulated source and start connectors
            demo_src = conn.DataSource(
                id='sim-plant-mqtt',
                name='Simulated MQTT Broker',
                protocol=conn.ProtocolType.SIMULATED,
                host='localhost',
                port=1883,
                config={'interval': 2}
            )
            await conn.manager.add_source(demo_src)
            await conn.manager.connect_all()
            logger.info('Demo connectivity started')
    except Exception:
        logger.exception('Failed to register/connect connectivity manager')

    # Start background services
    # In DEMO_FAST_START mode we avoid initializing heavy infra (Postgres, Neo4j, Chroma)
    if getattr(settings, 'DEMO_FAST_START', False):
        logger.info('DEMO_FAST_START enabled — skipping heavy infra initialization')
        # Ensure Redis (or fallback) is initialized for state storage
        try:
            await init_redis()
            logger.info('✅ Redis (or fallback) ready')
        except Exception:
            logger.exception('Redis init failed in demo mode')

        # Start lightweight background services that are safe to run in demo mode
        try:
            from services.sensor_simulator import start_sensor_simulator
            asyncio.create_task(start_sensor_simulator())
            logger.info('✅ Sensor simulator started (demo mode)')
        except Exception:
            logger.exception('Failed to start sensor simulator in demo mode')

    else:
        # Full initialization path
        await init_db()
        logger.info("✅ PostgreSQL initialized")

        await init_redis()
        logger.info("✅ Redis connected")

        await init_neo4j()
        logger.info("✅ Neo4j connected")

        await init_chroma()
        logger.info("✅ ChromaDB initialized")

        from services.sensor_simulator import start_sensor_simulator
        from services.compound_risk_monitor import start_risk_monitor
        from services.mqtt_service import start_mqtt_client

        asyncio.create_task(start_mqtt_client())
        asyncio.create_task(start_sensor_simulator())
        asyncio.create_task(start_risk_monitor())

        logger.info("✅ Background services started")

    logger.info("🟢 SafetyOS is ONLINE — The factory has a brain.")

    yield

    # Shutdown connectivity manager
    try:
        from integrations import connectivity_manager as conn
        await conn.manager.stop_all()
        logger.info('Connectivity manager stopped')
    except Exception:
        logger.exception('Error shutting down connectivity manager')

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
app.include_router(connectivity.router, prefix="/connectivity", tags=["Connectivity"]) 
app.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(workers.router, prefix="/workers", tags=["Workers"])
app.include_router(plants.router, prefix="/plants", tags=["Plants"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(settings_router.router, prefix="/settings", tags=["Settings"])
app.include_router(biometrics.router, prefix="/biometrics", tags=["Biometrics"])
app.include_router(rtls.router, prefix="/rtls", tags=["RTLS"])
app.include_router(dispersion.router, prefix="/dispersion", tags=["Dispersion"])


@app.get("/")
async def root_welcome():
    return {
        "status": "online",
        "service": "SafetyOS API",
        "version": "1.0.0",
        "message": "The factory has a brain. Access API documentation at /docs or health status at /health"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "SafetyOS API",
        "version": "1.0.0",
        "message": "The factory has a brain."
    }

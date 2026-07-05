"""Sensor API routes."""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.database import get_db
from core.redis_client import get_state, SENSOR_STATE_KEY
from services.sensor_simulator import SENSOR_CONFIGS, inject_anomaly

logger = logging.getLogger(__name__)
router = APIRouter()


class AnomalyRequest(BaseModel):
    sensor_id: str
    target_value: float
    duration_seconds: int = 300


@router.get("/")
async def list_sensors():
    """Get all sensors with current readings."""
    current_state = await get_state(SENSOR_STATE_KEY) or {}

    sensors = []
    for config in SENSOR_CONFIGS:
        reading = current_state.get(config["id"], {})
        sensors.append({
            "sensor_id": config["id"],
            "name": config["name"],
            "type": config["type"],
            "unit": config["unit"],
            "zone": config["zone"],
            "value": reading.get("value", config["baseline"]),
            "risk_level": reading.get("risk_level", "LOW"),
            "warning_threshold": config["warning"],
            "critical_threshold": config["critical"],
            "normal_range": config["normal"],
            "is_online": True,
            "timestamp": reading.get("timestamp", datetime.utcnow().isoformat()),
        })

    return {"sensors": sensors, "total": len(sensors)}


@router.get("/current")
async def get_current_readings():
    """Get current readings for all sensors (Redis snapshot)."""
    state = await get_state(SENSOR_STATE_KEY) or {}
    return {"readings": state, "timestamp": datetime.utcnow().isoformat()}


@router.get("/{sensor_id}")
async def get_sensor(sensor_id: str):
    """Get specific sensor with current reading."""
    state = await get_state(SENSOR_STATE_KEY) or {}
    sensor_config = next((s for s in SENSOR_CONFIGS if s["id"] == sensor_id), None)
    if not sensor_config:
        raise HTTPException(status_code=404, detail=f"Sensor {sensor_id} not found")

    reading = state.get(sensor_id, {})
    return {**sensor_config, **reading}


@router.get("/{sensor_id}/history")
async def get_sensor_history(
    sensor_id: str,
    hours: int = Query(default=24, ge=1, le=168),
    db: AsyncSession = Depends(get_db)
):
    """Get time-series history for a sensor. Generates synthetic history if DB empty."""
    from services.sensor_simulator import _get_simulated_value
    import math
    import random

    config = next((s for s in SENSOR_CONFIGS if s["id"] == sensor_id), None)
    if not config:
        raise HTTPException(status_code=404, detail="Sensor not found")

    # Generate synthetic history (last N hours at 2-minute intervals)
    points = []
    now = datetime.utcnow()
    intervals = hours * 30  # 2-minute intervals

    baseline = config["baseline"]
    current = baseline

    for i in range(intervals, 0, -1):
        t_offset = timedelta(minutes=i * 2)
        timestamp = now - t_offset
        t = i * 2

        noise = random.gauss(0, baseline * 0.015)
        drift = baseline * 0.03 * math.sin(t / 120)
        current = current + noise * 0.3 + drift * 0.05
        lo, hi = config["normal"]
        current = max(lo * 0.5, min(hi * 1.2, current))

        risk_level = "LOW"
        if current >= config["critical"]:
            risk_level = "CRITICAL"
        elif current >= config["warning"]:
            risk_level = "HIGH"
        elif current > hi:
            risk_level = "MEDIUM"

        points.append({
            "timestamp": timestamp.isoformat(),
            "value": round(current, 2),
            "risk_level": risk_level,
        })

    return {
        "sensor_id": sensor_id,
        "sensor_name": config["name"],
        "unit": config["unit"],
        "hours": hours,
        "data_points": len(points),
        "history": points,
    }


@router.post("/inject-anomaly")
async def inject_sensor_anomaly(request: AnomalyRequest):
    """Inject an anomaly into a sensor for demo purposes."""
    await inject_anomaly(request.sensor_id, request.target_value, request.duration_seconds)
    return {
        "message": f"Anomaly injected into {request.sensor_id}",
        "target_value": request.target_value,
        "duration_seconds": request.duration_seconds,
    }


@router.post("/demo/trigger-crisis")
async def trigger_demo_crisis():
    """Trigger the full demo crisis scenario — Zone C compound risk."""
    await inject_anomaly("H2S-ZC-01", 45.0, 600)
    await inject_anomaly("H2S-ZC-02", 42.0, 600)
    await inject_anomaly("VIB-C301", 9.2, 600)
    await inject_anomaly("TEMP-C301", 138.0, 600)

    return {
        "message": "Demo crisis triggered — Zone C compound risk scenario active",
        "sensors_affected": ["H2S-ZC-01", "H2S-ZC-02", "VIB-C301", "TEMP-C301"],
        "duration_seconds": 600,
    }

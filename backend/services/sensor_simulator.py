"""
Sensor Simulator — Generates realistic MQTT sensor data.
Runs as a background task, simulating 20+ sensors in a petrochemical plant.
Includes scheduled anomaly injection for demos.
"""
import asyncio
import json
import logging
import math
import random
from datetime import datetime, timedelta
from typing import Dict, List

import paho.mqtt.client as mqtt

from core.config import settings
from core.redis_client import get_state, set_state, SENSOR_STATE_KEY
from core.websocket_manager import manager

logger = logging.getLogger(__name__)

# ─── Sensor Configuration ────────────────────────────────────────────────────
SENSOR_CONFIGS = [
    # Gas sensors — Zone A (Tank Farm)
    {"id": "H2S-ZA-01", "name": "H2S Monitor — Tank Farm North", "type": "gas", "unit": "ppm",
     "zone": "ZA", "normal": (0, 8), "warning": 15, "critical": 25, "baseline": 2.1},
    {"id": "LEL-ZA-01", "name": "LEL Detector — Tank Farm", "type": "gas", "unit": "%LEL",
     "zone": "ZA", "normal": (0, 10), "warning": 20, "critical": 40, "baseline": 1.5},

    # Gas sensors — Zone B (Process Unit)
    {"id": "H2S-ZB-01", "name": "H2S Monitor — Process Unit", "type": "gas", "unit": "ppm",
     "zone": "ZB", "normal": (0, 10), "warning": 20, "critical": 30, "baseline": 3.4},
    {"id": "CO-ZB-01", "name": "CO Monitor — Process Unit", "type": "gas", "unit": "ppm",
     "zone": "ZB", "normal": (0, 25), "warning": 35, "critical": 50, "baseline": 8.2},
    {"id": "LEL-ZB-01", "name": "LEL Detector — Process Unit", "type": "gas", "unit": "%LEL",
     "zone": "ZB", "normal": (0, 8), "warning": 15, "critical": 30, "baseline": 0.8},

    # Gas sensors — Zone C (Compressor Bay) — Primary demo zone
    {"id": "H2S-ZC-01", "name": "H2S Monitor — Compressor Bay Primary", "type": "gas", "unit": "ppm",
     "zone": "ZC", "normal": (0, 10), "warning": 25, "critical": 35, "baseline": 3.2},
    {"id": "H2S-ZC-02", "name": "H2S Monitor — Compressor Bay Secondary", "type": "gas", "unit": "ppm",
     "zone": "ZC", "normal": (0, 10), "warning": 25, "critical": 35, "baseline": 2.8},
    {"id": "LEL-ZC-01", "name": "LEL Detector — Compressor Bay", "type": "gas", "unit": "%LEL",
     "zone": "ZC", "normal": (0, 10), "warning": 20, "critical": 35, "baseline": 2.1},

    # Temperature sensors
    {"id": "TEMP-P203", "name": "Temperature — Pump P-203 Bearing", "type": "temperature", "unit": "°C",
     "zone": "ZB", "normal": (55, 85), "warning": 95, "critical": 110, "baseline": 67.3},
    {"id": "TEMP-C301", "name": "Temperature — Compressor C-301 Discharge", "type": "temperature", "unit": "°C",
     "zone": "ZC", "normal": (80, 120), "warning": 135, "critical": 150, "baseline": 102.1},
    {"id": "TEMP-HX501", "name": "Temperature — Heat Exchanger HX-501 Outlet", "type": "temperature", "unit": "°C",
     "zone": "ZB", "normal": (40, 70), "warning": 80, "critical": 95, "baseline": 52.8},

    # Pressure sensors
    {"id": "PRESS-L301", "name": "Pressure — Pipeline L-301", "type": "pressure", "unit": "bar",
     "zone": "ZB", "normal": (3.5, 6.0), "warning": 7.0, "critical": 8.5, "baseline": 4.8},
    {"id": "PRESS-C301", "name": "Suction Pressure — Compressor C-301", "type": "pressure", "unit": "bar",
     "zone": "ZC", "normal": (1.5, 3.5), "warning": 4.5, "critical": 5.5, "baseline": 2.3},
    {"id": "PRESS-V401", "name": "Tank Pressure — V-401 Crude Storage", "type": "pressure", "unit": "mbarg",
     "zone": "ZA", "normal": (20, 80), "warning": 100, "critical": 130, "baseline": 45.2},

    # Vibration sensors
    {"id": "VIB-P203", "name": "Vibration — Pump P-203 DE", "type": "vibration", "unit": "mm/s",
     "zone": "ZB", "normal": (0, 4.5), "warning": 7.1, "critical": 11.2, "baseline": 2.1},
    {"id": "VIB-C301", "name": "Vibration — Compressor C-301", "type": "vibration", "unit": "mm/s",
     "zone": "ZC", "normal": (0, 5.0), "warning": 8.0, "critical": 12.0, "baseline": 3.4},
    {"id": "VIB-C302", "name": "Vibration — Compressor C-302", "type": "vibration", "unit": "mm/s",
     "zone": "ZC", "normal": (0, 5.0), "warning": 8.0, "critical": 12.0, "baseline": 2.9},

    # Environmental
    {"id": "HUM-ZC-01", "name": "Humidity — Compressor Bay", "type": "humidity", "unit": "%RH",
     "zone": "ZC", "normal": (20, 70), "warning": 80, "critical": 90, "baseline": 48.3},
    {"id": "FLOW-L301", "name": "Flow Rate — Process Feed Line L-301", "type": "flow", "unit": "m³/h",
     "zone": "ZB", "normal": (80, 150), "warning": 165, "critical": 180, "baseline": 112.4},
    {"id": "LEVEL-V401", "name": "Level — Crude Storage Tank V-401", "type": "level", "unit": "%",
     "zone": "ZA", "normal": (20, 80), "warning": 85, "critical": 92, "baseline": 62.1},
    {"id": "CURR-P203", "name": "Motor Current — Pump P-203", "type": "current", "unit": "A",
     "zone": "ZB", "normal": (12, 18), "warning": 20, "critical": 24, "baseline": 14.8},
]

# Track current simulated values
_current_values: Dict[str, float] = {}
_anomaly_overrides: Dict[str, float] = {}

_mqtt_client = None


def _get_simulated_value(sensor: dict, t: float) -> float:
    """Generate realistic sensor value with noise and drift."""
    baseline = sensor["baseline"]
    sensor_id = sensor["id"]

    if sensor_id in _anomaly_overrides:
        target = _anomaly_overrides[sensor_id]
        current = _current_values.get(sensor_id, baseline)
        # Gradually approach anomaly value
        new_val = current + (target - current) * 0.15
        _current_values[sensor_id] = new_val
        return round(new_val, 2)

    # Normal operation: small random walk around baseline
    prev = _current_values.get(sensor_id, baseline)
    noise = random.gauss(0, baseline * 0.015)  # 1.5% noise
    # Slow drift using sine wave
    drift = baseline * 0.03 * math.sin(t / 300 + hash(sensor_id) % 100)
    new_val = prev + noise + drift * 0.1
    # Clamp to reasonable range
    lo, hi = sensor["normal"]
    new_val = max(lo * 0.5, min(hi * 1.3, new_val))
    _current_values[sensor_id] = new_val
    return round(new_val, 2)


def _get_risk_level(sensor: dict, value: float) -> str:
    if value >= sensor["critical"]:
        return "CRITICAL"
    elif value >= sensor["warning"]:
        return "HIGH"
    elif value > sensor["normal"][1]:
        return "MEDIUM"
    return "LOW"


async def inject_anomaly(sensor_id: str, target_value: float, duration_seconds: int = 300):
    """Inject an anomaly into a sensor for demo purposes."""
    _anomaly_overrides[sensor_id] = target_value
    logger.info(f"Anomaly injected: {sensor_id} → {target_value}")

    # Auto-clear after duration
    async def clear_anomaly():
        await asyncio.sleep(duration_seconds)
        _anomaly_overrides.pop(sensor_id, None)
        logger.info(f"Anomaly cleared: {sensor_id}")

    asyncio.create_task(clear_anomaly())


async def start_sensor_simulator():
    """Main sensor simulation loop — generates data every 2 seconds."""
    logger.info("Sensor simulator starting...")
    t = 0

    while True:
        try:
            all_readings = {}
            for sensor in SENSOR_CONFIGS:
                value = _get_simulated_value(sensor, t)
                risk_level = _get_risk_level(sensor, value)

                reading = {
                    "sensor_id": sensor["id"],
                    "name": sensor["name"],
                    "type": sensor["type"],
                    "unit": sensor["unit"],
                    "zone": sensor["zone"],
                    "value": value,
                    "risk_level": risk_level,
                    "warning_threshold": sensor["warning"],
                    "critical_threshold": sensor["critical"],
                    "normal_range": sensor["normal"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "is_anomaly": risk_level in ("HIGH", "CRITICAL"),
                }
                all_readings[sensor["id"]] = reading

            # Store in Redis
            await set_state(SENSOR_STATE_KEY, all_readings)

            # Broadcast via WebSocket
            await manager.send_sensor_update(all_readings)

            t += 2
        except Exception as e:
            logger.error(f"Sensor simulator error: {e}")

        await asyncio.sleep(2)


async def start_mqtt_client():
    """Connect to MQTT broker and republish sensor data."""
    logger.info("MQTT client starting...")
    # MQTT runs in background — sensor data also published to broker
    # for external integrations
    try:
        import paho.mqtt.client as mqtt_lib
        client = mqtt_lib.Client(client_id="safetyos-simulator")
        client.connect(settings.MQTT_HOST, settings.MQTT_PORT, keepalive=60)
        client.loop_start()
        logger.info("MQTT client connected")
    except Exception as e:
        logger.warning(f"MQTT unavailable: {e} — continuing without MQTT")

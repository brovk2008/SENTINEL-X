"""
Sentinel X — Realistic Sensor Simulator
=========================================
Generates sensor data that behaves like real industrial sensors.

Key principles:
  - Values drift slowly using random walk + mean reversion (not random jumps)
  - Occasional spike anomalies (1-2% of readings)
  - Correlated readings (temperature and pressure drift together)
  - Demo scenario: H2S Zone C escalation trigger
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timezone
from typing import Dict, Optional


class RealisticSensorSimulator:
    """
    Simulates a set of industrial plant sensors using random walk with drift.
    State is persistent across calls — values change smoothly over time.
    """

    # Sensor configuration: (normal_lo, normal_hi, warn_threshold, crit_threshold, unit, drift_rate)
    SENSOR_CONFIG: Dict[str, dict] = {
        "H2S-ZC-01":  {"lo": 0.0,  "hi": 8.0,  "warn": 10.0, "crit": 25.0,  "unit": "ppm",   "drift": 0.08,  "corr_group": "h2s"},
        "H2S-ZC-02":  {"lo": 0.0,  "hi": 8.0,  "warn": 10.0, "crit": 25.0,  "unit": "ppm",   "drift": 0.07,  "corr_group": "h2s"},
        "CO-ZB-01":   {"lo": 0.0,  "hi": 20.0, "warn": 25.0, "crit": 50.0,  "unit": "ppm",   "drift": 0.15,  "corr_group": None},
        "LEL-ZC-01":  {"lo": 0.0,  "hi": 5.0,  "warn": 10.0, "crit": 25.0,  "unit": "%LEL",  "drift": 0.05,  "corr_group": "h2s"},
        "TEMP-P203":  {"lo": 65.0, "hi": 90.0, "warn": 95.0, "crit": 110.0, "unit": "\u00b0C",    "drift": 0.30,  "corr_group": "thermal"},
        "VIB-C301":   {"lo": 0.0,  "hi": 5.0,  "warn": 7.0,  "crit": 11.0,  "unit": "mm/s",  "drift": 0.06,  "corr_group": None},
        "PRESS-L301": {"lo": 3.5,  "hi": 5.5,  "warn": 6.2,  "crit": 7.5,   "unit": "bar",   "drift": 0.04,  "corr_group": "thermal"},
        "TEMP-ZC":    {"lo": 40.0, "hi": 50.0, "warn": 55.0, "crit": 65.0,  "unit": "\u00b0C",    "drift": 0.20,  "corr_group": "thermal"},
        "FLOW-MAIN":  {"lo": 60.0, "hi": 85.0, "warn": 90.0, "crit": 100.0, "unit": "m\u00b3/h",  "drift": 0.40,  "corr_group": None},
        "HUM-ZA":     {"lo": 50.0, "hi": 75.0, "warn": 82.0, "crit": 90.0,  "unit": "%RH",   "drift": 0.20,  "corr_group": None},
    }

    # Initial realistic values for each sensor
    INITIAL_VALUES: Dict[str, float] = {
        "H2S-ZC-01":  3.2,
        "H2S-ZC-02":  2.8,
        "CO-ZB-01":   8.1,
        "LEL-ZC-01":  2.4,
        "TEMP-P203":  72.3,
        "VIB-C301":   4.6,
        "PRESS-L301": 4.16,
        "TEMP-ZC":    44.2,
        "FLOW-MAIN":  73.2,
        "HUM-ZA":     62.9,
    }

    def __init__(self) -> None:
        # Persistent state per sensor
        self._state: Dict[str, dict] = {
            sid: {"value": v, "trend": 0.0}
            for sid, v in self.INITIAL_VALUES.items()
        }
        # Shared correlation noise per group
        self._group_noise: Dict[str, float] = {}

        # Demo scenario state
        self._scenario_active: bool = False
        self._scenario_progress: float = 0.0  # 0-100

    # ── Public API ─────────────────────────────────────────────────────────────

    def tick(self) -> Dict[str, dict]:
        """
        Advance simulation by one tick and return all sensor readings.
        Call every 2-5 seconds for realistic telemetry behavior.
        """
        # Update shared group noise
        self._group_noise = {
            "h2s":     random.gauss(0, 0.04),
            "thermal": random.gauss(0, 0.08),
        }

        readings = {}
        for sensor_id, cfg in self.SENSOR_CONFIG.items():
            readings[sensor_id] = self._tick_sensor(sensor_id, cfg)

        return readings

    def trigger_demo_scenario(self) -> None:
        """
        Start the H2S Zone C escalation demo:
        H2S sensors climb from ~3 ppm toward 45 ppm over ~90 seconds.
        """
        self._scenario_active = True
        self._scenario_progress = 0.0

    def reset_demo_scenario(self) -> None:
        """Reset sensor values and cancel demo scenario."""
        self._scenario_active = False
        self._scenario_progress = 0.0
        for sid, v in self.INITIAL_VALUES.items():
            self._state[sid]["value"] = v
            self._state[sid]["trend"] = 0.0

    @property
    def scenario_active(self) -> bool:
        return self._scenario_active

    @property
    def scenario_progress(self) -> float:
        return self._scenario_progress

    # ── Private helpers ────────────────────────────────────────────────────────

    def _tick_sensor(self, sensor_id: str, cfg: dict) -> dict:
        state = self._state[sensor_id]
        lo, hi = cfg["lo"], cfg["hi"]
        drift_rate = cfg["drift"]
        group = cfg.get("corr_group")

        # Slowly update trend direction
        state["trend"] += random.gauss(0, 0.02)
        state["trend"] = max(-0.12, min(0.12, state["trend"]))

        # Random noise + trend + mean reversion
        mean = (lo + hi) / 2.0
        noise = random.gauss(0, drift_rate * 0.35)
        group_noise = self._group_noise.get(group, 0.0) if group else 0.0
        reversion = (mean - state["value"]) * 0.007

        state["value"] += state["trend"] * drift_rate + noise + group_noise + reversion

        # Demo scenario: push H2S sensors upward
        if self._scenario_active and cfg.get("corr_group") == "h2s":
            self._scenario_progress = min(100.0, self._scenario_progress + 1.5)
            target = 45.0 * (self._scenario_progress / 100.0)
            state["value"] = max(state["value"], target * 0.85 + random.gauss(0, 0.5))

        # Clamp to physical bounds
        state["value"] = max(lo * 0.2, min(hi * 1.8, state["value"]))

        value = round(state["value"], 2)
        warn = cfg["warn"]
        crit = cfg["crit"]

        if value >= crit:
            alarm_state = "CRITICAL"
        elif value >= warn:
            alarm_state = "WARNING"
        else:
            alarm_state = "NORMAL"

        return {
            "id": sensor_id,
            "value": value,
            "unit": cfg["unit"],
            "alarm_state": alarm_state,
            "warning_threshold": warn,
            "critical_threshold": crit,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Module-level singleton instance
_simulator: Optional[RealisticSensorSimulator] = None


def get_simulator() -> RealisticSensorSimulator:
    """Return the module-level singleton simulator instance."""
    global _simulator
    if _simulator is None:
        _simulator = RealisticSensorSimulator()
    return _simulator

"""
SafetyOS — Unified Namespace (UNS) Normalizer
=============================================
Converts sensor readings from any protocol (MQTT, OPC-UA, Modbus, simulated)
into a canonical ISA-88/95-compliant UnifiedTag format.

Tag naming convention: PLANT/ZONE/ASSET_ID/MEASUREMENT_TYPE
e.g. VIZAG/ZC/H2S-01/GAS | VIZAG/ZB/PMP-203/VIB | VIZAG/ZA/TNK-401/LEVEL
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger("safetyos.uns")


# ── Enums ─────────────────────────────────────────────────────────────────────

class DataQuality(str, Enum):
    GOOD      = "GOOD"
    UNCERTAIN = "UNCERTAIN"
    BAD       = "BAD"
    SIMULATED = "SIMULATED"


class AlarmState(str, Enum):
    """ISA-18.2 alarm states."""
    NORMAL = "NORMAL"
    LO     = "LO"
    LOLO   = "LOLO"
    HI     = "HI"
    HIHI   = "HIHI"
    DEV    = "DEV"    # Deviation from setpoint
    ROC    = "ROC"    # Rate of change


# ── UnifiedTag ────────────────────────────────────────────────────────────────

@dataclass
class UnifiedTag:
    """
    Canonical data structure for every sensor reading in SafetyOS.
    All protocols normalise to this format before entering the UNS.
    """
    # ── Identity ──
    tag_id:           str   # e.g. "VIZAG/ZC/H2S-01/GAS"
    asset_id:         str   # e.g. "SEN-003"
    plant_id:         str   # e.g. "VIZAG-UNIT-3"
    zone_id:          str   # e.g. "ZC"

    # ── Value ──
    value:            float
    raw_value:        Any           # Original unscaled device value
    unit:             str           # "ppm", "°C", "bar", "mm/s"
    engineering_unit: str           # Full name: "parts per million"

    # ── Alarm (ISA-18.2) ──
    alarm_state:    AlarmState
    alarm_priority: int             # 1=critical … 4=advisory

    # ── Quality ──
    quality:          DataQuality
    confidence:       float         # 0.0–1.0
    source_protocol:  str           # "mqtt" | "opcua" | "modbus" | "simulated"

    # ── Time ──
    timestamp:        datetime
    source_timestamp: Optional[datetime] = None   # Timestamp from device itself

    # ── Equipment taxonomy ──
    equipment_type: str = "XMTR"   # PMP, VLV, TNK, MTR, XMTR, CMP …
    sensor_type:    str = "UNKNOWN" # H2S, CO, TEMP, PRESS, VIB, LEL, FLOW …
    isc_level:      str = "SL2"    # IEC 62443 security level SL1–SL4

    # ── Thresholds (stored with tag, not hardcoded elsewhere) ──
    lo:   Optional[float] = None   # Low alarm
    lolo: Optional[float] = None   # Low-Low alarm
    hi:   Optional[float] = None   # High alarm
    hihi: Optional[float] = None   # High-High alarm

    # ── Extras ──
    metadata: Dict = field(default_factory=dict)


# ── Normalizer ────────────────────────────────────────────────────────────────

class UNSNormalizer:
    """
    Converts readings from any industrial protocol into UnifiedTag format.
    Every method is a pure function — no side effects.
    """

    # Engineering unit full names
    UNIT_NAMES: Dict[str, str] = {
        "ppm":  "parts per million",
        "°C":   "degrees Celsius",
        "bar":  "bar (pressure)",
        "kPa":  "kilopascals",
        "mm/s": "millimetres per second",
        "m³/h": "cubic metres per hour",
        "m/s":  "metres per second",
        "%":    "percent",
        "mA":   "milliamperes",
        "V":    "volts",
        "rpm":  "revolutions per minute",
        "Hz":   "hertz",
        "kg":   "kilograms",
        "t":    "metric tonnes",
    }

    def from_mqtt(self, topic: str, payload: dict, source_id: str) -> UnifiedTag:
        """Convert MQTT Sparkplug B or plain MQTT message → UnifiedTag."""
        parts = topic.lstrip("/").split("/")
        # Expected: safetyos/<plant>/<zone>/<asset>/<sensor_type>
        plant  = parts[1] if len(parts) > 1 else "UNKNOWN"
        zone   = parts[2] if len(parts) > 2 else "UNKNOWN"
        asset  = parts[3] if len(parts) > 3 else "UNKNOWN"
        stype  = parts[4] if len(parts) > 4 else "UNKNOWN"

        val  = float(payload.get("value", 0))
        unit = payload.get("unit", "")

        return UnifiedTag(
            tag_id           = f"{plant}/{zone}/{asset}/{stype}",
            asset_id         = payload.get("asset_id", asset),
            plant_id         = payload.get("plant_id", plant),
            zone_id          = payload.get("zone_id", zone),
            value            = val,
            raw_value        = payload.get("raw_value", val),
            unit             = unit,
            engineering_unit = self.UNIT_NAMES.get(unit, unit),
            alarm_state      = self._alarm_state(val, payload.get("hi"), payload.get("hihi"),
                                                  payload.get("lo"), payload.get("lolo")),
            alarm_priority   = int(payload.get("alarm_priority", 3)),
            quality          = DataQuality.BAD if payload.get("quality") == "BAD" else DataQuality.GOOD,
            confidence       = float(payload.get("confidence", 1.0)),
            source_protocol  = "mqtt",
            timestamp        = datetime.utcnow(),
            source_timestamp = (datetime.fromisoformat(payload["timestamp"])
                                if "timestamp" in payload else None),
            equipment_type   = payload.get("equipment_type", "XMTR"),
            sensor_type      = payload.get("sensor_type", stype),
            isc_level        = "SL2",
            hi               = payload.get("hi"),
            hihi             = payload.get("hihi"),
            lo               = payload.get("lo"),
            lolo             = payload.get("lolo"),
            metadata         = {"source_id": source_id, "topic": topic},
        )

    def from_opcua(self, node_id: str, value: Any, source_id: str,
                   node_metadata: Optional[dict] = None) -> UnifiedTag:
        """Convert OPC-UA node reading → UnifiedTag."""
        meta = node_metadata or {}
        val  = float(value)
        unit = meta.get("unit", "")

        return UnifiedTag(
            tag_id           = f"opcua:{source_id}:{node_id}",
            asset_id         = meta.get("asset_id", node_id),
            plant_id         = meta.get("plant_id", "UNKNOWN"),
            zone_id          = meta.get("zone_id", "UNKNOWN"),
            value            = val,
            raw_value        = value,
            unit             = unit,
            engineering_unit = self.UNIT_NAMES.get(unit, unit),
            alarm_state      = self._alarm_state(val, meta.get("hi"), meta.get("hihi"),
                                                  meta.get("lo"), meta.get("lolo")),
            alarm_priority   = int(meta.get("alarm_priority", 3)),
            quality          = DataQuality.GOOD,
            confidence       = 1.0,
            source_protocol  = "opcua",
            timestamp        = datetime.utcnow(),
            source_timestamp = None,
            equipment_type   = meta.get("equipment_type", "XMTR"),
            sensor_type      = meta.get("sensor_type", "UNKNOWN"),
            isc_level        = "SL3",          # OPC-UA has stronger security
            hi               = meta.get("hi"),
            hihi             = meta.get("hihi"),
            lo               = meta.get("lo"),
            lolo             = meta.get("lolo"),
            metadata         = {"source_id": source_id, "node_id": node_id},
        )

    def from_modbus(self, register: int, raw_value: int,
                    register_map: dict, source_id: str) -> UnifiedTag:
        """Convert Modbus register reading → UnifiedTag using a register map."""
        cfg   = register_map.get(register, {})
        scale = cfg.get("scale", 1.0)
        off   = cfg.get("offset", 0.0)
        val   = raw_value * scale + off
        unit  = cfg.get("unit", "")

        return UnifiedTag(
            tag_id           = f"modbus:{source_id}:reg{register}",
            asset_id         = cfg.get("asset_id", f"REG-{register}"),
            plant_id         = cfg.get("plant_id", "UNKNOWN"),
            zone_id          = cfg.get("zone_id", "UNKNOWN"),
            value            = val,
            raw_value        = raw_value,
            unit             = unit,
            engineering_unit = self.UNIT_NAMES.get(unit, unit),
            alarm_state      = self._alarm_state(val, cfg.get("hi"), cfg.get("hihi"),
                                                  cfg.get("lo"), cfg.get("lolo")),
            alarm_priority   = int(cfg.get("alarm_priority", 3)),
            quality          = DataQuality.GOOD,
            confidence       = 0.95,           # Modbus has no native quality indicator
            source_protocol  = "modbus",
            timestamp        = datetime.utcnow(),
            source_timestamp = None,
            equipment_type   = cfg.get("equipment_type", "XMTR"),
            sensor_type      = cfg.get("sensor_type", "UNKNOWN"),
            isc_level        = "SL1",          # Modbus/TCP minimal security
            hi               = cfg.get("hi"),
            hihi             = cfg.get("hihi"),
            lo               = cfg.get("lo"),
            lolo             = cfg.get("lolo"),
            metadata         = {"source_id": source_id, "register": register,
                                 "scale": scale, "offset": off},
        )

    def from_simulated(self, tag_id: str, zone_id: str, sensor_type: str,
                        value: float, unit: str, thresholds: dict) -> UnifiedTag:
        """Create a UnifiedTag from synthetic/demo data."""
        parts = tag_id.split("-")
        return UnifiedTag(
            tag_id           = f"VIZAG/{zone_id}/{tag_id}/{sensor_type}",
            asset_id         = tag_id,
            plant_id         = "VIZAG-UNIT-3",
            zone_id          = zone_id,
            value            = value,
            raw_value        = value,
            unit             = unit,
            engineering_unit = self.UNIT_NAMES.get(unit, unit),
            alarm_state      = self._alarm_state(value, thresholds.get("hi"),
                                                  thresholds.get("hihi"),
                                                  thresholds.get("lo"),
                                                  thresholds.get("lolo")),
            alarm_priority   = 1 if self._alarm_state(value, **{k: thresholds.get(k) for k in ("hi","hihi","lo","lolo")}) in (AlarmState.HIHI, AlarmState.LOLO) else 2,
            quality          = DataQuality.SIMULATED,
            confidence       = 0.99,
            source_protocol  = "simulated",
            timestamp        = datetime.utcnow(),
            equipment_type   = "XMTR",
            sensor_type      = sensor_type,
            isc_level        = "SL2",
            **{k: thresholds.get(k) for k in ("hi", "hihi", "lo", "lolo")},
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _alarm_state(self, value: float,
                     hi=None, hihi=None, lo=None, lolo=None) -> AlarmState:
        """ISA-18.2 alarm priority evaluation."""
        if hihi is not None and value >= hihi:
            return AlarmState.HIHI
        if hi is not None and value >= hi:
            return AlarmState.HI
        if lolo is not None and value <= lolo:
            return AlarmState.LOLO
        if lo is not None and value <= lo:
            return AlarmState.LO
        return AlarmState.NORMAL

    def to_ws_message(self, tag: UnifiedTag) -> dict:
        """Serialize UnifiedTag to WebSocket broadcast payload."""
        return {
            "type":           "uns_tag_update",
            "tag_id":         tag.tag_id,
            "asset_id":       tag.asset_id,
            "zone_id":        tag.zone_id,
            "value":          tag.value,
            "unit":           tag.unit,
            "alarm_state":    tag.alarm_state.value,
            "alarm_priority": tag.alarm_priority,
            "quality":        tag.quality.value,
            "confidence":     tag.confidence,
            "sensor_type":    tag.sensor_type,
            "source_protocol":tag.source_protocol,
            "timestamp":      tag.timestamp.isoformat(),
        }

    def batch_to_ws(self, tags: List[UnifiedTag]) -> List[dict]:
        return [self.to_ws_message(t) for t in tags]


# Module-level singleton
normalizer = UNSNormalizer()

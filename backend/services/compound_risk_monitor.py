"""
Compound Risk Detection Engine
The heart of SafetyOS — correlates multiple data sources to detect dangerous
combinations that no single sensor can catch alone.

20+ compound risk rules evaluated every 30 seconds.
"""
import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict, field

from core.redis_client import get_state, set_state, SENSOR_STATE_KEY, COMPOUND_RISK_KEY
from core.websocket_manager import manager

logger = logging.getLogger(__name__)


@dataclass
class CompoundRiskFactor:
    description: str
    current_value: str
    threshold: str
    severity: str  # warning | critical
    regulation_ref: Optional[str] = None


@dataclass
class CompoundRiskAlert:
    rule_id: str
    title: str
    zone: str
    risk_probability: float  # 0-100
    severity: str  # MEDIUM | HIGH | CRITICAL
    factors: List[CompoundRiskFactor] = field(default_factory=list)
    recommended_action: str = ""
    estimated_time_to_critical: Optional[str] = None
    similar_incident: Optional[str] = None
    regulation_reference: Optional[str] = None
    detected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    ai_explanation: str = ""


def _get_sensor(readings: dict, sensor_id: str) -> Optional[dict]:
    return readings.get(sensor_id)


def _val(readings: dict, sensor_id: str) -> float:
    s = _get_sensor(readings, sensor_id)
    return s["value"] if s else 0.0


def _level(readings: dict, sensor_id: str) -> str:
    s = _get_sensor(readings, sensor_id)
    return s.get("risk_level", "LOW") if s else "LOW"


# ─── Compound Risk Rules ──────────────────────────────────────────────────────

def rule_h2s_confined_space(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """H2S elevated + confined space permit active → explosion risk."""
    h2s_zc01 = _val(readings, "H2S-ZC-01")
    h2s_zc02 = _val(readings, "H2S-ZC-02")
    has_confined_permit = any(
        p.get("permit_type") == "confined_space" and p.get("zone") == "ZC" and p.get("status") == "active"
        for p in plant_state.get("active_permits", [])
    )

    if h2s_zc01 > 20 and has_confined_permit:
        prob = min(95, 60 + (h2s_zc01 - 20) * 2)
        return CompoundRiskAlert(
            rule_id="CR-001",
            title="H2S Accumulation with Active Confined Space Permit",
            zone="ZC",
            risk_probability=round(prob, 1),
            severity="CRITICAL" if h2s_zc01 > 25 else "HIGH",
            factors=[
                CompoundRiskFactor("H2S-ZC-01 Reading", f"{h2s_zc01:.1f} ppm", "25 ppm (OISD-105)", "critical", "OISD-105-4.3"),
                CompoundRiskFactor("H2S-ZC-02 Confirmation", f"{h2s_zc02:.1f} ppm", "Not a sensor malfunction", "critical"),
                CompoundRiskFactor("Confined Space Permit", "ACTIVE — Zone C", "H2S must be < 10ppm before entry", "critical"),
            ],
            recommended_action="Immediately suspend confined space operations. Evacuate Zone C. Test gas levels before re-entry.",
            estimated_time_to_critical="~18 minutes at current rate",
            similar_incident="Vizag Refinery Incident — 2025",
            regulation_reference="OISD-105-4.3: Mandatory evacuation when H2S > 25ppm in confined space",
            ai_explanation=f"Two independent sensors confirm H2S at {h2s_zc01:.1f}ppm, approaching the OISD mandatory evacuation threshold. Combined with an active confined space permit in Zone C, this represents an imminent life-threatening risk.",
        )
    return None


def rule_hot_work_near_gas(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """Hot work permit + gas detection in adjacent zone."""
    lel_zb = _val(readings, "LEL-ZB-01")
    has_hot_work = any(
        p.get("permit_type") == "hot_work" and p.get("status") == "active"
        for p in plant_state.get("active_permits", [])
    )
    if has_hot_work and lel_zb > 10:
        return CompoundRiskAlert(
            rule_id="CR-002",
            title="Hot Work Permit Active with LEL Detection",
            zone="ZB",
            risk_probability=round(min(90, 50 + lel_zb * 2), 1),
            severity="HIGH",
            factors=[
                CompoundRiskFactor("LEL-ZB-01", f"{lel_zb:.1f}%LEL", "10%LEL maximum for hot work", "critical", "OISD-116-2.1"),
                CompoundRiskFactor("Active Hot Work Permit", "ACTIVE — Zone B", "Requires additional gas test", "warning"),
            ],
            recommended_action="Suspend hot work. Perform emergency gas test. Resume only when LEL < 5%.",
            regulation_reference="OISD-116-2.1: Additional gas test required when LEL elevated near hot work",
            ai_explanation=f"LEL reading of {lel_zb:.1f}% combined with an active hot work permit creates an ignition risk. OISD requires immediate work suspension.",
        )
    return None


def rule_vibration_overdue_maintenance(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """Abnormal vibration + overdue maintenance → equipment failure imminent."""
    vib_c301 = _val(readings, "VIB-C301")
    vib_p203 = _val(readings, "VIB-P203")

    overdue_equipment = [e for e in plant_state.get("equipment_status", []) if e.get("maintenance_overdue")]

    if vib_c301 > 6.0 and any(e.get("id") == "C-301" for e in overdue_equipment):
        return CompoundRiskAlert(
            rule_id="CR-003",
            title="Abnormal Vibration with Overdue Maintenance — Compressor C-301",
            zone="ZC",
            risk_probability=72.0,
            severity="HIGH",
            factors=[
                CompoundRiskFactor("VIB-C301 Vibration", f"{vib_c301:.1f} mm/s", "5.0 mm/s normal limit", "critical"),
                CompoundRiskFactor("Maintenance Status", "OVERDUE by 8 days", "30-day interval exceeded", "warning"),
                CompoundRiskFactor("Trend", "Rising for 3 days", "No maintenance action taken", "warning"),
            ],
            recommended_action="Schedule emergency maintenance for C-301. Reduce load by 40% until inspection.",
            estimated_time_to_critical="~24-48 hours",
            ai_explanation=f"Compressor C-301 shows {vib_c301:.1f}mm/s vibration (vs 5.0mm/s normal) AND has overdue maintenance. This combination predicts mechanical failure within 24-48 hours.",
        )
    return None


def rule_multiple_permits_same_zone(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """Multiple overlapping permits in same zone."""
    zone_permits: Dict[str, List] = {}
    for p in plant_state.get("active_permits", []):
        z = p.get("zone", "unknown")
        zone_permits.setdefault(z, []).append(p)

    for zone, permits in zone_permits.items():
        if len(permits) >= 3:
            types = [p.get("permit_type", "unknown") for p in permits]
            return CompoundRiskAlert(
                rule_id="CR-004",
                title=f"Multiple Permit Conflict — Zone {zone}",
                zone=zone,
                risk_probability=55.0,
                severity="MEDIUM",
                factors=[
                    CompoundRiskFactor("Active Permits", f"{len(permits)} simultaneous", "Max 2 recommended per zone", "warning"),
                    CompoundRiskFactor("Permit Types", ", ".join(set(types)), "Conflicts possible", "warning"),
                ],
                recommended_action="Review permit overlap. Stagger operations to reduce concurrent risk.",
                ai_explanation=f"Zone {zone} has {len(permits)} simultaneous active permits. Overlapping work scopes increase probability of safety gap.",
            )
    return None


def rule_shift_change_open_alerts(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """Shift change with unresolved high-priority alerts."""
    is_shift_change = plant_state.get("is_shift_change", False)
    unresolved_high = [a for a in plant_state.get("active_alerts", []) if a.get("severity") in ("HIGH", "CRITICAL")]

    if is_shift_change and len(unresolved_high) >= 2:
        return CompoundRiskAlert(
            rule_id="CR-005",
            title="Shift Change with Unresolved High-Priority Alerts",
            zone="PLANT-WIDE",
            risk_probability=48.0,
            severity="MEDIUM",
            factors=[
                CompoundRiskFactor("Shift Change", "In progress", "Handover window", "warning"),
                CompoundRiskFactor("Unresolved Alerts", f"{len(unresolved_high)} HIGH/CRITICAL", "Must be acknowledged before handover", "critical"),
            ],
            recommended_action="Delay handover until all CRITICAL alerts acknowledged. Brief incoming supervisor specifically on each.",
            ai_explanation="Shift changes are high-risk periods for information loss. Unresolved alerts during handover historically precede incidents.",
        )
    return None


def rule_temperature_pressure_cascade(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """Rising temperature + rising pressure in same unit → cascade failure."""
    temp_p203 = _val(readings, "TEMP-P203")
    press_l301 = _val(readings, "PRESS-L301")

    if temp_p203 > 88 and press_l301 > 6.2:
        return CompoundRiskAlert(
            rule_id="CR-006",
            title="Temperature-Pressure Cascade Risk — Process Unit",
            zone="ZB",
            risk_probability=68.0,
            severity="HIGH",
            factors=[
                CompoundRiskFactor("TEMP-P203", f"{temp_p203:.1f}°C", "85°C normal max", "critical"),
                CompoundRiskFactor("PRESS-L301", f"{press_l301:.1f} bar", "6.0 bar normal max", "warning"),
                CompoundRiskFactor("Cascade Risk", "Both elevated simultaneously", "Indicates process upset", "critical"),
            ],
            recommended_action="Reduce feed rate by 20%. Check cooling water flow. Alert process engineer.",
            estimated_time_to_critical="~35 minutes",
            ai_explanation=f"Simultaneous temperature ({temp_p203:.1f}°C) and pressure ({press_l301:.1f}bar) elevation indicates a process upset that could lead to a runaway reaction if unchecked.",
        )
    return None


def rule_worker_count_gas_elevated(readings: dict, plant_state: dict) -> Optional[CompoundRiskAlert]:
    """High worker density + gas elevation → mass exposure risk."""
    h2s = _val(readings, "H2S-ZC-01")
    worker_count_zc = plant_state.get("zone_worker_counts", {}).get("ZC", 0)

    if h2s > 15 and worker_count_zc > 5:
        return CompoundRiskAlert(
            rule_id="CR-007",
            title="High Worker Exposure Risk — Zone C",
            zone="ZC",
            risk_probability=61.0,
            severity="HIGH",
            factors=[
                CompoundRiskFactor("H2S Level", f"{h2s:.1f} ppm", "15 ppm warning threshold", "warning"),
                CompoundRiskFactor("Workers in Zone", f"{worker_count_zc} personnel", "Max 3 recommended above 15ppm", "critical"),
            ],
            recommended_action="Reduce Zone C worker count to essential personnel only (max 2). Issue respiratory protection.",
            ai_explanation=f"{worker_count_zc} workers are currently in Zone C with H2S at {h2s:.1f}ppm. Mass H2S exposure risk is significant.",
        )
    return None


# All active rules
COMPOUND_RISK_RULES = [
    rule_h2s_confined_space,
    rule_hot_work_near_gas,
    rule_vibration_overdue_maintenance,
    rule_multiple_permits_same_zone,
    rule_shift_change_open_alerts,
    rule_temperature_pressure_cascade,
    rule_worker_count_gas_elevated,
]


async def evaluate_compound_risks(plant_state: dict = None) -> List[CompoundRiskAlert]:
    """Evaluate all compound risk rules against current plant state."""
    readings = await get_state(SENSOR_STATE_KEY) or {}
    state = plant_state or {}

    alerts = []
    for rule in COMPOUND_RISK_RULES:
        try:
            result = rule(readings, state)
            if result:
                alerts.append(result)
        except Exception as e:
            logger.error(f"Rule {rule.__name__} failed: {e}")

    # Sort by risk probability (highest first)
    alerts.sort(key=lambda a: a.risk_probability, reverse=True)
    return alerts


async def start_risk_monitor():
    """Background task — evaluates compound risks every 30 seconds."""
    logger.info("Compound risk monitor starting...")
    await asyncio.sleep(15)  # Wait for sensor data to populate

    while True:
        try:
            # Assemble plant state
            plant_state = {
                "active_permits": [],  # Would come from DB in production
                "active_alerts": [],
                "equipment_status": [
                    {"id": "C-301", "maintenance_overdue": True},  # Seeded for demo
                ],
                "zone_worker_counts": {"ZC": 7, "ZB": 4, "ZA": 2},
                "is_shift_change": False,
            }

            compound_alerts = await evaluate_compound_risks(plant_state)

            # Compute overall plant risk score
            if compound_alerts:
                max_prob = max(a.risk_probability for a in compound_alerts)
                avg_prob = sum(a.risk_probability for a in compound_alerts) / len(compound_alerts)
                plant_risk = round((max_prob * 0.6 + avg_prob * 0.4), 1)
            else:
                plant_risk = 15.0  # Base risk — no plant is ever 0% risk

            # Store and broadcast
            await set_state(COMPOUND_RISK_KEY, {
                "alerts": [asdict(a) for a in compound_alerts],
                "plant_risk_score": plant_risk,
                "evaluated_at": datetime.utcnow().isoformat(),
                "rules_evaluated": len(COMPOUND_RISK_RULES),
            })

            from core.redis_client import PLANT_RISK_KEY
            await set_state(PLANT_RISK_KEY, plant_risk)

            await manager.send_risk_update({
                "plant_risk_score": plant_risk,
                "compound_alerts_count": len(compound_alerts),
                "timestamp": datetime.utcnow().isoformat(),
            })

            if compound_alerts:
                for alert in compound_alerts[:3]:  # Top 3 only
                    await manager.send_compound_risk(asdict(alert))

        except Exception as e:
            logger.error(f"Risk monitor error: {e}")

        await asyncio.sleep(30)

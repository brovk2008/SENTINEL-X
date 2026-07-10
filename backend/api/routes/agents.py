"""Agent debate API routes — SSE streaming."""
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from agents.debate_orchestrator import run_debate, AGENT_PROFILES
from agents.compound_risk_monitor import get_monitor, evaluate_risk
from core.redis_client import get_state, COMPOUND_RISK_KEY, SENSOR_STATE_KEY
from core.websocket_manager import manager
from intelligence.scenario_simulator import (
    get_scenario,
    list_scenarios,
    get_scenario_comparison,
    get_risk_score_for_time,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class DebateRequest(BaseModel):
    zone: Optional[str] = "ZC"
    risk_level: Optional[str] = "CRITICAL"
    use_scripted_demo: Optional[bool] = False
    scenario: Optional[str] = "h2s_confined_space"  # h2s_confined_space | equipment_failure | permit_conflict
    custom_context: Optional[dict] = None


@router.get("/profiles")
async def get_agent_profiles():
    """Get all agent profiles (for frontend display)."""
    return {
        "agents": [
            {
                "key": key,
                "name": agent["name"],
                "emoji": agent["emoji"],
                "color": agent["color"],
                "tagline": agent["tagline"],
            }
            for key, agent in AGENT_PROFILES.items()
        ]
    }


@router.get("/scenarios")
async def get_debate_scenarios():
    """Get available debate scenarios for the demo."""
    return {
        "scenarios": [
            {
                "id": "h2s_confined_space",
                "name": "H2S + Confined Space",
                "description": "H2S leak detection during confined space work — compound risk scenario",
                "emoji": "🔴",
                "complexity": "CRITICAL",
            },
            {
                "id": "equipment_failure",
                "name": "Equipment Failure",
                "description": "Compressor bearing failure with vibration anomaly — shutdown vs. assessment",
                "emoji": "🔧",
                "complexity": "HIGH",
            },
            {
                "id": "permit_conflict",
                "name": "Permit Conflict",
                "description": "Hot work permit vs. adjacent high LEL zone — safety vs. timeline",
                "emoji": "⚖️",
                "complexity": "HIGH",
            },
        ]
    }


@router.post("/simulate-risk")
async def simulate_risk(rule_id: int = Body(..., embed=True)):
    """
    Manually trigger a compound risk rule for demo.
    Simulates the plant state to trigger the specified rule.
    Returns the triggered alert and debate context.
    """
    from agents.compound_risk_monitor import COMPOUND_RISK_RULES

    # Find the rule
    rule = next((r for r in COMPOUND_RISK_RULES if r.id == rule_id), None)
    if not rule:
        return {"error": f"Rule {rule_id} not found", "available_rules": len(COMPOUND_RISK_RULES)}

    # Create synthetic plant state that triggers this rule
    synthetic_state = _generate_state_for_rule(rule_id)

    # Evaluate to confirm trigger
    alerts = evaluate_risk(synthetic_state)
    triggered = next((a for a in alerts if a["rule_id"] == rule_id), None)

    payload = {
        "rule_id": rule_id,
        "zone": triggered.get("zone", "ZC") if triggered else "ZC",
        "title": rule.name,
        "severity": rule.severity,
        "risk_probability": triggered.get("risk_probability", synthetic_state.get("plant_risk_score", 0)) if triggered else synthetic_state.get("plant_risk_score", 0),
        "detected_at": datetime.utcnow().isoformat(),
        "details": triggered or {},
    }

    await manager.send_compound_risk(payload)

    return {
        "rule_id": rule_id,
        "rule_name": rule.name,
        "severity": rule.severity,
        "triggered": triggered is not None,
        "alert": triggered,
        "plant_state": synthetic_state,
        "all_triggered_rules": len(alerts),
        "scenario_suggestion": _map_rule_to_scenario(rule_id),
    }


class DebateTriggerRequest(BaseModel):
    title: Optional[str] = "AI Risk Debate"
    zone: Optional[str] = "Zone C — Compressor Bay"
    risk_level: Optional[str] = "CRITICAL"
    risk_score: Optional[float] = 84.0
    scenario: Optional[str] = "h2s_confined_space"
    use_scripted_demo: Optional[bool] = True
    custom_context: Optional[dict] = None


@router.post("/debate")
async def trigger_debate(request: DebateTriggerRequest = Body(...)):
    """Trigger a background debate run and broadcast agent messages via WebSocket."""
    session_id = str(uuid.uuid4())

    context = request.custom_context or {
        "plant_name": "Bharat Petrochemicals Refinery Unit 3",
        "zone": request.zone,
        "risk_level": request.risk_level,
        "risk_score": request.risk_score,
        "factors": [
            "H2S levels spike in Zone C",
            "Confined space permit active",
            "Compressor C-301 vibration elevated",
        ],
        "active_permits": [
            "PTW-2025-0847: Confined Space — Zone C",
            "PTW-2025-0851: Maintenance — Zone B",
        ],
    }

    async def run_in_background():
        async for _ in run_debate(context, session_id, request.use_scripted_demo, request.scenario):
            pass

    asyncio.create_task(run_in_background())

    return {
        "message": "Debate initiated",
        "session_id": session_id,
        "scenario": request.scenario,
    }


def _generate_state_for_rule(rule_id: int) -> dict:
    """Generate synthetic plant state that triggers the specified rule"""
    base_state = {
        "zone": "ZC",
        "zone_hazard_class": "HIGH",
        "zone_occupancy": 6,
        "zone_occupancy_ratio": 1.0,
        "total_zone_workers": 6,
        "is_night_shift": False,
        "maintenance_in_progress": False,
        "isolation_verified": True,
        "exit_blocked": False,
        "h2s_max": 10,
        "lel_max": 5,
        "adjacent_lel_max": 8,
        "max_vibration": 3,
        "temperature_max": 75,
        "pressure_pct_of_design": 60,
        "pressure_trend": "stable",
        "gas_trend": "stable",
        "wind_speed_kmh": 15,
        "fire_suppression_online": True,
        "maintenance_overdue_days": 0,
        "overdue_calibration_count": 0,
        "near_miss_count_7d": 0,
        "same_zone_incidents": 0,
        "active_permit_count_same_zone": 1,
        "active_permit_count": 1,
        "expired_permits_with_active_workers": 0,
        "contractor_workers_unsupervised": 0,
        "workers_over_12h": 0,
        "critical_tasks_active": False,
        "unresolved_alerts": 0,
        "shift_changeover_active": False,
        "confined_space_permit_active": False,
        "hot_work_permit_active": False,
        "height_work_permit_active": False,
        "electrical_work_active": False,
        "ppe_compliance_pct": 95,
        "plant_risk_score": 25,
    }

    # Customize state based on rule
    if rule_id == 1:  # H2S + Confined Space
        base_state.update({
            "h2s_max": 45,
            "confined_space_permit_active": True,
            "plant_risk_score": 84,
        })
    elif rule_id == 2:  # Equipment Failure Cascade
        base_state.update({
            "max_vibration": 11.2,
            "temperature_max": 108,
            "maintenance_overdue_days": 8,
            "plant_risk_score": 78,
        })
    elif rule_id == 3:  # Hot Work + Adjacent LEL
        base_state.update({
            "hot_work_permit_active": True,
            "adjacent_lel_max": 18,
            "plant_risk_score": 81,
        })
    elif rule_id == 4:  # Flammable + Electrical
        base_state.update({
            "lel_max": 16,
            "electrical_work_active": True,
            "plant_risk_score": 82,
        })
    elif rule_id == 5:  # LOTO Breach
        base_state.update({
            "isolation_verified": False,
            "maintenance_in_progress": True,
            "plant_risk_score": 88,
        })
    elif rule_id == 6:  # Multiple Permits
        base_state.update({
            "active_permit_count_same_zone": 3,
            "plant_risk_score": 62,
        })
    elif rule_id == 8:  # Night Shift + High Risk
        base_state.update({
            "is_night_shift": True,
            "plant_risk_score": 72,
        })
    elif rule_id == 9:  # Zone Overcrowding
        base_state.update({
            "zone_occupancy_ratio": 1.4,
            "gas_trend": "rising",
            "plant_risk_score": 68,
        })
    elif rule_id == 11:  # Pressure Rising
        base_state.update({
            "pressure_pct_of_design": 88,
            "pressure_trend": "rising",
            "plant_risk_score": 75,
        })
    elif rule_id == 12:  # Mass Casualty
        base_state.update({
            "plant_risk_score": 87,
            "total_zone_workers": 25,
        })
    elif rule_id == 13:  # Near-Miss Pattern
        base_state.update({
            "near_miss_count_7d": 4,
            "same_zone_incidents": 2,
            "plant_risk_score": 71,
        })
    elif rule_id == 14:  # Expired Permit
        base_state.update({
            "expired_permits_with_active_workers": 1,
            "plant_risk_score": 65,
        })
    elif rule_id == 15:  # Shift Changeover
        base_state.update({
            "shift_changeover_active": True,
            "unresolved_alerts": 3,
            "plant_risk_score": 58,
        })
    elif rule_id == 17:  # Fire System Offline
        base_state.update({
            "fire_suppression_online": False,
            "hot_work_permit_active": True,
            "plant_risk_score": 73,
        })
    elif rule_id == 18:  # Fatigue Risk
        base_state.update({
            "workers_over_12h": 3,
            "critical_tasks_active": True,
            "plant_risk_score": 64,
        })
    elif rule_id == 19:  # Exit Blocked
        base_state.update({
            "exit_blocked": True,
            "zone_occupancy": 8,
            "plant_risk_score": 69,
        })
    elif rule_id == 20:  # PPE Non-Compliance
        base_state.update({
            "ppe_compliance_pct": 55,
            "zone_hazard_class": "CRITICAL",
            "plant_risk_score": 66,
        })

    return base_state


def _map_rule_to_scenario(rule_id: int) -> str:
    """Map compound risk rule to a debate scenario"""
    if rule_id == 1:
        return "h2s_confined_space"
    elif rule_id == 2:
        return "equipment_failure"
    elif rule_id in (3, 4):
        return "permit_conflict"
    else:
        return "h2s_confined_space"  # Default


@router.get("/scenarios/list")
async def list_all_scenarios():
    """Get all available 'what if' scenarios"""
    return {"scenarios": list_scenarios()}


@router.get("/scenarios/compare")
async def compare_scenarios():
    """Get all 3 scenarios for side-by-side comparison"""
    return get_scenario_comparison()


@router.get("/scenarios/{scenario_id}")
async def get_scenario_detail(scenario_id: str):
    """Get detailed trajectory for a specific scenario"""
    scenario = get_scenario(scenario_id)
    if not scenario:
        return {"error": f"Scenario {scenario_id} not found"}

    return {
        "id": scenario.id,
        "title": scenario.title,
        "description": scenario.description,
        "initial_risk": scenario.initial_risk,
        "final_risk": scenario.final_risk,
        "probability_incident": scenario.probability_incident,
        "estimated_cost_inr": scenario.estimated_cost_inr,
        "confidence_pct": scenario.confidence_pct,
        "recommendation": scenario.recommendation,
        "reasoning": scenario.reasoning,
        "trajectory": [
            {
                "time_minutes": p.time_minutes,
                "time_label": f"{p.time_minutes // 60}h {p.time_minutes % 60}m" if p.time_minutes > 0 else "Now",
                "risk_score": p.risk_score,
                "probability_incident": p.probability_incident,
                "status": p.status,
            }
            for p in scenario.trajectory
        ],
    }


@router.post("/debate/stream")
async def stream_debate(request: DebateRequest):
    """
    Start a multi-agent debate and stream responses via SSE.
    Frontend: new EventSource('/agents/debate/stream')
    """
    session_id = str(uuid.uuid4())

    # Build incident context from current plant state
    compound_risk = await get_state(COMPOUND_RISK_KEY) or {}
    sensor_state = await get_state(SENSOR_STATE_KEY) or {}

    h2s_zc = sensor_state.get("H2S-ZC-01", {}).get("value", 45.0)
    vib_c301 = sensor_state.get("VIB-C301", {}).get("value", 9.2)

    context = request.custom_context or {
        "plant_name": "Bharat Petrochemicals Refinery Unit 3",
        "zone": request.zone or "Zone C — Compressor Bay",
        "risk_level": request.risk_level or "CRITICAL",
        "risk_score": compound_risk.get("plant_risk_score", 84),
        "factors": [
            f"H2S-ZC-01 reading: {h2s_zc:.1f} ppm (threshold: 25 ppm) — ELEVATED",
            "Confined space permit PTW-2025-0847 — ACTIVE (2.5 hours)",
            f"Compressor C-301 vibration: {vib_c301:.1f} mm/s (baseline: 3.4 mm/s)",
            "Last inspection: 23 days ago (overdue by 8 days)",
            "Similar incident: Vizag Refinery 2025 — matching conditions",
        ],
        "active_permits": [
            "PTW-2025-0847: Confined Space — Zone C (Expires: 16:30)",
            "PTW-2025-0851: Maintenance — Zone B (Expires: 18:00)",
        ]
    }

    async def event_generator():
        yield f"data: {json.dumps({'type': 'session_start', 'session_id': session_id})}\n\n"

        async for msg in run_debate(context, session_id, request.use_scripted_demo, request.scenario):
            yield f"data: {json.dumps(msg)}\n\n"
            await asyncio.sleep(0.1)

        yield f"data: {json.dumps({'type': 'debate_complete', 'session_id': session_id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@router.post("/debate/sync")
async def run_debate_sync(request: DebateRequest):
    """Run full debate and return all results at once (non-streaming)."""
    session_id = str(uuid.uuid4())
    compound_risk = await get_state(COMPOUND_RISK_KEY) or {}

    context = request.custom_context or {
        "plant_name": "Bharat Petrochemicals Refinery Unit 3",
        "zone": request.zone or "Zone C",
        "risk_level": request.risk_level or "CRITICAL",
        "risk_score": compound_risk.get("plant_risk_score", 84),
        "factors": [
            "H2S levels: 45ppm (threshold: 25ppm) — ELEVATED",
            "Confined space permit PTW-2025-0847 — ACTIVE",
            "Compressor C-301 vibration: 9.2 mm/s — ABNORMAL",
        ],
        "active_permits": ["PTW-2025-0847: Confined Space — Zone C"],
    }

    messages = []
    async for msg in run_debate(context, session_id, request.use_scripted_demo, request.scenario):
        messages.append(msg)

    return {
        "session_id": session_id,
        "debate_transcript": messages,
        "total_agents": len(messages),
        "final_decision": messages[-1]["message"] if messages else None,
    }


@router.get("/risk-status")
async def get_risk_status():
    """Get the current aggregated risk status of the debate engine."""
    compound_risk = await get_state(COMPOUND_RISK_KEY) or {}
    return {
        "status": "ok",
        "plant_risk_score": compound_risk.get("plant_risk_score", 42.0),
        "risk_level": compound_risk.get("severity", "MEDIUM"),
    }

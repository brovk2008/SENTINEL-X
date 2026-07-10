"""Agent debate API routes — SSE streaming."""
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from agents.debate_orchestrator import run_debate, AGENT_PROFILES
from core.redis_client import get_state, COMPOUND_RISK_KEY, SENSOR_STATE_KEY

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

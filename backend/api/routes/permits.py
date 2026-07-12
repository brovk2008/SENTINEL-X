"""Permits API."""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from intelligence.ptw_validator import ptw_validator

logger = logging.getLogger(__name__)
router = APIRouter()

# Synthetic active permits
SYNTHETIC_PERMITS = [
    {
        "id": "ptw-001",
        "permit_number": "PTW-2025-0847",
        "permit_type": "confined_space",
        "description": "Inspection and seal replacement on Compressor C-301 gas inlet",
        "zone": "ZC",
        "zone_name": "Zone C — Compressor Bay",
        "worker_name": "Ramesh Kumar",
        "worker_id": "EMP-042",
        "approved_by": "Suresh Patel (Safety Officer)",
        "start_time": (datetime.utcnow() - timedelta(hours=2, minutes=30)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(hours=1, minutes=30)).isoformat(),
        "status": "active",
        "ai_risk_score": 87.0,
        "ai_assessment": {
            "is_safe": False,
            "risk_level": "CRITICAL",
            "concerns": [
                "H2S exceeding threshold in permit zone",
                "Gas level rising during permit period",
                "Insufficient time elapsed since last gas test",
            ],
            "recommendation": "SUSPEND permit immediately. Gas levels must be below 10ppm before re-entry."
        },
        "conditions": [
            "Continuous gas monitoring mandatory",
            "SCBA equipment required",
            "Buddy system enforced",
            "Rescue team on standby",
        ]
    },
    {
        "id": "ptw-002",
        "permit_number": "PTW-2025-0851",
        "permit_type": "maintenance",
        "description": "Preventive maintenance on Heat Exchanger HX-501 tube bundle",
        "zone": "ZB",
        "zone_name": "Zone B — Process Unit",
        "worker_name": "Aditya Singh",
        "worker_id": "EMP-019",
        "approved_by": "Dr. Priya Sharma (Plant Manager)",
        "start_time": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(hours=3)).isoformat(),
        "status": "active",
        "ai_risk_score": 32.0,
        "ai_assessment": {
            "is_safe": True,
            "risk_level": "LOW",
            "concerns": [],
            "recommendation": "Permit conditions are within acceptable parameters. Continue monitoring."
        },
        "conditions": ["Area cordoned off", "Fire extinguisher on standby"],
    },
    {
        "id": "ptw-003",
        "permit_number": "PTW-2025-0839",
        "permit_type": "electrical",
        "description": "Motor control panel wiring inspection and replacement",
        "zone": "ZD",
        "zone_name": "Zone D — Control Room",
        "worker_name": "Vikram Nair",
        "worker_id": "EMP-033",
        "approved_by": "Rajesh Menon (Electrical Supervisor)",
        "start_time": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(minutes=30)).isoformat(),
        "status": "active",
        "ai_risk_score": 45.0,
        "ai_assessment": {
            "is_safe": True,
            "risk_level": "MEDIUM",
            "concerns": ["Permit expires in 30 minutes — team still present"],
            "recommendation": "Send 30-minute expiry warning. Confirm safe exit plan."
        },
        "conditions": ["LOTO applied", "Electrical isolation verified"],
    },
]


@router.get("/")
async def list_permits(status: Optional[str] = "active", zone: Optional[str] = None):
    permits = SYNTHETIC_PERMITS
    if status:
        permits = [p for p in permits if p["status"] == status]
    if zone:
        permits = [p for p in permits if p["zone"] == zone.upper()]
    return {"permits": permits, "total": len(permits)}


@router.get("/{permit_id}")
async def get_permit(permit_id: str):
    permit = next((p for p in SYNTHETIC_PERMITS if p["id"] == permit_id), None)
    if not permit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Permit not found")
    return permit


@router.post("/validate")
async def validate_new_permit(payload: Dict = Body(...)) -> Dict:
    """Validate a permit request using SCADA state + biometrics + SIMOPS checking."""
    # Build default/synthetic inputs if not provided
    permit_data = {
        "id": payload.get("permit_id", "PTW-REQ-" + str(uuid.uuid4())[:8].upper()),
        "permit_type": payload.get("permit_type", "HOT_WORK"),
        "zone_id": payload.get("zone_id", "ZC"),
        "loto_status": payload.get("loto_status", "CONFIRMED"),
        "certifications_valid": payload.get("certifications_valid", True),
        "rescue_observer_assigned": payload.get("rescue_observer_assigned", True),
        "requested_expiry": (datetime.utcnow() + timedelta(hours=8)).isoformat(),
    }

    # Fetch current plant state from Redis or default
    from core.redis_client import get_state, SENSOR_STATE_KEY
    sensor_state = await get_state(SENSOR_STATE_KEY) or {}
    h2s_val = float(sensor_state.get("H2S-ZC-01", {}).get("value", 3.2))

    plant_state = {
        "gas_levels": {"h2s_ppm": h2s_val, "co_ppm": 2.1},
        "active_permits_in_zone": {
            "ZA": 1,
            "ZB": 1,
            "ZC": 2,  # Conflicting SIMOPS if Zone C
            "ZD": 0,
            "ZE": 0,
            "ZF": 0,
        },
        "zone_risks": {
            "ZA": 12.0,
            "ZB": 43.0,
            "ZC": 84.0,
            "ZD": 10.0,
            "ZE": 35.0,
            "ZF": 22.0,
        }
    }

    # Mock biometric status of permit holder
    worker_bio = {
        "psi_score": float(payload.get("psi_score", 4.2)),
        "shift_hours": float(payload.get("shift_hours", 6.5)),
        "cognitive_load": float(payload.get("cognitive_load", 55.0)),
    }

    result = ptw_validator.validate(permit_data, plant_state, worker_bio)
    return result


@router.post("/{permit_id}/analyze")
async def analyze_permit(permit_id: str):
    """Run AI safety analysis on a permit against current plant state."""
    permit = next((p for p in SYNTHETIC_PERMITS if p["id"] == permit_id), None)
    if not permit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Permit not found")

    from core.redis_client import get_state, SENSOR_STATE_KEY
    sensor_state = await get_state(SENSOR_STATE_KEY) or {}

    h2s = sensor_state.get("H2S-ZC-01", {}).get("value", 3.2) if permit["zone"] == "ZC" else 2.0

    from core.llm_router import chat
    analysis_prompt = f"""Analyze this industrial permit against current plant conditions:

Permit: {permit['permit_number']} — {permit['permit_type']}
Zone: {permit['zone_name']}
Description: {permit['description']}

Current Conditions in {permit['zone']}:
- H2S Level: {h2s:.1f} ppm
- Permit expires: {permit['end_time']}

Is this permit safe to continue? List specific concerns and OISD regulation references."""

    try:
        analysis = await chat(
            messages=[{"role": "user", "content": analysis_prompt}],
            temperature=0.3, max_tokens=500
        )
    except Exception:
        analysis = permit["ai_assessment"].get("recommendation", "Manual assessment required.")

    return {
        "permit_id": permit_id,
        "permit_number": permit["permit_number"],
        "analysis": analysis,
        "risk_score": permit["ai_risk_score"],
        "current_h2s": h2s,
        "analyzed_at": datetime.utcnow().isoformat(),
    }

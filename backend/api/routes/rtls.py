"""
SafetyOS — RTLS (Real-Time Location System) API Routes
======================================================
"""
from fastapi import APIRouter, HTTPException
from integrations.rtls_manager import manager as rtls_manager
from api.routes.biometrics import DEMO_WORKERS
from typing import Dict

router = APIRouter()

# Active mock permits database for geofence validation testing
MOCK_ACTIVE_PERMITS = [
    {"permit_type": "CONFINED_SPACE", "permit_holder_id": "W-01", "status": "ACTIVE"},
    {"permit_type": "HOT_WORK",       "permit_holder_id": "W-03", "status": "ACTIVE"},
]


@router.get("/positions")
async def get_all_positions() -> Dict:
    """Get active coordinates and alert/hazard statuses for all personnel."""
    snapshot = rtls_manager.get_all_positions(DEMO_WORKERS, MOCK_ACTIVE_PERMITS)
    return {
        "success": True,
        "rtls": snapshot,
    }


@router.get("/zones")
async def get_zone_summary() -> Dict:
    """Get plant zone layout capacities and safety limits."""
    return {
        "success": True,
        "zones": rtls_manager.get_zone_summary(),
    }


@router.get("/violations")
async def get_active_violations() -> Dict:
    """Get active geofence and proximity machinery warnings."""
    snapshot = rtls_manager.get_all_positions(DEMO_WORKERS, MOCK_ACTIVE_PERMITS)
    return {
        "success": True,
        "geofence_violations": snapshot["geofence_violations"],
        "proximity_hazards":    snapshot["proximity_hazards"],
        "critical_count":       snapshot["critical_count"],
    }

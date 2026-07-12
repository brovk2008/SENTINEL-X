"""
SafetyOS — Biometric Intelligence API Routes
============================================
"""
from fastapi import APIRouter, HTTPException
from integrations.biometric_manager import manager as bio_manager, PhysiologicalStatus
from typing import List, Dict
import random

router = APIRouter()

# Global list of synthetic workers used in SafetyOS demo.
# Matches those shown across various pages.
DEMO_WORKERS = [
    {"id": "W-01", "name": "Rajesh Kumar",   "zone_id": "ZC", "role": "Compressor Operator", "shift_hours_elapsed": 6.5},
    {"id": "W-02", "name": "Priya Sharma",   "zone_id": "ZB", "role": "Safety Officer",      "shift_hours_elapsed": 4.2},
    {"id": "W-03", "name": "Arjun Mehta",    "zone_id": "ZC", "role": "Welding Specialist",  "shift_hours_elapsed": 8.1},
    {"id": "W-04", "name": "Sunita Patel",   "zone_id": "ZA", "role": "HSE Inspector",       "shift_hours_elapsed": 5.0},
    {"id": "W-05", "name": "Vikram Singh",   "zone_id": "ZB", "role": "Shift Supervisor",    "shift_hours_elapsed": 7.3},
    {"id": "W-06", "name": "Anita Reddy",    "zone_id": "ZC", "role": "Process Tech",        "shift_hours_elapsed": 9.2},
    {"id": "W-07", "name": "Mohammed Ali",   "zone_id": "ZE", "role": "Maintenance Tech",    "shift_hours_elapsed": 3.1},
    {"id": "W-08", "name": "Lakshmi Nair",   "zone_id": "ZD", "role": "Panel Operator",      "shift_hours_elapsed": 11.2},  # Overtime
]


@router.get("/")
async def get_all_biometrics() -> Dict:
    """Get real-time biometric metrics for all active shift workers."""
    readings = bio_manager.generate_fleet(DEMO_WORKERS)
    summary  = bio_manager.fleet_summary(readings)

    return {
        "success": True,
        "readings": [w.__dict__ for w in readings],
        "summary": summary,
    }


@router.get("/{worker_id}")
async def get_worker_biometrics(worker_id: str) -> Dict:
    """Get detailed wearable sensor telemetry for a single worker."""
    worker = next((w for w in DEMO_WORKERS if w["id"] == worker_id), None)
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")

    bio = bio_manager.generate_synthetic_biometrics(worker)
    return {
        "success": True,
        "biometrics": bio.__dict__,
    }


@router.get("/summary/fleet")
async def get_fleet_health_summary() -> Dict:
    """Fleet-level health overview dashboard widget data."""
    readings = bio_manager.generate_fleet(DEMO_WORKERS)
    summary  = bio_manager.fleet_summary(readings)
    return {
        "success": True,
        "summary": summary,
    }

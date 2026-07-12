"""
SafetyOS — Hazard Dispersion API Routes
=======================================
"""
from fastapi import APIRouter, HTTPException, Query
from intelligence.dispersion_model import plume_model, AtmosphericConditions, CHEMICALS, get_active_demo_scenario
from typing import Dict, Optional

router = APIRouter()


@router.get("/active")
async def get_active_plume() -> Dict:
    """Get active hazard plume (defaults to H2S gas leak in Zone C)."""
    scenario = get_active_demo_scenario()
    return {
        "success": True,
        "plume": scenario,
    }


@router.post("/model")
async def compute_custom_plume(
    chemical: str = Query("H2S", description="Chemical key (H2S, CO, LPG, NH3)"),
    release_rate_gs: float = Query(10.0, description="Release rate in grams/second"),
    height_m: float = Query(1.5, description="Effective release height in metres"),
    wind_speed: float = Query(2.8, description="Wind speed in m/s"),
    wind_dir: float = Query(225.0, description="Wind direction in degrees (0-360)"),
    stability: Optional[str] = Query(None, description="P-G stability class A-F (auto if None)"),
    svg_x: float = Query(540.0, description="Source X coordinate on SVG"),
    svg_y: float = Query(300.0, description="Source Y coordinate on SVG"),
) -> Dict:
    """Calculate and return threat-zone polygons for a custom gas release."""
    if chemical not in CHEMICALS:
        raise HTTPException(status_code=400, detail=f"Chemical '{chemical}' not supported. Choose from: {list(CHEMICALS.keys())}")

    # Resolve stability class
    from datetime import datetime
    stab_class = stability or AtmosphericConditions.stability_from_wind(wind_speed, datetime.now().hour)

    conditions = AtmosphericConditions(
        wind_speed_ms     = wind_speed,
        wind_direction_deg= wind_dir,
        temperature_c     = 34.0,  # default ambient
        humidity_pct      = 65.0,
        stability_class   = stab_class,
    )

    source = {
        "release_rate_gs": release_rate_gs,
        "height_m":        height_m,
        "svg_x":           svg_x,
        "svg_y":           svg_y,
        "workers_in_area": 4,      # default zone estimate
    }

    result = plume_model.compute_threat_zones(source, conditions, chemical)
    return {
        "success": True,
        "plume": result,
    }


@router.get("/chemicals")
async def get_chemical_database() -> Dict:
    """Get active chemical profiles with LC50, IDLH, and ERPG thresholds."""
    return {
        "success": True,
        "chemicals": CHEMICALS,
    }

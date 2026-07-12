"""
SafetyOS — Real-Time Location System (RTLS) Manager
====================================================
Tracks worker positions using UWB, BLE, GPS or simulated positioning.

Coordinate system: matches the SVG plant map viewBox="0 0 1000 420"
Scale factor: ~0.7 pixels per real metre at this plant layout.

Technologies supported (demo fallback always active):
  - UWB (Decawave/Qorvo): ±10-30 cm accuracy
  - BLE beacons (Estimote): ±2-5 m accuracy  
  - GPS (outdoor): ±5-10 m accuracy
  - Simulated: ±2 m (random walk within zone bounds)
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple


# ── Zone bounds (SVG coordinate space 1000×420) ───────────────────────────────
# These match the ZONES defined in frontend PlantMap.tsx
ZONE_BOUNDS: Dict[str, Dict] = {
    "ZA": {"x":  30, "y":  30, "w": 330, "h": 240, "name": "Tank Farm",       "max_workers": 20},
    "ZB": {"x": 390, "y":  30, "w": 300, "h": 160, "name": "Process Unit",    "max_workers": 15},
    "ZC": {"x": 390, "y": 210, "w": 300, "h": 180, "name": "Compressor Bay",  "max_workers": 8},
    "ZD": {"x": 720, "y":  30, "w": 240, "h": 200, "name": "Control Room",    "max_workers": 10},
    "ZE": {"x": 720, "y": 250, "w": 120, "h": 140, "name": "Flare Stack",     "max_workers": 4},
    "ZF": {"x": 860, "y": 250, "w": 100, "h": 140, "name": "Vessel Park",     "max_workers": 6},
}

# Geofenced restricted areas (sub-zones requiring special permits)
RESTRICTED_AREAS: Dict[str, Dict] = {
    "confined-space-ZC": {
        "zone_id": "ZC", "label": "Vessel V-401 Confined Space",
        "x": 420, "y": 220, "w": 70, "h": 50,
        "requires_permit": "CONFINED_SPACE", "max_workers": 2,
    },
    "high-voltage-ZD": {
        "zone_id": "ZD", "label": "HV Switchgear Room",
        "x": 730, "y": 40, "w": 55, "h": 45,
        "requires_permit": "ELECTRICAL", "max_workers": 1,
    },
    "hot-work-ZB": {
        "zone_id": "ZB", "label": "Reactor Welding Area",
        "x": 400, "y": 40, "w": 80, "h": 60,
        "requires_permit": "HOT_WORK", "max_workers": 3,
    },
}

# Machinery exclusion zones (moving/rotating equipment)
EXCLUSION_ZONES: List[Dict] = [
    {"id": "exc-cmp-c301", "equipment": "Compressor C-301", "cx": 540, "cy": 300, "radius": 22, "zone_id": "ZC"},
    {"id": "exc-pmp-p203", "equipment": "Pump P-203",        "cx": 480, "cy": 100, "radius": 14, "zone_id": "ZB"},
    {"id": "exc-tnk-t407", "equipment": "Tank T-407",         "cx": 195, "cy": 140, "radius": 30, "zone_id": "ZA"},
]

# Pixel-to-metre conversion (at this plant map scale)
PX_PER_METRE = 0.7


@dataclass
class WorkerPosition:
    worker_id:   str
    worker_name: str
    zone_id:     str
    x:           float    # SVG pixel coordinate
    y:           float
    technology:  str      # "uwb" | "ble" | "gps" | "simulated"
    accuracy_m:  float    # Position accuracy in metres
    timestamp:   str


@dataclass
class GeofenceViolation:
    worker_id:      str
    zone_id:        str
    area_id:        str
    area_label:     str
    violation_type: str   # "NO_PERMIT" | "OVERCROWDING" | "EXCLUSION_ZONE"
    required_permit:Optional[str]
    severity:       str   # "HIGH" | "CRITICAL"
    position:       Dict
    timestamp:      str


@dataclass
class ProximityHazard:
    worker_id:  str
    equipment:  str
    distance_m: float
    zone_id:    str
    severity:   str
    action:     str
    timestamp:  str


class RTLSManager:
    """
    Real-Time Location System manager.
    Generates realistic worker positions via random-walk simulation.
    Replace generate_worker_position() with real hardware polling
    when UWB/BLE anchors are installed.
    """

    TECHNOLOGY_ACCURACY: Dict[str, float] = {
        "uwb":       0.15,
        "ble":       3.0,
        "gps":       7.0,
        "simulated": 2.0,
    }

    def __init__(self, technology: str = "simulated"):
        self.technology = technology
        self._positions: Dict[str, Dict] = {}   # Last known position per worker

    # ── Position generation ───────────────────────────────────────────────────

    def get_zone_centre(self, zone_id: str) -> Tuple[float, float]:
        b = ZONE_BOUNDS.get(zone_id, ZONE_BOUNDS["ZB"])
        return (b["x"] + b["w"] / 2, b["y"] + b["h"] / 2)

    def generate_worker_position(self, worker_id: str, zone_id: str,
                                  worker_name: str = "") -> WorkerPosition:
        """
        Simulate worker position using a bounded random walk within their zone.
        Workers drift realistically — they don't teleport.
        """
        b = ZONE_BOUNDS.get(zone_id, ZONE_BOUNDS["ZB"])
        prev = self._positions.get(worker_id, {
            "x": b["x"] + b["w"] / 2,
            "y": b["y"] + b["h"] / 2,
        })

        # Small Gaussian step (sigma ≈ 2 pixels ≈ 2.8 m)
        new_x = prev["x"] + random.gauss(0, 2.2)
        new_y = prev["y"] + random.gauss(0, 2.2)

        # Clamp to zone bounds (workers stay in their zone)
        margin = 8
        new_x = max(b["x"] + margin, min(b["x"] + b["w"] - margin, new_x))
        new_y = max(b["y"] + margin, min(b["y"] + b["h"] - margin, new_y))

        self._positions[worker_id] = {"x": new_x, "y": new_y}

        return WorkerPosition(
            worker_id   = worker_id,
            worker_name = worker_name,
            zone_id     = zone_id,
            x           = round(new_x, 1),
            y           = round(new_y, 1),
            technology  = self.technology,
            accuracy_m  = self.TECHNOLOGY_ACCURACY.get(self.technology, 2.0),
            timestamp   = datetime.utcnow().isoformat(),
        )

    # ── Geofence checking ─────────────────────────────────────────────────────

    def check_geofence_violations(
        self,
        positions: List[WorkerPosition],
        active_permits: Optional[List[Dict]] = None,
    ) -> List[GeofenceViolation]:
        """
        Detect workers in restricted areas without valid permits.
        Also detects zone overcrowding vs. max_workers limit.
        """
        permits = active_permits or []
        violations: List[GeofenceViolation] = []

        # Check restricted area permits
        for pos in positions:
            for area_id, area in RESTRICTED_AREAS.items():
                if (area["x"] <= pos.x <= area["x"] + area["w"] and
                        area["y"] <= pos.y <= area["y"] + area["h"]):
                    has_permit = any(
                        p.get("permit_type") == area["requires_permit"]
                        and p.get("permit_holder_id") == pos.worker_id
                        and p.get("status") == "ACTIVE"
                        for p in permits
                    )
                    if not has_permit:
                        violations.append(GeofenceViolation(
                            worker_id      = pos.worker_id,
                            zone_id        = area["zone_id"],
                            area_id        = area_id,
                            area_label     = area["label"],
                            violation_type = "NO_PERMIT",
                            required_permit= area["requires_permit"],
                            severity       = "CRITICAL",
                            position       = {"x": pos.x, "y": pos.y},
                            timestamp      = datetime.utcnow().isoformat(),
                        ))

        # Check zone overcrowding
        zone_counts: Dict[str, int] = {}
        for pos in positions:
            zone_counts[pos.zone_id] = zone_counts.get(pos.zone_id, 0) + 1

        for zone_id, count in zone_counts.items():
            max_w = ZONE_BOUNDS.get(zone_id, {}).get("max_workers", 999)
            if count > max_w:
                violations.append(GeofenceViolation(
                    worker_id      = "ZONE_LEVEL",
                    zone_id        = zone_id,
                    area_id        = f"zone-{zone_id}",
                    area_label     = ZONE_BOUNDS[zone_id]["name"],
                    violation_type = "OVERCROWDING",
                    required_permit= None,
                    severity       = "HIGH",
                    position       = {},
                    timestamp      = datetime.utcnow().isoformat(),
                ))

        return violations

    # ── Proximity hazards ─────────────────────────────────────────────────────

    def check_proximity_hazards(self, positions: List[WorkerPosition]) -> List[ProximityHazard]:
        """Detect workers too close to heavy/rotating machinery."""
        hazards: List[ProximityHazard] = []
        for pos in positions:
            for ez in EXCLUSION_ZONES:
                dist_px = math.hypot(pos.x - ez["cx"], pos.y - ez["cy"])
                dist_m  = dist_px / PX_PER_METRE
                if dist_m < (ez["radius"] / PX_PER_METRE):
                    hazards.append(ProximityHazard(
                        worker_id  = pos.worker_id,
                        equipment  = ez["equipment"],
                        distance_m = round(dist_m, 1),
                        zone_id    = ez["zone_id"],
                        severity   = "CRITICAL" if dist_m < (ez["radius"] / PX_PER_METRE * 0.5) else "HIGH",
                        action     = f"Move worker ≥{ez['radius'] // PX_PER_METRE:.0f} m from {ez['equipment']}",
                        timestamp  = datetime.utcnow().isoformat(),
                    ))
        return hazards

    # ── Full snapshot ─────────────────────────────────────────────────────────

    def get_all_positions(self, workers: List[Dict],
                           active_permits: Optional[List[Dict]] = None) -> Dict:
        """Get complete RTLS snapshot for all workers."""
        positions = [
            self.generate_worker_position(w["id"], w.get("zone_id", "ZB"), w.get("name", ""))
            for w in workers
        ]

        violations      = self.check_geofence_violations(positions, active_permits)
        proximity_haz   = self.check_proximity_hazards(positions)

        # Zone occupancy
        zone_counts: Dict[str, int] = {}
        for p in positions:
            zone_counts[p.zone_id] = zone_counts.get(p.zone_id, 0) + 1

        return {
            "technology":        self.technology,
            "positions":         [p.__dict__ for p in positions],
            "geofence_violations":[v.__dict__ for v in violations],
            "proximity_hazards": [h.__dict__ for h in proximity_haz],
            "zone_occupancy":    zone_counts,
            "total_workers":     len(positions),
            "critical_count":    len([v for v in violations if v.severity == "CRITICAL"])
                                 + len([h for h in proximity_haz if h.severity == "CRITICAL"]),
            "zone_bounds":       ZONE_BOUNDS,
            "restricted_areas":  RESTRICTED_AREAS,
            "exclusion_zones":   EXCLUSION_ZONES,
            "timestamp":         datetime.utcnow().isoformat(),
        }

    def get_zone_summary(self) -> Dict:
        """Zone capacity vs. occupancy summary."""
        return {
            zone_id: {
                "name":        b["name"],
                "max_workers": b["max_workers"],
            }
            for zone_id, b in ZONE_BOUNDS.items()
        }


# Module-level singleton
manager = RTLSManager(technology="simulated")

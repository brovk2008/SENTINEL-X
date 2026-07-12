"""
SafetyOS — Gaussian Plume Hazard Dispersion Model
==================================================
ALOHA-inspired atmospheric dispersion modelling for toxic gas releases.
Uses Pasquill-Gifford stability classes A–F with Briggs dispersion coefficients.

Outputs threat-zone ellipses (OISD evacuation, ERPG-2, ERPG-3) in SVG
coordinate space for real-time overlay on the plant map.

Coordinate system: SVG 1000×420 (matches PlantMap.tsx viewBox)
Scale: 1 metre ≈ 0.7 SVG pixels at Vizag Unit 3 plant scale.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple


# ── Atmospheric conditions ────────────────────────────────────────────────────

@dataclass
class AtmosphericConditions:
    wind_speed_ms:     float   # m/s
    wind_direction_deg:float   # 0=N, 90=E, 180=S, 270=W
    temperature_c:     float   # ambient °C
    humidity_pct:      float   # % RH
    stability_class:   str     # Pasquill-Gifford A–F

    @classmethod
    def current_demo(cls) -> "AtmosphericConditions":
        """Demo atmospheric conditions (Vizag coastal climate)."""
        return cls(
            wind_speed_ms     = 2.8,
            wind_direction_deg= 225,   # SW wind (common in Vizag)
            temperature_c     = 34.0,
            humidity_pct      = 68.0,
            stability_class   = "C",   # Slightly unstable (daytime, moderate wind)
        )

    @classmethod
    def stability_from_wind(cls, wind_ms: float, hour_of_day: int) -> str:
        """Estimate Pasquill-Gifford stability class."""
        daytime = 9 <= hour_of_day <= 17
        if wind_ms < 2:
            return "A" if daytime else "F"
        if wind_ms < 3:
            return "B" if daytime else "E"
        if wind_ms < 5:
            return "C" if daytime else "D"
        return "D"


# ── Pasquill-Gifford dispersion coefficients (Briggs rural) ─────────────────

# σ_y = a·x / (1 + b·x)^0.5  — lateral spread
# σ_z = c·x · exp(-d·x)       — vertical spread
# Units: x in metres, σ in metres
PG_COEFFICIENTS: Dict[str, Dict] = {
    #   sy_a     sy_b      sz_a     sz_b
    "A": {"sy_a": 0.22, "sy_b": 0.0001, "sz_a": 0.20, "sz_b": 0.0000},
    "B": {"sy_a": 0.16, "sy_b": 0.0001, "sz_a": 0.12, "sz_b": 0.0000},
    "C": {"sy_a": 0.11, "sy_b": 0.0001, "sz_a": 0.08, "sz_b": 0.0002},
    "D": {"sy_a": 0.08, "sy_b": 0.0001, "sz_a": 0.06, "sz_b": 0.0015},
    "E": {"sy_a": 0.06, "sy_b": 0.0001, "sz_a": 0.03, "sz_b": 0.0003},
    "F": {"sy_a": 0.04, "sy_b": 0.0001, "sz_a": 0.016,"sz_b": 0.0003},
}


# ── Chemical database ─────────────────────────────────────────────────────────

CHEMICALS: Dict[str, Dict] = {
    "H2S": {
        "name":          "Hydrogen Sulfide",
        "formula":       "H₂S",
        "mol_weight":    34.1,
        "color":         "#ff3b3b",
        "lc50_ppm":      800,       # LC50 (1 h inhalation)
        "erpg1_ppm":     1,         # Mild effects
        "erpg2_ppm":     50,        # Irreversible/serious effects
        "erpg3_ppm":     150,       # Life-threatening
        "idlh_ppm":      100,       # NIOSH IDLH
        "oisd_ppm":      25,        # OISD evacuation threshold
        "twa_ppm":       1.0,       # OSHA TWA (8 h)
        "stel_ppm":      5.0,       # OSHA STEL (15 min)
        "lfl_pct":       4.0,       # Lower flammable limit
        "ufl_pct":       44.0,      # Upper flammable limit
        "density_rel":   1.19,      # Relative to air
        "odor_threshold_ppm": 0.008,
    },
    "CO": {
        "name":          "Carbon Monoxide",
        "formula":       "CO",
        "mol_weight":    28.0,
        "color":         "#ff6b35",
        "lc50_ppm":      1500,
        "erpg1_ppm":     25,
        "erpg2_ppm":     150,
        "erpg3_ppm":     500,
        "idlh_ppm":      1200,
        "oisd_ppm":      50,
        "twa_ppm":       50.0,
        "stel_ppm":      200.0,
        "lfl_pct":       12.5,
        "ufl_pct":       74.0,
        "density_rel":   0.97,
        "odor_threshold_ppm": None,    # Odourless
    },
    "LPG": {
        "name":          "Liquefied Petroleum Gas",
        "formula":       "C₃H₈/C₄H₁₀",
        "mol_weight":    44.1,
        "color":         "#ffaa00",
        "lc50_ppm":      None,
        "erpg1_ppm":     None,
        "erpg2_ppm":     None,
        "erpg3_ppm":     None,
        "idlh_ppm":      2100,
        "oisd_ppm":      10,           # % LEL
        "twa_ppm":       1000.0,
        "stel_ppm":      None,
        "lfl_pct":       1.8,
        "ufl_pct":       9.5,
        "density_rel":   1.52,
        "odor_threshold_ppm": 1.0,
    },
    "NH3": {
        "name":          "Ammonia",
        "formula":       "NH₃",
        "mol_weight":    17.0,
        "color":         "#9b59ff",
        "lc50_ppm":      1500,
        "erpg1_ppm":     25,
        "erpg2_ppm":     150,
        "erpg3_ppm":     750,
        "idlh_ppm":      300,
        "oisd_ppm":      25,
        "twa_ppm":       25.0,
        "stel_ppm":      35.0,
        "lfl_pct":       15.0,
        "ufl_pct":       28.0,
        "density_rel":   0.60,
        "odor_threshold_ppm": 5.0,
    },
}


# ── Gaussian Plume Model ──────────────────────────────────────────────────────

class GaussianPlumeModel:
    """
    Ground-level Gaussian plume dispersion model.
    Suitable for continuous point-source releases at ground level.

    Limitations (acceptable for industrial demo):
    - Does not model building wake effects
    - Flat terrain assumed
    - Steady-state conditions only
    """

    SVG_SCALE = 0.7     # SVG pixels per real metre

    def sigma_y(self, x_m: float, stability: str) -> float:
        """Lateral (crosswind) dispersion coefficient σ_y in metres."""
        c = PG_COEFFICIENTS[stability]
        return c["sy_a"] * x_m / math.sqrt(1 + c["sy_b"] * x_m)

    def sigma_z(self, x_m: float, stability: str) -> float:
        """Vertical dispersion coefficient σ_z in metres."""
        c = PG_COEFFICIENTS[stability]
        return c["sz_a"] * x_m * math.exp(-c["sz_b"] * x_m)

    def ground_concentration(self, Q_gs: float, u_ms: float,
                              x_m: float, y_m: float, H_m: float,
                              stability: str) -> float:
        """
        Ground-level concentration at (x, y) downwind.
        Q_gs  : emission rate [g/s]
        u_ms  : wind speed [m/s]
        x_m   : downwind distance [m]
        y_m   : crosswind distance [m]
        H_m   : effective release height [m]
        Returns concentration in µg/m³.
        Convert to ppm: ppm = (µg/m³ × 22.4) / (MW × 1000)   (at 25 °C)
        """
        if x_m <= 0 or u_ms < 0.1:
            return 0.0

        sy = self.sigma_y(x_m, stability)
        sz = self.sigma_z(x_m, stability)
        if sy < 1e-6 or sz < 1e-6:
            return 0.0

        # Factor: [µg/m³]
        term_xy = Q_gs * 1e6 / (2 * math.pi * u_ms * sy * sz)
        term_lat = math.exp(-0.5 * (y_m / sy) ** 2)
        term_vert = (math.exp(-0.5 * ((0 - H_m) / sz) ** 2) +   # ground reflected
                     math.exp(-0.5 * ((0 + H_m) / sz) ** 2))

        return term_xy * term_lat * term_vert

    def ug_to_ppm(self, conc_ugm3: float, mol_weight: float) -> float:
        """Convert µg/m³ → ppm at 25 °C (ideal gas)."""
        return conc_ugm3 * 22.4 / (mol_weight * 1000)

    def find_threshold_distance(self, Q_gs: float, u_ms: float,
                                  threshold_ppm: float, H_m: float,
                                  stability: str, mol_weight: float) -> float:
        """Binary search: downwind distance where centreline concentration = threshold."""
        lo, hi = 1.0, 5000.0
        for _ in range(60):
            mid = (lo + hi) / 2
            conc_ug = self.ground_concentration(Q_gs, u_ms, mid, 0, H_m, stability)
            conc_ppm = self.ug_to_ppm(conc_ug, mol_weight)
            if conc_ppm > threshold_ppm:
                lo = mid
            else:
                hi = mid
        return round(hi, 1)

    def compute_threat_zones(self, source: Dict,
                              conditions: AtmosphericConditions,
                              chemical_key: str = "H2S") -> Dict:
        """
        Compute threat-zone ellipses for plant map overlay.
        Returns zone polygons in SVG coordinate space.
        """
        chem = CHEMICALS.get(chemical_key, CHEMICALS["H2S"])
        Q_gs  = float(source.get("release_rate_gs", 8.0))
        H_m   = float(source.get("height_m", 1.5))
        src_x = float(source.get("svg_x", 540))
        src_y = float(source.get("svg_y", 300))

        mw = chem["mol_weight"]
        stab = conditions.stability_class

        # Compute downwind distances for each threshold
        zones_out = []
        thresholds = [
            ("OISD Evacuation Zone",        chem["oisd_ppm"],  "#ff3b3b", 0.28),
            ("ERPG-2 (Severe Effects)",     chem["erpg2_ppm"], "#ff6b35", 0.22),
            ("ERPG-3 (Life-threatening)",   chem["erpg3_ppm"], "#ffaa00", 0.15),
        ]

        for label, threshold, color, opacity in thresholds:
            if threshold is None:
                continue
            dist_m = self.find_threshold_distance(Q_gs, conditions.wind_speed_ms,
                                                   threshold, H_m, stab, mw)
            # Lateral half-width at downwind distance (σ_y × 2.15 ≈ 95% contour)
            sigma_y_at_dist = self.sigma_y(dist_m, stab)
            half_width_m    = sigma_y_at_dist * 2.15

            # Convert to SVG pixels
            length_px = dist_m * self.SVG_SCALE
            width_px  = half_width_m * self.SVG_SCALE

            # Wind direction → SVG vector (wind goes FROM direction → plume goes TO)
            # In SVG: +x = right, +y = down
            angle_rad = math.radians(conditions.wind_direction_deg)   # downwind direction
            dx = math.sin(angle_rad)
            dy = -math.cos(angle_rad)   # SVG y flipped

            zones_out.append({
                "label":         label,
                "threshold_ppm": threshold,
                "distance_m":    dist_m,
                "half_width_m":  round(half_width_m, 1),
                "length_px":     round(length_px, 1),
                "width_px":      round(width_px, 1),
                "color":         color,
                "opacity":       opacity,
                "ellipse": {        # SVG ellipse parameters
                    "cx":          round(src_x + dx * length_px / 2, 1),
                    "cy":          round(src_y + dy * length_px / 2, 1),
                    "rx":          round(length_px / 2, 1),
                    "ry":          round(width_px, 1),
                    "rotation_deg":round(conditions.wind_direction_deg, 1),
                },
            })

        affected = self._affected_zones(src_x, src_y,
                                         zones_out[0]["distance_m"] if zones_out else 0,
                                         conditions.wind_direction_deg)

        return {
            "chemical":          chemical_key,
            "chemical_name":     chem["name"],
            "chemical_formula":  chem["formula"],
            "source":            {"svg_x": src_x, "svg_y": src_y, "height_m": H_m, "release_rate_gs": Q_gs},
            "conditions":        {
                "wind_speed_ms":      conditions.wind_speed_ms,
                "wind_direction_deg": conditions.wind_direction_deg,
                "temperature_c":      conditions.temperature_c,
                "humidity_pct":       conditions.humidity_pct,
                "stability_class":    conditions.stability_class,
            },
            "zones":             zones_out,
            "affected_plant_zones": affected,
            "workers_at_risk":   source.get("workers_in_area", 6),
            "recommendation":    (
                f"Immediate evacuation within {zones_out[0]['distance_m']:.0f} m of source. "
                f"Wind carrying plume {conditions.wind_direction_deg:.0f}°. "
                f"Zones affected: {', '.join(affected) or 'None'}."
            ) if zones_out else "No significant dispersion zone.",
            "timestamp":         datetime.utcnow().isoformat(),
        }

    def _affected_zones(self, src_x: float, src_y: float,
                         dist_m: float, wind_deg: float) -> List[str]:
        """Identify which plant zones fall inside the plume footprint."""
        from integrations.rtls_manager import ZONE_BOUNDS

        dist_px  = dist_m * self.SVG_SCALE
        angle_rad = math.radians(wind_deg)
        dx = math.sin(angle_rad)
        dy = -math.cos(angle_rad)

        affected = []
        for zid, b in ZONE_BOUNDS.items():
            cx = b["x"] + b["w"] / 2
            cy = b["y"] + b["h"] / 2
            to_x = cx - src_x
            to_y = cy - src_y
            dist = math.hypot(to_x, to_y)
            if dist < 1e-6:
                affected.append(zid)
                continue
            dot = (to_x * dx + to_y * dy) / dist
            if dot > 0.45 and dist < dist_px * 1.4:
                affected.append(zid)
        return affected


# ── Demo scenario ─────────────────────────────────────────────────────────────

def get_active_demo_scenario() -> Dict:
    """Return the active demo dispersion scenario (H₂S from Zone C compressor bay)."""
    model = GaussianPlumeModel()
    conditions = AtmosphericConditions.current_demo()
    source = {
        "id":             "demo-h2s-zc",
        "label":          "H₂S Release — Compressor C-301 Seal Failure",
        "svg_x":          540.0,
        "svg_y":          300.0,
        "height_m":       1.5,
        "release_rate_gs":10.0,    # ~10 g/s = significant seal leak
        "workers_in_area":6,
    }
    result = model.compute_threat_zones(source, conditions, "H2S")
    result["scenario_active"] = True
    result["source_id"] = source["id"]
    return result


# Module-level model instance
plume_model = GaussianPlumeModel()

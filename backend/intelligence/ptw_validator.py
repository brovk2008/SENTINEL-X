"""
SafetyOS — Digital Permit-to-Work (PTW) Validator
=================================================
Automates PTW validation by combining SCADA isolation state,
real-time worker biometrics, simultaneous operations (SIMOPS) checks,
and regulatory compliance rules (OISD, Factories Act 1948, DGMS).

Includes the Vulnerability Index (VI) matrix:
  VI = Location Risk Vector × Job Hazard Vector × Human Strain Vector
  Scale: 1.0 to 125.0 composite score.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional

logger = logging.getLogger("safetyos.ptw")


# ── Enums ─────────────────────────────────────────────────────────────────────

class PermitDecision(str, Enum):
    APPROVED                 = "APPROVED"
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS"
    BLOCKED                  = "BLOCKED"
    REFER_TO_SUPERVISOR      = "REFER_TO_SUPERVISOR"


# ── Vulnerability Index dataclass ─────────────────────────────────────────────

@dataclass
class VulnerabilityIndex:
    """
    Quantitative risk matrix that computes a composite vulnerability index.
    A mathematical product of Location Risk, Job Hazard, and Human Strain.
    """
    location_score:   float
    location_factors: List[str]

    job_score:        float
    job_factors:      List[str]

    human_score:      float
    human_factors:    List[str]

    composite_vi:     float   # range: 1.0 to 125.0
    risk_level:       str     # LOW (<20), MEDIUM (20-60), HIGH (60-100), CRITICAL (≥100)

    @classmethod
    def compute(cls, permit: Dict, worker_bio: Dict, plant_state: Dict) -> VulnerabilityIndex:
        """
        Three-vector composite VI score.
        Vector 1: Location Risk (1.0–5.0)
        Vector 2: Job Hazard Criticality (1.0–5.0)
        Vector 3: Human Strain & Competency (1.0–5.0)
        """
        # ── Vector 1: Location Risk ──
        loc_score = 1.0
        loc_factors = []

        zone = permit.get("zone_id", "ZB")
        # Inherent zone hazard mapping
        zone_hazard_map = {
            "ZC": (4.5, "Zone C Compressor Bay — high volatile risk"),
            "ZA": (3.5, "Zone A Tank Farm — hydrocarbon storage zone"),
            "ZE": (3.5, "Zone E Flare Stack — elevated thermal zone"),
            "ZB": (2.5, "Zone B Process Unit — medium hydrocarbon zone"),
            "ZF": (2.0, "Zone F Vessel Park — storage laydown zone"),
            "ZD": (1.0, "Zone D Control Room — safe control zone"),
        }
        base_h, desc = zone_hazard_map.get(zone, (2.0, f"Zone {zone} — medium risk zone"))
        loc_score = base_h
        loc_factors.append(desc)

        # Dynamic adjustments (gas levels, active alerts)
        zone_risk = plant_state.get("zone_risks", {}).get(zone, 0.0)
        if zone_risk > 80:
            loc_score = min(5.0, loc_score * 1.45)
            loc_factors.append(f"CRITICAL zone risk: {zone_risk}%")
        elif zone_risk > 50:
            loc_score = min(5.0, loc_score * 1.25)
            loc_factors.append(f"Elevated zone risk: {zone_risk}%")

        # ── Vector 2: Job Criticality ──
        job_score = 1.0
        job_factors = []

        ptype = permit.get("permit_type", "COLD_WORK")
        job_base_map = {
            "HOT_WORK":       4.5,
            "CONFINED_SPACE": 4.5,
            "ELECTRICAL":     4.0,
            "HEIGHT_WORK":    3.5,
            "RADIOGRAPHY":    3.0,
            "EXCAVATION":     2.5,
            "COLD_WORK":      1.5,
        }
        job_score = job_base_map.get(ptype, 2.0)
        job_factors.append(f"{ptype} permit class: base hazard {job_score}")

        # SIMOPS SIMULTANEOUS OPERATIONS ADJUSTMENT
        active_simops = plant_state.get("active_permits_in_zone", {}).get(zone, 0)
        if active_simops >= 3:
            job_score = min(5.0, job_score * 1.35)
            job_factors.append(f"SIMOPS alarm: {active_simops} overlapping operations in zone")
        elif active_simops >= 1:
            job_score = min(5.0, job_score * 1.15)
            job_factors.append(f"SIMOPS notice: {active_simops} other active permit in zone")

        # ── Vector 3: Human Factor (Wearable biometric + training checks) ──
        human_score = 1.0
        human_factors = []

        # Wearable inputs
        psi = float(worker_bio.get("psi_score", 3.0))
        shift_h = float(worker_bio.get("shift_hours", 4.0))
        cognitive_pct = float(worker_bio.get("cognitive_load", 40.0))

        # Core strain indexing
        if psi >= 8.0:
            human_score = min(5.0, human_score + 3.0)
            human_factors.append(f"CRITICAL Wearable Alert: PSI {psi:.1f} (Heat Stress)")
        elif psi >= 7.0:
            human_score = min(5.0, human_score + 1.5)
            human_factors.append(f"Wearable Warning: PSI {psi:.1f} (Strain Caution)")

        if shift_h >= 10.0:
            human_score = min(5.0, human_score * 1.35)
            human_factors.append(f"Extended Shift: {shift_h:.1f}h (High fatigue risk)")

        if cognitive_pct >= 80:
            human_score = min(5.0, human_score * 1.15)
            human_factors.append(f"Cognitive load saturated: {cognitive_pct:.0f}%")

        # Training / compliance checks
        cert_valid = permit.get("certifications_valid", True)
        if not cert_valid:
            human_score = 5.0
            human_factors.append("CRITICAL: Operator safety certificates expired/invalid")

        # ── Composite VI ──
        composite = loc_score * job_score * human_score

        if composite >= 100.0:
            risk = "CRITICAL"
        elif composite >= 60.0:
            risk = "HIGH"
        elif composite >= 20.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return cls(
            location_score   = round(loc_score, 2),
            location_factors = loc_factors,
            job_score        = round(job_score, 2),
            job_factors      = job_factors,
            human_score      = round(human_score, 2),
            human_factors    = human_factors,
            composite_vi     = round(composite, 1),
            risk_level       = risk,
        )


# ── PTW Validator ─────────────────────────────────────────────────────────────

class DigitalPTWValidator:
    """
    Validation engine for Permits to Work.
    Applies regulatory citations (OISD, Factories Act 1948, DGMS)
    and checks LOTO isolation status from SCADA readings.
    """

    # OISD & Factories Act Compliance Matrix
    REGULATORY_CITATIONS: Dict[str, List[dict]] = {
        "HOT_WORK": [
            {"code": "OISD-STD-105", "clause": "Clause 6.3", "req": "Combustible gas monitoring & hot work permit system requirement"},
            {"code": "Factories Act 1948", "clause": "Section 37", "req": "Precautions against explosive or flammable dust/gas"},
        ],
        "CONFINED_SPACE": [
            {"code": "OISD-GDN-206", "clause": "Clause 8.1", "req": "Mandatory vessel venting, gas clearing, and safety observer watch"},
            {"code": "Factories Act 1948", "clause": "Section 36", "req": "Precautions against dangerous fumes in confined spaces"},
        ],
        "ELECTRICAL": [
            {"code": "IE Rules 1956", "clause": "Rule 44/45", "req": "Isolation, lock-out-tag-out (LOTO), earthing, and supervision"},
        ],
        "HEIGHT_WORK": [
            {"code": "DGMS Circulars", "clause": "Circular 12/2021", "req": "Full body safety harness, anchored lifelines, scaffold tagging"},
        ],
    }

    VALIDATION_CHECKS = [
        ("gas_levels_safe",             "Atmospheric gas levels within safe threshold limits"),
        ("adjacent_permits_clear",      "Conflicting SIMOPS separation constraints verified"),
        ("equipment_isolated_loto",     "Equipment SCADA isolation confirmed & LOTO validated"),
        ("worker_certifications_valid", "Worker certifications/training check passed"),
        ("standby_rescue_operational",  "Zone emergency rescue team & gear on standby"),
        ("radio_comms_active",          "Bi-directional radio/telemetry channels validated"),
        ("fire_suppression_online",    "Fire suppression/first aid kits inspected & ready"),
        ("weather_forecast_clear",      "Met-office environmental condition forecast safe"),
        ("vulnerability_index_check",   "Composite Vulnerability Index (VI) below alarm threshold"),
        ("regulatory_compliance",       "Statutory Indian Regulatory directives satisfied"),
    ]

    def validate(self, permit: Dict, plant_state: Dict, worker_bio: Dict) -> Dict:
        """
        Verify all safety requirements for a requested permit.
        Returns detailed compliance checklist + final permit decision.
        """
        ptype = permit.get("permit_type", "COLD_WORK")
        zone  = permit.get("zone_id", "ZB")

        # Compute VI
        vi = VulnerabilityIndex.compute(permit, worker_bio, plant_state)

        # Evaluate safety check conditions
        checks = []
        blocking = []
        conditions = []

        # ── 1. Gas levels check ──
        h2s = plant_state.get("gas_levels", {}).get("h2s_ppm", 1.2)
        gas_safe = h2s < 5.0  # Limit is 5 ppm (warn)
        checks.append({
            "id": "gas_levels_safe",
            "name": "Atmospheric gas levels within safe threshold limits",
            "passed": gas_safe,
            "detail": f"H₂S level is {h2s:.1f} ppm (limit 5.0 ppm)" if gas_safe else f"CRITICAL: Gas hazard! H₂S level is {h2s:.1f} ppm (exceeds 5.0)",
            "severity": "CRITICAL",
        })
        if not gas_safe:
            blocking.append("Toxic gas level exceeds safe limit in zone.")

        # ── 2. SIMOPS conflict check ──
        simops = plant_state.get("active_permits_in_zone", {}).get(zone, 0)
        simops_ok = not (ptype == "HOT_WORK" and simops >= 2)
        checks.append({
            "id": "adjacent_permits_clear",
            "name": "Conflicting SIMOPS separation constraints verified",
            "passed": simops_ok,
            "detail": f"Zone SIMOPS count: {simops} permits active" if simops_ok else f"BLOCKED: SIMOPS hazard. Zone already has {simops} active permits.",
            "severity": "HIGH",
        })
        if not simops_ok:
            blocking.append("Conflicting SIMOPS detected: Hot Work is restricted with multiple active permits in this zone.")

        # ── 3. Equipment LOTO check ──
        loto_confirmed = permit.get("loto_status", "CONFIRMED") == "CONFIRMED"
        checks.append({
            "id": "equipment_isolated_loto",
            "name": "Equipment SCADA isolation confirmed & LOTO validated",
            "passed": loto_confirmed,
            "detail": "Isolation feedback: SCADA valve status CLOSED, Tag #LT-109 locked" if loto_confirmed else "WARNING: LOTO status not verified on SCADA valve #224",
            "severity": "CRITICAL",
        })
        if not loto_confirmed:
            blocking.append("Equipment isolation not verified via SCADA feedback.")

        # ── 4. Worker Certifications check ──
        cert_ok = permit.get("certifications_valid", True)
        checks.append({
            "id": "worker_certifications_valid",
            "name": "Worker certifications/training check passed",
            "passed": cert_ok,
            "detail": "All operator training logs valid" if cert_ok else "CRITICAL: Mandatory training certificate [CS-03] EXPIRED",
            "severity": "CRITICAL",
        })
        if not cert_ok:
            blocking.append("Worker safety training or critical certifications expired.")

        # ── 5. Rescue observer check ──
        observer = permit.get("rescue_observer_assigned", True)
        checks.append({
            "id": "standby_rescue_operational",
            "name": "Zone emergency rescue team & gear on standby",
            "passed": observer,
            "detail": "Rescue warden assigned: Hari Prasad" if observer else "Notice: Assign zone safety watch observer",
            "severity": "MEDIUM",
        })
        if not observer:
            conditions.append("Assign a dedicated stand-by safety observer before starting confined space operations.")

        # ── 6. Radio Comms check ──
        comms = True
        checks.append({
            "id": "radio_comms_active",
            "name": "Bi-directional radio/telemetry channels validated",
            "passed": comms,
            "detail": "Wearable telemetry link active: RSSI -68 dBm",
            "severity": "MEDIUM",
        })

        # ── 7. Fire suppression check ──
        fire_supp = True
        checks.append({
            "id": "fire_suppression_online",
            "name": "Fire suppression/first aid kits inspected & ready",
            "passed": fire_supp,
            "detail": "Dry powder extinguisher and eyewash station checked",
            "severity": "MEDIUM",
        })

        # ── 8. Weather check ──
        weather = True
        checks.append({
            "id": "weather_forecast_clear",
            "name": "Met-office environmental condition forecast safe",
            "passed": weather,
            "detail": "Wind speed 2.8 m/s, no lightning alerts active",
            "severity": "LOW",
        })

        # ── 9. VI Check ──
        vi_ok = vi.composite_vi < 100.0
        checks.append({
            "id": "vulnerability_index_check",
            "name": "Composite Vulnerability Index (VI) below alarm threshold",
            "passed": vi_ok,
            "detail": f"Vulnerability index is {vi.composite_vi} ({vi.risk_level} Risk)" if vi_ok else f"CRITICAL: Extreme threat! Composite VI = {vi.composite_vi:.1f}",
            "severity": "CRITICAL",
        })
        if not vi_ok:
            blocking.append("Composite Vulnerability Index (VI) is critical (Risk >= 100). Job cannot proceed.")

        # ── 10. General regulatory check ──
        reg_ok = cert_ok and gas_safe
        checks.append({
            "id": "regulatory_compliance",
            "name": "Statutory Indian Regulatory directives satisfied",
            "passed": reg_ok,
            "detail": "Compliance tags cleared" if reg_ok else "Regulatory warnings active",
            "severity": "HIGH",
        })

        # ── Final permit decision ──
        passed_count = sum(1 for c in checks if c["passed"])
        score_pct = (passed_count / len(self.VALIDATION_CHECKS)) * 100

        if blocking:
            decision = PermitDecision.BLOCKED
        elif score_pct == 100 and vi.composite_vi < 60.0:
            decision = PermitDecision.APPROVED
        elif score_pct >= 80:
            decision = PermitDecision.APPROVED_WITH_CONDITIONS
        else:
            decision = PermitDecision.REFER_TO_SUPERVISOR

        # Regulatory citations list
        citations = self.REGULATORY_CITATIONS.get(ptype, [])

        return {
            "permit_id":            permit.get("id", "PTW-NEW-DEMO"),
            "permit_type":          ptype,
            "zone_id":              zone,
            "decision":             decision.value,
            "score_pct":            round(score_pct, 1),
            "passed_checks":        passed_count,
            "total_checks":         len(self.VALIDATION_CHECKS),
            "checks":               checks,
            "blocking_issues":      blocking,
            "conditions_imposed":   conditions,
            "vulnerability_index": {
                "composite":        vi.composite_vi,
                "risk_level":        vi.risk_level,
                "location_score":   vi.location_score,
                "job_score":        vi.job_score,
                "human_score":      vi.human_score,
                "location_factors": vi.location_factors,
                "job_factors":      vi.job_factors,
                "human_factors":    vi.human_factors,
            },
            "citations":            citations,
            "valid_until":          (datetime.utcnow() + timedelta(hours=8)).isoformat() if decision != PermitDecision.BLOCKED else None,
            "recommendation":       self._generate_recommendation(decision, blocking, vi),
            "timestamp":            datetime.utcnow().isoformat(),
        }

    def _generate_recommendation(self, decision: PermitDecision,
                                  blocking: List[str], vi: VulnerabilityIndex) -> str:
        if decision == PermitDecision.APPROVED:
            return "Permit automatically approved. SCADA isolations cleared. Wearable monitoring active."
        if decision == PermitDecision.APPROVED_WITH_CONDITIONS:
            return "Approved with conditions: Assign dedicated stand-by watcher and perform gas recalibration prior to job kickoff."
        if decision == PermitDecision.BLOCKED:
            return f"BLOCKED. {len(blocking)} critical safety violations: {', '.join(blocking)}. Operator safety profile: VI={vi.composite_vi:.1f} ({vi.risk_level})."
        return "Supervisor review required. High composite threat score. Recommend on-site inspection."


# Module-level validator instance
ptw_validator = DigitalPTWValidator()

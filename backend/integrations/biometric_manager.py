"""
SafetyOS — Worker Biometric Intelligence Manager
================================================
Manages real-time physiological data from industrial wearables.

Supported hardware (demo fallback always active):
  - Smart Helmet (heart rate, SpO2, impact detection)
  - Safety Vest (GPS, fall detection, panic button)
  - Smart Wristband (HRV, skin temperature, galvanic skin response)
  - Instrumented Insole (step count, postural pressure)
  - Integrated Gas Dosimeter (H2S, CO time-weighted average)

Key algorithms:
  - PSI (Physiological Strain Index) — Moran et al. 1998
  - WBGT (Wet Bulb Globe Temperature) heat stress index
  - Cumulative gas dose tracking per OSHA TWA methodology
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


# ── Enums ─────────────────────────────────────────────────────────────────────

class PhysiologicalStatus(str, Enum):
    OPTIMAL       = "OPTIMAL"
    CAUTION       = "CAUTION"
    HEAT_STRESS   = "HEAT_STRESS"
    FATIGUE       = "FATIGUE"
    CARDIAC_ALERT = "CARDIAC_ALERT"
    FALL_DETECTED = "FALL_DETECTED"
    MAN_DOWN      = "MAN_DOWN"


# ── Zone ambient conditions (synthetic) ───────────────────────────────────────
ZONE_AMBIENT = {
    "ZA": {"temp_c": 38, "humidity_pct": 72, "h2s_ppm": 2.1, "co_ppm": 4.2},
    "ZB": {"temp_c": 42, "humidity_pct": 68, "h2s_ppm": 1.8, "co_ppm": 3.1},
    "ZC": {"temp_c": 46, "humidity_pct": 65, "h2s_ppm": 12.4,"co_ppm": 8.7},  # Compressor Bay
    "ZD": {"temp_c": 26, "humidity_pct": 55, "h2s_ppm": 0.1, "co_ppm": 0.4},  # Control Room (AC)
    "ZE": {"temp_c": 35, "humidity_pct": 70, "h2s_ppm": 1.2, "co_ppm": 2.1},
    "ZF": {"temp_c": 40, "humidity_pct": 62, "h2s_ppm": 3.1, "co_ppm": 5.3},
}


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class WorkerBiometrics:
    # Identity
    worker_id:   str
    worker_name: str
    zone_id:     str
    role:        str
    shift_hours: float

    # Cardiovascular
    heart_rate:             float   # bpm
    heart_rate_variability: float   # ms  (higher = less stressed)
    spo2:                   float   # % O₂ saturation

    # Thermal
    skin_temperature: float   # °C
    ambient_temp:     float   # °C from local environmental sensor
    ambient_humidity: float   # % RH

    # Motion / Fatigue
    activity_level:       str     # "resting" | "walking" | "heavy_work"
    steps_this_shift:     int
    standing_hours:       float
    postural_strain_score:float   # 0–100

    # Cognitive
    cognitive_load_score: float   # 0–100 (AI-computed from HRV + task complexity)
    reaction_time_ms:     float   # vs. baseline (>20% increase = fatigue flag)

    # Gas exposure (integrated dosimeter)
    h2s_twa_ppm:        float   # 8-hour time-weighted average
    co_twa_ppm:         float
    cumulative_dose_pct:float   # % of max allowable daily dose consumed

    # Physiological Strain Index
    psi_score:      float   # 0–10 (≥7 = dangerous, ≥9 = emergency withdraw)
    psi_components: Dict

    # WBGT heat index
    wbgt_c: float   # Wet Bulb Globe Temperature °C (≥32 = high risk)

    # Status
    status: PhysiologicalStatus
    alerts: List[str]
    last_updated: datetime

    # RTLS location (optional — set by RTLSManager)
    rtls_x:          Optional[float] = None
    rtls_y:          Optional[float] = None
    rtls_accuracy_m: Optional[float] = None
    rtls_technology: Optional[str]  = None   # "uwb" | "ble" | "gps" | "simulated"


# ── Manager ───────────────────────────────────────────────────────────────────

class BiometricManager:
    """
    Generates and manages biometric data from industrial wearables.
    All methods produce synthetic data with realistic physiological patterns.
    When real wearable hardware is connected, replace generate_synthetic_biometrics()
    with real device polling.
    """

    # H2S OSHA TWA limit: 1 ppm (8 h); STEL: 5 ppm (15 min)
    H2S_TWA_LIMIT_PPM = 1.0
    # CO OSHA TWA limit: 50 ppm
    CO_TWA_LIMIT_PPM  = 50.0

    def __init__(self):
        # Per-worker rest baselines (set on first reading)
        self.baselines: Dict[str, Dict] = {}

    # ── PSI ──────────────────────────────────────────────────────────────────

    def compute_psi(self, heart_rate: float, skin_temp: float,
                    hr_rest: float = 72.0, t_skin_rest: float = 35.0,
                    age: int = 38) -> float:
        """
        Physiological Strain Index — Moran et al. 1998.
        PSI = 5·(HR_t − HR_0)/(HR_max − HR_0) + 5·(T_sk,t − T_sk,0)/(T_sk,max − T_sk,0)
        HR_max  = 220 − age
        T_sk,max = 40 °C
        """
        hr_max   = 220 - age
        t_sk_max = 40.0

        hr_component   = 5 * (heart_rate - hr_rest)  / max(1, hr_max  - hr_rest)
        temp_component = 5 * (skin_temp  - t_skin_rest) / max(0.1, t_sk_max - t_skin_rest)

        psi = max(0.0, min(10.0, hr_component + temp_component))
        return round(psi, 2)

    def compute_wbgt(self, dry_bulb_c: float, humidity_pct: float) -> float:
        """
        Simplified indoor WBGT (no solar radiation component).
        WBGT ≈ 0.7·Tw + 0.3·Ta  (indoor approximation)
        Tw (wet bulb) ≈ Ta − (100 − RH)/5   (Stull approximation)
        """
        wet_bulb = dry_bulb_c - (100 - humidity_pct) / 5.0
        wbgt = 0.7 * wet_bulb + 0.3 * dry_bulb_c
        return round(wbgt, 1)

    # ── Synthetic biometrics generator ───────────────────────────────────────

    def generate_synthetic_biometrics(self, worker: dict, hour_of_day: float = None) -> WorkerBiometrics:
        """
        Generate realistic biometric readings for one worker.
        Physiological patterns follow circadian rhythms + shift fatigue curves.
        """
        if hour_of_day is None:
            hour_of_day = datetime.utcnow().hour

        worker_id   = worker["id"]
        zone_id     = worker.get("zone_id", "ZB")
        shift_h     = worker.get("shift_hours_elapsed", 4.0)
        ambient     = ZONE_AMBIENT.get(zone_id, ZONE_AMBIENT["ZB"])

        # ── Fatigue factor: sigmoid curve, saturates at 12h ──────────────────
        fatigue = 1.0 / (1.0 + math.exp(-0.6 * (shift_h - 7.0)))  # 0→1

        # ── Set or retrieve baseline ──────────────────────────────────────────
        if worker_id not in self.baselines:
            self.baselines[worker_id] = {
                "hr_rest": 65.0 + random.uniform(0, 15),
                "t_skin_rest": 34.5 + random.uniform(0, 1),
                "reaction_baseline_ms": 220 + random.uniform(0, 40),
            }
        bl = self.baselines[worker_id]

        # ── Heart rate ────────────────────────────────────────────────────────
        hr_ambient_add = max(0, (ambient["temp_c"] - 28) * 0.6)
        hr_fatigue_add = fatigue * 22
        heart_rate = bl["hr_rest"] + hr_ambient_add + hr_fatigue_add + random.gauss(0, 3.5)

        # ── HRV (inverse of fatigue and stress) ───────────────────────────────
        hrv = max(8.0, 55 - fatigue * 40 - hr_ambient_add * 0.8 + random.gauss(0, 3))

        # ── Skin temperature ─────────────────────────────────────────────────
        skin_temp = (bl["t_skin_rest"]
                     + fatigue * 1.8
                     + max(0, (ambient["temp_c"] - 28)) * 0.09
                     + random.gauss(0, 0.18))

        # ── SpO₂ ──────────────────────────────────────────────────────────────
        spo2 = min(100.0, max(91.0,
                              98.5 - fatigue * 2.0
                              - max(0, (ambient["h2s_ppm"] - 5)) * 0.2
                              + random.gauss(0, 0.25)))

        # ── PSI & WBGT ────────────────────────────────────────────────────────
        psi  = self.compute_psi(heart_rate, skin_temp, bl["hr_rest"], bl["t_skin_rest"])
        wbgt = self.compute_wbgt(ambient["temp_c"], ambient["humidity_pct"])

        # ── Gas dosimetry (cumulative TWA) ───────────────────────────────────
        h2s_twa = ambient["h2s_ppm"] * (shift_h / 8.0)
        co_twa  = ambient["co_ppm"]  * (shift_h / 8.0)
        dose_pct = (h2s_twa / self.H2S_TWA_LIMIT_PPM) * 100

        # ── Cognitive load (HRV-derived + task complexity) ───────────────────
        cognitive_load = min(100.0, 38 + (55 - min(55, hrv)) * 1.1
                             + fatigue * 30 + random.gauss(0, 5))

        # ── Reaction time ─────────────────────────────────────────────────────
        reaction_time = (bl["reaction_baseline_ms"]
                         + fatigue * 85
                         + random.gauss(0, 12))

        # ── Activity level (Markov-ish based on role) ─────────────────────────
        role = worker.get("role", "Operator")
        if "Control" in role or "Manager" in role:
            activity = random.choices(["walking", "resting", "resting"], weights=[1, 3, 3])[0]
        else:
            activity = random.choices(["walking", "heavy_work", "resting"], weights=[4, 3, 1])[0]

        # ── Build alerts & status ─────────────────────────────────────────────
        alerts = []
        status = PhysiologicalStatus.OPTIMAL

        if psi >= 9.0:
            alerts.append(f"🚨 EMERGENCY WITHDRAW: PSI = {psi:.1f} — extreme physiological strain")
            status = PhysiologicalStatus.CARDIAC_ALERT
        elif psi >= 8.0:
            alerts.append(f"⚠ HEAT STRESS CRITICAL: PSI = {psi:.1f} (limit 7.0)")
            status = PhysiologicalStatus.HEAT_STRESS
        elif psi >= 7.0:
            alerts.append(f"Heat stress warning: PSI = {psi:.1f}")
            if status == PhysiologicalStatus.OPTIMAL:
                status = PhysiologicalStatus.CAUTION

        if wbgt >= 32.0:
            alerts.append(f"WBGT {wbgt:.1f} °C — mandatory hydration break required")

        if shift_h > 10.5:
            alerts.append(f"Extended shift: {shift_h:.1f}h — fatigue probability HIGH")
            if status == PhysiologicalStatus.OPTIMAL:
                status = PhysiologicalStatus.FATIGUE

        if dose_pct > 80:
            alerts.append(f"H₂S cumulative dose: {dose_pct:.0f}% of daily limit")

        if spo2 < 94:
            alerts.append(f"Low SpO₂: {spo2:.1f}% — check gas exposure")
            status = PhysiologicalStatus.CARDIAC_ALERT

        if heart_rate > 160:
            alerts.append(f"Elevated HR: {heart_rate:.0f} bpm — cardiac monitoring required")
            status = PhysiologicalStatus.CARDIAC_ALERT

        # ── Assemble result ───────────────────────────────────────────────────
        hr_cpt   = round((heart_rate - bl["hr_rest"]) / max(1, 180 - bl["hr_rest"]) * 5, 2)
        temp_cpt = round((skin_temp  - bl["t_skin_rest"]) / max(0.1, 40 - bl["t_skin_rest"]) * 5, 2)

        return WorkerBiometrics(
            worker_id             = worker_id,
            worker_name           = worker.get("name", "Unknown"),
            zone_id               = zone_id,
            role                  = worker.get("role", "Operator"),
            shift_hours           = round(shift_h, 1),
            heart_rate            = round(heart_rate, 1),
            heart_rate_variability= round(hrv, 1),
            spo2                  = round(spo2, 1),
            skin_temperature      = round(skin_temp, 1),
            ambient_temp          = ambient["temp_c"],
            ambient_humidity      = ambient["humidity_pct"],
            activity_level        = activity,
            steps_this_shift      = int(shift_h * 1100 + random.gauss(0, 150)),
            standing_hours        = round(shift_h * 0.72, 1),
            postural_strain_score = round(min(100, fatigue * 65 + random.gauss(0, 5)), 1),
            cognitive_load_score  = round(cognitive_load, 1),
            reaction_time_ms      = round(reaction_time, 0),
            h2s_twa_ppm           = round(h2s_twa, 3),
            co_twa_ppm            = round(co_twa, 2),
            cumulative_dose_pct   = round(dose_pct, 1),
            psi_score             = psi,
            psi_components        = {
                "heart_rate_contribution":   hr_cpt,
                "temperature_contribution":  temp_cpt,
            },
            wbgt_c                = wbgt,
            status                = status,
            alerts                = alerts,
            last_updated          = datetime.utcnow(),
        )

    def generate_fleet(self, workers: List[dict]) -> List[WorkerBiometrics]:
        """Generate biometrics for the entire worker fleet."""
        hour = datetime.utcnow().hour
        return [self.generate_synthetic_biometrics(w, hour) for w in workers]

    def fleet_summary(self, fleet: List[WorkerBiometrics]) -> dict:
        """Aggregate health summary for executive dashboard."""
        n = len(fleet)
        if n == 0:
            return {}

        return {
            "total_workers":        n,
            "at_risk":              sum(1 for w in fleet if w.status != PhysiologicalStatus.OPTIMAL),
            "heat_stress_cases":    sum(1 for w in fleet if w.status == PhysiologicalStatus.HEAT_STRESS),
            "cardiac_alerts":       sum(1 for w in fleet if w.status == PhysiologicalStatus.CARDIAC_ALERT),
            "fatigue_cases":        sum(1 for w in fleet if w.status == PhysiologicalStatus.FATIGUE),
            "avg_psi":              round(sum(w.psi_score for w in fleet) / n, 2),
            "max_psi":              round(max(w.psi_score for w in fleet), 2),
            "workers_over_psi_7":   sum(1 for w in fleet if w.psi_score > 7),
            "workers_over_psi_8":   sum(1 for w in fleet if w.psi_score > 8),
            "avg_h2s_dose_pct":     round(sum(w.cumulative_dose_pct for w in fleet) / n, 1),
            "workers_over_80pct_dose": sum(1 for w in fleet if w.cumulative_dose_pct > 80),
            "avg_shift_hours":      round(sum(w.shift_hours for w in fleet) / n, 1),
            "workers_over_10h":     sum(1 for w in fleet if w.shift_hours > 10),
            "avg_wbgt_c":           round(sum(w.wbgt_c for w in fleet) / n, 1),
            "status_distribution": {
                s.value: sum(1 for w in fleet if w.status == s)
                for s in PhysiologicalStatus
            },
        }


# Module-level manager instance
manager = BiometricManager()

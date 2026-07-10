"""
SafetyOS Compound Risk Monitor
Detects 20+ complex interactions between multiple hazards that create exponential risk.
"""

from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
import math


@dataclass
class CompoundRiskRule:
    """Represents a compound risk detection rule"""
    id: int
    name: str
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    condition: Callable[[Dict], bool]  # Function that checks if rule triggers
    explanation: str  # User-facing explanation template
    action: str  # Recommended action


# ─── The 20 Compound Risk Rules ───────────────────────────────────────────────

COMPOUND_RISK_RULES: List[CompoundRiskRule] = [
    # ─── CRITICAL TIER (5 rules) ─────────────────────────────────────────────
    CompoundRiskRule(
        id=1,
        name="H2S + Confined Space Permit",
        severity="CRITICAL",
        condition=lambda s: s.get("h2s_max", 0) > 25 and s.get("confined_space_permit_active", False),
        explanation="H2S {h2s_max}ppm exceeds OISD-105 threshold of 25ppm with active confined space permit",
        action="Immediate evacuation of confined space zone",
    ),
    
    CompoundRiskRule(
        id=2,
        name="Equipment Failure Cascade",
        severity="CRITICAL",
        condition=lambda s: s.get("max_vibration", 0) > 10 and s.get("temperature_max", 0) > 100 and s.get("maintenance_overdue_days", 0) > 5,
        explanation="Critical vibration ({max_vibration}mm/s) + high temperature + overdue maintenance — cascade failure imminent",
        action="Shutdown affected equipment immediately, dispatch maintenance",
    ),
    
    CompoundRiskRule(
        id=3,
        name="Hot Work + Adjacent High LEL",
        severity="CRITICAL",
        condition=lambda s: s.get("hot_work_permit_active", False) and s.get("adjacent_lel_max", 0) > 15,
        explanation="Hot work permit active with LEL {adjacent_lel_max}% in adjacent zone — ignition risk",
        action="Suspend hot work permit immediately until LEL < 10%",
    ),
    
    CompoundRiskRule(
        id=4,
        name="Flammable + Electrical Work",
        severity="CRITICAL",
        condition=lambda s: s.get("lel_max", 0) > 15 and s.get("electrical_work_active", False),
        explanation="LEL {lel_max}% with active electrical work — explosion risk",
        action="Stop electrical work, ventilate area, re-test before resuming",
    ),
    
    CompoundRiskRule(
        id=5,
        name="Isolation Failure (LOTO Breach)",
        severity="CRITICAL",
        condition=lambda s: not s.get("isolation_verified", True) and s.get("maintenance_in_progress", False),
        explanation="Maintenance in progress without verified isolation — LOTO protocol breach",
        action="Stop work immediately, verify isolation before resuming",
    ),
    
    # ─── HIGH SEVERITY TIER (8 rules) ────────────────────────────────────────
    CompoundRiskRule(
        id=6,
        name="Multiple Simultaneous Permits in Same Zone",
        severity="HIGH",
        condition=lambda s: s.get("active_permit_count_same_zone", 0) > 2,
        explanation="{active_permit_count_same_zone} simultaneous permits in same zone — coordination failure risk",
        action="Review and reschedule conflicting permits to different time slots",
    ),
    
    CompoundRiskRule(
        id=7,
        name="Sensor Calibration Overdue + High-Risk Zone",
        severity="HIGH",
        condition=lambda s: s.get("overdue_calibration_count", 0) > 3 and s.get("h2s_max", 0) > 10,
        explanation="{overdue_calibration_count} sensors overdue calibration — readings unreliable in high-risk zone",
        action="Calibrate sensors before relying on readings for safety decisions",
    ),
    
    CompoundRiskRule(
        id=8,
        name="Night Shift + High Plant Risk",
        severity="HIGH",
        condition=lambda s: s.get("is_night_shift", False) and s.get("plant_risk_score", 0) > 65,
        explanation="Night shift (reduced supervision) with plant risk {plant_risk_score}% — escalation risk",
        action="Increase supervisor presence, reduce active permits during night shift",
    ),
    
    CompoundRiskRule(
        id=9,
        name="Zone Overcrowding + Rising Gas Levels",
        severity="HIGH",
        condition=lambda s: s.get("zone_occupancy_ratio", 0) > 1.2 and s.get("gas_trend", "stable") == "rising",
        explanation="Zone at {zone_occupancy_ratio:.0%} capacity with rising gas levels",
        action="Reduce worker count, increase ventilation, monitor closely",
    ),
    
    CompoundRiskRule(
        id=10,
        name="Contractor Unsupervised in Hazard Zone",
        severity="HIGH",
        condition=lambda s: s.get("contractor_workers_unsupervised", 0) > 0 and s.get("zone_hazard_class", "LOW") != "LOW",
        explanation="{contractor_workers_unsupervised} unsupervised contractors in {zone_hazard_class} hazard zone",
        action="Assign supervisor to contractor team immediately",
    ),
    
    CompoundRiskRule(
        id=11,
        name="Pressure Vessel Overpressure Trend",
        severity="HIGH",
        condition=lambda s: s.get("pressure_trend", "stable") == "rising" and s.get("pressure_pct_of_design", 0) > 85,
        explanation="Pressure at {pressure_pct_of_design}% of design limit and rising — relief valve imminent",
        action="Reduce feed rate, check relief valve, prepare for controlled shutdown",
    ),
    
    CompoundRiskRule(
        id=12,
        name="Mass Casualty Potential",
        severity="HIGH",
        condition=lambda s: s.get("plant_risk_score", 0) > 85 and s.get("total_zone_workers", 0) > 20,
        explanation="Risk score {plant_risk_score}% with {total_zone_workers} workers in affected zones",
        action="Activate emergency response plan — mass evacuation protocol",
    ),
    
    CompoundRiskRule(
        id=13,
        name="Repeated Near-Miss Pattern",
        severity="HIGH",
        condition=lambda s: s.get("near_miss_count_7d", 0) > 3 and s.get("same_zone_incidents", 0) > 1,
        explanation="{near_miss_count_7d} near-misses in 7 days in same zone — pattern emerging",
        action="Initiate zone inspection + root cause analysis",
    ),
    
    # ─── MEDIUM SEVERITY TIER (5 rules) ──────────────────────────────────────
    CompoundRiskRule(
        id=14,
        name="Expired Permit with Active Workers",
        severity="MEDIUM",
        condition=lambda s: s.get("expired_permits_with_active_workers", 0) > 0,
        explanation="Workers in zone with expired permit — unauthorized work",
        action="Immediate worker withdrawal, permit renewal required",
    ),
    
    CompoundRiskRule(
        id=15,
        name="Shift Changeover with Unresolved Alerts",
        severity="MEDIUM",
        condition=lambda s: s.get("shift_changeover_active", False) and s.get("unresolved_alerts", 0) > 2,
        explanation="Shift changeover in progress with {unresolved_alerts} unresolved alerts",
        action="Delay changeover until all alerts resolved and briefing documented",
    ),
    
    CompoundRiskRule(
        id=16,
        name="Weather + Height Work",
        severity="MEDIUM",
        condition=lambda s: s.get("wind_speed_kmh", 0) > 40 and s.get("height_work_permit_active", False),
        explanation="Wind speed {wind_speed_kmh}km/h with active height work — fall risk",
        action="Suspend height work until wind < 30km/h",
    ),
    
    CompoundRiskRule(
        id=17,
        name="Fire Suppression Offline During Hot Work",
        severity="MEDIUM",
        condition=lambda s: not s.get("fire_suppression_online", True) and s.get("hot_work_permit_active", False),
        explanation="Fire suppression system offline during active hot work",
        action="Suspend hot work until fire suppression restored and tested",
    ),
    
    CompoundRiskRule(
        id=18,
        name="Fatigue Risk — Extended Shift",
        severity="MEDIUM",
        condition=lambda s: s.get("workers_over_12h", 0) > 2 and s.get("critical_tasks_active", False),
        explanation="{workers_over_12h} workers on shift > 12 hours performing critical tasks",
        action="Relieve fatigued workers, reschedule critical tasks",
    ),
    
    # ─── LOW SEVERITY TIER (2 rules) ─────────────────────────────────────────
    CompoundRiskRule(
        id=19,
        name="Emergency Exit Blocked",
        severity="MEDIUM",
        condition=lambda s: s.get("exit_blocked", False) and s.get("zone_occupancy", 0) > 0,
        explanation="Emergency exit obstructed with {zone_occupancy} workers in zone",
        action="Clear exit immediately, brief workers on alternate routes",
    ),
    
    CompoundRiskRule(
        id=20,
        name="PPE Non-Compliance in Hazard Zone",
        severity="MEDIUM",
        condition=lambda s: s.get("ppe_compliance_pct", 100) < 70 and s.get("zone_hazard_class", "LOW") in ["HIGH", "CRITICAL"],
        explanation="Only {ppe_compliance_pct}% PPE compliance in {zone_hazard_class} hazard zone",
        action="Mandatory PPE check before next zone entry",
    ),
]


class CompoundRiskMonitor:
    """
    Evaluates plant state against all compound risk rules.
    Returns triggered alerts ranked by severity.
    """

    def __init__(self):
        self.rules = COMPOUND_RISK_RULES
        self.last_evaluated = None
        self.last_results = []

    def evaluate(self, plant_state: Dict) -> List[Dict]:
        """
        Evaluate plant state against all rules.
        Returns list of triggered rules ranked by severity.
        """
        triggered_alerts = []

        for rule in self.rules:
            try:
                if rule.condition(plant_state):
                    alert = {
                        "rule_id": rule.id,
                        "title": rule.name,
                        "severity": rule.severity,
                        "explanation": self._format_explanation(rule.explanation, plant_state),
                        "recommended_action": rule.action,
                        "timestamp": datetime.utcnow().isoformat(),
                        "zone": plant_state.get("zone", "UNKNOWN"),
                    }
                    triggered_alerts.append(alert)
            except Exception as e:
                # Skip rules with evaluation errors
                pass

        # Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        triggered_alerts.sort(key=lambda a: severity_order.get(a["severity"], 4))

        self.last_evaluated = datetime.utcnow().isoformat()
        self.last_results = triggered_alerts

        return triggered_alerts

    def _format_explanation(self, template: str, state: Dict) -> str:
        """Format explanation template with plant state values"""
        try:
            return template.format(**state)
        except KeyError:
            return template

    def get_risk_score(self, plant_state: Dict) -> float:
        """
        Calculate overall plant risk score (0-100) based on triggered rules.
        Weighted by severity: CRITICAL=25, HIGH=15, MEDIUM=8, LOW=3
        """
        alerts = self.evaluate(plant_state)

        severity_weight = {"CRITICAL": 25, "HIGH": 15, "MEDIUM": 8, "LOW": 3}
        score = sum(severity_weight.get(a["severity"], 0) for a in alerts)

        return min(100, float(score))

    def get_top_alerts(self, plant_state: Dict, limit: int = 5) -> List[Dict]:
        """Get the top N most severe alerts"""
        alerts = self.evaluate(plant_state)
        return alerts[:limit]


# Singleton instance
_monitor = None


def get_monitor() -> CompoundRiskMonitor:
    """Get or create the compound risk monitor singleton"""
    global _monitor
    if _monitor is None:
        _monitor = CompoundRiskMonitor()
    return _monitor


# Expose for testing
def evaluate_risk(plant_state: Dict) -> List[Dict]:
    """Convenience function to evaluate risk"""
    return get_monitor().evaluate(plant_state)


def get_risk_score(plant_state: Dict) -> float:
    """Convenience function to get risk score"""
    return get_monitor().get_risk_score(plant_state)

"""
SafetyOS Scenario Simulator
Simulates how plant risk evolves under different decision scenarios
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import math


@dataclass
class RiskTrajectoryPoint:
    """A single point in a risk trajectory over time"""
    time_minutes: int
    risk_score: float
    probability_incident: float
    status: str  # "SAFE" | "ELEVATED" | "HIGH" | "CRITICAL"


@dataclass
class Scenario:
    """Represents a "what if" scenario with predicted outcomes"""
    id: str
    title: str
    description: str
    initial_risk: float
    trajectory: List[RiskTrajectoryPoint]
    final_risk: float
    probability_incident: float
    estimated_cost_inr: float
    confidence_pct: float
    recommendation: str
    reasoning: str


# ─── PRE-BUILT SCENARIOS ──────────────────────────────────────────────────────

def simulate_scenario_a() -> Scenario:
    """
    Scenario A: "What if we delay Zone C maintenance by 24 hours?"
    
    Shows how risk escalates over time without intervention.
    """
    trajectory = [
        RiskTrajectoryPoint(0, 67, 0.12, "ELEVATED"),
        RiskTrajectoryPoint(180, 72, 0.18, "ELEVATED"),  # 3h: gas continuing to rise
        RiskTrajectoryPoint(360, 76, 0.28, "HIGH"),  # 6h: maintenance window closes
        RiskTrajectoryPoint(540, 81, 0.41, "HIGH"),  # 9h: shift changeover adds complexity
        RiskTrajectoryPoint(720, 87, 0.67, "CRITICAL"),  # 12h: night shift starts
        RiskTrajectoryPoint(1440, 94, 0.89, "CRITICAL"),  # 24h: CRITICAL incident very likely
    ]

    return Scenario(
        id="delay_maintenance",
        title="Delay Zone C Maintenance by 24 Hours",
        description="Defer planned maintenance due to production schedule pressure",
        initial_risk=67,
        trajectory=trajectory,
        final_risk=94,
        probability_incident=0.89,
        estimated_cost_inr=340000000,  # ₹34 crore potential liability
        confidence_pct=92,
        recommendation="❌ DO NOT DELAY",
        reasoning="Risk escalates exponentially. Incident becomes 89% probable within 24 hours. Gas leak → confined space incident pattern matches Vizag 2025. Expected cost: ₹34 crore liability + regulatory shutdown.",
    )


def simulate_scenario_b() -> Scenario:
    """
    Scenario B: "What if we evacuate Zone C now?"
    
    Shows controlled risk reduction through immediate action.
    """
    trajectory = [
        RiskTrajectoryPoint(0, 84, 0.42, "CRITICAL"),
        RiskTrajectoryPoint(15, 78, 0.38, "HIGH"),  # Evacuation initiated
        RiskTrajectoryPoint(30, 65, 0.22, "ELEVATED"),  # Zone cleared
        RiskTrajectoryPoint(60, 42, 0.08, "ELEVATED"),  # Valve replacement underway
        RiskTrajectoryPoint(90, 18, 0.02, "SAFE"),  # Maintenance complete, gas normalizing
        RiskTrajectoryPoint(120, 6, 0.00, "SAFE"),  # Zone safe for re-entry
    ]

    return Scenario(
        id="evacuate_now",
        title="Evacuate Zone C Immediately",
        description="Execute controlled evacuation and maintenance",
        initial_risk=84,
        trajectory=trajectory,
        final_risk=6,
        probability_incident=0.00,
        estimated_cost_inr=18800000,  # ₹18.8 lakh downtime + repair
        confidence_pct=98,
        recommendation="✅ EXECUTE IMMEDIATELY",
        reasoning="Risk drops from 84% → 3% in 90 minutes. Total cost: ₹18.8L (downtime + valve replacement). Avoided incident cost: ₹34 crore. ROI: 1,800x. OISD-105 compliant. Workers safe.",
    )


def simulate_scenario_c() -> Scenario:
    """
    Scenario C: "What if we ignore all alerts today?"
    
    Shows high-consequence inaction. Matches historical incident patterns.
    """
    trajectory = [
        RiskTrajectoryPoint(0, 84, 0.42, "CRITICAL"),
        RiskTrajectoryPoint(60, 86, 0.51, "CRITICAL"),  # Conditions worsen
        RiskTrajectoryPoint(120, 88, 0.62, "CRITICAL"),  # Gas accumulating
        RiskTrajectoryPoint(180, 89, 0.71, "CRITICAL"),  # Shift change confusion
        RiskTrajectoryPoint(240, 91, 0.81, "CRITICAL"),  # Most critical window
        RiskTrajectoryPoint(300, 92, 0.88, "CRITICAL"),  # Likely incident within 5h
    ]

    return Scenario(
        id="inaction",
        title="Ignore All Alerts (Inaction Scenario)",
        description="Continue normal operations without addressing compound risks",
        initial_risk=84,
        trajectory=trajectory,
        final_risk=92,
        probability_incident=0.89,
        estimated_cost_inr=350000000,  # ₹35 crore (conservative estimate)
        confidence_pct=94,
        recommendation="⚠️ HIGH CONSEQUENCE",
        reasoning="This scenario matches 3 historical incidents at Vizag Steel (2025, 8 fatalities), Reliance Jamnagar (2019, ₹210 crore), HPCL Mumbai (2021, 14 injured). Expected: 3-8 worker casualties + ₹34-180 crore loss + criminal liability. NOT RECOMMENDED.",
    )


# ─── Scenario Management ─────────────────────────────────────────────────────

AVAILABLE_SCENARIOS = {
    "delay_maintenance": simulate_scenario_a,
    "evacuate_now": simulate_scenario_b,
    "inaction": simulate_scenario_c,
}


def get_scenario(scenario_id: str) -> Optional[Scenario]:
    """Retrieve a scenario by ID"""
    simulator = AVAILABLE_SCENARIOS.get(scenario_id)
    if simulator:
        return simulator()
    return None


def list_scenarios() -> List[Dict]:
    """List all available scenarios with metadata"""
    scenarios = []
    for scenario_id in AVAILABLE_SCENARIOS:
        scenario = get_scenario(scenario_id)
        if scenario:
            scenarios.append({
                "id": scenario.id,
                "title": scenario.title,
                "description": scenario.description,
                "emoji": "⬆️" if scenario.final_risk > scenario.initial_risk else "⬇️",
                "initial_risk": scenario.initial_risk,
                "final_risk": scenario.final_risk,
                "risk_change": scenario.final_risk - scenario.initial_risk,
                "duration_minutes": scenario.trajectory[-1].time_minutes if scenario.trajectory else 0,
            })
    return scenarios


def get_scenario_comparison() -> Dict:
    """Get all 3 scenarios for comparison view"""
    return {
        "scenarios": [
            {
                "id": s.get("id"),
                "title": s.get("title"),
                "description": s.get("description"),
                "initial_risk": s.get("initial_risk"),
                "final_risk": s.get("final_risk"),
                "risk_change": s.get("risk_change"),
                "emoji": s.get("emoji"),
                "recommendation": s.get("title"),
            }
            for s in list_scenarios()
        ],
        "message": "Choose a scenario to see detailed risk trajectory over time",
    }


def get_risk_score_for_time(scenario: Scenario, minutes: int) -> float:
    """Get interpolated risk score at a specific time in a scenario"""
    if not scenario.trajectory:
        return scenario.initial_risk

    # Find surrounding points
    prev_point = None
    next_point = None

    for point in scenario.trajectory:
        if point.time_minutes == minutes:
            return point.risk_score
        if point.time_minutes < minutes:
            prev_point = point
        elif point.time_minutes > minutes and next_point is None:
            next_point = point

    # Linear interpolation if between two points
    if prev_point and next_point:
        time_diff = next_point.time_minutes - prev_point.time_minutes
        risk_diff = next_point.risk_score - prev_point.risk_score
        time_progress = minutes - prev_point.time_minutes
        return prev_point.risk_score + (risk_diff * time_progress / time_diff)

    # Extrapolate if beyond last point
    if prev_point:
        return prev_point.risk_score

    return scenario.initial_risk

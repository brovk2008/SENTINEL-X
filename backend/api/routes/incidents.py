"""Incidents API — historical incident data + timeline replay."""
import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


def _generate_incident_timeline(start_iso: str, incident_iso: str) -> list:
    """Generate a sample timeline for incident replay."""
    start = datetime.fromisoformat(start_iso)
    incident = datetime.fromisoformat(incident_iso)

    events = [
        {"time": start.isoformat(), "type": "sensor", "description": "H2S-ZC-01: 3.2 ppm (normal)", "severity": "LOW"},
        {"time": (start + timedelta(minutes=5)).isoformat(), "type": "sensor", "description": "H2S-ZC-01: 5.8 ppm (rising)", "severity": "LOW"},
        {"time": (start + timedelta(minutes=12)).isoformat(), "type": "sensor", "description": "H2S-ZC-01: 11.2 ppm (above normal)", "severity": "MEDIUM"},
        {"time": (start + timedelta(minutes=20)).isoformat(), "type": "permit", "description": "PTW-2025-0847 Confined Space permit issued — Zone C", "severity": "INFO"},
        {"time": (start + timedelta(minutes=25)).isoformat(), "type": "sensor", "description": "H2S-ZC-01: 18.4 ppm (approaching warning)", "severity": "MEDIUM"},
        {"time": (start + timedelta(minutes=30)).isoformat(), "type": "ai_flag", "description": "⚠️ AI WOULD HAVE FLAGGED: H2S rising with active confined space permit — COMPOUND RISK", "severity": "HIGH"},
        {"time": (start + timedelta(minutes=35)).isoformat(), "type": "sensor", "description": "H2S-ZC-01: 26.1 ppm (exceeded OISD threshold)", "severity": "CRITICAL"},
        {"time": (start + timedelta(minutes=38)).isoformat(), "type": "sensor", "description": "H2S-ZC-01: 31.4 ppm (CRITICAL)", "severity": "CRITICAL"},
        {"time": (start + timedelta(minutes=42)).isoformat(), "type": "sensor", "description": "Worker exposure detected — alarm triggered", "severity": "CRITICAL"},
        {"time": incident.isoformat(), "type": "incident", "description": "💥 INCIDENT: Workers evacuated, medical response initiated", "severity": "CRITICAL"},
    ]
    return events


# Synthetic historical incidents for demo
SYNTHETIC_INCIDENTS = [
    {
        "id": "inc-001",
        "incident_number": "INC-2025-0031",
        "title": "H2S Release — Compressor Bay Confined Space Entry",
        "description": "H2S leaked from a faulty valve seal during confined space maintenance. Two workers were exposed before sensors triggered an alarm. Both recovered after treatment.",
        "incident_type": "near_miss",
        "severity": "HIGH",
        "occurred_at": "2025-03-15T14:23:00",
        "zone": "ZC",
        "casualties": 0,
        "financial_impact": 4200000,
        "root_cause": "Inadequate pre-entry gas testing. Permit issued without verifying SCADA gas readings.",
        "regulation_violated": "OISD-105-4.3",
        "ai_would_have_caught": True,
        "ai_intervention_time": "47 minutes before incident",
        "contributing_factors": [
            "Gas test performed 90 minutes before entry (OISD requires within 60 minutes)",
            "Permit issued by junior officer without supervisor review",
            "Wind direction change not accounted for",
        ],
        "timeline_data": _generate_incident_timeline("2025-03-15T13:36:00", "2025-03-15T14:23:00"),
    },
    {
        "id": "inc-002",
        "incident_number": "INC-2024-0187",
        "title": "Pump P-203 Bearing Failure — Production Loss",
        "description": "Pump P-203 suffered a catastrophic bearing failure after vibration warnings were ignored for 5 days. Plant shut down for 8 hours.",
        "incident_type": "equipment_failure",
        "severity": "MEDIUM",
        "occurred_at": "2024-09-08T09:15:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 18500000,
        "root_cause": "Vibration alerts suppressed by operator. No escalation protocol triggered.",
        "ai_would_have_caught": True,
        "ai_intervention_time": "5 days before failure",
        "contributing_factors": [
            "Vibration rose 340% over 5 days with no action taken",
            "Alert fatigue — operators had suppressed 23 alerts that week",
            "Maintenance crew on leave during critical period",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-003",
        "incident_number": "INC-2024-0054",
        "title": "Hot Work Permit Issued Without Adequate Gas Survey",
        "description": "Hot work permit issued in Zone B. LEL rose to 18% during work — work stopped before ignition.",
        "incident_type": "near_miss",
        "severity": "CRITICAL",
        "occurred_at": "2024-04-22T11:42:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 850000,
        "root_cause": "LEL sensor ZB-02 was offline for calibration. Alternate sensor not consulted before permit issuance.",
        "regulation_violated": "OISD-116-2.1",
        "ai_would_have_caught": True,
        "ai_intervention_time": "12 minutes before work started",
        "contributing_factors": [
            "Sensor ZB-02 offline for calibration — no substitute sensor check",
            "Wind direction shifted gas from Tank Farm into Zone B",
            "Permit officer did not verify all gas sensors were operational",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-004",
        "incident_number": "INC-2023-0291",
        "title": "Night Shift Handover — Open Risk Not Communicated",
        "description": "Elevated temperature in HX-501 not mentioned during shift handover. Morning team unaware. Process upset resulted in 4-hour shutdown.",
        "incident_type": "process_upset",
        "severity": "MEDIUM",
        "occurred_at": "2023-11-03T06:45:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 6200000,
        "root_cause": "Manual handover process missed critical anomaly. No automated shift summary.",
        "ai_would_have_caught": True,
        "ai_intervention_time": "Would have flagged in automated handover report",
        "contributing_factors": [
            "Night shift handover was verbal only — no written log",
            "TEMP-HX501 showed warning-level readings for 3 hours before handover",
            "Incoming supervisor did not review SCADA before assuming control",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-005",
        "incident_number": "INC-2025-0015",
        "title": "Pump Seal Failure — Zone B Processing Unit",
        "description": "Centrifugal pump seal failure during pressurized operation. Minor spillage contained, no worker exposure.",
        "incident_type": "near_miss",
        "severity": "MODERATE",
        "occurred_at": "2024-08-14T09:23:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 850000,
        "root_cause": "Inadequate pre-job hazard assessment",
        "regulation_violated": "OISD-105",
        "ai_would_have_caught": True,
        "ai_intervention_time": "2 hours before incident",
        "contributing_factors": [
            "Mechanical seal not inspected during startup",
            "Vibration threshold alert ignored for 4 hours",
            "Maintenance team unfamiliar with new pump model",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-006",
        "incident_number": "INC-2024-0203",
        "title": "Tank Overpressure — Relief Valve Stuck",
        "description": "Storage tank T-407 reached 1.8x normal pressure before relief valve activated. No rupture occurred.",
        "incident_type": "near_miss",
        "severity": "HIGH",
        "occurred_at": "2024-07-22T16:54:00",
        "zone": "ZA",
        "casualties": 0,
        "financial_impact": 1200000,
        "root_cause": "Preventive maintenance on relief valve overdue by 14 days",
        "regulation_violated": "OISD-118-3.2",
        "ai_would_have_caught": True,
        "ai_intervention_time": "9 days before incident",
        "contributing_factors": [
            "Maintenance schedule slipped due to staffing shortage",
            "No automated alert for overdue equipment maintenance",
            "Pressure sensor calibration drift — actual pressure 12% higher than displayed",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-007",
        "incident_number": "INC-2023-0156",
        "title": "Worker Heat Exhaustion — Zone C Coke Battery",
        "description": "Contract worker suffered heat exhaustion during 6-hour shift in high-temperature zone. Recovered after medical intervention.",
        "incident_type": "injury",
        "severity": "MEDIUM",
        "occurred_at": "2023-06-18T14:07:00",
        "zone": "ZC",
        "casualties": 1,
        "financial_impact": 120000,
        "root_cause": "Inadequate break intervals in high-temperature zones during summer",
        "regulation_violated": "Factory Act Section 36",
        "ai_would_have_caught": False,
        "contributing_factors": [
            "Ambient temperature 48°C — hottest day of summer",
            "Worker on 6-hour shift without breaks",
            "Contractor not informed of zone-specific thermal hazards",
            "No real-time worker thermal load monitoring",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-008",
        "incident_number": "INC-2024-0089",
        "title": "Isolation Lock Failure — LOTO Breach",
        "description": "Equipment isolation pin broken during maintenance, causing uncontrolled restart. No worker injuries.",
        "incident_type": "near_miss",
        "severity": "CRITICAL",
        "occurred_at": "2024-05-11T11:34:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 450000,
        "root_cause": "LOTO procedure not followed — isolation verified without independent confirmation",
        "regulation_violated": "OISD-105-5.1 (LOTO)",
        "ai_would_have_caught": True,
        "ai_intervention_time": "15 minutes before incident",
        "contributing_factors": [
            "Maintenance technician performed isolation verification alone (requires 2 people)",
            "No automated confirmation that isolation was verified",
            "LOTO training last done 18 months ago (annual required)",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-009",
        "incident_number": "INC-2025-0008",
        "title": "Chemical Incompatibility — Reaction in Tank Truck",
        "description": "Driver loaded incompatible chemicals into same tank truck. Exothermic reaction detected, truck safely evacuated.",
        "incident_type": "near_miss",
        "severity": "HIGH",
        "occurred_at": "2025-02-03T10:12:00",
        "zone": "ZD",
        "casualties": 0,
        "financial_impact": 2100000,
        "root_cause": "Loading manifest not cross-checked against chemical compatibility matrix",
        "regulation_violated": "OISD-116-1.4",
        "ai_would_have_caught": True,
        "ai_intervention_time": "8 minutes before incident",
        "contributing_factors": [
            "Driver receives new chemical assignment — no compatibility check performed",
            "Manifest system is paper-based (no digital validation)",
            "Driver not trained on chemical compatibility rules for this assignment",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-010",
        "incident_number": "INC-2024-0267",
        "title": "Electrical Equipment Fault — Motor Burnout",
        "description": "AC induction motor in Zone E utilities failed due to insulation breakdown. Replaced under warranty.",
        "incident_type": "equipment_failure",
        "severity": "LOW",
        "occurred_at": "2024-10-29T08:43:00",
        "zone": "ZE",
        "casualties": 0,
        "financial_impact": 185000,
        "root_cause": "Moisture ingress due to improper drainage — condensation accumulated",
        "regulation_violated": None,
        "ai_would_have_caught": False,
        "contributing_factors": [
            "Motor in poorly ventilated location with seasonal humidity",
            "No predictive monitoring on motor health",
            "Maintenance records show no humidity checks in this zone",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-011",
        "incident_number": "INC-2023-0312",
        "title": "Flare Stack Flame Extinction — Unburned Gas Release",
        "description": "Flare stack flame extinguished during high wind event. Unburned hydrocarbons released for 18 minutes.",
        "incident_type": "emission",
        "severity": "MEDIUM",
        "occurred_at": "2023-12-14T19:22:00",
        "zone": "ZF",
        "casualties": 0,
        "financial_impact": 320000,
        "root_cause": "Flare pilot light insufficient during extreme wind (wind gusts > 65 km/h)",
        "regulation_violated": "Environmental Protection Act",
        "ai_would_have_caught": True,
        "ai_intervention_time": "Would have recommended flare gas recovery during high wind",
        "contributing_factors": [
            "Wind speed sensor in Zone F not integrated with flare control system",
            "No automatic pilot light boost during high wind conditions",
            "Manual monitoring only — automatic detection system offline",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-012",
        "incident_number": "INC-2024-0134",
        "title": "Contractor Team Unsupervised — Safety Protocol Violation",
        "description": "Contractor crew of 5 workers found working in high-hazard zone without assigned supervisor.",
        "incident_type": "administrative",
        "severity": "HIGH",
        "occurred_at": "2024-06-07T13:15:00",
        "zone": "ZC",
        "casualties": 0,
        "financial_impact": 50000,
        "root_cause": "Supervisor reassigned mid-shift without turnover protocol",
        "regulation_violated": "Contract Labor (Regulation) Act",
        "ai_would_have_caught": True,
        "ai_intervention_time": "Real-time detection via worker location tracking",
        "contributing_factors": [
            "Original supervisor called away for urgent meeting",
            "No backup supervisor assigned to contractor team",
            "No automated check-in system for contractor supervision",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-013",
        "incident_number": "INC-2025-0022",
        "title": "False Alarm — Sensor Drift Caused by Calibration Error",
        "description": "CO detector showed 220 ppm — plant evacuated unnecessarily. Sensor was simply miscalibrated.",
        "incident_type": "false_alarm",
        "severity": "LOW",
        "occurred_at": "2025-01-19T15:41:00",
        "zone": "ZE",
        "casualties": 0,
        "financial_impact": 780000,
        "root_cause": "Sensor calibration interval skipped in maintenance schedule",
        "regulation_violated": None,
        "ai_would_have_caught": True,
        "ai_intervention_time": "Would have flagged sensor as overdue for calibration",
        "contributing_factors": [
            "Sensor last calibrated 24 months ago (18-month interval required)",
            "No automated calibration reminder system",
            "Evacuation protocol executed without sensor validation cross-check",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-014",
        "incident_number": "INC-2023-0198",
        "title": "Permit Extension Granted Without Risk Re-evaluation",
        "description": "Work permit PTW-2023-0445 extended by 4 hours without re-evaluating zone conditions. Temperature spike occurred during extension.",
        "incident_type": "near_miss",
        "severity": "MEDIUM",
        "occurred_at": "2023-09-11T17:28:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 640000,
        "root_cause": "Permit extension approved without fresh hazard assessment",
        "regulation_violated": "OISD-116-3.5",
        "ai_would_have_caught": True,
        "ai_intervention_time": "2 hours before incident",
        "contributing_factors": [
            "Original permit: valid 08:00–16:00. Extended to 20:00 without conditions review",
            "Afternoon equipment startup sequence (17:00) was not considered",
            "No rule requiring risk re-evaluation on permit extension",
        ],
        "timeline_data": [],
    },
    {
        "id": "inc-015",
        "incident_number": "INC-2024-0045",
        "title": "Near-Miss: Workers in Zone During Maintenance Window",
        "description": "3 process operators remained in Zone B during scheduled maintenance window. Crane overhead activated with load.",
        "incident_type": "near_miss",
        "severity": "HIGH",
        "occurred_at": "2024-03-29T14:05:00",
        "zone": "ZB",
        "casualties": 0,
        "financial_impact": 0,
        "root_cause": "Shift changeover miscommunication — incoming shift not informed of crane work",
        "regulation_violated": "OISD-105-2.4",
        "ai_would_have_caught": True,
        "ai_intervention_time": "14 minutes before incident",
        "contributing_factors": [
            "Maintenance schedule not shared with operational teams",
            "No automated zone occupancy check before equipment startup",
            "Shift handover was verbal — incoming supervisor did not review maintenance board",
        ],
        "timeline_data": [],
    },
]


@router.get("/")
async def list_incidents(
    severity: Optional[str] = None,
    zone: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    skip: int = Query(default=0, ge=0)
):
    """List historical incidents."""
    incidents = SYNTHETIC_INCIDENTS
    if severity:
        incidents = [i for i in incidents if i["severity"] == severity.upper()]
    if zone:
        incidents = [i for i in incidents if i.get("zone") == zone.upper()]
    return {"incidents": incidents[skip:skip+limit], "total": len(SYNTHETIC_INCIDENTS), "filtered": len(incidents)}


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    """Get incident detail with timeline data for replay."""
    incident = next((i for i in SYNTHETIC_INCIDENTS if i["id"] == incident_id), None)
    if not incident:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.get("/{incident_id}/timeline")
async def get_incident_timeline(incident_id: str):
    """Get timeline events for incident replay player."""
    incident = next((i for i in SYNTHETIC_INCIDENTS if i["id"] == incident_id), None)
    if not incident:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")

    timeline = incident.get("timeline_data") or _generate_incident_timeline(
        (datetime.fromisoformat(incident["occurred_at"]) - timedelta(hours=1)).isoformat(),
        incident["occurred_at"]
    )

    return {
        "incident_id": incident_id,
        "incident_number": incident["incident_number"],
        "title": incident["title"],
        "timeline": timeline,
        "ai_intervention_time": incident.get("ai_intervention_time"),
        "ai_would_have_caught": incident.get("ai_would_have_caught", True),
    }


@router.get("/{incident_id}/rca")
async def get_incident_rca(incident_id: str):
    """Generate Root Cause Analysis for an incident."""
    incident = next((i for i in SYNTHETIC_INCIDENTS if i["id"] == incident_id), None)
    if not incident:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")

    from core.llm_router import chat
    prompt = f"""Generate a structured Root Cause Analysis (RCA) for this industrial incident:

Incident: {incident['title']}
Description: {incident['description']}
Root Cause (known): {incident['root_cause']}
Contributing Factors: {', '.join(incident.get('contributing_factors', []))}
Regulation Violated: {incident.get('regulation_violated', 'Not specified')}

Format as:
1. Immediate Cause
2. Root Causes (5 Why analysis)
3. Contributing Factors
4. Regulatory Gaps
5. Recommendations (5 specific, actionable)
6. How SafetyOS Would Have Prevented This"""

    try:
        rca_text = await chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1500
        )
    except Exception:
        rca_text = f"""Root Cause Analysis — {incident['title']}

1. Immediate Cause: {incident['root_cause']}

2. Root Causes: 
   - {chr(10).join('   - ' + f for f in incident.get('contributing_factors', ['Insufficient safety protocols']))}

3. Contributing Factors: Process gaps, inadequate monitoring, alert fatigue

4. Regulatory Gaps: {incident.get('regulation_violated', 'N/A')} compliance failure

5. Recommendations:
   - Implement automated pre-entry gas testing verification
   - Enable AI compound risk detection (SafetyOS CR-001)
   - Enforce permit-sensor correlation before issuance
   - Reduce alert suppression thresholds
   - Mandate supervisor review for confined space permits

6. SafetyOS Prevention: Would have flagged {incident.get('ai_intervention_time', 'before incident')}"""

    return {
        "incident_id": incident_id,
        "rca_report": rca_text,
        "generated_at": datetime.utcnow().isoformat(),
    }

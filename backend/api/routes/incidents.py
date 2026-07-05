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
]


@router.get("/")
async def list_incidents(
    severity: Optional[str] = None,
    zone: Optional[str] = None,
    limit: int = Query(default=20, le=100)
):
    """List historical incidents."""
    incidents = SYNTHETIC_INCIDENTS
    if severity:
        incidents = [i for i in incidents if i["severity"] == severity.upper()]
    if zone:
        incidents = [i for i in incidents if i.get("zone") == zone.upper()]
    return {"incidents": incidents[:limit], "total": len(incidents)}


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

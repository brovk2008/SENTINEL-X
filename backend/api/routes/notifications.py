"""Notifications, Workers, Plants, Analytics, Cameras, Reports API stubs."""
import logging
from datetime import datetime
from fastapi import APIRouter

logger = logging.getLogger(__name__)

# ─── Notifications ────────────────────────────────────────────────────────────
notifications_router = APIRouter()

SYNTHETIC_NOTIFICATIONS = [
    {"id": "n1", "title": "Compound Risk Alert — Zone C", "body": "H2S + Confined Space permit combination detected. Risk score: 84%", "severity": "CRITICAL", "timestamp": datetime.utcnow().isoformat(), "read": False},
    {"id": "n2", "title": "Vibration Warning — Compressor C-301", "body": "Vibration elevated to 7.2mm/s. Schedule inspection.", "severity": "HIGH", "timestamp": datetime.utcnow().isoformat(), "read": False},
    {"id": "n3", "title": "Permit Expiry — PTW-2025-0839", "body": "Electrical permit expires in 30 minutes. Confirm exit plan.", "severity": "MEDIUM", "timestamp": datetime.utcnow().isoformat(), "read": True},
]


# ─── Workers ─────────────────────────────────────────────────────────────────
workers_router = APIRouter()

SYNTHETIC_WORKERS = [
    {"id": "w1", "name": "Ramesh Kumar", "role": "Maintenance Technician", "zone": "ZC", "shift": "morning", "is_supervisor": False},
    {"id": "w2", "name": "Aditya Singh", "role": "Process Operator", "zone": "ZB", "shift": "morning", "is_supervisor": False},
    {"id": "w3", "name": "Dr. Priya Sharma", "role": "Plant Manager", "zone": "ZD", "shift": "morning", "is_supervisor": True},
    {"id": "w4", "name": "Suresh Patel", "role": "Safety Officer", "zone": "ZD", "shift": "morning", "is_supervisor": True},
    {"id": "w5", "name": "Vikram Nair", "role": "Electrical Technician", "zone": "ZD", "shift": "morning", "is_supervisor": False},
]


# ─── Plants ──────────────────────────────────────────────────────────────────
plants_router = APIRouter()

SYNTHETIC_PLANTS = [
    {"id": "plant-001", "name": "Bharat Petrochemicals Refinery Unit 3", "location": "Vishakhapatnam, AP", "risk_score": 67, "status": "ELEVATED", "lat": 17.68, "lng": 83.21},
    {"id": "plant-002", "name": "Gujarat Chemicals Complex", "location": "Vadodara, Gujarat", "risk_score": 23, "status": "NORMAL", "lat": 22.30, "lng": 73.19},
    {"id": "plant-003", "name": "Mumbai Refinery South", "location": "Chembur, Maharashtra", "risk_score": 41, "status": "MODERATE", "lat": 19.04, "lng": 72.87},
    {"id": "plant-004", "name": "Chennai Petrochemicals Ltd", "location": "Ennore, Tamil Nadu", "risk_score": 18, "status": "NORMAL", "lat": 13.22, "lng": 80.33},
]


# ─── Analytics ───────────────────────────────────────────────────────────────
analytics_router = APIRouter()


# ─── Cameras ─────────────────────────────────────────────────────────────────
cameras_router = APIRouter()

SYNTHETIC_CAMERAS = [
    {"id": "cam-001", "name": "Zone A — Tank Farm Overview", "zone": "ZA", "type": "simulated", "workers_detected": 2, "ppe_compliant": 2, "restricted_zone_violations": 0, "status": "online"},
    {"id": "cam-002", "name": "Zone B — Process Unit East", "zone": "ZB", "type": "simulated", "workers_detected": 4, "ppe_compliant": 3, "restricted_zone_violations": 0, "status": "online"},
    {"id": "cam-003", "name": "Zone C — Compressor Bay", "zone": "ZC", "type": "simulated", "workers_detected": 7, "ppe_compliant": 5, "restricted_zone_violations": 1, "status": "online"},
    {"id": "cam-004", "name": "Zone C — Compressor Bay Secondary", "zone": "ZC", "type": "simulated", "workers_detected": 7, "ppe_compliant": 6, "restricted_zone_violations": 0, "status": "online"},
    {"id": "cam-005", "name": "Plant Gate — Main Entrance", "zone": "GATE", "type": "simulated", "workers_detected": 1, "ppe_compliant": 1, "restricted_zone_violations": 0, "status": "online"},
    {"id": "cam-006", "name": "Zone E — Flare Stack", "zone": "ZE", "type": "simulated", "workers_detected": 0, "ppe_compliant": 0, "restricted_zone_violations": 0, "status": "online"},
]


# ─── Reports ─────────────────────────────────────────────────────────────────
reports_router = APIRouter()


# Wire routers
from fastapi import APIRouter as _APIRouter


def make_notifications_router():
    r = _APIRouter()

    @r.get("/")
    async def get_notifications():
        return {"notifications": SYNTHETIC_NOTIFICATIONS, "unread": sum(1 for n in SYNTHETIC_NOTIFICATIONS if not n["read"])}

    @r.post("/send-test")
    async def send_test_notification():
        notif = {"id": "test-1", "title": "🚨 TEST ALERT — SafetyOS", "body": "This is a test notification from SafetyOS", "severity": "HIGH", "timestamp": datetime.utcnow().isoformat()}
        from core.websocket_manager import manager
        await manager.send_notification(notif)
        return {"message": "Test notification sent", "notification": notif}

    @r.post("/{notification_id}/read")
    async def mark_read(notification_id: str):
        return {"message": f"Notification {notification_id} marked as read"}

    return r


def make_workers_router():
    r = _APIRouter()

    @r.get("/")
    async def list_workers(zone: str = None):
        workers = SYNTHETIC_WORKERS
        if zone:
            workers = [w for w in workers if w.get("zone") == zone.upper()]
        return {"workers": workers, "total": len(workers)}

    @r.get("/zone-counts")
    async def get_zone_counts():
        counts = {}
        for w in SYNTHETIC_WORKERS:
            z = w.get("zone", "UNKNOWN")
            counts[z] = counts.get(z, 0) + 1
        return {"zone_counts": counts}

    return r


def make_plants_router():
    r = _APIRouter()

    @r.get("/")
    async def list_plants():
        return {"plants": SYNTHETIC_PLANTS, "total": len(SYNTHETIC_PLANTS)}

    @r.get("/{plant_id}")
    async def get_plant(plant_id: str):
        plant = next((p for p in SYNTHETIC_PLANTS if p["id"] == plant_id), None)
        if not plant:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Plant not found")
        return plant

    return r


def make_analytics_router():
    r = _APIRouter()

    @r.get("/summary")
    async def get_analytics_summary():
        from core.redis_client import get_state, COMPOUND_RISK_KEY, SENSOR_STATE_KEY
        risk_data = await get_state(COMPOUND_RISK_KEY) or {}
        return {
            "plant_risk_score": risk_data.get("plant_risk_score", 42.0),
            "compound_alerts_active": len(risk_data.get("alerts", [])),
            "sensors_online": 20,
            "sensors_total": 20,
            "workers_on_site": len(SYNTHETIC_WORKERS),
            "active_permits": 3,
            "incidents_today": 0,
            "incidents_this_week": 2,
            "compliance_score": 85.7,
            "last_incident": "3 days ago",
            "financial_exposure": 2100000,
            "ai_prevented_today": 3,
        }

    @r.get("/executive-brief")
    async def get_executive_brief():
        from core.llm_router import chat
        from core.redis_client import get_state, COMPOUND_RISK_KEY, SENSOR_STATE_KEY

        risk_data = await get_state(COMPOUND_RISK_KEY) or {}
        risk_score = risk_data.get("plant_risk_score", 67)

        prompt = f"""Generate an executive safety briefing for a plant director.
Current plant risk score: {risk_score}/100
Active compound risks: {len(risk_data.get('alerts', []))}
Workers on site: 17
Active permits: 3
Compliance score: 85.7%

Format as a morning briefing with:
1. Plant Status (one line)
2. Top 3 Risks Today (with cost/action)
3. Financial Exposure
4. Yesterday's Summary
5. Recommended Focus Areas

Use Indian context — mentions rupees (lakhs/crores), OISD references."""

        try:
            brief = await chat(messages=[{"role": "user", "content": prompt}], temperature=0.5, max_tokens=800)
        except Exception:
            brief = f"""Good morning, Plant Director.

🏭 Plant Status: {"ELEVATED RISK" if risk_score > 60 else "NORMAL"} (Score: {risk_score}/100)

Top 3 Risks Today:
1. Zone C — Compound risk (H2S + Confined Space) — 84% probability → Recommend: Evacuate Zone C
2. Compressor C-301 — Vibration elevated → Schedule maintenance within 24 hours
3. PTW-2025-0839 — Expires in 30 minutes → Confirm safe exit plan

Financial Exposure Today: ₹2.1 lakh (if all risks materialize)
If Recommendations Followed: ₹38,000

Yesterday: 0 incidents | 3 near-misses resolved | 98% compliance
This Week: 2 minor incidents | 94% compliance | 0 fatalities

Focus Areas: Zone C gas management, C-301 maintenance scheduling, permit tracking."""

        return {
            "brief": brief,
            "risk_score": risk_score,
            "generated_at": datetime.utcnow().isoformat(),
        }

    return r


def make_cameras_router():
    r = _APIRouter()

    @r.get("/")
    async def list_cameras():
        return {"cameras": SYNTHETIC_CAMERAS, "total": len(SYNTHETIC_CAMERAS)}

    @r.get("/{camera_id}/detections")
    async def get_detections(camera_id: str):
        cam = next((c for c in SYNTHETIC_CAMERAS if c["id"] == camera_id), None)
        if not cam:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Camera not found")

        import random
        detections = []
        for i in range(cam.get("workers_detected", 0)):
            detections.append({
                "id": f"person-{i}",
                "bbox": [random.randint(50, 400), random.randint(50, 300), random.randint(80, 120), random.randint(150, 200)],
                "confidence": round(random.uniform(0.82, 0.97), 2),
                "ppe_compliant": i < cam.get("ppe_compliant", 0),
                "in_restricted_zone": i == 0 and cam.get("restricted_zone_violations", 0) > 0,
            })
        return {"camera_id": camera_id, "detections": detections, "timestamp": datetime.utcnow().isoformat()}

    return r


def make_reports_router():
    r = _APIRouter()

    @r.get("/types")
    async def report_types():
        return {
            "report_types": [
                {"id": "incident", "name": "Incident Report (DGFASLI Format)", "description": "Regulatory-compliant incident report"},
                {"id": "daily", "name": "Daily Safety Summary", "description": "Management daily briefing PDF"},
                {"id": "audit", "name": "Audit Documentation Package", "description": "Comprehensive audit evidence package"},
                {"id": "shift", "name": "Shift Handover Report", "description": "AI-generated shift summary"},
            ]
        }

    @r.post("/generate/{report_type}")
    async def generate_report(report_type: str, incident_id: str = None):
        from core.llm_router import chat
        from datetime import datetime

        content = f"SafetyOS {report_type.upper()} REPORT\nGenerated: {datetime.utcnow().isoformat()}\nPlant: Bharat Petrochemicals Refinery Unit 3\n\n[Full report generation requires ReportLab PDF library in production]"

        return {
            "report_type": report_type,
            "status": "generated",
            "content_preview": content,
            "download_url": f"/reports/download/{report_type}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf",
            "generated_at": datetime.utcnow().isoformat(),
        }

    return r


# Export all routers
router = make_notifications_router()

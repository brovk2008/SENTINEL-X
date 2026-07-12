"""Cameras API — full implementation with DEMO_CAMERAS data."""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from integrations.camera_manager import CameraManager, DEMO_CAMERAS

logger = logging.getLogger(__name__)
router = APIRouter()
manager = CameraManager()


@router.get("/")
async def get_all_cameras():
    """Get all registered cameras with their current status."""
    return {"cameras": manager.get_all_cameras(), "total": len(manager.cameras)}


@router.get("/{camera_id}")
async def get_camera(camera_id: str):
    """Get a specific camera by ID."""
    cam = manager.cameras.get(camera_id)
    if not cam:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    return cam


@router.get("/{camera_id}/analysis")
async def get_camera_analysis(camera_id: str):
    """Get latest CV analysis / detection data for a camera."""
    return await manager.get_frame_analysis(camera_id)


@router.post("/{camera_id}/rtsp")
async def connect_rtsp(camera_id: str, rtsp_url: str):
    """Connect a real RTSP camera stream (converts to HLS via ffmpeg)."""
    result = await manager.connect_rtsp(camera_id, rtsp_url)
    return result


@router.post("/check-ppe")
async def check_ppe_all():
    """Trigger a PPE compliance check across all online cameras."""
    results = []
    for cam_id, cam in manager.cameras.items():
        if cam["status"] == "online":
            analysis = await manager.get_frame_analysis(cam_id)
            results.append({
                "camera_id": cam_id,
                "camera_name": cam["name"],
                "workers_detected": cam["workers_detected"],
                "ppe_compliance": cam["ppe_compliance"],
                "violations": cam["workers_detected"] - round(cam["workers_detected"] * cam["ppe_compliance"] / 100),
            })
    total_workers = sum(r["workers_detected"] for r in results)
    total_violations = sum(r["violations"] for r in results)
    return {
        "checked_at": datetime.utcnow().isoformat(),
        "cameras_checked": len(results),
        "total_workers": total_workers,
        "total_violations": total_violations,
        "overall_compliance_pct": round((1 - total_violations / max(total_workers, 1)) * 100, 1),
        "results": results,
    }


@router.get("/summary/stats")
async def get_camera_summary():
    """Quick stats summary for dashboard widgets."""
    cams = manager.get_all_cameras()
    online = [c for c in cams if c["status"] == "online"]
    workers = sum(c["workers_detected"] for c in online)
    violations = [c for c in online if c["ppe_compliance"] < 100]
    return {
        "total": len(cams),
        "online": len(online),
        "offline": len(cams) - len(online),
        "total_workers_detected": workers,
        "ppe_violations": len(violations),
        "alerts": len([c for c in online if c.get("ppe_compliance", 100) < 80]),
    }

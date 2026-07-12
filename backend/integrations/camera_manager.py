"""
Camera Manager — DEMO_CAMERAS data + RTSP→HLS helper.
Contains the canonical list of cameras used by the cameras router.
"""
import asyncio
import logging
import shlex
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger("safetyos.camera")

DEMO_CAMERAS: List[dict] = [
    {"id": "CAM-01", "name": "Zone A — Tank Farm Entry",    "zone": "ZA",   "status": "online",  "workers_detected": 4, "ppe_compliance": 100, "hasAlert": False, "rtsp_url": None},
    {"id": "CAM-02", "name": "Zone B — Processing Unit",    "zone": "ZB",   "status": "online",  "workers_detected": 2, "ppe_compliance": 100, "hasAlert": False, "rtsp_url": None},
    {"id": "CAM-03", "name": "Zone C — Compressor Bay",     "zone": "ZC",   "status": "online",  "workers_detected": 6, "ppe_compliance": 83,  "hasAlert": True,  "alertText": "PPE Violation — 1 worker no helmet", "rtsp_url": None},
    {"id": "CAM-04", "name": "Zone D — Control Room",       "zone": "ZD",   "status": "online",  "workers_detected": 3, "ppe_compliance": 100, "hasAlert": False, "rtsp_url": None},
    {"id": "CAM-05", "name": "Zone A — Tank Farm Overview", "zone": "ZA",   "status": "online",  "workers_detected": 1, "ppe_compliance": 100, "hasAlert": False, "rtsp_url": None},
    {"id": "CAM-06", "name": "Zone B — Compressor Area",    "zone": "ZB",   "status": "online",  "workers_detected": 1, "ppe_compliance": 100, "hasAlert": False, "rtsp_url": None},
    {"id": "CAM-07", "name": "Main Gate — Entry",           "zone": "GATE", "status": "online",  "workers_detected": 3, "ppe_compliance": 67,  "hasAlert": True,  "alertText": "Unauthorized entry — no permit", "rtsp_url": None},
    {"id": "CAM-08", "name": "Zone F — Flare Stack",        "zone": "ZF",   "status": "offline", "workers_detected": 0, "ppe_compliance": 0,   "hasAlert": False, "rtsp_url": None},
]


class CameraManager:
    def __init__(self):
        self.cameras: Dict[str, dict] = {c["id"]: dict(c) for c in DEMO_CAMERAS}
        self.rtsp_processes: Dict[str, asyncio.subprocess.Process] = {}

    def get_all_cameras(self) -> List[dict]:
        return list(self.cameras.values())

    async def connect_rtsp(self, camera_id: str, rtsp_url: str) -> dict:
        """Connect a real RTSP camera stream (converts to HLS via ffmpeg)."""
        camera = self.cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}

        hls_path = f"/tmp/safetyos_streams/{camera_id}/stream.m3u8"
        proc = await start_rtsp_to_hls(rtsp_url, hls_path)
        if proc:
            self.rtsp_processes[camera_id] = proc
            camera["rtsp_url"] = rtsp_url
            camera["hls_url"] = f"/streams/{camera_id}/stream.m3u8"
            camera["status"] = "online"
            return {"success": True, "hls_url": camera["hls_url"]}
        else:
            # ffmpeg not available — mark as demo mode
            camera["demo_mode"] = True
            return {"success": True, "demo_mode": True, "message": "ffmpeg unavailable — demo mode active"}

    async def get_frame_analysis(self, camera_id: str) -> dict:
        """Get latest CV analysis for a camera (demo data in hackathon mode)."""
        camera = self.cameras.get(camera_id)
        if not camera:
            return {}

        workers = camera["workers_detected"]
        compliance = camera["ppe_compliance"]
        compliant_workers = round(workers * compliance / 100)

        return {
            "camera_id": camera_id,
            "camera_name": camera["name"],
            "zone": camera["zone"],
            "timestamp": datetime.utcnow().isoformat(),
            "workers_detected": workers,
            "ppe_compliance_pct": compliance,
            "zone_violation": camera.get("hasAlert", False),
            "detections": [
                {
                    "type": "person",
                    "confidence": 0.92,
                    "ppe": {
                        "helmet": i < compliant_workers,
                        "vest":   i < compliant_workers,
                    },
                    "bbox": {"x": 0.2 + i * 0.15, "y": 0.3, "w": 0.1, "h": 0.35},
                }
                for i in range(workers)
            ],
        }


# ── RTSP → HLS helper ──────────────────────────────────────────────────────────
async def start_rtsp_to_hls(
    rtsp_url: str, output_m3u8: str, segment_time: int = 2
) -> Optional[asyncio.subprocess.Process]:
    """Start ffmpeg to convert RTSP → HLS for browser playback."""
    import os
    os.makedirs(os.path.dirname(output_m3u8), exist_ok=True)

    cmd = (
        f"ffmpeg -y -rtsp_transport tcp -i {shlex.quote(rtsp_url)} "
        f"-c:v libx264 -preset ultrafast -tune zerolatency "
        f"-c:a aac -f hls "
        f"-hls_time {segment_time} -hls_list_size 3 -hls_flags delete_segments+append_list "
        f"{shlex.quote(output_m3u8)}"
    )

    logger.info(f"Starting ffmpeg: {rtsp_url} → {output_m3u8}")

    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        return proc
    except FileNotFoundError:
        logger.warning("ffmpeg not found — RTSP streaming unavailable. Using demo mode.")
        return None
    except Exception as e:
        logger.exception(f"Failed to start ffmpeg: {e}")
        return None


async def stop_process(proc: asyncio.subprocess.Process):
    try:
        proc.terminate()
        await proc.wait()
        logger.info("ffmpeg process terminated")
    except Exception:
        logger.exception("Error terminating ffmpeg process")

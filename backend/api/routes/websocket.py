"""WebSocket API route — the real-time data highway."""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from core.websocket_manager import manager
from core.redis_client import get_state, SENSOR_STATE_KEY, PLANT_RISK_KEY, ACTIVE_ALERTS_KEY

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(
    websocket: WebSocket,
    topics: str = Query(default="all"),  # comma-separated topic list
):
    """
    Main WebSocket endpoint.
    Connect with ws://host:8000/ws/live
    
    Message types received from server:
    - sensor_update: Latest sensor readings
    - alert: New or updated alert
    - risk_update: Plant/zone risk score change
    - compound_risk: Compound risk detection result
    - agent_message: Message from an AI agent during debate
    - emergency: Emergency event triggered
    - camera_update: Camera detection results
    - compliance_update: Compliance check result changed
    - notification: System notification
    """
    topic_list = [t.strip() for t in topics.split(",")] if topics != "all" else None
    await manager.connect(websocket, topic_list)

    try:
        # Send initial state snapshot to newly connected client
        sensor_state = await get_state(SENSOR_STATE_KEY) or {}
        plant_risk = await get_state(PLANT_RISK_KEY) or 0.0
        active_alerts = await get_state(ACTIVE_ALERTS_KEY) or []

        await websocket.send_json({
            "type": "init",
            "data": {
                "sensors": sensor_state,
                "plant_risk_score": plant_risk,
                "active_alerts": active_alerts[:10],  # Top 10 most recent
                "message": "SafetyOS real-time feed connected. The factory is alive."
            }
        })

        # Keep connection alive — process client messages
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "subscribe":
                topics_to_add = data.get("topics", [])
                for topic in topics_to_add:
                    if topic not in manager.subscriptions:
                        manager.subscriptions[topic] = set()
                    manager.subscriptions[topic].add(websocket)

            elif msg_type == "inject_anomaly":
                # Demo mode: client can request anomaly injection
                sensor_id = data.get("sensor_id", "H2S-ZC-01")
                from services.sensor_simulator import inject_anomaly
                await inject_anomaly(sensor_id, data.get("value", 50.0))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

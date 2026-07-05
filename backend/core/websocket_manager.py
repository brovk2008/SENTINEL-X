"""
WebSocket Manager — Broadcasts real-time events to all connected clients.
Every dashboard update, sensor reading, alert, and agent message flows through here.
"""
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # All active WebSocket connections
        self.active_connections: Set[WebSocket] = set()
        # Topic subscriptions: topic -> set of websockets
        self.subscriptions: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, topics: list = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        if topics:
            for topic in topics:
                if topic not in self.subscriptions:
                    self.subscriptions[topic] = set()
                self.subscriptions[topic].add(websocket)
        logger.info(f"WS client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        for topic_subs in self.subscriptions.values():
            topic_subs.discard(websocket)
        logger.info(f"WS client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send to all connected clients."""
        if not self.active_connections:
            return
        data = json.dumps(message)
        dead = set()
        for ws in self.active_connections.copy():
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_to_topic(self, topic: str, message: dict):
        """Send to clients subscribed to a specific topic."""
        subscribers = self.subscriptions.get(topic, set())
        if not subscribers:
            return
        data = json.dumps(message)
        dead = set()
        for ws in subscribers.copy():
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send_sensor_update(self, sensor_data: dict):
        await self.broadcast({"type": "sensor_update", "data": sensor_data})

    async def send_alert(self, alert_data: dict):
        await self.broadcast({"type": "alert", "data": alert_data})

    async def send_risk_update(self, risk_data: dict):
        await self.broadcast({"type": "risk_update", "data": risk_data})

    async def send_agent_message(self, agent_name: str, message: str, session_id: str):
        await self.broadcast({
            "type": "agent_message",
            "data": {
                "session_id": session_id,
                "agent": agent_name,
                "message": message,
            }
        })

    async def send_emergency(self, emergency_data: dict):
        await self.broadcast({"type": "emergency", "data": emergency_data})

    async def send_compound_risk(self, risk_data: dict):
        await self.broadcast({"type": "compound_risk", "data": risk_data})

    async def send_camera_update(self, camera_id: str, detection_data: dict):
        await self.broadcast({
            "type": "camera_update",
            "data": {"camera_id": camera_id, **detection_data}
        })

    async def send_compliance_update(self, compliance_data: dict):
        await self.broadcast({"type": "compliance_update", "data": compliance_data})

    async def send_notification(self, notification_data: dict):
        await self.broadcast({"type": "notification", "data": notification_data})


# Singleton instance
manager = ConnectionManager()

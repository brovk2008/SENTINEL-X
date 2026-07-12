"""
Connectivity Manager — skeleton implementation
Provides a pluggable manager to register and manage data source connectors (MQTT, OPC-UA, Modbus, RTSP, Simulated).
This is a lightweight, non-blocking skeleton that other services can use to start actual connectors.
"""
import asyncio
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Any, Callable

logger = logging.getLogger("safetyos.connectivity")


class ProtocolType(str, Enum):
    MQTT = "mqtt"
    OPC_UA = "opcua"
    MODBUS = "modbus"
    RTSP = "rtsp"
    HTTP_POLL = "http_poll"
    SIMULATED = "simulated"


@dataclass
class DataSource:
    id: str
    name: str
    protocol: ProtocolType
    host: str
    port: int
    config: Dict[str, Any] = field(default_factory=dict)
    status: str = "disconnected"
    last_seen: Optional[datetime] = None
    error_message: Optional[str] = None


class ConnectivityManager:
    """Manage datasource connectors. This is a skeleton for actual implementations.

    Usage:
        manager = ConnectivityManager()
        await manager.add_source(DataSource(...))
        await manager.connect_all()

    Concrete connector implementations should be provided as callables in "connectors"
    mapping. Each connector is an async function that accepts (source, manager) and handles
    lifecycle. This design keeps the manager testable and avoids heavy imports here.
    """

    def __init__(self):
        self.sources: Dict[str, DataSource] = {}
        self._tasks: Dict[str, asyncio.Task] = {}
        # connector registry: protocol -> async connector function
        self.connectors: Dict[ProtocolType, Callable[[DataSource, "ConnectivityManager"], asyncio.Future]] = {}
        self._running = False
        # Basic metrics
        self.metrics = {
            'connections_attempted': 0,
            'connections_failed': 0,
            'messages_forwarded': 0,
        }

    async def remove_source(self, source_id: str) -> bool:
        """Stop and remove a source if present."""
        if source_id in self._tasks:
            try:
                self._tasks[source_id].cancel()
            except Exception:
                logger.exception(f"Failed to cancel task for {source_id}")
            self._tasks.pop(source_id, None)
        if source_id in self.sources:
            self.sources.pop(source_id, None)
            logger.info(f"Source removed: {source_id}")
            return True
        return False

    async def start_source(self, source_id: str) -> bool:
        """Start a previously-registered source by id."""
        s = self.sources.get(source_id)
        if not s:
            logger.warning(f"No such source to start: {source_id}")
            return False
        if source_id in self._tasks:
            logger.info(f"Source already running: {source_id}")
            return True
        return await self._start_source(s)

    async def stop_source(self, source_id: str) -> bool:
        """Stop a running source by id."""
        task = self._tasks.get(source_id)
        if not task:
            logger.warning(f"No running task for {source_id}")
            return False
        task.cancel()
        self._tasks.pop(source_id, None)
        src = self.sources.get(source_id)
        if src:
            src.status = 'disconnected'
        logger.info(f"Stopped source: {source_id}")
        return True

    def register_connector(self, protocol: ProtocolType, fn: Callable[[DataSource, "ConnectivityManager"], Any]):
        self.connectors[protocol] = fn
        logger.info(f"Connector registered for {protocol}")

    async def add_source(self, source: DataSource) -> bool:
        self.sources[source.id] = source
        logger.info(f"Source added: {source.id} ({source.protocol})")
        if self._running:
            return await self._start_source(source)
        return True

    async def _start_source(self, source: DataSource) -> bool:
        connector = self.connectors.get(source.protocol)
        if not connector:
            source.status = "error"
            source.error_message = f"No connector for protocol {source.protocol}"
            logger.warning(source.error_message)
            return False

        async def run_connector():
            try:
                source.status = "connecting"
                await connector(source, self)
                source.status = "connected"
                source.last_seen = datetime.utcnow()
                logger.info(f"Connected: {source.id}")
            except Exception as e:
                source.status = "error"
                source.error_message = str(e)
                logger.exception(f"Connector failed for {source.id}")

        task = asyncio.create_task(run_connector())
        self._tasks[source.id] = task
        return True

    async def connect_all(self):
        self._running = True
        for s in list(self.sources.values()):
            await self._start_source(s)

    async def stop_all(self):
        self._running = False
        for t in list(self._tasks.values()):
            t.cancel()
        self._tasks.clear()

    def list_sources(self):
        return list(self.sources.values())


async def _simulated_mqtt_connector(source: DataSource, mgr: ConnectivityManager):
    """A simple simulated connector that periodically emits sensor readings via the WebSocket manager.
    This is intended for demo mode and uses the existing sensor_simulator configuration if available.
    """
    logger.info(f"Starting simulated connector for {source.id}")
    try:
        # Import lazily to avoid heavy imports at module load
        try:
            from services import sensor_simulator
        except Exception:
            sensor_simulator = None

        import core.websocket_manager as wsmod

        interval = float(source.config.get("interval", 2.0))
        t = 0
        while mgr._running:
            payload = {}
            if sensor_simulator and hasattr(sensor_simulator, 'SENSOR_CONFIGS'):
                # Build a small snapshot using sensor_simulator logic
                for s in sensor_simulator.SENSOR_CONFIGS:
                    try:
                        val = sensor_simulator._get_simulated_value(s, t)
                    except Exception:
                        val = s.get('baseline', 0)
                    reading = {
                        "sensor_id": s["id"],
                        "name": s.get("name"),
                        "type": s.get("type"),
                        "unit": s.get("unit"),
                        "zone": s.get("zone"),
                        "value": val,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    payload[s["id"]] = reading
            else:
                # Fallback: emit a small synthetic message
                payload = {
                    f"{source.id}-demo-1": {
                        "sensor_id": f"{source.id}-demo-1",
                        "name": "Demo Sensor",
                        "value": 42,
                        "unit": "units",
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                }

            # Broadcast via WebSocket manager
            try:
                await wsmod.manager.send_sensor_update(payload)
            except Exception:
                logger.exception("Failed to broadcast simulated sensor update")

            t += interval
            await asyncio.sleep(interval)

    except asyncio.CancelledError:
        logger.info(f"Simulated connector cancelled for {source.id}")
    except Exception:
        logger.exception("Simulated connector error")

async def _opcua_connector(source: DataSource, mgr: ConnectivityManager):
    """Connector that polls OPC-UA nodes or subscribes to them and forwards values to the WebSocket manager.

    This connector uses asyncua when available. For production:
    - Configure node_ids in source.config (list of node id strings)
    - Configure poll_interval_ms in source.config for polling
    - Secure connections using source.config tls/auth fields
    """
    logger.info(f"Starting OPC-UA connector for {source.id}")
    try:
        try:
            from asyncua import Client as OPCUAClient
        except ImportError:
            logger.warning("asyncua not installed. Install with: pip install asyncua")
            raise

        import core.websocket_manager as wsmod

        url = source.config.get("url") or f"opc.tcp://{source.host}:{source.port}"
        node_ids = source.config.get("node_ids", [])
        poll_ms = int(source.config.get("poll_interval_ms", 1000))

        backoff = 1.0
        max_backoff = 60.0

        while mgr._running:
            try:
                async with OPCUAClient(url=url) as client:
                    logger.info(f"OPC-UA connected: {url}")

                    # If node_ids present, poll them at interval
                    while mgr._running:
                        results = {}
                        for nid in node_ids:
                            try:
                                node = client.get_node(nid)
                                val = await node.read_value()
                                results[nid] = {
                                    "node_id": nid,
                                    "value": val,
                                    "timestamp": datetime.utcnow().isoformat(),
                                }
                                # Broadcast each reading
                                await wsmod.manager.send_sensor_update({nid: results[nid]})
                                mgr.metrics['messages_forwarded'] = mgr.metrics.get('messages_forwarded', 0) + 1
                            except Exception:
                                logger.exception(f"Failed to read node {nid}")

                        await asyncio.sleep(poll_ms / 1000.0)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                mgr.metrics['connections_failed'] = mgr.metrics.get('connections_failed', 0) + 1
                logger.exception(f"OPC-UA connection/read error for {source.id}: {e}")
                logger.info(f"OPC-UA reconnecting in {backoff}s")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2.0, max_backoff)

    except asyncio.CancelledError:
        logger.info(f"OPC-UA connector cancelled for {source.id}")
    except Exception:
        logger.exception("OPC-UA connector fatal error")



def _normalize_value(self, topic: str, payload: bytes):
    try:
        s = payload.decode()
        try:
            return json.loads(s)
        except Exception:
            try:
                return {"value": float(s)}
            except Exception:
                return None
    except Exception:
        return None

async def _mqtt_connector(source: DataSource, mgr: ConnectivityManager):
    """Production-grade MQTT connector wrapper. Runs the mqtt client in a background loop and
    forwards messages to the websocket manager. Handles reconnect/backoff and metrics.
    """
    logger.info(f"Starting MQTT connector for {source.id}")
    try:
        import paho.mqtt.client as mqtt
        import core.websocket_manager as wsmod
        import json as _json
    except Exception:
        logger.exception("Required MQTT dependencies not available")
        raise

    loop = asyncio.get_running_loop()
    topics = source.config.get("topics", ["safetyos/#"]) if isinstance(source.config.get("topics", None), list) else source.config.get("topics", ["safetyos/#"])

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"MQTT connected for {source.id}")
            for t in topics:
                try:
                    client.subscribe(t, qos=1)
                    logger.info(f"Subscribed {source.id} to {t}")
                except Exception:
                    logger.exception(f"Failed to subscribe to topic {t}")
        else:
            logger.warning(f"MQTT connect rc={rc} for {source.id}")

    def on_disconnect(client, userdata, rc):
        logger.warning(f"MQTT disconnected for {source.id} rc={rc}")

    def on_message(client, userdata, msg):
        try:
            data = None
            try:
                data = _json.loads(msg.payload.decode())
            except Exception:
                try:
                    data = {"value": float(msg.payload.decode())}
                except Exception:
                    data = {"raw": msg.payload.decode(errors='ignore')}

            normalized = {
                "sensor_id": data.get("sensor_id", f"{source.id}:{msg.topic}"),
                "source_id": source.id,
                "source_name": source.name,
                "topic": msg.topic,
                "timestamp": datetime.utcnow().isoformat(),
                **data,
            }

            asyncio.run_coroutine_threadsafe(wsmod.manager.send_sensor_update({normalized["sensor_id"]: normalized}), loop)
            mgr.metrics['messages_forwarded'] = mgr.metrics.get('messages_forwarded', 0) + 1
        except Exception:
            logger.exception("Error handling MQTT message")

    client = mqtt.Client(client_id=f"safetyos-{source.id}-{int(datetime.utcnow().timestamp())}")

    # TLS and auth if configured
    try:
        if source.config.get("username"):
            client.username_pw_set(source.config.get("username"), source.config.get("password", ""))
        if source.config.get("tls"):
            client.tls_set(
                ca_certs=source.config.get("ca_cert"),
                certfile=source.config.get("client_cert"),
                keyfile=source.config.get("client_key")
            )
    except Exception:
        logger.exception("Failed to apply MQTT auth/tls settings")

    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    backoff = 1.0
    max_backoff = 60.0

    try:
        while mgr._running:
            try:
                mgr.metrics['connections_attempted'] = mgr.metrics.get('connections_attempted', 0) + 1
                client.connect(source.host, source.port, keepalive=60)
                client.loop_start()

                # Wait for connection cycle
                await asyncio.sleep(2)

                # Reset backoff on success
                backoff = 1.0

                # Run until manager signals stop or client disconnects
                while mgr._running:
                    await asyncio.sleep(1)

                break

            except Exception as e:
                mgr.metrics['connections_failed'] = mgr.metrics.get('connections_failed', 0) + 1
                logger.exception(f"MQTT connect error for {source.id}: {e}")
                try:
                    client.loop_stop()
                    client.disconnect()
                except Exception:
                    pass

                logger.info(f"Reconnecting in {backoff} seconds...")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2.0, max_backoff)

    except asyncio.CancelledError:
        logger.info(f"MQTT connector cancelled for {source.id}")
    except Exception:
        logger.exception("MQTT connector error")
    finally:
        try:
            client.loop_stop()
            client.disconnect()
        except Exception:
            pass


# Provide a module-level default manager
manager = ConnectivityManager()

# Note: connectors are registered at application startup (main.py) to avoid side-effects during import

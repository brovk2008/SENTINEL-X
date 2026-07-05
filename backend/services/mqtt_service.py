"""MQTT service bridge."""
import logging
from core.config import settings

logger = logging.getLogger(__name__)


async def start_mqtt_client():
    """Start MQTT client to bridge sensor data."""
    try:
        import paho.mqtt.client as mqtt

        def on_connect(client, userdata, flags, rc):
            logger.info(f"MQTT connected (rc={rc})")
            client.subscribe(f"{settings.MQTT_TOPIC_PREFIX}/#")

        def on_message(client, userdata, msg):
            pass  # Data comes from simulator directly to Redis/WS

        client = mqtt.Client(client_id="safetyos-bridge")
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect_async(settings.MQTT_HOST, settings.MQTT_PORT)
        client.loop_start()
    except Exception as e:
        logger.warning(f"MQTT client error: {e}")

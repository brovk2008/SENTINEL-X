"""Redis client — real-time state store and pub/sub."""
import json
import logging
from typing import Any, Optional
import redis.asyncio as aioredis
from core.config import settings

logger = logging.getLogger(__name__)
redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    global redis_client
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Using in-memory fallback cache.")
        class MockRedis:
            def __init__(self):
                self.cache = {}
            async def ping(self):
                return True
            async def set(self, k, v):
                self.cache[k] = v
            async def setex(self, k, t, v):
                self.cache[k] = v
            async def get(self, k):
                return self.cache.get(k)
            async def publish(self, ch, data):
                pass
        redis_client = MockRedis()


def get_redis() -> aioredis.Redis:
    return redis_client


async def set_state(key: str, value: Any, ttl: Optional[int] = None):
    """Store JSON-serializable state."""
    data = json.dumps(value) if not isinstance(value, str) else value
    if ttl:
        await redis_client.setex(key, ttl, data)
    else:
        await redis_client.set(key, data)


async def get_state(key: str) -> Any:
    """Retrieve and deserialize state."""
    data = await redis_client.get(key)
    if data is None:
        return None
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError):
        return data


async def publish_event(channel: str, event: dict):
    """Publish event to Redis pub/sub channel."""
    await redis_client.publish(channel, json.dumps(event))


# ─── Key conventions ─────────────────────────────────────────────────────────
SENSOR_STATE_KEY = "sensors:current"       # dict of sensor_id -> reading
PLANT_RISK_KEY = "plant:risk_score"        # float
ZONE_RISK_KEY = "zone:risk:{zone_id}"      # float per zone
ACTIVE_ALERTS_KEY = "alerts:active"        # list of alert dicts
COMPOUND_RISK_KEY = "compound:latest"      # latest compound assessment
WORKER_LOCATIONS_KEY = "workers:locations" # dict of worker_id -> zone_id
CAMERA_DETECTIONS_KEY = "camera:detections:{cam_id}"  # latest detection data

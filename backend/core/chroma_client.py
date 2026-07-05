"""ChromaDB vector database client for RAG."""
import logging
from typing import Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from core.config import settings

logger = logging.getLogger(__name__)
_client: Optional[chromadb.AsyncHttpClient] = None


async def init_chroma():
    global _client
    try:
        _client = await chromadb.AsyncHttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        await _client.heartbeat()
        logger.info("ChromaDB connected")
    except Exception as e:
        logger.warning(f"ChromaDB unavailable: {e} — RAG will use fallback responses")


def get_chroma() -> Optional[chromadb.AsyncHttpClient]:
    return _client


COLLECTIONS = {
    "regulations": "safetyos_regulations",
    "incidents": "safetyos_incidents",
    "sops": "safetyos_sops",
    "equipment": "safetyos_equipment",
    "general": "safetyos_general",
}


async def get_or_create_collection(collection_name: str):
    if not _client:
        return None
    return await _client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

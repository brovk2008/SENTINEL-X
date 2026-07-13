"""Settings API — LLM provider configuration."""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from core.llm_router import get_active_config, set_active_providers
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class LLMProviderUpdate(BaseModel):
    provider: str  # gemini | openrouter | anthropic | ollama
    model: str
    api_key: Optional[str] = None
    is_default: bool = False


class APIKeysUpdate(BaseModel):
    gemini_key: Optional[str] = None
    openrouter_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    ollama_url: Optional[str] = None
    default_provider: Optional[str] = "gemini"


@router.get("/llm")
async def get_llm_settings():
    """Get current LLM configuration and available providers."""
    def mask_key(k: Optional[str]):
        if not k: return ""
        if len(k) <= 8: return "••••••••"
        return k[:4] + "••••••••" + k[-4:]

    return {
        "active_provider": settings.DEFAULT_LLM_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY),
        "anthropic_configured": bool(settings.ANTHROPIC_API_KEY),
        "gemini_key_masked": mask_key(settings.GEMINI_API_KEY),
        "openrouter_key_masked": mask_key(settings.OPENROUTER_API_KEY),
        "anthropic_key_masked": mask_key(settings.ANTHROPIC_API_KEY),
        "ollama_url": settings.OLLAMA_BASE_URL,
        "available_providers": get_active_config().get("providers", []),
    }


@router.post("/llm")
async def update_llm_settings(update: APIKeysUpdate):
    """Update LLM provider API keys at runtime (no server restart needed)."""
    if update.gemini_key is not None and update.gemini_key.strip():
        settings.GEMINI_API_KEY = update.gemini_key.strip()
    if update.openrouter_key is not None and update.openrouter_key.strip():
        settings.OPENROUTER_API_KEY = update.openrouter_key.strip()
    if update.anthropic_key is not None and update.anthropic_key.strip():
        settings.ANTHROPIC_API_KEY = update.anthropic_key.strip()
    if update.ollama_url is not None and update.ollama_url.strip():
        settings.OLLAMA_BASE_URL = update.ollama_url.strip()
    if update.default_provider:
        settings.DEFAULT_LLM_PROVIDER = update.default_provider

    return {
        "status": "success",
        "message": "API keys and LLM settings updated successfully",
        "default_provider": settings.DEFAULT_LLM_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY),
        "anthropic_configured": bool(settings.ANTHROPIC_API_KEY),
    }


@router.get("/llm/test")
async def test_llm_connection(provider: str = "gemini", model: Optional[str] = None):
    """Test LLM connection with a simple prompt."""
    from core.llm_router import chat
    try:
        response = await chat(
            messages=[{"role": "user", "content": "Respond with exactly: 'Sentinel X LLM connection successful'"}],
            provider=provider,
            model=model,
            max_tokens=50,
        )
        return {"status": "success", "provider": provider, "response": response}
    except Exception as e:
        return {"status": "error", "provider": provider, "error": str(e)}


@router.get("/camera-sources")
async def get_camera_sources():
    """Get available camera source configurations."""
    return {
        "sources": [
            {"id": "webcam", "name": "Laptop Webcam", "type": "webcam", "index": 0},
            {"id": "rtsp", "name": "Network RTSP Stream", "type": "rtsp", "url": ""},
            {"id": "video", "name": "Video File (Demo)", "type": "file", "path": ""},
            {"id": "simulated", "name": "Simulated Feed (Demo Mode)", "type": "simulated"},
        ]
    }


@router.get("/notifications")
async def get_notification_settings():
    """Get notification configuration."""
    return {
        "firebase_configured": bool(settings.FIREBASE_PROJECT_ID),
        "twilio_configured": bool(settings.TWILIO_ACCOUNT_SID),
        "in_app_enabled": True,
        "modes": ["in_app", "firebase_fcm", "twilio_sms"],
    }

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


class SettingsUpdate(BaseModel):
    providers: List[LLMProviderUpdate]
    default_provider: str


@router.get("/llm")
async def get_llm_settings():
    """Get current LLM configuration and available providers."""
    config = get_active_config()
    return {
        "current_config": config,
        "active_provider": settings.DEFAULT_LLM_PROVIDER,
    }


@router.post("/llm")
async def update_llm_settings(update: SettingsUpdate):
    """Update LLM provider configuration at runtime (no restart needed)."""
    set_active_providers([p.dict() for p in update.providers])
    return {"message": "LLM settings updated", "new_default": update.default_provider}


@router.get("/llm/test")
async def test_llm_connection(provider: str = "gemini", model: Optional[str] = None):
    """Test LLM connection with a simple prompt."""
    from core.llm_router import chat
    try:
        response = await chat(
            messages=[{"role": "user", "content": "Respond with exactly: 'SafetyOS LLM connection successful'"}],
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

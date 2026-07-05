"""
SafetyOS Multi-Provider LLM Router

Supports:
- Google Gemini (free tier default)
- OpenRouter (many models via one API)
- Anthropic Claude
- Local Ollama

All providers use a unified interface so agent code doesn't care
which LLM is backing it.
"""
import logging
from typing import Optional, AsyncGenerator, List, Dict, Any
from enum import Enum

from core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    OPENROUTER = "openrouter"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


# Runtime-overridable config (modified via Settings UI)
_active_providers: List[Dict] = []
_default_provider: str = settings.DEFAULT_LLM_PROVIDER
_active_config: Dict[str, Any] = {}


def set_active_providers(providers: List[Dict]):
    """Called from Settings API when user changes LLM config."""
    global _active_providers
    _active_providers = providers


def get_active_config() -> Dict:
    return {
        "default_provider": _default_provider,
        "providers": _get_available_providers()
    }


def _get_available_providers() -> List[Dict]:
    available = []
    if settings.GEMINI_API_KEY:
        available.append({
            "id": "gemini",
            "name": "Google Gemini",
            "models": [
                "gemini-2.0-flash-exp",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-2.5-flash-preview-05-20",
            ],
            "default_model": settings.GEMINI_DEFAULT_MODEL,
            "is_free": True,
        })
    if settings.OPENROUTER_API_KEY:
        available.append({
            "id": "openrouter",
            "name": "OpenRouter",
            "models": [
                "google/gemini-flash-1.5",
                "google/gemini-2.0-flash-exp:free",
                "anthropic/claude-3.5-haiku",
                "meta-llama/llama-3.1-8b-instruct:free",
                "mistralai/mistral-7b-instruct:free",
                "deepseek/deepseek-chat",
            ],
            "default_model": settings.OPENROUTER_DEFAULT_MODEL,
            "is_free": False,
        })
    if settings.ANTHROPIC_API_KEY:
        available.append({
            "id": "anthropic",
            "name": "Anthropic Claude",
            "models": [
                "claude-3-5-haiku-20241022",
                "claude-3-5-sonnet-20241022",
            ],
            "default_model": settings.ANTHROPIC_DEFAULT_MODEL,
            "is_free": False,
        })
    # Ollama — always available if server is reachable
    available.append({
        "id": "ollama",
        "name": "Local Ollama",
        "models": [
            "llama3.1:8b",
            "llama3.2:3b",
            "mistral:7b",
            "phi3:mini",
            "gemma2:9b",
            "deepseek-r1:8b",
        ],
        "default_model": settings.OLLAMA_DEFAULT_MODEL,
        "is_free": True,
        "is_local": True,
    })
    return available


async def chat(
    messages: List[Dict[str, str]],
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Unified chat completion across all providers.
    Falls back through providers if primary fails.
    """
    use_provider = provider or _default_provider

    # Add system message if provided
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    try:
        if use_provider == LLMProvider.GEMINI:
            return await _chat_gemini(full_messages, model, temperature, max_tokens)
        elif use_provider == LLMProvider.OPENROUTER:
            return await _chat_openrouter(full_messages, model, temperature, max_tokens)
        elif use_provider == LLMProvider.ANTHROPIC:
            return await _chat_anthropic(full_messages, model, temperature, max_tokens)
        elif use_provider == LLMProvider.OLLAMA:
            return await _chat_ollama(full_messages, model, temperature, max_tokens)
        else:
            return await _chat_gemini(full_messages, model, temperature, max_tokens)
    except Exception as e:
        logger.error(f"LLM {use_provider} failed: {e}")
        return await _fallback_response(use_provider, str(e))


async def _chat_gemini(messages: list, model: str = None, temp: float = 0.7, max_t: int = 2048) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model_name = model or settings.GEMINI_DEFAULT_MODEL
    llm = genai.GenerativeModel(model_name)

    # Convert to Gemini format
    history = []
    system_content = None
    for msg in messages:
        if msg["role"] == "system":
            system_content = msg["content"]
        elif msg["role"] == "user":
            history.append({"role": "user", "parts": [msg["content"]]})
        elif msg["role"] == "assistant":
            history.append({"role": "model", "parts": [msg["content"]]})

    if system_content and history:
        history[0]["parts"][0] = f"{system_content}\n\n{history[0]['parts'][0]}"

    chat_session = llm.start_chat(history=history[:-1] if len(history) > 1 else [])
    last_user = history[-1]["parts"][0] if history else "Analyze this safety situation."
    response = chat_session.send_message(last_user, generation_config={"temperature": temp, "max_output_tokens": max_t})
    return response.text


async def _chat_openrouter(messages: list, model: str = None, temp: float = 0.7, max_t: int = 2048) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )
    response = await client.chat.completions.create(
        model=model or settings.OPENROUTER_DEFAULT_MODEL,
        messages=messages,
        temperature=temp,
        max_tokens=max_t,
    )
    return response.choices[0].message.content


async def _chat_anthropic(messages: list, model: str = None, temp: float = 0.7, max_t: int = 2048) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    system = next((m["content"] for m in messages if m["role"] == "system"), None)
    filtered = [m for m in messages if m["role"] != "system"]

    kwargs = dict(model=model or settings.ANTHROPIC_DEFAULT_MODEL, max_tokens=max_t, temperature=temp, messages=filtered)
    if system:
        kwargs["system"] = system
    response = await client.messages.create(**kwargs)
    return response.content[0].text


async def _chat_ollama(messages: list, model: str = None, temp: float = 0.7, max_t: int = 2048) -> str:
    import httpx
    ollama_model = model or settings.OLLAMA_DEFAULT_MODEL
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": ollama_model,
                "messages": messages,
                "options": {"temperature": temp, "num_predict": max_t},
                "stream": False,
            }
        )
        data = response.json()
        return data["message"]["content"]


async def _fallback_response(failed_provider: str, error: str) -> str:
    """Try fallback providers in order."""
    fallback_order = ["gemini", "openrouter", "anthropic", "ollama"]
    for provider in fallback_order:
        if provider == failed_provider:
            continue
        try:
            if provider == "gemini" and settings.GEMINI_API_KEY:
                return await _chat_gemini([{"role": "user", "content": "Analyze this industrial safety situation."}])
            elif provider == "openrouter" and settings.OPENROUTER_API_KEY:
                return await _chat_openrouter([{"role": "user", "content": "Analyze this industrial safety situation."}])
        except Exception:
            continue
    return f"[AI OFFLINE] All LLM providers unavailable. Manual assessment required. Error: {error}"

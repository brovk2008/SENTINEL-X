"""SafetyOS Configuration — reads from environment / .env file."""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "safetyos-dev-secret"
    PLANT_NAME: str = "Bharat Petrochemicals Refinery Unit 3"
    PLANT_LOCATION: str = "Vishakhapatnam, Andhra Pradesh"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "http://frontend:3000"
    ]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://safetyos:safetyos_secure_pwd_2025@postgres:5432/safetyos"

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # Neo4j
    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "safetyos_neo4j_pwd"

    # ChromaDB (env: CHROMADB_HOST / CHROMADB_PORT)
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8002

    # MQTT
    MQTT_HOST: str = "mqtt"
    MQTT_PORT: int = 1883
    MQTT_TOPIC_PREFIX: str = "safetyos"

    # LLM — Multi-provider
    DEFAULT_LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_DEFAULT_MODEL: str = "gemini-2.0-flash-exp"
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_DEFAULT_MODEL: str = "google/gemini-flash-1.5"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_DEFAULT_MODEL: str = "claude-3-5-haiku-20241022"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_DEFAULT_MODEL: str = "llama3.1:8b"

    # Firebase (optional)
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None

    # Twilio (optional)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None


settings = Settings()

"""Knowledge RAG API routes."""
import asyncio
import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from intelligence.rag_engine import query_knowledge, get_suggested_questions
from core.redis_client import get_state, COMPOUND_RISK_KEY

logger = logging.getLogger(__name__)
router = APIRouter()


class KnowledgeQuery(BaseModel):
    question: str
    collection_filter: Optional[str] = None  # regulations, incidents, sops, equipment


@router.post("/query")
async def query(body: KnowledgeQuery):
    """RAG query — returns answer with source citations. Hard 8-second timeout."""
    filters = {"collection": body.collection_filter} if body.collection_filter else None
    try:
        result = await asyncio.wait_for(
            query_knowledge(body.question, filters=filters),
            timeout=8.0,
        )
        return result
    except asyncio.TimeoutError:
        logger.warning("RAG query timed out after 8 s — returning fallback")
        return {
            "answer": "SafetyOS Knowledge Base is initializing. Configure an LLM API key in .env for full AI responses. Safe H2S limit: 1 ppm TWA per OISD-105.",
            "sources": [],
            "confidence": 0.0,
            "fallback": True,
        }
    except Exception as e:
        logger.warning(f"RAG query error: {e} — returning fallback")
        return {
            "answer": f"Knowledge query unavailable (demo mode). Error: {str(e)[:120]}",
            "sources": [],
            "confidence": 0.0,
            "fallback": True,
        }


@router.get("/suggestions")
async def get_suggestions():
    """Get context-aware question suggestions based on current plant state."""
    risk_data = await get_state(COMPOUND_RISK_KEY) or {}
    plant_state = {"risk_score": risk_data.get("plant_risk_score", 0)}
    suggestions = await get_suggested_questions(plant_state)
    return {"suggestions": suggestions}


@router.get("/documents")
async def list_documents():
    """List all document categories in the knowledge base."""
    return {
        "categories": [
            {"id": "regulations", "name": "Regulations & Standards", "count": 25, "icon": "⚖️",
             "description": "OISD, Factory Act, DGFASLI, DGMS standards"},
            {"id": "incidents", "name": "Historical Incidents", "count": 50, "icon": "📋",
             "description": "Industry incident reports 2015-2025"},
            {"id": "sops", "name": "Standard Operating Procedures", "count": 18, "icon": "📖",
             "description": "Equipment startup, shutdown, emergency SOPs"},
            {"id": "equipment", "name": "Equipment Documentation", "count": 12, "icon": "⚙️",
             "description": "Pump, compressor, valve, tank documentation"},
        ]
    }

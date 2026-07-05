"""RAG Engine — Industrial knowledge retrieval with citations."""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from core.llm_router import chat
from core.chroma_client import get_chroma, COLLECTIONS

logger = logging.getLogger(__name__)

SAFETY_SYSTEM_PROMPT = """You are SafetyOS Knowledge Assistant — an expert in industrial safety for the 
Indian petrochemical and oil & gas industry. You have deep knowledge of:
- OISD (Oil Industry Safety Directorate) standards
- Factory Act 1948 (safety provisions)
- DGFASLI guidelines
- DGMS regulations
- Standard Operating Procedures for petrochemical equipment
- Historical industrial incidents in India and globally

Answer questions based on the provided context documents. Always:
1. Cite your source (document name, section number if available)
2. State confidence level (High/Medium/Low)
3. Flag if the answer requires expert verification
4. Keep answers practical and actionable
5. Reference specific regulatory thresholds and numbers

If the context doesn't contain relevant information, say so honestly."""

# Fallback knowledge base for when ChromaDB is unavailable
FALLBACK_KNOWLEDGE = {
    "h2s": {
        "answer": "H2S (Hydrogen Sulfide) is extremely toxic. OISD-105 sets mandatory evacuation threshold at 25ppm in confined spaces. TLV-TWA is 1ppm (ACGIH). IDLH (Immediately Dangerous to Life) is 100ppm. STEL is 5ppm. Workers must wear SCBA when H2S exceeds 10ppm in confined spaces.",
        "source": "OISD-105, Section 4.3; ACGIH TLV Documentation",
        "confidence": "High"
    },
    "permit": {
        "answer": "Permit-to-Work (PTW) system requirements per DGFASLI: Gas test must be conducted within 1 hour before entry. Confined space entry requires supervisor authorization, rescue equipment standby, continuous gas monitoring, and buddy system. Hot work permits require fire watch for 30 minutes after work completion.",
        "source": "DGFASLI Safety Guidelines 2019; OISD-116",
        "confidence": "High"
    },
}


async def query_knowledge(
    question: str,
    filters: Optional[Dict] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    RAG query: embed question → retrieve context → generate answer with citations.
    """
    start_time = datetime.utcnow()
    sources_retrieved = []

    # Try ChromaDB retrieval
    chroma = get_chroma()
    context_text = ""

    if chroma:
        try:
            # Query across all collections or filter by type
            collections_to_search = [filters.get("collection")] if filters and filters.get("collection") \
                else list(COLLECTIONS.values())

            for coll_name in collections_to_search[:3]:  # Max 3 collections
                try:
                    collection = await chroma.get_or_create_collection(coll_name)
                    results = await collection.query(
                        query_texts=[question],
                        n_results=min(top_k, 3),
                        include=["documents", "metadatas", "distances"]
                    )
                    if results["documents"][0]:
                        for doc, meta, dist in zip(
                            results["documents"][0],
                            results["metadatas"][0],
                            results["distances"][0]
                        ):
                            if dist < 0.7:  # Relevance threshold
                                sources_retrieved.append({
                                    "text": doc[:500],
                                    "source": meta.get("source", "Unknown"),
                                    "section": meta.get("section", ""),
                                    "document_type": meta.get("document_type", "regulation"),
                                    "relevance_score": round(1 - dist, 2),
                                })
                                context_text += f"\n\n[Source: {meta.get('source', 'Unknown')}]\n{doc}"
                except Exception as e:
                    logger.warning(f"Collection {coll_name} query failed: {e}")
        except Exception as e:
            logger.error(f"ChromaDB query error: {e}")

    # Use fallback knowledge if no context retrieved
    if not context_text:
        for key, kb in FALLBACK_KNOWLEDGE.items():
            if key in question.lower():
                context_text = kb["answer"]
                sources_retrieved.append({
                    "source": kb["source"],
                    "text": kb["answer"],
                    "relevance_score": 0.85,
                    "document_type": "regulation"
                })
                break

    if not context_text:
        context_text = "No specific document found. Answering from general industrial safety knowledge."

    # Generate answer with LLM
    messages = [
        {
            "role": "user",
            "content": f"""Question: {question}

Relevant documents:
{context_text}

Please provide a clear, accurate answer with source citations and confidence level."""
        }
    ]

    try:
        answer = await chat(
            messages=messages,
            system_prompt=SAFETY_SYSTEM_PROMPT,
            temperature=0.3,  # Low temperature for factual responses
            max_tokens=1024,
        )
    except Exception as e:
        answer = f"Knowledge system temporarily unavailable: {e}\n\nBased on general knowledge: {context_text[:500]}"

    elapsed = (datetime.utcnow() - start_time).total_seconds()

    return {
        "question": question,
        "answer": answer,
        "sources": sources_retrieved,
        "confidence": _assess_confidence(sources_retrieved),
        "response_time_ms": int(elapsed * 1000),
        "context_used": bool(context_text),
        "timestamp": start_time.isoformat(),
    }


def _assess_confidence(sources: List[dict]) -> str:
    if not sources:
        return "Low — No documents retrieved"
    avg_relevance = sum(s.get("relevance_score", 0) for s in sources) / len(sources)
    if avg_relevance > 0.8:
        return "High"
    elif avg_relevance > 0.6:
        return "Medium"
    return "Low"


async def get_suggested_questions(plant_state: dict) -> List[str]:
    """Generate context-aware suggested questions based on current plant state."""
    risk_score = plant_state.get("risk_score", 0)
    suggestions = [
        "What is the safe re-entry procedure after H2S detection?",
        "What OISD standard governs confined space entry?",
        "What are the mandatory checks before issuing a hot work permit?",
    ]
    if risk_score > 60:
        suggestions.insert(0, "What are the emergency evacuation procedures for H2S exposure?")
        suggestions.insert(1, "What is the mandatory response when LEL exceeds 25% in a confined space?")
    return suggestions[:5]

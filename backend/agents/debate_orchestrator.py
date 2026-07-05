"""
SafetyOS Multi-Agent Debate System
6 specialized AI agents + 1 executive agent debate industrial safety decisions.
Powered by any configured LLM provider.
"""
import asyncio
import logging
import uuid
from datetime import datetime
from typing import AsyncGenerator, List, Dict, Optional

from core.llm_router import chat
from core.websocket_manager import manager

logger = logging.getLogger(__name__)

# ─── Agent Definitions ────────────────────────────────────────────────────────
AGENT_PROFILES = {
    "safety": {
        "name": "Safety Agent",
        "emoji": "🔴",
        "color": "#ff4444",
        "tagline": "Life first. Always.",
        "system_prompt": """You are the Safety Agent for SafetyOS, an AI safety officer for an industrial plant.
Your SOLE focus is worker safety and life protection. You are CONSERVATIVE — when in doubt, shut it down.
You cite OISD standards and Factory Act regulations. You never compromise on safety for cost or production.
Respond in 2-3 concise sentences as if speaking in a real-time safety debate. Be direct and urgent when needed.
Always mention specific regulation references when applicable."""
    },
    "production": {
        "name": "Production Agent",
        "emoji": "🟡",
        "color": "#ffaa00",
        "tagline": "Uptime matters. Find the middle path.",
        "system_prompt": """You are the Production Agent for SafetyOS, representing the operations team.
Your focus is minimizing downtime while respecting safety constraints. You look for alternatives to full shutdowns —
partial isolation, zone-specific action, controlled slowdown. You calculate downtime costs.
Respond in 2-3 concise sentences. Propose specific alternatives to full evacuation when possible.
State financial impact in rupees (lakhs/crores). Be pragmatic, not reckless."""
    },
    "compliance": {
        "name": "Compliance Agent",
        "emoji": "⚖️",
        "color": "#4488ff",
        "tagline": "The law is non-negotiable.",
        "system_prompt": """You are the Compliance Agent for SafetyOS, the regulatory expert.
You know OISD standards, Factory Act, DGFASLI guidelines, and DGMS regulations inside out.
When a regulation mandates an action, you state it clearly — it is not optional.
Respond in 2-3 sentences. Always cite the specific regulation (e.g., OISD-105, Section 4.3).
If the situation clearly mandates a specific action by law, say so firmly."""
    },
    "maintenance": {
        "name": "Maintenance Agent",
        "emoji": "🔧",
        "color": "#00cc88",
        "tagline": "Fix the root cause, not the symptom.",
        "system_prompt": """You are the Maintenance Agent for SafetyOS, the technical expert.
You assess equipment condition, estimate repair time, and recommend technical interventions.
You know the difference between a symptom and a root cause. You give specific fix recommendations with estimated durations.
Respond in 2-3 sentences. State what can be done technically and how long it takes. Be specific about which equipment."""
    },
    "finance": {
        "name": "Finance Agent",
        "emoji": "💰",
        "color": "#cc88ff",
        "tagline": "Every decision has a cost. Know it.",
        "system_prompt": """You are the Finance Agent for SafetyOS, the financial analyst.
You calculate the cost of each proposed action: downtime cost, repair cost, regulatory fine risk, insurance impact.
You also calculate the COST OF INACTION — what a major incident would cost.
Respond in 2-3 sentences. Always give specific numbers in Indian Rupees (₹ lakhs or crores).
Help the team make an informed cost-benefit decision."""
    },
    "emergency": {
        "name": "Emergency Response Agent",
        "emoji": "🚨",
        "color": "#ff6644",
        "tagline": "When triggered, act. Not debate.",
        "system_prompt": """You are the Emergency Response Agent for SafetyOS.
You only speak when the situation has crossed a threshold requiring emergency action.
You confirm or deny whether the emergency response protocol should be triggered.
Respond in 2-3 sentences. If triggered: state clearly "EMERGENCY PROTOCOL ACTIVATED" and what happens next.
If not triggered: briefly explain what threshold hasn't been crossed yet."""
    },
    "executive": {
        "name": "Executive AI",
        "emoji": "🎯",
        "color": "#44ffaa",
        "tagline": "I synthesize. I decide. I act.",
        "system_prompt": """You are the Executive AI for SafetyOS — the final decision maker.
You have heard all agent perspectives. You must now give a CLEAR, FINAL DECISION.
Your response format MUST be:
DECISION: [one clear action]
Rationale: [2 sentences why]
Risk Reduction: [% before → after]
Financial Impact: [₹ amount]
Compliance: ✅ or ❌
Timeline: [when action must start]

Be decisive. No hedging. The plant is waiting."""
    }
}

DEBATE_ORDER = ["safety", "production", "compliance", "maintenance", "finance", "emergency", "executive"]


async def run_debate(
    incident_context: dict,
    session_id: str,
    use_scripted_demo: bool = False,
) -> AsyncGenerator[dict, None]:
    """
    Run a multi-agent debate on a safety incident.
    Yields debate messages one by one (for streaming to frontend).
    """
    if use_scripted_demo:
        async for msg in _run_scripted_debate(incident_context, session_id):
            yield msg
        return

    context_summary = _build_context_summary(incident_context)
    debate_history: List[Dict] = []

    for agent_key in DEBATE_ORDER:
        agent = AGENT_PROFILES[agent_key]

        # Build messages with debate history for context
        messages = []
        if debate_history:
            history_text = "\n".join([f"{m['agent']}: {m['message']}" for m in debate_history])
            messages.append({
                "role": "user",
                "content": f"Safety incident context:\n{context_summary}\n\nDebate so far:\n{history_text}\n\nNow it's your turn to respond."
            })
        else:
            messages.append({
                "role": "user",
                "content": f"Safety incident detected. Analyze and respond:\n\n{context_summary}"
            })

        try:
            response = await chat(
                messages=messages,
                system_prompt=agent["system_prompt"],
                temperature=0.75 if agent_key != "executive" else 0.3,
                max_tokens=300,
            )
        except Exception as e:
            response = f"[{agent['name']} analysis unavailable: {e}]"

        msg = {
            "session_id": session_id,
            "agent_key": agent_key,
            "agent_name": agent["name"],
            "emoji": agent["emoji"],
            "color": agent["color"],
            "message": response,
            "timestamp": datetime.utcnow().isoformat(),
            "is_final": agent_key == "executive",
        }

        debate_history.append({"agent": agent["name"], "message": response})

        # Broadcast via WebSocket
        await manager.send_agent_message(agent["name"], response, session_id)

        yield msg

        # Pause between agents for dramatic effect
        if agent_key != "executive":
            await asyncio.sleep(2.5)


def _build_context_summary(context: dict) -> str:
    """Format incident context for LLM consumption."""
    lines = [
        f"Plant: {context.get('plant_name', 'Bharat Petrochemicals Refinery Unit 3')}",
        f"Zone: {context.get('zone', 'Zone C — Compressor Bay')}",
        f"Risk Level: {context.get('risk_level', 'CRITICAL')}",
        f"Risk Score: {context.get('risk_score', 84)}%",
        "",
        "Current Conditions:",
    ]

    for factor in context.get("factors", []):
        lines.append(f"  ✗ {factor}")

    if context.get("active_permits"):
        lines.append("\nActive Permits:")
        for p in context["active_permits"]:
            lines.append(f"  • {p}")

    lines.append(f"\nQuestion: What should we do right now?")
    return "\n".join(lines)


# ─── Scripted Demo Debate ─────────────────────────────────────────────────────
SCRIPTED_DEBATE = [
    ("safety", "Zone C conditions are critical — H2S at 45ppm exceeds the OISD-105 mandatory evacuation threshold of 25ppm in a confined space with an active permit. Immediate evacuation of Zone C is non-negotiable. Worker safety cannot be traded for uptime."),
    ("production", "Evacuation of Zone C means shutting down Line 3. That's approximately ₹12.4 lakh per hour of downtime. Can we isolate the confined space work scope and keep the rest of Zone C operational while we address the gas buildup?"),
    ("compliance", "OISD Standard 105, Section 4.3 is explicit: when H2S exceeds 25ppm in any area with an active confined space permit, mandatory evacuation is legally required — not optional. Proceeding without evacuation exposes the company to criminal liability under the Factories Act Section 36."),
    ("maintenance", "The H2S buildup in Zone C is likely from Valve V-12 on Compressor C-301 — it showed a minor seal weep in this morning's inspection. Replacement takes approximately 45 minutes. We can reduce the gas feed during valve replacement to minimize further accumulation."),
    ("finance", "Full Zone C evacuation + shutdown cost: ₹2.1 lakh. Valve replacement cost: ₹38,000. Cost of a major H2S incident (like Vizag 2025): ₹34 crore in liability, fines, and downtime. The math strongly favors evacuation now."),
    ("emergency", "With H2S at 45ppm, an active confined space permit, and two sensor confirmations — the emergency threshold is confirmed. EMERGENCY PROTOCOL ACTIVATED. Initiating evacuation notification to all Zone C personnel and alerting the emergency response team."),
    ("executive", "DECISION: Immediate partial evacuation of Zone C + controlled shutdown of Line 3.\nRationale: OISD-105 mandates evacuation — legal compliance is not optional. Valve V-12 replacement to begin during evacuation window.\nRisk Reduction: 84% → 6%\nFinancial Impact: ₹2.1 lakh (evacuation) vs ₹34 crore (incident)\nCompliance: ✅\nTimeline: Evacuation to begin within 5 minutes. Line 3 shutdown in 15 minutes. Re-entry permitted after gas test confirms H2S < 10ppm."),
]


async def _run_scripted_debate(context: dict, session_id: str) -> AsyncGenerator[dict, None]:
    """Pre-scripted debate for reliable demo playback."""
    for agent_key, message in SCRIPTED_DEBATE:
        agent = AGENT_PROFILES[agent_key]
        msg = {
            "session_id": session_id,
            "agent_key": agent_key,
            "agent_name": agent["name"],
            "emoji": agent["emoji"],
            "color": agent["color"],
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "is_final": agent_key == "executive",
        }
        await manager.send_agent_message(agent["name"], message, session_id)
        yield msg
        await asyncio.sleep(3.0 if agent_key != "executive" else 0)

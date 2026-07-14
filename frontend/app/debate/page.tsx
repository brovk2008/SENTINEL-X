"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  RotateCcw,
  ShieldAlert,
  Cpu,
  Scale,
  Wrench,
  DollarSign,
  Siren,
  Award,
  Bot,
} from "lucide-react";

interface AgentMessage {
  session_id: string;
  agent_key: string;
  agent_name: string;
  message: string;
  timestamp: string;
  is_final?: boolean;
}

const AGENT_META: Record<string, { Icon: any; color: string; tagline: string }> = {
  safety:      { Icon: ShieldAlert, color: "#ff4444", tagline: "Life first. Always." },
  production:  { Icon: Cpu,         color: "#ffaa00", tagline: "Uptime matters." },
  compliance:  { Icon: Scale,       color: "#4488ff", tagline: "The law is non-negotiable." },
  maintenance: { Icon: Wrench,      color: "#00cc88", tagline: "Fix the root cause." },
  finance:     { Icon: DollarSign,  color: "#cc88ff", tagline: "Know the cost." },
  emergency:   { Icon: Siren,       color: "#ff6644", tagline: "When triggered, act." },
  executive:   { Icon: Award,       color: "#44ffaa", tagline: "I decide. I act." },
};

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function DebatePage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [useScripted, setUseScripted] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('h2s_confined_space');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const runDebate = async () => {
    if (running) return;
    setMessages([]);
    setRunning(true);

    try {
      const response = await fetch(`${API}/agents/debate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: "ZC",
          risk_level: "CRITICAL",
          use_scripted_demo: useScripted,
          scenario: selectedScenario,
        })
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          try {
            const msg = JSON.parse(dataStr);
            if (msg.type === "debate_complete") {
              setRunning(false);
            } else if (msg.agent_key) {
              setMessages((prev) => [...prev, msg as AgentMessage]);
            }
          } catch (e) {
            console.error("Failed to parse SSE JSON", e);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const agentOrder = ["safety", "production", "compliance", "maintenance", "finance", "emergency", "executive"];

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">AI Debate Chamber</div>
          <div className="page-subtitle">
            Observe Sentinel X multi-agent debate reasoning through complex, high-risk industrial safety dilemmas.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setMessages([])}
            className="clay-btn"
            disabled={running || messages.length === 0}
          >
            <RotateCcw size={13} style={{ marginRight: 6 }} /> Reset
          </button>
          <button
            onClick={runDebate}
            className="clay-btn primary"
            disabled={running}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Bot size={15} />
            <span>{running ? "Debating..." : "Run AI Debate"}</span>
          </button>
        </div>
      </div>

      {/* Agents Avatars Row */}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" }}>
        {agentOrder.map((key) => {
          const meta = AGENT_META[key];
          const AgentIcon = meta.Icon;
          const hasSpoken = messages.some((m) => m.agent_key === key);
          const isSpeaking = running && messages[messages.length - 1]?.agent_key === key;

          return (
            <div
              key={key}
              className="clay-card"
              style={{
                flex: "1 1 100px",
                padding: "10px 8px",
                textAlign: "center",
                background: isSpeaking ? `${meta.color}08` : undefined,
                border: isSpeaking ? `1px solid ${meta.color}40` : undefined,
                opacity: hasSpoken || isSpeaking ? 1 : 0.45,
                transition: "all 0.25s",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 6px",
                  borderRadius: 8,
                  background: `${meta.color}15`,
                  display: "grid",
                  placeItems: "center",
                  color: meta.color,
                }}
              >
                <AgentIcon size={16} />
              </div>
              <div style={{ fontSize: "10px", fontWeight: "800", color: hasSpoken ? meta.color : "var(--text-secondary)", letterSpacing: "0.04em" }}>
                {key.toUpperCase()}
              </div>
              {isSpeaking && (
                <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "4px" }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Debate Transcript Feed */}
      <div className="debate-feed" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && !running && (
          <div>
            {/* Last session result card */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dim)',
              borderRadius: 6,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Last Session — 14 minutes ago &middot; 7 agents &middot; 3m 24s
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>
                H2S Buildup — Zone C Compressor Bay
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Compound risk: H₂S 45ppm + Active Confined Space permit + 6 workers in zone
              </div>
              <div style={{
                background: 'var(--alarm-normal-bg)',
                border: '1px solid var(--alarm-normal)',
                borderLeft: '3px solid var(--alarm-normal)',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 12,
                color: 'var(--alarm-normal)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 16,
              }}>
                DECISION: Zone C partial shutdown. Valve CV-312 replacement scheduled. Risk: 84% → 18%. Cost: ₹18.8L.
              </div>

              {/* Collapsible Transcript history */}
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', userSelect: 'none', padding: '4px 0' }}>
                  Show Full Debate Transcript Logs
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  {[
                    { agent: "Safety Agent", color: "#ff4444", icon: "🛡️",
                      message: "Zone C conditions are critical — H2S at 45ppm exceeds the OISD-105 mandatory evacuation threshold of 25ppm in a confined space with an active permit. Immediate evacuation of Zone C is non-negotiable. Worker safety cannot be traded for uptime." },
                    { agent: "Production Agent", color: "#ffaa00", icon: "⚙️",
                      message: "Evacuation of Zone C means shutting down Line 3. That's approximately ₹18.4 lakh in downtime. Can we isolate the confined space work scope and keep the rest of Zone C operational while we address the gas buildup?" },
                    { agent: "Compliance Agent", color: "#4488ff", icon: "⚖️",
                      message: "OISD Standard 105, Section 4.3 is explicit: when H2S exceeds 25ppm in any area with an active confined space permit, mandatory evacuation is legally required — not optional. Proceeding without evacuation exposes the company to criminal liability." },
                    { agent: "Maintenance Agent", color: "#00cc88", icon: "🔧",
                      message: "The H2S buildup is from Valve CV-312 seal weep on Compressor C-301 — inspection noted this morning. Replacement takes 45 minutes. We can reduce feed rate to minimize further accumulation during evacuation." },
                    { agent: "Finance Agent", color: "#cc88ff", icon: "💰",
                      message: "Full Zone C evacuation + shutdown: ₹18.8L total. Cost of a major H2S incident (Vizag 2025 model): ₹34 crore in liability and fines. The math strongly favors evacuation now." },
                    { agent: "Emergency Response Agent", color: "#ff6644", icon: "🚨",
                      message: "With H2S at 45ppm, active confined space permit, and dual sensor confirmation — emergency threshold confirmed. EMERGENCY PROTOCOL ACTIVATED. Evacuating all Zone C personnel. Response team dispatched." },
                    { agent: "Executive AI", color: "#44ffaa", icon: "🎯", isExecutive: true,
                      message: "DECISION: Immediate Zone C evacuation + partial Line 3 shutdown.\nRationale: OISD-105 mandates evacuation. Valve replacement during 90-minute evacuation window.\nRisk Reduction: 84% → 3%\nCost: ₹18.8L downtime + ₹38K valve = ₹18.8L total\nCompliance: ✅ OISD-105-4.3\nTimeline: Evacuation starts NOW. Operations resume 16:30 after gas test < 10ppm." },
                  ].map((h, hi) => (
                    <div key={hi} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 14 }}>{h.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: h.color }}>{h.agent}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{h.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            {/* Scenario selector */}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Select Debate Scenario
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'h2s_confined_space', title: 'H2S + Confined Space', severity: 'critical', zone: 'Zone C', detail: 'Compressor Bay H₂S buildup during active CSE permit' },
                { id: 'equipment_failure',  title: 'Compressor Failure Cascade', severity: 'high', zone: 'Zone B', detail: 'C-301 vibration 11mm/s + adjacent hot work permit' },
                { id: 'permit_conflict',    title: 'Hot Work + Adjacent LEL', severity: 'high', zone: 'Zone A', detail: 'Open flame work within 15m of LEL 18% sensor' },
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  style={{
                    background: selectedScenario === s.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: `1px solid ${selectedScenario === s.id ? 'var(--border-bright)' : 'var(--border-dim)'}`,
                    borderLeft: selectedScenario === s.id ? '3px solid var(--alarm-info)' : '1px solid var(--border-dim)',
                    borderRadius: 6,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{s.zone}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>{s.detail}</div>
                  <span className={`badge ${s.severity}`}>{s.severity.toUpperCase()}</span>
                </div>
              ))}
            </div>

            {/* Help text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-dim)' }}>
              <Brain size={14} color="var(--alarm-info)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                7 specialized AI agents will debate the selected scenario in real-time. The Executive Agent synthesizes all inputs and issues a final risk decision.
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const meta = AGENT_META[msg.agent_key];
          const AgentIcon = meta?.Icon || Bot;
          const isExecutive = msg.is_final;

          return (
            <div
              key={i}
              className={`clay-card ${isExecutive ? "info" : ""}`}
              style={{
                display: "flex",
                gap: "14px",
                padding: "16px",
                borderLeft: `4px solid ${meta?.color || "rgba(255,255,255,0.06)"}`,
              }}
            >
              {/* Agent avatar */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: `${meta?.color || "#888"}15`,
                  border: `1px solid ${meta?.color || "#888"}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: meta?.color || "#fff",
                }}
              >
                <AgentIcon size={18} />
              </div>

              {/* Message */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: meta?.color || "var(--text-primary)" }}>
                    {msg.agent_name}
                  </span>
                  {isExecutive && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "800",
                        background: "rgba(68,255,170,0.15)",
                        color: "#44ffaa",
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      FINAL DECISION
                    </span>
                  )}
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

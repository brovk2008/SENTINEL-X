"use client";
import { useState, useEffect, useRef } from "react";
import { useStore, AgentMessage } from "../../lib/store";
import { Brain, RotateCcw } from "lucide-react";

const AGENT_META: Record<string, { emoji: string; color: string; tagline: string }> = {
  safety: { emoji: "🔴", color: "#ff4444", tagline: "Life first. Always." },
  production: { emoji: "🟡", color: "#ffaa00", tagline: "Uptime matters." },
  compliance: { emoji: "⚖️", color: "#4488ff", tagline: "The law is non-negotiable." },
  maintenance: { emoji: "🔧", color: "#00cc88", tagline: "Fix the root cause." },
  finance: { emoji: "💰", color: "#cc88ff", tagline: "Know the cost." },
  emergency: { emoji: "🚨", color: "#ff6644", tagline: "When triggered, act." },
  executive: { emoji: "🎯", color: "#44ffaa", tagline: "I decide. I act." },
};

export default function AgentsPage() {
  const { debateMessages, isDebateRunning, setDebateRunning, clearDebate, addDebateMessage, startDebateSession } = useStore();
  const [useScripted, setUseScripted] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debateMessages]);

  const runDebate = async () => {
    if (isDebateRunning) return;
    clearDebate();
    const sessionId = Date.now().toString();
    startDebateSession(sessionId);
    setDebateRunning(true);

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/agents/debate/stream?use_scripted_demo=${useScripted}`
    );

    eventSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "debate_complete") {
          setDebateRunning(false);
          eventSource.close();
        } else if (msg.agent_key) {
          addDebateMessage(msg as AgentMessage);
        }
      } catch {}
    };

    eventSource.onerror = () => {
      setDebateRunning(false);
      eventSource.close();
    };
  };

  const agentOrder = ["safety", "production", "compliance", "maintenance", "finance", "emergency", "executive"];

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Multi-Agent AI Debate Room
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            6 specialized AI agents debate safety decisions → Executive AI synthesizes the final call
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={useScripted}
              onChange={(e) => setUseScripted(e.target.checked)}
              style={{ accentColor: "var(--accent-primary)" }}
            />
            Demo Script (reliable)
          </label>
          <button
            onClick={clearDebate}
            className="btn btn-ghost btn-sm"
            disabled={isDebateRunning}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={runDebate}
            className="btn btn-primary"
            disabled={isDebateRunning}
            style={{ background: isDebateRunning ? "rgba(74,128,255,0.3)" : undefined }}
          >
            {isDebateRunning ? (
              <>
                <div className="live-dot" style={{ width: 8, height: 8, background: "white" }} />
                Debating...
              </>
            ) : (
              <>
                <Brain size={15} />
                Run Debate on Current Risk
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incident Context Banner */}
      <div className="glass-card critical" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--risk-critical)", marginBottom: "6px" }}>
              COMPOUND RISK DETECTED — Zone C — Compressor Bay
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {[
                "H2S: 45ppm (threshold: 25ppm) ↑",
                "Confined Space Permit ACTIVE (2.5hrs)",
                "Compressor C-301 Vibration: +340% baseline",
                "Maintenance: OVERDUE 8 days",
                "Similar to: Vizag 2025 incident",
              ].map((f) => (
                <span key={f} style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ color: "var(--risk-critical)" }}>✗</span> {f}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--risk-critical)", fontFamily: "var(--font-mono)" }}>84%</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>explosion probability</div>
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "20px" }}>
        {agentOrder.map((key) => {
          const meta = AGENT_META[key];
          const hasSpoken = debateMessages.some((m) => m.agent_key === key);
          const isSpeaking = isDebateRunning && !hasSpoken;

          return (
            <div key={key} style={{
              padding: "12px 8px",
              background: hasSpoken ? `${meta.color}10` : "var(--glass-xs)",
              border: `1px solid ${hasSpoken ? meta.color + "30" : "var(--glass-border)"}`,
              borderRadius: "10px",
              textAlign: "center",
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{meta.emoji}</div>
              <div style={{ fontSize: "9px", fontWeight: "700", color: hasSpoken ? meta.color : "var(--text-muted)", letterSpacing: "0.04em" }}>
                {key.toUpperCase()}
              </div>
              {isSpeaking && (
                <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "4px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 4, height: 4,
                      borderRadius: "50%",
                      background: meta.color,
                      animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Debate transcript */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {debateMessages.length === 0 && !isDebateRunning && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-muted)",
            background: "var(--glass-xs)",
            borderRadius: "12px",
            border: "1px dashed var(--glass-border)",
          }}>
            <Brain size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
            <div style={{ fontSize: "14px", marginBottom: "6px" }}>
              Click <strong>&quot;Run Debate on Current Risk&quot;</strong> to watch 7 AI agents reason through the Zone C crisis
            </div>
            <div style={{ fontSize: "12px", opacity: 0.6 }}>
              Each agent represents a different stakeholder perspective. The Executive AI synthesizes the final decision.
            </div>
          </div>
        )}

        {debateMessages.map((msg, i) => {
          const meta = AGENT_META[msg.agent_key];
          const isExecutive = msg.is_final;

          return (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{
                display: "flex",
                gap: "12px",
                padding: "16px",
                background: isExecutive ? "rgba(68,255,170,0.05)" : "transparent",
                border: isExecutive ? "1px solid rgba(68,255,170,0.2)" : "none",
                borderRadius: isExecutive ? "12px" : "0",
                borderBottom: !isExecutive ? "1px solid var(--glass-border)" : "none",
                marginBottom: isExecutive ? "0" : "0",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Agent avatar */}
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `${meta?.color || "#888"}15`,
                border: `1px solid ${meta?.color || "#888"}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "18px",
              }}>
                {msg.emoji}
              </div>

              {/* Message */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: meta?.color || "var(--text-primary)" }}>
                    {msg.agent_name}
                  </span>
                  {isExecutive && (
                    <span style={{
                      fontSize: "9px",
                      fontWeight: "700",
                      background: "rgba(68,255,170,0.15)",
                      color: "#44ffaa",
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}>FINAL DECISION</span>
                  )}
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{
                  fontSize: isExecutive ? "13px" : "13px",
                  color: "var(--text-primary)",
                  lineHeight: 1.6,
                  fontFamily: isExecutive ? "var(--font-mono)" : "var(--font-sans)",
                  whiteSpace: "pre-wrap",
                  background: isExecutive ? "var(--glass-xs)" : "transparent",
                  padding: isExecutive ? "12px" : "0",
                  borderRadius: isExecutive ? "8px" : "0",
                  borderLeft: isExecutive ? "2px solid #44ffaa" : "none",
                }}>
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

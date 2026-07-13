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
          scenario: "h2s_confined_space"
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
          <div
            className="clay-card info"
            style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}
          >
            <Brain size={36} style={{ color: "var(--accent-blue)", marginBottom: "12px", opacity: 0.8 }} />
            <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>
              Run Safety Debate
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Watch 7 specialized AI agents discuss a critical Zone C H₂S gas release scenario.
              The Executive AI will synthesize all inputs and make the final decision.
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

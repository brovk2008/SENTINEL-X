"use client";
import React, { useEffect, useState } from "react";
import { Brain, FileText, Sparkles, Send, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

const MOCK_BRIEF = `**Sentinel X Executive Safety Briefing**
Generated on: ${new Date().toLocaleDateString("en-IN")}

### 1. Plant Risk Status Summary
The compound plant risk is currently evaluated at **84% (CRITICAL)**. This elevated warning is primary concentrated in **Zone C (Compressor Bay)** due to a combination of:
*   **H₂S gas level drift** currently at 8.2 ppm (exceeding the standard 5.0 ppm warning threshold).
*   Active welding permit **PTW-2025-0847** in close proximity.
*   Thermal heat index **WBGT at 34.2 °C** indicating high physical heat strain for shift operators.

### 2. Immediate Recommended Actions
*   **Engineering**: Actuate Zone C exhaust fans to maximum draft. Enforce SCBA breath apparatus for any personnel entering the zone.
*   **Operations**: Terminate or suspend active welding permit PTW-2025-0847 to eliminate ignition hazards.
*   **Supervision**: Enforce hydration rotation cycles for Zone C crew (mandated by WBGT limit).`;

export default function ExecutivePage() {
  const [brief, setBrief] = useState(MOCK_BRIEF);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Welcome to the Executive Safety Copilot. I can analyze OISD safety standard documents or answer operational risk queries. Ask me anything." }
  ]);
  const [input, setInput] = useState("");

  const loadBrief = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics/executive-brief`);
      const d = await res.json();
      if (d.brief) setBrief(d.brief);
    } catch {
      // Keep mock brief
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrief();
  }, []);

  const askCopilot = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/knowledge/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const d = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: d.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "AI Copilot analysis: Zone C H2S levels must be brought below 5 ppm before issuing cold work clearance (ref: OISD-STD-105 Section 6.2)." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Executive Safety Copilot</div>
          <div className="page-subtitle">
            Strategic risk brief and conversational AI assistant for plant management.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadBrief} className="clay-btn" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} />
            <span>Regenerate Brief</span>
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} className="clay-btn primary">
            {chatOpen ? "Hide Assistant" : "Open Assistant"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: chatOpen ? "1fr 400px" : "1fr", gap: "20px", alignItems: "start" }}>
        {/* Briefing Area */}
        <div className="clay-card info">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <FileText size={20} color="var(--accent-blue)" />
            <div style={{ fontWeight: 800, fontSize: 14 }}>Real-Time Operational Safety Briefing</div>
            <div className="live-dot" style={{ marginLeft: "auto" }} />
          </div>

          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 20 }}>Generating briefing...</div>
          ) : (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}
            >
              {brief}
            </div>
          )}
        </div>

        {/* Chat Assistant */}
        {chatOpen && (
          <div className="clay-card" style={{ display: "flex", flexDirection: "column", height: "550px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10 }}>
              <Brain size={16} color="var(--accent-purple)" />
              <div style={{ fontWeight: 800, fontSize: 13 }}>Strategic Copilot Chat</div>
            </div>

            {/* Message Area */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background: m.role === "user" ? "rgba(77,142,255,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${m.role === "user" ? "rgba(77,142,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "12px",
                    padding: "10px 14px",
                    maxWidth: "85%",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "var(--text-primary)"
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 9, color: m.role === "user" ? "var(--accent-blue)" : "var(--accent-purple)", marginBottom: 4, textTransform: "uppercase" }}>
                    {m.role === "user" ? "You" : "Safety Copilot"}
                  </div>
                  <div>{m.content}</div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="clay-input"
                placeholder="Ask about compliance or safety status..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askCopilot()}
              />
              <button className="clay-btn primary" onClick={askCopilot} disabled={loading} style={{ padding: "10px 14px" }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

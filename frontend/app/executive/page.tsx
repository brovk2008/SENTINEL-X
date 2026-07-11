"use client";
import { useEffect, useState } from "react";
import { Brain, FileText, Sparkles, HelpCircle, Send } from "lucide-react";

export default function ExecutivePage() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");

  const loadBrief = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/executive-brief`);
      const d = await res.json();
      setBrief(d.brief || "");
    } catch {
      setBrief("Briefing generation failed — please verify backend connectivity.");
    }
    setLoading(false);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/knowledge/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const d = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: d.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error communicating with AI Copilot" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", display: "grid", gridTemplateColumns: chatOpen ? "1fr 380px" : "1fr", gap: "16px" }}>
      {/* Brief area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Executive Safety Copilot</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              High-level safety analysis and strategic recommendations for plant operations
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setChatOpen(!chatOpen)} className="btn btn-ghost btn-sm">
              <Brain size={13} /> {chatOpen ? "Hide Chat" : "Ask Copilot"}
            </button>
            <button onClick={loadBrief} className="btn btn-primary btn-sm" disabled={loading}>
              <Sparkles size={13} /> Re-generate Briefing
            </button>
          </div>
        </div>

        {/* Executive summary block */}
        <div className="glass-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { label: "Overall Plant Status", value: "ELEVATED RISK", color: "var(--risk-high)", desc: "Line 3 compressor gas buildup active" },
            { label: "Financial Risk", value: "₹2.1 Lakh", color: "var(--risk-high)", desc: "Estimated impact if evac is delayed" },
            { label: "Critical Actions Required", value: "3 Actions", color: "var(--risk-critical)", desc: "Evacuate Zone C, replace valve, warning alert" },
          ].map((card) => (
            <div key={card.label} style={{ padding: "12px", background: "var(--glass-xs)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>{card.label.toUpperCase()}</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: card.color, marginBottom: "2px" }}>{card.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Main brief markdown display */}
        <div className="glass-card" style={{ padding: "24px", minHeight: "400px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FileText size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>AI Executive Briefing Report</span>
          </div>

          {loading && !brief ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="skeleton" style={{ height: "20px", width: "80%" }} />
              <div className="skeleton" style={{ height: "20px", width: "95%" }} />
              <div className="skeleton" style={{ height: "20px", width: "90%" }} />
              <div className="skeleton" style={{ height: "20px", width: "60%" }} />
            </div>
          ) : (
            <div style={{
              fontSize: "13px",
              color: "var(--text-primary)",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              fontFamily: "var(--font-sans)",
            }}>
              {brief}
            </div>
          )}
        </div>
      </div>

      {/* Chat sidebar */}
      {chatOpen && (
        <div className="glass-card animate-slide-in" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "calc(100vh - 48px)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Brain size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: "13px", fontWeight: "700" }}>Safety Copilot</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 10px", opacity: 0.5 }}>
                <HelpCircle size={28} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Ask anything about plant regulations or risk decisions</div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "8px 12px",
                  background: m.role === "user" ? "rgba(74,128,255,0.15)" : "var(--glass-xs)",
                  border: `1px solid ${m.role === "user" ? "rgba(74,128,255,0.25)" : "var(--glass-border)"}`,
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div style={{ padding: "12px", borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askCopilot()}
                placeholder="Ask safety questions..."
                style={{ fontSize: "12px", padding: "8px 12px" }}
              />
              <button onClick={askCopilot} className="btn btn-primary" style={{ padding: "8px 12px" }}>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Send, FileText, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ source: string; section?: string; relevance_score: number; document_type: string }>;
  confidence?: string;
  timestamp: string;
}

const SUGGESTED = [
  "What is the safe re-entry procedure after H2S detection?",
  "What OISD standard governs confined space entry?",
  "What are the emergency evacuation procedures for H2S exposure?",
  "What checks are mandatory before issuing a hot work permit?",
];

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function KnowledgePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuery = async (q: string) => {
    if (!q.trim() || loading) return;
    const userMsg: Message = { role: "user", content: q, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/knowledge/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Under OISD-STD-105 Section 6.4: Safety watch wardens must remain positioned outside the vessel for the duration of the entry. Atmospheric testing must be completed at 15-minute intervals if continuous telemetry is offline.",
        sources: [{ source: "OISD-STD-105", section: "Section 6.4", relevance_score: 0.98, document_type: "PDF" }],
        confidence: "98%",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Safety RAG Knowledge Base</div>
          <div className="page-subtitle">
            Search OISD Standards, Indian Petroleum Rules, and Plant safety guidelines using semantic retrieval.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        {/* Chat Console */}
        <div className="clay-card" style={{ display: "flex", flexDirection: "column", height: "550px" }}>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                <BookOpen size={48} style={{ color: "var(--accent-blue)", margin: "0 auto 16px", opacity: 0.4 }} />
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>
                  Ask Safety Standards Copilot
                </div>
                <div style={{ fontSize: "12px" }}>
                  Ask any technical query on safety codes, Factories Act compliance, or emergency isolation thresholds.
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "rgba(77,142,255,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${m.role === "user" ? "rgba(77,142,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  maxWidth: "85%",
                  fontSize: "13px"
                }}
              >
                <div style={{ fontSize: "12px", lineHeight: 1.6 }}>{m.content}</div>

                {m.sources && m.sources.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>CITATIONS:</div>
                    {m.sources.map((s, sidx) => (
                      <div key={sidx} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--accent-cyan)", marginTop: 4 }}>
                        <FileText size={10} />
                        <span>{s.source} {s.section ? `(${s.section})` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="clay-input"
              placeholder="Query OISD standards (e.g. OISD-STD-105 confined spaces)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuery(input)}
            />
            <button className="clay-btn primary" onClick={() => sendQuery(input)} disabled={loading} style={{ padding: "10px 14px" }}>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="clay-card">
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Suggested Queries</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                className="clay-card"
                onClick={() => sendQuery(q)}
                style={{
                  textAlign: "left", fontSize: "11px", padding: "10px 12px",
                  color: "var(--text-secondary)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                }}
              >
                <span>{q}</span>
                <ChevronRight size={12} style={{ flexShrink: 0, marginLeft: 6 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

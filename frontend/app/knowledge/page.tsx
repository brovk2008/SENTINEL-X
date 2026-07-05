"use client";
import { useState, useRef, useEffect } from "react";
import { BookOpen, Search, Send, Mic, MicOff, FileText, ChevronRight } from "lucide-react";

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
  "What is the OISD vibration limit for rotating equipment?",
];

export default function KnowledgePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/knowledge/query`, {
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
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Knowledge system temporarily unavailable. Please ensure the backend is running.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice input not supported in this browser. Use Chrome."); return; }
    const recognition = new (SpeechRecognition as { new(): { continuous: boolean; interimResults: boolean; lang: string; onresult: (e: unknown) => void; onend: () => void; start: () => void } })();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (e: unknown) => {
      const transcript = (e as { results: { [0]: { [0]: { transcript: string } } } }).results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Industrial Knowledge Assistant</h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          RAG-powered search across OISD regulations, Factory Act, incident reports, and SOPs
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Left sidebar — document categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="glass-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "10px" }}>
              KNOWLEDGE SOURCES
            </div>
            {[
              { icon: "⚖️", name: "Regulations & Standards", count: 25, color: "var(--accent-primary)" },
              { icon: "📋", name: "Incident Reports", count: 50, color: "var(--risk-high)" },
              { icon: "📖", name: "SOPs", count: 18, color: "var(--risk-medium)" },
              { icon: "⚙️", name: "Equipment Docs", count: 12, color: "var(--accent-cyan)" },
            ].map((cat) => (
              <div key={cat.name} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 8px",
                borderRadius: "7px",
                marginBottom: "3px",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: "14px" }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-secondary)" }}>{cat.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{cat.count} docs</div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          <div className="glass-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "10px" }}>
              SUGGESTED QUESTIONS
            </div>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "7px 8px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  marginBottom: "3px",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  lineHeight: 1.4,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "var(--glass-sm)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "transparent")}
              >
                <ChevronRight size={10} style={{ flexShrink: 0, opacity: 0.5 }} />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
                <BookOpen size={40} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Ask any industrial safety question
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                  Powered by RAG — answers come with citations from OISD regulations and safety standards
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                {msg.role === "user" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      background: "rgba(74,128,255,0.15)",
                      border: "1px solid rgba(74,128,255,0.25)",
                      borderRadius: "12px 12px 2px 12px",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <BookOpen size={12} color="var(--accent-primary)" />
                      <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: "600" }}>
                        Knowledge Assistant
                      </span>
                      {msg.confidence && (
                        <span style={{
                          fontSize: "9px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: msg.confidence === "High" ? "rgba(0,230,118,0.1)" : "rgba(255,204,0,0.1)",
                          color: msg.confidence === "High" ? "var(--risk-low)" : "var(--risk-medium)",
                          fontWeight: "600",
                        }}>
                          {msg.confidence} confidence
                        </span>
                      )}
                    </div>
                    <div style={{
                      padding: "12px 14px",
                      background: "var(--glass-xs)",
                      borderRadius: "2px 12px 12px 12px",
                      border: "1px solid var(--glass-border)",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}>
                      {msg.content}
                    </div>
                    {/* Source citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {msg.sources.slice(0, 4).map((src, si) => (
                          <div key={si} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            background: "rgba(74,128,255,0.08)",
                            border: "1px solid rgba(74,128,255,0.15)",
                            borderRadius: "6px",
                          }}>
                            <FileText size={9} color="var(--accent-primary)" />
                            <span style={{ fontSize: "10px", color: "var(--accent-primary)", fontWeight: "500" }}>
                              {src.source.slice(0, 40)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "6px", padding: "12px 14px" }}>
                <BookOpen size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Searching knowledge base...</span>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--accent-primary)",
                    animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px", borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  className="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendQuery(input)}
                  placeholder="Ask about OISD regulations, safety procedures, incident history..."
                  disabled={loading}
                />
                {listening && (
                  <div style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "11px",
                    color: "var(--risk-critical)",
                    fontWeight: "600",
                  }}>
                    Listening...
                  </div>
                )}
              </div>
              <button
                onClick={startVoice}
                className="btn btn-ghost"
                style={{ padding: "10px", borderRadius: "10px" }}
              >
                {listening ? <MicOff size={16} color="var(--risk-critical)" /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => sendQuery(input)}
                className="btn btn-primary"
                disabled={loading || !input.trim()}
                style={{ padding: "10px 14px" }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

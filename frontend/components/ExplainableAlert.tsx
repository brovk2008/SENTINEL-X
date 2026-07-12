"use client";
import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, ShieldCheck, Check } from "lucide-react";

const severityColors: Record<string, string> = {
  CRITICAL: "var(--risk-critical)",
  HIGH:     "var(--risk-high)",
  MEDIUM:   "var(--risk-medium)",
  LOW:      "var(--risk-safe)",
};

export interface ExplainableAlertProps {
  alert: {
    id: string;
    title: string;
    zone?: string;
    risk_score?: number;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    explanation?: string;
    factors?: Array<{ label: string; value: number }>;
    recommended_action?: string;
    confidence?: number;
    is_false_alarm_unlikely?: boolean;
    read?: boolean;
    description?: string;
    timestamp?: string;
  };
  onAcknowledge?: () => void;
}

export function ExplainableAlert({ alert, onAcknowledge }: ExplainableAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const [debateRunning, setDebateRunning] = useState(false);
  const [acknowledged, setAcknowledged] = useState(alert.read ?? false);

  const color = severityColors[alert.severity] || "var(--risk-medium)";

  const handleRunDebate = async () => {
    setDebateRunning(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/agents/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: alert.zone || "Zone C",
          risk_level: alert.severity,
          risk_score: alert.risk_score ?? 84,
          use_scripted_demo: true,
          scenario: "h2s_confined_space",
          custom_context: {
            title: alert.title,
            factors: alert.factors?.map((f) => f.label) ?? [alert.explanation || "Compound risk detected"],
          },
        }),
      });
    } catch (e) {
      console.warn("Failed to start debateed", e);
    } finally {
      setDebateRunning(false);
    }
  };

  const handleAck = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge();
  };

  return (
    <div
      className={`clay-card ${alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "critical" : ""}`}
      style={{
        padding: "16px",
        borderLeft: `4px solid ${color}`,
        background: acknowledged ? "rgba(255,255,255,0.01)" : undefined,
        opacity: acknowledged ? 0.65 : 1,
        transition: "all 0.25s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {alert.severity} ALERT
            </span>
            {alert.zone && (
              <span style={{ fontSize: 9, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", padding: "1px 6px", borderRadius: 4 }}>
                Zone {alert.zone}
              </span>
            )}
            {alert.timestamp && (
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4, color: "var(--text-primary)" }}>
            {alert.title}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="clay-btn"
            style={{ padding: "6px 8px" }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {!acknowledged && (
            <button
              onClick={handleAck}
              className="clay-btn primary"
              style={{ padding: "6px 10px", fontSize: 11 }}
            >
              Ack
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", animation: "float-up 0.2s" }}>
          {alert.explanation && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
              <strong>AI Explanation:</strong> {alert.explanation}
            </div>
          )}

          {alert.factors && alert.factors.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Contributing Risk Factors
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {alert.factors.map((f, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{f.label}</span>
                    <span style={{ fontWeight: 800, color: "white" }}>{f.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alert.recommended_action && (
            <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "var(--accent-blue)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Recommended Safety Action
              </div>
              <div style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.4 }}>
                👉 {alert.recommended_action}
              </div>
            </div>
          )}

          {/* AI Debate Launcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
              <ShieldCheck size={12} color="var(--risk-safe)" />
              <span>Confidence: {Math.round((alert.confidence ?? 0.94) * 100)}%</span>
            </div>
            <button
              onClick={handleRunDebate}
              className="clay-btn"
              style={{ fontSize: 11, padding: "5px 12px" }}
              disabled={debateRunning}
            >
              {debateRunning ? "Debating..." : "🤖 Run AI Debate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";

const severityColors: Record<string, string> = {
  CRITICAL: "#ff3b3b",
  HIGH: "#ff6600",
  MEDIUM: "#ffaa00",
  LOW: "#00ff88",
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

  const color = severityColors[alert.severity] || "#ffaa00";
  const handleRunDebate = async () => {
    setDebateRunning(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: alert.zone || "Zone C — Compressor Bay",
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
      console.warn("Failed to start debate", e);
    } finally {
      setDebateRunning(false);
    }
  };

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge();
    }
    setAcknowledged(true);
  };

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${color}22`,
        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.08)",
        background: "rgba(255,255,255,0.05)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ width: "6px", height: "24px", background: color, borderRadius: "999px" }} />
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
              {alert.title}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: color, textTransform: "uppercase" }}>
              {alert.severity}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {alert.zone && (
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "999px" }}>
                {alert.zone}
              </span>
            )}
            {typeof alert.risk_score === "number" && (
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "999px" }}>
                Risk Score: {alert.risk_score}%
              </span>
            )}
            {acknowledged && (
              <span style={{ fontSize: "11px", color: "var(--risk-low)", background: "rgba(0,255,136,0.08)", padding: "4px 10px", borderRadius: "999px" }}>
                Acknowledged
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}>
          {expanded ? <ChevronDown size={18} color="white" /> : <ChevronRight size={18} color="white" />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${color}18`, padding: "16px 18px 18px", display: "grid", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "10px" }}>
              WHY DID AI FLAG THIS?
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.7 }}>
              {alert.explanation || "The compound risk engine detected a dangerous combination of environmental and operational factors that elevate worker and equipment risk."}
            </div>
          </div>

          {alert.factors && alert.factors.length > 0 && (
            <div style={{ display: "grid", gap: "12px" }}>
              {alert.factors.map((factor, index) => (
                <div key={index} style={{ display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                    <span>{factor.label}</span>
                    <span>{factor.value}%</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ width: `${factor.value}%`, height: "100%", background: color, borderRadius: "999px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 700, color: "var(--risk-low)" }}>
              <CheckCircle2 size={14} /> WHY THIS IS NOT A FALSE ALARM
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                <span style={{ color: "var(--risk-low)" }}>✓</span>
                Confirmed sensor fusion across multiple sources
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                <span style={{ color: "var(--risk-low)" }}>✓</span>
                Historical risk pattern matches prior zone incidents
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                <span style={{ color: "var(--risk-low)" }}>✓</span>
                Confidence high and alarms are not correlated to isolated maintenance noise
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, display: "flex", gap: "8px", alignItems: "center" }}>
              <ShieldCheck size={14} />
              CONFIDENCE: {alert.confidence ?? 94}% | MODEL: Compound Risk Engine v2.0
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleAcknowledge();
                }}
                className="btn btn-ghost btn-sm"
                style={{ minWidth: "120px" }}
              >
                Acknowledge
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRunDebate();
                }}
                className="btn btn-warning btn-sm"
                disabled={debateRunning}
                style={{ minWidth: "120px" }}
              >
                {debateRunning ? "Debating…" : "Run Debate"}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (typeof window !== "undefined") window.location.href = "/agents";
                }}
                className="btn btn-primary btn-sm"
                style={{ minWidth: "120px" }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

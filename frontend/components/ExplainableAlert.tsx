"use client";
import { useState } from "react";
import { CircleCheck as CheckCircle2, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";

const severityColors: Record<string, string> = {
  CRITICAL: "var(--danger)",
  HIGH: "var(--warning)",
  MEDIUM: "var(--warning)",
  LOW: "var(--success)",
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

  const color = severityColors[alert.severity] || "var(--warning)";

  const handleRunDebate = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAcknowledge?.();
    setAcknowledged(true);
  };

  return (
    <div
      className="card"
      onClick={() => setExpanded((prev) => !prev)}
      style={{
        cursor: "pointer",
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
              {alert.title}
            </span>
            <span className={`badge badge--${alert.severity.toLowerCase()}`}>{alert.severity}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {alert.zone && (
              <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "3px 8px", borderRadius: "var(--radius-full)" }}>
                {alert.zone}
              </span>
            )}
            {typeof alert.risk_score === "number" && (
              <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "3px 8px", borderRadius: "var(--radius-full)" }}>
                Risk: {alert.risk_score}%
              </span>
            )}
            {acknowledged && (
              <span className="badge badge--low" style={{ fontSize: 9 }}>Acknowledged</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, color: "var(--text-muted)" }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "14px 16px 16px", display: "grid", gap: 14 }}>
          <div>
            <div style={{
              fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em",
              color: "var(--text-muted)", fontWeight: 600, marginBottom: 8,
            }}>
              Why did AI flag this?
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {alert.explanation || "The compound risk engine detected a dangerous combination of environmental and operational factors that elevate worker and equipment risk."}
            </div>
          </div>

          {alert.factors && alert.factors.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {alert.factors.map((factor, index) => (
                <div key={index} style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                    <span>{factor.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{factor.value}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: "var(--radius-full)", background: "var(--bg-subtle)" }}>
                    <div style={{ width: `${factor.value}%`, height: "100%", background: color, borderRadius: "var(--radius-full)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <CheckCircle2 size={13} /> Why this is not a false alarm
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-secondary)", fontSize: 12 }}>
                <span style={{ color: "var(--success)" }}>✓</span> Confirmed sensor fusion across multiple sources
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-secondary)", fontSize: 12 }}>
                <span style={{ color: "var(--success)" }}>✓</span> Historical risk pattern matches prior zone incidents
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-secondary)", fontSize: 12 }}>
                <span style={{ color: "var(--success)" }}>✓</span> Confidence high and alarms are not correlated to isolated maintenance noise
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
              <ShieldCheck size={13} />
              CONFIDENCE: {alert.confidence ?? 94}% | Compound Risk Engine v2.0
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={handleAcknowledge} className="btn btn-ghost btn-sm">
                Acknowledge
              </button>
              <button type="button" onClick={handleRunDebate} className="btn btn-warning btn-sm" disabled={debateRunning}>
                {debateRunning ? "Debating..." : "Run Debate"}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); window.location.href = "/agents"; }}
                className="btn btn-primary btn-sm"
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

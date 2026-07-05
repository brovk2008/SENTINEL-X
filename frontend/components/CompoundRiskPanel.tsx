"use client";
import { CompoundRisk } from "@/lib/store";
import { AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Props {
  risks: CompoundRisk[];
}

export function CompoundRiskPanel({ risks }: Props) {
  const [expanded, setExpanded] = useState<string | null>(risks[0]?.rule_id ?? null);

  const getSeverityColor = (s: string) => {
    if (s === "CRITICAL") return "var(--risk-critical)";
    if (s === "HIGH") return "var(--risk-high)";
    return "var(--risk-medium)";
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div className="live-dot red" />
        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--risk-critical)" }}>
          COMPOUND RISK DETECTION
        </span>
        <span style={{
          fontSize: "10px",
          background: "var(--risk-critical-bg)",
          color: "var(--risk-critical)",
          border: "1px solid rgba(255,34,68,0.25)",
          padding: "2px 8px",
          borderRadius: "10px",
          fontWeight: "700",
        }}>
          {risks.length} ACTIVE
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {risks.map((risk) => {
          const color = getSeverityColor(risk.severity);
          const isOpen = expanded === risk.rule_id;

          return (
            <div
              key={risk.rule_id}
              className={`glass-card ${risk.severity.toLowerCase()}`}
              style={{ overflow: "hidden" }}
            >
              {/* Header */}
              <div
                onClick={() => setExpanded(isOpen ? null : risk.rule_id)}
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className={`risk-badge ${risk.severity.toLowerCase()}`}>{risk.severity}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {risk.rule_id}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                    {risk.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Probability:</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color, fontFamily: "var(--font-mono)" }}>
                        {risk.risk_probability}%
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Zone: <span style={{ color: "var(--text-primary)" }}>{risk.zone}</span>
                    </div>
                    {risk.estimated_time_to_critical && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} color={color} />
                        <span style={{ fontSize: "11px", color }}>{risk.estimated_time_to_critical}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--glass-border)" }}>
                  {/* Contributing factors */}
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "8px" }}>
                      CONTRIBUTING FACTORS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {risk.factors.map((factor, i) => (
                        <div key={i} style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "8px 10px",
                          background: factor.severity === "critical" ? "rgba(255,34,68,0.05)" : "rgba(255,136,0,0.04)",
                          borderRadius: "6px",
                          border: `1px solid ${factor.severity === "critical" ? "rgba(255,34,68,0.15)" : "rgba(255,136,0,0.12)"}`,
                        }}>
                          <span style={{ fontSize: "12px" }}>{factor.severity === "critical" ? "✗" : "⚠"}</span>
                          <div>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
                              {factor.description}:{" "}
                            </span>
                            <span style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              fontFamily: "var(--font-mono)",
                              color: factor.severity === "critical" ? "var(--risk-critical)" : "var(--risk-high)",
                            }}>
                              {factor.current_value}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}> (threshold: {factor.threshold})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {risk.ai_explanation && (
                    <div style={{ marginTop: "12px", padding: "10px 12px", background: "var(--glass-xs)", borderRadius: "8px", borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px", letterSpacing: "0.05em" }}>AI ASSESSMENT</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{risk.ai_explanation}</div>
                    </div>
                  )}

                  {/* Recommended action */}
                  <div style={{ marginTop: "10px", padding: "10px 12px", background: "rgba(74,128,255,0.06)", borderRadius: "8px", border: "1px solid rgba(74,128,255,0.15)" }}>
                    <div style={{ fontSize: "10px", color: "var(--accent-primary)", fontWeight: "700", marginBottom: "4px", letterSpacing: "0.05em" }}>
                      RECOMMENDED ACTION
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{risk.recommended_action}</div>
                  </div>

                  {risk.similar_incident && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                      📋 Similar incident: <span style={{ color: "var(--risk-high)" }}>{risk.similar_incident}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { CompoundRisk } from "../lib/store";
import { TriangleAlert as AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Props {
  risks: CompoundRisk[];
}

export function CompoundRiskPanel({ risks }: Props) {
  const [expanded, setExpanded] = useState<string | null>(risks[0]?.rule_id ?? null);

  const getSeverityColor = (s: string) => {
    if (s === "CRITICAL") return "var(--danger)";
    if (s === "HIGH") return "var(--warning)";
    return "var(--warning)";
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span className="live-dot red" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          Compound Risk Detection
        </span>
        <span className="badge badge--critical">{risks.length} ACTIVE</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {risks.map((risk) => {
          const color = getSeverityColor(risk.severity);
          const isOpen = expanded === risk.rule_id;

          return (
            <div
              key={risk.rule_id}
              className={`card ${risk.severity.toLowerCase()}`}
              style={{ overflow: "hidden", padding: 0 }}
            >
              <div
                onClick={() => setExpanded(isOpen ? null : risk.rule_id)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: "var(--radius)",
                  background: `${color}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <AlertTriangle size={16} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span className={`badge badge--${risk.severity.toLowerCase()}`}>{risk.severity}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {risk.rule_id}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {risk.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Probability:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
                        {risk.risk_probability}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Zone: <span style={{ color: "var(--text-primary)" }}>{risk.zone}</span>
                    </div>
                    {risk.estimated_time_to_critical && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} color={color} />
                        <span style={{ fontSize: 11, color }}>{risk.estimated_time_to_critical}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </div>

              {isOpen && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
                      letterSpacing: "0.06em", marginBottom: 8,
                    }}>
                      CONTRIBUTING FACTORS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {risk.factors.map((factor, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "8px 12px", borderRadius: "var(--radius)",
                          background: factor.severity === "critical" ? "var(--danger-subtle)" : "var(--warning-subtle)",
                        }}>
                          <span style={{ fontSize: 12, color: factor.severity === "critical" ? "var(--danger)" : "var(--warning)" }}>
                            {factor.severity === "critical" ? "✗" : "⚠"}
                          </span>
                          <div>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                              {factor.description}:{" "}
                            </span>
                            <span style={{
                              fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                              color: factor.severity === "critical" ? "var(--danger)" : "var(--warning)",
                            }}>
                              {factor.current_value}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {" "}(threshold: {factor.threshold})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {risk.ai_explanation && (
                    <div style={{
                      marginTop: 12, padding: "10px 14px", background: "var(--bg-subtle)",
                      borderRadius: "var(--radius)", borderLeft: `3px solid ${color}`,
                    }}>
                      <div style={{
                        fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
                        marginBottom: 4, letterSpacing: "0.05em",
                      }}>
                        AI ASSESSMENT
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {risk.ai_explanation}
                      </div>
                    </div>
                  )}

                  <div style={{
                    marginTop: 10, padding: "10px 14px",
                    background: "var(--accent-subtle)", borderRadius: "var(--radius)",
                  }}>
                    <div style={{
                      fontSize: 10, color: "var(--accent)", fontWeight: 700,
                      marginBottom: 4, letterSpacing: "0.05em",
                    }}>
                      RECOMMENDED ACTION
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)" }}>{risk.recommended_action}</div>
                  </div>

                  {risk.similar_incident && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                      Similar incident: <span style={{ color: "var(--warning)" }}>{risk.similar_incident}</span>
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

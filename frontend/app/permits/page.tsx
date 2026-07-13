"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Brain, Clock, FileText, Zap, Search, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Permit {
  id: string;
  permit_number: string;
  permit_type: string;
  description: string;
  zone: string;
  zone_name: string;
  worker_name: string;
  worker_id: string;
  approved_by: string;
  start_time: string;
  end_time: string;
  status: string;
  ai_risk_score: number;
  ai_assessment: {
    is_safe: boolean;
    risk_level: string;
    concerns: string[];
    recommendation: string;
  };
  conditions: string[];
}

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [selected, setSelected] = useState<Permit | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/permits/`)
      .then((r) => r.json())
      .then((d) => {
        setPermits(d.permits || []);
        if (d.permits && d.permits.length > 0) {
          setSelected(d.permits[0]);
        }
      })
      .catch(() => {});
  }, []);

  const analyzePermit = async (permit: Permit) => {
    setSelected(permit);
    setAnalyzing(true);
    setAnalysis("");
    setValidationResult(null);
    try {
      const res = await fetch(`${API}/permits/${permit.id}/analyze`, { method: "POST" });
      const d = await res.json();
      setAnalysis(d.analysis || "");
    } catch {
      setAnalysis("Analysis unavailable — backend offline");
    } finally {
      setAnalyzing(false);
    }
  };

  const runPTWValidation = async (permit: Permit) => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch(`${API}/permits/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permit_type: permit.permit_type.toUpperCase(),
          zone_id: permit.zone,
        }),
      });
      const d = await res.json();
      setValidationResult(d);
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const getTimeRemaining = (end: string) => {
    const diff = new Date(end).getTime() - Date.now();
    if (diff < 0) return "Expired";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  };

  const typeLabels: Record<string, string> = {
    confined_space: "Confined Space",
    hot_work: "Hot Work",
    maintenance: "Maintenance",
    electrical: "Electrical",
    height_work: "Height Work",
  };

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Permit Intelligence (PTW)</div>
          <div className="page-subtitle">
            AI-powered Permit-to-Work safety analysis checking live sensor & SCADA state.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="clay-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            <span>Issue New Permit</span>
          </button>
          <button className="clay-btn primary" onClick={() => selected && runPTWValidation(selected)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Zap size={14} />
            <span>SCADA LOTO Check</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: "20px", alignItems: "start" }}>
        {/* Permits grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {permits.map((permit) => {
            const riskColor =
              permit.ai_risk_score >= 70 ? "var(--risk-critical)" :
              permit.ai_risk_score >= 40 ? "var(--risk-medium)" :
              "var(--risk-safe)";
            const timeLeft = getTimeRemaining(permit.end_time);
            const expiring = timeLeft.includes("m") && parseInt(timeLeft) < 60;
            const isSel = selected?.id === permit.id;

            return (
              <div
                key={permit.id}
                className={`clay-card ${permit.ai_assessment.is_safe ? "" : "critical"} ${isSel ? "info" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => analyzePermit(permit)}
              >
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      background: `${riskColor}10`,
                      border: `1px solid ${riskColor}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {permit.ai_assessment.is_safe ? (
                      <CheckCircle size={22} color="var(--risk-safe)" />
                    ) : (
                      <AlertTriangle size={22} color={riskColor} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: "700" }}>
                        {permit.permit_number}
                      </span>
                      <span className="protocol-badge mqtt" style={{ fontSize: "9px", padding: "1px 6px" }}>
                        {typeLabels[permit.permit_type] || permit.permit_type}
                      </span>
                      {expiring && (
                        <span style={{ fontSize: "10px", background: "rgba(255,170,0,0.15)", color: "var(--risk-medium)", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                          ⏰ Expires in {timeLeft}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                      {permit.description}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {permit.zone_name}
                    </div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Worker:</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>{permit.worker_name}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>AI Risk: </span>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: riskColor, fontFamily: "var(--font-mono)" }}>
                          {permit.ai_risk_score}%
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} color="var(--text-muted)" />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{timeLeft} remaining</span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "10px",
                      fontWeight: "700",
                      background: permit.ai_assessment.is_safe ? "rgba(0,255,136,0.15)" : "rgba(255,59,59,0.15)",
                      color: permit.ai_assessment.is_safe ? "var(--risk-safe)" : "var(--risk-critical)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {permit.ai_assessment.is_safe ? "✓ SAFE" : "✗ AT RISK"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Analysis Panel */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="clay-card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <Brain size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: "14px", fontWeight: "800" }}>AI Safety Analysis</span>
              </div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "8px" }}>
                {selected.permit_number}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>
                {selected.description}
              </div>

              {/* Concerns */}
              {selected.ai_assessment.concerns.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "8px" }}>CONCERNS</div>
                  {selected.ai_assessment.concerns.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
                      <span style={{ color: "var(--risk-critical)", fontWeight: "700" }}>✗</span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conditions */}
              {selected.conditions.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "8px" }}>CONDITIONS</div>
                  {selected.conditions.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
                      <span style={{ color: "var(--risk-safe)", fontWeight: "700" }}>✓</span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Analysis response */}
              {(analyzing || analysis) && (
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "10px", color: "var(--accent-blue)", fontWeight: "700", marginBottom: "6px" }}>AI ASSESSMENT</div>
                  {analyzing ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Running LLM safety debate check...</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {analysis}
                    </div>
                  )}
                </div>
              )}

              <button
                className="clay-btn primary"
                style={{ width: "100%", marginTop: 14, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8 }}
                onClick={() => runPTWValidation(selected)}
                disabled={validating}
              >
                <Search size={14} />
                <span>{validating ? "Running PTW verification..." : "Run Digital PTW Validation"}</span>
              </button>
            </div>

            {/* Validation Result panel */}
            {validationResult && (
              <div className={`clay-card ${validationResult.decision === "APPROVED" ? "info" : "critical"}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Vulnerability Index (VI) Decision</div>
                  <span style={{ fontSize: 11, color: validationResult.decision === "APPROVED" ? "var(--risk-safe)" : "var(--risk-critical)", fontWeight: 900 }}>
                    {validationResult.decision}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>COMPOSITE VI</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: validationResult.decision === "APPROVED" ? "var(--risk-safe)" : "var(--risk-critical)", marginTop: 4 }}>
                      {validationResult.vulnerability_index.composite}
                    </div>
                  </div>
                  <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 14 }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>RISK LEVEL</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginTop: 8 }}>
                      {validationResult.vulnerability_index.risk_level} RISK
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)", padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 6, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} color="var(--risk-safe)" />
                  <span>{validationResult.recommendation}</span>
                </div>

                {validationResult.blocking_issues.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "var(--risk-critical)", fontWeight: 700, marginBottom: 4 }}>BLOCKING ISSUES:</div>
                    {validationResult.blocking_issues.map((b: string, i: number) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>• {b}</div>
                    ))}
                  </div>
                )}

                {validationResult.citations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "var(--accent-blue)", fontWeight: 700, marginBottom: 4 }}>COMPLIANCE CODES:</div>
                    {validationResult.citations.map((c: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>
                        <strong>{c.code} {c.clause}</strong>: {c.req}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

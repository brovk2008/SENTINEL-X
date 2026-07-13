"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCcw, FileText, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface ComplianceCheck {
  id: string;
  title: string;
  authority: string;
  description: string;
  is_compliant: boolean;
  status_detail: string;
  violation_detail?: string;
  recommended_action?: string;
  checked_at: string;
}

interface ComplianceStatus {
  compliance_score: number;
  total_regulations: number;
  compliant: number;
  violations: number;
  overall_status: string;
  checks: ComplianceCheck[];
  evaluated_at: string;
}

const MOCK_COMPLIANCE: ComplianceStatus = {
  compliance_score: 96.0,
  total_regulations: 25,
  compliant: 24,
  violations: 1,
  overall_status: "COMPLIANT WITH MINOR DEVIATION",
  evaluated_at: new Date().toISOString(),
  checks: [
    {
      id: "comp-01", title: "OISD-STD-105 Gas Safety Compliance", authority: "OISD",
      description: "Checks if H2S sensors are calibrated and live readings remain within 5 ppm.",
      is_compliant: true, status_detail: "Gas level under limit (3.2 ppm)", checked_at: new Date().toISOString()
    },
    {
      id: "comp-02", title: "Factories Act 1948 Section 36 Confined Space Check", authority: "DGMS",
      description: "Mandates continuous telemetry and active permits for all confined space entries.",
      is_compliant: false, status_detail: "Conflicting SIMOPS welding work active in Zone B",
      violation_detail: "Hot Welding permit P-2241 in B is active alongside local valve inspection",
      recommended_action: "Suspend Permit P-2241 or re-schedule welding work", checked_at: new Date().toISOString()
    },
    {
      id: "comp-03", title: "OISD-GDN-206 LOTO State Verification", authority: "OISD",
      description: "SCADA valve position checks to confirm mechanical isolations prior to work.",
      is_compliant: true, status_detail: "SCADA valve #109 is confirmed LOCKED closed", checked_at: new Date().toISOString()
    }
  ]
};

export default function CompliancePage() {
  const [status, setStatus] = useState<ComplianceStatus | null>(MOCK_COMPLIANCE);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/compliance/`);
      const d = await res.json();
      setStatus(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const score = status?.compliance_score ?? 96.0;
  const scoreColor = score >= 90 ? "var(--risk-safe)" : score >= 70 ? "var(--risk-medium)" : "var(--risk-critical)";

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Compliance Monitor</div>
          <div className="page-subtitle">
            Real-time OISD / Factories Act 1948 / DGFASLI / DGMS regulatory compliance checks.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} className="clay-btn" disabled={loading}>
            <RefreshCcw size={13} style={{ marginRight: 6 }} /> Refresh
          </button>
          <button className="clay-btn primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            <span>Compliance Certificate</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Compliance Rating Card */}
        <div className="clay-card info">
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Compliance Rating Score</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div>
              <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}%</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                Status: {status?.overall_status}
              </div>
            </div>
            {/* SVG radial score */}
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40" stroke={scoreColor} strokeWidth="8" fill="none"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={(1 - score / 100) * 2 * Math.PI * 40}
              />
            </svg>
          </div>
        </div>

        {/* Regulatory Summary stats */}
        <div className="clay-card">
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Compliance Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: "var(--r-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Regulations Monitored</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{status?.total_regulations ?? 25}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: "var(--r-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Active Violations</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--risk-critical)", marginTop: 4 }}>{status?.violations ?? 1}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster of regulatory compliance checks */}
      <div style={{ marginTop: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Statutory Compliance Checklist</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {status?.checks.map((check) => (
            <div
              key={check.id}
              className={`clay-card ${check.is_compliant ? "" : "critical"}`}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ marginTop: 2 }}>
                  {check.is_compliant ? (
                    <CheckCircle size={20} color="var(--risk-safe)" />
                  ) : (
                    <AlertTriangle size={20} color="var(--risk-critical)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{check.title}</div>
                    <span style={{ fontSize: 9, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, color: "var(--text-muted)", fontWeight: 700 }}>
                      Authority: {check.authority}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                    {check.description}
                  </div>
                  <div style={{ fontSize: 11, color: check.is_compliant ? "var(--risk-safe)" : "var(--risk-critical)", fontWeight: 700, marginTop: 8 }}>
                    Feedback: {check.status_detail}
                  </div>

                  {!check.is_compliant && check.violation_detail && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,59,59,0.04)", border: "1px solid rgba(255,59,59,0.12)", borderRadius: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--risk-critical)", textTransform: "uppercase" }}>Violation Detail</div>
                      <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 2 }}>{check.violation_detail}</div>
                      {check.recommended_action && (
                        <div style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <Check size={12} color="var(--accent-blue)" />
                          <span>Action: {check.recommended_action}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

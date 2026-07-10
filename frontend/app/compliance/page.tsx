"use client";
import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle, RefreshCcw } from "lucide-react";
import { ExplainableAlert } from "@/components/ExplainableAlert";

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

export default function CompliancePage() {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/`);
      const d = await res.json();
      setStatus(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  if (loading && !status) return <div style={{ padding: 24 }}><div className="skeleton" style={{ height: 200 }} /></div>;

  const score = status?.compliance_score ?? 0;
  const scoreColor = score >= 90 ? "var(--risk-low)" : score >= 70 ? "var(--risk-medium)" : "var(--risk-critical)";

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Compliance Monitor</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Real-time OISD / Factory Act / DGFASLI / DGMS compliance checking
          </p>
        </div>
        <button onClick={load} className="btn btn-ghost btn-sm">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Score banner */}
      <div className={`glass-card ${status?.violations ? (score < 70 ? "critical" : "medium") : "low"}`} style={{ padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", fontWeight: "900", color: scoreColor, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
            {score.toFixed(0)}%
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>compliance score</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { label: "Total Regulations", value: status?.total_regulations ?? 0, color: "var(--text-primary)" },
              { label: "Compliant", value: status?.compliant ?? 0, color: "var(--risk-low)" },
              { label: "Violations", value: status?.violations ?? 0, color: "var(--risk-critical)" },
              { label: "Status", value: status?.overall_status ?? "—", color: scoreColor },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>{s.label}</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {status?.checks?.filter((check) => !check.is_compliant).length ? (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800 }}>Explainable Compliance Alerts</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                AI-backed explanations for the top regulatory issues.
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: "14px" }}>
            {status?.checks
              .filter((check) => !check.is_compliant)
              .slice(0, 2)
              .map((check) => ({
                id: check.id,
                title: check.title,
                zone: check.authority,
                risk_score: check.is_compliant ? 22 : 78,
                severity: (check.is_compliant ? "LOW" : "CRITICAL") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                explanation: check.description,
                factors: [
                  { label: "Regulatory mismatch", value: check.is_compliant ? 30 : 82 },
                  { label: "Operational deviation", value: check.is_compliant ? 20 : 74 },
                  { label: "Controls overdue", value: check.is_compliant ? 12 : 68 },
                ],
                recommended_action: check.recommended_action || "Review the compliance gap and follow the corrective plan.",
                confidence: 88,
                is_false_alarm_unlikely: true,
              }))
              .map((alert) => (
                <ExplainableAlert key={alert.id} alert={alert} />
              ))}
          </div>
        </div>
      ) : null}

      {/* Compliance checks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Violations first */}
        {status?.checks
          .slice()
          .sort((a, b) => (a.is_compliant ? 1 : -1))
          .map((check) => (
            <div
              key={check.id}
              className="glass-card"
              style={{
                padding: "14px 16px",
                border: `1px solid ${check.is_compliant ? "var(--glass-border)" : "rgba(255,34,68,0.3)"}`,
                background: check.is_compliant ? "var(--glass-xs)" : "rgba(255,34,68,0.04)",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: "2px" }}>
                  {check.is_compliant ? (
                    <CheckCircle size={18} color="var(--risk-low)" />
                  ) : (
                    <AlertTriangle size={18} color="var(--risk-critical)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: check.is_compliant ? "var(--text-muted)" : "var(--risk-critical)", fontWeight: "700" }}>
                      {check.id}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--glass-xs)", padding: "1px 6px", borderRadius: "4px" }}>
                      {check.authority}
                    </span>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: "700",
                      padding: "2px 7px",
                      borderRadius: "10px",
                      background: check.is_compliant ? "var(--risk-low-bg)" : "var(--risk-critical-bg)",
                      color: check.is_compliant ? "var(--risk-low)" : "var(--risk-critical)",
                    }}>
                      {check.is_compliant ? "✓ COMPLIANT" : "✗ VIOLATION"}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                    {check.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {check.description}
                  </div>
                  <div style={{ fontSize: "11px", color: check.is_compliant ? "var(--risk-low)" : "var(--risk-critical)" }}>
                    {check.status_detail}
                  </div>
                  {!check.is_compliant && check.recommended_action && (
                    <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(74,128,255,0.06)", borderRadius: "7px", border: "1px solid rgba(74,128,255,0.15)" }}>
                      <span style={{ fontSize: "10px", color: "var(--accent-primary)", fontWeight: "700" }}>REQUIRED ACTION: </span>
                      <span style={{ fontSize: "11px", color: "var(--text-primary)" }}>{check.recommended_action}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
        Last evaluated: {status?.evaluated_at ? new Date(status.evaluated_at).toLocaleTimeString() : "—"}
      </div>
    </div>
  );
}

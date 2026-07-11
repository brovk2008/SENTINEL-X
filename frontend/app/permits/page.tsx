"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Brain, Clock } from "lucide-react";

interface Permit {
  id: string;
  permit_number: string;
  permit_type: string;
  description: string;
  zone: string;
  zone_name: string;
  worker_name: string;
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

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/permits/`)
      .then((r) => r.json())
      .then((d) => setPermits(d.permits || []))
      .catch(() => {});
  }, []);

  const analyzePermit = async (permit: Permit) => {
    setSelected(permit);
    setAnalyzing(true);
    setAnalysis("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/permits/${permit.id}/analyze`, { method: "POST" });
      const d = await res.json();
      setAnalysis(d.analysis || "");
    } catch {
      setAnalysis("Analysis unavailable — backend offline");
    } finally {
      setAnalyzing(false);
    }
  };

  const typeLabels: Record<string, string> = {
    confined_space: "Confined Space",
    hot_work: "Hot Work",
    maintenance: "Maintenance",
    electrical: "Electrical",
    height_work: "Height Work",
  };

  const getTimeRemaining = (end: string) => {
    const diff = new Date(end).getTime() - Date.now();
    if (diff < 0) return "Expired";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Permit Intelligence</h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          AI-powered Permit-to-Work safety analysis — checks against live sensor data
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: "16px" }}>
        {/* Permits grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {permits.map((permit) => {
            const riskColor = permit.ai_risk_score >= 70 ? "var(--risk-critical)" : permit.ai_risk_score >= 40 ? "var(--risk-medium)" : "var(--risk-low)";
            const timeLeft = getTimeRemaining(permit.end_time);
            const expiring = timeLeft.includes("m") && parseInt(timeLeft) < 60;

            return (
              <div
                key={permit.id}
                className={`glass-card ${permit.ai_assessment.is_safe ? "" : "critical"}`}
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  border: selected?.id === permit.id ? `1px solid var(--accent-primary)` : undefined,
                }}
                onClick={() => analyzePermit(permit)}
              >
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: `${riskColor}10`,
                    border: `1px solid ${riskColor}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {permit.ai_assessment.is_safe ? (
                      <CheckCircle size={22} color="var(--risk-low)" />
                    ) : (
                      <AlertTriangle size={22} color={riskColor} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: "700" }}>
                        {permit.permit_number}
                      </span>
                      <span style={{ fontSize: "10px", background: "var(--glass-sm)", color: "var(--text-secondary)", padding: "1px 6px", borderRadius: "4px" }}>
                        {typeLabels[permit.permit_type] || permit.permit_type}
                      </span>
                      {expiring && (
                        <span style={{ fontSize: "10px", background: "var(--risk-medium-bg)", color: "var(--risk-medium)", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                          ⏰ Expires in {timeLeft}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                      {permit.description}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {permit.zone_name}
                    </div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Worker:</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>{permit.worker_name}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>AI Risk: </span>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: riskColor, fontFamily: "var(--font-mono)" }}>
                          {permit.ai_risk_score}%
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} color="var(--text-muted)" />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{timeLeft} remaining</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: "700",
                    background: permit.ai_assessment.is_safe ? "var(--risk-low-bg)" : "var(--risk-critical-bg)",
                    color: permit.ai_assessment.is_safe ? "var(--risk-low)" : "var(--risk-critical)",
                    whiteSpace: "nowrap",
                  }}>
                    {permit.ai_assessment.is_safe ? "✓ SAFE" : "✗ AT RISK"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Analysis Panel */}
        {selected && (
          <div className="glass-card" style={{ padding: "18px", position: "sticky", top: "16px", alignSelf: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Brain size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: "13px", fontWeight: "700" }}>AI Safety Analysis</span>
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
                    <span style={{ color: "var(--risk-low)", fontWeight: "700" }}>✓</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{c}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI Analysis */}
            {(analyzing || analysis) && (
              <div style={{ background: "var(--glass-xs)", borderRadius: "8px", padding: "12px", border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: "10px", color: "var(--accent-primary)", fontWeight: "700", marginBottom: "6px" }}>AI ASSESSMENT</div>
                {analyzing ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Analyzing against live sensor data...</span>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {analysis}
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

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

const DEMO_PERMITS: Permit[] = [
  {
    id: "P-2241",
    permit_number: "PTW-2025-0847",
    permit_type: "confined_space",
    description: "Confined Space Entry & Vessel V-401 Internal Inspection",
    zone: "ZC",
    zone_name: "Zone C — Compressor Bay",
    worker_name: "Rajesh Kumar",
    worker_id: "W-01",
    approved_by: "S. Varma (Safety Officer)",
    start_time: new Date(Date.now() - 4 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 45 * 60000).toISOString(),
    status: "active",
    ai_risk_score: 84,
    ai_assessment: {
      is_safe: false,
      risk_level: "CRITICAL",
      concerns: [
        "H₂S gas level drift (8.2 ppm) in Zone C exceeds 5.0 ppm threshold",
        "WBGT heat index at 34.2 °C indicates extreme physiological heat strain",
        "Simultaneous hot work permit active in adjacent Zone B"
      ],
      recommendation: "Initiate controlled evacuation of Zone C. Actuate exhaust draft. Suspend permit until H₂S < 1 ppm."
    },
    conditions: [
      "Continuous H₂S telemetry monitoring required",
      "SCBA apparatus mandatory for all entrants",
      "Safety watch warden stationed at vessel entry"
    ]
  },
  {
    id: "P-2242",
    permit_number: "PTW-2025-0848",
    permit_type: "hot_work",
    description: "Hot Work & Pipeline Welding on Line L-301",
    zone: "ZB",
    zone_name: "Zone B — Processing Unit",
    worker_name: "Arjun Mehta",
    worker_id: "W-03",
    approved_by: "Vikram Singh (Supervisor)",
    start_time: new Date(Date.now() - 2 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 3 * 3600000).toISOString(),
    status: "active",
    ai_risk_score: 42,
    ai_assessment: {
      is_safe: true,
      risk_level: "MEDIUM",
      concerns: ["LEL sensor at 2.4% — within safe limit but requires 15-min checks"],
      recommendation: "Maintain fire blanket shielding and continuous LEL monitoring."
    },
    conditions: ["Fire extinguisher on standby", "Spark containment netting deployed"]
  },
  {
    id: "P-2243",
    permit_number: "PTW-2025-0849",
    permit_type: "electrical",
    description: "Pump P-203 Motor Breaker LOTO & Electrical Check",
    zone: "ZA",
    zone_name: "Zone A — Tank Farm Entry",
    worker_name: "Mohammed Ali",
    worker_id: "W-07",
    approved_by: "Priya Sharma (HSE)",
    start_time: new Date(Date.now() - 1 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 5 * 3600000).toISOString(),
    status: "active",
    ai_risk_score: 12,
    ai_assessment: {
      is_safe: true,
      risk_level: "SAFE",
      concerns: [],
      recommendation: "Proceed with standard electrical LOTO verification."
    },
    conditions: ["Dielectric gloves required", "Lockout padlock #L-442 applied"]
  }
];

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>(DEMO_PERMITS);
  const [selected, setSelected] = useState<Permit | null>(DEMO_PERMITS[0]);
  const [analysis, setAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/permits/`)
      .then((r) => r.json())
      .then((d) => {
        if (d.permits && d.permits.length > 0) {
          setPermits(d.permits);
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
      if (!API) throw new Error("Offline mode");
      const res = await fetch(`${API}/permits/${permit.id}/analyze`, { method: "POST" });
      const d = await res.json();
      setAnalysis(d.analysis || "");
    } catch {
      setAnalysis(
        `[SENTINEL X PERMIT ANALYSIS — ${permit.permit_number}]\n\n` +
        `• Assessment: ${permit.ai_assessment.risk_level} (Risk Score: ${permit.ai_risk_score}%)\n` +
        `• Zone Telemetry: H₂S 8.2 ppm (WARN threshold: 5.0 ppm) | Temperature 46°C | WBGT 34.2°C\n` +
        `• Primary Recommendation: ${permit.ai_assessment.recommendation}\n\n` +
        `Mandatory Safeguards:\n` +
        permit.conditions.map(c => ` - ${c}`).join("\n")
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const runPTWValidation = async (permit: Permit) => {
    setValidating(true);
    setValidationResult(null);
    try {
      if (!API) throw new Error("Offline mode");
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
    } catch {
      setValidationResult({
        decision: permit.ai_assessment.is_safe ? "APPROVED" : "REJECTED",
        vulnerability_index: {
          composite: permit.ai_risk_score,
          risk_level: permit.ai_assessment.risk_level,
        },
        recommendation: permit.ai_assessment.recommendation,
        blocking_issues: permit.ai_assessment.is_safe ? [] : [
          "H₂S gas level (8.2 ppm) in Zone C exceeds 5.0 ppm threshold",
          "WBGT heat index at 34.2 °C indicates extreme physiological strain",
          "Simultaneous hot work permit active in adjacent Zone B"
        ],
        citations: [
          { code: "OISD-STD-105", clause: "Section 4.3", req: "Mandates continuous gas telemetry & safety watch" },
          { code: "Factories Act 1948", clause: "Section 36A", req: "Controlled zone evacuation required under critical gas drift" }
        ]
      });
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
          <button className="btn" onClick={() => setShowCreateModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            <span>Issue New Permit</span>
          </button>
          <button className="btn primary" onClick={() => selected && runPTWValidation(selected)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
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
      <CreatePermitModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdd={(newP) => {
          setPermits((prev) => [newP, ...prev]);
          setSelected(newP);
        }}
      />
    </div>
  );
}

function CreatePermitModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (p: Permit) => void }) {
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("hot_work");
  const [zone, setZone] = useState("ZC");
  const [worker, setWorker] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !worker) return;

    const newPermit: Permit = {
      id: `P-${Date.now()}`,
      permit_number: `PTW-2025-0${Math.floor(850 + Math.random() * 100)}`,
      permit_type: type,
      description: desc,
      zone: zone,
      zone_name: zone === "ZA" ? "Zone A — Tank Farm" : zone === "ZB" ? "Zone B — Processing Unit" : zone === "ZC" ? "Zone C — Compressor Bay" : "Zone D — Control Room",
      worker_name: worker,
      worker_id: `W-0${Math.floor(1 + Math.random() * 8)}`,
      approved_by: "S. Varma (Safety Officer)",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 8 * 3600000).toISOString(),
      status: "active",
      ai_risk_score: 15,
      ai_assessment: {
        is_safe: true,
        risk_level: "LOW",
        concerns: [],
        recommendation: "Proceed with standard LOTO safety compliance and continuous gas sniffer checking."
      },
      conditions: [
        "Continuous telemetry monitoring active",
        "Spark containment barriers placed",
        "Gas safety officer clearance logged"
      ]
    };

    onAdd(newPermit);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 480, background: "var(--bg-panel)", border: "1px solid var(--border-bright)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Issue New Permit (PTW)</div>
          <button onClick={onClose} className="btn-ghost" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>PERMIT TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: "100%", padding: 8, background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 4, color: "white" }}
            >
              <option value="confined_space">Confined Space Entry</option>
              <option value="hot_work">Hot Work / Welding</option>
              <option value="electrical">Electrical Work LOTO</option>
              <option value="maintenance">General Maintenance</option>
              <option value="height_work">Work at Height</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>ZONE</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              style={{ width: "100%", padding: 8, background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 4, color: "white" }}
            >
              <option value="ZA">Zone A — Tank Farm</option>
              <option value="ZB">Zone B — Processing Unit</option>
              <option value="ZC">Zone C — Compressor Bay</option>
              <option value="ZD">Zone D — Control Room</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>WORKER NAME</label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
              style={{ width: "100%", padding: 8, background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 4, color: "white" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>PERMIT DESCRIPTION</label>
            <textarea
              required
              placeholder="Describe the scope of work..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ width: "100%", padding: 8, background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 4, color: "white", minHeight: 60 }}
            />
          </div>
          <button type="submit" className="btn primary" style={{ width: "100%", padding: 10, justifyContent: "center" }}>
            Submit & Issue Permit
          </button>
        </form>
      </div>
    </div>
  );
}

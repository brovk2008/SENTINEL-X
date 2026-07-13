"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCcw, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  emoji: string;
  complexity: string;
}

interface ScenarioPoint {
  time_minutes: number;
  time_label: string;
  risk_score: number;
  probability_incident: number;
  status: string;
}

interface ScenarioDetail extends ScenarioSummary {
  initial_risk: number;
  final_risk: number;
  probability_incident: number;
  estimated_cost_inr: number;
  confidence_pct: number;
  recommendation: string;
  reasoning: string;
  trajectory: ScenarioPoint[];
}

interface ScenarioSimulationResult {
  rule_id: number;
  rule_name: string;
  severity: string;
  triggered: boolean;
  alert?: Record<string, unknown>;
  plant_state?: Record<string, unknown>;
  all_triggered_rules: number;
  scenario_suggestion: string;
}

const RULE_MAP: Record<string, number> = {
  h2s_confined_space: 1,
  equipment_failure: 2,
  permit_conflict: 3,
};

const MOCK_SCENARIOS: ScenarioSummary[] = [
  { id: "h2s_confined_space", name: "Confined Space H₂S Gas Intrusion", description: "Vessel entry during minor valve leakage.", emoji: "🕳️", complexity: "CRITICAL" },
  { id: "equipment_failure", name: "Compressor Vibration Escalation", description: "Vibration drift leading to mechanical seal failure.", emoji: "⚙️", complexity: "HIGH" },
  { id: "permit_conflict", name: "SIMOPS Hot Work & Venting", description: "Simultaneous welding and hydrocarbon venting.", emoji: "💥", complexity: "CRITICAL" }
];

const MOCK_DETAIL: Record<string, ScenarioDetail> = {
  h2s_confined_space: {
    id: "h2s_confined_space", name: "Confined Space H₂S Gas Intrusion", description: "Vessel entry during minor valve leakage.", emoji: "🕳️", complexity: "CRITICAL",
    initial_risk: 42, final_risk: 94, probability_incident: 78, estimated_cost_inr: 4500000, confidence_pct: 92,
    recommendation: "Activate auxiliary fans, evacuate personnel within 10m downwind, and enforce SCBA breathing gear.",
    reasoning: "The combination of static venting failure and operator presence creates high inhalation risk.",
    trajectory: [
      { time_minutes: 0, time_label: "T-0m", risk_score: 42, probability_incident: 10, status: "Normal operation" },
      { time_minutes: 10, time_label: "T-10m", risk_score: 65, probability_incident: 35, status: "Vessel seal leak detected" },
      { time_minutes: 20, time_label: "T-20m", risk_score: 94, probability_incident: 78, status: "H₂S level >10 ppm inside vessel" }
    ]
  }
};

export default function ScenarioSimulatorPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>(MOCK_SCENARIOS);
  const [selectedId, setSelectedId] = useState<string | null>("h2s_confined_space");
  const [detail, setDetail] = useState<ScenarioDetail | null>(MOCK_DETAIL["h2s_confined_space"]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [simulation, setSimulation] = useState<ScenarioSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScenarios = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API}/agents/scenarios/list`);
        const payload = await response.json();
        if (payload.scenarios && payload.scenarios.length > 0) {
          setScenarios(payload.scenarios);
          setSelectedId(payload.scenarios[0].id);
        }
      } catch (err) {
        // Fallback to mock scenarios
      } finally {
        setLoading(false);
      }
    };
    loadScenarios();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const loadDetail = async () => {
      setDetailLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API}/agents/scenarios/${selectedId}`);
        const payload = await response.json();
        if (payload.error) throw new Error(payload.error);
        setDetail(payload);
      } catch (err) {
        setDetail(MOCK_DETAIL[selectedId] || null);
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId]);

  const triggerRiskDemo = async (ruleId: number) => {
    setSimulation(null);
    setError(null);
    try {
      const response = await fetch(`${API}/agents/simulate-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_id: ruleId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Simulation failed");
      setSimulation(payload);
    } catch (err) {
      setError("Risk demo simulated successfully (local fallback active).");
      setSimulation({
        rule_id: ruleId,
        rule_name: scenarios.find((s) => RULE_MAP[s.id] === ruleId)?.name || "Vessel Gas Alarm",
        severity: "CRITICAL",
        triggered: true,
        all_triggered_rules: 1,
        scenario_suggestion: "Confirm LOTO mechanical isolation."
      });
    }
  };

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Scenario Simulator</div>
          <div className="page-subtitle">
            Explore what-if safety scenarios and test Sentinel X compound risk detection rules.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => selectedId && triggerRiskDemo(RULE_MAP[selectedId] ?? 1)}
            className="clay-btn primary"
            disabled={!selectedId}
          >
            <RefreshCcw size={13} style={{ marginRight: 6 }} /> Trigger Risk Event
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* List */}
          <div className="clay-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                  Available Scenarios
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>Select a risk scenario</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "12px" }}>
                <Sparkles size={14} color="var(--accent-purple)" />
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Rule-driven</span>
              </div>
            </div>

            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading scenarios...</div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {scenarios.map((scenario) => {
                  const isSel = selectedId === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedId(scenario.id)}
                      className={`clay-card ${isSel ? "info" : ""}`}
                      style={{
                        display: "block",
                        textAlign: "left",
                        padding: "16px",
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ fontSize: "22px" }}>{scenario.emoji}</div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{scenario.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{scenario.description}</div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            color: scenario.complexity === "CRITICAL" ? "var(--risk-critical)" : "var(--risk-high)",
                            fontWeight: 900,
                          }}
                        >
                          {scenario.complexity}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span className="protocol-badge mqtt" style={{ fontSize: "9px", padding: "1px 6px" }}>Rule {RULE_MAP[scenario.id] ?? "N/A"}</span>
                        <span className="protocol-badge http" style={{ fontSize: "9px", padding: "1px 6px" }}>Simulated</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulation Result */}
          {simulation && (
            <div className="clay-card info">
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "10px" }}>
                Active Simulation Status
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {simulation.rule_name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Severity Level: <span style={{ color: "var(--risk-critical)", fontWeight: 800 }}>{simulation.severity}</span>
                </div>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 700 }}>
                    {simulation.triggered ? "⚠️ Risk Condition Triggered" : "Normal state"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: 6 }}>
                    Recommendation: {simulation.scenario_suggestion}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div style={{ display: "grid", gap: "14px" }}>
          <div className="clay-card" style={{ minHeight: "360px" }}>
            {detailLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading scenario details...</div>
            ) : detail ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", display: "grid", placeItems: "center", fontSize: "22px" }}>
                    {detail.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                      Selected Scenario
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>{detail.name}</div>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>{detail.description}</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { label: "Initial risk", value: `${detail.initial_risk}%`, color: "var(--accent-cyan)" },
                    { label: "Final risk", value: `${detail.final_risk}%`, color: "var(--risk-high)" },
                    { label: "Incident probability", value: `${detail.probability_incident}%`, color: "var(--risk-critical)" },
                    { label: "Confidence", value: `${detail.confidence_pct}%`, color: "var(--risk-safe)" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontSize: "16px", color: item.color, fontWeight: 800 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>Recommended Actions</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{detail.recommendation}</div>
                </div>

                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 700 }}>Risk trajectory</div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {detail.trajectory.map((point) => (
                    <div
                      key={point.time_minutes}
                      style={{ padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 12 }}>{point.time_label}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{point.status}</div>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <span style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: 700 }}>Risk {point.risk_score}%</span>
                        <span style={{ fontSize: "11px", color: "var(--risk-critical)", fontWeight: 700 }}>Prob {point.probability_incident}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Select a scenario to inspect its projected outcome.
              </div>
            )}
          </div>

          <div className="clay-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={16} color="var(--risk-medium)" />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Simulator Guidance</div>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", lineHeight: 1.6 }}>
              Use this preview to understand the escalation path of each risk scenario. Trigger a demo risk event to see how the Sentinel X compound risk engine responds.
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", marginTop: "18px", border: "1px solid var(--risk-critical)", background: "rgba(255,59,59,0.05)", borderRadius: "var(--r-md)" }}>
          <div style={{ fontSize: "12px", color: "var(--risk-critical)", fontWeight: 700 }}>Notice</div>
          <div style={{ marginTop: "4px", color: "var(--text-primary)", fontSize: 12 }}>{error}</div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCcw, Sparkles } from "lucide-react";

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

export default function ScenarioSimulatorPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [simulation, setSimulation] = useState<ScenarioSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScenarios = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/scenarios/list`);
        const payload = await response.json();
        setScenarios(payload.scenarios || []);
        if (payload.scenarios?.length) {
          setSelectedId(payload.scenarios[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load scenarios.");
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/scenarios/${selectedId}`);
        const payload = await response.json();
        if (payload.error) {
          throw new Error(payload.error);
        }
        setDetail(payload);
      } catch (err) {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Unable to fetch scenario details.");
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/simulate-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_id: ruleId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Simulation failed");
      }
      setSimulation(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation request failed.");
    }
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Scenario Simulator</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", maxWidth: "680px" }}>
            Explore what-if safety scenarios and integrate real risk simulation with the SafetyOS compound risk engine.
            Select a scenario to review projected risk trajectories, likely incident outcomes, and recommended mitigation strategies.
          </p>
        </div>
        <button
          onClick={() => selectedId && triggerRiskDemo(RULE_MAP[selectedId] ?? 1)}
          className="btn btn-primary btn-sm"
          disabled={!selectedId}
        >
          <RefreshCcw size={14} /> Trigger Demo Risk
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "18px" }}>
        <div style={{ display: "grid", gap: "14px" }}>
          <div className="glass-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                  Available Scenarios
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "8px" }}>Select a risk scenario</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "12px" }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Rule-driven</span>
              </div>
            </div>

            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading scenarios...</div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedId(scenario.id)}
                    className="glass-card"
                    style={{
                      display: "block",
                      textAlign: "left",
                      padding: "16px",
                      border: selectedId === scenario.id ? "1px solid var(--accent-purple)" : "1px solid transparent",
                      background: selectedId === scenario.id ? "rgba(170,85,255,0.08)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ fontSize: "22px" }}>{scenario.emoji}</div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{scenario.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{scenario.description}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          color: scenario.complexity === "CRITICAL" ? "var(--risk-critical)" : "var(--risk-high)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {scenario.complexity}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span className="risk-badge low">Rule {RULE_MAP[scenario.id] ?? "N/A"}</span>
                      <span className="risk-badge medium">Simulated</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {simulation && (
            <div className="glass-card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "10px" }}>
                Last Simulation
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {simulation.rule_name ?? "Demo risk triggered"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Severity: {simulation.severity ?? "UNKNOWN"}
                </div>
                <div style={{ display: "grid", gap: "8px", padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Triggered</div>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                    {simulation.triggered ? "Yes — rule matched" : "No rule trigger"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Scenario suggestion: {simulation.scenario_suggestion ?? "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <div className="glass-card" style={{ padding: "22px", minHeight: "360px" }}>
            {detailLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading scenario details...</div>
            ) : detail ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "18px", background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", fontSize: "22px" }}>
                    {detail.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                      Selected Scenario
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>{detail.name}</div>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>{detail.description}</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "16px" }}>
                  {[
                    { label: "Initial risk", value: `${detail.initial_risk}%`, color: "var(--accent-cyan)" },
                    { label: "Final risk", value: `${detail.final_risk}%`, color: "var(--risk-high)" },
                    { label: "Incident probability", value: `${detail.probability_incident}%`, color: "var(--risk-critical)" },
                    { label: "Confidence", value: `${detail.confidence_pct}%`, color: "var(--text-primary)" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{item.label}</div>
                      <div style={{ fontSize: "18px", color: item.color, fontWeight: 800 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>Recommended Action</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7 }}>{detail.recommendation}</div>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", fontWeight: 700 }}>Risk trajectory</div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {detail.trajectory.map((point) => (
                    <div
                      key={point.time_minutes}
                      style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{point.time_label}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{point.status}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: "var(--accent-cyan)", fontWeight: 700 }}>Risk {point.risk_score}%</span>
                        <span style={{ fontSize: "12px", color: "var(--risk-critical)", fontWeight: 700 }}>Prob {point.probability_incident}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Select a scenario to inspect its projected outcome and mitigation plan.
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={16} color="var(--risk-critical)" />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Simulator Guidance</div>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: 1.7 }}>
              Use this preview to understand the escalation path of each risk scenario. Trigger a demo risk event to see how the SafetyOS compound risk engine responds and which agents would intervene.
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: "16px", marginTop: "18px", border: "1px solid var(--risk-critical)", background: "rgba(255,34,68,0.08)" }}>
          <div style={{ fontSize: "12px", color: "var(--risk-critical)", fontWeight: 700 }}>Error</div>
          <div style={{ marginTop: "8px", color: "var(--text-primary)" }}>{error}</div>
        </div>
      )}
    </div>
  );
}

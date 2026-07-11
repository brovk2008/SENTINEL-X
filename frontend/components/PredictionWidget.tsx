"use client";
import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { RefreshCcw, Shield, TrendingUp } from "lucide-react";

interface PredictionFactor {
  factor: string;
  contribution: number;
  severity: string;
  context: string;
}

interface PredictionData {
  probability_4h: number;
  probability_24h: number;
  confidence: number;
  top_factors: PredictionFactor[];
  predicted_incident_type: string;
  recommended_preventive_actions: string[];
  generated_at: string;
}

export function PredictionWidget() {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/prediction`);
      const payload = await response.json();
      if (!response.ok || !payload.prediction) {
        throw new Error(payload?.error || "Unable to load prediction");
      }
      setPrediction(payload.prediction);
    } catch (err) {
      setPrediction(null);
      setError(err instanceof Error ? err.message : "Prediction update failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, []);

  const chartData = [{ name: "24h Risk", value: prediction?.probability_24h ?? 0, fill: "#d97706" }];
  const getSeverityColor = (s: string) => s === "HIGH" ? "var(--danger)" : s === "MEDIUM" ? "var(--warning)" : "var(--success)";

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "var(--radius-sm)",
            background: "var(--accent-subtle)", display: "grid", placeItems: "center",
          }}>
            <TrendingUp size={14} color="var(--accent)" />
          </div>
          <div>
            <div className="card-title">Incident Prediction</div>
            <div className="card-subtitle">AI-powered 4h / 24h risk forecast</div>
          </div>
        </div>
        <button onClick={loadPrediction} disabled={loading} className="btn btn-ghost btn-sm">
          <RefreshCcw size={13} />
          Refresh
        </button>
      </div>

      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, padding: 14, borderRadius: "var(--radius)", background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>
              4 HOUR
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, color: "var(--info)",
              fontFamily: "var(--font-mono)", lineHeight: 1, marginBottom: 4,
            }}>
              {prediction ? `${prediction.probability_4h}%` : "--"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Short-term exposure</div>
          </div>
          <div style={{ flex: 1, padding: 14, borderRadius: "var(--radius)", background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>
              24 HOUR
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, color: "var(--warning)",
              fontFamily: "var(--font-mono)", lineHeight: 1, marginBottom: 4,
            }}>
              {prediction ? `${prediction.probability_24h}%` : "--"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Compound risk trend</div>
          </div>
        </div>

        <div style={{ width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {prediction ? (
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={180} endAngle={-180}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={20} fill="#d97706" />
                <Tooltip
                  cursor={{ fill: "var(--bg-hover)" }}
                  contentStyle={{
                    background: "var(--bg-surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius)", color: "var(--text-primary)",
                    fontSize: 12,
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {loading ? "Loading..." : "No data"}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "0 16px 12px", fontSize: 12, color: "var(--danger)" }}>{error}</div>
      )}

      {prediction && (
        <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{
              fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.05em", marginBottom: 10,
            }}>
              TOP FACTORS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prediction.top_factors.slice(0, 3).map((factor) => (
                <div key={factor.factor} style={{
                  padding: 10, borderRadius: "var(--radius)",
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{factor.factor}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      +{factor.contribution}%
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{factor.context}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: getSeverityColor(factor.severity) }}>
                    {factor.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.05em", marginBottom: 10,
            }}>
              RECOMMENDED ACTION
            </div>
            <div style={{
              padding: 12, borderRadius: "var(--radius)", background: "var(--bg-subtle)",
              border: "1px solid var(--border)", marginBottom: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Shield size={13} color="var(--accent)" />
                <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>Preventive steps</span>
              </div>
              {prediction.recommended_preventive_actions.slice(0, 2).map((action) => (
                <div key={action} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.5 }}>
                  • {action}
                </div>
              ))}
            </div>
            <div style={{
              padding: 12, borderRadius: "var(--radius)", background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
                marginBottom: 4, letterSpacing: "0.05em",
              }}>
                LIKELY INCIDENT
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.4 }}>
                {prediction.predicted_incident_type}
              </div>
            </div>
          </div>
        </div>
      )}

      {!prediction && !error && (
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: "var(--text-muted)" }}>
          {loading ? "Waiting for prediction engine..." : "Prediction could not be loaded."}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { RefreshCcw, Shield } from "lucide-react";

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

  const chartData = [
    {
      name: "24h Incident Risk",
      value: prediction?.probability_24h ?? 0,
      fill: "#ff8800",
    },
  ];

  return (
    <div className="glass-card" style={{ padding: "20px", minHeight: "360px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Predictive Safety Insights
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
            Incident Prediction
          </h2>
          <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Forecast the next 4h/24h incident risk using the SafetyOS incident prediction engine.
          </p>
        </div>
        <button onClick={loadPrediction} disabled={loading} className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "16px", alignItems: "center" }}>
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Risk Window</div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 120px", padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "6px" }}>4 HOUR</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                {prediction ? `${prediction.probability_4h}%` : "--"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Short-term exposure risk</div>
            </div>
            <div style={{ flex: "1 1 120px", padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "6px" }}>24 HOUR</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--risk-high)", fontFamily: "var(--font-mono)" }}>
                {prediction ? `${prediction.probability_24h}%` : "--"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Compound risk trend</div>
            </div>
          </div>
        </div>
        <div style={{ width: "100%", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {prediction ? (
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={180} endAngle={-180}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={20}
                  fill="#ff8800"
                />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-primary)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center" }}>
              {loading ? "Fetching prediction data..." : error ? "Unable to render chart." : "No data available."}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--risk-critical)", fontSize: "12px", lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {prediction ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>TOP FACTORS</div>
            {prediction.top_factors.slice(0, 3).map((factor) => (
              <div key={factor.factor} style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 700 }}>{factor.factor}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>+{factor.contribution}%</div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{factor.context}</div>
                <div style={{ fontSize: "10px", color: factor.severity === "HIGH" ? "var(--risk-critical)" : factor.severity === "MEDIUM" ? "var(--risk-medium)" : "var(--risk-low)", fontWeight: 700 }}>
                  {factor.severity}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>RECOMMENDED ACTION</div>
            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Shield size={14} color="var(--accent-cyan)" />
                <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 700 }}>Preventive action</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {prediction.recommended_preventive_actions.slice(0, 2).map((action) => (
                  <div key={action} style={{ marginBottom: "8px" }}>• {action}</div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gap: "8px", padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>LIKELY INCIDENT</div>
              <div style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 800, lineHeight: 1.4 }}>{prediction.predicted_incident_type}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          {loading ? "Waiting for prediction engine..." : "Prediction could not be loaded."}
        </div>
      )}
    </div>
  );
}

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
    <div className="glass-card prediction-widget">
      <div className="prediction-header">
        <div>
          <div className="prediction-subtitle">Predictive Safety Insights</div>
          <h2 className="prediction-title">Incident Prediction</h2>
          <p className="prediction-desc">Forecast the next 4h/24h incident risk using the SafetyOS incident prediction engine.</p>
        </div>
        <button onClick={loadPrediction} disabled={loading} className="btn btn-ghost btn-sm prediction-refresh">
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="prediction-grid">
        <div>
          <div className="risk-window-label">Risk Window</div>
          <div className="risk-windows">
            <div className="risk-window-card">
              <div className="risk-window-title">4 HOUR</div>
              <div className="risk-window-value">{prediction ? `${prediction.probability_4h}%` : "--"}</div>
              <div className="risk-window-sub">Short-term exposure risk</div>
            </div>
            <div className="risk-window-card">
              <div className="risk-window-title">24 HOUR</div>
              <div className="risk-window-value risk-24">{prediction ? `${prediction.probability_24h}%` : "--"}</div>
              <div className="risk-window-sub">Compound risk trend</div>
            </div>
          </div>
        </div>

        <div className="radial-container">
          {prediction ? (
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={180} endAngle={-180}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={20} fill="#ff8800" />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-primary)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="prediction-empty">{loading ? "Fetching prediction data..." : error ? "Unable to render chart." : "No data available."}</div>
          )}
        </div>
      </div>

      {error && <div className="prediction-error">{error}</div>}

      {prediction ? (
        <div className="prediction-details">
          <div className="prediction-factors">
            <div className="section-title">TOP FACTORS</div>
            {prediction.top_factors.slice(0, 3).map((factor) => (
              <div key={factor.factor} className="factor-card">
                <div className="factor-row">
                  <div className="factor-name">{factor.factor}</div>
                  <div className="factor-value">+{factor.contribution}%</div>
                </div>
                <div className="factor-context">{factor.context}</div>
                <div className={`factor-severity ${factor.severity.toLowerCase()}`}>{factor.severity}</div>
              </div>
            ))}
          </div>

          <div className="prediction-actions">
            <div className="section-title">RECOMMENDED ACTION</div>
            <div className="recommendation-card">
              <div className="recommendation-head">
                <Shield size={14} color="var(--accent-cyan)" />
                <span className="recommendation-title">Preventive action</span>
              </div>
              <div className="recommendation-list">
                {prediction.recommended_preventive_actions.slice(0, 2).map((action) => (
                  <div key={action} className="recommendation-item">• {action}</div>
                ))}
              </div>
            </div>

            <div className="incident-card">
              <div className="incident-label">LIKELY INCIDENT</div>
              <div className="incident-value">{prediction.predicted_incident_type}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="prediction-empty-small">{loading ? "Waiting for prediction engine..." : "Prediction could not be loaded."}</div>
      )}
    </div>
  );
}

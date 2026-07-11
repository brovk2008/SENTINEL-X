"use client";
import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { PlantMap } from "@/components/PlantMap";
import { RiskGauge } from "@/components/RiskGauge";
import { SensorTicker } from "@/components/SensorTicker";
import { CompoundRiskPanel } from "@/components/CompoundRiskPanel";
import { ActiveAlertsPanel } from "@/components/ActiveAlertsPanel";
import { QuickStats } from "@/components/QuickStats";
import { PredictionWidget } from "@/components/PredictionWidget";
import { TriangleAlert as AlertTriangle } from "lucide-react";

export default function MissionControlPage() {
  const { plantRiskScore, sensors, compoundRisks, wsConnected } = useStore();
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/summary`)
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  const criticalSensors = Object.values(sensors).filter((s) => s.risk_level === "CRITICAL").length;
  const highSensors = Object.values(sensors).filter((s) => s.risk_level === "HIGH").length;

  return (
    <div style={{ padding: "0 28px 32px" }}>
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <h1 className="page-title">Mission Control</h1>
          <p className="page-subtitle">
            Real-time compound risk monitoring — Bharat Petrochemicals Refinery Unit 3
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => {
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/demo/trigger-crisis`, { method: "POST" });
            }}
            className="btn btn-danger btn-sm"
          >
            <AlertTriangle size={13} />
            Simulate Crisis
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={`live-dot ${wsConnected ? "" : "red"}`} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
              {wsConnected ? "Live" : "Connecting"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 0 16px" }}>
        <SensorTicker />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Overall Plant Risk
          </div>
          <RiskGauge score={plantRiskScore} size={180} />
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
              {criticalSensors > 0 && (
                <span className="badge badge--critical" style={{ marginRight: 4 }}>
                  {criticalSensors} Critical
                </span>
              )}
              {highSensors > 0 && (
                <span className="badge badge--high" style={{ marginRight: 4 }}>
                  {highSensors} High
                </span>
              )}
              {criticalSensors === 0 && highSensors === 0 && (
                <span className="badge badge--low">All sensors nominal</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {compoundRisks.slice(0, 2).map((risk, i) => (
                <span key={i} className={`badge badge--${risk.severity.toLowerCase()}`} style={{ fontSize: 10 }}>
                  {risk.title.length > 28 ? risk.title.slice(0, 28) + "…" : risk.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        <QuickStats analytics={analytics} />
      </div>

      <div style={{ marginTop: 16 }}>
        <PredictionWidget />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-header">
            <div>
              <div className="card-title">Plant Layout — Live Risk View</div>
              <div className="card-subtitle">Color indicates current risk level per zone</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { color: "var(--success)", label: "Safe" },
                { color: "var(--warning)", label: "Elevated" },
                { color: "var(--danger)", label: "Critical" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <PlantMap />
          </div>
        </div>

        <ActiveAlertsPanel />
      </div>

      {compoundRisks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <CompoundRiskPanel risks={compoundRisks} />
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PlantMap } from "@/components/PlantMap";
import { RiskGauge } from "@/components/RiskGauge";
import { SensorTicker } from "@/components/SensorTicker";
import { CompoundRiskPanel } from "@/components/CompoundRiskPanel";
import { ActiveAlertsPanel } from "@/components/ActiveAlertsPanel";
import { QuickStats } from "@/components/QuickStats";
import { Activity, AlertTriangle, Users, FileText, Shield, Clock } from "lucide-react";

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
    <div style={{ padding: "24px", minHeight: "100vh", position: "relative" }}>
      {/* Background gradient */}
      <div style={{
        position: "fixed",
        top: 0, left: 220, right: 0, bottom: 0,
        background: plantRiskScore > 75
          ? "radial-gradient(ellipse at 70% 20%, rgba(255,34,68,0.06) 0%, transparent 60%)"
          : plantRiskScore > 50
          ? "radial-gradient(ellipse at 70% 20%, rgba(255,136,0,0.05) 0%, transparent 60%)"
          : "radial-gradient(ellipse at 70% 20%, rgba(74,128,255,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
        zIndex: 0,
        transition: "background 1s ease",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Page Header */}
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Mission Control
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Bharat Petrochemicals Refinery Unit 3 — Vishakhapatnam
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Emergency button */}
            <button
              onClick={() => {
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/demo/trigger-crisis`, { method: "POST" });
              }}
              className="btn btn-danger"
              style={{ fontSize: "12px" }}
            >
              <AlertTriangle size={14} />
              Simulate Crisis
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className={`live-dot ${wsConnected ? "" : "red"}`} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {wsConnected ? "Live" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Live sensor ticker */}
        <SensorTicker />

        {/* Top row: Risk Gauge + Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", marginTop: "16px" }}>
          {/* Risk Gauge */}
          <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "8px" }}>
              OVERALL PLANT RISK
            </div>
            <RiskGauge score={plantRiskScore} size={180} />
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                {criticalSensors > 0 && (
                  <span style={{ color: "var(--risk-critical)", fontWeight: "600" }}>{criticalSensors} CRITICAL </span>
                )}
                {highSensors > 0 && (
                  <span style={{ color: "var(--risk-high)", fontWeight: "600" }}>{highSensors} HIGH </span>
                )}
                sensors
              </div>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                {compoundRisks.slice(0, 2).map((risk, i) => (
                  <span key={i} className="risk-badge critical" style={{ fontSize: "10px" }}>
                    {risk.title.slice(0, 30)}…
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <QuickStats analytics={analytics} />
        </div>

        {/* Main grid: Plant Map + Alerts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginTop: "16px" }}>
          {/* Plant Map */}
          <div className="glass-card" style={{ padding: "20px", minHeight: "400px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                  Plant Layout — Live Risk View
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Color = current risk level per zone
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[["#00e676", "Safe"], ["#ffcc00", "Moderate"], ["#ff8800", "High"], ["#ff2244", "Critical"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <PlantMap sensors={sensors} />
          </div>

          {/* Active Alerts Panel */}
          <ActiveAlertsPanel />
        </div>

        {/* Compound Risk Panel */}
        {compoundRisks.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <CompoundRiskPanel risks={compoundRisks} />
          </div>
        )}
      </div>
    </div>
  );
}

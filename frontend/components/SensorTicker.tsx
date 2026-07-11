"use client";
import { useStore } from "../lib/store";

export function SensorTicker() {
  const { sensors } = useStore();
  const readings = Object.values(sensors).slice(0, 12);

  const getColor = (rl: string) => {
    if (rl === "CRITICAL") return "var(--danger)";
    if (rl === "HIGH") return "var(--warning)";
    if (rl === "MEDIUM") return "var(--warning)";
    return "var(--success)";
  };

  if (readings.length === 0) {
    return (
      <div className="card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="live-dot" style={{ opacity: 0.5 }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Waiting for live sensor data...</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", alignItems: "center", height: 40 }}>
      <div style={{
        padding: "0 12px",
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        borderRight: "1px solid var(--border)",
        height: "100%",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        background: "var(--bg-subtle)",
        flexShrink: 0,
      }}>
        <span className="live-dot" style={{ marginRight: 6 }} />
        LIVE
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{ display: "flex", animation: "ticker-scroll 40s linear infinite" }}>
          {[...readings, ...readings].map((sensor, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 20px", borderRight: "1px solid var(--border-subtle)",
              whiteSpace: "nowrap", height: 40,
            }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{sensor.sensor_id}</span>
              <span style={{
                fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: getColor(sensor.risk_level),
              }}>
                {sensor.value?.toFixed(1)} {sensor.unit}
              </span>
              {sensor.risk_level !== "LOW" && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: getColor(sensor.risk_level),
                  background: `${getColor(sensor.risk_level)}15`, padding: "1px 5px", borderRadius: "var(--radius-sm)",
                }}>
                  {sensor.risk_level}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

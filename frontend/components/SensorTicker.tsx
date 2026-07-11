"use client";
import { useStore } from "../lib/store";
import { useRef } from "react";

export function SensorTicker() {
  const { sensors } = useStore();
  const tickerRef = useRef<HTMLDivElement>(null);
  const readings = Object.values(sensors).slice(0, 12);

  const getColor = (rl: string) => {
    if (rl === "CRITICAL") return "var(--risk-critical)";
    if (rl === "HIGH") return "var(--risk-high)";
    if (rl === "MEDIUM") return "var(--risk-medium)";
    return "var(--risk-low)";
  };

  if (readings.length === 0) {
    return (
      <div style={{
        background: "var(--glass-xs)", border: "1px solid var(--glass-border)",
        borderRadius: "10px", padding: "10px 16px", fontSize: "12px", color: "var(--text-muted)",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <div className="live-dot" style={{ opacity: 0.5 }} />
        Waiting for live sensor data...
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--glass-xs)",
      border: "1px solid var(--glass-border)",
      borderRadius: "10px",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      height: "40px",
    }}>
      <div style={{
        padding: "0 12px",
        fontSize: "10px",
        fontWeight: "700",
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        borderRight: "1px solid var(--glass-border)",
        height: "100%",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        background: "var(--glass-xs)",
      }}>
        <div className="live-dot" style={{ marginRight: "6px" }} />
        LIVE
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div
          ref={tickerRef}
          style={{
            display: "flex",
            gap: "0",
            animation: "ticker-scroll 40s linear infinite",
          }}
        >
          {[...readings, ...readings].map((sensor, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 20px",
              borderRight: "1px solid var(--glass-border)",
              whiteSpace: "nowrap",
              height: "40px",
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sensor.sensor_id}</span>
              <span style={{
                fontSize: "13px",
                fontWeight: "700",
                fontFamily: "var(--font-mono)",
                color: getColor(sensor.risk_level),
              }}>
                {sensor.value?.toFixed(1)} {sensor.unit}
              </span>
              {sensor.risk_level !== "LOW" && (
                <span style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  color: getColor(sensor.risk_level),
                  background: `${getColor(sensor.risk_level)}15`,
                  padding: "1px 4px",
                  borderRadius: "3px",
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

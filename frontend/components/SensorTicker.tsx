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
      <div className="sensor-ticker-empty">
        <div className="live-dot" style={{ opacity: 0.5 }} />
        Waiting for live sensor data...
      </div>
    );
  }

  return (
    <div className="sensor-ticker">
      <div className="ticker-left">
        <div className="live-dot" style={{ marginRight: 6 }} />
        LIVE
      </div>
      <div className="ticker-track-wrapper">
        <div ref={tickerRef} className="ticker-track">
          {[...readings, ...readings].map((sensor, i) => (
            <div key={i} className="ticker-item">
              <span className="ticker-item-id">{sensor.sensor_id}</span>
              <span className="ticker-item-value" style={{ color: getColor(sensor.risk_level) }}>{sensor.value?.toFixed(1)} {sensor.unit}</span>
              {sensor.risk_level !== "LOW" && (
                <span className="ticker-item-badge" style={{ color: getColor(sensor.risk_level), background: `${getColor(sensor.risk_level)}15` }}>{sensor.risk_level}</span>
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

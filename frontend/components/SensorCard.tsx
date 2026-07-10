"use client";
import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export interface SensorHistoryPoint {
  timestamp: string;
  value: number;
  risk_level: string;
}

export interface SensorCardProps {
  sensor: {
    sensor_id: string;
    name: string;
    type: string;
    unit: string;
    zone: string;
    value: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    warning_threshold: number;
    critical_threshold: number;
    normal_range: [number, number];
    is_anomaly?: boolean;
    timestamp?: string;
  };
  history: SensorHistoryPoint[];
  onExpand?: () => void;
}

const riskColors: Record<string, string> = {
  CRITICAL: "#ff3b3b",
  HIGH: "#ff6600",
  MEDIUM: "#ffaa00",
  LOW: "#00ff88",
};

export function SensorCard({ sensor, history, onExpand }: SensorCardProps) {
  const chartData = history.slice(-20).map((point) => ({ ...point, label: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }));

  const trend = useMemo(() => {
    const recent = history.slice(-5).map((point) => point.value);
    if (recent.length < 2) return { direction: "steady", color: "rgba(255,255,255,0.65)", icon: Minus };
    const delta = recent[recent.length - 1] - recent[0];
    if (Math.abs(delta) < sensor.normal_range[1] * 0.02) return { direction: "steady", color: "rgba(255,255,255,0.65)", icon: Minus };
    if (delta > 0) return { direction: "rising", color: "#ffcc00", icon: ArrowUpRight };
    return { direction: "falling", color: "#4ab1ff", icon: ArrowDownRight };
  }, [history, sensor.normal_range]);

  const statusLabel = sensor.risk_level === "CRITICAL" ? "CRITICAL" : sensor.risk_level === "HIGH" ? "WARNING" : sensor.risk_level === "MEDIUM" ? "WARNING" : "NORMAL";
  const statusColor = sensor.risk_level === "CRITICAL" ? "#ff3b3b" : sensor.risk_level === "HIGH" ? "#ff6600" : sensor.risk_level === "MEDIUM" ? "#ffaa00" : "#00ff88";

  return (
    <button
      type="button"
      onClick={onExpand}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        cursor: onExpand ? "pointer" : "default",
        display: "grid",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-mono)" }}>{sensor.sensor_id}</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "999px" }}>{sensor.zone}</span>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "white", marginTop: "6px" }}>{sensor.name}</div>
        </div>
        <div style={{ display: "grid", gap: "6px", textAlign: "right" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: riskColors[sensor.risk_level] }}>{sensor.value.toFixed(1)}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{sensor.unit}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: statusColor, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "5px 10px", borderRadius: "999px" }}>
          {statusLabel}
        </span>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>
          Trend: {trend.direction}
        </span>
        {sensor.is_anomaly && (
          <span style={{ fontSize: "11px", color: "#00ff88", background: "rgba(0,255,136,0.08)", padding: "5px 10px", borderRadius: "999px" }}>
            Last anomaly: 2h ago
          </span>
        )}
      </div>

      <div style={{ height: "40px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line type="monotone" dataKey="value" stroke={riskColors[sensor.risk_level]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>
          Threshold: {sensor.warning_threshold}/{sensor.critical_threshold}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: trend.color, fontWeight: 700, fontSize: "12px" }}>
          {trend.icon === ArrowUpRight ? <ArrowUpRight size={14} /> : trend.icon === ArrowDownRight ? <ArrowDownRight size={14} /> : <Minus size={14} />}
          {trend.direction === "rising" ? "Increasing" : trend.direction === "falling" ? "Decreasing" : "Stable"}
        </div>
      </div>
    </button>
  );
}

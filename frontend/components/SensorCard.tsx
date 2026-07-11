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
      className={`glass-card sensor-card`}
      aria-pressed={!!onExpand}
    >
      <div className="sensor-meta">
        <div className="sensor-meta-left">
          <div className="sensor-meta-top">
            <span className="sensor-id">{sensor.sensor_id}</span>
            <span className="sensor-zone">{sensor.zone}</span>
          </div>
          <div className="sensor-name">{sensor.name}</div>
        </div>
        <div className="sensor-meta-right">
          <div className="sensor-value" style={{ color: riskColors[sensor.risk_level] }}>{sensor.value.toFixed(1)}</div>
          <div className="sensor-unit">{sensor.unit}</div>
        </div>
      </div>

      <div className="sensor-row">
        <span className="sensor-status" style={{ color: statusColor }}>{statusLabel}</span>
        <span className="sensor-trend">Trend: {trend.direction}</span>
        {sensor.is_anomaly && (
          <span className="sensor-anomaly">Last anomaly: 2h ago</span>
        )}
      </div>

      <div className="sensor-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line type="monotone" dataKey="value" stroke={riskColors[sensor.risk_level]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="sensor-footer">
        <div className="sensor-threshold">Threshold: {sensor.warning_threshold}/{sensor.critical_threshold}</div>
        <div className="sensor-trend-visual" style={{ color: trend.color }}>
          {trend.icon === ArrowUpRight ? <ArrowUpRight size={14} /> : trend.icon === ArrowDownRight ? <ArrowDownRight size={14} /> : <Minus size={14} />}
          <span className="sensor-trend-text">{trend.direction === "rising" ? "Increasing" : trend.direction === "falling" ? "Decreasing" : "Stable"}</span>
        </div>
      </div>
    </button>
  );
}

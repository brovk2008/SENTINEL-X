"use client";
import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { SensorHistoryPoint } from "../lib/store";

export type { SensorHistoryPoint };

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

const severityClass: Record<string, string> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export function SensorCard({ sensor, history, onExpand }: SensorCardProps) {
  const chartData = history.slice(-20).map((p) => ({
    ...p,
    label: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  const trend = useMemo(() => {
    const recent = history.slice(-5).map((p) => p.value);
    if (recent.length < 2) return { direction: "steady", color: "var(--text-muted)", icon: Minus };
    const delta = recent[recent.length - 1] - recent[0];
    if (Math.abs(delta) < sensor.normal_range[1] * 0.02) return { direction: "steady", color: "var(--text-muted)", icon: Minus };
    if (delta > 0) return { direction: "rising", color: "var(--warning)", icon: ArrowUpRight };
    return { direction: "falling", color: "var(--info)", icon: ArrowDownRight };
  }, [history, sensor.normal_range]);

  const severity = severityClass[sensor.risk_level] || "low";
  const statusLabel = sensor.risk_level === "CRITICAL" ? "CRITICAL" : sensor.risk_level === "HIGH" ? "WARNING" : sensor.risk_level === "MEDIUM" ? "CAUTION" : "NORMAL";

  return (
    <button
      type="button"
      onClick={onExpand}
      className="card"
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        cursor: onExpand ? "pointer" : "default",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {sensor.sensor_id}
            </span>
            <span style={{
              fontSize: 10, color: "var(--text-muted)", background: "var(--bg-subtle)",
              padding: "2px 6px", borderRadius: "var(--radius-full)", fontWeight: 500,
            }}>
              {sensor.zone}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {sensor.name}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className={`sensor-value ${severity}`}>{sensor.value.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sensor.unit}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span className={`badge badge--${severity}`}>{statusLabel}</span>
        {sensor.is_anomaly && (
          <span className="badge badge--info" style={{ fontSize: 9 }}>Anomaly</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          {trend.icon === ArrowUpRight ? <ArrowUpRight size={13} color={trend.color} /> :
           trend.icon === ArrowDownRight ? <ArrowDownRight size={13} color={trend.color} /> :
           <Minus size={13} color={trend.color} />}
          <span style={{ fontSize: 11, color: trend.color, fontWeight: 600, textTransform: "capitalize" }}>
            {trend.direction}
          </span>
        </div>
      </div>

      <div style={{ height: 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line
              type="monotone" dataKey="value"
              stroke={severity === "critical" ? "var(--danger)" : severity === "high" || severity === "medium" ? "var(--warning)" : "var(--success)"}
              strokeWidth={2} dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
        <span>Threshold: {sensor.warning_threshold} / {sensor.critical_threshold}</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>Range: {sensor.normal_range[0]}–{sensor.normal_range[1]}</span>
      </div>
    </button>
  );
}

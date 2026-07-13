"use client";
import React, { useState, useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { useStore, SensorReading } from "../../lib/store";
import { Radio, Sparkles } from "lucide-react";
import { PIDVisionExtractorModal } from "../../components/PIDVisionExtractorModal";


type FilterKey = "all" | "gas" | "temperature" | "pressure" | "vibration" | "flow" | "humidity" | "ZA" | "ZB" | "ZC" | "ZD" | "ZE" | "ZF";
type SortKey = "risk" | "zone" | "type" | "updated";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "gas",         label: "Gas" },
  { key: "temperature", label: "Temperature" },
  { key: "pressure",    label: "Pressure" },
  { key: "vibration",   label: "Vibration" },
  { key: "flow",        label: "Flow" },
  { key: "humidity",    label: "Humidity" },
  { key: "ZA",          label: "Zone A" },
  { key: "ZB",          label: "Zone B" },
  { key: "ZC",          label: "Zone C" },
  { key: "ZD",          label: "Zone D" },
];

const STATUS_ORDER: Record<string, number> = { crit: 0, warn: 1, normal: 2, ok: 3, offline: 4 };
const STATUS_COLOR: Record<string, string> = {
  crit:   "var(--risk-critical)",
  warn:   "var(--risk-medium)",
  normal: "var(--text-primary)",
  ok:     "var(--risk-safe)",
  offline:"var(--risk-offline)",
};
const ZONE_COLOR: Record<string, string> = {
  ZA: "#4d8eff", ZB: "#9b59ff", ZC: "#ff3b3b",
  ZD: "#00ddff", ZE: "#00ff88", ZF: "#ffaa00",
};

function SensorCard({ sensor }: { sensor: SensorReading }) {
  const hist = sensor.history || [];
  const color = STATUS_COLOR[sensor.status || "normal"];
  const zoneColor = ZONE_COLOR[sensor.zone || "ZA"] || "#4d8eff";
  const thresh = sensor.threshold;

  const sparkData = hist.map((v) => ({ v }));
  const fillPct = thresh ? Math.min(100, ((sensor.rawValue || 0) / thresh.max) * 100) : 0;

  return (
    <div
      className="sensor-card"
      style={{ "--zone-color": zoneColor } as React.CSSProperties}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {sensor.type || "sensor"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>{sensor.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {sensor.zone && (
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px",
                borderRadius: 999, background: `${zoneColor}18`,
                color: zoneColor, border: `1px solid ${zoneColor}30`,
              }}
            >
              {sensor.zone}
            </span>
          )}
          <span
            style={{
              fontSize: 9, fontWeight: 800, padding: "1px 7px",
              borderRadius: 999,
              background: sensor.status === "crit" ? "rgba(255,59,59,0.15)" : sensor.status === "warn" ? "rgba(255,170,0,0.12)" : "rgba(0,255,136,0.08)",
              color,
              border: `1px solid ${color}40`,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {sensor.status || "normal"}
          </span>
        </div>
      </div>

      {/* Big value */}
      <div
        className="sensor-value-big"
        style={{ color, marginTop: 10 }}
      >
        {sensor.value || "—"}
        {sensor.trend && (
          <span
            style={{
              fontSize: 14, marginLeft: 6,
              color: sensor.trend === "up" ? "var(--risk-critical)" : sensor.trend === "down" ? "var(--risk-safe)" : "var(--text-muted)",
            }}
          >
            {sensor.trend === "up" ? "↑" : sensor.trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparkData.length >= 2 && (
        <div style={{ height: 32, marginTop: 6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sg-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone" dataKey="v"
                stroke={color} strokeWidth={1.5}
                fill={`url(#sg-${sensor.id})`}
                dot={false} isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Threshold bar */}
      {thresh && (
        <div style={{ marginTop: 8 }}>
          <div className="threshold-bar">
            <div
              className="threshold-fill"
              style={{
                width: `${fillPct}%`,
                background: sensor.status === "crit" ? "var(--risk-critical)" : sensor.status === "warn" ? "var(--risk-medium)" : "var(--accent-blue)",
              }}
            />
            {/* Warn marker */}
            <div
              className="threshold-marker"
              style={{
                left: `${(thresh.warn / thresh.max) * 100}%`,
                background: "var(--risk-medium)",
              }}
            />
            {/* Crit marker */}
            <div
              className="threshold-marker"
              style={{
                left: `${(thresh.crit / thresh.max) * 100}%`,
                background: "var(--risk-critical)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>0</div>
            <div style={{ fontSize: 9, color: "var(--risk-medium)" }}>W:{thresh.warn}</div>
            <div style={{ fontSize: 9, color: "var(--risk-critical)" }}>C:{thresh.crit}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{thresh.max}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
          {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : "—"}
        </div>
        {sensor.status === "crit" && (
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--risk-critical)", animation: "live-pulse 2s infinite" }}>
            ANOMALY DETECTED
          </div>
        )}
      </div>
    </div>
  );
}

export default function SensorsPage() {
  const sensors = useStore((s) => s.sensors);
  const [filter, setFilter]  = useState<FilterKey>("all");
  const [sort,   setSort]    = useState<SortKey>("risk");
  const [showVisionModal, setShowVisionModal] = useState(false);


  const items = useMemo(() => {
    let arr = Object.values(sensors);
    // Filter
    if (filter !== "all") {
      arr = arr.filter((s) => s.type === filter || s.zone === filter);
    }
    // Sort
    if (sort === "risk") {
      arr = arr.sort((a, b) => (STATUS_ORDER[a.status || "normal"] ?? 9) - (STATUS_ORDER[b.status || "normal"] ?? 9));
    } else if (sort === "zone") {
      arr = arr.sort((a, b) => (a.zone || "").localeCompare(b.zone || ""));
    } else if (sort === "type") {
      arr = arr.sort((a, b) => (a.type || "").localeCompare(b.type || ""));
    }
    return arr;
  }, [sensors, filter, sort]);

  const critCount = items.filter((s) => s.status === "crit").length;
  const warnCount = items.filter((s) => s.status === "warn").length;

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Sensor Wall</div>
          <div className="page-subtitle">
            {items.length} sensors ·
            {critCount > 0 && <span style={{ color: "var(--risk-critical)" }}> {critCount} critical</span>}
            {warnCount > 0 && <span style={{ color: "var(--risk-medium)" }}> · {warnCount} warning</span>}
            · Live anomaly detection
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn primary"
            onClick={() => setShowVisionModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Sparkles size={14} />
            <span>Vision P&ID Extractor</span>
          </button>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Sort by:</div>

          {(["risk", "zone", "type"] as SortKey[]).map((s) => (
            <button
              key={s}
              className={`filter-pill ${sort === s ? "active" : ""}`}
              onClick={() => setSort(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="filter-pills" style={{ marginBottom: 20 }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-pill ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sensor grid */}
      {items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: "var(--accent-blue)" }}>
            <Radio size={32} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No sensors loaded</div>
          <div style={{ fontSize: 13 }}>Waiting for WebSocket connection or demo data...</div>
        </div>
      ) : (
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((s) => (
            <SensorCard key={s.id} sensor={s} />
          ))}
        </div>
      )}
      {/* Vision AI Modal */}
      <PIDVisionExtractorModal isOpen={showVisionModal} onClose={() => setShowVisionModal(false)} />
    </div>
  );
}

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
  const updateSensor = useStore((s) => s.updateSensor);
  const setSensors = useStore((s) => s.setSensors);

  const [filter, setFilter]  = useState<FilterKey>("all");
  const [sort,   setSort]    = useState<SortKey>("risk");
  const [showVisionModal, setShowVisionModal] = useState(false);

  // Manage Panel
  const [showManager, setShowManager] = useState(false);
  const [newSenId, setNewSenId] = useState("");
  const [newSenName, setNewSenName] = useState("");
  const [newSenType, setNewSenType] = useState("gas");
  const [newSenZone, setNewSenZone] = useState("ZA");
  const [newSenVal, setNewSenVal] = useState(2.5);
  const [newSenWarn, setNewSenWarn] = useState(5.0);
  const [newSenCrit, setNewSenCrit] = useState(10.0);
  const [newSenMax, setNewSenMax] = useState(20.0);
  const [newSenUnit, setNewSenUnit] = useState("ppm");

  const handleAddSensor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenId.trim() || !newSenName.trim()) return;

    let status: "normal" | "warn" | "crit" | "ok" = "normal";
    if (newSenVal >= newSenCrit) status = "crit";
    else if (newSenVal >= newSenWarn) status = "warn";
    else if (newSenVal < newSenWarn * 0.4) status = "ok";

    updateSensor(newSenId.trim().toUpperCase(), {
      name: newSenName.trim(),
      value: `${newSenVal.toFixed(1)} ${newSenUnit}`,
      rawValue: newSenVal,
      unit: newSenUnit,
      zone: newSenZone,
      type: newSenType,
      status,
      trend: "flat",
      history: [newSenVal],
      timestamp: new Date().toISOString(),
      threshold: { warn: newSenWarn, crit: newSenCrit, max: newSenMax },
    });

    setNewSenId("");
    setNewSenName("");
  };

  const handleGenerate500 = () => {
    const types = ["gas", "temperature", "pressure", "vibration", "flow", "humidity"];
    const zones = ["ZA", "ZB", "ZC", "ZD", "ZE", "ZF"];
    const units: Record<string, string> = { gas: "ppm", temperature: "°C", pressure: "bar", vibration: "mm/s", flow: "m³/h", humidity: "%" };
    const limits: Record<string, { base: number; drift: number; warn: number; crit: number; max: number }> = {
      gas: { base: 2.1, drift: 0.5, warn: 5, crit: 10, max: 20 },
      temperature: { base: 65, drift: 4, warn: 80, crit: 95, max: 120 },
      pressure: { base: 4.2, drift: 0.3, warn: 6, crit: 8, max: 10 },
      vibration: { base: 3.5, drift: 0.8, warn: 7, crit: 12, max: 20 },
      flow: { base: 70, drift: 3, warn: 90, crit: 100, max: 110 },
      humidity: { base: 60, drift: 2, warn: 85, crit: 95, max: 100 },
    };

    for (let i = 1; i <= 500; i++) {
      const id = `SEN-${i.toString().padStart(3, "0")}`;
      const type = types[Math.floor(Math.random() * types.length)];
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const lim = limits[type];
      const val = lim.base + (Math.random() - 0.5) * lim.drift * 2;

      let status: "normal" | "warn" | "crit" | "ok" = "normal";
      if (val >= lim.crit) status = "crit";
      else if (val >= lim.warn) status = "warn";
      else if (val < lim.warn * 0.4) status = "ok";

      let fmtValue = `${val.toFixed(1)} ${units[type]}`;
      if (type === "pressure") fmtValue = `${val.toFixed(2)} bar`;

      updateSensor(id, {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensor ${i}`,
        value: fmtValue,
        rawValue: parseFloat(val.toFixed(2)),
        unit: units[type],
        zone,
        type,
        status,
        trend: "flat",
        history: [val],
        timestamp: new Date().toISOString(),
        threshold: { warn: lim.warn, crit: lim.crit, max: lim.max },
      });
    }
  };

  const handleClearSensors = () => {
    const kept: Record<string, SensorReading> = {};
    Object.keys(sensors).forEach((k) => {
      if (!k.startsWith("SEN-")) {
        kept[k] = sensors[k];
      }
    });
    setSensors(kept);
  };

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
          <button className="btn" onClick={() => setShowManager(!showManager)}>
            <span>Sensor Manager</span>
          </button>
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

      {/* Sensor Manager Control Panel */}
      {showManager && (
        <div className="clay-card" style={{ padding: 20, marginBottom: 20, border: "1px solid var(--border-bright)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Sensor Matrix Node Manager</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={handleGenerate500} style={{ padding: "4px 10px", fontSize: 11, background: "rgba(0, 229, 255, 0.12)", color: "#00e5ff" }}>
                ⚡ Generate 500 Sensor Grid
              </button>
              <button className="btn danger" onClick={handleClearSensors} style={{ padding: "4px 10px", fontSize: 11 }}>
                🧹 Reset Sensor Grid
              </button>
            </div>
          </div>

          <form onSubmit={handleAddSensor} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Sensor ID</label>
              <input type="text" placeholder="SEN-01" value={newSenId} onChange={(e) => setNewSenId(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 90 }} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Sensor Name</label>
              <input type="text" placeholder="Zone C — H2S Sensor 10" value={newSenName} onChange={(e) => setNewSenName(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Type</label>
              <select value={newSenType} onChange={(e) => setNewSenType(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "var(--bg-panel)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none" }}>
                <option value="gas">Gas</option>
                <option value="temperature">Temperature</option>
                <option value="pressure">Pressure</option>
                <option value="vibration">Vibration</option>
                <option value="flow">Flow</option>
                <option value="humidity">Humidity</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Zone</label>
              <select value={newSenZone} onChange={(e) => setNewSenZone(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "var(--bg-panel)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none" }}>
                <option value="ZA">Zone A</option>
                <option value="ZB">Zone B</option>
                <option value="ZC">Zone C</option>
                <option value="ZD">Zone D</option>
                <option value="ZE">Zone E</option>
                <option value="ZF">Zone F</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Value</label>
              <input type="number" step="any" value={newSenVal} onChange={(e) => setNewSenVal(parseFloat(e.target.value) || 0)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Warn</label>
              <input type="number" step="any" value={newSenWarn} onChange={(e) => setNewSenWarn(parseFloat(e.target.value) || 0)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Crit</label>
              <input type="number" step="any" value={newSenCrit} onChange={(e) => setNewSenCrit(parseFloat(e.target.value) || 0)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Max</label>
              <input type="number" step="any" value={newSenMax} onChange={(e) => setNewSenMax(parseFloat(e.target.value) || 0)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Unit</label>
              <input type="text" placeholder="ppm" value={newSenUnit} onChange={(e) => setNewSenUnit(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <button type="submit" className="btn" style={{ padding: "7px 14px", fontSize: 12, background: "var(--accent-blue)" }}>
              + Add Sensor
            </button>
          </form>
        </div>
      )}

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

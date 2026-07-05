"use client";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Activity, AlertTriangle, Filter, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SensorHistory { timestamp: string; value: number; risk_level: string }

export default function SensorsPage() {
  const { sensors } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<SensorHistory[]>([]);
  const [filterZone, setFilterZone] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [historyLoading, setHistoryLoading] = useState(false);

  const sensorList = Object.values(sensors);
  const zones = ["ALL", ...Array.from(new Set(sensorList.map((s) => s.zone)))];
  const types = ["ALL", ...Array.from(new Set(sensorList.map((s) => s.type)))];

  const filtered = sensorList.filter((s) => {
    if (filterZone !== "ALL" && s.zone !== filterZone) return false;
    if (filterType !== "ALL" && s.type !== filterType) return false;
    return true;
  });

  const loadHistory = async (sensorId: string) => {
    setSelected(sensorId);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/${sensorId}/history?hours=2`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRiskColor = (rl: string) => {
    if (rl === "CRITICAL") return "var(--risk-critical)";
    if (rl === "HIGH") return "var(--risk-high)";
    if (rl === "MEDIUM") return "var(--risk-medium)";
    return "var(--risk-low)";
  };

  const triggerAnomaly = async (sensorId: string) => {
    const sensor = sensors[sensorId];
    if (!sensor) return;
    const value = sensor.critical_threshold * 1.5;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/inject-anomaly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sensor_id: sensorId, target_value: value, duration_seconds: 120 }),
    });
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Live Sensor Monitor</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {sensorList.length} sensors • Updates every 2 seconds • {sensorList.filter((s) => s.risk_level !== "LOW").length} in alert state
          </p>
        </div>
        <button
          onClick={() => fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/demo/trigger-crisis`, { method: "POST" })}
          className="btn btn-danger btn-sm"
        >
          <AlertTriangle size={13} /> Trigger Demo Crisis
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {zones.map((z) => (
            <button key={z} onClick={() => setFilterZone(z)} className={`btn btn-sm ${filterZone === z ? "btn-primary" : "btn-ghost"}`}>
              {z}
            </button>
          ))}
        </div>
        <div style={{ width: "1px", background: "var(--glass-border)" }} />
        <div style={{ display: "flex", gap: "6px" }}>
          {types.slice(0, 6).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`btn btn-sm ${filterType === t ? "btn-primary" : "btn-ghost"}`} style={{ textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "16px" }}>
        {/* Sensor grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px", alignContent: "start" }}>
          {filtered.map((sensor) => {
            const color = getRiskColor(sensor.risk_level);
            const isSelected = selected === sensor.sensor_id;
            const pct = Math.min(100, ((sensor.value - sensor.normal_range[0]) / (sensor.critical_threshold - sensor.normal_range[0])) * 100);

            return (
              <div
                key={sensor.sensor_id}
                className={`glass-card ${sensor.risk_level.toLowerCase()}`}
                style={{
                  padding: "14px",
                  cursor: "pointer",
                  outline: isSelected ? `2px solid ${color}` : "none",
                  transition: "all 0.2s",
                }}
                onClick={() => loadHistory(sensor.sensor_id)}
              >
                {/* Sensor ID + type */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: "600" }}>
                    {sensor.sensor_id}
                  </span>
                  <span className={`risk-badge ${sensor.risk_level.toLowerCase()}`}>{sensor.risk_level}</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "10px", lineHeight: 1.3 }}>
                  {sensor.name}
                </div>
                {/* Value */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "10px" }}>
                  <span className={`sensor-value ${sensor.risk_level.toLowerCase()}`}>
                    {typeof sensor.value === "number" ? sensor.value.toFixed(1) : "—"}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{sensor.unit}</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: "4px", background: "var(--glass-md)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.max(0, pct)}%`,
                    background: color,
                    borderRadius: "2px",
                    transition: "width 0.5s ease",
                    boxShadow: sensor.risk_level !== "LOW" ? `0 0 8px ${color}` : "none",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                    Normal: {sensor.normal_range[0]}–{sensor.normal_range[1]}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                    Zone {sensor.zone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-card" style={{ padding: "16px", position: "sticky", top: "16px", alignSelf: "start" }}>
            {(() => {
              const sensor = sensors[selected];
              if (!sensor) return null;
              const color = getRiskColor(sensor.risk_level);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{sensor.sensor_id}</div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{sensor.name}</div>
                    </div>
                    <span className={`risk-badge ${sensor.risk_level.toLowerCase()}`}>{sensor.risk_level}</span>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{ fontSize: "40px", fontWeight: "800", color, fontFamily: "var(--font-mono)" }}>
                      {sensor.value?.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{sensor.unit}</div>
                  </div>

                  {/* Thresholds */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    {[
                      ["Warning", sensor.warning_threshold, "var(--risk-high)"],
                      ["Critical", sensor.critical_threshold, "var(--risk-critical)"],
                    ].map(([l, v, c]) => (
                      <div key={String(l)} style={{ flex: 1, padding: "8px", background: "var(--glass-xs)", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{l}</div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: String(c), fontFamily: "var(--font-mono)" }}>{String(v)}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{sensor.unit}</div>
                      </div>
                    ))}
                  </div>

                  {/* History chart */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px" }}>2-HOUR HISTORY</div>
                    {historyLoading ? (
                      <div className="skeleton" style={{ height: "120px" }} />
                    ) : (
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={history.slice(-60)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="timestamp" hide />
                          <YAxis domain={["auto", "auto"]} stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ background: "var(--bg-overlay)", border: "1px solid var(--glass-border)", borderRadius: "8px", fontSize: "11px" }}
                            labelStyle={{ color: "var(--text-muted)" }}
                          />
                          <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <button
                    onClick={() => triggerAnomaly(selected)}
                    className="btn btn-danger btn-sm"
                    style={{ width: "100%" }}
                  >
                    <AlertTriangle size={13} /> Inject Anomaly (Demo)
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

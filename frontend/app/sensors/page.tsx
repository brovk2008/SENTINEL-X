"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SensorCard, SensorHistoryPoint } from "@/components/SensorCard";

interface SensorReading {
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
  is_online: boolean;
  is_anomaly?: boolean;
  timestamp?: string;
}

export default function SensorsPage() {
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, SensorHistoryPoint[]>>({});
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterZone, setFilterZone] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    async function fetchSensors() {
      setLoadingSensors(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/`);
        const data = await res.json();
        setSensors(data.sensors || []);
      } catch (error) {
        console.warn("Unable to fetch sensors", error);
      } finally {
        setLoadingSensors(false);
      }
    }

    fetchSensors();
    const interval = window.setInterval(fetchSensors, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const zones = useMemo(() => ["ALL", ...Array.from(new Set(sensors.map((sensor) => sensor.zone)))], [sensors]);
  const types = useMemo(() => ["ALL", ...Array.from(new Set(sensors.map((sensor) => sensor.type)))], [sensors]);

  const filteredSensors = useMemo(() => {
    return sensors.filter((sensor) => {
      if (filterZone !== "ALL" && sensor.zone !== filterZone) return false;
      if (filterType !== "ALL" && sensor.type !== filterType) return false;
      return true;
    });
  }, [filterZone, filterType, sensors]);

  const selectedSensor = sensors.find((sensor) => sensor.sensor_id === selectedSensorId) ?? null;

  const loadHistory = async (sensorId: string) => {
    setSelectedSensorId(sensorId);
    if (history[sensorId]) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/${sensorId}/history?hours=2`);
      const data = await res.json();
      setHistory((prev) => ({ ...prev, [sensorId]: data.history || [] }));
    } catch (error) {
      console.warn("Failed to fetch sensor history", error);
      setHistory((prev) => ({ ...prev, [sensorId]: [] }));
    } finally {
      setLoadingHistory(false);
    }
  };

  const triggerAnomaly = async (sensorId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/inject-anomaly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensor_id: sensorId, target_value: 999, duration_seconds: 120 }),
      });
    } catch (error) {
      console.warn("Failed to inject anomaly", error);
    }
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Live Sensor Monitor</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {loadingSensors ? "Loading sensors..." : `${filteredSensors.length} sensors loaded • ${sensors.filter((sensor) => sensor.risk_level !== "LOW").length} in alert state`}
          </p>
        </div>
        <button
          onClick={() => fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/demo/trigger-crisis`, { method: "POST" })}
          className="btn btn-danger btn-sm"
        >
          <AlertTriangle size={13} /> Trigger Demo Crisis
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {zones.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setFilterZone(zone)}
              className={`btn btn-sm ${filterZone === zone ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform: "capitalize" }}
            >
              {zone}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`btn btn-sm ${filterType === type ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform: "capitalize" }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedSensor ? "1fr 380px" : "1fr", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", alignContent: "start" }}>
          {loadingSensors && (
            <div style={{ gridColumn: "1/-1", display: "grid", gap: "14px" }}>
              {[...Array(6)].map((_, index) => (
                <div key={index} className="glass-card" style={{ height: "160px", background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          )}
          {filteredSensors.map((sensor) => (
            <SensorCard
              key={sensor.sensor_id}
              sensor={sensor}
              history={history[sensor.sensor_id] || []}
              onExpand={() => loadHistory(sensor.sensor_id)}
            />
          ))}
        </div>

        {selectedSensor && (
          <div className="glass-card" style={{ padding: "18px", position: "sticky", top: "20px", alignSelf: "start" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>{selectedSensor.sensor_id}</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>{selectedSensor.name}</div>
              </div>
              <span className={`risk-badge ${selectedSensor.risk_level.toLowerCase()}`}>{selectedSensor.risk_level}</span>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {loadingHistory && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Loading sensor history...
                </div>
              )}
              <div style={{ display: "grid", gap: "10px", padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "18px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Latest reading</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontSize: "34px", fontWeight: "800", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{selectedSensor.value.toFixed(1)}</span>
                  <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{selectedSensor.unit}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {[
                  { label: "Warning", value: selectedSensor.warning_threshold, color: "var(--risk-high)" },
                  { label: "Critical", value: selectedSensor.critical_threshold, color: "var(--risk-critical)" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "14px" }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{item.label} threshold</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => triggerAnomaly(selectedSensor.sensor_id)}
                className="btn btn-danger btn-sm"
                style={{ width: "100%" }}
              >
                <AlertTriangle size={13} /> Inject Anomaly (Demo)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

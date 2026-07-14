"use client";
import React, { useEffect } from "react";
import { useStore } from "../../lib/store";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "";

// Rich demo sensors — 10 sensors across zones with realistic data
const DEMO_SENSORS = [
  { id: "h2s-zc-01", name: "H₂S Compressor Bay", unit: "ppm", zone: "ZC", type: "gas",         warnAt: 5,   critAt: 10,  max: 20,  base: 3.2,  drift: 0.8 },
  { id: "tmp-za-01", name: "Tank A Temperature",  unit: "°C",  zone: "ZA", type: "temperature",  warnAt: 80,  critAt: 95,  max: 120, base: 72,   drift: 3 },
  { id: "prs-zb-01", name: "Process Pressure",    unit: "bar", zone: "ZB", type: "pressure",     warnAt: 6,   critAt: 8,   max: 10,  base: 4.1,  drift: 0.3 },
  { id: "vib-c301",  name: "Compressor C-301",    unit: "mm/s",zone: "ZC", type: "vibration",    warnAt: 7,   critAt: 12,  max: 20,  base: 4.8,  drift: 1.2 },
  { id: "lel-zd-01", name: "LEL Detector Zone D", unit: "%",   zone: "ZD", type: "gas",          warnAt: 10,  critAt: 25,  max: 100, base: 2.1,  drift: 0.5 },
  { id: "tmp-boil3", name: "Boiler 3 Steam",      unit: "°C",  zone: "ZB", type: "temperature",  warnAt: 180, critAt: 210, max: 250, base: 165,  drift: 5 },
  { id: "flw-main",  name: "Main Flow Rate",       unit: "m³/h",zone: "ZA", type: "flow",         warnAt: 90,  critAt: 100, max: 110, base: 74,   drift: 2 },
  { id: "co-ze-01",  name: "CO Detector — Zone E", unit: "ppm", zone: "ZE", type: "gas",          warnAt: 25,  critAt: 50,  max: 100, base: 8.4,  drift: 1 },
  { id: "hum-za-01", name: "Tank Farm Humidity",   unit: "%",   zone: "ZA", type: "humidity",     warnAt: 85,  critAt: 95,  max: 100, base: 62,   drift: 2 },
  { id: "prs-v401",  name: "Vessel V-401 Press",   unit: "bar", zone: "ZF", type: "pressure",     warnAt: 14,  critAt: 18,  max: 25,  base: 11.2, drift: 0.6 },
];

function getStatus(val: number, warn: number, crit: number): "normal" | "warn" | "crit" | "ok" {
  if (val >= crit) return "crit";
  if (val >= warn) return "warn";
  if (val < warn * 0.4) return "ok";
  return "normal";
}

function formatValue(val: number, unit: string): string {
  if (unit === "ppm" || unit === "%" || unit === "mm/s") return `${val.toFixed(1)} ${unit}`;
  if (unit === "bar") return `${val.toFixed(2)} ${unit}`;
  if (unit === "m³/h") return `${val.toFixed(0)} ${unit}`;
  return `${val.toFixed(1)} ${unit}`;
}

export function WSProvider({ children }: { children: React.ReactNode }) {
  const updateSensor  = useStore((s) => s.updateSensor);
  const addAlert      = useStore((s) => s.addAlert);
  const setPlantRisk  = useStore((s) => s.setPlantRisk);
  const setConnectSources = useStore((s) => s.setConnectSources);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectDelay = 1000;
    const maxDelay = 15000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let demoTimer: ReturnType<typeof setInterval> | null = null;
    let isConnected = false;

    // Seed all demo sensors with initial values
    const currentValues: Record<string, number> = {};
    DEMO_SENSORS.forEach((s) => {
      const val = s.base + (Math.random() - 0.5) * s.drift;
      currentValues[s.id] = val;
      const status = getStatus(val, s.warnAt, s.critAt);
      updateSensor(s.id, {
        name: s.name,
        value: formatValue(val, s.unit),
        rawValue: parseFloat(val.toFixed(2)),
        unit: s.unit,
        zone: s.zone,
        type: s.type,
        status,
        trend: "flat",
        history: [val],
        timestamp: new Date().toISOString(),
        threshold: { warn: s.warnAt, crit: s.critAt, max: s.max },
      });
    });

    // Fetch connectivity sources from API if available
    if (API) {
      fetch(`${API}/connectivity/`)
        .then((r) => r.json())
        .then((d) => { if (d.sources) setConnectSources(d.sources); })
        .catch(() => {});
    }

    const startDemoTicker = () => {
      if (demoTimer) return;
      console.log("[WSProvider] Starting fallback demo ticker...");
      demoTimer = setInterval(() => {
        const s = DEMO_SENSORS[Math.floor(Math.random() * DEMO_SENSORS.length)];
        const prev = currentValues[s.id] ?? s.base;
        const delta = (Math.random() - 0.48) * s.drift;
        const next = Math.max(0, Math.min(s.max, prev + delta));
        currentValues[s.id] = next;
        const status = getStatus(next, s.warnAt, s.critAt);
        updateSensor(s.id, {
          value: formatValue(next, s.unit),
          rawValue: parseFloat(next.toFixed(2)),
          status,
          trend: delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat",
          timestamp: new Date().toISOString(),
        });

        // Alert on crit crossing
        if (status === "crit" && Math.random() > 0.6) {
          addAlert({
            id: `a-${Date.now()}`,
            title: `⚠️ ${s.name} exceeded critical threshold (${formatValue(next, s.unit)})`,
            severity: "CRITICAL",
            zone: s.zone,
            timestamp: new Date().toISOString(),
          });
          setPlantRisk(Math.min(100, Math.round(useStore.getState().plantRisk + 2)));
        }
      }, 2800);
    };

    const stopDemoTicker = () => {
      if (demoTimer) {
        console.log("[WSProvider] Stopping fallback demo ticker...");
        clearInterval(demoTimer);
        demoTimer = null;
      }
    };

    const connect = () => {
      if (!WS_URL) {
        startDemoTicker();
        return;
      }
      console.log("[WSProvider] Connecting to:", WS_URL);
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log("[WSProvider] WebSocket connected successfully!");
          isConnected = true;
          reconnectDelay = 1000;
          stopDemoTicker();
        };

        ws.onmessage = (ev) => {
          try {
            const d = JSON.parse(ev.data);
            if (d.type === "sensor_reading" || d.type === "sensor_update") {
              const sensorId = d.sensor_id || d.id;
              const val = parseFloat(d.value);
              const unit = d.unit || "";
              updateSensor(sensorId, {
                name: d.name,
                value: `${d.value} ${unit}`.trim(),
                rawValue: isNaN(val) ? 0 : val,
                timestamp: d.timestamp || new Date().toISOString(),
                zone: d.zone,
              });
            }
            if (d.type === "alert" || d.type === "compound_risk") {
              addAlert({
                id: d.id || `a-${Date.now()}`,
                title: d.title || d.rule_name || "Safety Alert",
                severity: d.severity || "MEDIUM",
                zone: d.zone || d.zone_id || "ALL",
                timestamp: d.timestamp || new Date().toISOString(),
              });
              const riskScore = d.risk_score || d.risk_probability;
              if (d.type === "compound_risk" && riskScore) {
                setPlantRisk(riskScore);
              }
            }
            if (d.type === "plant_risk") {
              setPlantRisk(d.risk_score);
            }
            if (d.type === "source_status") {
              useStore.getState().updateConnectSource(d.source_id, { status: d.status, last_seen: d.last_seen });
            }
          } catch (e) {
            // ignore
          }
        };

        ws.onerror = () => {
          ws?.close();
        };

        ws.onclose = () => {
          isConnected = false;
          startDemoTicker();
          scheduleReconnect();
        };

      } catch (err) {
        isConnected = false;
        startDemoTicker();
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 1.5, maxDelay);
        connect();
      }, reconnectDelay);
    };

    connect();

    return () => {
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopDemoTicker();
    };
  }, [updateSensor, addAlert, setPlantRisk, setConnectSources]);

  return <>{children}</>;
}

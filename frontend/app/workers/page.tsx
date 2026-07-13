"use client";
import React, { useEffect, useState } from "react";
import { PlantMap } from "../../components/PlantMap";
import { Radio, Map, AlertTriangle, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Position {
  worker_id: string;
  worker_name: string;
  zone_id: string;
  x: number;
  y: number;
  technology: string;
  accuracy_m: number;
  timestamp: string;
}

interface Violation {
  worker_id: string;
  zone_id: string;
  area_id: string;
  area_label: string;
  violation_type: string;
  required_permit: string | null;
  severity: string;
  position: { x: number; y: number } | Record<string, never>;
  timestamp: string;
}

interface Hazard {
  worker_id: string;
  equipment: string;
  distance_m: number;
  zone_id: string;
  severity: string;
  action: string;
  timestamp: string;
}

interface RTLSData {
  technology: string;
  positions: Position[];
  geofence_violations: Violation[];
  proximity_hazards: Hazard[];
  zone_occupancy: Record<string, number>;
  total_workers: number;
  critical_count: number;
  timestamp: string;
}

const MOCK_RTLS: RTLSData = {
  technology: "simulated",
  positions: [
    { worker_id: "W-01", worker_name: "Rajesh Kumar", zone_id: "ZC", x: 440.0, y: 240.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-02", worker_name: "Priya Sharma", zone_id: "ZB", x: 500.0, y: 120.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-03", worker_name: "Arjun Mehta", zone_id: "ZC", x: 540.0, y: 310.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-04", worker_name: "Sunita Patel", zone_id: "ZA", x: 120.0, y: 140.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-05", worker_name: "Vikram Singh", zone_id: "ZB", x: 420.0, y: 80.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-06", worker_name: "Anita Reddy", zone_id: "ZC", x: 610.0, y: 260.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-07", worker_name: "Mohammed Ali", zone_id: "ZE", x: 780.0, y: 320.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() },
    { worker_id: "W-08", worker_name: "Lakshmi Nair", zone_id: "ZD", x: 840.0, y: 130.0, technology: "simulated", accuracy_m: 2.0, timestamp: new Date().toISOString() }
  ],
  geofence_violations: [
    {
      worker_id: "W-05", zone_id: "ZB", area_id: "hot-work-ZB", area_label: "Reactor Welding Area",
      violation_type: "NO_PERMIT", required_permit: "HOT_WORK", severity: "CRITICAL",
      position: { x: 420.0, y: 80.0 }, timestamp: new Date().toISOString()
    }
  ],
  proximity_hazards: [
    {
      worker_id: "W-03", equipment: "Compressor C-301", distance_m: 1.4, zone_id: "ZC",
      severity: "CRITICAL", action: "Move worker ≥ 30 m from Compressor C-301", timestamp: new Date().toISOString()
    }
  ],
  zone_occupancy: { ZA: 1, ZB: 2, ZC: 3, ZD: 1, ZE: 1, ZF: 0 },
  total_workers: 8,
  critical_count: 2,
  timestamp: new Date().toISOString()
};

const ZONE_LIMITS = {
  ZA: { name: "Tank Farm", max: 20 },
  ZB: { name: "Process Unit", max: 15 },
  ZC: { name: "Compressor Bay", max: 8 },
  ZD: { name: "Control Room", max: 10 },
  ZE: { name: "Flare Stack", max: 4 },
  ZF: { name: "Vessel Park", max: 6 }
};

export default function WorkersPage() {
  const [rtls, setRtls] = useState<RTLSData>(MOCK_RTLS);
  const [calibrating, setCalibrating] = useState(false);
  const [showRestricted, setShowRestricted] = useState(true);

  useEffect(() => {
    const fetchPositions = () => {
      fetch(`${API}/rtls/positions`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setRtls(d.rtls);
        })
        .catch(() => {});
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => setCalibrating(false), 1200);
  };

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Real-Time Location System (RTLS)</div>
          <div className="page-subtitle">
            Active tracking via Decawave UWB & BLE beacons. Geofence violation checking every 2 seconds.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="clay-btn" onClick={handleCalibrate} disabled={calibrating} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Radio size={14} />
            <span>{calibrating ? "Calibrating UWB..." : "Calibrate Anchors"}</span>
          </button>
          <button 
            className={`clay-btn ${showRestricted ? "primary" : ""}`}
            onClick={() => setShowRestricted(!showRestricted)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Map size={14} />
            <span>{showRestricted ? "Hide Restricted Areas" : "Show Restricted Areas"}</span>
          </button>
        </div>
      </div>

      {/* Rtls Status strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Total Tracked Crew", val: rtls.total_workers, unit: "badges active", color: "var(--accent-blue)" },
          { label: "Geofence Violations", val: rtls.geofence_violations.length, unit: "alerts", color: "var(--risk-critical)" },
          { label: "Proximity Alerts", val: rtls.proximity_hazards.length, unit: "machinery", color: "var(--risk-high)" },
          { label: "RTLS Precision", val: "± 15 cm", unit: "Decawave UWB", color: "var(--accent-cyan)" }
        ].map((s) => (
          <div key={s.label} className="clay-card" style={{ padding: "12px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.unit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map + Roster Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Plant Map Overlay */}
        <div className="clay-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Real-Time Personnel Positioning Map</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>System: UWB Core</div>
          </div>
          <div style={{ padding: 20, position: "relative" }}>
            <div style={{ opacity: 0.9 }}>
              <PlantMap />
            </div>

            {/* Coordinates overlay SVG */}
            <svg
              viewBox="0 0 1000 420"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 10
              }}
              aria-hidden
            >
              {/* Restricted Areas Highlight */}
              {/* Confined Space ZC */}
              <rect x="420" y="220" width="70" height="50" fill="rgba(255,59,59,0.06)" stroke="var(--risk-critical)" strokeWidth="1" strokeDasharray="3 3" />
              <text x="425" y="235" fontSize="8" fill="var(--risk-critical)" fontWeight="700">Restricted Confined CS-ZC</text>

              {/* Reactor Welding Area B */}
              <rect x="400" y="40" width="80" height="60" fill="rgba(255,170,0,0.06)" stroke="var(--risk-medium)" strokeWidth="1" strokeDasharray="3 3" />
              <text x="405" y="55" fontSize="8" fill="var(--risk-medium)" fontWeight="700">Hot Work ZB</text>

              {/* Worker coordinate dots */}
              {rtls.positions.map((pos) => {
                const hasVio = rtls.geofence_violations.some((v) => v.worker_id === pos.worker_id) ||
                               rtls.proximity_hazards.some((h) => h.worker_id === pos.worker_id);
                const color = hasVio ? "var(--risk-critical)" : "var(--risk-safe)";
                return (
                  <g key={pos.worker_id}>
                    {hasVio && (
                      <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4">
                        <animate attributeName="r" values="6;16;6" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={pos.x} cy={pos.y} r={hasVio ? 6.5 : 5}
                      fill={color} stroke="white" strokeWidth="1.5"
                      filter={`drop-shadow(0 0 4px ${color})`}
                    />
                    <text
                      x={pos.x + 9} y={pos.y + 3}
                      fontSize="9" fontWeight="800" fill="white"
                      fontFamily="Inter, sans-serif"
                    >
                      {pos.worker_name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Violations Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Geofence Alerts */}
          <div className="clay-card critical" style={{ padding: "16px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Active Geofence Alerts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rtls.geofence_violations.length > 0 ? (
                rtls.geofence_violations.map((vio, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px", background: "rgba(255,59,59,0.06)",
                      border: "1px solid rgba(255,59,59,0.15)", borderRadius: "var(--r-sm)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "var(--risk-critical)" }}>{vio.violation_type}</span>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Zone {vio.zone_id}</span>
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-primary)" }}>
                      Worker <strong>{rtls.positions.find((p) => p.worker_id === vio.worker_id)?.worker_name}</strong> entered {vio.area_label} without permit {vio.required_permit}.
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", padding: "10px 0" }}>
                  ✓ No active geofence violations.
                </div>
              )}
            </div>
          </div>

          {/* Proximity machinery alerts */}
          <div className="clay-card critical" style={{ padding: "16px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Machinery Proximity Alerts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rtls.proximity_hazards.length > 0 ? (
                rtls.proximity_hazards.map((haz, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px", background: "rgba(255,170,0,0.06)",
                      border: "1px solid rgba(255,170,0,0.15)", borderRadius: "var(--r-sm)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "var(--risk-medium)" }}>{haz.severity} PROXIMITY</span>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Zone {haz.zone_id}</span>
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-primary)" }}>
                      Worker <strong>{rtls.positions.find((p) => p.worker_id === haz.worker_id)?.worker_name}</strong> is {haz.distance_m} m from {haz.equipment}.
                    </div>
                    <div style={{ fontSize: 10, color: "var(--risk-critical)", fontWeight: 700, marginTop: 4 }}>
                      ⚠️ {haz.action}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", padding: "10px 0" }}>
                  ✓ No machinery proximity alerts.
                </div>
              )}
            </div>
          </div>

          {/* Capacity checks */}
          <div className="clay-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Zone Capacities</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(ZONE_LIMITS).map(([id, z]) => {
                const count = rtls.zone_occupancy[id] || 0;
                const pct = Math.min(100, (count / z.max) * 100);
                const color = pct >= 90 ? "var(--risk-critical)" : pct >= 70 ? "var(--risk-medium)" : "var(--risk-safe)";
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>Zone {id} — {z.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color }} />
                      </div>
                      <span style={{ fontWeight: 800, color }}>{count}/{z.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

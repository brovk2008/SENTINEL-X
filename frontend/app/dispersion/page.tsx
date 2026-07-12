"use client";
import React, { useEffect, useState } from "react";
import { PlantMap } from "../../components/PlantMap";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface PlumeZone {
  label: string;
  threshold_ppm: number;
  distance_m: number;
  half_width_m: number;
  length_px: number;
  width_px: number;
  color: string;
  opacity: number;
  ellipse: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    rotation_deg: number;
  };
}

interface PlumeModelData {
  chemical: string;
  chemical_name: string;
  chemical_formula: string;
  source: {
    svg_x: number;
    svg_y: number;
    height_m: number;
    release_rate_gs: number;
  };
  conditions: {
    wind_speed_ms: number;
    wind_direction_deg: number;
    temperature_c: number;
    humidity_pct: number;
    stability_class: string;
  };
  zones: PlumeZone[];
  affected_plant_zones: string[];
  workers_at_risk: number;
  recommendation: string;
}

const CHEMICALS_DB = {
  H2S: { name: "Hydrogen Sulfide", formula: "H₂S", idlh: "100 ppm", erpg2: "50 ppm" },
  CO:  { name: "Carbon Monoxide", formula: "CO",  idlh: "1200 ppm",erpg2: "150 ppm" },
  LPG: { name: "Liquefied LPG",   formula: "LPG", idlh: "2100 ppm",erpg2: "N/A" },
  NH3: { name: "Ammonia",         formula: "NH₃", idlh: "300 ppm", erpg2: "150 ppm" }
};

export default function DispersionPage() {
  const [model, setModel] = useState<PlumeModelData | null>(null);
  const [chemical, setChemical] = useState("H2S");
  const [releaseRate, setReleaseRate] = useState(10.0);
  const [windSpeed, setWindSpeed] = useState(2.8);
  const [windDir, setWindDir] = useState(225.0); // wind blowing to SW vector
  const [sourceZone, setSourceZone] = useState("ZC"); // Compressor Bay

  // Zone coordinates mapping to center the source
  const sourceCoords: Record<string, { x: number; y: number }> = {
    ZA: { x: 195, y: 140 },
    ZB: { x: 540, y: 110 },
    ZC: { x: 540, y: 300 }, // Compressor C-301
    ZD: { x: 840, y: 130 },
    ZE: { x: 780, y: 320 },
    ZF: { x: 910, y: 320 }
  };

  const currentCoords = sourceCoords[sourceZone] || sourceCoords["ZC"];

  const handleCompute = () => {
    const query = new URLSearchParams({
      chemical,
      release_rate_gs: releaseRate.toString(),
      wind_speed: windSpeed.toString(),
      wind_dir: windDir.toString(),
      svg_x: currentCoords.x.toString(),
      svg_y: currentCoords.y.toString()
    });

    fetch(`${API}/dispersion/model?${query}`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setModel(d.plume);
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Initial load with default active scenario
    fetch(`${API}/dispersion/active`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setModel(d.plume);
          setChemical(d.plume.chemical);
          setReleaseRate(d.plume.source.release_rate_gs);
          setWindSpeed(d.plume.conditions.wind_speed_ms);
          setWindDir(d.plume.conditions.wind_direction_deg);
        }
      })
      .catch(() => handleCompute());
  }, []);

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Hazard Dispersion Modeling</div>
          <div className="page-subtitle">
            ALOHA-inspired Gaussian plume modeling for toxic gas leaks & volatile releases.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="clay-btn" onClick={handleCompute}>🔄 Recalibrate Plume</button>
          <button className="clay-btn primary">🚨 Trigger Evacuation</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Plant Map with Plume Overlay */}
        <div className="clay-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Real-Time Plume Overlay — Plant Map</div>
            {model && (
              <div style={{ fontSize: 11, color: "var(--risk-critical)", fontWeight: 700 }}>
                ⚠️ PLUME ACTIVE: {model.chemical_name} ({model.chemical_formula})
              </div>
            )}
          </div>
          <div style={{ padding: 20, position: "relative" }}>
            {/* Base PlantMap Component */}
            <div style={{ opacity: 0.85 }}>
              <PlantMap />
            </div>

            {/* Custom Plume Overlay SVG */}
            {model && (
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
                {/* Release source point */}
                <circle cx={model.source.svg_x} cy={model.source.svg_y} r="6" fill="#ff0055" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="6;11;6" dur="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Threat zones ellipses */}
                {model.zones.map((zone, idx) => {
                  const el = zone.ellipse;
                  return (
                    <ellipse
                      key={idx}
                      cx={el.cx}
                      cy={el.cy}
                      rx={el.rx}
                      ry={el.ry}
                      fill={zone.color}
                      fillOpacity={zone.opacity}
                      stroke={zone.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      transform={`rotate(${el.rotation_deg - 90}, ${model.source.svg_x}, ${model.source.svg_y})`}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Modeling controls sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Controls */}
          <div className="clay-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Dispersion Parameters</div>

            {/* Chemical */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Toxic Chemical</div>
              <select
                className="clay-input"
                style={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}
                value={chemical}
                onChange={(e) => setChemical(e.target.value)}
              >
                {Object.entries(CHEMICALS_DB).map(([k, v]) => (
                  <option key={k} value={k}>{v.name} ({v.formula})</option>
                ))}
              </select>
            </div>

            {/* Source Zone */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Release Source Area</div>
              <select
                className="clay-input"
                style={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}
                value={sourceZone}
                onChange={(e) => setSourceZone(e.target.value)}
              >
                <option value="ZA">Zone A — Tank Farm</option>
                <option value="ZB">Zone B — Process Unit</option>
                <option value="ZC">Zone C — Compressor Bay</option>
                <option value="ZD">Zone D — Control Room</option>
                <option value="ZE">Zone E — Flare Stack</option>
                <option value="ZF">Zone F — Vessel Park</option>
              </select>
            </div>

            {/* Release Rate */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Release Rate</span>
                <span style={{ fontWeight: 700 }}>{releaseRate} g/s</span>
              </div>
              <input
                type="range" min="1" max="50" step="0.5" className="w-full"
                value={releaseRate} onChange={(e) => setReleaseRate(parseFloat(e.target.value))}
                style={{ accentColor: "var(--risk-critical)" }}
              />
            </div>

            {/* Wind Speed */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Wind Speed</span>
                <span style={{ fontWeight: 700 }}>{windSpeed} m/s</span>
              </div>
              <input
                type="range" min="0.5" max="10" step="0.1" className="w-full"
                value={windSpeed} onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                style={{ accentColor: "var(--accent-blue)" }}
              />
            </div>

            {/* Wind Direction */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Wind Direction</span>
                <span style={{ fontWeight: 700 }}>{windDir}°</span>
              </div>
              <input
                type="range" min="0" max="360" step="5" className="w-full"
                value={windDir} onChange={(e) => setWindDir(parseFloat(e.target.value))}
                style={{ accentColor: "var(--accent-cyan)" }}
              />
              {/* Simple direction label */}
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>
                {windDir >= 337 || windDir < 22 ? "North ⬇" : ""}
                {windDir >= 22 && windDir < 67 ? "Northeast ↙" : ""}
                {windDir >= 67 && windDir < 112 ? "East ⬅" : ""}
                {windDir >= 112 && windDir < 157 ? "Southeast ↖" : ""}
                {windDir >= 157 && windDir < 202 ? "South ⬆" : ""}
                {windDir >= 202 && windDir < 247 ? "Southwest ↗" : ""}
                {windDir >= 247 && windDir < 292 ? "West ➡" : ""}
                {windDir >= 292 && windDir < 337 ? "Northwest ↘" : ""}
              </div>
            </div>

            <button className="clay-btn primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleCompute}>
              Compute Plume
            </button>
          </div>
        </div>
      </div>

      {/* Plume assessment output */}
      {model && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
          {/* Assessment */}
          <div className="clay-card critical" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Plume Safety Assessment</div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {model.recommendation}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Estimated Crew at Risk</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--risk-critical)", marginTop: 4 }}>
                  {model.workers_at_risk} workers
                </div>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 14 }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Affected Zones</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-blue)", marginTop: 8 }}>
                  {model.affected_plant_zones.map((z) => `Zone ${z}`).join(", ") || "None"}
                </div>
              </div>
            </div>
          </div>

          {/* Threshold distances info */}
          <div className="clay-card" style={{ padding: "20px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Calculated Hazard Distances</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {model.zones.map((zone, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--r-md)", border: "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: zone.color }}>{zone.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                      Threshold: {zone.threshold_ppm} ppm · plume width: {zone.half_width_m * 2} m
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)" }}>
                    {zone.distance_m} m
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

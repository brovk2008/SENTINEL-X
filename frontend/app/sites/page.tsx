"use client";
import React, { useState } from "react";

interface Plant {
  id: string;
  name: string;
  location: string;
  city: string;
  risk: number;
  workers: number;
  alerts: number;
  x: number;  // SVG coordinate for India map
  y: number;
  type: string;
}

const PLANTS: Plant[] = [
  { id: "viz",  name: "Bharat Petrochemicals",  location: "Vizag, Andhra Pradesh",   city: "Vizag",    risk: 84, workers: 156, alerts: 3, x: 680, y: 380, type: "Petrochemical" },
  { id: "jam",  name: "Reliance Jamnagar",       location: "Jamnagar, Gujarat",        city: "Jamnagar", risk: 43, workers: 89,  alerts: 1, x: 165, y: 270, type: "Refinery" },
  { id: "mum",  name: "ONGC Mumbai Offshore",    location: "Mumbai, Maharashtra",      city: "Mumbai",   risk: 12, workers: 23,  alerts: 0, x: 210, y: 360, type: "Offshore" },
  { id: "che",  name: "Chennai Depot",           location: "Chennai, Tamil Nadu",      city: "Chennai",  risk: 8,  workers: 12,  alerts: 0, x: 560, y: 480, type: "Storage" },
];

function riskColor(r: number): string {
  return r >= 80 ? "var(--risk-critical)" : r >= 50 ? "var(--risk-medium)" : "var(--risk-safe)";
}
function riskClass(r: number): string {
  return r >= 80 ? "critical" : r >= 50 ? "warning" : "safe";
}

// Simplified SVG map of India (outlined path — simplified polygon)
const INDIA_PATH = `
  M 200 60 L 240 50 L 290 60 L 340 55 L 390 70 L 440 80 L 500 70 L 550 75
  L 600 90 L 640 110 L 680 140 L 700 180 L 710 220 L 700 260 L 720 300
  L 740 340 L 730 380 L 700 420 L 660 460 L 620 500 L 580 520 L 560 530
  L 520 520 L 500 510 L 480 520 L 460 530 L 440 510 L 400 480 L 360 450
  L 320 420 L 280 400 L 240 380 L 210 350 L 180 310 L 170 270 L 160 240
  L 155 200 L 160 170 L 180 140 L 200 110 L 200 80 Z
  M 680 300 L 700 340 L 720 380 L 720 410 L 700 420
`;

export default function SitesPage() {
  const [selected, setSelected] = useState<string | null>("viz");

  const selPlant = PLANTS.find((p) => p.id === selected);

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Multi-Site Overview</div>
          <div className="page-subtitle">
            {PLANTS.length} plants · {PLANTS.reduce((s, p) => s + p.workers, 0)} workers · {PLANTS.filter((p) => p.risk >= 80).length} critical site{PLANTS.filter((p) => p.risk >= 80).length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="clay-btn">📊 Compare Sites</button>
          <button className="clay-btn primary">+ Add Plant</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* India SVG Map */}
        <div className="clay-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>India — Plant Locations</div>
          </div>
          <div style={{ padding: 20, position: "relative" }}>
            <svg viewBox="100 40 700 560" style={{ width: "100%", height: "auto" }} aria-label="Map of India with plant locations">
              <defs>
                <radialGradient id="mapGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(68,136,255,0.06)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* India outline */}
              <path
                d={INDIA_PATH}
                fill="url(#mapGrad)"
                stroke="rgba(68,136,255,0.2)"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Grid lines (faint) */}
              {[200, 300, 400, 500, 600].map((y) => (
                <line key={y} x1="100" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}
              {[200, 300, 400, 500, 600, 700].map((x) => (
                <line key={x} x1={x} y1="40" x2={x} y2="600" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}

              {/* Plant dots */}
              {PLANTS.map((p) => {
                const color = p.risk >= 80 ? "#ff3b3b" : p.risk >= 50 ? "#ffaa00" : "#00ff88";
                const isSel = selected === p.id;
                return (
                  <g key={p.id} onClick={() => setSelected(p.id)} style={{ cursor: "pointer" }}>
                    {/* Pulse ring */}
                    {p.risk >= 80 && (
                      <circle cx={p.x} cy={p.y} r={20} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.3}>
                        <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Outer ring if selected */}
                    {isSel && (
                      <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
                    )}
                    {/* Main dot */}
                    <circle
                      cx={p.x} cy={p.y} r={8}
                      fill={color}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={2}
                      filter={`drop-shadow(0 0 ${p.risk >= 80 ? 8 : 4}px ${color})`}
                    />
                    {/* Label */}
                    <text
                      x={p.x + 14} y={p.y + 4}
                      fontSize={10}
                      fill={color}
                      fontWeight="700"
                      fontFamily="Inter, sans-serif"
                    >
                      {p.city}
                    </text>
                    <text
                      x={p.x + 14} y={p.y + 16}
                      fontSize={9}
                      fill="rgba(255,255,255,0.35)"
                      fontFamily="Inter, sans-serif"
                    >
                      {p.risk}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected plant detail */}
        {selPlant && (
          <div
            className={`clay-card ${riskClass(selPlant.risk)}`}
            style={{ animation: "float-up 0.3s var(--ease-spring)" }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="section-label">{selPlant.type}</div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>{selPlant.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>📍 {selPlant.location}</div>
                </div>
                <div
                  className={`risk-badge ${riskClass(selPlant.risk)}`}
                  style={{ fontSize: 11 }}
                >
                  {selPlant.risk >= 80 ? "● CRITICAL" : selPlant.risk >= 50 ? "● HIGH" : "● SAFE"}
                </div>
              </div>
            </div>

            {/* Risk ring */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Risk Score</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: riskColor(selPlant.risk), lineHeight: 1 }}>
                  {selPlant.risk}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>/ 100</div>
              </div>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }} aria-hidden>
                <circle cx="45" cy="45" r="36" strokeWidth="6" stroke="rgba(255,255,255,0.06)" fill="none" />
                <circle
                  cx="45" cy="45" r="36"
                  strokeWidth="6"
                  stroke={riskColor(selPlant.risk)}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={(1 - selPlant.risk / 100) * 2 * Math.PI * 36}
                  style={{ transition: "stroke-dashoffset 1s var(--ease-out)", filter: `drop-shadow(0 0 6px ${riskColor(selPlant.risk)})` }}
                />
              </svg>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
              {[
                { l: "Workers",      v: selPlant.workers, c: "var(--accent-blue)" },
                { l: "Active Alerts", v: selPlant.alerts,  c: selPlant.alerts > 0 ? "var(--risk-critical)" : "var(--risk-safe)" },
                { l: "Plant Type",   v: selPlant.type,    c: "var(--accent-purple)" },
              ].map(({ l, v, c }) => (
                <div
                  key={l}
                  style={{ textAlign: "center", padding: "10px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--r-md)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <a href="/" className="clay-btn primary" style={{ justifyContent: "center", textDecoration: "none" }}>
              🏭 Open Plant Dashboard
            </a>
          </div>
        )}
      </div>

      {/* All plants cards */}
      <div style={{ marginTop: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>All Plants</div>
        <div
          className="stagger-children"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}
        >
          {PLANTS.map((p) => (
            <div
              key={p.id}
              className={`clay-card ${riskClass(p.risk)} ${selected === p.id ? "info" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setSelected(p.id)}
            >
              <div className="section-label">{p.type}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>📍 {p.location}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: riskColor(p.risk) }}>{p.risk}%</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>risk</div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>👷 {p.workers}</div>
                {p.alerts > 0 && (
                  <div style={{ fontSize: 11, color: "var(--risk-critical)", fontWeight: 700 }}>🚨 {p.alerts} alerts</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

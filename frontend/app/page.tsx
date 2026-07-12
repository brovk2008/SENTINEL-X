"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as RTooltip
} from "recharts";
import { SensorTicker } from "../components/SensorTicker";
import { PlantMap } from "../components/PlantMap";
import { useStore } from "../lib/store";

// ── Circular Ring ──────────────────────────────────────────────────────────────
function RiskRing({ value }: { value: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color =
    value >= 80 ? "#ff3b3b" :
    value >= 60 ? "#ff6b35" :
    value >= 40 ? "#ffaa00" :
    "#00ff88";

  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="ring-svg" aria-hidden>
      <circle cx="45" cy="45" r={r} strokeWidth="6" stroke="rgba(255,255,255,0.06)" fill="none" />
      <circle
        cx="45" cy="45" r={r}
        strokeWidth="6"
        stroke={color}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="ring-fill"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

// ── Mini Sparkline ─────────────────────────────────────────────────────────────
function Spark({ data, color = "#4d8eff" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const points = data.map((v, i) => ({ v }));
  return (
    <div className="sparkline-wrap">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sg-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Compound Risk Item ─────────────────────────────────────────────────────────
const COMPOUND_RISKS = [
  {
    title: "H₂S Buildup — Compressor Bay ZC",
    desc: "Sensor 8.2 ppm ↑ with 6 workers present. Hot work permit P-2241 active.",
    sev: "critical",
    score: 91,
  },
  {
    title: "High Vibration — Compressor C-301",
    desc: "4.8 mm/s ↑ trending toward warn threshold. Next maintenance overdue by 6d.",
    sev: "high",
    score: 74,
  },
  {
    title: "Vessel V-401 Pressure Variance",
    desc: "±1.2 bar oscillation over 30 min. LOTO permit expiring in 14 min.",
    sev: "warning",
    score: 58,
  },
];

// ── Agent Avatars ──────────────────────────────────────────────────────────────
const AGENTS = [
  { name: "Safety",      emoji: "🛡️",  color: "#ff3b3b" },
  { name: "Production",  emoji: "⚙️",  color: "#ff6b35" },
  { name: "Compliance",  emoji: "⚖️",  color: "#9b59ff" },
  { name: "Maintenance", emoji: "🔧",  color: "#4d8eff" },
  { name: "Finance",     emoji: "💰",  color: "#ffaa00" },
  { name: "Emergency",   emoji: "🚨",  color: "#ff4d9b" },
  { name: "Executive",   emoji: "📊",  color: "#00ddff" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MissionControlPage() {
  const plantRisk    = useStore((s) => s.plantRisk);
  const sensors      = useStore((s) => s.sensors);
  const workerCount  = useStore((s) => s.workerCount);
  const glowRef = useRef<HTMLDivElement>(null);

  // Cursor glow effect
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top  = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Risk sparkline history (demo)
  const riskHistory = [72, 74, 76, 78, 75, 80, 82, 81, 84, plantRisk];

  const critSensors = Object.values(sensors).filter((s) => s.status === "crit").length;
  const warnSensors = Object.values(sensors).filter((s) => s.status === "warn").length;
  const h2sSensor   = sensors["h2s-zc-01"];
  const vibSensor   = sensors["vib-c301"];

  const riskColor =
    plantRisk >= 80 ? "#ff3b3b" :
    plantRisk >= 60 ? "#ff6b35" :
    plantRisk >= 40 ? "#ffaa00" :
    "#00ff88";

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--canvas)" }}>
      {/* Cursor glow */}
      <div ref={glowRef} className="cursor-glow" style={{ opacity: 0.7 }} />

      {/* Ambient mesh */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            radial-gradient(ellipse 600px 400px at 80% 20%, rgba(255,59,59,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 500px 600px at 15% 80%, rgba(68,136,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 400px 300px at 50% 50%, rgba(155,89,255,0.03) 0%, transparent 60%)
          `,
        }}
      />

      {/* Bento Grid */}
      <div className="bento-grid stagger-children" style={{ position: "relative", zIndex: 1 }}>

        {/* ── Plant Map (hero) ── */}
        <div className="bento-plant-map">
          <PlantMap height={460} />
        </div>

        {/* ── Risk Score ── */}
        <div className="bento-risk-score">
          <div
            className={`clay-card h-full ${plantRisk >= 80 ? "critical pulsing-critical" : plantRisk >= 60 ? "warning" : "safe"}`}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div className="section-label">Plant Risk Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <div>
                <div className={`stat-number ${plantRisk >= 80 ? "critical" : plantRisk >= 60 ? "warning" : "safe"}`}>
                  {plantRisk}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>/ 100</div>
                <div
                  className="risk-badge"
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    background: plantRisk >= 80 ? "rgba(255,59,59,0.15)" : "rgba(255,170,0,0.12)",
                    color: riskColor,
                    border: `1px solid ${riskColor}40`,
                  }}
                >
                  {plantRisk >= 80 ? "● CRITICAL" : plantRisk >= 60 ? "● HIGH" : plantRisk >= 40 ? "● MEDIUM" : "● SAFE"}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <RiskRing value={plantRisk} />
              </div>
            </div>

            <Spark data={riskHistory} color={riskColor} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
              <div style={{ textAlign: "center", padding: "6px 0", background: "rgba(255,59,59,0.08)", borderRadius: "var(--r-sm)" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--risk-critical)" }}>{critSensors}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Critical</div>
              </div>
              <div style={{ textAlign: "center", padding: "6px 0", background: "rgba(255,170,0,0.08)", borderRadius: "var(--r-sm)" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--risk-medium)" }}>{warnSensors}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Warning</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Prediction Engine ── */}
        <div className="bento-prediction">
          <div className="clay-card info h-full" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="section-label">Prediction Engine</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Risk Trajectory</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              {[
                { label: "4H forecast",  val: 42, note: "H₂S normalizing" },
                { label: "12H forecast", val: 58, note: "Maintenance window" },
                { label: "24H forecast", val: 67, note: "Night shift risk ↑" },
              ].map(({ label, val, note }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: val >= 60 ? "var(--risk-medium)" : "var(--risk-safe)",
                      }}
                    >
                      {val}%
                    </div>
                  </div>
                  <div className="threshold-bar">
                    <div
                      className="threshold-fill"
                      style={{
                        width: `${val}%`,
                        background: val >= 60 ? "var(--risk-medium)" : "var(--risk-safe)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Workers on Shift ── */}
        <div className="bento-workers">
          <div className="clay-card h-full" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="section-label">Workers on Shift</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 4 }}>
              <div className="stat-number" style={{ color: "var(--accent-blue)" }}>{workerCount}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>/ 56 total</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 10, flex: 1 }}>
              {[
                { z: "ZA", n: 8 }, { z: "ZB", n: 12 }, { z: "ZC", n: 6 },
                { z: "ZD", n: 5 }, { z: "ZE", n: 2 },  { z: "ZF", n: 3 },
              ].map(({ z, n }) => (
                <div
                  key={z}
                  style={{
                    background: z === "ZC" ? "rgba(255,59,59,0.1)" : "rgba(255,255,255,0.03)",
                    borderRadius: "var(--r-sm)",
                    padding: "6px",
                    textAlign: "center",
                    border: z === "ZC" ? "1px solid rgba(255,59,59,0.2)" : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: z === "ZC" ? "var(--risk-critical)" : "var(--text-primary)" }}>{n}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Zone {z}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Active Permits ── */}
        <div className="bento-permits">
          <div className="clay-card warning h-full" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="section-label">Permits to Work</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
              <div className="stat-number warning">12</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>active</div>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {[
                { type: "Hot Work",       zone: "ZB", exp: "2h 14m", color: "#ff6b35" },
                { type: "Confined Space", zone: "ZC", exp: "14 min",  color: "#ff3b3b" },
                { type: "Electrical",     zone: "ZD", exp: "5h 02m", color: "#4d8eff" },
              ].map(({ type, zone, exp, color }) => (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{type}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Zone {zone}</div>
                  </div>
                  <div style={{ fontSize: 11, color, fontWeight: 700 }}>⏱ {exp}</div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
                +9 more · <span style={{ color: "var(--risk-critical)" }}>3 expiring soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sensor Ticker ── */}
        <div className="bento-sensor-ticker">
          <SensorTicker />
        </div>

        {/* ── Active Compound Risks ── */}
        <div className="bento-active-risks">
          <div className="clay-card critical h-full" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="section-label">Active Compound Risks</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              {COMPOUND_RISKS.length} compound threats detected
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "auto" }}>
              {COMPOUND_RISKS.map((r) => (
                <div
                  key={r.title}
                  style={{
                    padding: "10px 12px",
                    background: r.sev === "critical" ? "rgba(255,59,59,0.08)" : r.sev === "high" ? "rgba(255,107,53,0.06)" : "rgba(255,170,0,0.06)",
                    borderRadius: "var(--r-md)",
                    border: `1px solid ${r.sev === "critical" ? "rgba(255,59,59,0.2)" : r.sev === "high" ? "rgba(255,107,53,0.15)" : "rgba(255,170,0,0.15)"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.title}</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: r.sev === "critical" ? "var(--risk-critical)" : r.sev === "high" ? "var(--risk-high)" : "var(--risk-medium)",
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {r.score}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AI Agent Status ── */}
        <div className="bento-agents">
          <div className="clay-card info h-full" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="section-label">AI Agent Status</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              7 agents online — debate active
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, flex: 1 }}>
              {AGENTS.map((a) => (
                <div
                  key={a.name}
                  style={{ textAlign: "center" }}
                  data-tooltip={`${a.name} Agent — Online`}
                >
                  <div
                    className="agent-avatar"
                    style={{
                      background: `${a.color}18`,
                      border: `2px solid ${a.color}30`,
                      margin: "0 auto 4px",
                      width: 40, height: 40,
                      fontSize: 16,
                    }}
                  >
                    {a.emoji}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {a.name}
                  </div>
                </div>
              ))}
            </div>
            <a
              href="/debate"
              className="clay-btn primary"
              style={{ marginTop: 14, justifyContent: "center", textDecoration: "none" }}
            >
              🤖 Launch Debate Room
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

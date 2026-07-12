"use client";
import React, { useRef, useEffect, useState } from "react";
import { useStore } from "../lib/store";

interface Zone {
  id: string;
  label: string;
  code: string;
  x: number; y: number; w: number; h: number;
  risk: "critical" | "warning" | "safe" | "normal";
  workers: number;
  sensors: number;
}

const ZONES: Zone[] = [
  { id: "ZA", code: "ZA", label: "Tank Farm",       x: 30,  y: 30,  w: 330, h: 240, risk: "normal",   workers: 8,  sensors: 6 },
  { id: "ZB", code: "ZB", label: "Process Unit",    x: 390, y: 30,  w: 300, h: 160, risk: "warning",  workers: 12, sensors: 8 },
  { id: "ZC", code: "ZC", label: "Compressor Bay",  x: 390, y: 210, w: 300, h: 180, risk: "critical",  workers: 6,  sensors: 10 },
  { id: "ZD", code: "ZD", label: "Control Room",    x: 720, y: 30,  w: 240, h: 200, risk: "normal",   workers: 5,  sensors: 4 },
  { id: "ZE", code: "ZE", label: "Flare Stack",     x: 720, y: 250, w: 120, h: 140, risk: "safe",     workers: 2,  sensors: 3 },
  { id: "ZF", code: "ZF", label: "Vessel Park",     x: 860, y: 250, w: 100, h: 140, risk: "warning",  workers: 3,  sensors: 5 },
];

const WORKERS_POS = [
  { x: 120, y: 120 }, { x: 180, y: 200 }, { x: 80,  y: 180 },
  { x: 480, y: 100 }, { x: 540, y: 130 }, { x: 460, y: 280 },
  { x: 510, y: 300 }, { x: 440, y: 340 }, { x: 780, y: 120 },
  { x: 840, y: 90  }, { x: 755, y: 310 },
];

const RISK_COLORS = {
  critical: { fill: "rgba(255,59,59,0.15)",  stroke: "#ff3b3b", label: "#ff3b3b" },
  warning:  { fill: "rgba(255,170,0,0.12)",  stroke: "#ffaa00", label: "#ffaa00" },
  safe:     { fill: "rgba(0,255,136,0.08)",  stroke: "#00ff88", label: "#00ff88" },
  normal:   { fill: "rgba(68,136,255,0.07)", stroke: "#4d8eff", label: "#8888aa" },
};

export function PlantMap({ height = 440 }: { height?: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const sensors = useStore((s) => s.sensors);
  const critSensors = Object.values(sensors).filter((s) => s.status === "crit").length;

  return (
    <div
      className={`clay-card ${critSensors > 0 ? "critical" : ""}`}
      style={{ padding: 0, overflow: "hidden", minHeight: height, position: "relative", height }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "linear-gradient(180deg, rgba(7,7,15,0.9) 0%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Live Plant Map
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            Bharat Petrochemicals Unit 3 — Vizag
          </div>
        </div>
        {critSensors > 0 && (
          <div className="risk-badge critical" style={{ fontSize: 10 }}>
            {critSensors} Critical Sensor{critSensors > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Zone detail popup */}
      {selected && (() => {
        const z = ZONES.find((z) => z.id === selected)!;
        if (!z) return null;
        return (
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              background: "rgba(13,13,26,0.95)",
              border: `1px solid ${RISK_COLORS[z.risk].stroke}30`,
              borderRadius: "var(--r-md)",
              padding: "12px 16px",
              zIndex: 10,
              minWidth: 180,
              animation: "float-up 0.2s var(--ease-spring)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{z.label}</div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
              >✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { l: "Zone", v: z.code },
                { l: "Risk", v: z.risk.toUpperCase() },
                { l: "Workers", v: z.workers },
                { l: "Sensors", v: z.sensors },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: RISK_COLORS[z.risk].label }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <svg
        ref={svgRef}
        viewBox="0 0 1000 420"
        style={{ width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Interactive plant layout map"
        role="img"
      >
        {/* Background grid — engineering drawing style */}
        <defs>
          <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="1000" height="420" fill="url(#grid)" />

        {/* Coordinate ticks */}
        {[0, 200, 400, 600, 800, 1000].map((x) => (
          <text key={`tx-${x}`} x={x} y={418} fontSize={7} fill="rgba(255,255,255,0.1)" textAnchor="middle">
            {x}
          </text>
        ))}
        {[0, 100, 200, 300, 400].map((y) => (
          <text key={`ty-${y}`} x={5} y={y + 3} fontSize={7} fill="rgba(255,255,255,0.1)">
            {y}
          </text>
        ))}

        {/* Zones */}
        {ZONES.map((z) => {
          const c = RISK_COLORS[z.risk];
          const isHov = hovered === z.id;
          const isSel = selected === z.id;
          const isCrit = z.risk === "critical";
          return (
            <g key={z.id}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={8}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={isSel || isHov ? 2 : 1}
                strokeOpacity={isCrit ? (isSel ? 1 : 0.6) : 0.4}
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={() => setHovered(z.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(z.id === selected ? null : z.id)}
                filter={isCrit ? "url(#glow-red)" : undefined}
              />

              {/* Zone label */}
              <text
                x={z.x + 10}
                y={z.y + 18}
                fontSize={10}
                fill={c.label}
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {z.code}
              </text>
              <text
                x={z.x + 10}
                y={z.y + 30}
                fontSize={8}
                fill="rgba(255,255,255,0.4)"
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {z.label}
              </text>

              {/* Worker count badge */}
              <rect x={z.x + z.w - 32} y={z.y + 8} width={24} height={14} rx={4} fill="rgba(0,0,0,0.5)" />
              <text
                x={z.x + z.w - 20}
                y={z.y + 19}
                fontSize={8}
                fill="rgba(255,255,255,0.7)"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                👷{z.workers}
              </text>

              {/* Critical zone flashing outline */}
              {isCrit && (
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx={8}
                  fill="none"
                  stroke="#ff3b3b"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  strokeDasharray="6 4"
                  style={{ animation: "risk-pulse-dash 2s ease-in-out infinite", pointerEvents: "none" }}
                />
              )}
            </g>
          );
        })}

        {/* Pipeline connections */}
        <path
          d="M 360 150 L 390 150 M 690 120 L 720 120 M 690 300 L 720 300 M 840 320 L 860 320"
          stroke="rgba(77,142,255,0.2)"
          strokeWidth={3}
          strokeDasharray="4 3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Worker markers */}
        {WORKERS_POS.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill={i < 3 ? "var(--accent-cyan)" : i < 7 ? "var(--accent-blue)" : "var(--accent-pink)"}
              opacity={0.85}
            />
            <circle cx={p.x} cy={p.y} r={8} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          </g>
        ))}

        {/* Critical alert marker at ZC */}
        <g filter="url(#glow-red)">
          <circle cx={540} cy={300} r={6} fill="var(--risk-critical)" opacity={0.95}>
            <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.95;0.4;0.95" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x={552} y={296} fontSize={10} fill="var(--risk-critical)" fontWeight="700" fontFamily="Inter">
            H₂S
          </text>
        </g>

        {/* Legend */}
        <g transform="translate(20, 388)">
          {[
            { c: "var(--risk-critical)", l: "Critical" },
            { c: "var(--risk-medium)",   l: "Warning" },
            { c: "var(--risk-safe)",     l: "Safe" },
            { c: "var(--accent-blue)",   l: "Normal" },
          ].map(({ c, l }, i) => (
            <g key={l} transform={`translate(${i * 80}, 0)`}>
              <rect width={10} height={10} rx={2} fill={c} opacity={0.5} />
              <text x={14} y={9} fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="Inter">{l}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

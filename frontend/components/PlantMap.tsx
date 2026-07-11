"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";

const zoneDefinitions = [
  { id: "ZA", label: "Tank Farm", x: 50, y: 50, width: 180, height: 120, workers: 5 },
  { id: "ZB", label: "Processing", x: 280, y: 50, width: 200, height: 150, workers: 8 },
  { id: "ZC", label: "Coke Battery", x: 530, y: 50, width: 160, height: 120, workers: 12 },
  { id: "ZD", label: "Control Room", x: 50, y: 220, width: 100, height: 80, workers: 3 },
  { id: "ZE", label: "Utilities", x: 200, y: 220, width: 160, height: 100, workers: 6 },
  { id: "ZF", label: "Flare Stack", x: 530, y: 220, width: 120, height: 80, workers: 2 },
];

const getZoneFill = (score: number) => {
  if (score >= 80) return "#dc2626";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#84cc16";
  return "#16a34a";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Elevated";
  if (score >= 20) return "Moderate";
  return "Safe";
};

export function PlantMap() {
  const { sensors, compoundRisks, demoHighlight } = useStore();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zoneRisk = useMemo(() => {
    const base: Record<string, number> = { ZA: 22, ZB: 38, ZC: 52, ZD: 18, ZE: 30, ZF: 25 };
    Object.values(sensors).forEach((s) => {
      const zoneId = s.zone?.startsWith("Z") ? s.zone : `Z${s.zone}`;
      if (base[zoneId] !== undefined) {
        const weight = s.risk_level === "CRITICAL" ? 35 : s.risk_level === "HIGH" ? 20 : s.risk_level === "MEDIUM" ? 10 : 0;
        base[zoneId] = Math.min(100, base[zoneId] + weight);
      }
    });
    compoundRisks.forEach((r) => {
      const zoneId = r.zone?.startsWith("Z") ? r.zone : `Z${r.zone}`;
      if (base[zoneId] !== undefined) {
        base[zoneId] = Math.min(100, base[zoneId] + Math.round(r.risk_probability * 0.3));
      }
    });
    return base;
  }, [sensors, compoundRisks]);

  const pulsingZones = useMemo(() => {
    const set = new Set<string>();
    compoundRisks.forEach((r) => {
      const zoneId = r.zone?.startsWith("Z") ? r.zone : `Z${r.zone}`;
      set.add(zoneId);
    });
    return set;
  }, [compoundRisks]);

  const selectedInfo = useMemo(() => {
    if (!selectedZone) return null;
    const zone = zoneDefinitions.find((z) => z.id === selectedZone);
    if (!zone) return null;
    return { ...zone, risk: zoneRisk[zone.id] ?? 0 };
  }, [selectedZone, zoneRisk]);

  const pipePaths = [
    { from: "ZA", to: "ZB" },
    { from: "ZB", to: "ZC" },
    { from: "ZA", to: "ZD" },
    { from: "ZB", to: "ZE" },
    { from: "ZC", to: "ZF" },
    { from: "ZE", to: "ZF" },
  ];

  const getCenter = (zoneId: string) => {
    const zone = zoneDefinitions.find((z) => z.id === zoneId);
    return zone ? { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 } : { x: 0, y: 0 };
  };

  const workerCircles = zoneDefinitions.flatMap((zone) =>
    Array.from({ length: Math.max(2, Math.min(6, zone.workers)) }, (_, idx) => ({
      key: `${zone.id}-worker-${idx}`,
      cx: zone.x + 16 + (idx % 3) * 40,
      cy: zone.y + 24 + Math.floor(idx / 3) * 32,
      delay: idx * 0.35,
    }))
  );

  useEffect(() => {
    if (demoHighlight === "plant-map") {
      setSelectedZone("ZC");
    }
  }, [demoHighlight]);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 720 360" style={{ width: "100%", height: "auto", maxHeight: "420px" }}>
        {pipePaths.map((pipe) => {
          const source = getCenter(pipe.from);
          const target = getCenter(pipe.to);
          return (
            <path
              key={`${pipe.from}-${pipe.to}`}
              d={`M ${source.x} ${source.y} C ${source.x + 60} ${source.y} ${target.x - 60} ${target.y} ${target.x} ${target.y}`}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
          );
        })}

        {zoneDefinitions.map((zone) => {
          const score = zoneRisk[zone.id] ?? 0;
          const fill = getZoneFill(score);
          const opacity = 0.12 + (score / 100) * 0.25;
          const isPulsing = pulsingZones.has(zone.id);
          return (
            <g key={zone.id}>
              {isPulsing && (
                <rect
                  x={zone.x - 6}
                  y={zone.y - 6}
                  width={zone.width + 12}
                  height={zone.height + 12}
                  rx={14}
                  ry={14}
                  fill="none"
                  stroke={fill}
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                </rect>
              )}
              <rect
                className="zone-shape"
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx={10}
                ry={10}
                fill={fill}
                fillOpacity={opacity}
                stroke={fill}
                strokeWidth="1"
                strokeOpacity="0.4"
                onClick={() => setSelectedZone(zone.id)}
              />
              <text className="zone-label" x={zone.x + 12} y={zone.y + 26} fill="var(--text-primary)" fontSize="12" fontWeight="700">
                {zone.id}
              </text>
              <text className="zone-label" x={zone.x + 12} y={zone.y + 44} fill="var(--text-secondary)" fontSize="11">
                {zone.label}
              </text>
              <text className="zone-label" x={zone.x + 12} y={zone.y + 62} fill={fill} fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
                {score}% · {getScoreLabel(score)}
              </text>
            </g>
          );
        })}

        {workerCircles.map((worker) => (
          <circle
            key={worker.key}
            cx={worker.cx}
            cy={worker.cy}
            r={2.5}
            fill="var(--accent)"
            opacity="0.5"
          />
        ))}
      </svg>

      {selectedInfo && (
        <div style={{
          position: "absolute", left: 16, right: 16, bottom: 12,
          background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
          padding: "14px 16px", border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                {selectedInfo.label} — Zone {selectedInfo.id}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Risk: {selectedInfo.risk}% · {getScoreLabel(selectedInfo.risk)}
              </div>
            </div>
            <button type="button" onClick={() => setSelectedZone(null)} className="btn btn-ghost btn-sm">
              Close
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div style={{ padding: 10, background: "var(--bg-subtle)", borderRadius: "var(--radius)" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Workers Present</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{selectedInfo.workers}</div>
            </div>
            <div style={{ padding: 10, background: "var(--bg-subtle)", borderRadius: "var(--radius)" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Risk Level</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: getZoneFill(selectedInfo.risk) }}>
                {getScoreLabel(selectedInfo.risk)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

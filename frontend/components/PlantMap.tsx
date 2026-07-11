"use client";
import { useEffect, useMemo, useState } from "react";
import { safetyWS } from "@/lib/websocket";

const zoneDefinitions = [
  { id: "ZA", label: "Tank Farm", x: 50, y: 50, width: 180, height: 120, workers: 5 },
  { id: "ZB", label: "Processing", x: 280, y: 50, width: 200, height: 150, workers: 8 },
  { id: "ZC", label: "Coke Battery", x: 530, y: 50, width: 160, height: 120, workers: 12 },
  { id: "ZD", label: "Control Room", x: 50, y: 220, width: 100, height: 80, workers: 3 },
  { id: "ZE", label: "Utilities", x: 200, y: 220, width: 160, height: 100, workers: 6 },
  { id: "ZF", label: "Flare Stack", x: 530, y: 220, width: 120, height: 80, workers: 2 },
];

const getZoneFill = (score: number) => {
  if (score >= 80) return "#ff3b3b";
  if (score >= 60) return "#ff6600";
  if (score >= 40) return "#ffaa00";
  if (score >= 20) return "#ffdd00";
  return "#00ff88";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Elevated";
  if (score >= 20) return "Moderate";
  return "Safe";
};

interface RiskEvent {
  zone?: string;
  risk_probability?: number;
  risk_score?: number;
}

interface SensorEvent {
  zone?: string;
  sensor_id?: string;
  value?: number;
}

export function PlantMap() {
  const [zoneRisk, setZoneRisk] = useState<Record<string, number>>({ ZA: 38, ZB: 52, ZC: 84, ZD: 25, ZE: 46, ZF: 29 });
  const [pulsingZones, setPulsingZones] = useState<Set<string>>(new Set(["ZC"]));
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    safetyWS.connect();

    const compoundHandler = (eventData: unknown) => {
      const data = eventData as RiskEvent;
      const zone = data.zone || "ZC";
      const score = Math.min(100, Math.max(0, data.risk_probability ?? data.risk_score ?? 84));
      setZoneRisk((prev) => ({ ...prev, [zone]: score }));
      setPulsingZones((prev) => new Set(prev).add(zone));
      window.setTimeout(() => {
        setPulsingZones((prev) => {
          const next = new Set(prev);
          next.delete(zone);
          return next;
        });
      }, 5000);
    };

    const sensorHandler = (eventData: unknown) => {
      const data = eventData as SensorEvent;
      const zone = data.zone || (typeof data.sensor_id === "string" ? data.sensor_id.split("-")[1] : "ZC");
      setZoneRisk((prev) => {
        const current = prev[zone] ?? 28;
        const delta = typeof data.value === "number" ? Math.min(10, Math.max(-8, Math.round((data.value / 100) * 8))) : 4;
        return { ...prev, [zone]: Math.min(100, Math.max(0, current + delta)) };
      });
    };

    const unsubCompound = safetyWS.on("compound_risk", compoundHandler);
    const unsubSensor = safetyWS.on("sensor_update", sensorHandler);

    return () => {
      unsubCompound();
      unsubSensor();
    };
  }, []);

  const selectedInfo = useMemo(() => {
    if (!selectedZone) return null;
    const zone = zoneDefinitions.find((z) => z.id === selectedZone);
    if (!zone) return null;
    return {
      ...zone,
      risk: zoneRisk[zone.id] ?? 0,
      workers: zone.workers,
    };
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

  const workerCircles = zoneDefinitions.flatMap((zone) => {
    return Array.from({ length: Math.max(2, Math.min(6, zone.workers)) }, (_, idx) => {
      const x = zone.x + 16 + (idx % 3) * 40;
      const y = zone.y + 24 + Math.floor(idx / 3) * 32;
      return {
        key: `${zone.id}-worker-${idx}`,
        cx: x,
        cy: y,
        delay: idx * 0.35,
      };
    });
  });

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#00ff88", marginBottom: "6px" }}>
            LIVE PLANT MAP
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "white" }}>INDOIL VIZAG UNIT 3</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.8)" }}>
              <span className="pulse-dot" style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#00ff88" }} />
              <span style={{ fontSize: "12px" }}>Live feed</span>
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/simulate-risk`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rule_id: 1 }),
            });
          }}
          className="btn btn-primary btn-sm"
          style={{ alignSelf: "flex-start" }}
        >
          Simulate Zone C Alert
        </button>
      </div>

      <div style={{ position: "relative", background: "rgba(255,255,255,0.04)", borderRadius: "24px", padding: "18px" }}>
        <svg viewBox="0 0 720 360" style={{ width: "100%", height: "420px" }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {pipePaths.map((pipe) => {
            const source = getCenter(pipe.from);
            const target = getCenter(pipe.to);
            return (
              <path
                key={`${pipe.from}-${pipe.to}`}
                d={`M ${source.x} ${source.y} C ${source.x + 60} ${source.y} ${target.x - 60} ${target.y} ${target.x} ${target.y}`}
                fill="none"
                stroke="cyan"
                strokeWidth="2"
                strokeOpacity="0.25"
              />
            );
          })}

          {zoneDefinitions.map((zone) => {
            const score = zoneRisk[zone.id] ?? 0;
            const fill = getZoneFill(score);
            const opacity = 0.15 + (score / 100) * 0.4;
            const isPulsing = pulsingZones.has(zone.id);
            return (
              <g key={zone.id}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  rx={16}
                  ry={16}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1.5"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedZone(zone.id)}
                />
                {isPulsing && (
                  <rect
                    x={zone.x - 8}
                    y={zone.y - 8}
                    width={zone.width + 16}
                    height={zone.height + 16}
                    rx={20}
                    ry={20}
                    fill="none"
                    stroke={fill}
                    strokeWidth="3"
                    className="pulse-ring"
                  />
                )}
                <text x={zone.x + 14} y={zone.y + 28} fill="white" fontSize="12" fontWeight="700">
                  {zone.id}
                </text>
                <text x={zone.x + 14} y={zone.y + 46} fill="rgba(255,255,255,0.85)" fontSize="11">
                  {zone.label}
                </text>
                <text x={zone.x + 14} y={zone.y + 64} fill="rgba(255,255,255,0.75)" fontSize="11">
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
              r={3}
              fill="#4da5ff"
              style={{ animation: `drift ${6 + worker.delay}s ease-in-out infinite`, animationDelay: `${worker.delay}s` }}
            />
          ))}
        </svg>

        {selectedInfo && (
          <div style={{ position: "absolute", left: 20, right: 20, bottom: 16, background: "rgba(6,9,20,0.95)", borderRadius: "18px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>{selectedInfo.label} — {selectedInfo.id}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>Zone {selectedInfo.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginTop: "14px" }}>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Risk Score</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: getZoneFill(selectedInfo.risk) }}>{selectedInfo.risk}%</div>
              </div>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Workers</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#00ff88" }}>{selectedInfo.workers}</div>
              </div>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Status</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: getZoneFill(selectedInfo.risk) }}>{getScoreLabel(selectedInfo.risk)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

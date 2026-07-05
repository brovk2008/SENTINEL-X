"use client";
import { SensorReading } from "@/lib/store";

interface Props {
  sensors: Record<string, SensorReading>;
}

// Zone definitions for SVG plant map — petrochemical refinery layout
const ZONES = [
  {
    code: "ZA",
    label: "Zone A\nTank Farm",
    path: "M40,60 L180,60 L180,200 L40,200 Z",
    cx: 110, cy: 130,
    sensors: ["H2S-ZA-01", "LEL-ZA-01", "LEVEL-V401", "PRESS-V401"],
  },
  {
    code: "ZB",
    label: "Zone B\nProcess Unit",
    path: "M200,40 L400,40 L400,240 L200,240 Z",
    cx: 300, cy: 140,
    sensors: ["H2S-ZB-01", "CO-ZB-01", "LEL-ZB-01", "TEMP-P203", "VIB-P203", "PRESS-L301", "FLOW-L301", "TEMP-HX501", "CURR-P203"],
  },
  {
    code: "ZC",
    label: "Zone C\nCompressor Bay",
    path: "M420,60 L580,60 L580,220 L420,220 Z",
    cx: 500, cy: 140,
    sensors: ["H2S-ZC-01", "H2S-ZC-02", "LEL-ZC-01", "VIB-C301", "VIB-C302", "TEMP-C301", "PRESS-C301", "HUM-ZC-01"],
  },
  {
    code: "ZD",
    label: "Zone D\nControl Room",
    path: "M220,260 L380,260 L380,340 L220,340 Z",
    cx: 300, cy: 300,
    sensors: [],
  },
  {
    code: "ZE",
    label: "Zone E\nFlare Stack",
    path: "M600,80 L680,80 L680,200 L600,200 Z",
    cx: 640, cy: 140,
    sensors: [],
  },
];

const EQUIPMENT = [
  { id: "V-401", label: "V-401", x: 80, y: 120, symbol: "tank" },
  { id: "P-203", label: "P-203", x: 265, y: 140, symbol: "pump" },
  { id: "HX-501", label: "HX-501", x: 340, y: 100, symbol: "hx" },
  { id: "C-301", label: "C-301", x: 460, y: 110, symbol: "comp" },
  { id: "C-302", label: "C-302", x: 530, y: 170, symbol: "comp" },
];

function getRiskColor(score: number): string {
  if (score >= 75) return "#ff2244";
  if (score >= 50) return "#ff8800";
  if (score >= 30) return "#ffcc00";
  return "#00e676";
}

function getZoneRisk(zone: typeof ZONES[0], sensors: Record<string, SensorReading>): number {
  const zoneSensors = zone.sensors.map((id) => sensors[id]).filter(Boolean);
  if (!zoneSensors.length) return 10;
  const criticals = zoneSensors.filter((s) => s.risk_level === "CRITICAL").length;
  const highs = zoneSensors.filter((s) => s.risk_level === "HIGH").length;
  const mediums = zoneSensors.filter((s) => s.risk_level === "MEDIUM").length;
  return Math.min(100, criticals * 40 + highs * 20 + mediums * 10 + 10);
}

export function PlantMap({ sensors }: Props) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox="0 0 740 380"
        style={{
          width: "100%",
          maxWidth: "700px",
          height: "auto",
          display: "block",
        }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="740" height="380" fill="url(#grid)" rx="8" />

        {/* Pipes / connections */}
        <g opacity="0.3" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none">
          <line x1="180" y1="130" x2="200" y2="130" strokeDasharray="4,4" />
          <line x1="400" y1="140" x2="420" y2="140" strokeDasharray="4,4" />
          <line x1="300" y1="240" x2="300" y2="260" strokeDasharray="4,4" />
        </g>

        {/* Zones */}
        {ZONES.map((zone) => {
          const riskScore = getZoneRisk(zone, sensors);
          const color = getRiskColor(riskScore);
          const opacity = 0.08 + (riskScore / 100) * 0.12;

          return (
            <g key={zone.code} className="zone-shape">
              <path
                d={zone.path}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeOpacity={riskScore > 50 ? 0.5 : 0.25}
                strokeWidth="1.5"
                rx="8"
              />
              {/* Zone label */}
              <text
                x={zone.cx}
                y={zone.cy - 12}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                letterSpacing="0.05em"
              >
                {zone.code}
              </text>
              <text
                x={zone.cx}
                y={zone.cy + 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="8.5"
                fontFamily="Inter, sans-serif"
              >
                {zone.label.split("\n")[1]}
              </text>
              {/* Risk score badge */}
              <rect x={zone.cx - 16} y={zone.cy + 14} width={32} height={14} rx={7} fill={color} fillOpacity={0.2} />
              <text
                x={zone.cx}
                y={zone.cy + 23}
                textAnchor="middle"
                fill={color}
                fontSize="8"
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
              >
                {riskScore.toFixed(0)}%
              </text>
              {/* Pulse ring for critical zones */}
              {riskScore >= 75 && (
                <circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r="8"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.6"
                  style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
              )}
            </g>
          );
        })}

        {/* Equipment markers */}
        {EQUIPMENT.map((eq) => (
          <g key={eq.id}>
            <circle cx={eq.x} cy={eq.y} r="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x={eq.x} y={eq.y + 4} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">
              {eq.symbol === "pump" ? "⟳" : eq.symbol === "tank" ? "▣" : eq.symbol === "comp" ? "◈" : "⬡"}
            </text>
            <text x={eq.x} y={eq.y + 20} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">
              {eq.label}
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(20, 350)">
          {[["#00e676", "Normal"], ["#ffcc00", "Moderate"], ["#ff8800", "High"], ["#ff2244", "Critical"]].map(([c, l], i) => (
            <g key={l} transform={`translate(${i * 90}, 0)`}>
              <rect x="0" y="0" width="12" height="8" rx="2" fill={c} fillOpacity="0.6" />
              <text x="16" y="8" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Inter, sans-serif">{l}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

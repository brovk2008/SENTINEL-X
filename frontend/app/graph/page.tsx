"use client";
import { useEffect, useRef, useState } from "react";
import { Network, Info, Layers, RefreshCcw } from "lucide-react";

interface Node { id: string; label: string; group: string; x?: number; y?: number }
interface Link { source: string; target: string; type: string }

const NODES: Node[] = [
  { id: "h2s", label: "H2S Hazard", group: "hazard" },
  { id: "oisd-105", label: "OISD-105 Standard", group: "regulation" },
  { id: "fact-36", label: "Factories Act Sec 36", group: "regulation" },
  { id: "confined", label: "Confined Space Entry", group: "procedure" },
  { id: "c-301", label: "Compressor C-301", group: "equipment" },
  { id: "ptw-0847", label: "PTW-2025-0847", group: "permit" },
  { id: "ramesh", label: "Ramesh Kumar (Worker)", group: "worker" },
  { id: "valve", label: "Valve V-12 Leakage", group: "event" },
];

const LINKS: Link[] = [
  { source: "h2s", target: "oisd-105", type: "governed_by" },
  { source: "confined", target: "fact-36", type: "regulated_by" },
  { source: "oisd-105", target: "confined", type: "specifies_limits_for" },
  { source: "c-301", target: "confined", type: "has_workscope_in" },
  { source: "ptw-0847", target: "confined", type: "permits" },
  { source: "ptw-0847", target: "ramesh", type: "assigned_to" },
  { source: "valve", target: "h2s", type: "released" },
  { source: "valve", target: "c-301", type: "occurred_on" },
];

const COLORS: Record<string, string> = {
  hazard: "var(--risk-critical)",
  regulation: "var(--accent-primary)",
  procedure: "var(--accent-cyan)",
  equipment: "var(--risk-medium)",
  permit: "var(--accent-purple)",
  worker: "var(--accent-teal)",
  event: "var(--risk-high)",
};

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Node | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 680;
    const h = 400;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Dynamic initial coordinates for clean visual layout
    const coords: Record<string, { x: number; y: number }> = {
      "h2s": { x: 340, y: 150 },
      "oisd-105": { x: 200, y: 100 },
      "fact-36": { x: 180, y: 220 },
      "confined": { x: 300, y: 240 },
      "c-301": { x: 480, y: 160 },
      "ptw-0847": { x: 440, y: 280 },
      "ramesh": { x: 550, y: 320 },
      "valve": { x: 450, y: 80 },
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw links
      LINKS.forEach((link) => {
        const s = coords[link.source];
        const t = coords[link.target];
        if (!s || !t) return;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw middle arrow link direction indicator
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fill();
      });

      // Draw nodes
      NODES.forEach((node) => {
        const pt = coords[node.id];
        if (!pt) return;
        const color = COLORS[node.group] || "white";
        const isSel = selected?.id === node.id;

        // Outer glow on select
        if (isSel) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
          ctx.fillStyle = color + "20";
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = isSel ? "white" : "rgba(255,255,255,0.6)";
        ctx.font = `600 ${isSel ? 10.5 : 9.5}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, pt.x, pt.y - 12);
      });
    };

    draw();

    // Hit test click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let found = false;
      NODES.forEach((node) => {
        const pt = coords[node.id];
        if (!pt) return;
        const dist = Math.hypot(pt.x - clickX, pt.y - clickY);
        if (dist <= 14) {
          setSelected(node);
          found = true;
        }
      });
      if (!found) setSelected(null);
    };

    canvas.addEventListener("mousedown", handleClick);
    return () => canvas.removeEventListener("mousedown", handleClick);
  }, [selected?.id]);

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Knowledge Graph</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Entity relationships between hazards, permits, regulations, and operational event sequences
          </p>
        </div>
        <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">
          <RefreshCcw size={13} /> Reset View
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
        {/* Canvas Graph visualization */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", justifyContent: "center", background: "#030307" }}>
          <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>

        {/* Legend / Detail card */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Graph Explorer</span>
          </div>

          {selected ? (
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                {selected.group.toUpperCase()}
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: COLORS[selected.group] || "var(--text-primary)", marginBottom: "8px" }}>
                {selected.label}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {selected.id === "h2s" && "Hydrogen Sulfide (H2S) is monitored continuously per OISD guidelines. Critical exposure threshold is 25ppm."}
                {selected.id === "oisd-105" && "Governs safety requirements in confined spaces including gas testing protocols."}
                {selected.id === "valve" && "Valve V-12 showed minor seal damage during startup inspection. Led to subsequent gas leaks."}
                {selected.id === "ramesh" && "Assigned confined space maintenance under permit PTW-2025-0847."}
                {selected.id === "ptw-0847" && "Confined space permit active for Compressor C-301 inspection."}
                {!["h2s", "oisd-105", "valve", "ramesh", "ptw-0847"].includes(selected.id) && "Connected to safety events and compliance constraints in current zone."}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Click on any node in the graph map to view detailed relations and attributes.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(COLORS).map(([group, color]) => (
                  <div key={group} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize" }}>{group}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

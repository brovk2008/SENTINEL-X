"use client";
import React, { useRef, useEffect, useState } from "react";
import { ShieldCheck, Siren, FileText, Users, Check, AlertTriangle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Camera {
  id: string;
  name: string;
  zone: string;
  status: "online" | "offline";
  workers_detected: number;
  ppe_compliance: number;
  hls_url?: string;
  hasAlert?: boolean;
  alertText?: string;
}

const DEMO_CAMERAS: Camera[] = [
  { id: "CAM-01", name: "Zone A — Tank Farm Entry",   zone: "ZA",   status: "online",  workers_detected: 4,  ppe_compliance: 100 },
  { id: "CAM-02", name: "Zone B — Processing Unit",   zone: "ZB",   status: "online",  workers_detected: 2,  ppe_compliance: 100 },
  { id: "CAM-03", name: "Zone C — Compressor Bay",    zone: "ZC",   status: "online",  workers_detected: 6,  ppe_compliance: 83,  hasAlert: true, alertText: "PPE Violation — 1 worker no helmet" },
  { id: "CAM-04", name: "Zone D — Control Room",      zone: "ZD",   status: "online",  workers_detected: 3,  ppe_compliance: 100 },
  { id: "CAM-05", name: "Zone A — Tank Farm Overview", zone: "ZA",  status: "online",  workers_detected: 1,  ppe_compliance: 100 },
  { id: "CAM-06", name: "Zone B — Compressor Area",   zone: "ZB",   status: "online",  workers_detected: 1,  ppe_compliance: 100 },
  { id: "CAM-07", name: "Main Gate — Entry",          zone: "GATE", status: "online",  workers_detected: 3,  ppe_compliance: 67,  hasAlert: true, alertText: "Unauthorized entry — no permit" },
  { id: "CAM-08", name: "Zone F — Flare Stack",       zone: "ZF",   status: "offline", workers_detected: 0,  ppe_compliance: 0 },
];

// ── Detection Canvas Overlay ───────────────────────────────────────────────────
function DetectionCanvas({ cam }: { cam: Camera }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cam.status === "offline") return;

    // Draw worker detection boxes
    const boxes = Array.from({ length: cam.workers_detected }, (_, i) => ({
      x: 40 + i * 80 + Math.random() * 30,
      y: 60 + (i % 2) * 90 + Math.random() * 20,
      w: 55,
      h: 90,
      ppe: i < Math.floor(cam.workers_detected * (cam.ppe_compliance / 100)),
    }));

    boxes.forEach(({ x, y, w, h, ppe }) => {
      const color = ppe ? "#00ff88" : "#ff3b3b";

      // Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeRect(x, y, w, h);

      // Corners (more futuristic look)
      ctx.lineWidth = 3;
      const cs = 10;
      [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy], qi) => {
        ctx.beginPath();
        ctx.moveTo(cx + (qi % 2 === 0 ? cs : -cs), cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + (qi < 2 ? cs : -cs));
        ctx.stroke();
      });

      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillRect(x, y - 18, ppe ? 60 : 72, 16);
      ctx.fillStyle = "#000";
      ctx.fillText(ppe ? "PPE ✓ OK" : "PPE ✗ VIOLATION", x + 4, y - 6);
    });

    // Zone boundary line
    if (cam.hasAlert) {
      ctx.strokeStyle = "rgba(255,59,59,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.setLineDash([]);
    }
  }, [cam]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={270}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}

// ── Camera Tile ────────────────────────────────────────────────────────────────
function CamTile({ cam, onOpen }: { cam: Camera; onOpen: (c: Camera) => void }) {
  const ppeColor =
    cam.ppe_compliance === 100 ? "var(--risk-safe)" :
    cam.ppe_compliance >= 80   ? "var(--risk-medium)" :
    "var(--risk-critical)";

  return (
    <div
      className={`cam-tile ${cam.hasAlert ? "alert-cam" : ""} ${cam.status === "offline" ? "offline-cam" : ""}`}
      onClick={() => cam.status === "online" && onOpen(cam)}
      role="button"
      tabIndex={0}
      aria-label={`Camera ${cam.id} — ${cam.name}`}
    >
      {/* Video placeholder — dark gradient background simulating camera feed */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: cam.status === "offline"
            ? "#050508"
            : `linear-gradient(${135 + parseInt(cam.id.slice(-2)) * 7}deg, #060612 0%, #0a0a18 50%, #070710 100%)`,
        }}
      />

      {/* Simulated camera noise/scanlines */}
      {cam.status === "online" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Detection overlay canvas */}
      {cam.status === "online" && <DetectionCanvas cam={cam} />}

      {/* Gradient overlay */}
      <div className="cam-overlay" style={{ zIndex: 4 }} />

      {/* Top-right badges */}
      <div style={{ position: "absolute", top: 8, left: 10, zIndex: 6, display: "flex", gap: 5 }}>
        {cam.status === "offline" ? (
          <span className="cam-badge" style={{ color: "var(--risk-offline)" }}>OFFLINE</span>
        ) : (
          <span
            className="cam-badge"
            style={{ background: "rgba(0,0,0,0.8)", color: "var(--risk-safe)", display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--risk-critical)",
                boxShadow: "0 0 6px var(--risk-critical)",
                animation: "live-pulse 2s infinite",
              }}
            />
            LIVE
          </span>
        )}
      </div>

      {/* PPE badge top-right */}
      {cam.status === "online" && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 6 }}>
          <span
            className="cam-badge"
            style={{ color: ppeColor, background: "rgba(0,0,0,0.8)", border: `1px solid ${ppeColor}40` }}
          >
            PPE {cam.ppe_compliance}%
          </span>
        </div>
      )}

      {/* Alert indicator */}
      {cam.hasAlert && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "2px solid rgba(255,59,59,0.5)",
            borderRadius: "inherit",
            animation: "risk-pulse 1.5s infinite",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Footer */}
      <div className="cam-footer" style={{ zIndex: 6 }}>
        <div>
          <div className="cam-id">{cam.id}</div>
          <div className="cam-info" style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cam.name}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
            {cam.status === "offline" ? "—" : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Users size={11} />
                <span>{cam.workers_detected}</span>
              </span>
            )}
          </div>
          {cam.hasAlert && (
            <div style={{ fontSize: 9, color: "var(--risk-critical)", fontWeight: 700, marginTop: 2 }}>
              ● ALERT
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Camera Modal ───────────────────────────────────────────────────────────────
function CamModal({ cam, onClose }: { cam: Camera; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    // Draw enhanced detections in modal canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxes = Array.from({ length: cam.workers_detected }, (_, i) => ({
      x: 50 + i * 100 + Math.random() * 30,
      y: 80 + (i % 2) * 100 + Math.random() * 20,
      w: 70, h: 120,
      ppe: i < Math.floor(cam.workers_detected * (cam.ppe_compliance / 100)),
      conf: (85 + Math.random() * 12).toFixed(0),
    }));

    boxes.forEach(({ x, y, w, h, ppe, conf }) => {
      const color = ppe ? "#00ff88" : "#ff3b3b";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      ctx.fillStyle = `${color}cc`;
      ctx.fillRect(x, y - 22, 100, 20);
      ctx.fillStyle = "#000";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`${ppe ? "PPE OK" : "PPE FAIL"} ${conf}%`, x + 4, y - 7);
    });

    // Timestamp overlay
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText(new Date().toLocaleTimeString(), 8, canvas.height - 8);
  }, [cam]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{cam.id} — {cam.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Zone {cam.zone} · {cam.workers_detected} workers detected · PPE {cam.ppe_compliance}%
            </div>
          </div>
          <button
            onClick={onClose}
            className="clay-btn"
            style={{ padding: "8px 12px" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Camera feed with overlay */}
        <div style={{ position: "relative", background: "#060610", margin: "16px 24px 0" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "linear-gradient(135deg, #08080e 0%, #0c0c1e 50%, #070710 100%)",
              borderRadius: "var(--r-md)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Scanlines */}
            <div
              style={{
                position: "absolute", inset: 0,
                backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px)",
              }}
            />

            {/* Detection canvas */}
            <canvas
              ref={canvasRef}
              width={752}
              height={423}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />

            {/* Live badge */}
            <div
              style={{
                position: "absolute", top: 12, left: 12,
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11, fontWeight: 700, color: "var(--risk-critical)",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--risk-critical)", animation: "live-pulse 2s infinite", display: "inline-block" }} />
              REC LIVE
            </div>

            {/* PPE overlay badge */}
            <div
              style={{
                position: "absolute", top: 12, right: 12,
                background: cam.ppe_compliance < 100 ? "rgba(255,59,59,0.8)" : "rgba(0,255,136,0.7)",
                borderRadius: 8, padding: "6px 12px",
                fontSize: 12, fontWeight: 800, color: "black",
              }}
            >
              PPE Compliance: {cam.ppe_compliance}%
            </div>

            {cam.hasAlert && (
              <div
                style={{
                  position: "absolute", bottom: 12, left: 12, right: 12,
                  background: "rgba(255,59,59,0.9)",
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 12, fontWeight: 700, color: "white",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                🚨 {cam.alertText}
              </div>
            )}
          </div>
        </div>

        {/* Alert timeline + actions */}
        <div style={{ padding: "16px 24px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 20 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Alert Timeline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { time: "08:47", msg: "Worker entered zone without permit verification", sev: "warn" },
                { time: "08:52", msg: "PPE non-compliance detected — missing helmet", sev: "crit" },
                { time: "08:55", msg: "AI safety agent flagged compound risk escalation", sev: "crit" },
              ].map(({ time, msg, sev }) => (
                <div
                  key={time}
                  style={{
                    display: "flex", gap: 10,
                    padding: "8px 10px",
                    background: sev === "crit" ? "rgba(255,59,59,0.06)" : "rgba(255,170,0,0.05)",
                    borderRadius: "var(--r-sm)",
                    borderLeft: `2px solid ${sev === "crit" ? "var(--risk-critical)" : "var(--risk-medium)"}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--text-mono)", flexShrink: 0 }}>{time}</div>
                  <div style={{ fontSize: 12 }}>{msg}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="clay-btn danger"
              onClick={() => { setAlertSent(true); }}
              style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Siren size={14} />
              <span>{alertSent ? "Alert Sent" : "Send Zone Alert"}</span>
            </button>
            <button className="clay-btn" style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} />
              <span>Run PPE Check</span>
            </button>
            <button className="clay-btn" style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>(DEMO_CAMERAS);
  const [selected, setSelected] = useState<Camera | null>(null);

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/cameras/`)
      .then((r) => r.json())
      .then((d) => { if (d.cameras) setCameras(d.cameras); })
      .catch(() => {});
  }, []);

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const alertCount  = cameras.filter((c) => c.hasAlert).length;

  return (
    <div style={{ padding: "0 20px 24px" }}>
      {/* Page header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Camera Command Center</div>
          <div className="page-subtitle">
            {onlineCount} cameras online · {alertCount > 0 && <span style={{ color: "var(--risk-critical)" }}>{alertCount} alerts active · </span>}
            Real-time PPE + zone monitoring
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,59,59,0.1)", borderRadius: 999, border: "1px solid rgba(255,59,59,0.2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--risk-critical)", animation: "live-pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--risk-critical)" }}>REC ●</span>
          </div>
          <button className="clay-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} />
            <span>PPE Check All</span>
          </button>
          <button className="clay-btn danger" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Siren size={14} />
            <span>Emergency Broadcast</span>
          </button>
        </div>
      </div>

      {/* Camera wall — 4×2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {cameras.map((cam) => (
          <CamTile key={cam.id} cam={cam} onOpen={setSelected} />
        ))}
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Total Cameras", val: cameras.length, color: "var(--text-primary)" },
          { label: "Online",        val: onlineCount,     color: "var(--risk-safe)" },
          { label: "Active Alerts", val: alertCount,      color: "var(--risk-critical)" },
          { label: "Workers Tracked", val: cameras.reduce((s, c) => s + c.workers_detected, 0), color: "var(--accent-blue)" },
          { label: "PPE Violations", val: cameras.filter((c) => c.ppe_compliance < 100 && c.status === "online").length, color: "var(--risk-medium)" },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="clay-card"
            style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Camera detail modal */}
      {selected && <CamModal cam={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

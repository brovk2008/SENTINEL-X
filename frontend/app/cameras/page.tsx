"use client";
import React, { useRef, useEffect, useState } from "react";
import { ShieldCheck, Siren, FileText, Users, AlertTriangle } from "lucide-react";
import { DemoCameraFeed } from "../../components/DemoCameraFeed";
import { DEMO_CAMERA_FEEDS } from "../../lib/demo-camera-feeds";
import { playIndustrialSiren, announceSafetyAlert } from "../../lib/audio-annunciator";

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



// ── Camera Tile ───────────────────────────────────────────────────────────────
function CamTile({ cam, onOpen }: { cam: Camera; onOpen: (c: Camera) => void }) {
  const numPart = cam.id.replace(/\D/g, "");
  const indexVal = numPart ? parseInt(numPart) : 0;
  const feedIndex = isNaN(indexVal) ? 0 : indexVal % DEMO_CAMERA_FEEDS.length;

  const feedConfig = DEMO_CAMERA_FEEDS.find((f) => f.camera_id === cam.id) || DEMO_CAMERA_FEEDS[feedIndex];
  const feed = {
    camera_id: cam.id,
    name: cam.name,
    zone: cam.zone,
    video_url: feedConfig?.video_url ?? null,
    fallback_color: feedConfig?.fallback_color ?? "#0d0d0d",
    workers: cam.workers_detected,
    ppe_pct: cam.ppe_compliance,
    has_alert: cam.hasAlert ?? false,
    offline: cam.status === 'offline',
  };

  return (
    <DemoCameraFeed
      feed={feed}
      onClick={() => cam.status === 'online' && onOpen(cam)}
    />
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
                <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {cam.alertText}
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
  const [cameras, setCameras] = useState<Camera[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sentinel_cctv_fleet");
      if (saved) return JSON.parse(saved);
    }
    return DEMO_CAMERAS;
  });
  const [selected, setSelected] = useState<Camera | null>(null);

  // Manage Panel
  const [showManager, setShowManager] = useState(false);
  const [newCamId, setNewCamId] = useState("");
  const [newCamName, setNewCamName] = useState("");
  const [newCamZone, setNewCamZone] = useState("ZA");
  const [newCamStatus, setNewCamStatus] = useState<"online" | "offline">("online");
  const [newCamWorkers, setNewCamWorkers] = useState(2);
  const [newCamPPE, setNewCamPPE] = useState(100);

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/cameras/`)
      .then((r) => r.json())
      .then((d) => {
        if (d.cameras && d.cameras.length > 0) {
          setCameras((prev) => {
            // Keep user created custom nodes, merge with backend list
            const apiCams = d.cameras as Camera[];
            const customCams = prev.filter((p) => !apiCams.some((a) => a.id === p.id) && p.id.startsWith("CAM-") && parseInt(p.id.split("-")[1]) > 8);
            const merged = [...apiCams, ...customCams];
            if (typeof window !== "undefined") {
              localStorage.setItem("sentinel_cctv_fleet", JSON.stringify(merged));
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleAddCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamId.trim() || !newCamName.trim()) return;

    const cam: Camera = {
      id: newCamId.trim().toUpperCase(),
      name: newCamName.trim(),
      zone: newCamZone,
      status: newCamStatus,
      workers_detected: newCamStatus === "online" ? newCamWorkers : 0,
      ppe_compliance: newCamStatus === "online" ? newCamPPE : 0,
      hasAlert: newCamStatus === "online" && newCamPPE < 100,
      alertText: newCamStatus === "online" && newCamPPE < 100 ? `PPE Violation — ${Math.round(newCamWorkers * (1 - newCamPPE/100))} workers missing safety gear` : undefined
    };

    const updated = [cam, ...cameras];
    setCameras(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinel_cctv_fleet", JSON.stringify(updated));
    }

    setNewCamId("");
    setNewCamName("");
  };

  const handleGenerate100 = () => {
    const fleet: Camera[] = [...cameras.filter(c => !c.id.startsWith("CAM-") || parseInt(c.id.split("-")[1]) <= 8)];
    const zones = ["ZA", "ZB", "ZC", "ZD", "ZE", "ZF"];
    for (let i = 9; i <= 108; i++) {
      const id = `CAM-${i.toString().padStart(2, "0")}`;
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const status = Math.random() > 0.08 ? "online" : "offline";
      const workers = status === "online" ? Math.floor(Math.random() * 8) : 0;
      const ppe = status === "online" ? (Math.random() > 0.88 ? (Math.random() > 0.5 ? 75 : 83) : 100) : 0;

      fleet.push({
        id,
        name: `Zone ${zone} — Telemetry Feed ${i}`,
        zone,
        status,
        workers_detected: workers,
        ppe_compliance: ppe,
        hasAlert: ppe > 0 && ppe < 100,
        alertText: ppe > 0 && ppe < 100 ? `PPE Compliance Alert: ${ppe}%` : undefined
      });
    }
    setCameras(fleet);
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinel_cctv_fleet", JSON.stringify(fleet));
    }
  };

  const handleClearFleet = () => {
    setCameras(DEMO_CAMERAS);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sentinel_cctv_fleet");
    }
  };

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const alertCount  = cameras.filter((c) => c.hasAlert).length;

  const [checkingPPE, setCheckingPPE] = useState(false);

  const handlePPECheckAll = () => {
    setCheckingPPE(true);
    setTimeout(() => {
      setCheckingPPE(false);
      announceSafetyAlert(`Automated P P E compliance scan complete. Total of ${cameras.length} nodes checked. Flagged violations in progress.`);
    }, 1200);
  };

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
          <button className="btn" onClick={() => setShowManager(!showManager)}>
            <span>Fleet Manager</span>
          </button>
          <button className="btn" onClick={handlePPECheckAll} disabled={checkingPPE} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} />
            <span>{checkingPPE ? "Scanning PPE..." : "PPE Check All"}</span>
          </button>
          <button
            className="btn danger"
            onClick={() => {
              playIndustrialSiren(4000);
              announceSafetyAlert("Attention. Emergency broadcast initiated. Standby for safety instruction from Unit 3 supervisor.");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Siren size={14} />
            <span>Emergency Broadcast</span>
          </button>
        </div>
      </div>

      {/* Fleet Manager Control Panel */}
      {showManager && (
        <div className="clay-card" style={{ padding: 20, marginBottom: 20, border: "1px solid var(--border-bright)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>CCTV Fleet Node Manager</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={handleGenerate100} style={{ padding: "4px 10px", fontSize: 11, background: "rgba(0, 229, 255, 0.12)", color: "#00e5ff" }}>
                ⚡ Generate 100 Camera Fleet
              </button>
              <button className="btn danger" onClick={handleClearFleet} style={{ padding: "4px 10px", fontSize: 11 }}>
                🧹 Reset CCTV Fleet
              </button>
            </div>
          </div>

          <form onSubmit={handleAddCamera} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Camera ID</label>
              <input type="text" placeholder="CAM-09" value={newCamId} onChange={(e) => setNewCamId(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 90 }} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Camera Name / Location</label>
              <input type="text" placeholder="Zone C — Pump P-102 Intake" value={newCamName} onChange={(e) => setNewCamName(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Zone</label>
              <select value={newCamZone} onChange={(e) => setNewCamZone(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, background: "var(--bg-panel)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none" }}>
                <option value="ZA">Zone A</option>
                <option value="ZB">Zone B</option>
                <option value="ZC">Zone C</option>
                <option value="ZD">Zone D</option>
                <option value="ZE">Zone E</option>
                <option value="ZF">Zone F</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Status</label>
              <select value={newCamStatus} onChange={(e) => setNewCamStatus(e.target.value as any)} style={{ padding: "6px 10px", borderRadius: 6, background: "var(--bg-panel)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none" }}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Workers</label>
              <input type="number" min={0} max={15} value={newCamWorkers} onChange={(e) => setNewCamWorkers(parseInt(e.target.value) || 0)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>PPE %</label>
              <input type="number" min={0} max={100} value={newCamPPE} onChange={(e) => setNewCamPPE(parseInt(e.target.value) || 0)} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-mid)", color: "#fff", fontSize: 12, outline: "none", width: 60 }} />
            </div>
            <button type="submit" className="btn" style={{ padding: "7px 14px", fontSize: 12, background: "var(--accent-blue)" }}>
              + Add Camera
            </button>
          </form>
        </div>
      )}

      {/* Camera wall — responsive auto-fit grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
          { label: "Workers Tracked", val: cameras.reduce((s, c) => s + (c.status === "online" ? c.workers_detected : 0), 0), color: "var(--accent-blue)" },
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

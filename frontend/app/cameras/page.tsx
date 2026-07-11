"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Camera, Check, RefreshCcw, ShieldAlert, X } from "lucide-react";

interface CameraItem {
  id: string;
  name: string;
  zone: string;
  type: string;
  workers_detected: number;
  ppe_compliant: number;
  restricted_zone_violations: number;
  status: string;
}

interface Detection {
  id: string;
  bbox: number[];
  confidence: number;
  ppe_compliant: boolean;
  in_restricted_zone: boolean;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [selected, setSelected] = useState<CameraItem | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCameras = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cameras/`);
      const d = await res.json();
      setCameras(d.cameras || []);
      setSelected((current) => current ?? d.cameras?.[2] ?? d.cameras?.[0] ?? null);
    } catch {}
    setLoading(false);
  }, []);

  const loadDetections = async (camId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cameras/${camId}/detections`);
      const d = await res.json();
      setDetections(d.detections || []);
    } catch {}
  };

  useEffect(() => {
    loadCameras();
    const t = setInterval(loadCameras, 5000);
    return () => clearInterval(t);
  }, [loadCameras]);

  useEffect(() => {
    if (selected) {
      loadDetections(selected.id);
      const t = setInterval(() => loadDetections(selected.id), 2000);
      return () => clearInterval(t);
    }
  }, [selected]);

  if (loading && cameras.length === 0) return <div style={{ padding: 24 }}><div className="skeleton" style={{ height: 200 }} /></div>;

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>CCTV Smart Vision</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            AI PPE compliance checks and restricted zone monitoring
          </p>
        </div>
        <button onClick={loadCameras} className="btn btn-ghost btn-sm">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px" }}>
        {/* Camera List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {cameras.map((cam) => {
            const hasViolation = cam.restricted_zone_violations > 0;
            const nonCompliant = cam.workers_detected - cam.ppe_compliant;

            return (
              <div
                key={cam.id}
                className={`glass-card ${hasViolation ? "critical" : nonCompliant > 0 ? "medium" : "low"}`}
                style={{
                  padding: "14px",
                  cursor: "pointer",
                  border: selected?.id === cam.id ? `1px solid var(--accent-primary)` : undefined,
                }}
                onClick={() => setSelected(cam)}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Camera size={18} color={hasViolation ? "var(--risk-critical)" : "var(--text-secondary)"} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "3px" }}>
                      {cam.name}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Zone {cam.zone}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>• {cam.workers_detected} workers</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      {hasViolation && (
                        <span style={{ fontSize: "9px", background: "var(--risk-critical-bg)", color: "var(--risk-critical)", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                          <ShieldAlert size={10} /> ZONE INTRUSION
                        </span>
                      )}
                      {nonCompliant > 0 && (
                        <span style={{ fontSize: "9px", background: "var(--risk-medium-bg)", color: "var(--risk-medium)", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                          <AlertTriangle size={10} /> PPE MISSING ({nonCompliant})
                        </span>
                      )}
                      {!hasViolation && nonCompliant === 0 && (
                        <span style={{ fontSize: "9px", background: "var(--risk-low-bg)", color: "var(--risk-low)", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                          <Check size={10} /> SECURE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Video feed viewport */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="glass-card" style={{ padding: "16px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Camera size={14} color="var(--accent-primary)" />
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>{selected.name} — Live Feed</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div className="live-dot" />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Streaming</span>
                </div>
              </div>

              {/* Synthetic Camera Canvas Viewport */}
              <div style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%", // 16:9 Aspect Ratio
                background: "#030307",
                borderRadius: "10px",
                border: "1px solid var(--glass-border)",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  flexDirection: "column",
                  gap: "10px",
                }}>
                  {/* Outer Frame bounding box drawings on Canvas container */}
                  <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(255,255,255,0.05)" }} />

                  {/* Draw bounding boxes */}
                  {detections.map((det) => (
                    <div
                      key={det.id}
                      style={{
                        position: "absolute",
                        left: `${(det.bbox[0] / 500) * 100}%`,
                        top: `${(det.bbox[1] / 400) * 100}%`,
                        width: `${(det.bbox[2] / 500) * 100}%`,
                        height: `${(det.bbox[3] / 400) * 100}%`,
                        border: `2px solid ${det.in_restricted_zone ? "var(--risk-critical)" : det.ppe_compliant ? "var(--risk-low)" : "var(--risk-high)"}`,
                        boxShadow: `0 0 8px ${det.in_restricted_zone ? "var(--risk-critical-glow)" : det.ppe_compliant ? "var(--risk-low-glow)" : "var(--risk-high-glow)"}`,
                        transition: "all 0.5s ease",
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "-2px",
                        background: det.in_restricted_zone ? "var(--risk-critical)" : det.ppe_compliant ? "var(--risk-low)" : "var(--risk-high)",
                        color: "black",
                        fontSize: "9px",
                        fontWeight: "700",
                        padding: "1px 5px",
                        whiteSpace: "nowrap",
                        borderRadius: "2px 2px 0 0",
                      }}>
                        {det.in_restricted_zone ? "INTRUDER" : det.ppe_compliant ? "Worker (PPE)" : "Worker (NO PPE)"}
                      </div>
                    </div>
                  ))}

                  {/* Camera overlay watermark */}
                  <div style={{ position: "absolute", left: "12px", bottom: "12px", color: "white", fontSize: "11px", fontWeight: "bold", opacity: 0.7, fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: "4px" }}>
                    CAM-{selected.id.toUpperCase()} | ZONE-{selected.zone} | {new Date().toLocaleTimeString()}
                  </div>

                  <Camera size={40} style={{ opacity: 0.15 }} />
                  <span style={{ fontSize: "12px", opacity: 0.4 }}>Live vision analysis engine active</span>
                </div>
              </div>
            </div>

            {/* Bounding box list */}
            <div className="glass-card" style={{ padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px" }}>
                AI Vision Detection List
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {detections.map((det) => (
                  <div key={det.id} style={{
                    padding: "10px",
                    background: "var(--glass-xs)",
                    border: `1px solid ${det.in_restricted_zone ? "rgba(255,34,68,0.2)" : det.ppe_compliant ? "rgba(0,230,118,0.15)" : "rgba(255,136,0,0.2)"}`,
                    borderRadius: "8px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>{det.id}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{Math.round(det.confidence * 100)}% conf</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                        <span style={{ color: det.ppe_compliant ? "var(--risk-low)" : "var(--risk-high)" }}>
                          {det.ppe_compliant ? <Check size={12} /> : <X size={12} />}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>PPE Compliance</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                        <span style={{ color: det.in_restricted_zone ? "var(--risk-critical)" : "var(--risk-low)" }}>
                          {det.in_restricted_zone ? <ShieldAlert size={12} /> : <Check size={12} />}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>Restricted Zone</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.4 }}>
            <Camera size={48} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Select a camera stream to view live feed</div>
          </div>
        )}
      </div>
    </div>
  );
}

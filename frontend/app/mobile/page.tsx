"use client";
import { useState, useEffect } from "react";
import { useStore } from "../../lib/store";
import { Smartphone, QrCode, Bell, User, MapPin } from "lucide-react";

export default function MobilePage() {
  const { alerts, sensors } = useStore();
  const [paired, setPaired] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const zcAlerts = alerts.filter((a) => a.zone === "ZC" || !a.zone).slice(0, 4);

  const testPush = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/send-test`, { method: "POST" });
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "600px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Connection flow / pairing card */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Smartphone size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>Mobile App Pairing</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Pair SafetyOS with your phone to receive real-time evacuation notifications, safety permit updates, and gas hazard alerts.
          </p>

          {!paired ? (
            <>
              <button onClick={() => setShowQR(!showQR)} className="btn btn-primary" style={{ width: "100%" }}>
                <QrCode size={14} /> {showQR ? "Hide Pairing Code" : "Show Pairing QR Code"}
              </button>
              {showQR && (
                <div style={{
                  padding: "16px",
                  background: "white",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "160px",
                  height: "160px",
                  margin: "10px auto 0",
                  border: "4px solid var(--accent-primary)",
                  boxShadow: "0 0 20px var(--accent-primary-glow)",
                }}>
                  {/* Generated simulated QR code using CSS/SVG */}
                  <svg width="128" height="128" viewBox="0 0 29 29">
                    <path d="M0 0h7v7H0zm0 22h7v7H0zm22 0h7v7h-7zM22 0h7v7h-7zM3 3h1v1H3zm0 2h1v1H3zm0-4h1v1H3zm22 2h1v1h-1zm0 2h1v1h-1zm0-4h1v1h-1zM3 25h1v1H3zm0 2h1v1H3zm0-4h1v1H3zm22 2h1v1h-1zm0 2h1v1h-1zm0-4h1v1h-1z" fill="black" />
                    <rect x="9" y="0" width="11" height="7" fill="black" />
                    <rect x="0" y="9" width="7" height="11" fill="black" />
                    <rect x="9" y="9" width="11" height="11" fill="black" />
                    <rect x="22" y="9" width="7" height="11" fill="black" />
                    <rect x="9" y="22" width="11" height="7" fill="black" />
                  </svg>
                </div>
              )}
              <button onClick={() => setPaired(true)} className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
                Simulate Pair Success
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{
                padding: "10px 12px",
                background: "rgba(0,230,118,0.06)",
                border: "1px solid rgba(0,230,118,0.2)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--risk-low)",
                fontWeight: "600",
                textAlign: "center",
              }}>
                ✓ Phone paired successfully
              </div>
              <button onClick={testPush} className="btn btn-primary" style={{ width: "100%" }}>
                <Bell size={14} /> Send Test Push Alert
              </button>
              <button onClick={() => setPaired(false)} className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
                Unpair Phone
              </button>
            </div>
          )}
        </div>

        {/* Worker Phone Screen mock */}
        <div style={{
          width: "280px",
          height: "560px",
          background: "#08080f",
          border: "8px solid #222",
          borderRadius: "36px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Phone speaker / notch */}
          <div style={{
            position: "absolute",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100px",
            height: "18px",
            background: "#222",
            borderRadius: "0 0 10px 10px",
            zIndex: 99,
          }} />

          {/* Status bar */}
          <div style={{ height: "24px", background: "#0a0a14", display: "flex", justifyContent: "space-between", padding: "0 16px", alignItems: "center", fontSize: "9px", color: "#aaa" }}>
            <span>9:41 AM</span>
            <span style={{ display: "flex", gap: "4px" }}>📶 🛜 🔋</span>
          </div>

          {/* App Header */}
          <div style={{ padding: "14px 12px", borderBottom: "1px solid #1a1a2e", background: "#0c0c1b", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: paired ? "var(--risk-low)" : "var(--risk-critical)" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#eee" }}>SafetyOS Companion</span>
          </div>

          {/* Phone content screen */}
          <div style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* User profile */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#121225", padding: "8px", borderRadius: "8px", border: "1px solid #222" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4a80ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                <User size={12} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#eee" }}>Ramesh Kumar</div>
                <div style={{ fontSize: "8px", color: "#888" }}>Technician | Zone C</div>
              </div>
            </div>

            {/* Current safety status */}
            {zcAlerts.some((a) => a.severity === "CRITICAL") ? (
              <div style={{ background: "rgba(255,34,68,0.12)", border: "1px solid var(--risk-critical)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "900", color: "var(--risk-critical)" }}>🚨 EVACUATE NOW</div>
                <div style={{ fontSize: "9px", color: "#ccc", marginTop: "3px" }}>Zone C H2S levels exceed 25ppm. Move to assembly point.</div>
              </div>
            ) : (
              <div style={{ background: "rgba(0,230,118,0.1)", border: "1px solid var(--risk-low)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--risk-low)" }}>✓ WORK ZONE SECURE</div>
                <div style={{ fontSize: "8px", color: "#aaa", marginTop: "2px" }}>Zone C safety metrics inside limits.</div>
              </div>
            )}

            {/* Live zone gas value */}
            <div style={{ background: "#121225", padding: "10px", borderRadius: "8px", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "8px", color: "#aaa" }}>H2S WORKPLACE LEVEL</span>
                <span style={{ fontSize: "8px", color: "#888" }}>Zone C</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  fontFamily: "var(--font-mono)",
                  color: sensors["H2S-ZC-01"]?.risk_level === "CRITICAL" ? "var(--risk-critical)" : "var(--risk-low)",
                }}>
                  {sensors["H2S-ZC-01"]?.value?.toFixed(1) || "3.2"}
                </span>
                <span style={{ fontSize: "10px", color: "#aaa" }}>ppm</span>
              </div>
            </div>

            {/* Notifications list */}
            <div>
              <div style={{ fontSize: "9px", color: "#888", fontWeight: "700", marginBottom: "6px" }}>SAFETY ALERTS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {zcAlerts.map((alert) => (
                  <div key={alert.id} style={{
                    padding: "8px",
                    background: "#16162a",
                    borderLeft: `3px solid ${alert.severity === "CRITICAL" ? "var(--risk-critical)" : "var(--risk-high)"}`,
                    borderRadius: "4px",
                  }}>
                    <div style={{ fontSize: "9px", fontWeight: "700", color: "#eee", marginBottom: "2px" }}>{alert.title}</div>
                    <div style={{ fontSize: "8px", color: "#aaa", lineHeight: 1.3 }}>{alert.description?.slice(0, 50)}...</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import { Siren, CheckCircle, Smartphone, ShieldAlert, X } from "lucide-react";

interface AlertDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioTitle?: string;
}

export function AlertDispatcherModal({ isOpen, onClose, scenarioTitle = "H2S Gas Buildup — Zone C" }: AlertDispatcherModalProps) {
  if (!isOpen) return null;

  const dispatchTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const notifications = [
    {
      role: "Plant Manager",
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      channel: "WhatsApp & SMS",
      status: "DELIVERED ✓✓",
      msg: `🚨 [CRITICAL ALERT — SENTINEL X]\nFacility: Unit 3 — Zone C Compressor Bay\nIncident: ${scenarioTitle}\nPlant Risk: 84% (CRITICAL)\nAction: Controlled evacuation initiated. Work permit PTW-2025-0847 suspended.\nRef: OISD-STD-105 Clause 4.3`,
      avatarColor: "#cc2222",
    },
    {
      role: "Fire Safety Officer",
      name: "Capt. S. Varma",
      phone: "+91 98123 67890",
      channel: "Emergency PA & Pager",
      status: "DISPATCHED ✓",
      msg: `⚡ [EMERGENCY RESPONSE UNIT DISPATCH]\nLocation: Compressor Bay ZC\nTask: Deploy 2-person SCBA standby rescue unit & acutate main exhaust draft.\nStatus: Responders en route (ETA 2 min).`,
      avatarColor: "#cc6600",
    },
    {
      role: "District Safety Inspector",
      name: "OISD Regulatory Inspectorate",
      phone: "OISD-GOV-API",
      channel: "Govt Gateway Push",
      status: "LOGGED ✓",
      msg: `📜 [OISD REGULATORY AUDIT EVENT]\nEvent ID: INC-2026-ZC09\nAutomated statutory report logged under Factories Act 1948 Section 36A. Compliance matrix updated: 85.7%.`,
      avatarColor: "#1a5fa0",
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 640, background: "var(--bg-panel)", border: "1px solid var(--border-bright)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottom: "1px solid var(--border-dim)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, background: "var(--alarm-critical-bg)", borderRadius: 6, color: "var(--alarm-critical)" }}>
              <Siren size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Emergency Dispatch & WhatsApp Alerts</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                SENTINEL X DISPATCH ENGINE · {dispatchTime} IST
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 8px" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Live Status Header */}
        <div
          style={{
            padding: "10px 14px",
            background: "var(--alarm-critical-bg)",
            border: "1px solid var(--alarm-critical)",
            borderRadius: 6,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--alarm-critical)" }}>
              3 Emergency Alerts Dispatched via Twilio & WhatsApp
            </span>
          </div>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--alarm-critical)", fontWeight: 700 }}>
            LATENCY: 420ms
          </span>
        </div>

        {/* Dispatch Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.map((n, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-mid)",
                borderRadius: 6,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${n.avatarColor}20`,
                      color: n.avatarColor,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <Smartphone size={14} />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{n.name}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>({n.role})</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{n.channel}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--alarm-normal)", fontFamily: "var(--font-mono)" }}>
                    {n.status}
                  </span>
                </div>
              </div>

              {/* Message Box */}
              <div
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-dim)",
                  borderRadius: 4,
                  padding: "8px 12px",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}
              >
                {n.msg}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle size={13} color="var(--alarm-normal)" />
            Verified delivery via WhatsApp Business API & Twilio SMS Gateway
          </div>
          <button onClick={onClose} className="btn primary">
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}

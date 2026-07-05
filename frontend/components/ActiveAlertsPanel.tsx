"use client";
import { useStore } from "@/lib/store";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

export function ActiveAlertsPanel() {
  const { alerts, markAlertRead } = useStore();
  const active = alerts.slice(0, 8);

  const severityIcon = (s: string) => {
    if (s === "CRITICAL") return "🚨";
    if (s === "HIGH") return "⚠️";
    if (s === "MEDIUM") return "🔔";
    return "ℹ️";
  };

  return (
    <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={14} color="var(--risk-high)" />
          <span style={{ fontSize: "13px", fontWeight: "700" }}>Active Alerts</span>
        </div>
        {active.length > 0 && (
          <span style={{
            fontSize: "10px",
            fontWeight: "700",
            background: "var(--risk-critical-bg)",
            color: "var(--risk-critical)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}>
            {active.filter((a) => !a.read).length} UNREAD
          </span>
        )}
      </div>

      {active.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", opacity: 0.5 }}>
          <CheckCircle size={28} color="var(--risk-low)" />
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No active alerts</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {active.map((alert) => (
            <div
              key={alert.id}
              onClick={() => markAlertRead(alert.id)}
              style={{
                padding: "10px 12px",
                background: alert.read ? "var(--glass-xs)" : `${alert.severity === "CRITICAL" ? "rgba(255,34,68,0.06)" : "rgba(255,136,0,0.05)"}`,
                border: `1px solid ${alert.severity === "CRITICAL" ? "rgba(255,34,68,0.2)" : alert.severity === "HIGH" ? "rgba(255,136,0,0.2)" : "var(--glass-border)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s",
                opacity: alert.read ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{severityIcon(alert.severity)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "3px" }}>
                    {alert.title}
                  </div>
                  {alert.description && (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                      {alert.description.slice(0, 80)}...
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                    <Clock size={10} color="var(--text-muted)" />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    {alert.zone && (
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>• {alert.zone}</span>
                    )}
                    {!alert.read && (
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        background: "var(--accent-primary)",
                        color: "white",
                        padding: "0 4px",
                        borderRadius: "3px",
                      }}>NEW</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

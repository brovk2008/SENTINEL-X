"use client";
import { useStore } from "@/lib/store";
import { ExplainableAlert } from "@/components/ExplainableAlert";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function ActiveAlertsPanel() {
  const { alerts, markAlertRead } = useStore();
  const active = alerts.slice(0, 8);
  const unreadCount = active.filter((a) => !a.read).length;

  return (
    <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={14} color="var(--risk-high)" />
          <span style={{ fontSize: "13px", fontWeight: "700" }}>Active Alerts</span>
        </div>
        {unreadCount > 0 && (
          <span style={{
            fontSize: "10px",
            fontWeight: "700",
            background: "var(--risk-critical-bg)",
            color: "var(--risk-critical)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}>
            {unreadCount} UNREAD
          </span>
        )}
      </div>

      {active.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", opacity: 0.5 }}>
          <CheckCircle size={28} color="var(--risk-low)" />
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No active alerts</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {active.map((alert) => (
            <ExplainableAlert
              key={alert.id}
              alert={alert}
              onAcknowledge={() => markAlertRead(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

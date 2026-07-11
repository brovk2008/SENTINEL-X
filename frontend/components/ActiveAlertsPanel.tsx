"use client";
import { useStore } from "../lib/store";
import { ExplainableAlert } from "@/components/ExplainableAlert";
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2 } from "lucide-react";

export function ActiveAlertsPanel() {
  const { alerts, markAlertRead } = useStore();
  const active = alerts.slice(0, 8);
  const unreadCount = active.filter((a) => !a.read).length;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", maxHeight: "560px" }}>
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} color="var(--danger)" />
          <span className="card-title">Active Alerts</span>
        </div>
        {unreadCount > 0 && <span className="badge badge--critical">{unreadCount} Unread</span>}
      </div>

      {active.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
          padding: 40, minHeight: 280,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "var(--radius-full)",
            background: "var(--success-subtle)", display: "grid", placeItems: "center",
          }}>
            <CheckCircle2 size={22} color="var(--success)" />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            No active alerts — all systems nominal
          </p>
        </div>
      ) : (
        <div style={{
          overflowY: "auto", flex: 1, padding: 12,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
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

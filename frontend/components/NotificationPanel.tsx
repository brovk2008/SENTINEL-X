"use client";
import { useMemo, useState } from "react";
import { X, CircleCheck as CheckCircle2, Eye, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";

const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const severityColor: Record<string, string> = {
  CRITICAL: "var(--danger)",
  HIGH: "var(--warning)",
  MEDIUM: "var(--warning)",
  LOW: "var(--success)",
};

export function NotificationPanel() {
  const [activeTab, setActiveTab] = useState("All");
  const {
    notifications,
    unreadCount,
    notificationPanelOpen,
    setNotificationPanelOpen,
    markNotificationRead,
    dismissNotification,
    markAllNotificationsRead,
  } = useStore();

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "Critical") return n.severity === "CRITICAL";
      if (activeTab === "Unread") return !n.read;
      return true;
    });
  }, [activeTab, notifications]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, typeof notifications>>((groups, n) => {
      const key = n.severity || "LOW";
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
      return groups;
    }, {});
  }, [filtered]);

  if (!notificationPanelOpen) return null;

  return (
    <>
      <div
        onClick={() => setNotificationPanelOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
      />
      <aside
        style={{
          position: "fixed", top: 0, right: 0, width: 380, height: "100vh",
          background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)", zIndex: 201,
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Notifications</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {filtered.length} items · {unreadCount} unread
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationPanelOpen(false)}
            className="topbar-icon-btn"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 20px 0" }}>
          {["All", "Critical", "Unread"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${activeTab === tab ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1 }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{
          padding: "12px 20px", display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <button type="button" onClick={markAllNotificationsRead} className="btn btn-ghost btn-sm">
            <CheckCircle2 size={13} /> Mark all read
          </button>
          <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            By severity
          </span>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 20px", display: "grid", gap: 16, alignContent: "start" }}>
          {severityOrder.map((severity) => {
            const items = grouped[severity] || [];
            if (!items.length) return null;

            return (
              <div key={severity}>
                <div style={{
                  fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase",
                  letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700,
                }}>
                  {severity}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className="card"
                      style={{ padding: 12, borderLeft: `3px solid ${severityColor[severity]}` }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                            {n.title}
                          </div>
                          {n.description && (
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                              {n.description}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                            {n.zone && (
                              <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: "var(--radius-full)" }}>
                                {n.zone}
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotificationPanelOpen(false);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissNotification(n.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ marginLeft: "auto" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{
              textAlign: "center", padding: 40,
              color: "var(--text-muted)", fontSize: 12,
            }}>
              No notifications in this view.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

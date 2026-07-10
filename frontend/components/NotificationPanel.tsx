"use client";
import { useMemo, useState } from "react";
import { X, CheckCircle2, Eye, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";

const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeTab === "Critical") return notification.severity === "CRITICAL";
      if (activeTab === "Unread") return !notification.read;
      return true;
    });
  }, [activeTab, notifications]);

  const grouped = useMemo(() => {
    return filteredNotifications.reduce<Record<string, typeof notifications>>((groups, notification) => {
      const key = notification.severity || "LOW";
      if (!groups[key]) groups[key] = [];
      groups[key].push(notification);
      return groups;
    }, {});
  }, [filteredNotifications]);

  return (
    <>
      {notificationPanelOpen && (
        <div>
          <div
            onClick={() => setNotificationPanelOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9998 }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "360px",
              height: "100vh",
              background: "rgba(8,8,16,0.98)",
              boxShadow: "-16px 0 40px rgba(0,0,0,0.35)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Notifications</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                  {filteredNotifications.length} items • {unreadCount} unread
                </div>
              </div>
              <button type="button" onClick={() => setNotificationPanelOpen(false)} style={{ border: "none", background: "transparent", color: "white", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
              {['All', 'Critical', 'Unread'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: activeTab === tab ? "rgba(0,255,136,0.12)" : "transparent",
                    color: activeTab === tab ? "#00ff88" : "rgba(255,255,255,0.75)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="btn btn-ghost btn-sm"
                style={{ width: "auto" }}
              >
                <CheckCircle2 size={14} /> Mark all read
              </button>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Severity grouped
              </span>
            </div>

            <div style={{ overflowY: "auto", flex: 1, display: "grid", gap: "14px", paddingRight: "4px" }}>
              {severityOrder.map((severity) => {
                const items = grouped[severity] || [];
                if (!items.length) return null;

                return (
                  <div key={severity}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>
                      {severity}
                    </div>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {items.map((notification) => (
                        <div
                          key={notification.id}
                          style={{
                            borderRadius: "16px",
                            background: notification.read ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                            border: `1px solid ${notification.read ? "rgba(255,255,255,0.08)" : "rgba(0,255,136,0.18)"}`,
                            padding: "14px",
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <div style={{ width: "4px", height: "44px", borderRadius: "999px", background: severity === "CRITICAL" ? "#ff3b3b" : severity === "HIGH" ? "#ff6600" : severity === "MEDIUM" ? "#ffaa00" : "#00ff88" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{notification.title}</div>
                                {notification.zone && (
                                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "999px" }}>
                                    {notification.zone}
                                  </span>
                                )}
                              </div>
                              {notification.description && (
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginTop: "4px" }}>
                                  {notification.description}
                                </div>
                              )}
                              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>
                                  {notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString() : "Just now"}
                                </span>
                                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>
                                  {notification.severity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => markNotificationRead(notification.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ minWidth: "82px" }}
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                markNotificationRead(notification.id);
                                setNotificationPanelOpen(false);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ minWidth: "82px" }}
                            >
                              Acknowledge
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissNotification(notification.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ minWidth: "82px" }}
                            >
                              <Trash2 size={14} /> Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredNotifications.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", textAlign: "center", marginTop: "30px" }}>
                  No notifications in this view.
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

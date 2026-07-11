"use client";
import { useMemo, useState } from "react";
import { X, CheckCircle2, Eye, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";

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
          <div onClick={() => setNotificationPanelOpen(false)} className="notification-backdrop" />
          <aside className="notification-panel">
            <div className="notification-header">
              <div>
                <div className="notification-title">Notifications</div>
                <div className="notification-sub">{filteredNotifications.length} items • {unreadCount} unread</div>
              </div>
              <button type="button" onClick={() => setNotificationPanelOpen(false)} className="notification-close">
                <X size={18} />
              </button>
            </div>

            <div className="notification-tabs">
              {['All', 'Critical', 'Unread'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`notification-tab ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="notification-actions-row">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="btn btn-ghost btn-sm"
              >
                <CheckCircle2 size={14} /> Mark all read
              </button>
              <span className="notification-group-label">Severity grouped</span>
            </div>

            <div className="notification-list">              {severityOrder.map((severity) => {
                const items = grouped[severity] || [];
                if (!items.length) return null;

                return (
                  <div key={severity}>
                    <div className="notification-severity-label">{severity}</div>
                          <div className="notification-items">
                            {items.map((notification) => (
                              <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                                <div className="notification-item-body">
                                  <div className="notification-severity-bar" style={{ background: severity === "CRITICAL" ? "#ff3b3b" : severity === "HIGH" ? "#ff6600" : severity === "MEDIUM" ? "#ffaa00" : "#00ff88" }} />
                                  <div className="notification-item-main">
                                    <div className="notification-item-head">
                                      <div className="notification-item-title">{notification.title}</div>
                                      {notification.zone && <span className="notification-zone">{notification.zone}</span>}
                                    </div>
                                    {notification.description && <div className="notification-item-desc">{notification.description}</div>}
                                    <div className="notification-item-meta">
                                      <span className="notification-item-time">{notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString() : "Just now"}</span>
                                      <span className="notification-item-severity">{notification.severity}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="notification-item-actions">
                                  <button type="button" onClick={() => markNotificationRead(notification.id)} className="btn btn-ghost btn-sm notification-action"> <Eye size={14} /> View</button>
                                  <button type="button" onClick={() => { markNotificationRead(notification.id); setNotificationPanelOpen(false); }} className="btn btn-primary btn-sm notification-action">Acknowledge</button>
                                  <button type="button" onClick={() => dismissNotification(notification.id)} className="btn btn-ghost btn-sm notification-action"> <Trash2 size={14} /> Dismiss</button>
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

"use client";
import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";

export function NotificationToast() {
  const { notifications } = useStore();
  const [visible, setVisible] = useState<typeof notifications[0] | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setVisible(latest);
      const timer = setTimeout(() => setVisible(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications[0]?.timestamp]);

  if (!visible) return null;

  const colors = {
    CRITICAL: { bg: "rgba(255,34,68,0.12)", border: "rgba(255,34,68,0.4)", text: "var(--risk-critical)" },
    HIGH: { bg: "rgba(255,136,0,0.1)", border: "rgba(255,136,0,0.3)", text: "var(--risk-high)" },
    MEDIUM: { bg: "rgba(255,204,0,0.08)", border: "rgba(255,204,0,0.25)", text: "var(--risk-medium)" },
    LOW: { bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.2)", text: "var(--risk-low)" },
  };

  const c = colors[visible.severity] || colors.MEDIUM;

  return (
    <div
      className="animate-slide-in"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "360px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        backdropFilter: "blur(20px)",
        cursor: "pointer",
      }}
      onClick={() => setVisible(null)}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "18px" }}>
          {visible.severity === "CRITICAL" ? "🚨" : visible.severity === "HIGH" ? "⚠️" : "ℹ️"}
        </span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: c.text, marginBottom: "3px" }}>
            {visible.title}
          </div>
          {visible.description && (
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {visible.description.slice(0, 120)}
            </div>
          )}
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "6px" }}>
            Click to dismiss
          </div>
        </div>
      </div>
    </div>
  );
}

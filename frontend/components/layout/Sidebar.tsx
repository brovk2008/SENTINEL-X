"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "../../lib/store";
import {
  LayoutDashboard, Brain, Activity, Camera, BookOpen, Clock,
  FileText, Shield, Network, TrendingUp, Smartphone, BarChart3,
  Settings, ChevronLeft, ChevronRight, Sparkles,
  Zap, Handshake, Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Mission Control", color: "#4a80ff" },
  { href: "/agents", icon: Brain, label: "AI Debate Room", color: "#aa55ff", badge: "LIVE" },
  { href: "/simulator", icon: Sparkles, label: "Scenario Simulator", color: "#ffcc00" },
  { href: "/sensors", icon: Activity, label: "Sensor Monitor", color: "#00e676" },
  { href: "/cameras", icon: Camera, label: "CCTV Feeds", color: "#00d4ff" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge RAG", color: "#ffaa00" },
  { href: "/incidents", icon: Clock, label: "Timeline Replay", color: "#ff8800" },
  { href: "/permits", icon: FileText, label: "Permit Intelligence", color: "#44ffaa" },
  { href: "/compliance", icon: Shield, label: "Compliance", color: "#00c8a0" },
  { href: "/handover", icon: Handshake, label: "Shift Handover", color: "#4a80ff" },
  { href: "/graph", icon: Network, label: "Knowledge Graph", color: "#cc88ff" },
  { href: "/executive", icon: TrendingUp, label: "Executive Copilot", color: "#ffcc00" },
  { href: "/mobile", icon: Smartphone, label: "Worker View", color: "#4a80ff" },
  { href: "/reports", icon: BarChart3, label: "Reports", color: "#00e676" },
  { href: "/settings", icon: Settings, label: "Settings", color: "#9090b0" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { wsConnected, plantRiskScore, unreadCount, emergencyActive, setNotificationPanelOpen, notificationUnreadCount } = useStore();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid var(--glass-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        minHeight: "60px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #4a80ff, #aa55ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 20px rgba(74,128,255,0.3)",
          }}>
            <Zap size={16} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                SafetyOS
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "500", letterSpacing: "0.06em" }}>
                AI INDUSTRIAL SAFETY
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setNotificationPanelOpen(true)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <Bell size={18} />
          {notificationUnreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#ff3b3b",
              color: "white",
              fontSize: "10px",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
            }}>
              {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
            </span>
          )}
        </button>
      )}
      </div>

      {/* Plant Risk Score */}
      {!collapsed && (
        <div style={{
          margin: "12px",
          padding: "10px 12px",
          background: emergencyActive ? "rgba(255,34,68,0.1)" : plantRiskScore > 60 ? "rgba(255,136,0,0.08)" : "var(--glass-xs)",
          border: `1px solid ${emergencyActive ? "rgba(255,34,68,0.3)" : plantRiskScore > 60 ? "rgba(255,136,0,0.2)" : "var(--glass-border)"}`,
          borderRadius: "10px",
          transition: "all 0.3s",
        }}>
          {emergencyActive ? (
            <div style={{ color: "var(--risk-critical)", fontSize: "11px", fontWeight: "700", textAlign: "center", letterSpacing: "0.04em" }}>
              🚨 EMERGENCY ACTIVE
            </div>
          ) : (
            <>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "4px" }}>
                PLANT RISK SCORE
              </div>
              <div style={{
                fontSize: "22px",
                fontWeight: "800",
                color: plantRiskScore > 75 ? "var(--risk-critical)" : plantRiskScore > 50 ? "var(--risk-high)" : plantRiskScore > 30 ? "var(--risk-medium)" : "var(--risk-low)",
                fontFamily: "var(--font-mono)",
                lineHeight: 1,
              }}>
                {plantRiskScore.toFixed(0)}
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>/100</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: collapsed ? "10px" : "8px 10px",
                borderRadius: "8px",
                marginBottom: "2px",
                background: active ? `${item.color}15` : "transparent",
                border: `1px solid ${active ? `${item.color}30` : "transparent"}`,
                color: active ? item.color : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "var(--glass-sm)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ fontSize: "13px", fontWeight: active ? "600" : "500", flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        color: "var(--risk-low)",
                        background: "var(--risk-low-bg)",
                        border: "1px solid rgba(0,230,118,0.2)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        letterSpacing: "0.04em",
                      }}>{item.badge}</span>
                    )}
                    {item.href === "/" && unreadCount > 0 && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "white",
                        background: "var(--risk-critical)",
                        padding: "1px 5px",
                        borderRadius: "10px",
                        minWidth: "18px",
                        textAlign: "center",
                      }}>{unreadCount}</span>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--glass-border)" }}>
        {/* Connection status */}
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "6px 8px" }}>
            <div className={`live-dot ${wsConnected ? "" : "red"}`} />
            <span style={{ fontSize: "11px", color: wsConnected ? "var(--risk-low)" : "var(--risk-critical)" }}>
              {wsConnected ? "Live Feed Active" : "Reconnecting..."}
            </span>
          </div>
        )}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "7px",
            background: "var(--glass-xs)",
            border: "1px solid var(--glass-border)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

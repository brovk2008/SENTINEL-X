"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, TriangleAlert as AlertTriangle, ChartBar as BarChart3, Bell, BookOpen, Brain, Camera, ChevronLeft, ChevronRight, Clock, FileText, Handshake, LayoutDashboard, Network, Settings, Shield, Smartphone, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useStore } from "../../lib/store";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Mission Control" },
      { href: "/sensors", icon: Activity, label: "Sensor Monitor" },
      { href: "/cameras", icon: Camera, label: "CCTV Feeds" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/agents", icon: Brain, label: "AI Debate Room", badge: "LIVE" },
      { href: "/simulator", icon: Sparkles, label: "Scenario Simulator" },
      { href: "/knowledge", icon: BookOpen, label: "Knowledge RAG" },
      { href: "/graph", icon: Network, label: "Knowledge Graph" },
      { href: "/executive", icon: TrendingUp, label: "Executive Copilot" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/incidents", icon: Clock, label: "Timeline Replay" },
      { href: "/permits", icon: FileText, label: "Permit Intelligence" },
      { href: "/compliance", icon: Shield, label: "Compliance" },
      { href: "/handover", icon: Handshake, label: "Shift Handover" },
      { href: "/mobile", icon: Smartphone, label: "Worker View" },
      { href: "/reports", icon: BarChart3, label: "Reports" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const {
    wsConnected,
    plantRiskScore,
    unreadCount,
    emergencyActive,
    setNotificationPanelOpen,
    notificationUnreadCount,
  } = useStore();

  const riskTone =
    emergencyActive || plantRiskScore > 75
      ? "critical"
      : plantRiskScore > 50
      ? "high"
      : "low";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Zap size={16} />
        </div>
        {!collapsed && (
          <div className="brand-copy">
            <strong>SafetyOS</strong>
            <span>AI Industrial Safety</span>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            className="topbar-icon-btn"
            style={{ marginLeft: "auto", height: 28, width: 28 }}
            onClick={() => setNotificationPanelOpen(true)}
            aria-label="Open notifications"
            title="Open notifications"
          >
            <Bell size={14} />
            {notificationUnreadCount > 0 && (
              <span className="badge-dot">
                {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {!collapsed && (
        <section className={`sidebar-risk sidebar-risk--${riskTone}`}>
          <div className="sidebar-risk__label">
            {emergencyActive ? (
              <>
                <AlertTriangle size={13} />
                Emergency Active
              </>
            ) : (
              "Plant Risk Score"
            )}
          </div>
          {!emergencyActive && (
            <div className="sidebar-risk__value">
              {plantRiskScore.toFixed(0)}
              <span> / 100</span>
            </div>
          )}
        </section>
      )}

      <nav className="sidebar-nav" aria-label="Application">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: collapsed ? 4 : 10 }}>
            {!collapsed && (
              <div
                style={{
                  padding: "4px 10px",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {group.label}
              </div>
            )}
            <ul className="nav-list">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href} className={`nav-item ${active ? "active" : ""}`}>
                    <Link href={item.href} title={collapsed ? item.label : undefined}>
                      <span className="nav-icon">
                        <Icon size={17} />
                      </span>
                      {!collapsed && <span className="nav-label">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                      {!collapsed &&
                        item.href === "/" &&
                        unreadCount > 0 &&
                        !item.badge && <span className="nav-count">{unreadCount}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="feed-status">
            <span className={`live-dot ${wsConnected ? "" : "red"}`} />
            <span>{wsConnected ? "Live feed active" : "Reconnecting"}</span>
          </div>
        )}
        <button
          type="button"
          className="collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

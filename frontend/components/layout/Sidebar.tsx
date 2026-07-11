"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Handshake,
  LayoutDashboard,
  Network,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useStore } from "../../lib/store";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Mission Control", from: "#56ccf2", to: "#2f80ed" },
  { href: "/agents", icon: Brain, label: "AI Debate Room", from: "#a955ff", to: "#ea51ff", badge: "LIVE" },
  { href: "/simulator", icon: Sparkles, label: "Scenario Simulator", from: "#ff9966", to: "#ff5e62" },
  { href: "/sensors", icon: Activity, label: "Sensor Monitor", from: "#80ff72", to: "#7ee8fa" },
  { href: "/cameras", icon: Camera, label: "CCTV Feeds", from: "#43e97b", to: "#38f9d7" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge RAG", from: "#f6d365", to: "#fda085" },
  { href: "/incidents", icon: Clock, label: "Timeline Replay", from: "#f093fb", to: "#f5576c" },
  { href: "/permits", icon: FileText, label: "Permit Intelligence", from: "#4facfe", to: "#00f2fe" },
  { href: "/compliance", icon: Shield, label: "Compliance", from: "#00c6ff", to: "#0072ff" },
  { href: "/handover", icon: Handshake, label: "Shift Handover", from: "#667eea", to: "#764ba2" },
  { href: "/graph", icon: Network, label: "Knowledge Graph", from: "#c471f5", to: "#fa71cd" },
  { href: "/executive", icon: TrendingUp, label: "Executive Copilot", from: "#fddb92", to: "#d1fdff" },
  { href: "/mobile", icon: Smartphone, label: "Worker View", from: "#89f7fe", to: "#66a6ff" },
  { href: "/reports", icon: BarChart3, label: "Reports", from: "#84fab0", to: "#8fd3f4" },
  { href: "/settings", icon: Settings, label: "Settings", from: "#cfd9df", to: "#e2ebf0" },
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

  const riskTone = emergencyActive || plantRiskScore > 75 ? "critical" : plantRiskScore > 50 ? "high" : "low";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Zap size={18} />
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
            className="sidebar-bell"
            onClick={() => setNotificationPanelOpen(true)}
            aria-label="Open notifications"
            title="Open notifications"
          >
            <Bell size={18} />
            {notificationUnreadCount > 0 && <span>{notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}</span>}
          </button>
        )}
      </div>

      {!collapsed && (
        <section className={`sidebar-risk sidebar-risk--${riskTone}`}>
          <div className="sidebar-risk__label">
            {emergencyActive ? (
              <>
                <AlertTriangle size={14} />
                Emergency Active
              </>
            ) : (
              "Plant Risk Score"
            )}
          </div>
          {!emergencyActive && (
            <div className="sidebar-risk__value">
              {plantRiskScore.toFixed(0)}
              <span>/100</span>
            </div>
          )}
        </section>
      )}

      <nav className="sidebar-nav" aria-label="Application">
        <ul className="clay-nav-list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li
                key={item.href}
                className={`clay-nav-item ${active ? "active" : ""}`}
                style={{ "--i": item.from, "--j": item.to } as CSSProperties}
              >
                    <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="clay-nav-icon">
                      <Icon size={17} />
                    </span>
                    {!collapsed && (
                      <span className="clay-nav-title truncate" title={item.label}>
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge && <span className="clay-nav-badge">{item.badge}</span>}
                    {!collapsed && item.href === "/" && unreadCount > 0 && <span className="clay-nav-count">{unreadCount}</span>}
                  </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="feed-status">
            <span className={`live-dot ${wsConnected ? "" : "red"}`} />
            <span>{wsConnected ? "Live Feed Active" : "Reconnecting"}</span>
          </div>
        )}
        <button
          type="button"
          className="collapse-button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

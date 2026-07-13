"use client";
import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "../../lib/store";

import {
  Factory,
  Bot,
  Radio,
  Camera,
  FileText,
  HeartPulse,
  Wind,
  Users,
  Scale,
  FlaskConical,
  BarChart3,
  RefreshCw,
  Brain,
  Globe,
  Network,
  Settings,
  Bell,
} from "lucide-react";

const NAV = [
  { href: "/",           label: "Mission",    Icon: Factory },
  { href: "/debate",     label: "AI Debate",  Icon: Bot },
  { href: "/sensors",    label: "Sensors",    Icon: Radio },
  { href: "/cameras",    label: "CCTV",       Icon: Camera },
  { href: "/permits",    label: "Permits",    Icon: FileText },
  { href: "/biometrics", label: "Biometrics", Icon: HeartPulse },
  { href: "/dispersion", label: "Plume",      Icon: Wind },
  { href: "/workers",    label: "Workers",    Icon: Users },
  { href: "/compliance", label: "Compliance", Icon: Scale },
  { href: "/simulator",  label: "Simulator",  Icon: FlaskConical },
  { href: "/executive",  label: "Executive",  Icon: BarChart3 },
  { href: "/handover",   label: "Handover",   Icon: RefreshCw },
  { href: "/knowledge",  label: "Knowledge",  Icon: Brain },
  { href: "/sites",      label: "Sites",      Icon: Globe },
  { href: "/connect",    label: "Connect",    Icon: Network },
  { href: "/settings",   label: "Settings",   Icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  const plantRisk = useStore((s) => s.plantRisk);
  const alerts = useStore((s) => s.alerts);
  const markAlertRead = useStore((s) => s.markAlertRead);
  const unread = alerts.filter((a) => !a.read).length;
  const [alertOpen, setAlertOpen] = useState(false);

  const riskSeverity =
    plantRisk >= 80 ? "critical" :
    plantRisk >= 60 ? "high" :
    plantRisk >= 40 ? "warning" :
    "normal";

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
      {/* ── Top bar ── */}
      <div className="topnav">
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="topnav-brand" style={{ cursor: "pointer" }}>
            <img
              src="/logo.png"
              alt="Sentinel X Logo"
              style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>Sentinel X</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: -2 }}>
                Bharat Petrochemicals · Unit 3
              </div>
            </div>
          </div>
        </Link>

        {/* Center — Risk Score Indicator */}
        <div className="center">
          <div className={`risk-indicator ${riskSeverity}`}>
            <div className="live-dot" />
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Plant Risk</span>
            <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {plantRisk}%
            </span>
            <span className={`badge ${riskSeverity}`}>
              {riskSeverity.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right — UNS Chip + Alert bell */}
        <div className="right">
          <div style={{ padding: "4px 8px", background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: "var(--r-sm)", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" }}>UNS LIVE</span>
          </div>

          {/* Alert bell */}
          <div style={{ position: "relative" }}>
            <button
              className="btn"
              onClick={() => setAlertOpen(!alertOpen)}
              style={{
                padding: "5px 10px",
                position: "relative",
                cursor: "pointer",
              }}
              aria-label="Alerts"
            >
              <Bell size={14} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "var(--alarm-critical)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 800,
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--bg-panel)",
                  }}
                >
                  {unread}
                </span>
              )}
            </button>

            {/* Alert dropdown */}
            {alertOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 340,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 200,
                  overflow: "hidden",
                  animation: "float-up 0.15s ease",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-dim)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Plant Alarm Feed</div>
                  <button
                    onClick={() => setAlertOpen(false)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                      No active alarms
                    </div>
                  ) : (
                    alerts.slice(0, 12).map((a) => (
                      <div
                        key={a.id}
                        onClick={() => markAlertRead(a.id)}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border-dim)",
                          opacity: a.read ? 0.5 : 1,
                          cursor: "pointer",
                          transition: "background 0.12s",
                          background: a.read ? "transparent" : "var(--alarm-critical-bg)",
                          borderLeft: a.severity === "CRITICAL" ? "3px solid var(--alarm-critical)" : "3px solid var(--alarm-warning)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span className={`badge ${a.severity.toLowerCase()}`} style={{ fontSize: 9 }}>
                            {a.severity}
                          </span>
                          <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {new Date(a.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{a.title}</div>
                        {a.zone && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Zone {a.zone}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pill nav ── */}
      <nav className="pill-nav" aria-label="Primary navigation">
        {NAV.map((n) => {
          const IconComp = n.Icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={pathname === n.href ? "active" : ""}
            >
              <IconComp size={13} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

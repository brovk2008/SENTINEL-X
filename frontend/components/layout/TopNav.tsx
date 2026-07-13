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

  const riskColor =
    plantRisk >= 80 ? "var(--risk-critical)" :
    plantRisk >= 60 ? "var(--risk-high)" :
    plantRisk >= 40 ? "var(--risk-medium)" :
    "var(--risk-safe)";

  return (
    <header>
      {/* ── Top bar ── */}
      <div className="topnav">
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand" style={{ cursor: "pointer" }}>
            <img
              src="/logo.png"
              alt="Sentinel X Logo"
              style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 8 }}
            />
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Sentinel X</h1>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: -2 }}>
                Bharat Petrochemicals · Unit 3
              </div>
            </div>
          </div>
        </Link>

        {/* Center — Risk Score */}
        <div className="center">
          <div
            className="clay-card"
            style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: 12 }}
          >
            <div className="live-dot" />
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Plant Risk</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: riskColor,
                fontVariantNumeric: "tabular-nums",
                transition: "color 0.5s",
              }}
            >
              {plantRisk}%
            </div>
            <div
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                background: plantRisk >= 80 ? "rgba(255,59,59,0.15)" : "rgba(255,170,0,0.12)",
                color: riskColor,
                fontWeight: 700,
              }}
            >
              {plantRisk >= 80 ? "CRITICAL" : plantRisk >= 60 ? "HIGH" : plantRisk >= 40 ? "MEDIUM" : "SAFE"}
            </div>
          </div>
        </div>

        {/* Right — quick chips + alerts */}
        <div className="right">
          <div className="clay-card" style={{ padding: "7px 12px", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
            <span className="live-dot" />
            <span>UNS Active</span>
          </div>

          {/* Alert bell */}
          <div style={{ position: "relative" }}>
            <button
              className="clay-button"
              onClick={() => setAlertOpen(!alertOpen)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--r-md)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                position: "relative",
                cursor: "pointer",
              }}
              aria-label="Alerts"
            >
              <Bell size={15} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "var(--risk-critical)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 800,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--canvas)",
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
                  background: "var(--canvas-2)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
                  zIndex: 200,
                  overflow: "hidden",
                  animation: "float-up 0.2s var(--ease-spring)",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Alerts</div>
                  <button
                    onClick={() => setAlertOpen(false)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      No active alerts
                    </div>
                  ) : (
                    alerts.slice(0, 12).map((a) => (
                      <div
                        key={a.id}
                        onClick={() => markAlertRead(a.id)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          opacity: a.read ? 0.5 : 1,
                          cursor: "pointer",
                          transition: "opacity 0.2s, background 0.15s",
                          background: a.read ? "transparent" : "rgba(255,59,59,0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              a.severity === "CRITICAL" ? "var(--risk-critical)" :
                              a.severity === "HIGH"     ? "var(--risk-high)" :
                              a.severity === "MEDIUM"   ? "var(--risk-medium)" :
                              "var(--text-secondary)",
                            fontWeight: 700,
                            marginBottom: 2,
                          }}
                        >
                          {a.severity}
                        </div>
                        <div style={{ fontSize: 13 }}>{a.title}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                          {a.zone && <span style={{ marginRight: 6 }}>Zone {a.zone}</span>}
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </div>
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
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconComp size={14} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

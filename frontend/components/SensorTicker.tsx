"use client";
import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";

const STATUS_COLOR: Record<string, string> = {
  crit:   "crit",
  warn:   "warn",
  normal: "normal",
  ok:     "ok",
  offline:"normal",
};

export function SensorTicker() {
  const sensors = useStore((s) => s.sensors);
  const alerts = useStore((s) => s.alerts);

  // Build display items — use store sensors if populated, fallback to static demo
  const storeItems = Object.values(sensors);
  const items = storeItems.length > 0 ? storeItems : [];

  // Double for seamless loop
  const track = items.length > 0 ? [...items, ...items] : [];

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="clay-card sensor-ticker" style={{ padding: 0, overflow: "hidden" }}>
      <div className="ticker-header" style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="live-dot" />
          <div style={{ fontWeight: 700, fontSize: 13 }}>Live Sensors</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            className="risk-badge"
            style={{
              fontSize: 10,
              background: "rgba(255,170,0,0.12)",
              color: "var(--risk-medium)",
              border: "1px solid rgba(255,170,0,0.2)",
            }}
          >
            {items.filter((s) => s.status === "warn").length} WARN
          </div>
          <div className="risk-badge critical" style={{ fontSize: 10 }}>
            {items.filter((s) => s.status === "crit").length} CRIT
          </div>
        </div>
      </div>

      <div className="ticker-scroll-wrap" style={{ padding: "0 0 14px" }}>
        {track.length === 0 ? (
          <div style={{ padding: "8px 16px", color: "var(--text-muted)", fontSize: 12 }}>
            Loading sensors...
          </div>
        ) : (
          <div className="ticker-track" style={{ paddingLeft: 16 }}>
            {track.map((it: any, idx: number) => (
              <div
                key={`${it.id}-${idx}`}
                className="ticker-item"
                data-tooltip={`${it.name} — Zone ${it.zone || "?"}${it.threshold ? ` | Warn: ${it.threshold.warn} | Crit: ${it.threshold.crit}` : ""}`}
              >
                <div className="ticker-label">{it.name}</div>
                <div className={`ticker-value ${STATUS_COLOR[it.status || "normal"] || "normal"}`}>
                  {it.value || "—"}
                </div>
                {it.zone && (
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>
                    {it.trend === "up" ? "↑" : it.trend === "down" ? "↓" : "→"} Zone {it.zone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

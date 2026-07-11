"use client";
import React from "react";
import { GlassCard } from "./ui/GlassCard";
import { useStore } from "../lib/store";

export function QuickStats() {
  const sensors = useStore((s) => s.sensors);
  const alerts = useStore((s) => s.alerts);
  const stats = [
    { id: "ops", label: "Active Ops", value: Object.keys(sensors).length ? Object.keys(sensors).length.toString() : '—' },
    { id: "alerts", label: "Active Alerts", value: alerts.length.toString() },
    { id: "sensors", label: "Sensors Online", value: Object.keys(sensors).length ? Object.keys(sensors).length.toString() : '—' },
  ];

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <GlassCard key={s.id} className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

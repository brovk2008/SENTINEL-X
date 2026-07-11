"use client";
import React from "react";
import { GlassCard } from "./ui/GlassCard";

export function QuickStats() {
  const stats = [
    { id: "ops", label: "Active Ops", value: "12" },
    { id: "alerts", label: "Active Alerts", value: "3" },
    { id: "sensors", label: "Sensors Online", value: "248" },
  ];

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <GlassCard key={s.id} className="stat-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>—</div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

"use client";
import React from "react";
import { useStore } from "@/lib/store";

export function AlertsPanel() {
  const alerts = useStore((s) => s.alerts);

  return (
    <div className="glass-card">
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Alerts</h3>
      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {alerts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No active alerts</div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.timestamp).toLocaleTimeString()}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: a.severity === 'CRITICAL' ? '#ff2244' : a.severity === 'HIGH' ? '#ff8800' : 'var(--text-muted)' }}>{a.severity}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
